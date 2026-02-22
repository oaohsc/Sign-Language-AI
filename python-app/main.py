
import cv2
import mediapipe as mp
import numpy as np
import pyttsx3
import time
from sign_classifier import SignClassifier
from PIL import Image, ImageDraw, ImageFont
import arabic_reshaper
from bidi.algorithm import get_display

class SignLanguageApp:
    def __init__(self):
        # Init Camera
        self.cap = cv2.VideoCapture(0)
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

        # Init API
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.5
        )
        self.mp_draw = mp.solutions.drawing_utils
        self.draw_spec = self.mp_draw.DrawingSpec(color=(121, 22, 76), thickness=2, circle_radius=4)
        self.line_spec = self.mp_draw.DrawingSpec(color=(250, 44, 250), thickness=2, circle_radius=2)

        # Classifier
        self.classifier = SignClassifier()
        
        # State
        self.language = 'EN' # EN | AR
        self.mode = 'LETTERS' # LETTERS | WORDS
        self.last_pred = ""
        self.pred_buffer = [] # For smoothing
        self.accumulated_text = ""  # Text field: detected letters/words appear here
        self.last_appended_sign = ""
        self.stable_sign_since = 0   # When we first saw the current stable sign (for 1.5s delay)
        self.current_stable_sign = ""
        
        # TTS
        self.engine = pyttsx3.init()
        self.last_speak_time = 0

    def run(self):
        print("Starting Sign Language App...")
        print("Controls: 'l' to switch Language, 'm' to switch Mode, 'q' to Quit")
        
        while self.cap.isOpened():
            success, image = self.cap.read()
            if not success:
                print("Ignoring empty camera frame.")
                continue

            # Flip & Convert
            image = cv2.flip(image, 1)
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Process
            results = self.hands.process(image_rgb)
            
            current_sign = "..."
            
            if results.multi_hand_landmarks:
                for hand_landmarks in results.multi_hand_landmarks:
                    # Draw
                    self.mp_draw.draw_landmarks(
                        image, hand_landmarks, self.mp_hands.HAND_CONNECTIONS,
                        self.draw_spec, self.line_spec
                    )
                    
                    # Predict
                    current_sign = self.classifier.classify(hand_landmarks.landmark, self.mode, self.language)
            
            # Smoothing & Logic
            if current_sign != "?" and current_sign != "...":
                self.pred_buffer.append(current_sign)
                if len(self.pred_buffer) > 10: self.pred_buffer.pop(0)
                
                # Check consistency
                if self.pred_buffer.count(current_sign) > 6:
                    final_sign = current_sign
                else:
                    final_sign = self.last_pred
            else:
                final_sign = self.last_pred
                if len(self.pred_buffer) > 0: self.pred_buffer.pop(0)

            # Update Last Pred and auto-append to text field when stable (~1.5s)
            if final_sign != self.last_pred:
                self.last_pred = final_sign
                self.speak(final_sign)

            # Auto-append to text field after holding the same sign for ~1.5s
            t = time.time()
            if final_sign and final_sign not in ("?", "..."):
                if final_sign != self.current_stable_sign:
                    self.current_stable_sign = final_sign
                    self.stable_sign_since = t
                if t - self.stable_sign_since >= 1.5 and final_sign != self.last_appended_sign:
                    if self.mode == 'WORDS' and self.accumulated_text:
                        self.accumulated_text += " " + final_sign
                    else:
                        self.accumulated_text += final_sign
                    self.last_appended_sign = final_sign
            else:
                self.current_stable_sign = ""
                self.last_appended_sign = ""

            # Draw UI
            image = self.draw_ui(image, final_sign)
            
            cv2.imshow('Sign Language Detector', image)
            
            key = cv2.waitKey(5) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('l'):
                self.language = 'AR' if self.language == 'EN' else 'EN'
                self.pred_buffer = []
                self.last_pred = ""
                self.last_appended_sign = ""
                self.current_stable_sign = ""
                print(f"Switched to {self.language}")
            elif key == ord('m'):
                self.mode = 'WORDS' if self.mode == 'LETTERS' else 'LETTERS'
                self.pred_buffer = []
                self.last_pred = ""
                self.last_appended_sign = ""
                self.current_stable_sign = ""
                print(f"Switched to {self.mode}")
            elif key == ord('a'):
                # Manual append current sign to text field
                if final_sign and final_sign not in ("?", "..."):
                    self.accumulated_text += (" " if self.mode == 'WORDS' and self.accumulated_text else "") + final_sign
                    self.last_appended_sign = final_sign
                    self.current_stable_sign = final_sign
                    self.stable_sign_since = time.time()
            elif key == ord('c'):
                self.accumulated_text = ""
                self.last_appended_sign = ""
                self.current_stable_sign = ""

        self.cap.release()
        cv2.destroyAllWindows()

    def speak(self, text):
        if not text or text == "..." or text == "?": return
        current_time = time.time()
        if current_time - self.last_speak_time > 2.0: # Debounce 2 sec
            # Note: pyttsx3 might block loop if not threaded, but simple runAndWait is blocking.
            # We use non-blocking approach if possible or short texts.
            # In simple loop, runAndWait blocks. We can use engine.say but need loop.
            # For this simple script, we might skip full async or use a thread.
            # Let's just print to console for safety in this loop or accept micro-freeze.
            try:
                self.engine.say(text)
                self.engine.runAndWait() 
            except:
                pass
            self.last_speak_time = current_time

    def draw_ui(self, img, text):
        # Convert to PIL for better text rendering (especially Arabic)
        img_pil = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
        draw = ImageDraw.Draw(img_pil)
        
        # UI Config
        W, H = img_pil.size
        
        # Header Box
        draw.rectangle([(0,0), (W, 80)], fill=(30, 30, 30, 200)) # Semi-transparent
        
        # Status Text (and text field hint)
        mode_text = f"Mode: {self.mode} | Lang: {self.language} | 'a'=Append 'c'=Clear"
        draw.text((20, 25), mode_text, font=None, fill=(200, 200, 200))
        
        # Result Box (Bottom Center) - current detection
        box_w, box_h = 400, 100
        bx = (W - box_w) // 2
        by = H - 150
        draw.rectangle([(bx, by), (bx+box_w, by+box_h)], fill=(255, 255, 255, 220), outline=(100,100,255), width=3)
        
        # Text field: accumulated text (detected letters/words appear here)
        field_y = 10
        field_h = 55
        draw.rectangle([(10, field_y), (W - 10, field_y + field_h)], fill=(40, 40, 50), outline=(150, 150, 200))
        display_acc = self.accumulated_text or "(text appears here)"
        try:
            acc_font = ImageFont.truetype("arial.ttf", 28)
        except Exception:
            acc_font = ImageFont.load_default()
        if self.language == 'AR' and display_acc != "(text appears here)":
            try:
                reshaped = arabic_reshaper.reshape(display_acc)
                display_acc = get_display(reshaped)
            except Exception:
                pass
        draw.text((20, field_y + 12), display_acc[:80] + ("..." if len(display_acc) > 80 else ""), font=acc_font, fill=(220, 220, 255))
        
        # Draw Result Text (current sign)
        if text:
            # Handle Arabic
            if self.language == 'AR':
                reshaped_text = arabic_reshaper.reshape(text)
                display_text = get_display(reshaped_text)
                display_font = ImageFont.truetype("arial", 60) # Default font might not support AR. 
                # If arial not found, it falls back. Windows usually has arial.
                # Ideally we need a font path. Let's try default load for now or simple PIL default
                # PIL default doesn't scale well.
                try:
                    display_font = ImageFont.truetype("arialbd.ttf", 60)
                except:
                    display_font = ImageFont.load_default()
            else:
                display_text = text
                try:
                    display_font = ImageFont.truetype("arialbd.ttf", 60)
                except:
                    display_font = ImageFont.load_default()

            # Centering
            try:
                 bbox = draw.textbbox((0,0), display_text, font=display_font)
                 text_w = bbox[2] - bbox[0]
                 text_h = bbox[3] - bbox[1]
                 draw.text((bx + (box_w - text_w)/2, by + (box_h - text_h)/2 - 10), display_text, font=display_font, fill=(0,0,0))
            except:
                 draw.text((bx + 50, by + 20), display_text, fill=(0,0,0))

        return cv2.cvtColor(np.array(img_pil), cv2.COLOR_RGB2BGR)

if __name__ == "__main__":
    app = SignLanguageApp()
    app.run()
