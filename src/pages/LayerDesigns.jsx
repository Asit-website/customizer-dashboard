import React, { useEffect, useState, useLayoutEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import ReactDOM from 'react-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import Layout from '../components/Layout';

function LayerDesigns() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [newSq, setNewSq] = useState('');
  const [menuOpenSq, setMenuOpenSq] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuBtnRefs = useRef({});
  const menuRef = useRef();
  const navigate = useNavigate();
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState('');
  const [newProductType, setNewProductType] = useState('2d');
  const [newTabSettings, setNewTabSettings] = useState({
    aiEditor: true,
    imageEdit: true,
    textEdit: true,
    colors: true,
    clipart: true
  });
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [editProduct, setEditProduct] = useState('');
  const [editProductOld, setEditProductOld] = useState('');
  const [editProductType, setEditProductType] = useState('2d');
  const [editTabSettings, setEditTabSettings] = useState({
    aiEditor: true,
    imageEdit: true,
    textEdit: true,
    colors: true,
    clipart: true
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/api/layerdesigns', { headers: { Authorization: `Bearer ${token}` } });
      // Group by SQ and get unique products
      const productMap = new Map();
      res.data.forEach(design => {
        if (!productMap.has(design.sq)) {
          productMap.set(design.sq, {
            sq: design.sq,
            productType: design.productType,
            tabSettings: design.tabSettings
          });
        }
      });
      setProducts(Array.from(productMap.values()));
    } catch (err) {
      setError('Failed to fetch Products');
    }
    setLoading(false);
  };

  const handleAddProduct = async () => {
    setError('');
    if (!newProduct.trim()) {
      setError('Product name is required');
      toast.error('Product name is required');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await api.post('/api/layerdesigns', {
        sq: newProduct,
        designName: 'Default Design',
        productType: newProductType,
        tabSettings: newTabSettings,
        layersDesign: {}
      }, { headers: { Authorization: `Bearer ${token}` } });
      setShowAddProduct(false);
      setNewProduct('');
      setNewProductType('2d');
      setNewTabSettings({
        aiEditor: true,
        imageEdit: true,
        textEdit: true,
        colors: true,
        clipart: true
      });
      fetchProducts();
      toast.success('Product added successfully!');
    } catch (err) {
      setError('Failed to add Product');
      toast.error('Failed to add Product');
    }
  };

  const handleEditProduct = async () => {
    setError('');
    if (!editProduct.trim()) {
      setError('Product SQ is required');
      toast.error('Product SQ is required');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      // Update all LayerDesigns with old SQ to new SQ
      await api.put('/api/layerdesigns/bulk-update-sq', {
        oldSq: editProductOld,
        newSq: editProduct
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      // Update product type and tab settings for all designs with this SQ
      const designsResponse = await api.get('/api/layerdesigns', { headers: { Authorization: `Bearer ${token}` } });
      const designsToUpdate = designsResponse.data.filter(design => design.sq === editProduct);
      
      for (const design of designsToUpdate) {
        await api.put(`/api/layerdesigns/${design.id}`, {
          sq: editProduct,
          designName: design.designName,
          productType: editProductType,
          tabSettings: editTabSettings,
          layersDesign: design.layersDesign,
          customizableData: design.customizableData
        }, { headers: { Authorization: `Bearer ${token}` } });
      }
      
      setShowEditProduct(false);
      setEditProduct('');
      setEditProductOld('');
      setEditProductType('2d');
      setEditTabSettings({
        aiEditor: true,
        imageEdit: true,
        textEdit: true,
        colors: true,
        clipart: true
      });
      fetchProducts();
      toast.success('Product updated successfully!');
    } catch (err) {
      setError('Failed to update Product');
      toast.error('Failed to update Product');
    }
  };

  const handleDeleteProduct = async (sq) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete Product SQ: ${sq}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        await api.delete(`/api/layerdesigns/by-sq/${sq}`, { headers: { Authorization: `Bearer ${token}` } });
        fetchProducts();
        toast.success('Product deleted successfully!');
      } catch (err) {
        toast.error('Failed to delete Product');
      }
    }
  };

  const handleMenuClick = (sq, event) => {
    event.stopPropagation();
    const button = menuBtnRefs.current[sq];
    if (button) {
      const rect = button.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
      });
    }
    setMenuOpenSq(menuOpenSq === sq ? null : sq);
  };

  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setMenuOpenSq(null);
    }
  };

  useLayoutEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  if (!user || user.role !== 'superadmin') {
    return <div style={{color:'red',margin:40}}>You are not authorized to view this page.</div>;
  }

  return (
    <Layout currentPage="products">
      <div className="p-4">
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h4 className="mb-0">
              <i className="fas fa-box me-2"></i>All Products
            </h4>
            <button className="btn btn-primary" onClick={() => setShowAddProduct(true)}>
              <i className="fas fa-plus me-2"></i>Add Product
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
                      <th style={{ width: '40%' }}>Product SQ</th>
                      <th style={{ width: '20%' }}>Product Type</th>
                      <th style={{ width: '20%' }}>Tab Settings</th>
                      <th style={{ width: '20%', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => (
                      <tr key={product.sq}>
                        <td className="align-middle">{product.sq}</td>
                        <td className="align-middle">
                          <span className={`badge ${product.productType === '3d' ? 'bg-success' : 'bg-primary'}`}>
                            {product.productType.toUpperCase()}
                          </span>
                        </td>
                        <td className="align-middle">
                          <div className="d-flex flex-wrap gap-1">
                            {Object.entries(product.tabSettings).map(([key, value]) => (
                              <span 
                                key={key} 
                                className={`badge ${value ? 'bg-success' : 'bg-secondary'}`}
                                style={{ fontSize: '10px' }}
                              >
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="text-center">
                          <div className="d-flex justify-content-center align-items-center">
                            <button
                              ref={el => menuBtnRefs.current[product.sq] = el}
                              className="btn btn-sm btn-outline-secondary"
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid #dee2e6',
                                                                 background: menuOpenSq === product.sq ? '#e9ecef' : '#fff',
                                 transition: 'all 0.2s ease',
                                 boxShadow: menuOpenSq === product.sq ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                              }}
                              onClick={(e) => handleMenuClick(product.sq, e)}
                              title="Actions"
                            >
                              <i className="fas fa-ellipsis-v" style={{ fontSize: '14px', color: '#6c757d' }}></i>
                            </button>
                            {menuOpenSq === product.sq && ReactDOM.createPortal(
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
                                      setEditProductOld(product.sq);
                                      setEditProduct(product.sq);
                                      setEditProductType(product.productType);
                                      setEditTabSettings(product.tabSettings);
                                      setShowEditProduct(true);
                                      setMenuOpenSq(null);
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
                                      handleDeleteProduct(product.sq);
                                      setMenuOpenSq(null);
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
                                      navigate(`/layerdesigns/${product.sq}`);
                                      setMenuOpenSq(null);
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
                    ))}
                    {products.length === 0 && (
                      <tr>
                        <td colSpan="4" className="text-center text-muted py-4">
                          <i className="fas fa-box-open fa-2x mb-3 d-block"></i>
                          No products found.
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

      {/* Add Product Modal */}
      {showAddProduct && (
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
                <i className="fas fa-plus me-2"></i>Add New Product
              </h4>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => setShowAddProduct(false)}
              ></button>
            </div>
            <div className="card-body">
              <form onSubmit={(e) => { e.preventDefault(); handleAddProduct(); }} className="row g-3">
                <div className="col-12">
                  <label className="form-label">
                    <i className="fas fa-box me-2"></i>Product SQ
                  </label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={newProduct} 
                    onChange={(e) => setNewProduct(e.target.value)} 
                    placeholder="Enter Product SQ"
                    required 
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">
                    <i className="fas fa-cube me-2"></i>Product Type
                  </label>
                  <select 
                    className="form-control" 
                    value={newProductType} 
                    onChange={(e) => setNewProductType(e.target.value)}
                  >
                    <option value="2d">2D</option>
                    <option value="3d">3D</option>
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label">
                    <i className="fas fa-tabs me-2"></i>Tab Settings
                  </label>
                  <div className="row g-2">
                    {Object.entries(newTabSettings).map(([key, value]) => (
                      <div key={key} className="col-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`new-${key}`}
                            checked={value}
                            onChange={(e) => setNewTabSettings(prev => ({
                              ...prev,
                              [key]: e.target.checked
                            }))}
                          />
                          <label className="form-check-label" htmlFor={`new-${key}`}>
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="col-12">
                  <button type="submit" className="btn btn-primary w-100">
                    <i className="fas fa-save me-2"></i>Add Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditProduct && (
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
                <i className="fas fa-edit me-2"></i>Edit Product
              </h4>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => setShowEditProduct(false)}
              ></button>
            </div>
            <div className="card-body">
              <form onSubmit={(e) => { e.preventDefault(); handleEditProduct(); }} className="row g-3">
                <div className="col-12">
                  <label className="form-label">
                    <i className="fas fa-box me-2"></i>Product SQ
                  </label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={editProduct} 
                    onChange={(e) => setEditProduct(e.target.value)} 
                    placeholder="Enter Product SQ"
                    required 
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">
                    <i className="fas fa-cube me-2"></i>Product Type
                  </label>
                  <select 
                    className="form-control" 
                    value={editProductType} 
                    onChange={(e) => setEditProductType(e.target.value)}
                  >
                    <option value="2d">2D</option>
                    <option value="3d">3D</option>
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label">
                    <i className="fas fa-tabs me-2"></i>Tab Settings
                  </label>
                  <div className="row g-2">
                    {Object.entries(editTabSettings).map(([key, value]) => (
                      <div key={key} className="col-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`edit-${key}`}
                            checked={value}
                            onChange={(e) => setEditTabSettings(prev => ({
                              ...prev,
                              [key]: e.target.checked
                            }))}
                          />
                          <label className="form-check-label" htmlFor={`edit-${key}`}>
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="col-12">
                  <button type="submit" className="btn btn-primary w-100">
                    <i className="fas fa-save me-2"></i>Update Product
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

export default LayerDesigns; 