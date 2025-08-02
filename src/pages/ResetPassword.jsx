import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import { toast } from 'react-toastify';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const emailParam = searchParams.get('email');
    
    if (!tokenParam || !emailParam) {
      setError('Invalid reset link. Please request a new password reset.');
      return;
    }

    setToken(tokenParam);
    setEmail(emailParam);
    verifyToken(tokenParam, emailParam);
  }, [searchParams]);

  const verifyToken = async (token, email) => {
    try {
      await api.post('/api/verify-reset-token', { token, email });
      setTokenValid(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired reset link');
      toast.error(err.response?.data?.error || 'Invalid or expired reset link');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.newPassword.trim()) {
      setError('Please enter a new password');
      toast.error('Please enter a new password');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await api.post('/api/reset-password', {
        token,
        email,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      });
      
      setSuccess(true);
      toast.success('Password reset successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
      toast.error(err.response?.data?.error || 'Failed to reset password');
    }
    setLoading(false);
  };

  const goToLogin = () => {
    navigate('/login');
  };

  if (success) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="card shadow-lg" style={{ minWidth: 400, maxWidth: 500, width: '100%' }}>
          <div className="card-body p-5">
            <div className="text-center mb-4">
              <i className="fas fa-check-circle fa-3x text-success mb-3"></i>
              <h3 className="mb-2">Password Reset Successful!</h3>
              <p className="text-muted">Your password has been updated successfully.</p>
            </div>

            <div className="alert alert-success">
              <i className="fas fa-shield-alt me-2"></i>
              <strong>Security Updated:</strong> Your password has been changed and you can now login with your new password.
            </div>

            <div className="text-center mt-4">
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={goToLogin}
              >
                <i className="fas fa-sign-in-alt me-2"></i>Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid && error) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="card shadow-lg" style={{ minWidth: 400, maxWidth: 500, width: '100%' }}>
          <div className="card-body p-5">
            <div className="text-center mb-4">
              <i className="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
              <h3 className="mb-2">Invalid Reset Link</h3>
              <p className="text-muted">{error}</p>
            </div>

            <div className="text-center">
              <button
                type="button"
                className="btn btn-primary"
                onClick={goToLogin}
              >
                <i className="fas fa-arrow-left me-2"></i>Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="card shadow-lg" style={{ minWidth: 400, maxWidth: 500, width: '100%' }}>
          <div className="card-body p-5">
            <div className="text-center">
              <div className="spinner mb-3"></div>
              <p>Verifying reset link...</p>
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
            <i className="fas fa-lock fa-3x text-primary mb-3"></i>
            <h3 className="mb-2">Reset Your Password</h3>
            <p className="text-muted">Create a new password for your account</p>
          </div>

          {error && (
            <div className="alert alert-danger">
              <i className="fas fa-exclamation-triangle me-2"></i>{error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">
                <i className="fas fa-lock me-2"></i>New Password
              </label>
              <input
                type="password"
                className="form-control form-control-lg"
                value={formData.newPassword}
                onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                placeholder="Enter new password"
                required
              />
              <div className="form-text">
                <small className="text-muted">Password must be at least 6 characters long</small>
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label">
                <i className="fas fa-lock me-2"></i>Confirm New Password
              </label>
              <input
                type="password"
                className="form-control form-control-lg"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                placeholder="Confirm new password"
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
                    Resetting Password...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save me-2"></i>Reset Password
                  </>
                )}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                className="btn btn-link text-decoration-none"
                onClick={goToLogin}
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

export default ResetPassword; 