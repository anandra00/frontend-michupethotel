import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Users, TrendingUp, TrendingDown, Cat, CalendarCheck } from 'lucide-react';
import api from '../../api/axios';

const AdminReports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get('/admin/reports');
        setData(res.data);
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6 animate-pulse">
          <div className="h-10 bg-gray-300 rounded w-1/3 neo-skeleton"></div>
          <div className="grid md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-300 rounded-xl neo-skeleton"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-300 rounded-xl neo-skeleton"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) return null;

  const { summary, popular_rooms, chart_data } = data;

  const formatCurrency = (amount) => {
    if (amount >= 1000000) return `Rp ${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `Rp ${(amount / 1000).toFixed(1)}K`;
    return `Rp ${amount}`;
  };

  const getGrowth = (current, last) => {
    if (last === 0) return current > 0 ? '+100%' : '0%';
    const pct = Math.round(((current - last) / last) * 100);
    return pct >= 0 ? `+${pct}%` : `${pct}%`;
  };

  const getGrowthColor = (current, last) => {
    if (current >= last) return 'text-green-700';
    return 'text-red-600';
  };

  const maxChartVal = Math.max(...chart_data.map(d => d.val), 10); // Minimum 10 scale

  // Colors for popular rooms
  const roomColors = ['bg-neo-yellow', 'bg-[#4ADE80]', 'bg-[#B983FF]', 'bg-neo-pink'];

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-black mb-2 uppercase">Reports & Analytics</h1>
        <p className="text-gray-600 font-medium">Overview of MeowStay business performance.</p>
      </div>

      {/* Monthly Summary */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#4ADE80] p-6 border-4 border-neo-dark rounded-xl shadow-[4px_4px_0_0_#1E1E1E]">
          <div className="flex justify-between items-start mb-2">
            <p className="font-black text-xs uppercase tracking-wider">Revenue Bulan Ini</p>
            {summary.revenue.current >= summary.revenue.last ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          </div>
          <p className="font-black text-3xl mb-1">{formatCurrency(summary.revenue.current)}</p>
          <p className={`text-sm font-bold ${getGrowthColor(summary.revenue.current, summary.revenue.last)}`}>
            {getGrowth(summary.revenue.current, summary.revenue.last)} dari bulan lalu
          </p>
        </div>
        
        <div className="bg-neo-yellow p-6 border-4 border-neo-dark rounded-xl shadow-[4px_4px_0_0_#1E1E1E]">
          <div className="flex justify-between items-start mb-2">
            <p className="font-black text-xs uppercase tracking-wider">Booking Bulan Ini</p>
            <CalendarCheck size={20} />
          </div>
          <p className="font-black text-3xl mb-1">{summary.bookings.current}</p>
          <p className={`text-sm font-bold ${getGrowthColor(summary.bookings.current, summary.bookings.last)}`}>
            {getGrowth(summary.bookings.current, summary.bookings.last)} dari bulan lalu
          </p>
        </div>

        <div className="bg-[#B983FF] p-6 border-4 border-neo-dark rounded-xl shadow-[4px_4px_0_0_#1E1E1E]">
          <div className="flex justify-between items-start mb-2">
            <p className="font-black text-xs uppercase tracking-wider">User Baru</p>
            <Users size={20} className="text-white" />
          </div>
          <p className="font-black text-3xl mb-1">{summary.users.current}</p>
          <p className={`text-sm font-bold text-white`}>
            {getGrowth(summary.users.current, summary.users.last)} dari bulan lalu
          </p>
        </div>

        <div className="bg-[#FF9B50] p-6 border-4 border-neo-dark rounded-xl shadow-[4px_4px_0_0_#1E1E1E]">
          <div className="flex justify-between items-start mb-2">
            <p className="font-black text-xs uppercase tracking-wider">Occupancy Rate</p>
            <Cat size={20} className="text-white" />
          </div>
          <p className="font-black text-3xl mb-1">{summary.occupancy}%</p>
          <p className="text-sm font-bold text-white">Target: 85%</p>
        </div>
      </div>

      {/* Breakdowns */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white border-4 border-neo-dark rounded-xl p-6 shadow-[4px_4px_0_0_#1E1E1E]">
          <h2 className="text-2xl font-black mb-6 border-b-4 border-neo-dark pb-2">Revenue per Layanan</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between font-bold mb-1">
                <span>Cat Boarding</span>
                <span>{formatCurrency(summary.revenue.board)} ({summary.revenue.current > 0 ? Math.round((summary.revenue.board / summary.revenue.current) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-6 bg-gray-200 border-2 border-neo-dark rounded-full overflow-hidden">
                <div className="h-full bg-[#FF9B50] rounded-full" style={{ width: `${summary.revenue.current > 0 ? (summary.revenue.board / summary.revenue.current) * 100 : 0}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between font-bold mb-1">
                <span>Cat Sitter</span>
                <span>{formatCurrency(summary.revenue.sitter)} ({summary.revenue.current > 0 ? Math.round((summary.revenue.sitter / summary.revenue.current) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-6 bg-gray-200 border-2 border-neo-dark rounded-full overflow-hidden">
                <div className="h-full bg-[#4ADE80] rounded-full" style={{ width: `${summary.revenue.current > 0 ? (summary.revenue.sitter / summary.revenue.current) * 100 : 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border-4 border-neo-dark rounded-xl p-6 shadow-[4px_4px_0_0_#1E1E1E]">
          <h2 className="text-2xl font-black mb-6 border-b-4 border-neo-dark pb-2">Kamar Terpopuler</h2>
          <div className="space-y-4">
            {popular_rooms.length === 0 ? (
               <p className="text-gray-500 font-bold italic">Belum ada pemesanan.</p>
            ) : (
              popular_rooms.map((room, i) => (
                <div key={room.id} className="flex items-center gap-4 p-3 border-2 border-dashed border-gray-300 rounded-lg transition-colors hover:border-neo-dark">
                  <div className={`w-10 h-10 ${roomColors[i % roomColors.length]} rounded-full border-2 border-neo-dark flex items-center justify-center font-black`}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-black">{room.name}</p>
                    <p className="text-sm font-bold text-gray-500">{room.bookings_count} bookings</p>
                  </div>
                  <p className="font-black text-lg text-green-600">{formatCurrency(room.revenue)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="bg-white border-4 border-neo-dark rounded-xl p-8 shadow-[4px_4px_0_0_#1E1E1E]">
        <h2 className="text-2xl font-black mb-6">Tren Booking 6 Bulan Terakhir</h2>
        <div className="flex items-end gap-4 h-48 mt-8">
          {chart_data.map((item, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
              <span className="font-black text-sm opacity-0 group-hover:opacity-100 transition-opacity -translate-y-2">{item.val}</span>
              <div 
                className="w-full bg-[#B983FF] border-4 border-neo-dark rounded-t-lg transition-all group-hover:bg-neo-pink shadow-[2px_0px_0_0_#1E1E1E]" 
                style={{ height: `${(item.val / maxChartVal) * 100}%`, minHeight: item.val > 0 ? '15%' : '5%' }}
              ></div>
              <span className="font-bold text-xs text-gray-500">{item.month}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminReports;
