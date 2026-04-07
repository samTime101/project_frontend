import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup, login } from '../services/auth.service';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signup(formData);
      // Auto login after signup
      await login(formData.email, formData.password);
      navigate('/');
    } catch (err) {
      if (err.response?.data) {
        const errObj = err.response.data;
        const msgs = Object.keys(errObj).map(key => `${key}: ${errObj[key]}`).join(' | ');
        setError(msgs);
      } else {
        setError('Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-panel auth-form">
        <h2 className="text-center mb-4">Create Account</h2>
        <p className="text-center text-secondary mb-4">Start managing your expenses</p>
        
        {error && <div className="glass-panel mb-4 text-danger text-center" style={{padding: '0.75rem', borderColor: 'var(--danger-color)'}}>{error}</div>}
        
        <form onSubmit={handleSignup}>
          <div className="flex gap-4 mb-4">
            <div style={{flex: 1}}>
              <label>First Name</label>
              <input 
                name="first_name"
                className="glass-input" 
                value={formData.first_name}
                onChange={handleChange}
                required 
              />
            </div>
            <div style={{flex: 1}}>
              <label>Last Name</label>
              <input 
                name="last_name"
                className="glass-input" 
                value={formData.last_name}
                onChange={handleChange}
                required 
              />
            </div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              name="email"
              className="glass-input" 
              value={formData.email}
              onChange={handleChange}
              required 
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              name="password"
              className="glass-input" 
              value={formData.password}
              onChange={handleChange}
              required 
            />
          </div>
          <button type="submit" className="glass-button w-full mt-4" disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        
        <p className="text-center mt-4">
          Already have an account? <Link to="/login" className="text-accent">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
