import React from 'react';
import BottomNav from '../common/BottomNav';

const Layout = ({ children, showBottomNav = false, activeNav = 'home' }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content Area */}
      <main className="pb-20">
        {children}
      </main>

      {/* Bottom Navigation - Only shows when showBottomNav is true */}
      {showBottomNav && <BottomNav active={activeNav} />}
    </div>
  );
};

export default Layout;