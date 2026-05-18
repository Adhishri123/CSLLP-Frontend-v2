import React, { useEffect } from 'react';
import './MessagePopup.css';

const MessagePopup = ({ message, type, onClose, duration = 5000 }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '💡';
    }
  };

  return (
    <div className={`message-popup ${type} show`}>
      <div className="message-content">
        <span className="message-icon">{getIcon()}</span>
        <span className="message-text">{message}</span>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ animationDuration: `${duration}ms` }}></div>
      </div>
    </div>
  );
};

export default MessagePopup;