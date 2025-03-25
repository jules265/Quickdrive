import  { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import StudentRegistration from './pages/StudentRegistration';
import DriverRegistration from './pages/DriverRegistration';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import DriverDashboard from './pages/DriverDashboard';
import ManageTrips from './pages/ManageTrips';
import Layout from './components/Layout';

function ProtectedRoute({ 
  children, 
  allowedRoles 
}: { 
  children: JSX.Element; 
  allowedRoles: string[] 
}) {
  const { currentUser, userProfile } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  if (!userProfile || !allowedRoles.includes(userProfile.role)) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
}

function App() {
  const { currentUser, userProfile } = useAuth();

  useEffect(() => {
    document.title = "Student Transport Tracker";
  }, []);

  return (
    <Routes>
      <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!currentUser ? <Register /> : <Navigate to="/dashboard" />} />
      
      <Route path="/" element={<Layout />}>
        <Route index element={currentUser ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
        
        <Route path="/dashboard" element={
          currentUser ? (
            userProfile?.role === 'admin' ? <AdminDashboard /> :
            userProfile?.role === 'student' ? <StudentDashboard /> :
            userProfile?.role === 'driver' ? <DriverDashboard /> :
            <Dashboard />
          ) : <Navigate to="/login" />
        } />
        
        <Route path="/student-registration" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <StudentRegistration />
          </ProtectedRoute>
        } />
        
        <Route path="/driver-registration" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DriverRegistration />
          </ProtectedRoute>
        } />
        
        <Route path="/manage-trips" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ManageTrips />
          </ProtectedRoute>
        } />
      </Route>
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
 