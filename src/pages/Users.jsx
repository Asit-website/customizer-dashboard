import React, { useEffect, useState, useLayoutEffect, useRef } from 'react';
import api from '../api';
import ReactDOM from 'react-dom';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import Layout from '../components/Layout';

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });
  const [user, setUser] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuBtnRefs = useRef({});
  const menuRef = useRef();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/api/users', { headers: { Authorization: `Bearer ${token}` } });
      setUsers(res.data);
    } catch (err) {
      setError('Failed to fetch users');
    }
    setLoading(false);
  };

  const handleMenuClick = (id, event) => {
    event.stopPropagation();
    const button = menuBtnRefs.current[id];
    if (button) {
      const rect = button.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
      });
    }
    setMenuOpenId(menuOpenId === id ? null : id);
  };

  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setMenuOpenId(null);
    }
  };

  useLayoutEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      setError('Name, email and password are required');
      toast.error('Name, email and password are required');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await api.post('/api/register', { ...formData, role: 'user' }, { headers: { Authorization: `Bearer ${token}` } });
      setShowModal(false);
      setFormData({ name: '', email: '', password: '', phone: '' });
      fetchUsers();
      toast.success('User added successfully!');
    } catch (err) {
      setError('Failed to add user');
      toast.error('Failed to add user');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Name and email are required');
      toast.error('Name and email are required');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const updateData = { ...formData };
      if (!updateData.password) delete updateData.password;
      await api.put(`/api/users/${editingUser.id}`, updateData, { headers: { Authorization: `Bearer ${token}` } });
      setShowEditModal(false);
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', phone: '' });
      fetchUsers();
      toast.success('User updated successfully!');
    } catch (err) {
      setError('Failed to update user');
      toast.error('Failed to update user');
    }
  };

  const handleToggleActive = async (userId, currentActive) => {
    try {
      const token = localStorage.getItem('token');
      await api.patch(`/api/users/${userId}/active`, { active: !currentActive }, { headers: { Authorization: `Bearer ${token}` } });
      fetchUsers();
      toast.success(`User ${!currentActive ? 'activated' : 'deactivated'} successfully!`);
    } catch (err) {
      toast.error('Failed to change user status');
    }
  };

  const handleDelete = async (userId, userName) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete user: ${userName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        await api.delete(`/api/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
        fetchUsers();
        toast.success('User deleted successfully!');
      } catch (err) {
        toast.error('Failed to delete user');
      }
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      phone: user.phone || ''
    });
    setShowEditModal(true);
  };

  if (!user || user.role !== 'superadmin') {
    return <div style={{color:'red',margin:40}}>You are not authorized to view this page.</div>;
  }

  return (
    <Layout currentPage="users">
      <div className="p-4">
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h4 className="mb-0">
              <i className="fas fa-users me-2"></i>Users Management
            </h4>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <i className="fas fa-plus me-2"></i>Add User
            </button>
          </div>
          <div className="card-body">
            {error && <div className="alert alert-danger">
              <i className="fas fa-exclamation-triangle me-2"></i>{error}
            </div>}
            {loading ? (
              <div className="text-center">
                <div className="spinner mb-3"></div>
                <div className="text-primary">Loading...</div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '25%' }}>Name</th>
                      <th style={{ width: '30%' }}>Email</th>
                      <th style={{ width: '20%' }}>Phone</th>
                      <th style={{ width: '15%' }}>Status</th>
                      <th style={{ width: '10%', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.filter(user => user.role !== 'superadmin').map(user => (
                                              <tr key={user.id}>
                        <td className="align-middle">{user.name}</td>
                        <td className="align-middle">{user.email}</td>
                        <td className="align-middle">{user.phone || '-'}</td>
                        <td className="align-middle">
                          <span className={`badge ${user.active ? 'bg-success' : 'bg-secondary'}`}>
                            {user.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="text-center">
                          <div className="d-flex justify-content-center align-items-center">
                                                          <button
                                ref={el => menuBtnRefs.current[user.id] = el}
                                className="btn btn-sm btn-outline-secondary"
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: '1px solid #dee2e6',
                                  background: menuOpenId === user.id ? '#e9ecef' : '#fff',
                                  transition: 'all 0.2s ease',
                                  boxShadow: menuOpenId === user.id ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                                }}
                                onClick={(e) => handleMenuClick(user.id, e)}
                                title="Actions"
                              >
                                <i className="fas fa-ellipsis-v" style={{ fontSize: '14px', color: '#6c757d' }}></i>
                              </button>
                              {menuOpenId === user.id && ReactDOM.createPortal(
                              <div
                                ref={menuRef}
                                style={{
                                  position: 'fixed',
                                  top: menuPosition.top,
                                  left: menuPosition.left,
                                  zIndex: 99999,
                                  background: 'white',
                                  border: '1px solid #dee2e6',
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                  minWidth: '160px',
                                  pointerEvents: 'auto'
                                }}
                              >
                                <div className="py-1">
                                  <button
                                    className="btn btn-link w-100 text-start px-3 py-2"
                                    onClick={() => {
                                      openEditModal(user);
                                      setMenuOpenId(null);
                                    }}
                                    style={{ 
                                      textDecoration: 'none',
                                      color: '#495057',
                                      fontSize: '14px',
                                      border: 'none',
                                      background: 'none'
                                    }}
                                  >
                                    <i className="fas fa-edit me-2"></i>Edit
                                  </button>
                                  <button
                                    className="btn btn-link w-100 text-start px-3 py-2"
                                    onClick={() => {
                                                                              handleToggleActive(user.id, user.active);
                                      setMenuOpenId(null);
                                    }}
                                    style={{ 
                                      textDecoration: 'none',
                                      color: user.active ? '#dc3545' : '#28a745',
                                      fontSize: '14px',
                                      border: 'none',
                                      background: 'none'
                                    }}
                                  >
                                    <i className={`fas ${user.active ? 'fa-user-slash' : 'fa-user-check'} me-2`}></i>
                                    {user.active ? 'Deactivate' : 'Activate'}
                                  </button>
                                  <button
                                    className="btn btn-link w-100 text-start px-3 py-2 text-danger"
                                    onClick={() => {
                                                                              handleDelete(user.id, user.name);
                                      setMenuOpenId(null);
                                    }}
                                    style={{ 
                                      textDecoration: 'none',
                                      fontSize: '14px',
                                      border: 'none',
                                      background: 'none'
                                    }}
                                  >
                                    <i className="fas fa-trash me-2"></i>Delete
                                  </button>
                                </div>
                              </div>,
                              document.body
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.filter(user => user.role !== 'superadmin').length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center text-muted py-4">
                          <i className="fas fa-users fa-2x mb-3 d-block"></i>
                          No users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showModal && (
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
                <i className="fas fa-user-plus me-2"></i>Add New User
              </h4>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => setShowModal(false)}
              ></button>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit} className="row g-3">
                <div className="col-12">
                  <label className="form-label">
                    <i className="fas fa-user me-2"></i>Name
                  </label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    placeholder="Enter name"
                    required 
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">
                    <i className="fas fa-envelope me-2"></i>Email
                  </label>
                  <input 
                    type="email" 
                    className="form-control" 
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    placeholder="Enter email"
                    required 
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">
                    <i className="fas fa-lock me-2"></i>Password
                  </label>
                  <input 
                    type="password" 
                    className="form-control" 
                    value={formData.password} 
                    onChange={(e) => setFormData({...formData, password: e.target.value})} 
                    placeholder="Enter password"
                    required 
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">
                    <i className="fas fa-phone me-2"></i>Phone
                  </label>
                  <input 
                    type="tel" 
                    className="form-control" 
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="col-12">
                  <button type="submit" className="btn btn-primary w-100">
                    <i className="fas fa-save me-2"></i>Add User
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
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
                onClick={() => setShowEditModal(false)}
              ></button>
            </div>
            <div className="card-body">
              <form onSubmit={handleEdit} className="row g-3">
                <div className="col-12">
                  <label className="form-label">
                    <i className="fas fa-user me-2"></i>Name
                  </label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    placeholder="Enter name"
                    required 
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">
                    <i className="fas fa-envelope me-2"></i>Email
                  </label>
                  <input 
                    type="email" 
                    className="form-control" 
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    placeholder="Enter email"
                    required 
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">
                    <i className="fas fa-lock me-2"></i>Password (leave blank to keep current)
                  </label>
                  <input 
                    type="password" 
                    className="form-control" 
                    value={formData.password} 
                    onChange={(e) => setFormData({...formData, password: e.target.value})} 
                    placeholder="Enter new password (optional)"
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">
                    <i className="fas fa-phone me-2"></i>Phone
                  </label>
                  <input 
                    type="tel" 
                    className="form-control" 
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                    placeholder="Enter phone number"
                  />
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

export default Users;