import csv
import json
from collections import Counter
from datetime import datetime, UTC
from itertools import product
from pathlib import Path

import numpy as np
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.inspection import permutation_importance
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
from sklearn.model_selection import StratifiedKFold
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, OneHotEncoder, StandardScaler
from sklearn.utils.class_weight import compute_sample_weight


ROOT = Path(__file__).resolve().parents[1]
DATASET_PATH = ROOT / "ml" / "artifacts" / "training_dataset.csv"
MODEL_PATH = ROOT / "ml" / "artifacts" / "recommender_model.json"

CATEGORICAL_FEATURES = [
    "goal",
    "fitness_level",
    "equipment",
    "location",
    "equipment_available",
    "workout_time_of_day",
    "day_of_week",
    "goal_x_experience",
    "location_x_equipment_available",
]
NUMERICAL_FEATURES = [
    "previous_day_performance",
    "reward_points_total",
    "session_duration_target",
    "workout_days_per_week",
    "recent_exercise_frequency",
]
ALL_FEATURES = CATEGORICAL_FEATURES + NUMERICAL_FEATURES
CATEGORICAL_INDICES = [ALL_FEATURES.index(feature) for feature in CATEGORICAL_FEATURES]
NUMERICAL_INDICES = [ALL_FEATURES.index(feature) for feature in NUMERICAL_FEATURES]
HIERARCHICAL_TEMPLATE_FIELDS = [
    "goal",
    "fitness_level",
    "equipment",
    "location",
    "workout_time_of_day",
    "day_of_week",
    "previous_day_performance",
    "goal_x_experience",
    "location_x_equipment_available",
]


def load_rows():
    if not DATASET_PATH.exists():
        return []

    with DATASET_PATH.open("r", newline="", encoding="utf-8") as csv_file:
        return list(csv.DictReader(csv_file))


def normalize_row(row):
    normalized = {}
    for feature in CATEGORICAL_FEATURES:
        normalized[feature] = str(row.get(feature, "unknown") or "unknown").strip().lower()
    for feature in NUMERICAL_FEATURES:
        value = row.get(feature)
        try:
            normalized[feature] = float(value)
        except (TypeError, ValueError):
            normalized[feature] = 0.0
    normalized["exercise"] = str(row.get("exercise", "unknown") or "unknown").strip()
    normalized["exercise_category"] = str(row.get("exercise_category", "strength") or "strength").strip().lower()
    normalized["exercise_muscle_group"] = str(
        row.get("exercise_muscle_group", "full_body") or "full_body"
    ).strip().lower()
    normalized["source"] = str(row.get("source", "unknown") or "unknown").strip().lower()
    return normalized


def augment_rows(rows):
    augmented = [dict(row) for row in rows]
    label_counts = Counter(row["exercise"] for row in rows)
    median_count = max(2, int(np.median(list(label_counts.values()) or [1])))
    rng = np.random.default_rng(42)

    for row in rows:
        label = row["exercise"]
        current_count = label_counts[label]
        synthetic_copies = 0

        if current_count < median_count:
            synthetic_copies = min(4, median_count - current_count)
        elif row.get("source", "").startswith("fitai_logs"):
            synthetic_copies = 3

        for _ in range(synthetic_copies):
            clone = dict(row)
            clone["source"] = f"{row.get('source', 'synthetic')}_synthetic"
            clone["previous_day_performance"] = round(
                max(0.0, float(row["previous_day_performance"]) + rng.normal(0, 3.5)),
                3,
            )
            clone["recent_exercise_frequency"] = max(
                0.0,
                round(float(row["recent_exercise_frequency"]) + rng.normal(0, 0.75), 3),
            )
            clone["session_duration_target"] = max(
                15.0,
                round(float(row["session_duration_target"]) + rng.normal(0, 4.0), 3),
            )
            clone["workout_days_per_week"] = min(
                7.0,
                max(1.0, round(float(row["workout_days_per_week"]) + rng.normal(0, 0.6), 3)),
            )
            if rng.random() < 0.25:
                clone["workout_time_of_day"] = rng.choice(["morning", "afternoon", "evening"])
            if rng.random() < 0.2:
                clone["day_of_week"] = rng.choice(
                    ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
                )
            augmented.append(clone)

    return augmented


