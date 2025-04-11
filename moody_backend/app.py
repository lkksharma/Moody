import pickle
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import tensorflow as tf
from sklearn.preprocessing import StandardScaler
import requests
import json
import pandas as pd
from tensorflow.keras.utils import to_categorical
from sklearn.preprocessing import LabelEncoder

app = Flask(__name__)
CORS(app)



interpreter = tf.lite.Interpreter(model_path = "modelv0.tflite")
interpreter.allocate_tensors()

input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

@app.route("/predict", methods=["POST"])
def predict():
    print("Received request")
    try:
        filename = 'scaler.pkl'
        scaler = pickle.load(open(filename, 'rb'))
        print("Scaler loaded successfully")
    except Exception as e:
        print(f"Error loading scaler: {e}")

    if request.method != "POST":
        return jsonify({"error": "Invalid request method"}), 405
    
    data = request.json
    print(data)
    token = data["token"]
    track_ids = data["track_ids"]

    grouped_predictions = {}
    headers = {"Authorization": f"Bearer {token}"}

    for track_id in track_ids:
        try:
            print("Predicting for track_id:", track_id)
            df = pd.read_csv("SongData/dataStage1.csv")
            track = df[df["track_id"] == track_id]

            if track.empty:
                grouped_predictions.setdefault("unknown", []).append(track_id)
                continue

            
            le = LabelEncoder()
            Y = le.fit_transform(df["track_genre"])
            Y = to_categorical(Y)

            
            features = np.array([track["duration_ms"].values[0], track["explicit"].values[0],
                                 track["danceability"].values[0], track["energy"].values[0],
                                 track["key"].values[0], track["loudness"].values[0],
                                 track["mode"].values[0], track["speechiness"].values[0],
                                 track["acousticness"].values[0], track["instrumentalness"].values[0],
                                 track["liveness"].values[0], track["valence"].values[0],
                                 track["tempo"].values[0], track["time_signature"].values[0]], dtype=np.float32).reshape(1, -1)

            feature_names = [
    "duration_ms", "explicit", "danceability", "energy", "key", "loudness", "mode",
    "speechiness", "acousticness", "instrumentalness", "liveness", "valence",
    "tempo", "time_signature"
]


            features_df = pd.DataFrame(features, columns=feature_names)
            features = scaler.transform(features_df)

            
            interpreter.set_tensor(input_details[0]['index'], features)
            interpreter.invoke()
            output_data = interpreter.get_tensor(output_details[0]['index'])

            
            predicted_class = np.argmax(output_data, axis=1)
            genre = le.inverse_transform(predicted_class)[0]
            
            grouped_predictions.setdefault(genre, []).append({"track_id":track_id, "track_name":df[df["track_id"] == track_id]["track_name"].values[0]})

        except Exception as e:
            grouped_predictions.setdefault("error", []).append({track_id: str(e)})

    return jsonify(grouped_predictions)


        
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000,debug=True)

