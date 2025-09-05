import React from 'react';
import Avatar from 'react-avatar';
import './Client.css';

function Client({ username, isSidebarCollapsed = false }) {
  return (
    <div className={`client-item ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="client-avatar-wrapper">
        <Avatar 
          name={username} 
          size={isSidebarCollapsed ? 40 : 45} 
          round="50%" 
          textSizeRatio={2}
          className="client-avatar"
          color={getAvatarColor(username)}
        />
      </div>
      {!isSidebarCollapsed && (
        <div className="client-info">
          <span className="client-name">{username}</span>
          {/* <span className="client-status">Online</span> */}
        </div>
      )}
    </div>
  );
}

// Helper function to generate consistent colors for each username
function getAvatarColor(username) {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', 
    '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43'
  ];
  
  // Simple hash function to get consistent color for each username
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

export default Client;