def sharpen_and_normalize_probabilities(probabilities, temperature=0.72):
    probability_array = np.array(probabilities, dtype=float)
    if probability_array.size == 0:
        return probability_array

    probability_array = np.clip(probability_array, 1e-9, None)
    sharpened = np.power(probability_array, temperature)
    total = float(np.sum(sharpened))
    if total <= 0:
      return probability_array
    return sharpened / total


def row_to_feature_dict(row):
    return {feature: row[feature] for feature in CATEGORICAL_FEATURES + NUMERICAL_FEATURES}


def row_to_feature_array(row):
    return [row[feature] for feature in ALL_FEATURES]


def build_preprocessor():
    return ColumnTransformer(
        transformers=[
            (
                "categorical",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        ("encoder", OneHotEncoder(handle_unknown="ignore")),
                    ]
                ),
                CATEGORICAL_INDICES,
            ),
            (
                "numeric",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="constant", fill_value=0.0)),
                        ("scaler", StandardScaler()),
                    ]
                ),
                NUMERICAL_INDICES,
            ),
        ]
    )


def build_classifier():
    return MLPClassifier(
        hidden_layer_sizes=(256, 128, 64),
        activation="relu",
        solver="adam",
        alpha=0.0008,
        batch_size=32,
        learning_rate="adaptive",
        learning_rate_init=0.001,
        max_iter=450,
        early_stopping=True,
        validation_fraction=0.15,
        n_iter_no_change=18,
        random_state=42,
        verbose=False,
    )


def build_pipeline():
    return Pipeline(
        steps=[
            ("preprocessor", build_preprocessor()),
            ("classifier", build_classifier()),
        ]
    )


def train_target_model(X, labels):
    label_encoder = LabelEncoder()
    encoded = label_encoder.fit_transform(labels)
    pipeline = build_pipeline()
    sample_weights = compute_sample_weight(class_weight="balanced", y=encoded)
    pipeline.fit(X, encoded, classifier__sample_weight=sample_weights)
    predictions = pipeline.predict(X)
    probabilities = pipeline.predict_proba(X)

    precision, recall, f1_score, _ = precision_recall_fscore_support(
        encoded,
        predictions,
        average="weighted",
        zero_division=0,
    )

    return {
      "pipeline": pipeline,
      "label_encoder": label_encoder,
      "labels": encoded,
      "metrics": {
          "train_accuracy": round(float(accuracy_score(encoded, predictions)), 6),
          "train_precision": round(float(precision), 6),
          "train_recall": round(float(recall), 6),
          "train_f1_score": round(float(f1_score), 6),
      },
      "confidence_summary": {
          "average_train_confidence": round(float(np.mean(np.max(probabilities, axis=1))), 6),
          "median_train_confidence": round(float(np.median(np.max(probabilities, axis=1))), 6),
          "max_train_confidence": round(float(np.max(np.max(probabilities, axis=1))), 6),
          "min_train_confidence": round(float(np.min(np.max(probabilities, axis=1))), 6),
      },
    }


