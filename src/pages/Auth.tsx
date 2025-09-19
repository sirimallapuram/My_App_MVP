import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import SignupForm from '../components/SignupForm';

const Auth: React.FC = () => {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    // Set form type based on current route
    setIsLogin(location.pathname === '/login');
  }, [location.pathname]);

  return (
    <div>
      {isLogin ? (
        <LoginForm onSwitchToSignup={() => setIsLogin(false)} />
      ) : (
        <SignupForm onSwitchToLogin={() => setIsLogin(true)} />
      )}
    </div>
  );
};

export default Auth;
