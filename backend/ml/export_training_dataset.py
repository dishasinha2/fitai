import csv
import json
import os
import sqlite3
from collections import defaultdict
from datetime import datetime, timedelta, UTC
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DB_PATH = Path(os.environ.get("SQLITE_PATH", ROOT / "fitai.sqlite"))
DATA_DIR = ROOT / "ml" / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
JSONL_PATH = DATA_DIR / "training_dataset.jsonl"
CSV_PATH = DATA_DIR / "training_dataset.csv"


def parse_json(value, fallback):
    if not value:
        return fallback
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return fallback


def iso_to_datetime(value):
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except Exception:
        return datetime.min


def build_dataset():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    cursor = connection.cursor()

    users = {row["id"]: row for row in cursor.execute("SELECT * FROM users").fetchall()}
    progress_logs = defaultdict(list)
    for row in cursor.execute("SELECT * FROM progress_logs ORDER BY date ASC").fetchall():
        progress_logs[row["user_id"]].append(row)

    rewards = defaultdict(list)
    for row in cursor.execute("SELECT * FROM rewards ORDER BY awarded_at ASC").fetchall():
        rewards[row["user_id"]].append(row)

    adherence_rows = defaultdict(list)
    for row in cursor.execute("SELECT * FROM diet_adherence ORDER BY completed_at ASC").fetchall():
        adherence_rows[row["user_id"]].append(row)

    recommendation_feedback = defaultdict(list)
    for row in cursor.execute("SELECT * FROM recommendation_feedback ORDER BY created_at ASC").fetchall():
        recommendation_feedback[row["user_id"]].append(row)

    exercise_catalog = {row["name"]: row for row in cursor.execute("SELECT * FROM exercises").fetchall()}
    user_workouts = defaultdict(list)
    for row in cursor.execute("SELECT * FROM workouts ORDER BY date ASC").fetchall():
        user_workouts[row["user_id"]].append(row)

    dataset = []

    for user_id, workouts in user_workouts.items():
        user = users.get(user_id)
        if not user:
            continue

        preferences = parse_json(user["preferences_json"], {})
        reward_points_total = sum(int(reward["points"] or 0) for reward in rewards[user_id])

        for index, workout in enumerate(workouts):
            workout_dt = iso_to_datetime(workout["date"])
            workout_exercises = parse_json(workout["exercises_json"], [])
            previous_workouts = workouts[:index]
            previous_7d = [
                item for item in previous_workouts if iso_to_datetime(item["date"]) >= workout_dt - timedelta(days=7)
            ]
            previous_30d = [
                item for item in previous_workouts if iso_to_datetime(item["date"]) >= workout_dt - timedelta(days=30)
            ]

            recent_exercise_frequency = defaultdict(int)
            recent_muscle_frequency = defaultdict(int)
            for previous in previous_30d:
                for previous_exercise in parse_json(previous["exercises_json"], []):
                    exercise_name = previous_exercise.get("name", "")
                    recent_exercise_frequency[exercise_name] += 1
                    catalog_match = exercise_catalog.get(exercise_name)
                    muscle_group = previous_exercise.get("muscleGroup") or (
                        catalog_match["muscle_group"] if catalog_match else "unknown"
                    )
                    recent_muscle_frequency[muscle_group] += 1

            recent_progress = [row for row in progress_logs[user_id] if iso_to_datetime(row["date"]) <= workout_dt]
            latest_progress = recent_progress[-1] if recent_progress else None
            recent_adherence = [
                row for row in adherence_rows[user_id] if iso_to_datetime(row["completed_at"]) >= workout_dt - timedelta(days=7)
            ]
            recent_feedback = [
                row for row in recommendation_feedback[user_id] if iso_to_datetime(row["created_at"]) >= workout_dt - timedelta(days=30)
            ]

            volume_signal = int(workout["total_sets"] or 0) * max(1, int(workout["total_reps"] or 0))
            completion_signal = min(100, int(workout["estimated_calories"] or 0) // 4 + int(workout["total_duration"] or 0))
            consistency_signal = int(latest_progress["consistency_score"] or 0) if latest_progress else 0
            adherence_signal = len(recent_adherence)
            success_score = round(
                (volume_signal * 0.02)
                + (completion_signal * 0.45)
                + (consistency_signal * 0.35)
                + (min(adherence_signal, 7) * 2),
                2,
            )

            for exercise in workout_exercises:
                exercise_name = exercise.get("name", "")
                catalog_match = exercise_catalog.get(exercise_name)
                muscle_group = exercise.get("muscleGroup") or (catalog_match["muscle_group"] if catalog_match else "unknown")
                category = exercise.get("category") or (catalog_match["category"] if catalog_match else "unknown")
                equipment = exercise.get("equipment") or (catalog_match["equipment"] if catalog_match else "unknown")
                exercise_location = exercise.get("location") or (catalog_match["location"] if catalog_match else "unknown")
                intensity = exercise.get("intensity") or (catalog_match["intensity"] if catalog_match else "unknown")
                matching_feedback = [
                    row for row in recent_feedback if row["exercise_name"] == exercise_name
                ]
                feedback_signal = (
                    sum(int(row["feedback_value"] or 0) for row in matching_feedback) / max(1, len(matching_feedback))
                    if matching_feedback
                    else 0
                )

                dataset.append(
                    {
                        "user_id": user_id,
                        "workout_id": workout["id"],
                        "date": workout["date"],
                        "day_key": workout["day_key"],
                        "fitness_goal": user["fitness_goal"] or "maintenance",
                        "activity_level": user["activity_level"] or "beginner",
                        "preferred_location": user["location"] or "gym",
                        "workout_days_per_week": preferences.get("workoutDaysPerWeek", 3),
                        "session_duration_target": preferences.get("sessionDuration", 45),
                        "dietary_preference": preferences.get("dietaryPreference", "balanced"),
                        "exercise_name": exercise_name,
                        "exercise_category": category,
                        "exercise_muscle_group": muscle_group,
                        "exercise_equipment": equipment,
                        "exercise_location": exercise_location,
                        "exercise_intensity": intensity,
                        "sets": int(exercise.get("sets", 0) or 0),
                        "reps": int(exercise.get("reps", 0) or 0),
                        "duration": int(exercise.get("duration", 0) or 0),
                        "weight": float(exercise.get("weight", 0) or 0),
                        "recent_workouts_7d": len(previous_7d),
                        "recent_exercise_frequency_30d": recent_exercise_frequency[exercise_name],
                        "recent_muscle_group_frequency_30d": recent_muscle_frequency[muscle_group],
                        "recent_feedback_score_30d": round(feedback_signal, 2),
                        "reward_points_total": reward_points_total,
                        "progress_consistency_score": consistency_signal,
                        "diet_adherence_events_7d": adherence_signal,
                        "workout_total_duration": int(workout["total_duration"] or 0),
                        "workout_total_sets": int(workout["total_sets"] or 0),
                        "workout_total_reps": int(workout["total_reps"] or 0),
                        "workout_estimated_calories": int(workout["estimated_calories"] or 0),
                        "success_score": success_score,
                        "label_completed_workout": 1,
                    }
                )

    connection.close()
    return dataset


def write_dataset(dataset):
    if not dataset:
        JSONL_PATH.write_text("", encoding="utf-8")
        CSV_PATH.write_text("", encoding="utf-8")
        return

    fieldnames = list(dataset[0].keys())
    with JSONL_PATH.open("w", encoding="utf-8") as jsonl_file:
        for row in dataset:
            jsonl_file.write(json.dumps(row) + "\n")

    with CSV_PATH.open("w", newline="", encoding="utf-8") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(dataset)


if __name__ == "__main__":
    dataset = build_dataset()
    write_dataset(dataset)
    print(json.dumps({
        "rows": len(dataset),
        "jsonl": str(JSONL_PATH),
        "csv": str(CSV_PATH),
        "generated_at": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
    }))
