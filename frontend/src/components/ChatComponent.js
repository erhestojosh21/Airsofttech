import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";

const socket = io(`${process.env.REACT_APP_API_URL}`);

const ChatComponent = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef(null);

  const customerId = parseInt(localStorage.getItem("userID"));
  const adminId = 1; // Update with your logic if needed

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/messages/user/${customerId}/employee/${adminId}`
        );
        setMessages(res.data);
      } catch (err) {
        console.error("Failed to load messages", err);
      }
    };

    fetchMessages();

    socket.on("receiveMessage", (msg) => {
      const isForCustomer =
        (parseInt(msg.receiverId) === customerId && msg.receiverType === "user") ||
        (parseInt(msg.senderId) === customerId && msg.senderType === "user");

      if (isForCustomer) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [customerId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const messageData = {
      senderId: customerId,
      senderType: "user",
      receiverId: adminId,
      receiverType: "employee",
      messageText: newMessage,
    };

    socket.emit("sendMessage", messageData);
    setNewMessage("");
  };

  return (
    <div className="chat-container" style={styles.container}>
      <div style={styles.messages}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              ...styles.message,
              alignSelf: msg.senderType === "user" ? "flex-end" : "flex-start",
              backgroundColor: msg.senderType === "user" ? "#d1ffd6" : "#e0e0e0",
            }}
          >
            {msg.messageText}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div style={styles.inputBox}>
        <input
          style={styles.input}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
        />
        <button style={styles.button} onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: 400,
    height: 500,
    border: "1px solid #ccc",
    display: "flex",
    flexDirection: "column",
  },
  messages: {
    flex: 1,
    padding: 10,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  message: {
    padding: "8px 12px",
    borderRadius: "12px",
    maxWidth: "70%",
  },
  inputBox: {
    display: "flex",
    padding: "10px",
    borderTop: "1px solid #ccc",
  },
  input: {
    flex: 1,
    padding: "8px",
  },
  button: {
    marginLeft: "10px",
    padding: "8px 12px",
  },
};

export default ChatComponent;