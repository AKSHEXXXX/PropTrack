import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building, Lock, Mail, User } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'manager' | 'agent'>('agent');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    const loadingToast = toast.loading('Creating account...');
    try {
      await api.post('/auth/register', { email, password, role });
      toast.dismiss(loadingToast);
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (err: any) {
      toast.dismiss(loadingToast);
      const errMsg = err.response?.data?.message || 'Registration failed.';
      toast.error(typeof errMsg === 'string' ? errMsg : errMsg[0] || 'Registration failed');
      console.error('Registration error', err);
    } finally {
      setSubmitting(false);
    }
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
          <h2 className="auth-title">Create your account</h2>
          <p className="auth-subtitle">Join your agency on PropTrack</p>
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
                type="password"
                placeholder="••••••••"
                className="input-field"
                style={{ paddingLeft: '44px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Select Workspace Role</label>
            <div className="role-pill-selector">
              <button
                type="button"
                className={`role-pill-btn ${role === 'admin' ? 'active' : ''}`}
                onClick={() => setRole('admin')}
              >
                Admin
              </button>
              <button
                type="button"
                className={`role-pill-btn ${role === 'manager' ? 'active' : ''}`}
                onClick={() => setRole('manager')}
              >
                Manager
              </button>
              <button
                type="button"
                className={`role-pill-btn ${role === 'agent' ? 'active' : ''}`}
                onClick={() => setRole('agent')}
              >
                Agent
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '16px' }} disabled={submitting}>
            {submitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: '#6B7280', marginTop: '20px' }}>
          Already have an account? <Link to="/login" style={{ color: '#2D6A4F', fontWeight: 600 }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
};