def evaluate_with_cross_validation(X, y_encoded):
    class_counts = Counter(y_encoded)
    min_class_count = min(class_counts.values()) if class_counts else 0
    n_splits = min(5, min_class_count) if min_class_count else 0

    if n_splits < 2:
        return {
            "folds": 1,
            "accuracy": 0.0,
            "precision": 0.0,
            "recall": 0.0,
            "f1_score": 0.0,
            "confidence": 0.0,
        }

    splitter = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)
    fold_metrics = []

    for train_index, validation_index in splitter.split(X, y_encoded):
        X_train = X[train_index]
        X_validation = X[validation_index]
        y_train = [y_encoded[index] for index in train_index]
        y_validation = [y_encoded[index] for index in validation_index]

        pipeline = build_pipeline()
        sample_weights = compute_sample_weight(class_weight="balanced", y=y_train)
        pipeline.fit(X_train, y_train, classifier__sample_weight=sample_weights)

        predictions = pipeline.predict(X_validation)
        probabilities = pipeline.predict_proba(X_validation)
        confidence_scores = np.max(probabilities, axis=1) if len(probabilities) else np.array([0.0])

        precision, recall, f1_score, _ = precision_recall_fscore_support(
            y_validation,
            predictions,
            average="weighted",
            zero_division=0,
        )

        fold_metrics.append(
            {
                "accuracy": accuracy_score(y_validation, predictions),
                "precision": precision,
                "recall": recall,
                "f1_score": f1_score,
                "confidence": float(np.mean(confidence_scores)),
            }
        )

    return {
        "folds": n_splits,
        "accuracy": round(float(np.mean([item["accuracy"] for item in fold_metrics])), 6),
        "precision": round(float(np.mean([item["precision"] for item in fold_metrics])), 6),
        "recall": round(float(np.mean([item["recall"] for item in fold_metrics])), 6),
        "f1_score": round(float(np.mean([item["f1_score"] for item in fold_metrics])), 6),
        "confidence": round(float(np.mean([item["confidence"] for item in fold_metrics])), 6),
    }


def build_lookup(pipeline, rows, class_names, enhanced=False):

    basic_goal_values = sorted({row["goal"] for row in rows})
    basic_level_values = sorted({row["fitness_level"] for row in rows})
    basic_equipment_values = sorted({row["equipment"] for row in rows})

    if not enhanced:
        lookup = {}
        for goal, fitness_level, equipment in product(
            basic_goal_values,
            basic_level_values,
            basic_equipment_values,
        ):
            template = {
                "goal": goal,
                "fitness_level": fitness_level,
                "equipment": equipment,
                "location": "gym" if equipment not in {"none", "bodyweight"} else "home",
                "equipment_available": "full_gym" if equipment not in {"none", "bodyweight"} else "minimal",
                "workout_time_of_day": "evening",
                "day_of_week": "monday",
                "previous_day_performance": 50.0,
                "goal_x_experience": f"{goal}__{fitness_level}",
                "location_x_equipment_available": (
                    f"{'gym' if equipment not in {'none', 'bodyweight'} else 'home'}__"
                    f"{'full_gym' if equipment not in {'none', 'bodyweight'} else 'minimal'}"
                ),
                "reward_points_total": 0.0,
                "session_duration_target": 45.0,
                "workout_days_per_week": 3.0,
                "recent_exercise_frequency": 0.0,
            }
            probabilities = pipeline.predict_proba(np.array([row_to_feature_array(template)], dtype=object))[0]
            ranked = sorted(
                [
                    {"exercise": class_names[index], "probability": round(float(probability), 6)}
                    for index, probability in enumerate(probabilities)
                ],
                key=lambda item: item["probability"],
                reverse=True,
            )
            top_ranked = ranked[:25]
            relative_probabilities = sharpen_and_normalize_probabilities(
                [item["probability"] for item in top_ranked]
            )
            lookup[f"{goal}|{fitness_level}|{equipment}"] = [
                {
                    **item,
                    "relative_probability": round(float(relative_probabilities[index]), 6),
                }
                for index, item in enumerate(top_ranked)
            ]
        return lookup

    lookup = {}
    for row in rows:
        key = (
            f"{row['goal']}|{row['fitness_level']}|{row['equipment']}|{row['location']}|"
            f"{row['workout_time_of_day']}|{row['day_of_week']}|{round(float(row['previous_day_performance']), 1)}|"
            f"{row['goal_x_experience']}|{row['location_x_equipment_available']}"
        )
        if key in lookup:
            continue
        probabilities = pipeline.predict_proba(np.array([row_to_feature_array(row)], dtype=object))[0]
        ranked = sorted(
            [
                {"exercise": class_names[index], "probability": round(float(probability), 6)}
                for index, probability in enumerate(probabilities)
            ],
            key=lambda item: item["probability"],
            reverse=True,
        )
        top_ranked = ranked[:25]
        relative_probabilities = sharpen_and_normalize_probabilities(
            [item["probability"] for item in top_ranked]
        )
        lookup[key] = [
            {
                **item,
                "relative_probability": round(float(relative_probabilities[index]), 6),
            }
            for index, item in enumerate(top_ranked)
        ]

    return lookup


