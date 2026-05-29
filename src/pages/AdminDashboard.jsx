import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import api from '../api/axios';
import { CalendarCheck, DollarSign, Users, Cat } from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({ rooms: 0, bookings: 0, users: 0, revenue: 0, recent: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        setStats(res.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const formatRupiah = (num) => {
    if (num >= 1000000) return `Rp ${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `Rp ${(num / 1000).toFixed(0)}K`;
    return `Rp ${num}`;
  };

  const STATUS_MAP = {
    pending: { label: 'Pending', bg: 'bg-yellow-200' },
    approved: { label: 'Confirmed', bg: 'bg-green-300' },
    checked_in: { label: 'Checked In', bg: 'bg-blue-300' },
    checked_out: { label: 'Completed', bg: 'bg-purple-300' },
    cancelled: { label: 'Cancelled', bg: 'bg-red-300' },
    rejected: { label: 'Rejected', bg: 'bg-red-400' },
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-black mb-2 uppercase">Dashboard Overview</h1>
        <p className="text-gray-600 font-medium">Quick summary of MeowStay operations — live from database.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-neo-dark"></div>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <div className="bg-[#B983FF] p-6 border-4 border-neo-dark rounded-xl shadow-[4px_4px_0_0_#1E1E1E]">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-black text-sm uppercase tracking-wider">Active Revenue</h3>
                <DollarSign size={24} className="text-white" />
              </div>
              <p className="font-black text-3xl">{formatRupiah(stats.revenue)}</p>
            </div>

            <div className="bg-[#4ADE80] p-6 border-4 border-neo-dark rounded-xl shadow-[4px_4px_0_0_#1E1E1E]">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-black text-sm uppercase tracking-wider">Active Bookings</h3>
                <CalendarCheck size={24} className="text-neo-dark" />
              </div>
              <p className="font-black text-3xl">{stats.bookings}</p>
            </div>

            <div className="bg-[#FF9B50] p-6 border-4 border-neo-dark rounded-xl shadow-[4px_4px_0_0_#1E1E1E]">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-black text-sm uppercase tracking-wider">Rooms Total</h3>
                <Cat size={24} className="text-white" />
              </div>
              <p className="font-black text-3xl">{stats.rooms}</p>
            </div>

            <div className="bg-[#2DD4BF] p-6 border-4 border-neo-dark rounded-xl shadow-[4px_4px_0_0_#1E1E1E]">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-black text-sm uppercase tracking-wider">Registered Users</h3>
                <Users size={24} className="text-white" />
              </div>
              <p className="font-black text-3xl">{stats.users}</p>
            </div>
          </div>

          <div className="bg-white p-8 border-4 border-neo-dark rounded-xl shadow-[4px_4px_0_0_#1E1E1E]">
            <h2 className="text-2xl font-black mb-6">Recent Bookings (from DB)</h2>
            <div className="space-y-4">
              {stats.recent && stats.recent.length > 0 ? stats.recent.map(booking => {
                const st = STATUS_MAP[booking.status] || { label: booking.status, bg: 'bg-gray-300' };
                return (
                  <div key={booking.id} className="flex justify-between items-center p-4 border-2 border-dashed border-gray-400 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-neo-yellow rounded-full flex items-center justify-center font-bold border-2 border-neo-dark overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${booking.user?.name}`} alt="" className="w-full h-full" />
                      </div>
                      <div>
                        <p className="font-bold">{booking.user?.name}: {booking.room?.name}</p>
                        <p className="text-sm text-gray-500">{booking.check_in} → {booking.check_out} • Rp {Number(booking.total_price).toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                    <span className={`font-bold text-sm ${st.bg} px-3 py-1 rounded-full border-2 border-neo-dark`}>{st.label}</span>
                  </div>
                );
              }) : (
                <p className="font-bold text-gray-500 text-center py-4">No recent bookings.</p>
              )}
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;
