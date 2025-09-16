# train.py
import os
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
from xgboost import XGBClassifier
import matplotlib.pyplot as plt

# -------- Config --------
DATA_PATH = "data/final_student_dataset.csv"
MODEL_OUT = "models/model_pipeline.joblib"
RANDOM_STATE = 42
TEST_SIZE = 0.20
TARGET = "Dropout"   # 👈 your actual target column

# -------- Load Data --------
print("🔄 Loading dataset...")
df = pd.read_csv(DATA_PATH)
print("✅ Data loaded:", df.shape)
print("Columns:", df.columns.tolist())

# Safety check: Ensure target column exists
if TARGET not in df.columns:
    raise ValueError(f"❌ Target column '{TARGET}' not found. Available columns: {df.columns.tolist()}")

X = df.drop(TARGET, axis=1)
y = df[TARGET]

# -------- Preprocessing --------
# Separate categorical and numeric columns
categorical_cols = X.select_dtypes(include=["object"]).columns.tolist()
numeric_cols = X.select_dtypes(exclude=["object"]).columns.tolist()

print("Categorical columns:", categorical_cols)
print("Numeric columns:", numeric_cols)

# Pipelines
numeric_transformer = Pipeline(steps=[
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler())
])

categorical_transformer = Pipeline(steps=[
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("encoder", OneHotEncoder(handle_unknown="ignore"))
])

preprocessor = ColumnTransformer(
    transformers=[
        ("num", numeric_transformer, numeric_cols),
        ("cat", categorical_transformer, categorical_cols)
    ]
)

# -------- Model --------
model = XGBClassifier(
    eval_metric="mlogloss",
    use_label_encoder=False,
    n_estimators=100,
    max_depth=4,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=RANDOM_STATE
)

pipeline = Pipeline(steps=[
    ("preprocessor", preprocessor),
    ("classifier", model)
])

# -------- Train/Test Split --------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
)

# -------- Training --------
print("🚀 Training model...")
pipeline.fit(X_train, y_train)

# -------- Evaluation --------
y_pred = pipeline.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
report = classification_report(y_test, y_pred)

print("\n✅ Model Evaluation")
print("Accuracy:", round(accuracy, 3))
print("Classification Report:\n", report)

# -------- Save Model --------
os.makedirs("models", exist_ok=True)
joblib.dump(pipeline, MODEL_OUT)
print(f"💾 Model saved at: {MODEL_OUT}")

# -------- Confusion Matrix --------
cm = confusion_matrix(y_test, y_pred)
plt.figure(figsize=(5,4))
plt.imshow(cm, cmap="Blues")
plt.title("Confusion Matrix")
plt.colorbar()
plt.ylabel("True")
plt.xlabel("Predicted")
plt.show()
