import { useState, useEffect, useRef } from 'react';
import { Bell, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const NotificationWidget = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const widgetRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchNotifications();
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target) && isOpen) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/mark-as-read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications(notifications.map(n => ({ ...n, read_at: new Date().toISOString() })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotifClick = (notif) => {
    if (!notif.read_at) {
      markAsRead(notif.id);
    }
    if (notif.data.url) {
      navigate(notif.data.url);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={widgetRef}
      className="absolute top-16 right-4 md:right-8 w-[320px] md:w-[380px] bg-white border-4 border-neo-dark shadow-[4px_4px_0_0_#1a1a1a] rounded-xl z-50 overflow-hidden flex flex-col"
    >
      <div className="bg-neo-yellow p-4 border-b-4 border-neo-dark flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-neo-dark" />
          <h3 className="font-bold text-lg text-neo-dark">Notifikasi</h3>
        </div>
        <div className="flex items-center gap-2">
          {notifications.some(n => !n.read_at) && (
            <button 
              onClick={markAllRead}
              className="text-xs font-bold text-neo-dark underline hover:text-black"
            >
              Tandai semua dibaca
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 max-h-[400px] overflow-y-auto bg-neo-white">
        {loading ? (
          <div className="p-8 text-center text-sm font-bold text-neo-dark">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center gap-2">
            <Bell className="w-8 h-8 text-neo-dark opacity-50" />
            <p className="font-bold text-neo-dark">Belum ada notifikasi</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {notifications.map(notif => {
              const isUnread = !notif.read_at;
              const type = notif.data.type || 'info';
              
              let Icon = Info;
              let iconColor = 'text-blue-500';
              if (type === 'success') { Icon = CheckCircle2; iconColor = 'text-green-500'; }
              if (type === 'error') { Icon = AlertCircle; iconColor = 'text-red-500'; }

              return (
                <div 
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  className={`p-4 border-b-2 border-neo-dark cursor-pointer transition-colors hover:bg-neo-pink/20 ${isUnread ? 'bg-neo-yellow/30' : 'bg-white'}`}
                >
                  <div className="flex gap-3">
                    <div className="mt-1">
                      <Icon className={`w-5 h-5 ${iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className={`text-sm text-neo-dark ${isUnread ? 'font-bold' : 'font-semibold'}`}>
                        {notif.data.title}
                      </h4>
                      <p className="text-xs text-gray-700 mt-1">{notif.data.message}</p>
                      <p className="text-[10px] text-gray-500 font-bold mt-2">
                        {new Date(notif.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {isUnread && (
                      <div className="w-2 h-2 rounded-full bg-neo-red mt-2 flex-shrink-0"></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationWidget;
