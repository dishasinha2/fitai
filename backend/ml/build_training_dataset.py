import csv
import json
import os
import sqlite3
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DB_PATH = Path(os.environ.get("SQLITE_PATH", ROOT / "fitai.sqlite"))
DATASETS_DIR = ROOT / "ml" / "datasets"
ARTIFACTS_DIR = ROOT / "ml" / "artifacts"
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
RAW_DATASET_PATH = DATASETS_DIR / "gym-exercise-dataset.csv"
TRAINING_DATASET_PATH = ARTIFACTS_DIR / "training_dataset.csv"

TIME_OF_DAY_BUCKETS = ["morning", "afternoon", "evening"]
DAY_BUCKETS = ["monday", "wednesday", "friday", "saturday"]


def normalize_text(value, fallback="unknown"):
    cleaned = str(value or "").strip().lower()
    return cleaned if cleaned else fallback


def parse_json(value, fallback):
    if not value:
        return fallback

    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return fallback


def workout_time_bucket(timestamp_value):
    try:
        dt = datetime.fromisoformat(str(timestamp_value).replace("Z", "+00:00"))
    except ValueError:
        return "evening"

    if dt.hour < 11:
        return "morning"
    if dt.hour < 17:
        return "afternoon"
    return "evening"


def map_body_part_to_goal(body_part):
    normalized = normalize_text(body_part)
    if normalized in {"chest", "back", "arms", "upper_body", "legs", "glutes", "core"}:
        return "muscle_gain"
    if normalized in {"full_body", "cardio"}:
        return "fat_loss"
    return "maintenance"


def map_difficulty_to_level(difficulty):
    normalized = normalize_text(difficulty)
    if "advanced" in normalized:
        return "advanced"
    if "intermediate" in normalized:
        return "intermediate"
    return "beginner"


def map_body_part_to_category(body_part):
    normalized = normalize_text(body_part)
    if normalized in {"cardio", "full_body"}:
        return "conditioning"
    if normalized in {"mobility"}:
        return "mobility"
    if normalized in {"core"}:
        return "core"
    return "strength"


def map_body_part_to_muscle_group(body_part):
    normalized = normalize_text(body_part)
    muscle_map = {
        "upper_body": "chest",
        "legs": "legs",
        "glutes": "legs",
        "cardio": "full_body",
        "full_body": "full_body",
        "mobility": "full_body",
    }
    return muscle_map.get(normalized, normalized)


def infer_location_from_equipment(equipment):
    equipment_key = normalize_text(equipment, "none")
    if equipment_key in {"none", "bodyweight"}:
        return "home"
    return "gym"


def build_interactions(goal, fitness_level, location, equipment_available):
    return {
        "goal_x_experience": f"{goal}__{fitness_level}",
        "location_x_equipment_available": f"{location}__{equipment_available}",
    }


def load_external_dataset():
    if not RAW_DATASET_PATH.exists():
        return []

    with RAW_DATASET_PATH.open("r", newline="", encoding="utf-8") as csv_file:
        return list(csv.DictReader(csv_file))


def transform_external_rows(external_rows):
    training_rows = []

    for row in external_rows:
        exercise = normalize_text(row.get("exercise"))
        body_part = normalize_text(row.get("bodyPart"))
        equipment = normalize_text(row.get("equipment"), "none")
        fitness_level = map_difficulty_to_level(row.get("difficulty"))
        primary_goal = map_body_part_to_goal(body_part)
        goals = [primary_goal]

        if primary_goal != "maintenance":
          goals.append("maintenance")

        location = infer_location_from_equipment(equipment)
        equipment_available = "full_gym" if location == "gym" else "minimal"
        previous_day_performance = {
            "beginner": 42.0,
            "intermediate": 57.0,
            "advanced": 71.0,
        }.get(fitness_level, 50.0)

        for goal in goals:
            for day_index, day_of_week in enumerate(DAY_BUCKETS):
                for time_index, workout_time_of_day in enumerate(TIME_OF_DAY_BUCKETS):
                    varied_performance = round(
                        previous_day_performance + (time_index * 2.5) + (day_index % 2) * 1.5,
                        2,
                    )
                    base_row = {
                        "goal": goal,
                        "fitness_level": fitness_level,
                        "equipment": equipment,
                        "exercise": exercise,
                        "exercise_category": map_body_part_to_category(body_part),
                        "exercise_muscle_group": map_body_part_to_muscle_group(body_part),
                        "location": location,
                        "equipment_available": equipment_available,
                        "workout_time_of_day": workout_time_of_day,
                        "day_of_week": day_of_week,
                        "previous_day_performance": varied_performance,
                        "source": "external_dataset",
                    }
                    base_row.update(
                        build_interactions(goal, fitness_level, location, equipment_available)
                    )
                    training_rows.append(base_row)

    return training_rows


