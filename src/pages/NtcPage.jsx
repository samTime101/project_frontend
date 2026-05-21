import React, { useEffect, useMemo, useState } from 'react';
import { Radio, RefreshCw, Smartphone, Wifi, Wallet } from 'lucide-react';
import Layout from '../components/Layout';
import { ntcService } from '../services/ntc.service';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import SuccessModal from '../components/SuccessModal';

const EMPTY_CATALOG = { data: [], voice: [] };

const NtcPage = () => {
  const { user, refreshUser } = useAuth();
  const { showNotification } = useNotification();
  const [catalog, setCatalog] = useState(EMPTY_CATALOG);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [activeCategory, setActiveCategory] = useState('data');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const availableBalance = Number(user?.balance || 0);

  const packs = catalog[activeCategory] || [];
  const selectedPack = useMemo(
    () => packs.find((pack) => pack.p_id === selectedPackageId) || null,
    [packs, selectedPackageId]
  );
  const hasEnoughBalance = selectedPack ? availableBalance >= Number(selectedPack.amount) : false;

  const loadCatalog = async () => {
    setLoadingCatalog(true);
    try {
      const response = await ntcService.getPacks();
      setCatalog(response?.data || EMPTY_CATALOG);
    } catch {
      setCatalog(EMPTY_CATALOG);
    } finally {
      setLoadingCatalog(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  useEffect(() => {
    setSelectedPackageId((current) => {
      if (!packs.some((pack) => pack.p_id === current)) {
        return packs[0]?.p_id ?? null;
      }
      return current;
    });
  }, [packs]);

  const resetOtpSession = () => {
    setOtpRequested(false);
    setOtpCode('');
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    resetOtpSession();
  };

  const handlePhoneChange = (event) => {
    setPhoneNumber(event.target.value.replace(/\D/g, '').slice(0, 10));
    resetOtpSession();
  };

  const handlePackSelect = (packageId) => {
    setSelectedPackageId(packageId);
    resetOtpSession();
  };

  const handleSendOtp = async (event) => {
    event.preventDefault();
    if (!selectedPack) {
      showNotification('Select a pack first.', 'warning');
      return;
    }

    setSendingOtp(true);
    try {
      const response = await ntcService.sendOtp({
        phone_number: phoneNumber,
        pack_type: activeCategory,
        package_id: selectedPack.p_id,
      });

      setOtpRequested(true);
      showNotification(response.message || `OTP sent to ${response.phoneNumber}.`, 'success');
    } catch {
      setOtpRequested(false);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleConfirmPurchase = async (event) => {
    event.preventDefault();
    if (!selectedPack || !otpRequested) {
      showNotification('Send OTP first.', 'warning');
      return;
    }

    setConfirming(true);
    try {
      await ntcService.confirmPurchase({
        phone_number: phoneNumber,
        pack_type: activeCategory,
        package_id: selectedPack.p_id,
        otp_code: otpCode,
      });

      setSuccessMessage(
        `${selectedPack.title} purchased successfully and saved to transfer history as Nepal Telecom.`
      );
      setShowSuccess(true);
      resetOtpSession();
      await refreshUser();
      showNotification('Nepal Telecom pack purchased successfully.', 'success');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Layout>
      <SuccessModal isOpen={showSuccess} message={successMessage} onClose={() => setShowSuccess(false)} />
      <div className="section-title">
        <div>
          <h2>Nepal Telecom Packs</h2>
          <p>Buy Nepal Telecom data and voice packs.</p>
        </div>
      </div>

      <div className="service-card ncell-hero-card">
        <div className="ncell-hero-top">
          <div>
            <div className="ncell-kicker">Telecom Top-up</div>
            <h3>Buy Nepal Telecom Data and Voice Packs</h3>
            <p>Enter your number, choose a pack, and confirm the code sent to your phone.</p>
          </div>
          <div className="ncell-badge">
            <Smartphone size={18} />
            NTC
          </div>
        </div>
      </div>

      <div className="service-card">
        <div className="planner-strip-head">
          <h4>Available Balance</h4>
          <div className="ncell-balance-pill">
            <Wallet size={16} />
            NPR {availableBalance.toFixed(2)}
          </div>
        </div>
        {selectedPack && !hasEnoughBalance ? (
          <p className="error-message" style={{ marginBottom: 0 }}>
            You need NPR {Number(selectedPack.amount).toFixed(2)} in your account to buy this pack.
          </p>
        ) : (
          <p className="planner-muted">Your Expenser balance is enough for the currently selected pack.</p>
        )}
      </div>

      <div className="planner-tabs">
        <button
          type="button"
          className={`planner-tab ${activeCategory === 'data' ? 'active' : ''}`}
          onClick={() => handleCategoryChange('data')}
        >
          <Wifi size={16} />
          Data Packs
        </button>
        <button
          type="button"
          className={`planner-tab ${activeCategory === 'voice' ? 'active' : ''}`}
          onClick={() => handleCategoryChange('voice')}
        >
          <Radio size={16} />
          Voice Packs
        </button>
      </div>

      <div className="service-card">
        <form onSubmit={handleSendOtp} className="ncell-form-grid">
          <div className="form-group">
            <label>Nepal Telecom Number</label>
            <input
              className="input-field"
              placeholder="98XXXXXXXX"
              value={phoneNumber}
              onChange={handlePhoneChange}
              inputMode="numeric"
            />
          </div>

          <div className="ncell-action-row">
            <button type="button" className="btn btn-ghost" onClick={loadCatalog} disabled={loadingCatalog}>
              <RefreshCw size={16} className={loadingCatalog ? 'spin-icon' : ''} />
              Refresh Packs
            </button>
            <button type="submit" className="btn btn-primary" disabled={sendingOtp || loadingCatalog || !hasEnoughBalance}>
              {sendingOtp ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </div>
        </form>

        <div className="ncell-pack-grid">
          {packs.map((pack) => (
            <button
              key={`${activeCategory}-${pack.p_id}`}
              type="button"
              className={`ncell-pack-card ${selectedPackageId === pack.p_id ? 'active' : ''}`}
              onClick={() => handlePackSelect(pack.p_id)}
            >
              <span className="ncell-pack-price">रू {pack.amount}</span>
              <strong>{pack.title}</strong>
              <small>{pack.validity}</small>
            </button>
          ))}
        </div>

        {!loadingCatalog && packs.length === 0 && (
          <div className="planner-empty">
            <h3>No packs available</h3>
            <p>Please refresh and try again in a moment.</p>
          </div>
        )}
      </div>

      <div className="service-card">
        <div className="planner-strip-head">
          <h4>Verify OTP</h4>
          {selectedPack ? <span className="planner-muted">{selectedPack.title}</span> : null}
        </div>

        <form onSubmit={handleConfirmPurchase} className="ncell-form-grid">
          <div className="form-group">
            <label>OTP Code</label>
            <input
              className="input-field"
              placeholder="123456"
              value={otpCode}
              onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
            />
          </div>

          <div className="ncell-action-row">
            <button type="submit" className="btn btn-primary" disabled={confirming || !otpRequested || !hasEnoughBalance}>
              {confirming ? 'Verifying...' : 'Verify OTP'}
            </button>
          </div>
        </form>

        <div className="ncell-status-box">
          <p>{otpRequested ? 'Enter the code sent to your phone to complete the purchase.' : 'Tap Send OTP to receive a verification code on your phone.'}</p>
        </div>
      </div>
    </Layout>
  );
};

export default NtcPage;
