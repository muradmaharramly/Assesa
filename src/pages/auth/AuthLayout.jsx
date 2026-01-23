import React from 'react';
import { Outlet } from 'react-router-dom';
import '../../styles/components/_auth.scss';

const AuthLayout = () => {
  return (
    <div className="auth-layout">
      <div className="auth-card">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
