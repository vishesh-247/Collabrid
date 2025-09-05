import React, { useState, useRef, useEffect, useCallback } from 'react';
import './Chat.css';
import { ACTIONS } from '../Actions';

function Chat({ socketRef, roomId, username, isChatOpen, onToggleChat }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  const optimisticIdsRef = useRef(new Set());
  const typingTimeoutRef = useRef(null);

  // Memoized callback to handle chat messages
  const handleChatMessage = useCallback((message) => {
    console.log('Sending message to roomId:', roomId); 
    console.log('[Chat] received chat-message', message);
    
    setMessages((prev) => {
      // Check if this is a duplicate message
      const existingMessage = prev.find(m => m.id === message.id);
      if (existingMessage && !existingMessage.optimistic) {
        console.log('[Chat] ignoring duplicate message');
        return prev;
      }
      
      // If server sent an id that we already added optimistically, replace it
      if (message.id && optimisticIdsRef.current.has(message.id)) {
        console.log('[Chat] replacing optimistic message');
        optimisticIdsRef.current.delete(message.id);
        return prev.map((m) => 
          m.id === message.id 
            ? { ...message, optimistic: false } 
            : m
        );
      }
      
      console.log('[Chat] adding new message');
      return [...prev, message];
    });
  }, []);

  // Memoized callback to handle typing indicators
  const handleUserTyping = useCallback(({ username: typingUser, isTyping: typing }) => {
    console.log('[Chat] received user-typing', typingUser, typing);
    setTypingUsers((prev) => {
      const newSet = new Set(prev);
      if (typing) {
        newSet.add(typingUser);
      } else {
        newSet.delete(typingUser);
      }
      return newSet;
    });
  }, []);

  // Set up socket listeners
  useEffect(() => {
    if (!socketRef?.current) {
      console.log('[Chat] No socket reference available');
      return;
    }

    const socket = socketRef.current;
    console.log('[Chat] Setting up socket listeners, socket ID:', socket.id);

    // Remove any existing listeners to prevent duplicates
    socket.off(ACTIONS.CHAT_MESSAGE, handleChatMessage);
    socket.off(ACTIONS.USER_TYPING, handleUserTyping);

    // Add new listeners
    socket.on(ACTIONS.CHAT_MESSAGE, handleChatMessage);
    socket.on(ACTIONS.USER_TYPING, handleUserTyping);

    return () => {
      console.log('[Chat] Cleaning up socket listeners');
      if (socket) {
        socket.off(ACTIONS.CHAT_MESSAGE, handleChatMessage);
        socket.off(ACTIONS.USER_TYPING, handleUserTyping);
      }
    };
  }, [socketRef.current, handleChatMessage, handleUserTyping]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = useCallback((e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !socketRef?.current) return;

    const trimmedMessage = newMessage.trim();
    
    // Create optimistic message with unique ID
    const optimisticId = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    const optimisticMsg = {
      id: optimisticId,
      type: 'message',
      username,
      message: trimmedMessage,
      timestamp: new Date().toISOString(),
      optimistic: true
    };

    // Add to optimistic IDs tracking
    optimisticIdsRef.current.add(optimisticId);
    
    // Optimistically show message immediately
    setMessages(prev => [...prev, optimisticMsg]);
    
    // Send to server
    console.log('[Chat] emitting chat-message', { 
      roomId, 
      message: trimmedMessage, 
      optimisticId 
    });
    
    socketRef.current.emit(ACTIONS.CHAT_MESSAGE, {
      roomId,
      message: trimmedMessage,
      optimisticId
    });

    // Clear input and stop typing
    setNewMessage('');
    handleStopTyping();
  }, [newMessage, socketRef, roomId, username]);

  const handleTyping = useCallback(() => {
    if (!socketRef?.current) return;
    
    if (!isTyping) {
      setIsTyping(true);
      socketRef.current.emit(ACTIONS.USER_TYPING, { roomId, isTyping: true });
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (socketRef?.current) {
        socketRef.current.emit(ACTIONS.USER_TYPING, { roomId, isTyping: false });
      }
    }, 2500);
  }, [isTyping, socketRef, roomId]);

  const handleStopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    if (isTyping && socketRef?.current) {
      setIsTyping(false);
      socketRef.current.emit(ACTIONS.USER_TYPING, { roomId, isTyping: false });
    }
  }, [isTyping, socketRef, roomId]);

  const handleInputChange = useCallback((e) => {
    setNewMessage(e.target.value);
    handleTyping();
  }, [handleTyping]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  }, [handleSendMessage]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter out current user from typing users
  const otherTypingUsers = Array.from(typingUsers).filter(user => user !== username);

  return (
    <div className={`chat-container ${isChatOpen ? 'open' : ''}`}>
      <div className="chat-header">
        <h6 className="m-0">
          <i className="fas fa-comments me-2"></i>
          Chat
        </h6>
        <button
          className="btn btn-sm chat-toggle"
          onClick={onToggleChat}
          title={isChatOpen ? "Close Chat" : "Open Chat"}
        >
          <i className={`fas fa-${isChatOpen ? 'times' : 'comment'}`}></i>
        </button>
      </div>

      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div
            key={msg.id || msg.timestamp || idx}
            className={`message ${msg.type === 'notification' ? 'notification' : ''} ${msg.username === username ? 'own-message' : ''}`}
          >
            {msg.type === 'message' && (
              <div className="message-content">
                <div className="message-header">
                  <span className="message-username">{msg.username}</span>
                  <span className="message-time">{formatTime(msg.timestamp)}</span>
                </div>
                <div className="message-text">{msg.message}</div>
                {msg.optimistic && (
                  <div style={{fontSize: 10, opacity: 0.6, color: '#999'}}>
                    sending...
                  </div>
                )}
              </div>
            )}
            {msg.type === 'notification' && (
              <div className="notification-message">
                <i className="fas fa-info-circle me-2"></i>
                {msg.message}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {otherTypingUsers.length > 0 && (
        <div className="typing-indicator">
          <div className="typing-dots">
            <span></span><span></span><span></span>
          </div>
          <span className="typing-text">
            {otherTypingUsers.join(', ')} {' '}
            {otherTypingUsers.length === 1 ? 'is' : 'are'} typing...
          </span>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="chat-input-form">
        <div className="input-group">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            onBlur={handleStopTyping}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="form-control chat-input"
            maxLength={500}
          />
          <button
            type="submit"
            className="btn btn-primary chat-send-btn"
            disabled={!newMessage.trim()}
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
        <small className="text-muted message-length">
          {newMessage.length}/500
        </small>
      </form>
    </div>
  );
}

export default Chat;