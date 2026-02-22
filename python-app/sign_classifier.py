
import math

class SignClassifier:
    def __init__(self):
        pass

    def get_fingers_status(self, landmarks):
        """
        Returns a list of 5 booleans [Thumb, Index, Middle, Ring, Pinky]
        True = Open/Extended, False = Closed/Bent
        """
        fingers = []
        
        # Landmarks
        # Thumb: 1-4, Index: 5-8, Middle: 9-12, Ring: 13-16, Pinky: 17-20
        # Wrist: 0
        
        # Thumb: Check if tip is outer than IP joint (relative to x axis for vertical hand)
        # But for general cases, we check distance from pinky base (17) or wrist.
        # Simple heuristic: Check x-distance of tip(4) vs IP(3) relative to hand orientation.
        # Improved: Check if Tip is further from Palm Center (approx Node 9) than IP is.
        # But standard is: x coord for side view.
        # Let's use simpler: Tip is to the "outside" of the hand. 
        # Assuming Righthand: Open if x < x_mcp (screen coords, so left is smaller x)
        # Actually, let's just check if Tip(4) is farther from PinkyMCP(17) than IP(3) is.
        
        # We need to act on Handedness. But let's assume one hand for now or dynamic.
        # Let's use the standard "Tip y < PIP y" for fingers 2-5
        
        # Index (8 vs 6), Middle (12 vs 10), Ring (16 vs 14), Pinky (20 vs 18)
        # Y is 0 at top. So Open if Tip < PIP
        
        for tip, pip in [(8,6), (12,10), (16,14), (20,18)]:
            if landmarks[tip].y < landmarks[pip].y:
                fingers.append(True)
            else:
                fingers.append(False)
                
        # Thumb Logic (Index 0 in our list, effectively prepended)
        # Thumb is open if tip(4) x is outside hand bounding box or just far from index mcp(5)
        # Simple x check: if hand is "up", thumb open means x difference between 4 and 5 is large.
        # Let's try: if distance(4, 17) > distance(3, 17)
        # Actually, let's use a very simple check: 
        # Is tip(4) x coordinate "far" from index_mcp(5).
        # We can implement a "is_thumb_open" that works for both hands based on relative x.
        # Just use: Is thumb tip to the left (for right hand) or right (left hand) of index finger?
        # A simple robust check: distance from Wrist(0) to Tip(4) > distance from Wrist(0) to IP(3) * 1.1        
        d_wrist_tip = math.hypot(landmarks[4].x - landmarks[0].x, landmarks[4].y - landmarks[0].y)
        d_wrist_ip = math.hypot(landmarks[3].x - landmarks[0].x, landmarks[3].y - landmarks[0].y)
        
        thumb_open = d_wrist_tip > d_wrist_ip
        fingers.insert(0, thumb_open)
        
        return fingers

    def classify(self, landmarks, mode='LETTERS', language='EN'):
        fingers = self.get_fingers_status(landmarks)
        # fingers: [Thumb, Index, Middle, Ring, Pinky]
        
        if mode == 'LETTERS':
            if language == 'EN':
                return self._classify_asl(fingers, landmarks)
            else:
                return self._classify_arsl(fingers, landmarks)
        else: # WORDS
            if language == 'EN':
                return self._classify_words_en(fingers)
            else:
                return self._classify_words_ar(fingers)

    def _classify_asl(self, f, lm):
        # f = [Thumb, Index, Middle, Ring, Pinky]
        
        # Priority checks
        if f == [1, 0, 1, 1, 1]: return "F" # OK Sign (Index not open, Thumb open? Wait. OK is Index+Thumb touch. Index OPEN? No, Index+Thumb circle. Index is 'Closed' in direction check usually? Or we need custom heuristic.)
        # JS Logic for F: !f.index && f.middle && f.ring && f.pinky
        if f == [0, 0, 1, 1, 1]: return "F" # Standard OK (Thumb+Index closed circle, others open)
        if f == [1, 0, 1, 1, 1]: return "F" # Sometimes thumb reads as open

        if f == [0, 1, 1, 1, 0]: return "W"
        
        # B: 4 Fingers up, thumb tucked (0) or open(1)? JS: !f.thumb. 
        if f == [0, 1, 1, 1, 1]: return "B" # Thumb tucked
        
        # C: All Open/Curved. 
        if f == [1, 1, 1, 1, 1]: return "C" # Or 5. Context.
        
        # E: Four fingers up, pinky down (curved E / claw)
        if f == [1, 1, 1, 1, 0]: return "E"
        
        # I: Pinky Only
        if f == [0, 0, 0, 0, 1]: return "I"
        
        # Y: Pinky + Thumb
        if f == [1, 0, 0, 0, 1]: return "Y"
        
        # L: Index + Thumb
        if f == [1, 1, 0, 0, 0]: return "L"
        
        # V: Index + Middle. Thumb Closed.
        if f == [0, 1, 1, 0, 0]: return "V"
        
        # K: Index + Middle + Thumb (Thumb between)
        if f == [1, 1, 1, 0, 0]: return "K"
        
        # D: Index Only
        if f == [0, 1, 0, 0, 0]: return "D"
        
        # A: Fist + Thumb side (Thumb often reads as Open or special state).
        # S: Fist + Thumb over (Thumb Closed).
        if f == [0, 0, 0, 0, 0]: return "S" # Fist
        if f == [1, 0, 0, 0, 0]: return "A" # Thumb sticking out or side

        # Rock / Spider-man
        if f == [0, 1, 0, 0, 1]: return "🤟"
        
        # N: Ring + Pinky up (N hand shape variant)
        if f == [0, 0, 0, 1, 1]: return "N"
        
        # G: Thumb + Middle (G hand / pointing variant)
        if f == [1, 0, 1, 0, 0]: return "G"
        # H: Index + Ring (H hand variant)
        if f == [0, 1, 0, 1, 0]: return "H"
        # J: Ring only (J requires motion; static variant)
        if f == [0, 0, 0, 1, 0]: return "J"
        # M: Middle only (M hand variant)
        if f == [0, 0, 1, 0, 0]: return "M"
        # O: Thumb + Ring + Pinky (O / curved variant)
        if f == [1, 0, 0, 1, 1]: return "O"
        # P: Thumb + Index + Middle + Ring (P / K variant)
        if f == [1, 0, 1, 1, 0]: return "P"
        # Q: Index + Ring + Pinky
        if f == [0, 1, 0, 1, 1]: return "Q"
        # R: Thumb + Index + Ring (R crossed variant)
        if f == [1, 1, 0, 1, 0]: return "R"
        # T: Thumb + Ring (T hand variant)
        if f == [1, 0, 0, 1, 0]: return "T"
        # U: Thumb + Index + Middle + Pinky (U hand variant)
        if f == [1, 1, 1, 0, 1]: return "U"
        # X: Middle + Ring (X bent-index variant)
        if f == [0, 0, 1, 1, 0]: return "X"
        # Z: Middle + Pinky (Z requires motion; static variant)
        if f == [0, 0, 1, 0, 1]: return "Z"
        
        # Fallback/Extras
        if f == [0, 0, 1, 1, 1]: return "F" 
        
        return "?"

    def _classify_arsl(self, f, lm):
        # Arabic أ–ي (28 letters) — finger patterns [Thumb, Index, Middle, Ring, Pinky]
        
        # أ Aleph: Index up
        if f == [0, 1, 0, 0, 0]: return "أ"
        # ب Ba: Four fingers up
        if f == [0, 1, 1, 1, 1]: return "ب"
        # ت Ta: Index + Middle
        if f == [0, 1, 1, 0, 0]: return "ت"
        # ث Tha: Ring only
        if f == [0, 0, 0, 1, 0]: return "ث"
        # ج Jeem: Middle only
        if f == [0, 0, 1, 0, 0]: return "ج"
        # ح Haa: Middle + Pinky
        if f == [0, 0, 1, 0, 1]: return "ح"
        # خ Khaa: Middle + Ring
        if f == [0, 0, 1, 1, 0]: return "خ"
        # د Dal: Thumb only
        if f == [1, 0, 0, 0, 0]: return "د"
        # ذ Thal: Index + Pinky
        if f == [0, 1, 0, 0, 1]: return "ذ"
        # ر Ra: Thumb + Middle
        if f == [1, 0, 1, 0, 0]: return "ر"
        # ز Zay: Index + Ring
        if f == [0, 1, 0, 1, 0]: return "ز"
        # س Seen: All five open
        if f == [1, 1, 1, 1, 1]: return "س"
        # ش Sheen: Three fingers (W)
        if f == [0, 1, 1, 1, 0]: return "ش"
        # ص Saad: Index + Ring + Pinky
        if f == [0, 1, 0, 1, 1]: return "ص"
        # ض Daad: Thumb + Ring
        if f == [1, 0, 0, 1, 0]: return "ض"
        # ط Taa: Thumb + Ring + Pinky
        if f == [1, 0, 0, 1, 1]: return "ط"
        # ظ Zaa: Thumb + Middle + Ring
        if f == [1, 0, 1, 1, 0]: return "ظ"
        # ع Ain: Thumb + Index + Pinky
        if f == [1, 1, 0, 0, 1]: return "ع"
        # غ Ghain: Thumb + Index + Ring
        if f == [1, 1, 0, 1, 0]: return "غ"
        # ف Faa: OK sign
        if f == [0, 0, 1, 1, 1]: return "ف"
        if f == [1, 0, 1, 1, 1]: return "ف"
        # ق Qaf: Thumb + Index + Middle + Pinky
        if f == [1, 1, 1, 0, 1]: return "ق"
        # ك Kaf: K shape
        if f == [1, 1, 1, 0, 0]: return "ك"
        # ل Lam: L shape
        if f == [1, 1, 0, 0, 0]: return "ل"
        # م Meem: Fist
        if f == [0, 0, 0, 0, 0]: return "م"
        # ن Noon: Ring + Pinky
        if f == [0, 0, 0, 1, 1]: return "ن"
        # ه Ha: Four up, pinky down
        if f == [1, 1, 1, 1, 0]: return "ه"
        # و Waw: Y shape
        if f == [1, 0, 0, 0, 1]: return "و"
        # ي Ya: Pinky only
        if f == [0, 0, 0, 0, 1]: return "ي"
        
        return "?"

    def _classify_words_en(self, f):
        if f == [1, 1, 1, 1, 1]: return "Hello"
        if f == [0, 1, 1, 0, 0]: return "Peace"
        if f == [1, 0, 0, 0, 0]: return "Good"
        if f == [0, 0, 0, 0, 0]: return "Yes"
        if f == [0, 1, 0, 0, 0]: return "One"
        if f == [1, 0, 0, 0, 1]: return "Call Me"
        if f == [1, 1, 0, 0, 1]: return "I Love You"
        if f == [1, 1, 1, 1, 0]: return "Thanks"
        if f == [0, 0, 0, 1, 1]: return "No"
        if f == [0, 0, 1, 0, 0]: return "Please"
        if f == [1, 0, 1, 0, 0]: return "Water"
        if f == [1, 0, 1, 0, 1]: return "Sorry"
        if f == [0, 1, 0, 1, 0]: return "Help"
        if f == [0, 1, 0, 1, 1]: return "More"
        if f == [0, 0, 1, 1, 1]: return "Fine"
        return "..."

    def _classify_words_ar(self, f):
        if f == [1, 1, 1, 1, 1]: return "مرحبا" # Hello
        if f == [0, 1, 1, 0, 0]: return "سلام" # Peace
        if f == [1, 0, 0, 0, 0]: return "تمام" # Good/Ok
        if f == [0, 0, 0, 0, 0]: return "نعم" # Yes
        if f == [1, 1, 0, 0, 1]: return "أحبك" # I love you
        if f == [1, 1, 1, 1, 0]: return "شكراً" # Thanks
        if f == [0, 0, 0, 1, 1]: return "لا" # No
        if f == [0, 0, 1, 0, 0]: return "من فضلك" # Please
        if f == [1, 0, 1, 0, 0]: return "ماء" # Water
        if f == [1, 0, 1, 0, 1]: return "آسف" # Sorry
        if f == [0, 1, 0, 1, 0]: return "مساعدة" # Help
        if f == [0, 1, 0, 1, 1]: return "المزيد" # More
        if f == [0, 0, 1, 1, 1]: return "جيد" # Fine
        return "..."

