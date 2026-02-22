import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const FAQ_ITEMS = [
  {
    q: 'How do I use the sign language translator?',
    a: 'Allow camera access, then show your hand to the camera. Switch between "Spelling" (letters) and "Words" mode with the mode button. Hold a sign steady for about 1 second and it will be added to the text field automatically, or use "Append" to add the current detection manually.',
  },
  {
    q: 'Which languages are supported?',
    a: 'The app supports English (ASL – American Sign Language) and Arabic (ArSL) for both letters and whole words. Use the language toggle in the header to switch.',
  },
  {
    q: 'Why is my sign not recognized?',
    a: 'Make sure your hand is well lit and fully in view. Keep the same sign steady for a moment so the model can lock on. Some signs look similar (e.g. U and V); try adjusting hand angle. In Words mode, only a fixed set of gestures are mapped to words.',
  },
  {
    q: 'How does the AI Assistant work?',
    a: 'The AI Assistant uses an LLM (e.g. OpenAI-compatible API) to answer questions about sign language and the app. Add your API key in a .env file (VITE_OPENAI_API_KEY) to enable it. You can use OpenAI, Groq, or any compatible endpoint.',
  },
  {
    q: 'Can I use this on mobile?',
    a: 'Yes. The web app works on phones and tablets. Grant camera access when prompted. For best results, use a stable surface or stand and good lighting.',
  },
  {
    q: 'Is my video or data sent to a server?',
    a: 'Hand tracking runs in your browser with MediaPipe and is not sent to any server. Only the AI Assistant (when enabled) sends your chat messages to the API you configure.',
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section className="faq-section" id="faq">
      <div className="section-header">
        <div className="section-icon">
          <HelpCircle size={28} />
        </div>
        <div>
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="section-subtitle">Quick answers about the app and sign language recognition.</p>
        </div>
      </div>
      <div className="faq-list">
        {FAQ_ITEMS.map((item, i) => (
          <div
            key={i}
            className={`faq-item ${openIndex === i ? 'faq-item--open' : ''}`}
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
          >
            <div className="faq-question">
              <span>{item.q}</span>
              <ChevronDown size={20} className="faq-chevron" />
            </div>
            <div className="faq-answer">
              <p>{item.a}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
