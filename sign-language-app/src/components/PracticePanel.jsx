import React, { useEffect, useRef, useState } from 'react';
import { Target, CheckCircle, XCircle } from 'lucide-react';

const PRACTICE_LETTERS_EN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const PRACTICE_LETTERS_AR = ['أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function PracticePanel({ result, language, onSpeak }) {
  const [target, setTarget] = useState('');
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'tryagain' | null
  const stableRef = useRef(null);
  const stableTimeRef = useRef(0);
  const lastFeedbackRef = useRef(null);

  const letters = language === 'AR' ? PRACTICE_LETTERS_AR : PRACTICE_LETTERS_EN;

  // Set initial target when panel mounts or language changes
  useEffect(() => {
    const list = language === 'AR' ? PRACTICE_LETTERS_AR : PRACTICE_LETTERS_EN;
    setTarget(pickRandom(list));
    setScore(0);
    setAttempts(0);
    setFeedback(null);
    stableRef.current = null;
    lastFeedbackRef.current = null;
  }, [language]);

  // When we don't have a target yet (e.g. letters empty), set one
  useEffect(() => {
    if (!target && letters.length > 0) setTarget(pickRandom(letters));
  }, [target, letters.length]);

  // Check result vs target: correct after ~1.2s same sign, try again if wrong sign held
  useEffect(() => {
    if (!target || feedback) return; // don't check while showing feedback
    const valid = result && result !== '?' && result !== '...' && result !== '🤟';
    const now = Date.now();
    if (valid) {
      if (stableRef.current !== result) {
        stableRef.current = result;
        stableTimeRef.current = now;
      }
      const stableMs = 1200;
      if (now - stableTimeRef.current >= stableMs) {
        if (result === target) {
          setFeedback('correct');
          setScore((s) => s + 1);
          setAttempts((a) => a + 1);
          lastFeedbackRef.current = 'correct';
          onSpeak?.(result);
          // Next target after delay
          const list = language === 'AR' ? PRACTICE_LETTERS_AR : PRACTICE_LETTERS_EN;
          const t = setTimeout(() => {
            setTarget(pickRandom(list));
            setFeedback(null);
            stableRef.current = null;
          }, 1500);
          return () => clearTimeout(t);
        } else {
          setFeedback('tryagain');
          setAttempts((a) => a + 1);
          lastFeedbackRef.current = 'tryagain';
          const t = setTimeout(() => {
            setFeedback(null);
            stableRef.current = null;
          }, 1500);
          return () => clearTimeout(t);
        }
      }
    } else {
      stableRef.current = null;
    }
  }, [result, target, language, feedback, onSpeak]);

  if (!target) return null;

  return (
    <section className="practice-panel">
      <div className="practice-target-card">
        <div className="practice-target-label">
          <Target size={22} />
          <span>{language === 'AR' ? 'امسح الحرف' : 'Sign the letter'}</span>
        </div>
        <div className="practice-target-value" dir={language === 'AR' ? 'rtl' : 'ltr'}>
          {target}
        </div>
      </div>
      <div className="practice-feedback">
        {feedback === 'correct' && (
          <div className="practice-feedback-correct">
            <CheckCircle size={28} />
            <span>{language === 'AR' ? 'صح!' : 'Correct!'}</span>
          </div>
        )}
        {feedback === 'tryagain' && (
          <div className="practice-feedback-try">
            <XCircle size={28} />
            <span>{language === 'AR' ? 'حاول مرة أخرى' : 'Try again'}</span>
          </div>
        )}
      </div>
      <div className="practice-score">
        <span>{language === 'AR' ? 'الإجابات الصحيحة' : 'Correct'}: {score}</span>
        <span>{language === 'AR' ? 'المحاولات' : 'Attempts'}: {attempts}</span>
      </div>
      <p className="practice-hint">
        {language === 'AR'
          ? 'أظهر الحرف للكاميرا وثبّت اليد حوالي ثانية.'
          : 'Show the letter to the camera and hold steady for about a second.'}
      </p>
    </section>
  );
}
