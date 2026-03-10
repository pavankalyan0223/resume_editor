from sentence_transformers import SentenceTransformer
import joblib

# Load models
embedding_model = SentenceTransformer('models/model')
clf = joblib.load('models/skill_classifier.pkl')
mlb = joblib.load('models/mlb.pkl')

# Encode input
text = ["Work in Agile teams and contribute to sprint planning and delivery"]
emb = embedding_model.encode(text)
print(emb)
# Predict
pred = clf.predict(emb)
print(pred)
predicted_skills = mlb.inverse_transform(pred)
print(predicted_skills)