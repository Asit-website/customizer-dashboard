import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { toast } from 'react-toastify';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address');
      toast.error('Please enter your email address');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await api.post('/api/forgot-password', { email });
      setSuccess(true);
      toast.success('Password reset link sent to your email!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset link');
      toast.error(err.response?.data?.error || 'Failed to send reset link');
    }
    setLoading(false);
  };

  const goBackToLogin = () => {
    navigate('/login');
  };

  if (success) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="card shadow-lg" style={{ minWidth: 400, maxWidth: 500, width: '100%' }}>
          <div className="card-body p-5">
            <div className="text-center mb-4">
              <i className="fas fa-check-circle fa-3x text-success mb-3"></i>
              <h3 className="mb-2">Check Your Email</h3>
              <p className="text-muted">We've sent a password reset link to <strong>{email}</strong></p>
            </div>

            <div className="alert alert-info">
              <i className="fas fa-info-circle me-2"></i>
              <strong>What's next?</strong>
              <ul className="mb-0 mt-2">
                <li>Check your email inbox</li>
                <li>Click the "Reset Password" button in the email</li>
                <li>Create a new password</li>
              </ul>
            </div>

            <div className="text-center mt-4">
              <button
                type="button"
                className="btn btn-primary"
                onClick={goBackToLogin}
              >
                <i className="fas fa-arrow-left me-2"></i>Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="card shadow-lg" style={{ minWidth: 400, maxWidth: 500, width: '100%' }}>
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <i className="fas fa-key fa-3x text-primary mb-3"></i>
            <h3 className="mb-2">Forgot Password?</h3>
            <p className="text-muted">Enter your email address to reset your password</p>
          </div>

          {error && (
            <div className="alert alert-danger">
              <i className="fas fa-exclamation-triangle me-2"></i>{error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="form-label">
                <i className="fas fa-envelope me-2"></i>Email Address
              </label>
              <input
                type="email"
                className="form-control form-control-lg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your registered email"
                required
              />
            </div>

            <div className="d-grid mb-3">
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Sending Reset Link...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane me-2"></i>Send Reset Link
                  </>
                )}
              </button>
            </div>

            <div className="text-center">
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

export default ForgotPassword; 