def build_template_from_row(row):
    return {
        "goal": row["goal"],
        "fitness_level": row["fitness_level"],
        "equipment": row["equipment"],
        "location": row["location"],
        "equipment_available": row["equipment_available"],
        "workout_time_of_day": row["workout_time_of_day"],
        "day_of_week": row["day_of_week"],
        "previous_day_performance": float(row["previous_day_performance"]),
        "goal_x_experience": row["goal_x_experience"],
        "location_x_equipment_available": row["location_x_equipment_available"],
        "reward_points_total": float(row.get("reward_points_total", 0.0)),
        "session_duration_target": float(row.get("session_duration_target", 45.0)),
        "workout_days_per_week": float(row.get("workout_days_per_week", 3.0)),
        "recent_exercise_frequency": float(row.get("recent_exercise_frequency", 0.0)),
    }


def get_basic_templates(rows):
    templates = []
    seen = set()
    for goal, fitness_level, equipment in product(
        sorted({row["goal"] for row in rows}),
        sorted({row["fitness_level"] for row in rows}),
        sorted({row["equipment"] for row in rows}),
    ):
        location = "gym" if equipment not in {"none", "bodyweight"} else "home"
        equipment_available = "full_gym" if location == "gym" else "minimal"
        template = {
            "goal": goal,
            "fitness_level": fitness_level,
            "equipment": equipment,
            "location": location,
            "equipment_available": equipment_available,
            "workout_time_of_day": "evening",
            "day_of_week": "monday",
            "previous_day_performance": 50.0,
            "goal_x_experience": f"{goal}__{fitness_level}",
            "location_x_equipment_available": f"{location}__{equipment_available}",
            "reward_points_total": 0.0,
            "session_duration_target": 45.0,
            "workout_days_per_week": 3.0,
            "recent_exercise_frequency": 0.0,
        }
        key = f"{goal}|{fitness_level}|{equipment}"
        if key not in seen:
            templates.append((key, template))
            seen.add(key)
    return templates


def get_enhanced_templates(rows):
    templates = []
    seen = set()
    for row in rows:
        key = (
            f"{row['goal']}|{row['fitness_level']}|{row['equipment']}|{row['location']}|"
            f"{row['workout_time_of_day']}|{row['day_of_week']}|{round(float(row['previous_day_performance']), 1)}|"
            f"{row['goal_x_experience']}|{row['location_x_equipment_available']}"
        )
        if key in seen:
            continue
        seen.add(key)
        templates.append((key, build_template_from_row(row)))
    return templates


