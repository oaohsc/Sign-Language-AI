# GestureAI — Sign Language Translator

A real-time web app to detect and translate sign language (ASL & ArSL) using your camera, with an optional AI assistant and FAQ.

## Features
- **Translator**: Spelling (letters) and whole words in English (ASL) and Arabic (ArSL).
- **Text field**: Detected letters/words appear in an editable text area; hold a sign ~1s to auto-add.
- **Text-to-Speech**: Speak the current detection.
- **AI Assistant**: ChatGPT-like chat for sign language and app questions (optional; requires API key).
- **FAQ**: In-app answers to common questions.
- **Privacy**: Hand tracking runs in the browser (MediaPipe). Only the AI chat uses the API you configure.

## Setup
1. `npm install`
2. `npm run dev`

### AI Assistant (optional)
To enable the in-app AI chat:
1. Copy `.env.example` to `.env`.
2. Set `VITE_OPENAI_API_KEY` to your API key (OpenAI, Groq, or any OpenAI-compatible endpoint).
3. Optionally set `VITE_OPENAI_BASE_URL` for a custom API base URL.

## Recognition notes
The app uses a geometric classifier on hand landmarks. Supported gestures include letters (A–Z style), numbers, and a set of whole words in EN/AR. For best results, use good lighting and keep your hand in view; hold each sign steady for about a second.
