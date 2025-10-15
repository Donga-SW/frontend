"use client";
import { useState, useEffect } from "react";

const ChatBot = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        width: "360px",
        height: "520px",
        zIndex: 9999,
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        backgroundColor: "#fff",
      }}
    >
      <iframe
        src="https://www.chatbase.co/chatbot-iframe/0COuCQgQhe8IBy92mJT8P"
        width="100%"
        height="100%"
        style={{
          border: "none",
        }}
        allow="microphone"
      />
    </div>
  );
};

export default ChatBot;