def build_hierarchical_lookup(category_model, category_names, category_exercise_models, rows, enhanced=False):
    templates = get_enhanced_templates(rows) if enhanced else get_basic_templates(rows)
    lookup = {}

    for key, template in templates:
        feature_array = np.array([row_to_feature_array(template)], dtype=object)
        category_probabilities = category_model.predict_proba(feature_array)[0]
        ranked = []

        for category_index, category_probability in enumerate(category_probabilities):
            category_name = category_names[category_index]
            exercise_bundle = category_exercise_models.get(category_name)
            if not exercise_bundle:
                continue

            exercise_probabilities = exercise_bundle["pipeline"].predict_proba(feature_array)[0]
            exercise_names = exercise_bundle["class_names"]
            for exercise_index, exercise_probability in enumerate(exercise_probabilities):
                combined_probability = float(category_probability) * float(exercise_probability)
                ranked.append(
                    {
                        "exercise": exercise_names[exercise_index],
                        "category": category_name,
                        "probability": round(combined_probability, 6),
                        "category_probability": round(float(category_probability), 6),
                        "within_category_probability": round(float(exercise_probability), 6),
                    }
                )

        top_ranked = sorted(ranked, key=lambda item: item["probability"], reverse=True)[:25]
        relative_probabilities = sharpen_and_normalize_probabilities(
            [item["probability"] for item in top_ranked]
        )
        lookup[key] = [
            {
                **item,
                "relative_probability": round(float(relative_probabilities[index]), 6),
            }
            for index, item in enumerate(top_ranked)
        ]

    return lookup


def extract_feature_names(pipeline):
    preprocessor = pipeline.named_steps["preprocessor"]
    categorical_encoder = (
        preprocessor.named_transformers_["categorical"].named_steps["encoder"]
    )
    categorical_names = list(categorical_encoder.get_feature_names_out(CATEGORICAL_FEATURES))
    return categorical_names + NUMERICAL_FEATURES


def compute_feature_importance(pipeline, X, y):
    try:
        result = permutation_importance(
            pipeline,
            X,
            y,
            n_repeats=5,
            random_state=42,
            scoring="f1_weighted",
        )
        feature_names = extract_feature_names(pipeline)
        ranked = sorted(
            [
                {
                    "feature": feature_names[index] if index < len(feature_names) else f"feature_{index}",
                    "importance": round(float(result.importances_mean[index]), 6),
                }
                for index in range(len(result.importances_mean))
            ],
            key=lambda item: item["importance"],
            reverse=True,
        )
        return ranked[:15]
    except Exception:
        return []


