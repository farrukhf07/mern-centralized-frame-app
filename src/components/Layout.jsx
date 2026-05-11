import React, { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleCollapseChange = useCallback((collapsed) => {
    setIsCollapsed(collapsed);
  }, []);

  return (
    <div className="sidebar-layout">
      <Sidebar onCollapseChange={handleCollapseChange} />
      <main className={`sidebar-main-content ${isCollapsed ? 'sidebar-collapsed-margin' : ''}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
