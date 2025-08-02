import React, { useEffect, useState, useLayoutEffect, useRef } from 'react';
import api from '../api';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import ReactDOM from 'react-dom';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import Layout from '../components/Layout';

function CustomizeLayerDesign() {
  const { id } = useParams();
  const [design, setDesign] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [user, setUser] = useState(null);
  const [existingImages, setExistingImages] = useState([]); // URLs of already saved images
  const [newFiles, setNewFiles] = useState([]); // New files to upload
  const [imagePreviews, setImagePreviews] = useState([]);
  const [menuOpenIdx, setMenuOpenIdx] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuBtnRefs = useRef({});
  const menuRef = useRef();
  // Single image state
  const [existingImage, setExistingImage] = useState(''); // Cloudinary URL or ''
  const [newFile, setNewFile] = useState(null); // File object or null
  const [imagePreview, setImagePreview] = useState(''); // Preview URL
  const [editIdx, setEditIdx] = useState(null); // null = add, number = edit
  const [isSaving, setIsSaving] = useState(false);

  const fetchDesign = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.get(`/api/layerdesigns/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setDesign(res.data);
    } catch (err) {
      setError('Failed to fetch design');
    }
    setLoading(false);
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchDesign();
    // eslint-disable-next-line
  }, [id]);

  // Update previews when files change
  useEffect(() => {
    if (files && files.length > 0) {
      const previews = Array.from(files).map(file => URL.createObjectURL(file));
      setImagePreviews(previews);
    } else {
      setImagePreviews([]);
    }
    // Cleanup
    return () => {
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line
  }, [files]);

  // For new upload, preview
  useEffect(() => {
    if (newFile) {
      const url = URL.createObjectURL(newFile);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    } else if (existingImage) {
      setImagePreview(existingImage);
    } else {
      setImagePreview('');
    }
    // eslint-disable-next-line
  }, [newFile, existingImage]);

  const handleMenuClick = (idx, event) => {
    event.stopPropagation();
    const button = menuBtnRefs.current[idx];
    if (button) {
      const rect = button.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
      });
    }
    setMenuOpenIdx(menuOpenIdx === idx ? null : idx);
  };

  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setMenuOpenIdx(null);
    }
  };

  useLayoutEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleRemoveImage = () => {
    setNewFile(null);
    setExistingImage('');
    setImagePreview('');
  };

  const handleRemoveExistingImage = (idx) => {
    const newImages = [...existingImages];
    newImages.splice(idx, 1);
    setExistingImages(newImages);
  };

  const handleRemoveNewImage = (idx) => {
    const newFiles = [...newFiles];
    newFiles.splice(idx, 1);
    setNewFiles(newFiles);
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewFile(file);
      setExistingImage(''); // Clear existing image when new file is selected
    }
  };

  const handleOpenAdd = () => {
    setEditIdx(null);
    setTitle('');
    setShortDescription('');
    setNewFile(null);
    setExistingImage('');
    setImagePreview('');
    setShowPopup(true);
  };

  const handleEditData = (idx) => {
    const data = design.customizableData[idx];
    setEditIdx(idx);
    setTitle(data.title || '');
    setShortDescription(data.shortDescription || '');
    setExistingImage(data.files && data.files.length > 0 ? data.files[0] : '');
    setNewFile(null);
    setImagePreview(data.files && data.files.length > 0 ? data.files[0] : '');
    setShowPopup(true);
  };

  const handleDeleteData = async (idx) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this customizable data?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        const updatedData = [...design.customizableData];
        updatedData.splice(idx, 1);
        await api.put(`/api/layerdesigns/${id}`, {
          ...design,
          customizableData: updatedData
        }, { headers: { Authorization: `Bearer ${token}` } });
        fetchDesign();
        toast.success('Customizable data deleted successfully!');
      } catch (err) {
        toast.error('Failed to delete customizable data');
      }
    }
  };

  const handleAddMore = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!shortDescription.trim()) {
      toast.error('Short description is required');
      return;
    }
    if (!imagePreview) {
      toast.error('Image is required');
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      let imageUrl = existingImage;

      // Upload new file if selected
      if (newFile) {
        const formData = new FormData();
        formData.append('image', newFile);
        const uploadRes = await api.post('/api/upload', formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        imageUrl = uploadRes.data.url;
      }

      const newData = {
        title: title.trim(),
        shortDescription: shortDescription.trim(),
        files: [imageUrl]
      };

      let updatedData;
      if (editIdx !== null) {
        // Edit existing data
        updatedData = [...design.customizableData];
        updatedData[editIdx] = newData;
      } else {
        // Add new data
        updatedData = [...(design.customizableData || []), newData];
      }

      await api.put(`/api/layerdesigns/${id}`, {
        ...design,
        customizableData: updatedData
      }, { headers: { Authorization: `Bearer ${token}` } });

      setShowPopup(false);
      setTitle('');
      setShortDescription('');
      setNewFile(null);
      setExistingImage('');
      setImagePreview('');
      setEditIdx(null);
      fetchDesign();
      toast.success(editIdx !== null ? 'Customizable data updated successfully!' : 'Customizable data added successfully!');
    } catch (err) {
      toast.error('Failed to save customizable data');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user || user.role !== 'superadmin') {
    return <div style={{color:'red',margin:40}}>You are not authorized to view this page.</div>;
  }

  if (loading) {
    return (
      <Layout currentPage="customize">
        <div className="d-flex justify-content-center align-items-center min-vh-100">
          <div className="text-center">
            <div className="spinner mb-3"></div>
            <div className="text-primary">Loading...</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!design) {
    return (
      <Layout currentPage="customize">
        <div className="d-flex justify-content-center align-items-center min-vh-100">
          <div className="text-center">
            <div className="text-danger">Design not found</div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentPage="customize">
      <div className="p-4">
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h4 className="mb-0">
              <i className="fas fa-palette me-2"></i>Customize Data for: {design.designName}
            </h4>
            <button className="btn btn-primary" onClick={handleOpenAdd}>
              <i className="fas fa-plus me-2"></i>Add More Data
            </button>
          </div>
          <div className="card-body">
            {error && <div className="alert alert-danger">
              <i className="fas fa-exclamation-triangle me-2"></i>{error}
            </div>}
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '25%' }}>Title</th>
                    <th style={{ width: '35%' }}>Description</th>
                    <th style={{ width: '20%' }}>Image</th>
                    <th style={{ width: '20%', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {design.customizableData && design.customizableData.length > 0 ? (
                    design.customizableData.map((data, idx) => (
                      <tr key={idx}>
                        <td className="align-middle">{data.title}</td>
                        <td className="align-middle">{data.shortDescription}</td>
                        <td className="align-middle">
                          {data.files && data.files.length > 0 && (
                            <img 
                              src={data.files[0]} 
                              alt={data.title}
                              style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }}
                            />
                          )}
                        </td>
                        <td className="text-center">
                          <div className="d-flex justify-content-center align-items-center">
                            <button
                              ref={el => menuBtnRefs.current[idx] = el}
                              className="btn btn-sm btn-outline-secondary"
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid #dee2e6',
                                background: menuOpenIdx === idx ? '#e9ecef' : '#fff',
                                transition: 'all 0.2s ease',
                                boxShadow: menuOpenIdx === idx ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                              }}
                              onClick={(e) => handleMenuClick(idx, e)}
                              title="Actions"
                            >
                              <i className="fas fa-ellipsis-v" style={{ fontSize: '14px', color: '#6c757d' }}></i>
                            </button>
                            {menuOpenIdx === idx && ReactDOM.createPortal(
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
                                      handleEditData(idx);
                                      setMenuOpenIdx(null);
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
                                      handleDeleteData(idx);
                                      setMenuOpenIdx(null);
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
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center text-muted py-4">
                        <i className="fas fa-palette fa-2x mb-3 d-block"></i>
                        No customizable data found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Data Modal */}
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
          <div className="card shadow-lg fade-in" style={{ minWidth: 500, maxWidth: 600, width: '100%', position: 'relative' }}>
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="mb-0">
                <i className={`fas ${editIdx !== null ? 'fa-edit' : 'fa-plus'} me-2`}></i>
                {editIdx !== null ? 'Edit Data' : 'Add More Data'}
              </h4>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => setShowPopup(false)}
              ></button>
            </div>
            <div className="card-body">
              <form onSubmit={(e) => { e.preventDefault(); handleAddMore(); }} className="row g-3">
                <div className="col-12">
                  <label className="form-label">
                    <i className="fas fa-heading me-2"></i>Title
                  </label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder="Enter title"
                    required 
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">
                    <i className="fas fa-align-left me-2"></i>Short Description
                  </label>
                  <textarea 
                    className="form-control" 
                    value={shortDescription} 
                    onChange={(e) => setShortDescription(e.target.value)} 
                    placeholder="Enter short description"
                    rows="3"
                    required 
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">
                    <i className="fas fa-image me-2"></i>Image
                  </label>
                  <input 
                    type="file" 
                    className="form-control" 
                    accept="image/*"
                    onChange={handleFileInput}
                    required={!existingImage}
                  />
                  {imagePreview && (
                    <div className="mt-2">
                      <img 
                        src={imagePreview} 
                        alt="Preview"
                        style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4 }}
                        className="me-2"
                      />
                      <button 
                        type="button" 
                        className="btn btn-sm btn-outline-danger"
                        onClick={handleRemoveImage}
                      >
                        <i className="fas fa-times me-1"></i>Remove
                      </button>
                    </div>
                  )}
                </div>
                <div className="col-12">
                  <button 
                    type="submit" 
                    className="btn btn-primary w-100"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className={`fas ${editIdx !== null ? 'fa-save' : 'fa-plus'} me-2`}></i>
                        {editIdx !== null ? 'Update Data' : 'Add Data'}
                      </>
                    )}
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

export default CustomizeLayerDesign; 