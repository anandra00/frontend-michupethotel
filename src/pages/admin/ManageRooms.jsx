import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../api/axios';
import { Cat, Edit, Trash2, Plus, X } from 'lucide-react';
import { useToast } from '../../components/Toast';

const EMPTY_FORM = { name: '', type: 'Standard', price_per_night: '', description: '', capacity: 1, status: 'available', facilities: '' };

const ManageRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const { showToast } = useToast();

  const fetchRooms = async () => {
    try {
      const res = await api.get('/rooms');
      setRooms(res.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line
  useEffect(() => { fetchRooms(); }, []);

  const filtered = filter === 'all' ? rooms : rooms.filter(r => r.status === filter);

  const statusCounts = {
    all: rooms.length,
    available: rooms.filter(r => r.status === 'available').length,
    occupied: rooms.filter(r => r.status === 'occupied').length,
    cleaning: rooms.filter(r => r.status === 'cleaning').length,
  };

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (room) => {
    setEditing(room);
    const facStr = room.facilities
      ? (typeof room.facilities === 'string' ? JSON.parse(room.facilities) : room.facilities).join(', ')
      : '';
    setForm({
      name: room.name,
      type: room.type,
      price_per_night: room.price_per_night,
      description: room.description || '',
      capacity: room.capacity,
      status: room.status,
      facilities: facStr,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price_per_night) {
      showToast('Nama dan harga wajib diisi!', 'error');
      return;
    }

    const payload = {
      name: form.name,
      type: form.type,
      price_per_night: Number(form.price_per_night),
      description: form.description,
      capacity: Number(form.capacity),
      status: form.status,
      facilities: JSON.stringify(form.facilities.split(',').map(f => f.trim()).filter(Boolean)),
    };

    setSaving(true);
    try {
      if (editing) {
        await api.put(`/admin/rooms/${editing.id}`, payload);
      } else {
        await api.post('/admin/rooms', payload);
      }
      setShowForm(false);
      showToast('Kamar berhasil disimpan!');
      fetchRooms();
    } catch (error) {
      console.error('Save room error:', error);
      showToast('Gagal menyimpan room. Periksa form.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteRoom = async (id) => {
    try {
      await api.delete(`/admin/rooms/${id}`);
      setDeleteId(null);
      showToast('Kamar berhasil dihapus!');
      fetchRooms();
    } catch (error) {
      console.error('Failed to delete', error);
      showToast('Gagal menghapus room. Mungkin masih ada booking terkait.', 'error');
      setDeleteId(null);
    }
  };

  const statusColor = (s) => {
    if (s === 'available') return 'bg-[#4ADE80]';
    if (s === 'occupied') return 'bg-red-300';
    if (s === 'cleaning') return 'bg-neo-yellow';
    return 'bg-gray-300';
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black mb-2 uppercase">Rooms & Cages</h1>
          <p className="text-gray-600 font-medium max-w-md">Manage accommodations, track status, and oversee daily operations.</p>
        </div>
        <button onClick={openAdd} className="bg-neo-yellow px-6 py-3 font-black text-xl border-4 border-neo-dark rounded-xl shadow-[4px_4px_0_0_#1E1E1E] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2">
           <Plus size={22} /> Add New Room
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-8 overflow-x-auto pb-4">
        {[
          { key: 'all', label: 'All' },
          { key: 'available', label: 'Available' },
          { key: 'occupied', label: 'Occupied' },
          { key: 'cleaning', label: 'Cleaning' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-6 py-2 rounded-full border-4 border-neo-dark font-black whitespace-nowrap transition-all ${
              filter === f.key ? 'bg-[#B983FF] text-white shadow-[2px_2px_0_0_#1E1E1E]' : 'bg-white hover:bg-gray-50'
            }`}
          >
            {f.label} ({statusCounts[f.key]})
          </button>
        ))}
      </div>

      {/* Room Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
           <p className="font-bold text-xl">Loading rooms...</p>
        ) : filtered.length === 0 ? (
           <div className="col-span-3 bg-white border-4 border-dashed border-gray-400 rounded-xl p-12 text-center">
             <p className="font-bold text-xl text-gray-500">Tidak ada room dengan filter ini.</p>
           </div>
        ) : (
          filtered.map(room => (
            <div key={room.id} className="bg-white border-4 border-neo-dark rounded-xl p-6 shadow-[4px_4px_0_0_#1E1E1E] flex flex-col">
               <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-neo-yellow rounded-full border-4 border-neo-dark flex items-center justify-center">
                     <Cat size={24} />
                  </div>
                  <span className={`px-3 py-1 rounded-full border-2 border-neo-dark font-black text-xs ${statusColor(room.status)}`}>
                     {room.status?.toUpperCase()}
                  </span>
               </div>
               
               <h3 className="font-black text-2xl mb-1">{room.name}</h3>
               <p className="font-bold text-gray-500 mb-1">{room.type} • Cap: {room.capacity}</p>
               <p className="text-sm text-gray-500 mb-4 line-clamp-2">{room.description}</p>
               
               <div className="mt-auto pt-4 border-t-4 border-dashed border-gray-300 flex justify-between items-center">
                  <div>
                     <p className="text-xs font-bold text-gray-500 uppercase">Price/Night</p>
                     <p className="font-black text-lg">Rp {Number(room.price_per_night).toLocaleString('id-ID')}</p>
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => openEdit(room)} className="w-10 h-10 bg-[#60A5FA] text-white border-4 border-neo-dark rounded-lg flex items-center justify-center hover:translate-x-0.5 hover:translate-y-0.5 transition-all shadow-[2px_2px_0_0_#1E1E1E] hover:shadow-none">
                        <Edit size={18} />
                     </button>
                     <button onClick={() => setDeleteId(room.id)} className="w-10 h-10 bg-red-400 text-white border-4 border-neo-dark rounded-lg flex items-center justify-center hover:translate-x-0.5 hover:translate-y-0.5 transition-all shadow-[2px_2px_0_0_#1E1E1E] hover:shadow-none">
                        <Trash2 size={18} />
                     </button>
                  </div>
               </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#FF9B50] border-4 border-neo-dark rounded-xl p-6 shadow-[8px_8px_0_0_#1E1E1E] max-w-lg w-full relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowForm(false)} className="absolute right-4 top-4 bg-white border-2 border-neo-dark p-1 rounded-full hover:bg-red-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
            <h2 className="text-2xl font-black mb-6">{editing ? `Edit: ${editing.name}` : 'Add New Room'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase mb-1">Nama Room</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-white border-4 border-neo-dark rounded-lg p-2 font-bold" placeholder="Cth: Sultan Cat Suite" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full bg-white border-4 border-neo-dark rounded-lg p-2 font-bold">
                    <option>Standard</option>
                    <option>Deluxe</option>
                    <option>Suite</option>
                    <option>Family</option>
                    <option>Economy</option>
                    <option>VIP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-white border-4 border-neo-dark rounded-lg p-2 font-bold">
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Harga / Malam (Rp)</label>
                  <input type="number" value={form.price_per_night} onChange={e => setForm({...form, price_per_night: e.target.value})} className="w-full bg-white border-4 border-neo-dark rounded-lg p-2 font-bold" placeholder="50000" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Capacity (Cats)</label>
                  <input type="number" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} className="w-full bg-white border-4 border-neo-dark rounded-lg p-2 font-bold" placeholder="1" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-1">Deskripsi</label>
                <textarea rows="2" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-white border-4 border-neo-dark rounded-lg p-2 font-bold" placeholder="Deskripsi kamar..." />
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-1">Fasilitas (pisahkan dengan koma)</label>
                <input type="text" value={form.facilities} onChange={e => setForm({...form, facilities: e.target.value})} className="w-full bg-white border-4 border-neo-dark rounded-lg p-2 font-bold" placeholder="AC, CCTV, Litter Box, Mainan" />
              </div>
              <button onClick={handleSave} disabled={saving} className="w-full bg-neo-yellow border-4 border-neo-dark rounded-lg py-3 font-black text-xl shadow-[4px_4px_0_0_#1E1E1E] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50">
                {saving ? <><span className="neo-spinner mr-2"></span>Menyimpan...</> : (editing ? 'Update Room' : 'Simpan Room')}
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
            <h3 className="text-xl font-black mb-2">Hapus Room?</h3>
            <p className="text-sm font-bold text-gray-500 mb-6">Room dan semua data terkait akan dihapus permanen.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 bg-gray-200 border-4 border-neo-dark rounded-lg py-2.5 font-black shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">
                Batal
              </button>
              <button onClick={() => deleteRoom(deleteId)} className="flex-1 bg-red-400 text-white border-4 border-neo-dark rounded-lg py-2.5 font-black shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ManageRooms;
