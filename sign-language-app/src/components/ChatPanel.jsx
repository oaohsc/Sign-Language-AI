import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, AlertCircle, Loader2 } from 'lucide-react';
import { sendChatMessage, isChatConfigured } from '../services/chatApi';

export function ChatPanel() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const configured = isChatConfigured();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setError(null);
    const userMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    try {
      const newMessages = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const reply = await sendChatMessage(newMessages);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      const errMsg = err.message || 'Something went wrong';
      setError(errMsg);
      setMessages((prev) => [...prev, { role: 'assistant', content: null, error: errMsg }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="chat-section" id="ai-assistant">
      <div className="section-header">
        <div className="section-icon">
          <Bot size={28} />
        </div>
        <div>
          <h2 className="section-title">AI Assistant</h2>
          <p className="section-subtitle">
            Ask about sign language, fingerspelling, or how to use the app. Powered by an LLM when configured.
          </p>
        </div>
      </div>

      {!configured && (
        <div className="chat-banner chat-banner--info">
          <AlertCircle size={20} />
          <div>
            <strong>No API key set</strong>
            <p>
              To enable the AI assistant, add <code>VITE_OPENAI_API_KEY</code> to a <code>.env</code> file in the
              project root. You can use OpenAI or any OpenAI-compatible API (e.g. Groq, local LLM). Optional:{' '}
              <code>VITE_OPENAI_BASE_URL</code> for a custom endpoint.
            </p>
          </div>
        </div>
      )}

      <div className="chat-window">
        {messages.length === 0 && !loading && (
          <div className="chat-placeholder">
            {configured
              ? 'Ask anything about sign language or this app. For example: "How do I sign Hello in ASL?" or "What letters can the app recognize?"'
              : 'Configure an API key to chat with the AI assistant.'}
          </div>
        )}
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-message chat-message--${msg.role}`}>
              <div className="chat-message-avatar">
                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>
              <div className="chat-message-body">
                {msg.error ? (
                  <span className="chat-error">{msg.error}</span>
                ) : (
                  <span className="chat-text">{msg.content}</span>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="chat-message chat-message--assistant">
              <div className="chat-message-avatar">
                <Bot size={18} />
              </div>
              <div className="chat-message-body chat-message-body--loading">
                <Loader2 size={20} className="spin" />
                <span>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <form className="chat-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={configured ? 'Ask about sign language or the app...' : 'Add API key to enable chat'}
            disabled={!configured || loading}
          />
          <button type="submit" className="chat-send" disabled={!configured || loading || !input.trim()}>
            <Send size={20} />
          </button>
        </form>
      </div>
    </section>
  );
}
