import { useContext, useState, useEffect } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import FAQWidget from './FAQWidget';
import NotificationWidget from './NotificationWidget';
import api from '../api/axios';
import { 
  Home, CalendarDays, MapPin, User, Settings, LogOut,
  LayoutDashboard, CalendarHeart, Cat, Users, FileText,
  Bell, HelpCircle, Menu, X
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get('/notifications');
        setUnreadCount(res.data.filter(n => !n.read_at).length);
      } catch (e) {
        console.error(e);
      }
    };
    if (user) fetchUnread();
    
    // Polling setiap 2 menit (agar terminal tidak spam)
    const interval = setInterval(() => {
      if (user) fetchUnread();
    }, 120000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isAdmin = user?.role === 'admin';

  const userLinks = [
    { name: 'Home', path: '/dashboard', icon: <Home size={20} /> },
    { name: 'History', path: '/dashboard/history', icon: <CalendarDays size={20} /> },
    { name: 'Sitter', path: '/dashboard/sitter', icon: <MapPin size={20} /> },
    { name: 'Profile', path: '/dashboard/profile', icon: <User size={20} /> },
  ];

  const adminLinks = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: 'Reservations', path: '/admin/reservations', icon: <CalendarHeart size={20} /> },
    { name: 'Rooms', path: '/admin/rooms', icon: <Cat size={20} /> },
    { name: 'Sitters', path: '/admin/sitters', icon: <Users size={20} /> },
    { name: 'Reports', path: '/admin/reports', icon: <FileText size={20} /> },
  ];

  const links = isAdmin ? adminLinks : userLinks;

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-64px)] md:min-h-[calc(100vh-80px)] bg-neo-bg">
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed bottom-4 right-4 z-50 bg-neo-pink border-4 border-neo-dark p-3 rounded-full shadow-[4px_4px_0_0_#1E1E1E] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 w-64 bg-neo-bg border-r-4 border-neo-dark flex flex-col p-4 md:p-6
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        overflow-y-auto
      `}>
        {/* User Info */}
        <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-3 md:border-4 border-neo-dark overflow-hidden bg-white shrink-0">
             <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user?.name || 'User'}`} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
             <p className="font-black text-neo-dark text-base md:text-lg leading-tight truncate">Hi, {user?.name}!</p>
             <p className="text-xs font-bold text-gray-500 truncate">{isAdmin ? 'System Administrator' : 'Ready for a MeowStay?'}</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-2 md:space-y-3">
          {links.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              end={link.path === '/admin' || link.path === '/dashboard'}
              onClick={closeSidebar}
              className={({ isActive }) => 
                `flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg border-3 md:border-4 font-bold text-sm md:text-base transition-all ${
                  isActive 
                  ? 'bg-neo-pink border-neo-dark shadow-[3px_3px_0_0_#1E1E1E] md:shadow-[4px_4px_0_0_#1E1E1E]' 
                  : 'bg-white border-transparent hover:border-neo-dark hover:bg-gray-50 border-dashed hover:border-solid'
                }`
              }
            >
              {link.icon}
              {link.name}
            </NavLink>
          ))}
          
          {!isAdmin && (
             <div className="pt-3 md:pt-4">
                <Link to="/rooms" onClick={closeSidebar} className="block w-full bg-neo-yellow border-3 md:border-4 border-neo-dark rounded-lg py-2.5 md:py-3 font-bold text-sm md:text-base shadow-[3px_3px_0_0_#1E1E1E] md:shadow-[4px_4px_0_0_#1E1E1E] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all text-center">
                   Pesan Inap
                </Link>
             </div>
          )}
        </nav>

        {/* Bottom Actions */}
        <div className="mt-6 md:mt-8 border-t-3 md:border-t-4 border-neo-dark pt-4 md:pt-6 space-y-1 md:space-y-2">
          <Link to={isAdmin ? '/admin/settings' : '/dashboard/profile'} onClick={closeSidebar} className="flex items-center gap-3 px-3 md:px-4 py-2 font-bold text-sm md:text-base hover:text-neo-pink transition-colors w-full text-left rounded-lg hover:bg-white">
            <Settings size={18} />
            Settings
          </Link>
          <button 
            onClick={() => { handleLogout(); closeSidebar(); }}
            className="flex items-center gap-3 px-3 md:px-4 py-2 font-bold text-sm md:text-base hover:text-red-500 transition-colors w-full text-left rounded-lg hover:bg-white"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-3 md:p-8 overflow-y-auto pb-20 md:pb-8">
         {/* Top Header */}
         <div className="flex justify-between items-center mb-4 md:mb-8 pb-3 md:pb-4 border-b-3 md:border-b-4 border-neo-dark">
            <div className="hidden sm:flex items-center gap-6">
                <div className="relative">
                   <input type="text" placeholder="Search..." className="border-3 md:border-4 border-neo-dark rounded-full px-4 py-2 pl-10 text-sm md:text-base focus:outline-none focus:ring-4 focus:ring-neo-pink w-40 md:w-auto" />
                   <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🔍</div>
                </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3 ml-auto">
                <button onClick={() => setNotifOpen(!notifOpen)} className="relative w-8 h-8 md:w-10 md:h-10 rounded-full border-3 md:border-4 border-neo-dark flex items-center justify-center bg-white hover:bg-neo-yellow transition-colors shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none">
                  <Bell size={16} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-neo-red border-2 border-neo-dark rounded-full"></span>
                  )}
                </button>
                <button onClick={() => setFaqOpen(!faqOpen)} className="w-8 h-8 md:w-10 md:h-10 rounded-full border-3 md:border-4 border-neo-dark flex items-center justify-center bg-white hover:bg-neo-pink transition-colors shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none">
                  <HelpCircle size={16} />
                </button>
                <Link 
                  to={isAdmin ? '/admin' : '/dashboard/profile'} 
                  className="bg-neo-pink text-white font-bold px-3 md:px-4 py-1.5 md:py-2 rounded-full border-3 md:border-4 border-neo-dark shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center gap-1.5 text-sm md:text-base"
                >
                  <User size={14} />
                  <span className="hidden sm:inline">Profile</span>
                </Link>
            </div>
         </div>

         {children}
      </main>

      {/* FAQ Widget */}
      <FAQWidget isOpen={faqOpen} onClose={() => setFaqOpen(false)} />

      {/* Notification Widget */}
      <NotificationWidget isOpen={notifOpen} onClose={() => { setNotifOpen(false); setUnreadCount(0); }} />
    </div>
  );
};

export default DashboardLayout;
