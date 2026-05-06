import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(formData);
      // Auto login after signup
      await login({ email: formData.email, password: formData.password });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || Object.values(err.response?.data || {}).flat()[0] || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-brand-side">
        <h1 className="brand-logo">EXPENSER</h1>
        <p className="brand-slogan">track. save. grow.</p>
        <div style={{ marginTop: '50px', maxWidth: '420px', opacity: 0.95, lineHeight: '1.8' }}>
          <p style={{ fontSize: '1rem' }}>Join thousands of users who are taking control of their financial future. Quick, easy, and secure.</p>
        </div>
      </div>
      
      <div className="auth-form-side animate-fade-in">
        <div style={{ maxWidth: '420px', width: '100%', margin: '0 auto' }}>
          <h2 style={{ marginBottom: '12px' }}>Create Account</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '40px', fontSize: '1rem' }}>Start your financial journey with us today.</p>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="first_name">First Name</label>
                <input 
                  type="text" 
                  id="first_name" 
                  className="input-field" 
                  placeholder="John"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="last_name">Last Name</label>
                <input 
                  type="text" 
                  id="last_name" 
                  className="input-field" 
                  placeholder="Doe"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input 
                type="email" 
                id="email" 
                className="input-field" 
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input 
                type="password" 
                id="password" 
                className="input-field" 
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '24px' }} disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          
          <p style={{ textAlign: 'center', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '700', transition: 'var(--transition)' }}>
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
