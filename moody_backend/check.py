import pickle
from flask import Flask, request, jsonify
import numpy as np
import tensorflow as tf
from sklearn.preprocessing import StandardScaler
import requests
import json
import pandas as pd

filename = 'scaler.pkl'
scaler = pickle.load(open(filename, 'rb'))
print("Scaler loaded successfully")

interpreter = tf.lite.Interpreter(model_path = "modelv0.tflite")
interpreter.allocate_tensors()

track_id = "4h9wh7iOZ0GGn8QVp4RAOB"

input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()
data = pd.read_csv("SongData/dataStage1.csv")
track = data[data["track_id"] == track_id]
print(f"response is {track}")
duration_ms = track["duration_ms"]
explicit = track["explicit"]
danceability = track["danceability"]
energy = track["energy"]
key = track["key"]
loudness = track["loudness"]
mode = track["mode"]
speechiness = track["speechiness"]
acousticness = track["acousticness"]
instrumentalness = track["instrumentalness"]
liveness = track["liveness"]
valence = track["valence"]
tempo = track["tempo"]
time_signature = track["time_signature"]
features = np.array([duration_ms, explicit, danceability, energy, key, loudness, mode,
                        speechiness, acousticness, instrumentalness, liveness, valence,
                        tempo, time_signature], dtype=np.float32)
features = features.reshape(1, -1)
features = scaler.transform(features)
interpreter.set_tensor(input_details[0]['index'], features)
interpreter.invoke()
output_data = interpreter.get_tensor(output_details[0]['index'])
predictions[track_id] = {"prediction": output_data.tolist()}