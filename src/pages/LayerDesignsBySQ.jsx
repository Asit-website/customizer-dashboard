import React, { useEffect, useState, useLayoutEffect, useRef } from 'react';
import api from '../api';
import { useNavigate, useParams } from 'react-router-dom';
import ReactDOM from 'react-dom';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';

function LayerDesignsBySQ() {
  const { sq } = useParams();
  const [user, setUser] = useState(null);
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [newDesignName, setNewDesignName] = useState('');
  const [newLayersDesign, setNewLayersDesign] = useState({});
  const [editId, setEditId] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuBtnRefs = useRef({});
  const menuRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchDesigns();
    // eslint-disable-next-line
  }, [sq]);

  const fetchDesigns = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching designs for SQ:', sq);
      console.log('Token:', token);
      const res = await api.get(`/api/layerdesigns/by-sq/${sq}`, { headers: { Authorization: `Bearer ${token}` } });
      console.log('API Response:', res.data);
      setDesigns(res.data);
    } catch (err) {
      console.error('Error fetching designs:', err);
      setError('Failed to fetch LayerDesigns');
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

  const handleAddEditDesign = async () => {
    setError('');
    if (!newDesignName.trim()) {
      setError('Design Name is required');
      toast.error('Design Name is required');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      if (editId) {
        await api.put(`/api/layerdesigns/${editId}`, {
          sq,
          designName: newDesignName,
          layersDesign: newLayersDesign
        }, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Product Design updated successfully!');
      } else {
        await api.post('/api/layerdesigns', {
          sq,
          designName: newDesignName,
          layersDesign: newLayersDesign
        }, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Product Design created successfully!');
      }
      setShowPopup(false);
      setNewDesignName('');
      setNewLayersDesign({});
      setEditId(null);
      fetchDesigns();
    } catch (err) {
      setError('Failed to save Product Design');
      toast.error('Failed to save Product Design');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this Product Design?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        await api.delete(`/api/layerdesigns/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        fetchDesigns();
        toast.success('Product Design deleted successfully!');
      } catch (err) {
        toast.error('Failed to delete Product Design');
      }
    }
  };

  const openEditModal = (design) => {
    console.log('Opening edit modal for design:', design);
    setEditId(design.id);
    setNewDesignName(design.designName);
    setNewLayersDesign(design.layersDesign || {});
    setShowPopup(true);
  };

  const openAddModal = () => {
    setEditId(null);
    setNewDesignName('');
    setNewLayersDesign({});
    setShowPopup(true);
  };

  if (!user || user.role !== 'superadmin') {
    return <div style={{color:'red',margin:40}}>You are not authorized to view this page.</div>;
  }

  return (
    <Layout currentPage="layerdesigns">
      <div className="p-4">
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h4 className="mb-0">
              <i className="fas fa-palette me-2"></i>Product Designs for: {sq}
            </h4>
            <button className="btn btn-primary" onClick={openAddModal}>
              <i className="fas fa-plus me-2"></i>Add Design
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
                      <th style={{ width: '70%' }}>Design Name</th>
                      <th style={{ width: '30%', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                                         {console.log('Designs state:', designs)}
                     {designs.forEach(design => {
                       console.log('Design:', design.designName, 'LayersDesign:', design.layersDesign);
                     })}
                     {designs.length === 0 || (designs.length === 1 && designs[0].designName === 'Default Design') ? (
                      <tr>
                        <td colSpan="2" className="text-center text-muted py-4">
                          <i className="fas fa-palette fa-2x mb-3 d-block"></i>
                          No Product Designs found.
                        </td>
                      </tr>
                    ) : (
                      designs.filter(d => d.designName !== 'Default Design').map(design => (
                        <tr key={design.id}>
                          <td className="align-middle">{design.designName}</td>
                          <td className="text-center">
                            <div className="d-flex justify-content-center align-items-center">
                              <button
                                ref={el => menuBtnRefs.current[design.id] = el}
                                className="btn btn-sm btn-outline-secondary"
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: '1px solid #dee2e6',
                                  background: menuOpenId === design.id ? '#e9ecef' : '#fff',
                                  transition: 'all 0.2s ease',
                                  boxShadow: menuOpenId === design.id ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                                }}
                                onClick={(e) => handleMenuClick(design.id, e)}
                                title="Actions"
                              >
                                <i className="fas fa-ellipsis-v" style={{ fontSize: '14px', color: '#6c757d' }}></i>
                              </button>
                              {menuOpenId === design.id && ReactDOM.createPortal(
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
                                        openEditModal(design);
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
                                      className="btn btn-link w-100 text-start px-3 py-2 text-danger"
                                      onClick={() => {
                                        handleDelete(design.id);
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
                                    <button
                                      className="btn btn-link w-100 text-start px-3 py-2"
                                      onClick={() => {
                                        navigate(`/customize-layerdesign/${design.id}`);
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
                                      <i className="fas fa-palette me-2"></i>Customize Data
                                    </button>
                                  </div>
                                </div>,
                                document.body
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Design Modal */}
      {showPopup && (
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
                <i className={`fas ${editId ? 'fa-edit' : 'fa-plus'} me-2`}></i>
                {editId ? 'Edit Design' : 'Add New Design'}
              </h4>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => setShowPopup(false)}
              ></button>
            </div>
            <div className="card-body">
              <form onSubmit={(e) => { e.preventDefault(); handleAddEditDesign(); }} className="row g-3">
                <div className="col-12">
                  <label className="form-label">
                    <i className="fas fa-palette me-2"></i>Design Name
                  </label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={newDesignName} 
                    onChange={(e) => setNewDesignName(e.target.value)} 
                    placeholder="Enter Design Name"
                    required 
                  />
                </div>
                <div className="col-12">
                  <button type="submit" className="btn btn-primary w-100">
                    <i className={`fas ${editId ? 'fa-save' : 'fa-plus'} me-2`}></i>
                    {editId ? 'Update Design' : 'Add Design'}
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

export default LayerDesignsBySQ;