import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNotification } from '../context/NotificationContext';

const SuccessModal = ({ isOpen, message, onClose }) => {
  const { soundEnabled } = useNotification();

  useEffect(() => {
    if (isOpen) {
      // Play success sound
      if (soundEnabled) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
        oscillator.frequency.exponentialRampToValueAtTime(1320, audioContext.currentTime + 0.1); // E6

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
      }

      const timer = setTimeout(() => {
        onClose();
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose, soundEnabled]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="modal-overlay success-modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content animate-scale-up success-modal-content" style={{ textAlign: 'center', padding: '40px', maxWidth: '420px' }}>
        <div className="success-icon-wrapper">
          <svg className="success-checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className="success-checkmark__circle" cx="26" cy="26" r="25" fill="none" />
            <path className="success-checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
        </div>
        <h2 className="success-title">Payment Sent!</h2>
        <p className="success-message-text">{message}</p>
        
        <div className="success-footer">
          <button 
            className="btn btn-primary success-btn" 
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
      <style>{`
        .success-modal-overlay {
          background: rgba(26, 35, 50, 0.4);
          backdrop-filter: blur(6px);
        }
        .success-modal-content {
          border: 1px solid var(--border);
          box-shadow: var(--shadow-lg);
          background: var(--surface);
          border-radius: var(--radius-xl);
          position: relative;
        }
        .success-icon-wrapper {
          background: var(--success-light);
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
        }
        .success-checkmark {
          width: 48px;
          height: 48px;
          stroke: var(--success);
          stroke-width: 3;
        }
        .success-title {
          font-size: 1.8rem;
          color: var(--text-main);
          margin-bottom: 12px;
          font-weight: 700;
        }
        .success-message-text {
          color: var(--text-muted);
          font-size: 1rem;
          line-height: 1.6;
          margin-bottom: 8px;
        }
        .success-footer {
          margin-top: 32px;
        }
        .success-btn {
          width: 100%;
          height: 54px;
          font-size: 1rem;
          border-radius: var(--radius-lg);
        }
        
        /* Animation refinement */
        .success-checkmark__circle {
          stroke: var(--success);
        }
        .success-checkmark__check {
          stroke: var(--success);
        }
      `}</style>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default SuccessModal;


