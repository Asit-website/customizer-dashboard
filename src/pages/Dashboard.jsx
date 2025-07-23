import React, { useEffect, useState } from 'react';
import api from '../api';

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

  useEffect(() => {
    if (user?.role === 'superadmin') {
      fetchUsers();
      setLoading(false);
    } else {
      fetchConfig();
    }
    // eslint-disable-next-line
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

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
        await api.put(`/api/configurations/${config._id}`, form, { headers });
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
      await api.put(`/api/users/${editModal.user._id}`, editForm, { headers });
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
      await api.patch(`/api/users/${user._id}/active`, { active: !user.active }, { headers });
      fetchUsers();
    } catch (err) {
      // Optionally show error
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to delete user ${user.email}? This action cannot be undone.`)) return;
    try {
      await api.delete(`/api/users/${user._id}`, { headers });
      fetchUsers();
    } catch (err) {
      // Optionally show error
    }
  };

  if (loading) return <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light"><div>Loading...</div></div>;

  return (
    <div className="d-flex min-vh-100 bg-light">
      {/* Sidebar */}
      <div className="bg-white border-end p-4 d-flex flex-column align-items-center" style={{ width: 220, minHeight: '100vh' }}>
        <div className="mb-4">
          <span className="fs-4 fw-bold text-primary">🛒 Customizer</span>
        </div>
        <ul className="nav nav-pills flex-column w-100">
          <li className="nav-item mb-2">
            <span className="nav-link active bg-primary text-white fw-semibold" style={{ cursor: 'default' }}>{user?.role === 'superadmin' ? 'Users' : 'Configuration'}</span>
          </li>
        </ul>
        <div className="mt-auto small text-center opacity-75 text-secondary">&copy; {new Date().getFullYear()} Customizer</div>
      </div>
      {/* Main Content */}
      <div className="flex-grow-1 d-flex flex-column">
        {/* Header */}
        <div className="bg-white shadow-sm px-4 py-3 d-flex justify-content-between align-items-center" style={{ minHeight: 64 }}>
          <div className="fs-5 fw-bold">{user?.role === 'superadmin' ? 'Admin Dashboard' : 'User Dashboard'}</div>
          <div className="d-flex align-items-center gap-3">
            <span className="fw-semibold text-primary">{user?.name} ({user?.email})</span>
            <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>Logout</button>
          </div>
        </div>
        {/* Main Content */}
        <div className="flex-grow-1 d-flex justify-content-center align-items-center">
          {user?.role === 'superadmin' ? (
            <div className="w-100" style={{ maxWidth: 900 }}>
              <div className="card shadow p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="mb-0">All Users</h4>
                  <button className="btn btn-success" onClick={() => setShowModal(true)}>
                    + Add User
                  </button>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle text-center">
                    <thead className="table-light">
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.filter(u => u.role !== 'superadmin').map(u => (
                        <tr key={u._id}>
                          <td>{u.name}</td>
                          <td>{u.email}</td>
                          <td>{u.phone}</td>
                          <td>
                            {u.active ? <span className="badge bg-success">Active</span> : <span className="badge bg-secondary">Inactive</span>}
                          </td>
                          <td>
                            <button className="btn btn-sm btn-primary me-2" onClick={() => openEditModal(u)} disabled={!u.active}>Edit</button>
                            <button className={`btn btn-sm ${u.active ? 'btn-danger' : 'btn-success'} me-2`} onClick={() => handleToggleActive(u)}>
                              {u.active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteUser(u)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                      {users.filter(u => u.role !== 'superadmin').length === 0 && <tr><td colSpan="5">No users found.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Modal for Add User */}
              {showModal && (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100vw',
                  height: '100vh',
                  background: 'rgba(0,0,0,0.4)',
                  zIndex: 1050,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <div className="card shadow p-4" style={{ minWidth: 400, maxWidth: 500, width: '100%', position: 'relative' }}>
                    <button
                      type="button"
                      className="btn-close position-absolute end-0 top-0 m-3"
                      aria-label="Close"
                      onClick={() => { setShowModal(false); setRegError(''); setRegSuccess(''); }}
                    ></button>
                    <h4 className="mb-3">Add User</h4>
                    {regError && <div className="alert alert-danger">{regError}</div>}
                    {regSuccess && <div className="alert alert-success">{regSuccess}</div>}
                    <form onSubmit={handleUserRegister} className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Name</label>
                        <input type="text" className="form-control" name="name" value={userReg.name} onChange={handleRegChange} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Email</label>
                        <input type="email" className="form-control" name="email" value={userReg.email} onChange={handleRegChange} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Password</label>
                        <input type="password" className="form-control" name="password" value={userReg.password} onChange={handleRegChange} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Phone</label>
                        <input type="text" className="form-control" name="phone" value={userReg.phone} onChange={handleRegChange} required />
                      </div>
                      <div className="col-12">
                        <button type="submit" className="btn btn-primary w-100">Add User</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card shadow p-4 w-100" style={{ maxWidth: 500 }}>
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Store ID</label>
                  <input type="text" className="form-control" name="storeId" value={form.storeId} onChange={handleChange} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Store URL</label>
                  <input type="text" className="form-control" name="storeUrl" value={form.storeUrl} onChange={handleChange} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Access Token</label>
                  <input type="text" className="form-control" name="storeAccessToken" value={form.storeAccessToken} onChange={handleChange} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Store Endpoint</label>
                  <input type="text" className="form-control" name="storeEndpoint" value={form.storeEndpoint} onChange={handleChange} required />
                </div>
                <div className="mb-2 fw-semibold">Subscription</div>
                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="subscriptionSwitch"
                    name="subscription"
                    checked={form.subscription === 'active'}
                    onChange={handleChange}
                  />
                  <label className="form-check-label ms-2" htmlFor="subscriptionSwitch">
                    {form.subscription === 'active' ? 'Active' : 'Inactive'}
                  </label>
                </div>
                <button type="submit" className="btn btn-primary w-100">{config ? 'Update' : 'Create'} Configuration</button>
              </form>
            </div>
          )}
        </div>
      </div>
      {/* Edit User Modal */}
      {editModal.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.4)',
          zIndex: 1050,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div className="card shadow p-4" style={{ minWidth: 400, maxWidth: 500, width: '100%', position: 'relative' }}>
            <button
              type="button"
              className="btn-close position-absolute end-0 top-0 m-3"
              aria-label="Close"
              onClick={closeEditModal}
            ></button>
            <h4 className="mb-3">Edit User</h4>
            {editError && <div className="alert alert-danger">{editError}</div>}
            {editSuccess && <div className="alert alert-success">{editSuccess}</div>}
            <form onSubmit={handleEditSubmit} className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Name</label>
                <input type="text" className="form-control" name="name" value={editForm.name} onChange={handleEditChange} required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" name="email" value={editForm.email} onChange={handleEditChange} required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Phone</label>
                <input type="text" className="form-control" name="phone" value={editForm.phone} onChange={handleEditChange} required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Password</label>
                <input type="password" className="form-control" name="password" value={editForm.password} onChange={handleEditChange} placeholder="Leave blank to keep unchanged" />
              </div>
              <div className="col-12">
                <button type="submit" className="btn btn-primary w-100">Update User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard; 