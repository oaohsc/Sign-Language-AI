
import cv2
import mediapipe
import pyttsx3
import numpy
import arabic_reshaper
import bidi

print("All modules imported successfully.")

try:
    from PIL import ImageFont
    # try loading arial
    font = ImageFont.truetype("arial.ttf", 20)
    print("Arial Font found.")
except Exception as e:
    print(f"Font loading warning: {e}")

print("Setup check complete.")
