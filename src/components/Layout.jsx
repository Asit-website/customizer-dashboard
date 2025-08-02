import React from 'react';

function Layout({ children, currentPage }) {
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard':
        return user?.role === 'superadmin' ? 'Admin Dashboard' : 'Configuration';
      case 'users':
        return 'Users Management';
      case 'products':
        return 'Products';
      case 'layerdesigns':
        return 'Product Designs';
      case 'customize':
        return 'Customize Design';
      default:
        return 'Dashboard';
    }
  };

  const getPageIcon = () => {
    switch (currentPage) {
      case 'dashboard':
        return user?.role === 'superadmin' ? 'fa-tachometer-alt' : 'fa-cog';
      case 'users':
        return 'fa-users';
      case 'products':
      case 'layerdesigns':
      case 'customize':
        return 'fa-box';
      default:
        return 'fa-home';
    }
  };

  const getBreadcrumbItems = () => {
    const items = [];
    
    if (user?.role === 'superadmin') {
      items.push({ name: 'Dashboard', path: '/' });
      
      if (currentPage === 'users') {
        items.push({ name: 'Users', path: null });
      } else if (currentPage === 'products' || currentPage === 'layerdesigns') {
        items.push({ name: 'Products', path: null });
      } else if (currentPage === 'customize') {
        items.push({ name: 'Products', path: '/layerdesigns' });
        items.push({ name: 'Customize Design', path: null });
      }
    } else {
      items.push({ name: 'Configuration', path: null });
    }
    
    return items;
  };

  return (
    <div className="d-flex min-vh-100">
      {/* Sidebar */}
      <div className="sidebar p-4 d-flex flex-column align-items-center" style={{ width: 280, minHeight: '100vh' }}>
        <div className="mb-4 text-center">
          <div className="text-primary fs-3 fw-bold mb-2">
            <i className="fas fa-cube me-2"></i>Customizer
          </div>
          <div className="text-secondary small">Product Management System</div>
        </div>
        
        <ul className="nav nav-pills flex-column w-100">
          <li className="nav-item mb-2">
            <a className={`nav-link${window.location.pathname === '/' ? ' active' : ''}`} href="/">
              <i className={`fas ${user?.role === 'superadmin' ? 'fa-tachometer-alt' : 'fa-cog'} me-2`}></i>
              {user?.role === 'superadmin' ? 'Dashboard' : 'Configuration'}
            </a>
          </li>
          {user?.role === 'superadmin' && <>
            <li className="nav-item mb-2">
              <a className={`nav-link${window.location.pathname === '/users' ? ' active' : ''}`} href="/users">
                <i className="fas fa-users me-2"></i>Users
              </a>
            </li>
            <li className="nav-item mb-2">
              <a className={`nav-link${window.location.pathname.startsWith('/layerdesigns') || window.location.pathname.startsWith('/customize-layerdesign') ? ' active' : ''}`} href="/layerdesigns">
                <i className="fas fa-box me-2"></i>Products
              </a>
            </li>
          </>}
        </ul>
        
        <div className="mt-auto text-center">
          <div className="small text-secondary mb-2">
            <i className="fas fa-user-circle me-1"></i>
            {user?.name}
          </div>
          <div className="small text-secondary opacity-75">
            <i className="fas fa-copyright me-1"></i>
            {new Date().getFullYear()} Customizer
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-grow-1 d-flex flex-column">
        {/* Header */}
        <div className="header px-4 py-3 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <div className="text-primary fs-4 fw-bold me-3">
              <i className={`fas ${getPageIcon()} me-2`}></i>
              {getPageTitle()}
            </div>
            <div className="badge badge-primary">
              <i className="fas fa-user-shield me-1"></i>
              {user?.role === 'superadmin' ? 'Super Admin' : 'User'}
            </div>
          </div>
          
          <div className="d-flex align-items-center gap-3">
            <div className="text-end">
              <div className="fw-semibold text-primary">{user?.name}</div>
              <div className="small text-secondary">{user?.email}</div>
            </div>
            <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt me-1"></i>Logout
            </button>
          </div>
        </div>
        
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="px-4 py-2">
          <ol className="breadcrumb mb-0">
            {getBreadcrumbItems().map((item, index) => (
              <li key={index} className={`breadcrumb-item${index === getBreadcrumbItems().length - 1 ? ' active' : ''}`}>
                {item.path ? (
                  <a href={item.path}>
                    <i className="fas fa-home me-1"></i>
                    {item.name}
                  </a>
                ) : (
                  <>
                    <i className="fas fa-home me-1"></i>
                    {item.name}
                  </>
                )}
              </li>
            ))}
          </ol>
        </nav>
        
        {/* Page Content */}
        <div className="flex-grow-1">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Layout; 