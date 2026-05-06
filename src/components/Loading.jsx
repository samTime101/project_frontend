import React from 'react';

const Loading = ({ fullPage = false }) => {
  if (!fullPage) {
    return (
      <div className="flex-center" style={{ padding: '20px', width: '100%' }}>
        <div className="loading-spinner" style={{ width: '32px', height: '32px' }} />
      </div>
    );
  }

  return (
    <div className="loading-wrap full-page" style={{ 
      background: 'linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw'
    }}>
      <div style={{ 
        color: 'white', 
        fontSize: '2.5rem', 
        fontWeight: '800', 
        letterSpacing: '6px',
        animation: 'pulse 1.5s ease-in-out infinite'
      }}>
        EXPENSER
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
        .loading-wrap.full-page {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
        }
      `}</style>
    </div>
  );
};

export default Loading;
