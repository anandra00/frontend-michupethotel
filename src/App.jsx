import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import ManageRooms from './pages/admin/ManageRooms';
import Reservations from './pages/admin/Reservations';
import AdminSitters from './pages/admin/AdminSitters';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';
import SitterBooking from './pages/user/SitterBooking';
import History from './pages/user/History';
import Profile from './pages/user/Profile';
import DailyReport from './pages/user/DailyReport';
import Rooms from './pages/Rooms';
import Services from './pages/Services';

import { useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import PageTransition from './components/PageTransition';

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
        <Route path="/rooms" element={<PageTransition><Rooms /></PageTransition>} />
        <Route path="/services" element={<PageTransition><Services /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
        
        {/* User Routes — harus login */}
        <Route path="/dashboard" element={<ProtectedRoute><PageTransition><Dashboard /></PageTransition></ProtectedRoute>} />
        <Route path="/dashboard/history" element={<ProtectedRoute><PageTransition><History /></PageTransition></ProtectedRoute>} />
        <Route path="/dashboard/sitter" element={<ProtectedRoute><PageTransition><SitterBooking /></PageTransition></ProtectedRoute>} />
        <Route path="/dashboard/profile" element={<ProtectedRoute><PageTransition><Profile /></PageTransition></ProtectedRoute>} />
        <Route path="/dashboard/reports/:id" element={<ProtectedRoute><PageTransition><DailyReport /></PageTransition></ProtectedRoute>} />
        
        {/* Admin Routes — harus login + admin */}
        <Route path="/admin" element={<ProtectedRoute requireAdmin><PageTransition><AdminDashboard /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/rooms" element={<ProtectedRoute requireAdmin><PageTransition><ManageRooms /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/reservations" element={<ProtectedRoute requireAdmin><PageTransition><Reservations /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/sitters" element={<ProtectedRoute requireAdmin><PageTransition><AdminSitters /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute requireAdmin><PageTransition><AdminReports /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute requireAdmin><PageTransition><AdminSettings /></PageTransition></ProtectedRoute>} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <Toaster 
        position="top-center"
        toastOptions={{
          className: 'border-4 border-neo-dark rounded-xl shadow-[4px_4px_0_0_#1E1E1E] font-fredoka font-bold text-neo-dark',
          style: {
            background: '#FFF8E7',
            color: '#1E1E1E',
            padding: '16px 24px',
          },
          success: {
            style: {
              background: '#A2D2FF', // neo-blue
            },
          },
          error: {
            style: {
              background: '#FFB5C6', // neo-pink
            },
          },
        }}
      />
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <AnimatedRoutes />
        </main>
      </div>
    </Router>
  );
}

export default App;
