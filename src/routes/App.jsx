import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { loginRequest } from '../authConfig';
import MainPage from '../views/MainPage';
import Login from '../views/Login';
import NoPermission from '../views/NoPermissionPage';
import React, { useState, useEffect } from 'react';
import Loader from '../components/Loader/Loader';
import MyBooking from '../components/Layout/MyBooking';
import BookingForm from '../components/Layout/BookingForm';
import ManageUser from '../components/Layout/ManageUser';
import { useCheckSessionExpired } from '../components/Error/index';

const App = () => {
  const { instance } = useMsal();
  const [isAuthenticated,setAuth] = useState(false);
  const [isLoadingReload, setIsLoadingReload] = useState(false);
  const reload = localStorage.getItem('reload');
  const path = localStorage.getItem('path');
  const userToken = localStorage.getItem('userData');
  const expire = useCheckSessionExpired(userToken);
  const isAuth = useIsAuthenticated();
  const handleLogin = () => { instance.loginRedirect(loginRequest).catch(e => { console.error(e); }); };

  const handleLogout = () => {
    localStorage.clear(); // Clear all items from localStorage
    instance.logoutRedirect().catch(e => {
      console.error(e);
    });
  };

  useEffect(() => {
    //Check reload page to show display loader
    if (window.performance) {
      if (performance.navigation.type === 1) {
        setIsLoadingReload(true);
        setTimeout(() => {
          setIsLoadingReload(false);
        }, 500)
      }
    }
    // Additional check for the reload flag
    if (reload === "true" && isAuthenticated) {
      localStorage.removeItem("reload");
    }
    setTimeout(() => { localStorage.removeItem("path") }, 1500)
  }, [isAuthenticated, reload]);

  useEffect(() => {
    if(userToken){ setAuth(true); } else { setAuth(isAuth); }
  }, [isAuthenticated, expire,userToken,isAuth]);
  

  return (

    <Router>
      <Routes>
        {/* Routes for unauthenticated users */}
        <Route path="/calendar/:id/location/:location" element={<BookingForm />} />
        {!isAuthenticated && (
          <>
            <Route path="/" element={isLoadingReload ? <Loader /> : <Login handleLogin={handleLogin} />} />
            <Route path="/blocked" element={<Login handleLogin={handleLogin} />} />
          </>
        )}
        {/* Main Routes for authenticated users */}
        {isAuthenticated && (
          <>
            <Route path="/calendar" element={<MainPage handleLogout={handleLogout} />} />
            <Route path="/my-booking" element={<MyBooking handleLogout={handleLogout} />} />
            <Route path="/manage-user" element={<ManageUser handleLogout={handleLogout} />} />
            <Route path="/blocked" element={<NoPermission handleLogout={handleLogout} />} />
          </>
        )}
        {/* Default redirect if the user is authenticated */}
        <Route path="*" element={
            isAuthenticated && !expire ? (
              <Navigate to="/calendar" />
            ) : (reload === 'true' && isAuthenticated) || (path === '/my-booking' && isAuthenticated) ? (
              <Navigate to="/my-booking" />
            ) : (path === '/manage-user' && isAuthenticated) ? (
              <Navigate to="/manage-user" />
            ) : isAuthenticated ? (
              <Navigate to="/calendar" />
            ) : (<Navigate to="/" />)
          }/>
  
{/*   <Route path="*" element={
          (reload === 'true' && isAuthenticated) || (path === '/my-booking' && isAuthenticated) ? (
            <Navigate to="/my-booking" />
          ) : (path === '/manage-user' && isAuthenticated) ? (
            <Navigate to="/manage-user" />
          ) : isAuthenticated ? (
            <Navigate to="/calendar" />
          ) : (<Navigate to="/" />)
        }
        /> */}
      </Routes>
    </Router>
  );
};

export default App;
