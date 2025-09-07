import React, { useState } from "react";
import { ChatBotProvider } from "react-chatbotify";
import { chatbotConfig } from "../chatbot/config";

const FaqBubble = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 1000 }}>
      {isOpen && (
        <ChatBotProvider config={chatbotConfig}>
          <div style={{ width: 320, height: 400, backgroundColor: "white" }}>
            {/* Your Chatbot UI here */}
            <p>Chatbot loaded</p>
          </div>
        </ChatBotProvider>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          backgroundColor: "#007BFF",
          color: "white",
          padding: "10px 15px",
          borderRadius: "50%",
          border: "none",
          cursor: "pointer",
          fontSize: 18,
        }}
      >
        💬
      </button>
    </div>
  );
};

export default FaqBubble;
