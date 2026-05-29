import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import api, { BACKEND_URL } from '../api/axios';
import { BedDouble, Home as HomeIcon, History, Rabbit } from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({ active_bookings_count: 0, total_cost: 0, has_checked_in: false, has_checked_in_board: false });
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Parallel fetch for optimization
        const [statsRes, cRes] = await Promise.all([
          api.get('/user/stats'),
          api.get('/cats')
        ]);
        setStats(statsRes.data);
        setCats(cRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user && user.role !== 'admin') fetchData();
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;

  // Calculate values (using new stats API)
  const activeBookingsCount = stats.active_bookings_count;
  const totalCost = stats.total_cost;

  return (
    <DashboardLayout>
      {/* Stats */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-neo-yellow p-6 border-4 border-neo-dark rounded-xl shadow-[4px_4px_0_0_#1E1E1E]">
           <p className="font-black text-sm uppercase tracking-wider mb-2">Pesanan Aktif</p>
           <p className="font-black text-5xl">{loading ? <span className="neo-skeleton inline-block w-16 h-12"></span> : activeBookingsCount}</p>
        </div>
        <div className="bg-[#B983FF] p-6 border-4 border-neo-dark rounded-xl shadow-[4px_4px_0_0_#1E1E1E]">
           <p className="font-black text-sm uppercase tracking-wider mb-2">Total Biaya Aktif</p>
           <p className="font-black text-4xl">{loading ? <span className="neo-skeleton inline-block w-40 h-10"></span> : `Rp ${Number(totalCost).toLocaleString('id-ID')}`}</p>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
         <Link to="/rooms" className="bg-[#FF9B50] p-8 border-4 border-neo-dark rounded-xl shadow-[4px_4px_0_0_#1E1E1E] flex flex-col items-center justify-center hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all group">
            <div className="bg-white p-4 rounded-full border-4 border-neo-dark mb-4 group-hover:scale-110 transition-transform">
               <BedDouble size={32} className="text-neo-dark" />
            </div>
            <h3 className="font-black text-xl">Pesan Inap</h3>
         </Link>

         <Link to="/dashboard/sitter" className="bg-[#4ADE80] p-8 border-4 border-neo-dark rounded-xl shadow-[4px_4px_0_0_#1E1E1E] flex flex-col items-center justify-center hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all group">
            <div className="bg-white p-4 rounded-full border-4 border-neo-dark mb-4 group-hover:scale-110 transition-transform">
               <HomeIcon size={32} className="text-neo-dark" />
            </div>
            <h3 className="font-black text-xl">Pesan Sitter</h3>
         </Link>

         <Link to="/dashboard/history" className="bg-[#2DD4BF] p-8 border-4 border-neo-dark rounded-xl shadow-[4px_4px_0_0_#1E1E1E] flex flex-col items-center justify-center hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all group">
            <div className="bg-white p-4 rounded-full border-4 border-neo-dark mb-4 group-hover:scale-110 transition-transform">
               <History size={32} className="text-neo-dark" />
            </div>
            <h3 className="font-black text-xl">Riwayat</h3>
         </Link>

         <Link to="/dashboard/profile" className="bg-[#E2E8F0] p-8 border-4 border-neo-dark rounded-xl shadow-[4px_4px_0_0_#1E1E1E] flex flex-col items-center justify-center group relative overflow-hidden">
            <div className="absolute inset-0 border-4 border-dashed border-gray-400 m-2 rounded-lg pointer-events-none"></div>
            <div className="bg-white p-4 rounded-full border-4 border-neo-dark mb-4 z-10 group-hover:scale-110 transition-transform">
               <Rabbit size={32} className="text-neo-dark" />
            </div>
            <h3 className="font-black text-xl z-10 mb-4">Profil Kucing ({cats.length})</h3>
            <span className="bg-neo-yellow font-black border-4 border-neo-dark px-6 py-2 rounded-full z-10 hover:bg-yellow-400 shadow-[2px_2px_0_0_#1E1E1E] transition-all">
               Kelola Anabul
            </span>
         </Link>
      </div>

      {/* Daily Report — integrated with user's cats */}
      <div>
         <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-black">Laporan Harian (Daily Report)</h2>
         </div>

         {cats.length === 0 ? (
           <div className="bg-white border-4 border-dashed border-gray-400 rounded-xl p-8 text-center">
             <Rabbit size={48} className="mx-auto text-gray-400 mb-4" />
             <p className="font-bold text-gray-500">Belum ada kucing terdaftar. <Link to="/dashboard/profile" className="text-neo-pink underline">Tambahkan kucing</Link> terlebih dahulu untuk melihat laporan.</p>
           </div>
         ) : (
           <div className="grid md:grid-cols-2 gap-6">
             {cats.map(cat => (
               <div key={cat.id} className="bg-white border-4 border-neo-dark rounded-xl p-6 shadow-[4px_4px_0_0_#1E1E1E]">
                 <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#FFD2A5] rounded-full border-4 border-neo-dark flex items-center justify-center font-black text-xl">{cat.name.charAt(0)}</div>
                      <div>
                        <h3 className="text-xl font-black">{cat.name}</h3>
                        <p className="text-sm font-bold text-gray-500">{cat.breed} • {cat.age} bln</p>
                      </div>
                    </div>
                    <span className={`${stats.has_checked_in ? 'bg-[#4ADE80]' : 'bg-gray-300'} border-2 border-neo-dark px-3 py-1 rounded-full font-bold text-sm`}>
                      {stats.has_checked_in ? 'Di Hotel' : 'Di Rumah'}
                    </span>
                 </div>
                 <div className="h-40 bg-gray-200 border-4 border-neo-dark rounded-xl mb-4 overflow-hidden relative flex items-center justify-center">
                    {cat.photo ? (
                      <img src={`${BACKEND_URL}/storage/${cat.photo}`} alt={cat.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <Rabbit size={64} className="text-gray-400" />
                    )}
                     <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white p-3 font-bold backdrop-blur-sm border-t-4 border-neo-dark text-sm">
                       {stats.has_checked_in_board
                         ? `${cat.name} sedang berada di hotel kami. 🏨`
                         : `${cat.name} sedang di rumah. 🏠`
                       }
                     </div>
                 </div>
                 <div className="flex justify-between items-center">
                    <p className="font-bold text-gray-500 text-sm">🕒 Hari ini, {new Date().toLocaleDateString('id-ID')}</p>
                    <Link to={`/dashboard/reports/${cat.id}`} className="bg-[#60A5FA] border-4 border-neo-dark px-4 py-2 rounded-lg font-black text-sm shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                      Lihat Laporan
                    </Link>
                 </div>
               </div>
             ))}
           </div>
         )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
