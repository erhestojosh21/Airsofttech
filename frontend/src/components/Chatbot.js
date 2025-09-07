import React, { useState } from "react";
import "./Chatbot.css";
import Homepage from "../pages/Navigation";

const predefinedQA = {
  "Is airsoft safe?": "Yes, when proper safety gear is used and field rules are followed. Always wear eye protection!",
  "What is the best airsoft gun for beginners?": "A good starter gun is an AEG like the G&G Combat Machine CM16 or Specna Arms SA-C series.",
  "Does airsoft hurt?": "Yes, but the pain varies. It can feel like a rubber band snap, depending on distance and FPS.",
  "What is the difference between airsoft and paintball?": "Airsoft uses 6mm plastic BBs, while paintball uses larger, paint-filled capsules. Airsoft guns look more realistic.",
  "What gear do I need to start playing airsoft?": "At minimum, you need eye protection, a reliable airsoft gun, BBs, and a battery or gas, depending on the gun type."
};

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    const userMessage = input;
    let botResponse = predefinedQA[userMessage] || (
      <span>
        Sorry, I couldn't answer that. Please message us on our Facebook page: 
        <a href="https://www.facebook.com/EdGICustomWorks?rdid=FiTGpiQKMHc5Gngp&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1B6GVXqSgP%2F#" target="_blank" rel="noopener noreferrer">
        https://www.facebook.com/EdGICustomWorks
        </a>
      </span>
    );

    setMessages([...messages, { text: userMessage, sender: "user" }, { text: botResponse, sender: "bot" }]);
    setInput("");
  };

  return (
    <div>
      
    <div className="chat-container">
      
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>{msg.text}</div>
        ))}
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
      <div className="quick-questions">
        {Object.keys(predefinedQA).map((question) => (
          <button key={question} onClick={() => setInput(question)}>{question}</button>
        ))}
      </div>
    </div>
    </div>
  );
};

export default Chatbot;
