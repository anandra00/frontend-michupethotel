import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import api, { BACKEND_URL } from '../../api/axios';
import { CheckCircle2, ChevronLeft, Heart, Utensils, Droplets } from 'lucide-react';

const DailyReport = () => {
  const { id } = useParams();
  const [cat, setCat] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchCatAndReports = async () => {
      try {
        const catRes = await api.get('/cats');
        const found = catRes.data.find(c => String(c.id) === String(id));
        setCat(found || catRes.data[0] || null);

        if (found) {
          const reportsRes = await api.get(`/cats/${found.id}/daily-reports`);
          setActivities(reportsRes.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCatAndReports();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-neo-dark"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!cat) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="font-bold text-xl text-gray-500">Kucing tidak ditemukan.</p>
          <Link to="/dashboard" className="text-neo-pink font-bold underline">Kembali ke Dashboard</Link>
        </div>
      </DashboardLayout>
    );
  }

  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  // Fallback icon mapping if we ever wanted dynamic icon components
  const getIcon = (type) => {
    switch(type) {
      case 'Utensils': return <Utensils size={20} />;
      case 'Droplets': return <Droplets size={20} />;
      case 'Heart': return <Heart size={20} />;
      default: return <CheckCircle2 size={20} />;
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
         <Link to="/dashboard" className="inline-flex items-center gap-2 font-black border-4 border-neo-dark bg-white px-4 py-2 rounded-full shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all mb-4">
            <ChevronLeft size={20} /> Kembali
         </Link>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-[#FFD2A5] rounded-full border-4 border-neo-dark flex items-center justify-center font-black text-3xl">{cat.name.charAt(0)}</div>
          <div>
            <h1 className="text-4xl font-black">Laporan Harian: {cat.name}</h1>
            <p className="text-gray-600 font-medium">{cat.breed} • {cat.age} bulan • {cat.weight}kg • {today}</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
         {/* Report Timeline */}
         <div className="md:col-span-2 space-y-6">
            {activities.length === 0 ? (
               <div className="bg-white border-4 border-dashed border-gray-400 rounded-xl p-12 text-center">
                 <p className="font-bold text-xl text-gray-500">Belum ada laporan harian untuk {cat.name}.</p>
               </div>
            ) : activities.map((act) => (
              <div key={act.id} className="bg-white border-4 border-neo-dark rounded-xl p-6 shadow-[4px_4px_0_0_#1E1E1E]">
                <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${act.badge_bg || 'bg-neo-yellow'} rounded-full border-2 border-neo-dark flex items-center justify-center`}>
                         {getIcon(act.icon_type)}
                      </div>
                      <div>
                         <h3 className="font-black text-xl">{act.title}</h3>
                         <p className="text-sm font-bold text-gray-500">{act.time}</p>
                      </div>
                   </div>
                   {act.badge && (
                     <span className={`${act.badge_bg || 'bg-[#4ADE80]'} border-2 border-neo-dark px-3 py-1 rounded-full font-bold text-xs shadow-[2px_2px_0_0_#1E1E1E]`}>{act.badge}</span>
                   )}
                </div>
                {act.photo_path && (
                  <img src={`${BACKEND_URL}/storage/${act.photo_path}`} alt={act.title} className="w-full max-h-80 object-cover rounded-xl border-4 border-neo-dark mb-4" />
                )}
                <p className={`font-bold border-l-4 border-neo-dark pl-4 text-gray-700 whitespace-pre-wrap`}>
                   {act.description}
                </p>
              </div>
            ))}
         </div>

         {/* Cat Info & Sitter Note */}
         <div className="space-y-6">
            {/* Cat Card */}
            <div className="bg-[#FFD2A5] border-4 border-neo-dark rounded-xl p-6 shadow-[4px_4px_0_0_#1E1E1E]">
              <h3 className="font-black text-xl mb-4 border-b-4 border-neo-dark pb-2">Info Kucing</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-600">Nama</span>
                  <span className="font-black">{cat.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-600">Ras</span>
                  <span className="font-black">{cat.breed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-600">Umur</span>
                  <span className="font-black">{cat.age} bulan</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-600">Berat</span>
                  <span className="font-black">{cat.weight} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-600">Gender</span>
                  <span className="font-black capitalize">{cat.gender}</span>
                </div>
              </div>
            </div>

            {/* Sitter Note */}
            {activities.length > 0 && activities[0].booking?.sitter ? (
              <div className="bg-neo-yellow border-4 border-neo-dark rounded-xl p-6 shadow-[4px_4px_0_0_#1E1E1E] sticky top-6">
                 <h3 className="font-black text-xl mb-4 border-b-4 border-neo-dark pb-2">Catatan Terakhir Sitter</h3>
                 <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-white rounded-full border-2 border-neo-dark overflow-hidden">
                       <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${activities[0].booking.sitter.name}`} alt="Sitter" />
                    </div>
                    <div>
                       <p className="font-black">{activities[0].booking.sitter.name} (Sitter)</p>
                       <p className="text-xs font-bold text-gray-500">Penanggung Jawab</p>
                    </div>
                 </div>
                 <div className="bg-white p-4 rounded-lg border-2 border-dashed border-neo-dark">
                    <p className="font-bold text-sm italic">
                       "Laporan terakhir: {activities[0].title}. {activities[0].description}"
                    </p>
                 </div>
                 
                 <button 
                   onClick={() => window.open(`https://wa.me/${activities[0].booking.sitter.phone}?text=Halo%20kak%20${activities[0].booking.sitter.name},%20saya%20owner%20dari%20${cat.name}...`, '_blank')}
                   className="w-full mt-6 bg-neo-dark text-white border-2 border-white rounded-lg py-3 font-black shadow-[2px_2px_0_0_#FFFFFF] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                    Hubungi Sitter
                 </button>
              </div>
            ) : (
              <div className="bg-gray-100 border-4 border-dashed border-gray-300 rounded-xl p-6 text-center">
                 <p className="font-bold text-gray-500">Belum ada sitter yang ditugaskan atau belum ada laporan.</p>
              </div>
            )}
         </div>
      </div>
    </DashboardLayout>
  );
};

export default DailyReport;
