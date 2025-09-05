// ==================== CLIENT/Chat.js ====================
import React, { useState, useRef, useEffect } from 'react';
import './Chat.css';
import { ACTIONS } from '../Actions';

function Chat({ socketRef, roomId, username, isChatOpen, onToggleChat }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  const optimisticIdsRef = useRef(new Set()); // track optimistic ids

  useEffect(() => {
    if (!socketRef?.current) return;

    // DEBUG: connection info
    console.log('[Chat] socketRef.current.id=', socketRef.current.id);

    // Listen for chat messages from server
    const onChatMessage = (message) => {
      console.log('[Chat] received chat-message', message);
      console.log('[Chat] current optimistic IDs:', Array.from(optimisticIdsRef.current));
      console.log('[Chat] message from:', message.username, 'current user:', username);
      
      setMessages((prev) => {
        console.log('[Chat] current messages before update:', prev.length);
        
        // If server sent an id that we already added optimistically, avoid duplicate:
        if (message.id && optimisticIdsRef.current.has(message.id)) {
          console.log('[Chat] replacing optimistic message with server message');
          optimisticIdsRef.current.delete(message.id);
          const updatedMessages = prev.map((m) => (m.id === message.id ? { ...message, optimistic: false } : m));
          console.log('[Chat] after replacing optimistic:', updatedMessages.length);
          return updatedMessages;
        }
        
        console.log('[Chat] adding new message from another user');
        const newMessages = [...prev, message];
        console.log('[Chat] after adding new message:', newMessages.length);
        return newMessages;
      });
    };

    // Listen for typing indicators
    const onUserTyping = ({ username: typingUser, isTyping: typing }) => {
      console.log('[Chat] received user-typing', typingUser, typing);
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        if (typing) newSet.add(typingUser);
        else newSet.delete(typingUser);
        return newSet;
      });
    };

    socketRef.current.on(ACTIONS.CHAT_MESSAGE, onChatMessage);
    socketRef.current.on(ACTIONS.USER_TYPING, onUserTyping);

    return () => {
      if (!socketRef?.current) return;
      socketRef.current.off(ACTIONS.CHAT_MESSAGE, onChatMessage);
      socketRef.current.off(ACTIONS.USER_TYPING, onUserTyping);
    };
  }, [socketRef]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !socketRef?.current) return;

    // create optimistic message with id (matching server format)
    const optimisticId = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    const optimisticMsg = {
      id: optimisticId,
      type: 'message',
      username,
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      optimistic: true // flag to help debugging
    };

    // Optimistically show message immediately
    optimisticIdsRef.current.add(optimisticId);
    setMessages(prev => [...prev, optimisticMsg]);
    
    // send to server
    console.log('[Chat] emitting chat-message', { roomId, message: newMessage.trim() });
    socketRef.current.emit(ACTIONS.CHAT_MESSAGE, {
      roomId,
      message: newMessage.trim(),
      optimisticId // Send the optimistic ID to server
    });

    // clear input and stop typing
    setNewMessage('');
    handleStopTyping();
    
    // Scroll after a brief delay to ensure message is rendered
    setTimeout(scrollToBottom, 50);
  };

  const handleTyping = () => {
    if (!isTyping && socketRef?.current) {
      setIsTyping(true);
      socketRef.current.emit(ACTIONS.USER_TYPING, { roomId, isTyping: true });
      
      // auto-stop typing after a short window if user doesn't continue
      setTimeout(() => {
        setIsTyping(false);
        if (socketRef?.current) {
          socketRef.current.emit(ACTIONS.USER_TYPING, { roomId, isTyping: false });
        }
      }, 2500);
    }
  };

  const handleStopTyping = () => {
    if (isTyping && socketRef?.current) {
      setIsTyping(false);
      socketRef.current.emit(ACTIONS.USER_TYPING, { roomId, isTyping: false });
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
                {/* indicate optimistic until confirmed */}
                {msg.optimistic && <div style={{fontSize:10,opacity:0.6}}>sending…</div>}
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

      {typingUsers.size > 0 && (
        <div className="typing-indicator">
          <div className="typing-dots">
            <span></span><span></span><span></span>
          </div>
          <span className="typing-text">
            {Array.from(typingUsers).filter(user => user !== username).join(', ')} {' '}
            {Array.from(typingUsers).filter(user => user !== username).length === 1 ? 'is' : 'are'} typing...
          </span>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="chat-input-form">
        <div className="input-group">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onBlur={handleStopTyping}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
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