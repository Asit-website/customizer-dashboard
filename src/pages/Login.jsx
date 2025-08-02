import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { toast } from 'react-toastify';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [emailForOtp, setEmailForOtp] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/api/request-otp', formData);
      setOtpSent(true);
      setEmailForOtp(formData.email);
      toast.success('OTP sent to your email!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP');
      toast.error(err.response?.data?.error || 'Failed to send OTP');
    }
    setLoading(false);
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Please enter OTP');
      toast.error('Please enter OTP');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await api.post('/api/verify-otp', {
        email: emailForOtp,
        otp: otp
      });

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      toast.success('Login successful!');
      
      if (res.data.user.role === 'superadmin') {
        navigate('/');
      } else {
      navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP');
      toast.error(err.response?.data?.error || 'Invalid OTP');
    }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      await api.post('/api/request-otp', {
        email: emailForOtp,
        password: formData.password
      });
      toast.success('OTP resent successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resend OTP');
    }
    setLoading(false);
  };

  const goBackToLogin = () => {
    setOtpSent(false);
    setOtp('');
    setError('');
  };

  if (otpSent) {
    return (
      <div className="min-vh-100 d-flex">
        {/* Left Side - Image */}
        <div className="d-none d-lg-flex col-lg-6" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div className="d-flex align-items-center justify-content-center w-100">
            <div className="text-center text-white">
              <i className="fas fa-shield-alt fa-6x mb-4" style={{ opacity: 0.8 }}></i>
              <h2 className="mb-3">Secure Authentication</h2>
              <p className="mb-0" style={{ fontSize: '18px', opacity: 0.9 }}>
                Two-factor authentication keeps your account safe
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - OTP Form */}
        <div className="col-12 col-lg-6 d-flex align-items-center justify-content-center p-4">
          <div style={{ maxWidth: 400, width: '100%' }}>
            <div className="text-center mb-4">
              <i className="fas fa-shield-alt fa-3x text-primary mb-3"></i>
              <h3 className="mb-2">Verify OTP</h3>
              <p className="text-muted">Enter the 6-digit code sent to <strong>{emailForOtp}</strong></p>
            </div>

            {error && (
              <div className="alert alert-danger">
                <i className="fas fa-exclamation-triangle me-2"></i>{error}
              </div>
            )}

            <form onSubmit={handleOtpSubmit}>
              <div className="mb-4">
                <label className="form-label">
                  <i className="fas fa-key me-2"></i>Enter OTP
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg text-center"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength="6"
                  style={{ 
                    fontSize: '24px', 
                    letterSpacing: '8px',
                    fontWeight: 'bold',
                    color: '#007bff'
                  }}
                  required
                />
                <div className="form-text text-center">
                  <small className="text-muted">Enter the 6-digit code from your email</small>
                </div>
              </div>

              <div className="d-grid gap-2 mb-3">
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={loading || !otp.trim()}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check me-2"></i>Verify & Login
                    </>
                  )}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  className="btn btn-link text-decoration-none"
                  onClick={handleResendOtp}
                  disabled={loading}
                >
                  <i className="fas fa-redo me-2"></i>Resend OTP
                </button>
                <br />
                <button
                  type="button"
                  className="btn btn-link text-decoration-none"
                  onClick={goBackToLogin}
                  disabled={loading}
                >
                  <i className="fas fa-arrow-left me-2"></i>Back to Login
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex">
      {/* Left Side - Image */}
      <div className="d-none d-lg-flex col-lg-6" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div className="d-flex align-items-center justify-content-center w-100">
          <div className="text-center text-white">
            <i className="fas fa-user-lock fa-6x mb-4" style={{ opacity: 0.8 }}></i>
            <h2 className="mb-3">Welcome Back</h2>
            <p className="mb-0" style={{ fontSize: '18px', opacity: 0.9 }}>
              Secure login with two-factor authentication
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="col-12 col-lg-6 d-flex align-items-center justify-content-center p-4">
        <div style={{ maxWidth: 400, width: '100%' }}>
          <div className="text-center mb-4">
            <i className="fas fa-user-lock fa-3x text-primary mb-3"></i>
            <h3 className="mb-2">Welcome Back</h3>
            <p className="text-muted">Enter your credentials to continue</p>
          </div>

          {error && (
            <div className="alert alert-danger">
              <i className="fas fa-exclamation-triangle me-2"></i>{error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">
                <i className="fas fa-envelope me-2"></i>Email Address
              </label>
              <input
                type="email"
                className="form-control form-control-lg"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label">
                <i className="fas fa-lock me-2"></i>Password
              </label>
              <input
                type="password"
                className="form-control form-control-lg"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Enter your password"
                required
              />
            </div>

            <div className="d-grid">
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt me-2"></i>Send OTP
                  </>
                )}
              </button>
            </div>

            <div className="text-center mt-4">
              <div className="alert alert-info mb-0">
                <i className="fas fa-info-circle me-2"></i>
                <strong>Two-Factor Authentication:</strong> For enhanced security, we'll send a verification code to your email.
              </div>
            </div>

            <div className="text-center mt-3">
              <button
                type="button"
                className="btn btn-link text-decoration-none"
                onClick={() => navigate('/forgot-password')}
              >
                <i className="fas fa-key me-2"></i>Forgot Password?
              </button>
            </div>
        </form>
        </div>
      </div>
    </div>
  );
}

export default Login; 