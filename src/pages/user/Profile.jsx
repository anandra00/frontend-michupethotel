import { useState, useContext, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axios';
import { Plus, X, Rabbit, Edit, Trash2, Save, User } from 'lucide-react';
import { useToast } from '../../components/Toast';

const EMPTY_CAT = { name: '', breed: '', age: '', weight: '', gender: 'male', notes: '', photo: null };

const Profile = () => {
  const { user, refreshUser } = useContext(AuthContext);
  const { showToast, showConfirm } = useToast();
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cat modal state
  const [catModal, setCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catForm, setCatForm] = useState(EMPTY_CAT);

  // Profile edit state
  const [profileModal, setProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '', address: '', password: '', password_confirmation: '' });
  const [saving, setSaving] = useState(false);

  const fetchCats = async () => {
    try {
      const res = await api.get('/cats');
      setCats(res.data);
    } catch (error) {
      console.error('Failed to fetch cats', error);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line
  useEffect(() => { fetchCats(); }, []);

  // ===== CAT CRUD =====
  const openAddCat = () => {
    setEditingCat(null);
    setCatForm(EMPTY_CAT);
    setCatModal(true);
  };

  const openEditCat = (cat) => {
    setEditingCat(cat);
    setCatForm({
      name: cat.name,
      breed: cat.breed,
      age: cat.age,
      weight: cat.weight,
      gender: cat.gender,
      notes: cat.notes || '',
      photo: null,
    });
    setCatModal(true);
  };

  const handleSaveCat = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', catForm.name);
      formData.append('breed', catForm.breed);
      formData.append('age', catForm.age);
      formData.append('weight', catForm.weight);
      formData.append('gender', catForm.gender);
      if (catForm.notes) formData.append('notes', catForm.notes);
      if (catForm.photo) formData.append('photo', catForm.photo);

      if (editingCat) {
        formData.append('_method', 'PUT'); // Laravel workaround for multipart PUT
        await api.post(`/cats/${editingCat.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showToast(`Data ${catForm.name} berhasil diupdate! 🐱`, 'success');
      } else {
        await api.post('/cats', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showToast(`${catForm.name} berhasil ditambahkan! 🎉`, 'success');
      }
      setCatModal(false);
      fetchCats();
    } catch (error) {
      console.error('Failed to save cat', error);
      showToast('Gagal menyimpan data kucing. Cek kembali form.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCat = (id) => {
    const cat = cats.find(c => c.id === id);
    showConfirm(
      `Data ${cat?.name || 'kucing'} akan dihapus permanen dan tidak bisa dikembalikan.`,
      async () => {
        try {
          await api.delete(`/cats/${id}`);
          fetchCats();
          showToast(`${cat?.name} berhasil dihapus.`, 'success');
        } catch (error) {
          console.error('Failed to delete cat', error);
          showToast('Gagal menghapus kucing.', 'error');
        }
      },
      `Hapus ${cat?.name}?`
    );
  };

  // ===== PROFILE EDIT =====
  const openProfileEdit = () => {
    setProfileForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      password: '',
      password_confirmation: '',
    });
    setProfileModal(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name: profileForm.name, email: profileForm.email, phone: profileForm.phone, address: profileForm.address };
      if (profileForm.password) {
        payload.password = profileForm.password;
        payload.password_confirmation = profileForm.password_confirmation;
      }
      await api.put('/profile', payload);
      await refreshUser();
      setProfileModal(false);
      showToast('Profil berhasil diupdate! ✨', 'success');
    } catch (error) {
      console.error('Failed to update profile', error);
      showToast('Gagal update profil. Periksa kembali form.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-black mb-2">My Profile & Cats</h1>
        <p className="text-gray-600 font-medium">Kelola data dirimu dan anabul kesayangan.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Profile Info */}
        <div className="bg-[#B983FF] border-4 border-neo-dark rounded-xl p-6 shadow-[4px_4px_0_0_#1E1E1E]">
           <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 bg-white rounded-full border-4 border-neo-dark mb-4 overflow-hidden">
                 <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user?.name || 'User'}`} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <h2 className="text-2xl font-black text-center">{user?.name}</h2>
              <p className="font-bold text-sm bg-white px-3 py-1 rounded-full border-2 border-neo-dark mt-2">Cat Owner</p>
           </div>
           
           <div className="space-y-4 bg-white p-4 rounded-lg border-4 border-neo-dark">
              <div>
                 <p className="text-xs font-black uppercase text-gray-500">Email</p>
                 <p className="font-bold">{user?.email}</p>
              </div>
              <div>
                 <p className="text-xs font-black uppercase text-gray-500">Phone</p>
                 <p className="font-bold">{user?.phone || 'Belum diatur'}</p>
              </div>
              <div>
                 <p className="text-xs font-black uppercase text-gray-500">Alamat</p>
                 <p className="font-bold text-sm">{user?.address || 'Belum diatur'}</p>
              </div>
              <button
                onClick={openProfileEdit}
                className="w-full flex items-center justify-center gap-2 bg-neo-yellow border-4 border-neo-dark rounded-lg py-2 font-black shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all mt-4"
              >
                <Edit size={16} /> Edit Profile
              </button>
           </div>
        </div>

        {/* Cats List */}
        <div className="md:col-span-2">
           <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black">Profil Kucing ({cats.length})</h2>
              <button 
                 onClick={openAddCat}
                 className="bg-[#4ADE80] border-4 border-neo-dark px-4 py-2 rounded-full font-black flex items-center gap-2 shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
              >
                 <Plus size={18} /> Tambah Kucing
              </button>
           </div>

           <div className="grid sm:grid-cols-2 gap-4">
              {loading ? (
                 <div className="col-span-2 flex justify-center py-8">
                   <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-neo-dark"></div>
                 </div>
              ) : cats.length === 0 ? (
                 <div className="col-span-2 bg-white border-4 border-dashed border-gray-400 rounded-xl p-8 text-center">
                    <Rabbit size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="font-bold text-gray-500">Belum ada profil kucing. Tambahkan anabul pertamamu!</p>
                 </div>
              ) : (
                 cats.map(cat => (
                    <div key={cat.id} className="bg-white border-4 border-neo-dark rounded-xl p-4 shadow-[4px_4px_0_0_#1E1E1E]">
                       <div className="flex items-center gap-4 mb-3">
                         <div className="w-14 h-14 bg-[#FFD2A5] rounded-full border-2 border-neo-dark flex items-center justify-center font-black text-xl overflow-hidden shrink-0">
                            {cat.name.charAt(0)}
                         </div>
                         <div className="flex-1 min-w-0">
                            <h3 className="font-black text-lg leading-tight">{cat.name}</h3>
                            <p className="font-bold text-gray-500 text-sm">{cat.breed} • {cat.age} bln • {cat.weight}kg</p>
                         </div>
                         <span className={`px-2 py-0.5 rounded-full border-2 border-neo-dark text-xs font-black shrink-0 ${cat.gender === 'male' ? 'bg-[#60A5FA]' : 'bg-neo-pink'}`}>
                           {cat.gender === 'male' ? '♂ Jantan' : '♀ Betina'}
                         </span>
                       </div>
                       {cat.notes && (
                         <p className="text-xs text-gray-500 italic border-l-4 border-neo-yellow pl-2 mb-3">{cat.notes}</p>
                       )}
                       {/* Action Buttons — SLICED */}
                       <div className="flex gap-2 pt-3 border-t-2 border-dashed border-gray-300">
                          <button
                            onClick={() => openEditCat(cat)}
                            className="flex-1 flex items-center justify-center gap-1 bg-[#60A5FA] text-white border-3 border-neo-dark rounded-lg py-2 font-bold text-sm shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                          >
                            <Edit size={14} /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCat(cat.id)}
                            className="flex-1 flex items-center justify-center gap-1 bg-red-400 text-white border-3 border-neo-dark rounded-lg py-2 font-bold text-sm shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                          >
                            <Trash2 size={14} /> Hapus
                          </button>
                       </div>
                    </div>
                 ))
              )}
           </div>
        </div>
      </div>

      {/* ===== CAT ADD/EDIT MODAL ===== */}
      {catModal && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#4ADE80] border-4 border-neo-dark rounded-xl p-6 shadow-[8px_8px_0_0_#1E1E1E] max-w-md w-full relative max-h-[90vh] overflow-y-auto">
               <button 
                  onClick={() => setCatModal(false)}
                  className="absolute right-4 top-4 bg-white border-2 border-neo-dark p-1 rounded-full hover:bg-red-400 hover:text-white transition-colors"
               >
                  <X size={20} />
               </button>
               
               <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
                 <Rabbit /> {editingCat ? `Edit: ${editingCat.name}` : 'Tambah Kucing Baru'}
               </h2>
               
               <form onSubmit={handleSaveCat} className="space-y-4">
                  <div>
                     <label className="block text-xs font-black uppercase mb-1">Nama Kucing</label>
                     <input type="text" required value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} className="w-full bg-white border-4 border-neo-dark rounded-lg p-2 font-bold focus:ring-4 focus:ring-neo-pink" placeholder="Cth: Mochi" />
                  </div>
                  <div>
                     <label className="block text-xs font-black uppercase mb-1">Ras Kucing</label>
                     <input type="text" required value={catForm.breed} onChange={e => setCatForm({...catForm, breed: e.target.value})} className="w-full bg-white border-4 border-neo-dark rounded-lg p-2 font-bold focus:ring-4 focus:ring-neo-pink" placeholder="Cth: Persian, Anggora" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-black uppercase mb-1">Umur (Bulan)</label>
                        <input type="number" required value={catForm.age} onChange={e => setCatForm({...catForm, age: e.target.value})} className="w-full bg-white border-4 border-neo-dark rounded-lg p-2 font-bold focus:ring-4 focus:ring-neo-pink" placeholder="12" />
                     </div>
                     <div>
                        <label className="block text-xs font-black uppercase mb-1">Berat (Kg)</label>
                        <input type="number" step="0.1" required value={catForm.weight} onChange={e => setCatForm({...catForm, weight: e.target.value})} className="w-full bg-white border-4 border-neo-dark rounded-lg p-2 font-bold focus:ring-4 focus:ring-neo-pink" placeholder="4.5" />
                     </div>
                  </div>
                  <div>
                     <label className="block text-xs font-black uppercase mb-1">Jenis Kelamin</label>
                     <select value={catForm.gender} onChange={e => setCatForm({...catForm, gender: e.target.value})} className="w-full bg-white border-4 border-neo-dark rounded-lg p-2 font-bold focus:ring-4 focus:ring-neo-pink">
                        <option value="male">Jantan (Male)</option>
                        <option value="female">Betina (Female)</option>
                     </select>
                  </div>
                  <div>
                     <label className="block text-xs font-black uppercase mb-1">Catatan (Opsional)</label>
                     <textarea rows="2" value={catForm.notes} onChange={e => setCatForm({...catForm, notes: e.target.value})} className="w-full bg-white border-4 border-neo-dark rounded-lg p-2 font-bold focus:ring-4 focus:ring-neo-pink" placeholder="Alergi makanan, kebiasaan khusus, dll." />
                  </div>
                  <div>
                     <label className="block text-xs font-black uppercase mb-1">Foto Kucing (Opsional)</label>
                     <input type="file" accept="image/*" onChange={e => setCatForm({...catForm, photo: e.target.files[0]})} className="w-full bg-white border-4 border-neo-dark rounded-lg p-2 font-bold focus:ring-4 focus:ring-neo-pink file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-2 file:border-neo-dark file:text-sm file:font-black file:bg-neo-yellow file:text-neo-dark hover:file:bg-yellow-400 cursor-pointer" />
                  </div>
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 bg-neo-yellow border-4 border-neo-dark rounded-lg py-3 font-black text-xl shadow-[4px_4px_0_0_#1E1E1E] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all mt-4 disabled:opacity-50"
                  >
                    <Save size={20} /> {saving ? 'Menyimpan...' : editingCat ? 'Update Data' : 'Simpan Data'}
                  </button>
               </form>
            </div>
         </div>
      )}

      {/* ===== PROFILE EDIT MODAL ===== */}
      {profileModal && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#B983FF] border-4 border-neo-dark rounded-xl p-6 shadow-[8px_8px_0_0_#1E1E1E] max-w-md w-full relative max-h-[90vh] overflow-y-auto">
               <button 
                  onClick={() => setProfileModal(false)}
                  className="absolute right-4 top-4 bg-white border-2 border-neo-dark p-1 rounded-full hover:bg-red-400 hover:text-white transition-colors"
               >
                  <X size={20} />
               </button>
               
               <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
                 <User /> Edit Profile
               </h2>
               
               <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                     <label className="block text-xs font-black uppercase mb-1">Nama Lengkap</label>
                     <input type="text" required value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} className="w-full bg-white border-4 border-neo-dark rounded-lg p-2 font-bold focus:ring-4 focus:ring-neo-pink" />
                  </div>
                  <div>
                     <label className="block text-xs font-black uppercase mb-1">Email</label>
                     <input type="email" required value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} className="w-full bg-white border-4 border-neo-dark rounded-lg p-2 font-bold focus:ring-4 focus:ring-neo-pink" />
                  </div>
                  <div>
                     <label className="block text-xs font-black uppercase mb-1">No. Telepon</label>
                     <input type="text" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} className="w-full bg-white border-4 border-neo-dark rounded-lg p-2 font-bold focus:ring-4 focus:ring-neo-pink" placeholder="08xxxxxxxxxx" />
                  </div>
                  <div>
                     <label className="block text-xs font-black uppercase mb-1">Alamat Rumah</label>
                     <textarea rows="2" value={profileForm.address} onChange={e => setProfileForm({...profileForm, address: e.target.value})} className="w-full bg-white border-4 border-neo-dark rounded-lg p-2 font-bold focus:ring-4 focus:ring-neo-pink" placeholder="Jl. Contoh No. 123, Kelurahan, Kecamatan, Kota" />
                  </div>
                  <div className="border-t-4 border-dashed border-white/50 pt-4">
                     <p className="text-xs font-black uppercase mb-2 text-white/80">Ganti Password (kosongkan jika tidak ingin ganti)</p>
                     <div className="grid grid-cols-2 gap-3">
                        <div>
                           <label className="block text-xs font-black uppercase mb-1">Password Baru</label>
                           <input type="password" value={profileForm.password} onChange={e => setProfileForm({...profileForm, password: e.target.value})} className="w-full bg-white border-4 border-neo-dark rounded-lg p-2 font-bold focus:ring-4 focus:ring-neo-pink" placeholder="Min 6 karakter" />
                        </div>
                        <div>
                           <label className="block text-xs font-black uppercase mb-1">Konfirmasi</label>
                           <input type="password" value={profileForm.password_confirmation} onChange={e => setProfileForm({...profileForm, password_confirmation: e.target.value})} className="w-full bg-white border-4 border-neo-dark rounded-lg p-2 font-bold focus:ring-4 focus:ring-neo-pink" placeholder="Ulangi" />
                        </div>
                     </div>
                  </div>
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 bg-neo-yellow border-4 border-neo-dark rounded-lg py-3 font-black text-xl shadow-[4px_4px_0_0_#1E1E1E] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all mt-4 disabled:opacity-50"
                  >
                    <Save size={20} /> {saving ? 'Menyimpan...' : 'Simpan Profil'}
                  </button>
               </form>
            </div>
         </div>
      )}
    </DashboardLayout>
  );
};

export default Profile;
