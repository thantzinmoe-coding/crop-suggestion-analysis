import os
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import joblib

# Paths
base_dir = os.path.dirname(os.path.abspath(__file__))
# Project root is one level up from ml_models directory
project_root = os.path.abspath(os.path.join(base_dir, '..'))

data_path = os.path.join(project_root, 'data', 'township_agricultural_data.csv')
model_path = os.path.join(base_dir, 'crop_model.joblib')
label_encoder_path = os.path.join(base_dir, 'label_encoder.joblib')

print(f"Loading data from {data_path}")
if not os.path.exists(data_path):
    raise FileNotFoundError(f"Dataset not found at {data_path}. Please ensure the CSV was generated.")

df = pd.read_csv(data_path)

# Features and target
feature_cols = ['soil_pH', 'rainfall_mm', 'temperature_c']
X = df[feature_cols]

y = df['best_crop']

# Encode target labels
le = LabelEncoder()
y_encoded = le.fit_transform(y)

# Train model
clf = RandomForestClassifier(n_estimators=200, random_state=42)
clf.fit(X, y_encoded)

# Save model and encoder
joblib.dump(clf, model_path)
joblib.dump(le, label_encoder_path)

print(f"Model saved to {model_path}")
print(f"Label encoder saved to {label_encoder_path}")
