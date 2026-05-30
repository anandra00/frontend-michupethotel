import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';

// Lazy-load subpages to reduce initial bundle size dramatically
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ManageRooms = lazy(() => import('./pages/admin/ManageRooms'));
const Reservations = lazy(() => import('./pages/admin/Reservations'));
const AdminSitters = lazy(() => import('./pages/admin/AdminSitters'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const SitterBooking = lazy(() => import('./pages/user/SitterBooking'));
const History = lazy(() => import('./pages/user/History'));
const Profile = lazy(() => import('./pages/user/Profile'));
const DailyReport = lazy(() => import('./pages/user/DailyReport'));
const Rooms = lazy(() => import('./pages/Rooms'));
const Services = lazy(() => import('./pages/Services'));
const NotFound = lazy(() => import('./pages/NotFound'));

import { useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import PageTransition from './components/PageTransition';

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="neo-spinner text-neo-pink border-4 w-12 h-12"></div>
        <p className="font-fredoka font-bold text-lg text-neo-dark animate-pulse">Loading Michu...</p>
      </div>
    }>
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
          
          {/* Catch-All 404 Route */}
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Routes>
      </AnimatePresence>
    </Suspense>
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
