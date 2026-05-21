import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { User, Mail, Save, LogOut, Volume2, VolumeX, Bell } from 'lucide-react';

const ProfilePage = () => {
  const { user, logout, refreshUser } = useAuth();
  const { showNotification, soundEnabled, toggleSound } = useNotification();
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name,
        last_name: user.last_name
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/users/me/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        await refreshUser();
        showNotification('Profile updated successfully!', 'success');
      } else {
        const data = await response.json();
        showNotification(data.detail || 'Failed to update profile.', 'error');
      }
    } catch (error) {
      showNotification('An error occurred. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="section-title">
        <h2>Your Profile</h2>
      </div>

      <div className="profile-page">
        <div className="profile-hero">
          <div className="card profile-hero-top">
            <div className="profile-user-block">
              <div className="profile-avatar">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <div>
                <h3>{user?.first_name} {user?.last_name}</h3>
                <p>{user?.email}</p>
              </div>
            </div>
            <button className="btn btn-secondary" style={{ color: 'var(--error)', borderColor: 'var(--error)' }} onClick={logout}>
              <LogOut size={18} /> Logout
            </button>
          </div>

          <div className="profile-summary-grid">
            <div className="profile-summary-card">
              <span>Total Balance</span>
              <strong>NPR {user?.balance?.toLocaleString()}</strong>
            </div>
            <div className="profile-summary-card">
              <span>Total Income</span>
              <strong>NPR {user?.total_income?.toLocaleString()}</strong>
            </div>
            <div className="profile-summary-card">
              <span>Total Expenses</span>
              <strong>NPR {user?.total_expense?.toLocaleString()}</strong>
            </div>
            <div className="profile-summary-card">
              <span>Status</span>
              <strong style={{ color: 'var(--success)' }}>Active</strong>
            </div>
          </div>
        </div>

        <div className="profile-grid profile-grid-split">
          <div className="card">
            <h4 style={{ marginBottom: '24px' }}>Edit Personal Details</h4>
            <form onSubmit={handleSubmit}>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>First Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                    <input 
                      type="text" 
                      className="input-field" 
                      style={{ paddingLeft: '44px' }}
                      value={formData.first_name}
                      onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                    <input 
                      type="text" 
                      className="input-field" 
                      style={{ paddingLeft: '44px' }}
                      value={formData.last_name}
                      onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label>Email Address (Read-only)</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                  <input 
                    type="email" 
                    className="input-field" 
                    style={{ paddingLeft: '44px', background: 'var(--background)', cursor: 'not-allowed' }}
                    value={user?.email || ''}
                    disabled
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }} disabled={loading}>
                <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          <div className="card">
            <h4 style={{ marginBottom: '24px' }}>Preferences</h4>
            
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Bell size={18} /> Notifications
              </label>
              <div className="preference-item" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '12px',
                background: 'var(--background)',
                borderRadius: '12px',
                border: '1px solid var(--border)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {soundEnabled ? <Volume2 size={20} className="text-primary" /> : <VolumeX size={20} style={{ color: 'var(--text-light)' }} />}
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Notification Sounds</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Play sound on alerts</div>
                  </div>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={soundEnabled} onChange={toggleSound} />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .preference-item {
          transition: all 0.2s ease;
        }
        .preference-item:hover {
          border-color: var(--primary);
        }
        .switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
        }
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: .4s;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .4s;
        }
        input:checked + .slider {
          background-color: var(--primary);
        }
        input:checked + .slider:before {
          transform: translateX(20px);
        }
        .slider.round {
          border-radius: 34px;
        }
        .slider.round:before {
          border-radius: 50%;
        }

        @media (max-width: 992px) {
          .profile-grid-split {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Layout>
  );
};

export default ProfilePage;
