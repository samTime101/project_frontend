import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { registerErrorHandler } from '../services/api';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('sound_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const playSound = useCallback((type) => {
    if (!soundEnabled) return;
    
    // Using standard web audio for simple notification sounds
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (type === 'success') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
      oscillator.frequency.exponentialRampToValueAtTime(1320, audioContext.currentTime + 0.1); // E6
    } else if (type === 'error') {
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
      oscillator.frequency.exponentialRampToValueAtTime(220, audioContext.currentTime + 0.2); // A3
    } else {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(660, audioContext.currentTime); // E5
    }

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.3);
  }, [soundEnabled]);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const newValue = !prev;
      localStorage.setItem('sound_enabled', JSON.stringify(newValue));
      return newValue;
    });
  }, []);

  const showNotification = useCallback((message, type = 'info') => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
    playSound(type);
    
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  }, [playSound]);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Register global error handler for API calls
  useEffect(() => {
    registerErrorHandler(showNotification);
  }, [showNotification]);

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle size={20} />;
      case 'error': return <AlertCircle size={20} />;
      case 'warning': return <AlertTriangle size={20} />;
      default: return <Info size={20} />;
    }
  };

  return (
    <NotificationContext.Provider value={{ showNotification, soundEnabled, toggleSound }}>
      {children}
      <div className="notification-container">
        {notifications.map((n) => (
          <div key={n.id} className={`notification ${n.type} animate-slide-in`} onClick={() => removeNotification(n.id)}>
            <div className="notification-icon">
              {getIcon(n.type)}
            </div>
            <div className="notification-content">
              {n.message}
            </div>
            <button className="notification-close">
              <X size={16} />
            </button>
            <div className="notification-progress"></div>
          </div>
        ))}
      </div>
      <style>{`
        .notification-container {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 400px;
          width: calc(100% - 48px);
        }
        .notification {
          background: var(--surface);
          border-radius: 16px;
          padding: 16px 20px;
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--border);
          cursor: pointer;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          gap: 14px;
          transition: all 0.3s ease;
        }
        .notification:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(0,0,0,0.12);
        }
        .notification.success { border-left: 4px solid var(--success); }
        .notification.error { border-left: 4px solid var(--error); }
        .notification.warning { border-left: 4px solid var(--warning); }
        .notification.info { border-left: 4px solid var(--primary); }
        
        .notification-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .notification.success .notification-icon { color: var(--success); }
        .notification.error .notification-icon { color: var(--error); }
        .notification.warning .notification-icon { color: var(--warning); }
        .notification.info .notification-icon { color: var(--primary); }

        .notification-content {
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--text-main);
          flex: 1;
        }
        .notification-close {
          background: transparent;
          color: var(--text-light);
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .notification-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 3px;
          background: rgba(0,0,0,0.05);
          width: 100%;
          animation: progress 5s linear forwards;
        }
        .notification.success .notification-progress { background: var(--success); }
        .notification.error .notification-progress { background: var(--error); }
        .notification.warning .notification-progress { background: var(--warning); }
        .notification.info .notification-progress { background: var(--primary); }

        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }

        @media (max-width: 480px) {
          .notification-container {
            top: 16px;
            right: 16px;
            left: 16px;
            width: auto;
          }
        }
      `}</style>
    </NotificationContext.Provider>
  );
};
