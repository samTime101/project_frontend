import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/auth.service';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="md-card auth-form">
        <h2 className="text-center mb-4">Welcome Back</h2>
        <p className="text-center text-secondary mb-4">Sign in to your account</p>
        
        {error && <div className="md-card mb-4 text-danger text-center" style={{padding: '0.75rem', borderColor: 'var(--danger-color)'}}>{error}</div>}
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              className="md-input" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required 
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              className="md-input" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required 
            />
          </div>
          <button type="submit" className="md-button w-full mt-4" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        <p className="text-center mt-4">
          Don't have an account? <Link to="/signup" className="text-accent">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
