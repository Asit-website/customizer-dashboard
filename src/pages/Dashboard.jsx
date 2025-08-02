import React, { useEffect, useState } from 'react';
import api from '../api';
import Layout from '../components/Layout';

function Dashboard() {
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState({ storeId: '', storeUrl: '', storeAccessToken: '', storeEndpoint: '', subscription: 'active' });
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]); // for superadmin
  const [userReg, setUserReg] = useState({ name: '', email: '', password: '', phone: '' });
  const [regSuccess, setRegSuccess] = useState('');
  const [regError, setRegError] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));
  const [showModal, setShowModal] = useState(false); // Modal state
  const [editModal, setEditModal] = useState({ show: false, user: null });
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  // Fetch all users for superadmin
  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/users', { headers });
      setUsers(res.data);
    } catch (err) {
      setUsers([]);
    }
  };

  // Fetch config for normal user
  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/configurations', { headers });
      if (res.data && res.data.length > 0) {
        setConfig(res.data[0]);
        setForm({
          storeId: res.data[0].storeId || '',
          storeUrl: res.data[0].storeUrl || '',
          storeAccessToken: res.data[0].storeAccessToken || '',
          storeEndpoint: res.data[0].storeEndpoint || '',
          subscription: res.data[0].subscription || 'inactive',
        });
      }
    } catch (err) {
      setError('Failed to fetch configuration.');
    }
    setLoading(false);
  };

  const fetchCounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const usersRes = await api.get('/api/users', { headers: { Authorization: `Bearer ${token}` } });
      setTotalUsers(usersRes.data.length);
      const productsRes = await api.get('/api/layerdesigns/sqs', { headers: { Authorization: `Bearer ${token}` } });
      setTotalProducts(productsRes.data.length);
    } catch (err) {
      setTotalUsers(0);
      setTotalProducts(0);
    }
  };

  useEffect(() => {
    if (user?.role === 'superadmin') {
      fetchUsers();
      setLoading(false);
    } else {
      fetchConfig();
    }
    fetchCounts();
    // eslint-disable-next-line
  }, []);

  // Registration form handlers (superadmin)
  const handleRegChange = e => {
    setUserReg({ ...userReg, [e.target.name]: e.target.value });
  };
  const handleUserRegister = async e => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');
    try {
      await api.post('/api/register', { ...userReg, role: 'user' }, { headers });
      setRegSuccess('User registered successfully!');
      setUserReg({ name: '', email: '', password: '', phone: '' });
      fetchUsers();
      setTimeout(() => {
        setShowModal(false);
        setRegSuccess('');
      }, 1000);
    } catch (err) {
      setRegError(err.response?.data?.error || 'Registration failed.');
    }
  };

  // Config form handlers (user)
  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    if (name === 'subscription') {
      setForm({ ...form, subscription: checked ? 'active' : 'inactive' });
    } else {
      setForm({ ...form, [name]: value });
    }
  };
  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (config) {
        await api.put(`/api/configurations/${config.id}`, form, { headers });
        setSuccess('Configuration updated successfully!');
      } else {
        const res = await api.post('/api/configurations', form, { headers });
        setConfig(res.data.config);
        setSuccess('Configuration created successfully!');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    }
  };

  const openEditModal = (user) => {
    setEditForm({ name: user.name, email: user.email, phone: user.phone, password: '' });
    setEditModal({ show: true, user });
    setEditError('');
    setEditSuccess('');
  };
  const closeEditModal = () => {
    setEditModal({ show: false, user: null });
    setEditError('');
    setEditSuccess('');
  };
  const handleEditChange = e => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };
  const handleEditSubmit = async e => {
    e.preventDefault();
    setEditError('');
    setEditSuccess('');
    try {
      await api.put(`/api/users/${editModal.user.id}`, editForm, { headers });
      setEditSuccess('User updated successfully!');
      fetchUsers();
      setTimeout(() => {
        closeEditModal();
      }, 1000);
    } catch (err) {
      setEditError(err.response?.data?.error || 'Update failed.');
    }
  };
  const handleToggleActive = async (user) => {
    try {
      await api.patch(`/api/users/${user.id}/active`, { active: !user.active }, { headers });
      fetchUsers();
    } catch (err) {
      // Optionally show error
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to delete user ${user.email}? This action cannot be undone.`)) return;
    try {
      await api.delete(`/api/users/${user.id}`, { headers });
      fetchUsers();
    } catch (err) {
      // Optionally show error
    }
  };

  if (loading) return (
    <Layout currentPage="dashboard">
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <div className="spinner mb-3"></div>
          <div className="text-primary fs-5">Loading...</div>
        </div>
      </div>
    </Layout>
  );

  return (
    <Layout currentPage="dashboard">
      {/* Main Content */}
      {user?.role !== 'superadmin' ? (
        <div className="d-flex justify-content-center align-items-center p-4">
          <div className="w-100 fade-in" style={{ maxWidth: 600 }}>
            <div className="card">
              <div className="card-header">
                <h4 className="mb-0">
                  <i className="fas fa-store me-2"></i>
                  Store Configuration
                </h4>
              </div>
              <div className="card-body">
                {error && <div className="alert alert-danger">
                  <i className="fas fa-exclamation-triangle me-2"></i>{error}
                </div>}
                {success && <div className="alert alert-success">
                  <i className="fas fa-check-circle me-2"></i>{success}
                </div>}
                
                <form onSubmit={handleSubmit} className="row g-4">
                  <div className="col-12">
                    <label className="form-label">
                      <i className="fas fa-id-card me-2"></i>Store ID
                    </label>
                    <input type="text" className="form-control" name="storeId" value={form.storeId} onChange={handleChange} required />
                  </div>
                  <div className="col-12">
                    <label className="form-label">
                      <i className="fas fa-link me-2"></i>Store URL
                    </label>
                    <input type="text" className="form-control" name="storeUrl" value={form.storeUrl} onChange={handleChange} required />
                  </div>
                  <div className="col-12">
                    <label className="form-label">
                      <i className="fas fa-key me-2"></i>Store Access Token
                    </label>
                    <input type="text" className="form-control" name="storeAccessToken" value={form.storeAccessToken} onChange={handleChange} required />
                  </div>
                  <div className="col-12">
                    <label className="form-label">
                      <i className="fas fa-server me-2"></i>Store Endpoint
                    </label>
                    <input type="text" className="form-control" name="storeEndpoint" value={form.storeEndpoint} onChange={handleChange} required />
                  </div>
                  <div className="col-12">
                    <div className="form-check">
                      <input type="checkbox" className="form-check-input" id="subscription" name="subscription" checked={form.subscription === 'active'} onChange={handleChange} />
                      <label className="form-check-label" htmlFor="subscription">
                        <i className="fas fa-toggle-on me-2"></i>Subscription Active
                      </label>
                    </div>
                  </div>
                  <div className="col-12">
                    <button type="submit" className="btn btn-primary w-100">
                      <i className={`fas ${config ? 'fa-save' : 'fa-plus'} me-2`}></i>
                      {config ? 'Update Configuration' : 'Save Configuration'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="d-flex justify-content-center align-items-center p-4">
          <div className="w-100 d-flex justify-content-center align-items-center gap-4" style={{ maxWidth: 800 }}>
            <div className="card text-center fade-in" style={{ minWidth: 250 }}>
              <div className="card-body">
                <div className="mb-3">
                  <i className="fas fa-users fa-3x text-primary"></i>
                </div>
                <div className="fs-1 fw-bold text-primary mb-2">{totalUsers}</div>
                <div className="text-secondary fs-5">Total Users</div>
                <div className="small text-muted mt-2">
                  <i className="fas fa-chart-line me-1"></i>
                  Active accounts
                </div>
              </div>
            </div>
            
            <div className="card text-center fade-in" style={{ minWidth: 250 }}>
              <div className="card-body">
                <div className="mb-3">
                  <i className="fas fa-box fa-3x text-success"></i>
                </div>
                <div className="fs-1 fw-bold text-success mb-2">{totalProducts}</div>
                <div className="text-secondary fs-5">Total Products</div>
                <div className="small text-muted mt-2">
                  <i className="fas fa-chart-bar me-1"></i>
                  Available products
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit User Modal */}
      {editModal.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1050,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(5px)',
        }}>
          <div className="card shadow-lg fade-in" style={{ minWidth: 450, maxWidth: 550, width: '100%', position: 'relative' }}>
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="mb-0">
                <i className="fas fa-user-edit me-2"></i>Edit User
              </h4>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={closeEditModal}
              ></button>
            </div>
            <div className="card-body">
              {editError && <div className="alert alert-danger">
                <i className="fas fa-exclamation-triangle me-2"></i>{editError}
              </div>}
              {editSuccess && <div className="alert alert-success">
                <i className="fas fa-check-circle me-2"></i>{editSuccess}
              </div>}
              
              <form onSubmit={handleEditSubmit} className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">
                    <i className="fas fa-user me-2"></i>Name
                  </label>
                  <input type="text" className="form-control" name="name" value={editForm.name} onChange={handleEditChange} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    <i className="fas fa-envelope me-2"></i>Email
                  </label>
                  <input type="email" className="form-control" name="email" value={editForm.email} onChange={handleEditChange} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    <i className="fas fa-phone me-2"></i>Phone
                  </label>
                  <input type="text" className="form-control" name="phone" value={editForm.phone} onChange={handleEditChange} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    <i className="fas fa-lock me-2"></i>Password
                  </label>
                  <input type="password" className="form-control" name="password" value={editForm.password} onChange={handleEditChange} placeholder="Leave blank to keep unchanged" />
                </div>
                <div className="col-12">
                  <button type="submit" className="btn btn-primary w-100">
                    <i className="fas fa-save me-2"></i>Update User
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Dashboard; 