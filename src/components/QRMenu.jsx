import React, { useState, useEffect, useRef, useMemo } from 'react';
import { QrCode as QrIcon, Scan, Share2, X, Copy, Check, Image as ImageIcon, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import TransactionForm from './TransactionForm';

const QRMenu = () => {
  const { user, loading } = useAuth();
  const { showNotification } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('scan');
  const [amount, setAmount] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const html5QrCode = useRef(null);

  const qrValue = useMemo(() => {
    if (!user?.email) return "";
    return JSON.stringify({
      email: user.email,
      amount: amount ? parseFloat(amount) : 0,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim()
    });
  }, [user?.email, user?.first_name, user?.last_name, amount]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    if (isOpen) {
      stopScanner();
    }
  };

  const startScanner = async () => {
    if (!html5QrCode.current && scannerRef.current) {
      html5QrCode.current = new Html5Qrcode("qr-reader");
    }

    if (html5QrCode.current && !html5QrCode.current.isScanning) {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          await html5QrCode.current.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            (decodedText) => {
              handleScanSuccess(decodedText);
            },
            (errorMessage) => {
              // ignore
            }
          );
        }
      } catch (err) {
        console.error("Start error:", err);
      }
    }
  };

  const stopScanner = async () => {
    if (html5QrCode.current && html5QrCode.current.isScanning) {
      try {
        await html5QrCode.current.stop();
      } catch (err) {
        // Already stopping
      }
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'scan' && !showTransactionForm) {
      startScanner();
    } else {
      stopScanner();
    }
    return () => { stopScanner(); };
  }, [isOpen, activeTab, showTransactionForm]);

  const handleScanSuccess = (decodedText) => {
    try {
      const data = JSON.parse(decodedText);
      if (data.email) {
        setScanResult(data);
        setShowTransactionForm(true);
        stopScanner();
      }
    } catch (e) {
      if (decodedText.includes('@')) {
        setScanResult({ email: decodedText, amount: '' });
        setShowTransactionForm(true);
        stopScanner();
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Stop camera if running
    await stopScanner();

    if (!html5QrCode.current) {
      html5QrCode.current = new Html5Qrcode("qr-reader");
    }

    setIsProcessingFile(true);
    try {
      const decodedText = await html5QrCode.current.scanFile(file, true);
      handleScanSuccess(decodedText);
    } catch (err) {
      showNotification("No valid QR code found in the image", "error");
      // Restart scanner if it was supposed to be running
      if (isOpen && activeTab === 'scan' && !showTransactionForm) {
        startScanner();
      }
    } finally {
      setIsProcessingFile(false);
      e.target.value = ""; // Reset input
    }
  };

  const copyEmail = () => {
    if (user?.email) {
      navigator.clipboard.writeText(user.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadQR = () => {
    const svg = document.querySelector(".qr-card-inner svg");
    if (!svg) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = 1024;
      canvas.height = 1024;
      // White background
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, 1024, 1024);
      
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `QR_${user?.first_name || 'Expenser'}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
      showNotification("QR Code saved to gallery!", "success");
    };
    img.src = url;
  };

  if (loading && !user) return null;

  return (
    <div className="qr-menu-container">
      <div className={`qr-expand-panel ${isOpen ? 'open' : ''}`}>
        <div className="qr-header">
          <div className="qr-tabs">
            <button className={`qr-tab ${activeTab === 'scan' ? 'active' : ''}`} onClick={() => { setActiveTab('scan'); setShowTransactionForm(false); }}>
              <Scan size={18} />
              <span>Scan</span>
            </button>
            <button className={`qr-tab ${activeTab === 'share' ? 'active' : ''}`} onClick={() => setActiveTab('share')}>
              <Share2 size={18} />
              <span>Share</span>
            </button>
          </div>
          <button className="qr-close" onClick={toggleMenu}><X size={20} /></button>
        </div>

        <div className="qr-content animate-fade-in" key={activeTab}>
          {activeTab === 'scan' ? (
            <div className="scan-section">
              {showTransactionForm ? (
                <TransactionForm 
                  type="SEND" 
                  initialData={{ target_email: scanResult.email, amount: scanResult.amount }}
                  onSuccess={() => { setShowTransactionForm(false); setIsOpen(false); }}
                  onCancel={() => setShowTransactionForm(false)}
                />
              ) : (
                <div className="scan-controls-container">
                  <div className="qr-reader-container">
                    <div id="qr-reader" ref={scannerRef}></div>
                    <div className="scan-overlay-text">Align QR code inside the frame</div>
                  </div>
                  
                  <div className="file-upload-divider">
                    <span>OR</span>
                  </div>

                  <button 
                    className="btn btn-secondary file-upload-btn" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingFile}
                  >
                    <ImageIcon size={18} />
                    <span>{isProcessingFile ? 'Processing...' : 'Select QR from Gallery'}</span>
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    accept="image/*" 
                    onChange={handleFileUpload}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="share-section">
              <div className="qr-card-outer">
                {qrValue ? (
                  <div className="qr-card-inner">
                    <QRCodeSVG 
                      value={qrValue}
                      size={256}
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                ) : (
                  <div className="qr-loading">Generating QR...</div>
                )}
              </div>
              
              <button className="btn btn-primary download-qr-btn" onClick={downloadQR}>
                <Download size={18} />
                <span>Save to Gallery</span>
              </button>

              <div className="share-details">
                <h3>{user?.first_name} {user?.last_name}</h3>
                <div className="email-copy-row" onClick={copyEmail}>
                  <span>{user?.email}</span>
                  {copied ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
                </div>
              </div>

              <div className="amount-input-box">
                <label>Add Amount (Optional)</label>
                <div className="input-with-chips">
                  <input type="number" className="input-field" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
                  <div className="amount-chips">
                    {[10, 50, 100, 500].map(v => (
                      <button key={v} className={`chip-btn ${amount === String(v) ? 'active' : ''}`} onClick={() => setAmount(v)}>रू{v}</button>
                    ))}
                    <button className="chip-btn" onClick={() => setAmount('')}>Clear</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="scan-btn-outer" onClick={toggleMenu}>
        <div className={`scan-btn ${isOpen ? 'active' : ''}`}>
          <QrIcon size={32} />
        </div>
      </div>

      <style>{`
        .qr-menu-container { position: relative; }
        .qr-expand-panel {
          position: fixed;
          bottom: -120%;
          left: 50%;
          transform: translateX(-50%);
          width: min(calc(100% - 24px), 480px);
          background: var(--surface);
          border-radius: 24px;
          box-shadow: var(--shadow-lg);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 2000;
          max-height: 85vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          border: 1px solid var(--border);
        }
        .qr-expand-panel.open { bottom: 90px; }
        .qr-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
          background: var(--surface);
        }
        .qr-tabs {
          display: flex;
          background: var(--background);
          padding: 4px;
          border-radius: 14px;
          gap: 4px;
        }
        .qr-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-muted);
          background: transparent;
        }
        .qr-tab.active {
          background: var(--surface);
          color: var(--primary);
          box-shadow: var(--shadow-sm);
        }
        .qr-close {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--background);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
        }
        .qr-content { padding: 24px; flex: 1; overflow-y: auto; }
        .scan-controls-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .qr-reader-container {
          width: 100%;
          border-radius: 20px;
          overflow: hidden;
          background: #000;
          position: relative;
        }
        #qr-reader { width: 100% !important; border: none !important; }
        .scan-overlay-text {
          position: absolute;
          bottom: 20px;
          left: 0;
          right: 0;
          text-align: center;
          color: white;
          font-size: 0.8rem;
          background: rgba(0,0,0,0.4);
          padding: 8px;
          backdrop-filter: blur(4px);
        }
        .file-upload-divider {
          display: flex;
          align-items: center;
          text-align: center;
          color: var(--text-light);
          font-size: 0.8rem;
          font-weight: 700;
        }
        .file-upload-divider::before,
        .file-upload-divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid var(--border);
        }
        .file-upload-divider span {
          padding: 0 10px;
        }
        .file-upload-btn {
          width: 100%;
          border-style: dashed;
          background: var(--accent);
          padding: 16px;
        }
        .download-qr-btn {
          width: 100%;
          border-radius: 16px;
          margin-top: -8px;
        }
        .share-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
        }
        .qr-card-outer {
          padding: 24px;
          background: white;
          border-radius: 24px;
          box-shadow: var(--shadow-md);
          border: 1px solid var(--border);
          width: 100%;
          max-width: 280px;
          min-height: 280px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .share-details { text-align: center; }
        .share-details h3 { font-size: 1.4rem; margin-bottom: 6px; }
        .email-copy-row {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px 12px;
          background: var(--background);
          border-radius: 20px;
          font-size: 0.9rem;
        }
        .amount-input-box { width: 100%; display: flex; flex-direction: column; gap: 10px; }
        .amount-input-box label { font-weight: 600; color: var(--text-main); font-size: 0.9rem; }
        .amount-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
        .chip-btn {
          padding: 6px 14px;
          border-radius: 20px;
          background: var(--surface);
          border: 1.5px solid var(--border);
          font-weight: 600;
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .chip-btn.active {
          background: var(--accent);
          color: var(--primary);
          border-color: var(--primary);
        }
        @media (max-width: 480px) {
          .qr-expand-panel.open { bottom: 80px; }
          .qr-content { padding: 16px; }
        }
      `}</style>
    </div>
  );
};

export default QRMenu;
