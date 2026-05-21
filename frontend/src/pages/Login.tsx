import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    const loadingToast = toast.loading('Signing in...');
    try {
      const res = await api.post('/auth/login', { email, password });
      toast.dismiss(loadingToast);
      
      if (res && res.data && res.data.accessToken) {
        login(res.data.accessToken);
        toast.success('Welcome back!');
        navigate('/dashboard');
      } else {
        toast.error('Invalid credentials response');
      }
    } catch (err: any) {
      toast.dismiss(loadingToast);
      const errMsg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(typeof errMsg === 'string' ? errMsg : errMsg[0] || 'Login failed');
      console.error('Login error', err);
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail('admin@proptrack.com');
    setPassword('Admin1234!');
    toast.success('Demo credentials filled');
  };

  return (
    <div className="auth-page-bg">
      <div className="auth-card fade-in">
        <div className="auth-header">
          <div className="sidebar-logo-container" style={{ justifyContent: 'center', padding: 0 }}>
            <div className="sidebar-logo-circle" style={{ width: '40px', height: '40px' }}>
              <Building size={20} />
            </div>
            <span className="sidebar-logo-text" style={{ fontSize: '1.5rem' }}>PropTrack</span>
          </div>
          <h2 className="auth-title">Welcome back</h2>
          <p className="auth-subtitle">Sign in to your workspace</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email-input">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '16px', top: '14px', color: '#9CA3AF' }} />
              <input
                id="email-input"
                type="email"
                placeholder="agent@proptrack.com"
                className="input-field"
                style={{ paddingLeft: '44px' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password-input">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '16px', top: '14px', color: '#9CA3AF' }} />
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="input-field"
                style={{ paddingLeft: '44px', paddingRight: '44px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                style={{ position: 'absolute', right: '16px', top: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '16px' }} disabled={submitting}>
            {submitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div style={{ margin: '16px 0', textAlign: 'center', borderTop: '1px solid #E5E7EB', paddingTop: '16px' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            style={{ width: '100%', padding: '10px' }}
            onClick={fillDemoCredentials}
          >
            Fill Demo Credentials (Admin)
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: '#6B7280', marginTop: '20px' }}>
          Don't have an account? <Link to="/register" style={{ color: '#2D6A4F', fontWeight: 600 }}>Register</Link>
        </p>
      </div>
    </div>
  );
};
