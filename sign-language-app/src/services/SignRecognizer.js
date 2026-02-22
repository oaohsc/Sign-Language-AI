
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

export class SignRecognizer {
    constructor() {
        this.handLandmarker = null;
        this.runningMode = "VIDEO";
    }

    async initialize() {
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                delegate: "GPU"
            },
            runningMode: this.runningMode,
            numHands: 2
        });
    }

    detect(videoElement, timestamp) {
        if (!this.handLandmarker) return null;
        return this.handLandmarker.detectForVideo(videoElement, timestamp);
    }

    // Basic Geometric Gesture Recognition
    // Returns: { text: string, confidence: number }
    predict(landmarks, mode = 'LETTERS', language = 'EN') {
        if (!landmarks || landmarks.length === 0) return null;

        // We take the first hand for simplicity in this demo
        const hand = landmarks[0];

        // Analyze Finger States
        // 0: Wrist, 1-4: Thumb, 5-8: Index, 9-12: Middle, 13-16: Ring, 17-20: Pinky
        const fingers = {
            thumb: this.isThumbOpen(hand),
            index: this.isFingerOpen(hand, 8, 6, 5),
            middle: this.isFingerOpen(hand, 12, 10, 9),
            ring: this.isFingerOpen(hand, 16, 14, 13),
            pinky: this.isFingerOpen(hand, 20, 18, 17)
        };

        if (mode === 'LETTERS') {
            return this.classifyLetter(fingers, customHelpers(hand), language);
        } else {
            return this.classifyWord(fingers, customHelpers(hand), language);
        }
    }

    isFingerOpen(lm, tip, pip, mcp) {
        // Basic check: Tip is higher (lower y) than PIP
        // Note: Y coordinates are normalized [0,1], 0 is top.
        return lm[tip].y < lm[pip].y;
    }

    isThumbOpen(lm) {
        // Thumb is tricky. Check x-distance relative to mcp/wrist depending on handedness
        // Simplified: Tip x is further from other fingers 
        // This is a rough heuristic
        const wrist = lm[0];
        const tip = lm[4];
        const mcp = lm[2];
        // Check if tip is "outside" relative to the hand center.
        // For now, simple check vs MCP x.
        return Math.abs(tip.x - wrist.x) > Math.abs(mcp.x - wrist.x);
    }
    classifyLetter(f, h, language) {
        let result = "?";

        // English Logic (ASL)
        if (language === 'EN') {
            // Priority checks for specific shapes

            // F: Index+Thumb circle, others open (OK sign)
            if (!f.index && f.middle && f.ring && f.pinky) return "F";

            // W: Index, Middle, Ring up
            if (f.index && f.middle && f.ring && !f.pinky) return "W";

            // B: All 4 fingers up, thumb closed/tucked
            if (f.index && f.middle && f.ring && f.pinky && !f.thumb) return "B";

            // C: All 5 fingers "open" but typically curved. 
            if (f.index && f.middle && f.ring && f.pinky && f.thumb) return "C";

            // E: Four fingers up, pinky down (curved E / claw)
            if (f.index && f.middle && f.ring && !f.pinky && f.thumb) return "E";

            // I: Pinky only
            if (!f.index && !f.middle && !f.ring && f.pinky && !f.thumb) return "I";

            // Y: Pinky and Thumb
            if (!f.index && !f.middle && !f.ring && f.pinky && f.thumb) return "Y";

            // L: Index and Thumb
            if (f.index && !f.middle && !f.ring && !f.pinky && f.thumb) return "L";

            // V: Index and Middle
            if (f.index && f.middle && !f.ring && !f.pinky && !f.thumb) return "V";

            // K: Index and Middle with Thumb (often thumb is between them)
            if (f.index && f.middle && !f.ring && !f.pinky && f.thumb) return "K";

            // D: Index only
            if (f.index && !f.middle && !f.ring && !f.pinky) return "D";

            // A: Fist, thumb on side (All closed except maybe thumb logic)
            // S: Fist, thumb over (All closed)
            if (!f.index && !f.middle && !f.ring && !f.pinky) {
                if (f.thumb) return "A"; // Thumb sticking out/up
                return "S"; // Complete fist
            }

            // Rock/Spider-Man
            if (f.index && !f.middle && !f.ring && f.pinky) return "🤟";

            // N: Ring + Pinky up (N hand shape variant)
            if (!f.index && !f.middle && f.ring && f.pinky && !f.thumb) return "N";

            // G: Thumb + Middle
            if (f.thumb && !f.index && f.middle && !f.ring && !f.pinky) return "G";
            // H: Index + Ring
            if (!f.thumb && f.index && !f.middle && f.ring && !f.pinky) return "H";
            // J: Ring only
            if (!f.thumb && !f.index && !f.middle && f.ring && !f.pinky) return "J";
            // M: Middle only
            if (!f.thumb && !f.index && f.middle && !f.ring && !f.pinky) return "M";
            // O: Thumb + Ring + Pinky
            if (f.thumb && !f.index && !f.middle && f.ring && f.pinky) return "O";
            // P: Thumb + Middle + Ring (no index, no pinky)
            if (f.thumb && !f.index && f.middle && f.ring && !f.pinky) return "P";
            // Q: Index + Ring + Pinky
            if (!f.thumb && f.index && !f.middle && f.ring && f.pinky) return "Q";
            // R: Thumb + Index + Ring
            if (f.thumb && f.index && !f.middle && f.ring && !f.pinky) return "R";
            // T: Thumb + Ring
            if (f.thumb && !f.index && !f.middle && f.ring && !f.pinky) return "T";
            // U: Thumb + Index + Middle + Pinky
            if (f.thumb && f.index && f.middle && !f.ring && f.pinky) return "U";
            // X: Middle + Ring
            if (!f.thumb && !f.index && f.middle && f.ring && !f.pinky) return "X";
            // Z: Middle + Pinky
            if (!f.thumb && !f.index && f.middle && !f.ring && f.pinky) return "Z";
        }

        // Arabic أ–ي (ArSL) — 28 letters
            // Aleph (أ): Index up


            // Ta (ت): Index + Middle Up
            // Ba (ب): All fingers Up
        if (language === 'AR') {
            if (f.index && !f.middle && !f.ring && !f.pinky && !f.thumb) return "أ";
            if (f.index && f.middle && f.ring && f.pinky && !f.thumb) return "ب";
            if (f.index && f.middle && !f.ring && !f.pinky && !f.thumb) return "ت";
            if (!f.thumb && !f.index && !f.middle && f.ring && !f.pinky) return "ث";
            if (!f.thumb && !f.index && f.middle && !f.ring && !f.pinky) return "ج";
            if (!f.thumb && !f.index && f.middle && !f.ring && f.pinky) return "ح";
            if (!f.thumb && !f.index && f.middle && f.ring && !f.pinky) return "خ";
            if (f.thumb && !f.index && !f.middle && !f.ring && !f.pinky) return "د";
            if (!f.thumb && f.index && !f.middle && !f.ring && f.pinky) return "ذ";
            if (f.thumb && !f.index && f.middle && !f.ring && !f.pinky) return "ر";
            if (!f.thumb && f.index && !f.middle && f.ring && !f.pinky) return "ز";
            if (f.index && f.middle && f.ring && f.pinky && f.thumb) return "س";
            if (f.index && f.middle && f.ring && !f.pinky && !f.thumb) return "ش";
            if (!f.thumb && f.index && !f.middle && f.ring && f.pinky) return "ص";
            if (f.thumb && !f.index && !f.middle && f.ring && !f.pinky) return "ض";
            if (f.thumb && !f.index && !f.middle && f.ring && f.pinky) return "ط";
            if (f.thumb && !f.index && f.middle && f.ring && !f.pinky) return "ظ";
            if (f.thumb && f.index && !f.middle && !f.ring && f.pinky) return "ع";
            if (f.thumb && f.index && !f.middle && f.ring && !f.pinky) return "غ";
            if (!f.index && f.middle && f.ring && f.pinky) return "ف";
            if (f.thumb && f.index && f.middle && !f.ring && f.pinky) return "ق";
            if (f.index && f.middle && !f.ring && !f.pinky && f.thumb) return "ك";
            if (f.index && !f.middle && !f.ring && !f.pinky && f.thumb) return "ل";
            if (!f.index && !f.middle && !f.ring && !f.pinky && !f.thumb) return "م";
            if (!f.index && !f.middle && f.ring && f.pinky && !f.thumb) return "ن";
            if (f.index && f.middle && f.ring && !f.pinky && f.thumb) return "ه";
            if (!f.index && !f.middle && !f.ring && f.pinky && f.thumb) return "و";
            if (!f.index && !f.middle && !f.ring && f.pinky && !f.thumb) return "ي";
        }

        return result;
    }

    classifyWord(f, h, language) {
        if (language === 'EN') {
            if (f.index && f.middle && f.ring && f.pinky && f.thumb) return "Hello";
            if (f.index && f.middle && !f.ring && !f.pinky) return "Peace";
            if (f.thumb && !f.index && !f.middle && !f.ring && !f.pinky) return "Good";
            if (!f.index && !f.middle && !f.ring && !f.pinky) return "Yes";
            if (f.index && !f.middle && !f.ring && !f.pinky) return "One";
            if (!f.index && !f.middle && !f.ring && f.pinky && f.thumb) return "Call Me";
            if (f.thumb && f.index && !f.middle && !f.ring && f.pinky) return "I Love You";
            if (f.index && f.middle && f.ring && !f.pinky && f.thumb) return "Thanks";
            if (!f.thumb && !f.index && !f.middle && f.ring && f.pinky) return "No";
            if (!f.thumb && !f.index && f.middle && !f.ring && !f.pinky) return "Please";
            if (f.thumb && !f.index && f.middle && !f.ring && !f.pinky) return "Water";
            if (f.thumb && !f.index && f.middle && !f.ring && f.pinky) return "Sorry";
            if (!f.thumb && f.index && !f.middle && f.ring && !f.pinky) return "Help";
            if (!f.thumb && f.index && !f.middle && f.ring && f.pinky) return "More";
            if (!f.thumb && !f.index && f.middle && f.ring && f.pinky) return "Fine";
        }
        if (language === 'AR') {
            if (f.index && f.middle && f.ring && f.pinky && f.thumb) return "مرحبا";
            if (f.index && f.middle && !f.ring && !f.pinky) return "سلام";
            if (f.thumb && !f.index && !f.middle && !f.ring && !f.pinky) return "تمام";
            if (!f.index && !f.middle && !f.ring && !f.pinky) return "نعم";
            if (f.thumb && f.index && !f.middle && !f.ring && f.pinky) return "أحبك";
            if (f.index && f.middle && f.ring && !f.pinky && f.thumb) return "شكراً";
            if (!f.thumb && !f.index && !f.middle && f.ring && f.pinky) return "لا";
            if (!f.thumb && !f.index && f.middle && !f.ring && !f.pinky) return "من فضلك";
            if (f.thumb && !f.index && f.middle && !f.ring && !f.pinky) return "ماء";
            if (f.thumb && !f.index && f.middle && !f.ring && f.pinky) return "آسف";
            if (!f.thumb && f.index && !f.middle && f.ring && !f.pinky) return "مساعدة";
            if (!f.thumb && f.index && !f.middle && f.ring && f.pinky) return "المزيد";
            if (!f.thumb && !f.index && f.middle && f.ring && f.pinky) return "جيد";
        }
        return "...";
    }
}

function customHelpers(landmarks) {
    return {};
}