def train_model(rows):
    normalized_rows = [normalize_row(row) for row in rows]
    augmented_rows = augment_rows(normalized_rows)
    X = np.array([row_to_feature_array(row) for row in augmented_rows], dtype=object)
    y = [row["exercise"] for row in augmented_rows]
    y_encoded = LabelEncoder().fit_transform(y)

    cross_validation = evaluate_with_cross_validation(X, y_encoded)

    exercise_training = train_target_model(X, y)
    exercise_pipeline = exercise_training["pipeline"]
    class_names = [str(label) for label in exercise_training["label_encoder"].classes_]
    basic_lookup = build_lookup(exercise_pipeline, normalized_rows, class_names, enhanced=False)
    enhanced_lookup = build_lookup(exercise_pipeline, normalized_rows, class_names, enhanced=True)
    feature_importance = compute_feature_importance(exercise_pipeline, X, exercise_training["labels"])

    category_labels = [row["exercise_category"] for row in augmented_rows]
    category_training = train_target_model(X, category_labels)
    category_pipeline = category_training["pipeline"]
    category_names = [str(label) for label in category_training["label_encoder"].classes_]

    category_exercise_models = {}
    for category_name in sorted(set(category_labels)):
        category_rows = [row for row in augmented_rows if row["exercise_category"] == category_name]
        if len({row["exercise"] for row in category_rows}) < 2:
            continue

        category_X = np.array([row_to_feature_array(row) for row in category_rows], dtype=object)
        category_y = [row["exercise"] for row in category_rows]
        category_bundle = train_target_model(category_X, category_y)
        category_exercise_models[category_name] = {
            "pipeline": category_bundle["pipeline"],
            "class_names": [str(label) for label in category_bundle["label_encoder"].classes_],
            "sample_size": len(category_rows),
            "metrics": category_bundle["metrics"],
        }

    hierarchical_lookup = build_hierarchical_lookup(
        category_pipeline,
        category_names,
        category_exercise_models,
        normalized_rows,
        enhanced=False,
    )
    hierarchical_lookup_enhanced = build_hierarchical_lookup(
        category_pipeline,
        category_names,
        category_exercise_models,
        normalized_rows,
        enhanced=True,
    )

    classifier = exercise_pipeline.named_steps["classifier"]
    artifact = {
        "model_trained": True,
        "model_type": "HierarchicalDeepMLPClassifier",
        "trained_at": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
        "dataset_size": len(normalized_rows),
        "augmented_dataset_size": len(augmented_rows),
        "classes": class_names,
        "category_classes": category_names,
        "feature_schema": {
            "categorical": CATEGORICAL_FEATURES,
            "numerical": NUMERICAL_FEATURES,
        },
        "training_config": {
            "hidden_layer_sizes": list(classifier.hidden_layer_sizes),
            "early_stopping": bool(classifier.early_stopping),
            "learning_rate": classifier.learning_rate,
            "learning_rate_init": classifier.learning_rate_init,
            "batch_size": classifier.batch_size,
            "max_iter": classifier.max_iter,
            "regularization_alpha": classifier.alpha,
            "batch_normalization": "handled via standardized numeric features",
            "dropout": "not natively available in sklearn MLP; approximated with augmentation + alpha regularization",
            "hierarchical_stage_1": "category classifier",
            "hierarchical_stage_2": "category-specific exercise classifiers",
        },
        "metrics": {
            **exercise_training["metrics"],
            "cross_validation": cross_validation,
            "category_train_accuracy": category_training["metrics"]["train_accuracy"],
        },
        "confidence_summary": exercise_training["confidence_summary"],
        "category_confidence_summary": category_training["confidence_summary"],
        "feature_importance": feature_importance,
        "lookup": basic_lookup,
        "lookup_enhanced": enhanced_lookup,
        "hierarchical_lookup": hierarchical_lookup,
        "hierarchical_lookup_enhanced": hierarchical_lookup_enhanced,
        "category_models": {
            key: {
                "sample_size": value["sample_size"],
                "metrics": value["metrics"],
            }
            for key, value in category_exercise_models.items()
        },
    }
    MODEL_PATH.write_text(json.dumps(artifact, indent=2), encoding="utf-8")
    return artifact


if __name__ == "__main__":
    rows = load_rows()
    if not rows:
        MODEL_PATH.write_text(
            json.dumps(
                {
                    "model_trained": False,
                    "model_type": "DeepMLPClassifier",
                    "trained_at": None,
                    "dataset_size": 0,
                    "augmented_dataset_size": 0,
                    "classes": [],
                    "category_classes": [],
                    "lookup": {},
                    "lookup_enhanced": {},
                    "hierarchical_lookup": {},
                    "hierarchical_lookup_enhanced": {},
                    "metrics": {},
                    "confidence_summary": {},
                    "category_confidence_summary": {},
                    "feature_importance": [],
                    "category_models": {},
                },
                indent=2,
            ),
            encoding="utf-8",
        )
        print(
            json.dumps(
                {
                    "dataset_size": 0,
                    "model_trained": False,
                    "artifact": str(MODEL_PATH),
                }
            )
        )
    else:
        artifact = train_model(rows)
        print(
            json.dumps(
                {
                    "dataset_size": artifact["dataset_size"],
                    "augmented_dataset_size": artifact["augmented_dataset_size"],
                    "model_trained": artifact["model_trained"],
                    "artifact": str(MODEL_PATH),
                    "trained_at": artifact["trained_at"],
                    "cross_validation": artifact["metrics"]["cross_validation"],
                    "average_train_confidence": artifact["confidence_summary"]["average_train_confidence"],
                }
            )
        )
