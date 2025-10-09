import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Login from './Login';

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const rol = localStorage.getItem('rol');

    if (token && rol === 'admin') {
      navigate('/admin');
    } else if (token && rol === 'apoderado') {
      navigate('/apoderado');
    }
  }, [navigate]);

  return (
    <div>
      <Login />
    </div>
  );
};

export default Home;