def load_fitai_logs():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    cursor = connection.cursor()
    exercise_catalog = {
        normalize_text(row["name"]): {
            "equipment": normalize_text(row["equipment"], "none"),
            "category": normalize_text(row["category"], "strength"),
            "muscle_group": normalize_text(row["muscle_group"], "full_body"),
        }
        for row in cursor.execute(
            "SELECT name, equipment, category, muscle_group FROM exercises"
        ).fetchall()
    }

    progress_by_user_and_day = defaultdict(dict)
    for row in cursor.execute(
        "SELECT user_id, date, consistency_score, total_volume, workout_count FROM progress_logs ORDER BY date ASC"
    ).fetchall():
        day_key = str(row["date"])[:10]
        progress_by_user_and_day[int(row["user_id"])][day_key] = row

    user_rewards = defaultdict(int)
    for row in cursor.execute("SELECT user_id, points FROM rewards").fetchall():
        user_rewards[int(row["user_id"])] += int(row["points"] or 0)

    rows = []
    workouts = cursor.execute(
        """
        SELECT
          workouts.id,
          workouts.user_id,
          workouts.date,
          workouts.location AS workout_location,
          workouts.exercises_json,
          users.fitness_goal,
          users.activity_level,
          users.location AS preferred_location,
          users.preferences_json
        FROM workouts
        INNER JOIN users ON users.id = workouts.user_id
        ORDER BY workouts.date ASC
        """
    ).fetchall()

    recent_exercise_counter = defaultdict(Counter)

    for workout in workouts:
        user_id = int(workout["user_id"])
        preferences = parse_json(workout["preferences_json"], {})
        workout_date = str(workout["date"])
        current_day_key = workout_date[:10]

        try:
            workout_dt = datetime.fromisoformat(workout_date.replace("Z", "+00:00"))
        except ValueError:
            workout_dt = datetime.utcnow()

        previous_day_key = workout_dt.date().fromordinal(workout_dt.date().toordinal() - 1).isoformat()
        previous_progress = progress_by_user_and_day[user_id].get(previous_day_key)
        previous_day_performance = round(
            float(previous_progress["consistency_score"] or 0) if previous_progress else 35.0,
            2,
        )

        workout_exercises = parse_json(workout["exercises_json"], [])
        preferred_location = normalize_text(workout["preferred_location"], "home")
        workout_location = normalize_text(workout["workout_location"], preferred_location)
        equipment_available = "full_gym" if workout_location == "gym" else "minimal"
        day_of_week = workout_dt.strftime("%A").lower()
        workout_time_of_day = workout_time_bucket(workout_date)
        goal = normalize_text(workout["fitness_goal"], "maintenance")
        fitness_level = normalize_text(workout["activity_level"], "beginner")

        for exercise in workout_exercises:
            exercise_name = normalize_text(exercise.get("name"))
            catalog_entry = exercise_catalog.get(exercise_name, {})
            equipment = normalize_text(exercise.get("equipment") or catalog_entry.get("equipment"), "none")
            row = {
                "goal": goal,
                "fitness_level": fitness_level,
                "equipment": equipment,
                "exercise": exercise_name,
                "exercise_category": normalize_text(catalog_entry.get("category"), "strength"),
                "exercise_muscle_group": normalize_text(catalog_entry.get("muscle_group"), "full_body"),
                "location": workout_location,
                "equipment_available": equipment_available,
                "workout_time_of_day": workout_time_of_day,
                "day_of_week": day_of_week,
                "previous_day_performance": previous_day_performance,
                "source": "fitai_logs",
                "reward_points_total": user_rewards[user_id],
                "session_duration_target": preferences.get("sessionDuration", 45),
                "workout_days_per_week": preferences.get("workoutDaysPerWeek", 3),
                "recent_exercise_frequency": recent_exercise_counter[user_id][exercise_name],
            }
            row.update(build_interactions(goal, fitness_level, workout_location, equipment_available))
            rows.append(row)
            recent_exercise_counter[user_id][exercise_name] += 1

            if previous_day_performance > 0:
                boosted_row = dict(row)
                boosted_row["source"] = "fitai_logs_boosted"
                boosted_row["previous_day_performance"] = round(
                    previous_day_performance + (user_rewards[user_id] / 50.0),
                    2,
                )
                rows.append(boosted_row)

                # Add a second stronger copy so real FitAI behavior influences the model
                # more than broad external catalog data when both are available.
                reinforced_row = dict(boosted_row)
                reinforced_row["source"] = "fitai_logs_reinforced"
                reinforced_row["recent_exercise_frequency"] = round(
                    float(row["recent_exercise_frequency"]) + 1.5,
                    2,
                )
                reinforced_row["previous_day_performance"] = round(
                    float(boosted_row["previous_day_performance"]) + 4.0,
                    2,
                )
                rows.append(reinforced_row)

    connection.close()
    return rows


def save_training_dataset(rows):
    fieldnames = [
        "goal",
        "fitness_level",
        "equipment",
        "exercise",
        "exercise_category",
        "exercise_muscle_group",
        "location",
        "equipment_available",
        "workout_time_of_day",
        "day_of_week",
        "previous_day_performance",
        "goal_x_experience",
        "location_x_equipment_available",
        "source",
        "reward_points_total",
        "session_duration_target",
        "workout_days_per_week",
        "recent_exercise_frequency",
    ]

    with TRAINING_DATASET_PATH.open("w", newline="", encoding="utf-8") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


if __name__ == "__main__":
    external_rows = load_external_dataset()
    transformed_external = transform_external_rows(external_rows)
    fitai_rows = load_fitai_logs()
    merged_rows = transformed_external + fitai_rows
    save_training_dataset(merged_rows)

    print(
        json.dumps(
            {
                "external_dataset_rows": len(external_rows),
                "external_training_rows": len(transformed_external),
                "fitai_log_rows": len(fitai_rows),
                "dataset_size": len(merged_rows),
                "dataset_path": str(TRAINING_DATASET_PATH),
                "raw_dataset_path": str(RAW_DATASET_PATH),
            }
        )
    )
