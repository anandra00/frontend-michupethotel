import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../api/axios';
import { Users, Star, MapPin, Plus, X, Trash2, Edit, CalendarDays } from 'lucide-react';
import SitterCalendarModal from '../../components/SitterCalendarModal';

const AdminSitters = () => {
  const [sitters, setSitters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSitter, setEditingSitter] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', area: '', speciality: '', phone: '', status: 'Active' });
  const [deleteId, setDeleteId] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedCalendarSitter, setSelectedCalendarSitter] = useState(null);

  const fetchSitters = async () => {
    try {
      const res = await api.get('/admin/sitters');
      setSitters(res.data);
    } catch (err) {
      console.error('Error fetching sitters:', err);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line
  useEffect(() => { fetchSitters(); }, []);

  const handleSave = async () => {
    if (!form.name || !form.area) {
      alert('Nama dan Area wajib diisi!');
      return;
    }
    setSaving(true);
    try {
      if (editingSitter) {
        await api.put(`/admin/sitters/${editingSitter.id}`, form);
      } else {
        await api.post('/admin/sitters', form);
      }
      setShowForm(false);
      setEditingSitter(null);
      setForm({ name: '', area: '', speciality: '', phone: '', status: 'Active' });
      fetchSitters();
    } catch (err) {
      console.error('Save sitter error:', err);
      alert('Gagal menyimpan sitter.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (sitter) => {
    setEditingSitter(sitter);
    setForm({ name: sitter.name, area: sitter.area, speciality: sitter.speciality || '', phone: sitter.phone || '', status: sitter.status });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/sitters/${id}`);
      setDeleteId(null);
      fetchSitters();
    } catch (err) {
      console.error('Delete sitter error:', err);
      alert('Gagal menghapus sitter.');
      setDeleteId(null);
    }
  };

  const toggleStatus = async (sitter) => {
    const newStatus = sitter.status === 'Active' ? 'On Leave' : 'Active';
    try {
      await api.put(`/admin/sitters/${sitter.id}`, { status: newStatus });
      fetchSitters();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black mb-2 uppercase">Sitters Team</h1>
          <p className="text-gray-600 font-medium text-sm md:text-base">Manage your cat sitter team and assignments.</p>
        </div>
        <button 
          onClick={() => { setShowForm(true); setEditingSitter(null); setForm({ name: '', area: '', speciality: '', phone: '', status: 'Active' }); }}
          className="bg-[#4ADE80] px-5 py-2.5 font-black text-lg border-4 border-neo-dark rounded-xl shadow-[4px_4px_0_0_#1E1E1E] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2"
        >
          <Plus size={20} /> Add Sitter
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-neo-dark"></div></div>
      ) : sitters.length === 0 ? (
        <div className="bg-white border-4 border-dashed border-gray-400 rounded-xl p-12 text-center">
          <Users size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="font-bold text-gray-500 text-lg">Belum ada sitter terdaftar.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {sitters.map(sitter => (
            <div key={sitter.id} className="bg-white border-4 border-neo-dark rounded-xl p-4 md:p-6 shadow-[4px_4px_0_0_#1E1E1E]">
              <div className="flex items-center gap-3 md:gap-4 mb-4">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-[#B983FF] rounded-full border-4 border-neo-dark flex items-center justify-center overflow-hidden shrink-0">
                  <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${sitter.name}`} alt={sitter.name} className="w-full h-full" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-lg md:text-xl truncate">{sitter.name}</h3>
                  <button 
                    onClick={() => toggleStatus(sitter)}
                    className={`px-3 py-0.5 rounded-full border-2 border-neo-dark font-bold text-xs cursor-pointer ${sitter.status === 'Active' ? 'bg-[#4ADE80]' : 'bg-gray-300'}`}
                  >
                    {sitter.status}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 mb-3 md:mb-4">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Star size={14} className="text-yellow-500 shrink-0" />
                  <span>{sitter.avg_rating} rating • {sitter.review_count} review • {sitter.visits} visits</span>
                </div>
                <div className="flex items-center gap-2 font-bold text-sm text-gray-500">
                  <MapPin size={14} className="shrink-0" />
                  <span className="truncate">{sitter.area}</span>
                </div>
              </div>

              <div className="bg-neo-bg border-2 border-dashed border-neo-dark rounded-lg p-2.5 md:p-3 mb-3 md:mb-4">
                <p className="text-xs font-black uppercase text-gray-500 mb-0.5">Speciality</p>
                <p className="font-bold text-sm truncate">{sitter.speciality || '-'}</p>
              </div>

              <div className="flex gap-2">
                <button onClick={() => { setSelectedCalendarSitter(sitter); setCalendarOpen(true); }} className="flex-[0.5] bg-neo-blue border-4 border-neo-dark rounded-lg py-2 font-black text-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all shadow-[2px_2px_0_0_#1E1E1E] flex items-center justify-center tooltip-trigger" title="Lihat Jadwal">
                  <CalendarDays size={16} />
                </button>
                <button onClick={() => handleEdit(sitter)} className="flex-1 bg-neo-yellow border-4 border-neo-dark rounded-lg py-2 font-black text-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all shadow-[2px_2px_0_0_#1E1E1E] flex items-center justify-center gap-1">
                  <Edit size={14} /> Edit
                </button>
                <button onClick={() => setDeleteId(sitter.id)} className="flex-1 bg-red-400 text-white border-4 border-neo-dark rounded-lg py-2 font-black text-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all shadow-[2px_2px_0_0_#1E1E1E] flex items-center justify-center gap-1">
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Sitter Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#B983FF] border-4 border-neo-dark rounded-xl p-5 md:p-6 shadow-[8px_8px_0_0_#1E1E1E] max-w-md w-full relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => { setShowForm(false); setEditingSitter(null); }} className="absolute right-3 top-3 bg-white border-2 border-neo-dark p-1 rounded-full hover:bg-red-400 hover:text-white transition-colors">
              <X size={18} />
            </button>
            <h2 className="text-xl md:text-2xl font-black mb-5">{editingSitter ? 'Edit Sitter' : 'Add New Sitter'}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-black uppercase mb-1">Nama Lengkap</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-white border-4 border-neo-dark rounded-lg p-2 font-bold" placeholder="Nama sitter" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-1">Area Kerja</label>
                <input type="text" value={form.area} onChange={e => setForm({...form, area: e.target.value})} className="w-full bg-white border-4 border-neo-dark rounded-lg p-2 font-bold" placeholder="Cth: Jakarta Selatan" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-1">Spesialisasi</label>
                <input type="text" value={form.speciality} onChange={e => setForm({...form, speciality: e.target.value})} className="w-full bg-white border-4 border-neo-dark rounded-lg p-2 font-bold" placeholder="Cth: Kucing senior" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-1">No. Telepon</label>
                <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-white border-4 border-neo-dark rounded-lg p-2 font-bold" placeholder="08xxxxxxxxxx" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-1">Status</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-white border-4 border-neo-dark rounded-lg p-2 font-bold">
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>
              <button onClick={handleSave} disabled={saving} className="w-full bg-neo-yellow border-4 border-neo-dark rounded-lg py-3 font-black text-lg shadow-[4px_4px_0_0_#1E1E1E] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50">
                {saving ? <><span className="neo-spinner mr-2"></span>Menyimpan...</> : (editingSitter ? 'Update Sitter' : 'Tambah Sitter')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border-4 border-neo-dark rounded-xl p-6 shadow-[8px_8px_0_0_#1E1E1E] max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-red-100 border-4 border-neo-dark rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={28} className="text-red-500" />
            </div>
            <h3 className="text-xl font-black mb-2">Hapus Sitter?</h3>
            <p className="text-sm font-bold text-gray-500 mb-6">Data sitter ini akan dihapus permanen.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 bg-gray-200 border-4 border-neo-dark rounded-lg py-2.5 font-black shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">
                Batal
              </button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 bg-red-400 text-white border-4 border-neo-dark rounded-lg py-2.5 font-black shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Modal */}
      <SitterCalendarModal 
        isOpen={calendarOpen} 
        onClose={() => { setCalendarOpen(false); setSelectedCalendarSitter(null); }} 
        sitter={selectedCalendarSitter} 
      />
    </DashboardLayout>
  );
};

export default AdminSitters;
