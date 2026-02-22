import streamlit as st
import cv2
import mediapipe as mp
import numpy as np
from sign_classifier import SignClassifier
from PIL import Image, ImageDraw, ImageFont
import time

# Page Config
st.set_page_config(page_title="Sign Language AI", page_icon="🤟", layout="centered")

# CSS for styling
st.markdown("""
    <style>
    .stButton>button {
        width: 100%;
        border-radius: 12px;
        height: 3em;
        font-weight: 600;
    }
    .reportview-container {
        background: #0e1117;
    }
    </style>
""", unsafe_allow_html=True)

# Initialize Session State
if 'accumulated_text' not in st.session_state:
    st.session_state['accumulated_text'] = ""
if 'last_pred' not in st.session_state:
    st.session_state['last_pred'] = "..."
if 'mode' not in st.session_state:
    st.session_state['mode'] = 'LETTERS'
if 'language' not in st.session_state:
    st.session_state['language'] = 'EN'

# Sidebar Controls
with st.sidebar:
    st.title("Settings")
    
    # Language Switch
    lang_choice = st.radio("Language", ["English (EN)", "Arabic (AR)"], index=0 if st.session_state['language']=='EN' else 1)
    new_lang = 'EN' if "English" in lang_choice else 'AR'
    if new_lang != st.session_state['language']:
        st.session_state['language'] = new_lang
        # Trigger rerun to update logic immediately if needed, but streamlit handles data flow.
    
    # Mode Switch
    mode_choice = st.radio("Mode", ["Spelling (Letters)", "Whole Words"], index=0 if st.session_state['mode']=='LETTERS' else 1)
    new_mode = 'LETTERS' if "Letters" in mode_choice else 'WORDS'
    if new_mode != st.session_state['mode']:
        st.session_state['mode'] = new_mode

    st.markdown("---")
    st.info("Press 'Start' to begin camera feed. \nUse the buttons below the video to build sentences.")

# Main Header
st.title("GestureAI - Sign Language Translator")
st.markdown(f"**Mode:** {st.session_state['mode']} | **Language:** {st.session_state['language']}")

# Caching resources
@st.cache_resource
def load_mediapipe():
    mp_hands = mp.solutions.hands
    hands = mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=1,
        min_detection_confidence=0.7,
        min_tracking_confidence=0.5
    )
    mp_draw = mp.solutions.drawing_utils
    return hands, mp_draw

hands, mp_draw = load_mediapipe()
classifier = SignClassifier()

# Main UI Layout
col1, col2 = st.columns([3, 1])

# Placeholder for Video
frame_placeholder = st.empty()
result_placeholder = st.empty()

# Text field: detected letters/words appear here (use Append Sign to add current detection)
st.markdown("### Text field — detected letters/words appear here")
if 'text_area_value' not in st.session_state:
    st.session_state['text_area_value'] = st.session_state['accumulated_text']

def on_text_change():
    st.session_state['accumulated_text'] = st.session_state.get('text_area_value', '')

text_area_value = st.text_area(
    "Accumulated text",
    value=st.session_state['text_area_value'],
    height=120,
    placeholder="Detected letters/words appear here. Use 'Append Sign' to add the current detection.",
    key="text_area_value",
    on_change=on_text_change
)

# Control Buttons
c1, c2, c3, c4 = st.columns(4)
with c1:
    if st.button("Append Sign"):
        current_pred = st.session_state['last_pred']
        if current_pred and current_pred != "..." and current_pred != "?":
            if st.session_state['mode'] == 'WORDS' and st.session_state['accumulated_text']:
                st.session_state['accumulated_text'] += " " + current_pred
            else:
                st.session_state['accumulated_text'] += current_pred
            st.session_state['text_area_value'] = st.session_state['accumulated_text']
        st.rerun()

with c2:
    if st.button("Space"):
        st.session_state['accumulated_text'] += " "
        st.session_state['text_area_value'] = st.session_state['accumulated_text']
        st.rerun()

with c3:
    if st.button("Backspace"):
        st.session_state['accumulated_text'] = st.session_state['accumulated_text'][:-1]
        st.session_state['text_area_value'] = st.session_state['accumulated_text']
        st.rerun()

with c4:
    if st.button("Clear All"):
        st.session_state['accumulated_text'] = ""
        st.session_state['text_area_value'] = ""
        st.rerun()


# Video Logic
run = st.checkbox('Start Camera', value=False)

if run:
    cap = cv2.VideoCapture(0)
    stop_button = st.button("Stop Camera") # Another way to stop
    
    while cap.isOpened() and not stop_button:
        ret, frame = cap.read()
        if not ret:
            st.error("Failed to capture video")
            break
            
        frame = cv2.flip(frame, 1)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        results = hands.process(rgb_frame)
        
        pred = "..."
        
        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                mp_draw.draw_landmarks(
                    frame, hand_landmarks, mp.solutions.hands.HAND_CONNECTIONS
                )
                
                # Predict
                pred = classifier.classify(
                    hand_landmarks.landmark, 
                    st.session_state['mode'], 
                    st.session_state['language']
                )
                
                # Update Session State for buttons to use
                # Note: We can't update session_state safely in loop for UI triggers, 
                # but we can read it. To update 'last_pred' for the buttons:
                # We can't easily modifying st.session_state causes reruns? No, only widget interaction.
                # But we can assign values.
                st.session_state['last_pred'] = pred

        # Draw Prediction on Frame
        cv2.putText(frame, pred, (50, 80), cv2.FONT_HERSHEY_SIMPLEX, 2, (100, 255, 100), 3)

        # Update Video
        frame_placeholder.image(frame, channels="BGR", use_column_width=True)
        
        # Update Result Text Component (Real-time feedback)
        # result_placeholder.info(f"Detected: {pred}")

        if stop_button:
            break
            
    cap.release()
else:
    st.write("Camera stopped. Checked 'Start Camera' to begin.")
