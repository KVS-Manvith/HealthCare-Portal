import React, { useState } from "react";

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{from: "bot"|"user"; text: string}[]>([
    { from: "bot", text: "Hello! I'm your AI Health Assistant. How can I help today?" }
  ]);
  const [text, setText] = useState("");

  function send() {
    if (!text.trim()) return;
    setMessages((m) => [...m, { from: "user", text }]);
    setText("");
    setTimeout(() => {
      setMessages((m) => [...m, { from: "bot", text: "Sorry, I cannot answer medical questions yet. This is a placeholder." }]);
    }, 700);
  }

  return (
    <>
      <div className={`chatbot ${open ? "open" : ""}`}>
        <div className="chatbot-header">
          <span>AI Health Assistant</span>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close chatbot">×</button>
        </div>
        <div className="chatbot-body">
          {messages.map((m, i) => (
            <div key={i} className={`message ${m.from === "bot" ? "bot" : "user"}`}>{m.text}</div>
          ))}
        </div>
        <div className="chatbot-input">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a question..." />
          <button onClick={send}>Send</button>
        </div>
      </div>

      <button type="button" className="chatbot-toggle" onClick={() => setOpen((o) => !o)} aria-label="Toggle chatbot">
        <i className="fas fa-comment-dots"></i>
      </button>
    </>
  );
}
