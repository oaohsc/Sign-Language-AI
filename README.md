# Sign-Language-AI
 
This project introduces an innovative AI-driven system designed to bridge communication gaps for the hearing-impaired. By leveraging high-speed computer vision and hand-tracking technology, the application translates manual signs into readable text and synthesized speech in real-time.

#  GestureAI — Sign Language Recognition System

<img width="1024" height="600" alt="Image" src="https://github.com/user-attachments/assets/09d41b35-21ff-4f65-87c3-bcf8674497a1" />
GestureAI is a real-time sign language detection and translation system that uses computer vision and hand tracking to recognize gestures from a webcam and convert them into text and speech.

The system supports both **English and Arabic sign language**, allowing users to detect individual letters or whole words and build sentences interactively.

---

##  Features

* Real-time hand tracking using MediaPipe
* Sign detection from webcam input
* English and Arabic language support
* Two recognition modes:

  * **Letters mode** for spelling
  * **Words mode** for common phrases
* Automatic gesture stabilization and smoothing
* Text accumulation to form sentences
* Optional text-to-speech feedback
* Desktop version (OpenCV UI)
* Web interface using Streamlit

---

##  Technologies Used

* Python
* OpenCV
* MediaPipe Hands
* NumPy
* Streamlit
* pyttsx3 (Text-to-Speech)
* PIL (Image processing)

---

##  Project Structure

* `main.py` → Desktop real-time application
* `streamlit_app.py` → Web-based interface
* `sign_classifier.py` → Gesture classification logic
* `test_env.py` → Environment and dependency test

---

##  How to Run

### 1️ Install dependencies

```bash
pip install opencv-python mediapipe numpy streamlit pyttsx3 pillow arabic-reshaper python-bidi
```

### 2️ Run desktop version

```bash
python main.py
```

### 3️ Run web version

```bash
streamlit run streamlit_app.py
```

---

##  Project Goal

This project aims to improve accessibility by providing an AI-powered communication tool that helps translate sign language gestures into readable text and speech in real time.

---

##  Future Improvements

* Deep learning model for higher accuracy
* More sign vocabulary
* Sentence prediction using NLP
* Mobile application version
* Cloud deployment

---

##  Author 

Developed as part of an AI / Computer Vision project in King Faisal University.

