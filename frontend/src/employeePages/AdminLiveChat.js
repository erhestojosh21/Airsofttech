import React, { useState, useEffect, useRef } from 'react';
import { 
  FaUser, FaRobot, FaPaperPlane, FaSyncAlt, FaClock, FaTimesCircle, FaBolt, FaEllipsisV, FaReply, FaUserPlus,
  FaUsers, FaFilter, FaSearch, FaCircle, FaUserTie, FaCheckCircle, FaChartLine, FaBars, FaPhone, FaVideo, FaInfoCircle, FaArrowLeft
} from 'react-icons/fa';

import { IoMdSend } from "react-icons/io";
import { jwtDecode } from 'jwt-decode';
import './AdminLiveChat.css'; // Assume this file contains the new CSS

const AdminLiveChat = () => {
  const [chatSessions, setChatSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState({});
  const [replyMessage, setReplyMessage] = useState('');
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(true); // New state for navigation visibility
  const eventSourceRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Get employee info from JWT token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setEmployeeInfo({ 
          employeeId: decoded.employeeId,
          employeeName: decoded.username 
        });
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  // Fetch chat sessions
  const fetchChatSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/chat-sessions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        console.error('Failed to fetch chat sessions:', response.status, response.statusText);
        setChatSessions([]);
        return;
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setChatSessions(data);
      } else {
        console.error('Expected array but got:', typeof data, data);
        setChatSessions([]);
      }
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
    }
  };

  // Fetch chat statistics
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/chat-stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching chat stats:', error);
    }
  };

  // Fetch messages for selected session
  const fetchMessages = async (sessionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/chat-sessions/${sessionId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Send admin reply
  const sendReply = async () => {
    if (!replyMessage.trim() || !selectedSession || !employeeInfo.employeeId) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/chat-sessions/${selectedSession.SessionID}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: replyMessage,
          employeeId: employeeInfo.employeeId,
          employeeName: employeeInfo.employeeName
        }),
      });
      if (response.ok) {
        setReplyMessage('');
        await fetchChatSessions();
      } else {
        console.error('Failed to send reply:', response.status);
      }
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Close chat session
  const closeSession = async (sessionId) => {
    if (!employeeInfo.employeeId) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/chat-sessions/${sessionId}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeId: employeeInfo.employeeId,
          employeeName: employeeInfo.employeeName
        }),
      });
      if (response.ok) {
        await fetchChatSessions();
        if (selectedSession && selectedSession.SessionID === sessionId) {
          setSelectedSession(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Error closing session:', error);
    }
  };

  // Assign session to current admin
  const assignSession = async (sessionId) => {
    if (!employeeInfo.employeeId) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/chat-sessions/${sessionId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeId: employeeInfo.employeeId
        }),
      });
      if (response.ok) {
        await fetchChatSessions();
      }
    } catch (error) {
      console.error('Error assigning session:', error);
    }
  };

  // Handle session selection
  const selectSession = (session) => {
    setSelectedSession(session);
    fetchMessages(session.SessionID);
    setupRealTimeMessaging(session.SessionID);
  };

  // Set up real-time messaging with Server-Sent Events
  const setupRealTimeMessaging = (sessionId) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    const eventSource = new EventSource(`${process.env.REACT_APP_API_URL}/api/chat/stream/${sessionId}`);
    eventSourceRef.current = eventSource;
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'message') {
          const newMessage = {
            MessageID: data.message.MessageID,
            SenderType: data.message.SenderType,
            SenderName: data.message.SenderName,
            MessageText: data.message.MessageText,
            Timestamp: data.message.Timestamp
          };
          setMessages(prev => {
            const exists = prev.some(msg => msg.MessageID === newMessage.MessageID);
            if (exists) return prev;
            return [...prev, newMessage];
          });
        }
      } catch (error) {
        console.error('Error parsing admin SSE message:', error);
      }
    };
    eventSource.onerror = (error) => {
      console.error('Admin SSE connection error:', error);
    };
  };

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial data fetch and cleanup
  useEffect(() => {
    fetchChatSessions();
    fetchStats();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchChatSessions();
      fetchStats();
      if (selectedSession) {
        fetchMessages(selectedSession.SessionID);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedSession]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendReply();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // New function to toggle the navigation panel
  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  return (
    <div className="messenger-container">
      {/* Left Navigation Panel */}
      <div className={`messenger-nav ${isNavOpen ? 'nav-open' : 'nav-closed'}`}>
        <div className="nav-header">
          <button className="nav-toggle-btn" onClick={toggleNav}>
            {isNavOpen ? <FaArrowLeft /> : <FaBars />}
          </button>
          <div className="nav-title">
            <span>Messages</span>
          </div>
          <div className="nav-actions">
            <button className="action-btn-header">
              <FaEllipsisV />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="nav-search-bar">
          <FaSearch />
          <input type="text" placeholder="Search..." />
        </div>

        {/* Chat List */}
        <div className="nav-chat-list">
          {chatSessions.map((session) => (
            <div
              key={session.SessionID}
              className={`nav-chat-item ${selectedSession?.SessionID === session.SessionID ? 'selected' : ''}`}
              onClick={() => selectSession(session)}
            >
              <div className="chat-avatar">
                <FaUser />
              </div>
              <div className="chat-info">
                <div className="chat-name">{session.Username}</div>
                <div className="chat-last-message">
                  {session.LastMessage ? 
                    session.LastMessage.substring(0, 30) + (session.LastMessage.length > 30 ? '...' : '') 
                    : 'No messages yet'
                  }
                </div>
              </div>
              <div className="chat-time">
                {formatTime(session.LastMessageTimestamp || session.StartTime)}
              </div>
            </div>
          ))}
          
          {chatSessions.length === 0 && (
            <div className="no-sessions-nav">
              No active chats
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Panel */}
      <div className="messenger-main">
        {selectedSession ? (
          <>
            {/* Chat Header */}
            <div className="chat-header">
              <div className="header-left">
                <div className="customer-avatar">
                  <FaUser />
                </div>
                <div className="customer-details">
                  <div className="customer-name">{selectedSession.Username}</div>
                </div>
              </div>
              <div className="header-actions">
                <button className="action-btn-chat">
                  <FaInfoCircle />
                </button>
              </div>
            </div>

            {/* Messages Container */}
            <div className="chat-messages-container">
              {messages.map((message) => (
                <div
                  key={message.MessageID}
                  className={`message-bubble ${message.SenderType}`}
                >
                  <div className="message-content-wrapper">
                    <div className="message-text">{message.MessageText}</div>
                    <div className="message-timestamp">{formatTime(message.Timestamp)}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Area */}
            <div className="chat-input-area">
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                disabled={isLoading}
                rows="1"
                className="message-input"
              />
              <button 
                onClick={sendReply}
                disabled={!replyMessage.trim() || isLoading}
                className={`send-button ${isLoading ? 'loading' : ''}`}
              >
                {isLoading ? <FaSyncAlt className="spinning" /> : <IoMdSend />}
              </button>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <FaUserTie size={60} />
            </div>
            <h3>Welcome to Ask EdGi</h3>
            <p>Select a chat from the left panel to begin a conversation.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLiveChat;