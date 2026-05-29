import { Link, useNavigate } from 'react-router-dom';
import { Cat, Menu, X } from 'lucide-react';
import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    navigate('/', { replace: true });
  };
  return (
    <nav className="w-full bg-neo-pink border-b-4 border-neo-dark sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 md:h-20 items-center">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-white p-1.5 md:p-2 rounded-full border-3 md:border-4 border-neo-dark shadow-neo group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-neo-hover transition-all">
                <Cat size={22} className="text-neo-dark md:hidden" strokeWidth={2.5} />
                <Cat size={28} className="text-neo-dark hidden md:block" strokeWidth={2.5} />
              </div>
              <span className="font-fredoka font-bold text-xl md:text-2xl text-neo-dark tracking-wide ml-1 md:ml-2">Michu MeowStay</span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex space-x-8 items-center">
            <Link to="/" className="text-neo-dark font-bold hover:text-white transition-colors text-lg">Home</Link>
            <Link to="/rooms" className="text-neo-dark font-bold hover:text-white transition-colors text-lg">Rooms</Link>
            <Link to="/services" className="text-neo-dark font-bold hover:text-white transition-colors text-lg">Services</Link>
            <div className="flex gap-4 ml-4">
              {user ? (
                <>
                  <Link to="/dashboard" className="neo-btn bg-white px-6 py-2 text-base">Dashboard</Link>
                  <button onClick={handleLogout} className="neo-btn neo-btn-secondary px-6 py-2 text-base">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="neo-btn bg-white px-6 py-2 text-base">Login</Link>
                  <Link to="/register" className="neo-btn neo-btn-secondary px-6 py-2 text-base">Register</Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Hamburger */}
          <button 
            onClick={() => setMobileOpen(!mobileOpen)} 
            aria-label="Toggle navigation menu"
            className="md:hidden bg-white border-3 border-neo-dark p-2 rounded-lg shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t-4 border-neo-dark bg-neo-pink px-4 pb-4 space-y-2">
          <Link to="/" onClick={() => setMobileOpen(false)} className="block px-4 py-3 font-bold text-neo-dark hover:bg-white rounded-lg border-2 border-transparent hover:border-neo-dark transition-all">Home</Link>
          <Link to="/rooms" onClick={() => setMobileOpen(false)} className="block px-4 py-3 font-bold text-neo-dark hover:bg-white rounded-lg border-2 border-transparent hover:border-neo-dark transition-all">Rooms</Link>
          <Link to="/services" onClick={() => setMobileOpen(false)} className="block px-4 py-3 font-bold text-neo-dark hover:bg-white rounded-lg border-2 border-transparent hover:border-neo-dark transition-all">Services</Link>
          <div className="border-t-2 border-neo-dark pt-2 flex flex-col gap-2">
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block text-center bg-white border-3 border-neo-dark rounded-full px-4 py-2.5 font-bold shadow-[2px_2px_0_0_#1E1E1E]">Dashboard</Link>
                <button onClick={handleLogout} className="bg-neo-yellow border-3 border-neo-dark rounded-full px-4 py-2.5 font-bold shadow-[2px_2px_0_0_#1E1E1E]">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="block text-center bg-white border-3 border-neo-dark rounded-full px-4 py-2.5 font-bold shadow-[2px_2px_0_0_#1E1E1E]">Login</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="block text-center bg-neo-yellow border-3 border-neo-dark rounded-full px-4 py-2.5 font-bold shadow-[2px_2px_0_0_#1E1E1E]">Register</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
