import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaQuestionCircle, FaTimes, FaUser, FaRobot, FaPaperPlane, FaChevronDown, FaChevronUp, FaUserTie } from 'react-icons/fa';
import './EnhancedFAQChat.css';
import { IoChatboxEllipses } from "react-icons/io5";
import { FaNewspaper } from "react-icons/fa";
import { MdOutlineChat } from "react-icons/md";

const EnhancedFAQChat = ({ userID, username }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('faq'); // 'faq' or 'chat'
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);
  const eventSourceRef = useRef(null);

  // Fetch initial messages for the current session
  const fetchSessionMessages = useCallback(async () => {
    if (!sessionId || !userID) return;
    
    try {
      console.log('Fetching initial messages for session:', sessionId);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/chat-sessions/${sessionId}/messages`);
      
      if (response.ok) {
        const sessionMessages = await response.json();
        console.log('Received initial session messages:', sessionMessages);
        
        // Convert backend messages to frontend format
        const formattedMessages = sessionMessages.map(msg => ({
          id: msg.MessageID,
          text: msg.MessageText,
          sender: msg.SenderType === 'user' ? 'user' : (msg.SenderType === 'admin' ? 'admin' : 'bot'),
          timestamp: new Date(msg.Timestamp),
          senderName: msg.SenderName
        }));
        
        setMessages(formattedMessages);
      } else {
        console.error('Failed to fetch session messages:', response.status);
      }
    } catch (error) {
      console.error('Error fetching session messages:', error);
    }
  }, [sessionId, userID]);

  // Set up real-time messaging with Server-Sent Events
  useEffect(() => {
    if (sessionId && userID && activeTab === 'chat') {
      console.log('Setting up real-time messaging for session:', sessionId);
      
      // Initial fetch of messages
      fetchSessionMessages();
      
      // Set up Server-Sent Events for real-time updates
      const eventSource = new EventSource(`${process.env.REACT_APP_API_URL}/api/chat/stream/${sessionId}`);
      eventSourceRef.current = eventSource;
      
      eventSource.onopen = () => {
        console.log('Real-time chat connection established');
      };
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received real-time message:', data);
          
          if (data.type === 'message') {
            const newMessage = {
              id: data.message.MessageID,
              text: data.message.MessageText,
              sender: data.message.SenderType === 'user' ? 'user' : 
                     (data.message.SenderType === 'admin' ? 'admin' : 'bot'),
              timestamp: new Date(data.message.Timestamp),
              senderName: data.message.SenderName
            };
            
            setMessages(prev => {
              // Avoid duplicates
              const exists = prev.some(msg => msg.id === newMessage.id);
              if (exists) return prev;
              return [...prev, newMessage];
            });
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };
      
      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
      };
      
    } else {
      // Close SSE connection when not needed
      if (eventSourceRef.current) {
        console.log('Closing real-time chat connection');
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [sessionId, userID, activeTab, fetchSessionMessages]);

  const checkForExistingSession = useCallback(async () => {
  if (!userID) return;

  try {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/chat/session/${userID}`);
    const data = await response.json();

    if (data.sessionId) {
      setSessionId(data.sessionId);
    }
  } catch (error) {
    console.error('Error checking for existing session:', error);
  }
}, [userID]);

  // Check for existing session on component mount
  useEffect(() => {
    if (userID && !sessionId) {
      checkForExistingSession();
    }
  }, [userID, sessionId, checkForExistingSession]);

  // Static FAQ data
  const faqData = [
    
    {
      id: 2,
      question: "How long does shipping take?",
      answer: "Standard shipping takes 3-5 business days. Express shipping (1-2 days) is available for an additional fee. International orders may take 7-14 business days."
    },
    {
      id: 3,
      question: "Do you offer warranties on airsoft attachments?",
      answer: "No."
    },
    {
      id: 4,
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, PayPal, and Stripe payments. All transactions are secured with SSL encryption."
    },
    {
      id: 5,
      question: "Can I track my order?",
      answer: "Absolutely! Once your order ships, you'll receive a tracking number via email. You can also track your order in your account dashboard."
    },
    {
      id: 6,
      question: "Do you ship internationally?",
      answer: "Yes, we ship to most countries. Shipping costs and delivery times vary by location. Please note that some airsoft products may have import restrictions in certain countries."
    },
    {
      id: 7,
      question: "What if my item arrives damaged?",
      answer: "If your item arrives damaged, please contact us within 48 hours with photos. We'll arrange for a replacement or full refund immediately."
    },
    
  ];

  // Initialize chat with welcome message
  useEffect(() => {
    if (activeTab === 'chat' && messages.length === 0) {
      const welcomeMessage = {
        id: Date.now(),
        text: userID 
          ? `Hi ${username}! I'm here to help with any questions about your orders, products, or account.`
          : "Hi! I'm here to help. Please log in to access live chat support, or check out our FAQ section.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [activeTab, userID, username, messages.length]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    if (!userID) {
      alert('Please log in to use live chat support.');
      return;
    }

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Send to backend chatbot API
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: inputMessage,
          userID: userID,
          username: username,
          sessionId: sessionId
        }),
      });

      const data = await response.json();
      
      // Store session ID if returned
      if (data.sessionId && !sessionId) {
        console.log('Setting new session ID:', data.sessionId);
        setSessionId(data.sessionId);
      }
      
      // Stop typing indicator and fetch latest messages
      setIsTyping(false);
      
      // If we have a session, fetch all messages to get the latest state
      if (data.sessionId || sessionId) {
        setTimeout(() => {
          fetchSessionMessages();
        }, 500);
      } else {
        // Fallback for when no session exists (anonymous chat)
        setTimeout(() => {
          const botMessage = {
            id: Date.now() + 1,
            text: data.reply || "I'm sorry, I didn't understand that. Could you please rephrase your question?",
            sender: 'bot',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botMessage]);
        }, 1000);
      }

    } catch (error) {
      console.error('Chat error:', error);
      setTimeout(() => {
        const errorMessage = {
          id: Date.now() + 1,
          text: "Sorry, I'm having trouble connecting right now. Please try again later or check our FAQ section.",
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsTyping(false);
      }, 1000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleFAQ = (faqId) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div className="faq-chat-bubble" onClick={() => { console.log('Bubble clicked'); setIsOpen(true); }}>
        <MdOutlineChat size={26} />
        {!isOpen && <span className="bubble-text">Chat</span>}
      </div>

      {/* Chat Window */}
      {isOpen && (console.log('Rendering faq-chat-window'),
        <div className={`faq-chat-window${isOpen ? ' open' : ''}`}>
          {/* Header */}
          <div className="faq-chat-header">
            <div className="header-tabs">
              <button 
                className={`tab-button ${activeTab === 'faq' ? 'active' : ''}`}
                onClick={() => { console.log('FAQ tab clicked'); setActiveTab('faq'); }}
              >
                <FaNewspaper /> FAQ
              </button>
              <button 
                className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
                onClick={() => setActiveTab('chat')}
              >
                <IoChatboxEllipses /> Ask EdGi
                {!userID && <span className="login-required">*</span>}
              </button>
            </div>
            <button className="close-chat" onClick={() => setIsOpen(false)}>
              <FaTimes />
            </button>
          </div>

          {/* Content */}
          <div className="faq-chat-content">
            {activeTab === 'faq' ? (
              /* FAQ Section */
              <div className="faq-section">
                <div className="faq-header">
                  <h3>Frequently Asked Questions</h3>
                  <p>Find quick answers to common questions</p>
                </div>
                <div className="faq-list">
                  {faqData.map((faq) => (
                    <div key={faq.id} className="faq-item">
                      <div 
                        className="faq-question"
                        onClick={() => toggleFAQ(faq.id)}
                      >
                        <span>{faq.question}</span>
                        {expandedFAQ === faq.id ? <FaChevronUp /> : <FaChevronDown />}
                      </div>
                      {expandedFAQ === faq.id && (
                        <div className="faq-answer">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="faq-footer">
                  <p>Still need help? <a onClick={() => setActiveTab('chat')}>{userID ? 'Switch to Live Chat!' : 'Please log in to access live chat support.'}</a></p>
                </div>
              </div>
            ) : (
              /* Live Chat Section */
              <div className="chat-section">
                {!userID ? (
                  <div className="login-prompt">
                    <FaUser size={48} />
                    <h3>Login Required</h3>
                    <p>Please log in to your account to access live chat support with our team.</p>
                    <button className="login-button" onClick={() => window.location.href = '/login'}>
                      Go to Login
                    </button>
                  </div>
                ) : (
                  <>

                    <div className="chat-messages">
                      {messages.map((message) => (
                        <div key={message.id} className={`message ${message.sender}`}>
                          
                          <div className="message-content">
                            {message.sender === 'admin' && message.senderName && (
                              <div className="admin-name">ADMIN</div> 
                            )}
                            <div className="message-text">{message.text}</div>
                            <div className="message-time">{formatTime(message.timestamp)}</div>
                            
                          </div>
                          
                        </div>
                      ))}
                      {isTyping && (
                        <div className="message bot">
                          <div className="message-content">
                            <div className="typing-indicator">
                              <span></span>
                              <span></span>
                              <span></span>
                            </div>
                          </div>
                          <div className="message-avatar">
                            <FaRobot />
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                    <div className="chat-input">
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        disabled={isTyping}
                      />
                      <button 
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || isTyping}
                        className="send-button"
                      >
                        <FaPaperPlane />
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default EnhancedFAQChat;
