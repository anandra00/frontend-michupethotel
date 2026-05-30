import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axios';
import { Camera, Clock, CheckCircle2, UtensilsCrossed, AlertCircle, Star, MapPin } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { loadSnapScript } from '../../utils/snap';

const SitterBooking = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [cats, setCats] = useState([]);
  const [sitters, setSitters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const [packages, setPackages] = useState([]);
  const [packageType, setPackageType] = useState('');
  const [form, setForm] = useState({
    cat_ids: [],
    sitter_id: '',
    start_date: '',
    end_date: '',
    visit_time: 'pagi',
    notes: '',
    cat_count: 0,
  });

  const [adminFee, setAdminFee] = useState(5000);
  
  const getDynamicPricePerDay = (pkg, catCount) => {
    if (!pkg) return 0;
    const is2x = pkg.name?.includes('2x');
    
    // Tiered pricing:
    // 1-2 cats: 60k for 1x, 120k for 2x
    // 3-4 cats: 80k for 1x, 160k for 2x
    // 5+ cats: 120k for 1x, 240k for 2x
    let basePrice = 60000;
    if (catCount >= 3 && catCount <= 4) {
      basePrice = 80000;
    } else if (catCount >= 5) {
      basePrice = 120000;
    }
    
    return is2x ? basePrice * 2 : basePrice;
  };

  const selectedPackage = packages.find(p => String(p.id) === String(packageType));
  const packagePrice = getDynamicPricePerDay(selectedPackage, form.cat_count);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cRes = await api.get('/cats');
        setCats(cRes.data);
        if (cRes.data.length > 0) {
          setForm(f => ({ 
            ...f, 
            cat_ids: [cRes.data[0].id],
            cat_count: 1
          }));
        }

        const pRes = await api.get('/sitter-packages');
        setPackages(pRes.data);
        if (pRes.data.length > 0) setPackageType(String(pRes.data[0].id));

        const settingsRes = await api.get('/settings');
        if (settingsRes.data.admin_fee) {
          setAdminFee(Number(settingsRes.data.admin_fee));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchSittersAvailability = async () => {
      try {
        let url = '/sitters';
        if (form.start_date && form.end_date) {
          const visitTime = form.visit_time === 'pagi' ? 'morning' : (form.visit_time === 'sore' ? 'afternoon' : 'both');
          url += `?check_in=${form.start_date}&check_out=${form.end_date}&visit_time=${visitTime}`;
        }
        const sRes = await api.get(url);
        const activeSitters = sRes.data.filter(s => s.status === 'Active');
        setSitters(activeSitters);
        
        // If current selected is not available, deselect
        if (form.sitter_id) {
           const selected = activeSitters.find(s => String(s.id) === String(form.sitter_id));
           if (selected && !selected.is_available) {
               setForm(f => ({ ...f, sitter_id: '' }));
           }
        } else if (activeSitters.length > 0 && activeSitters[0].is_available) {
           setForm(f => ({ ...f, sitter_id: String(activeSitters[0].id) }));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSittersAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.start_date, form.end_date, form.visit_time]);

  const calcDays = () => {
    if (!form.start_date || !form.end_date) return 0;
    const d1 = new Date(form.start_date);
    const d2 = new Date(form.end_date);
    const diff = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  const handleCatToggle = (catId) => {
    const currentSelected = form.cat_ids || [];
    let updated;
    if (currentSelected.includes(catId)) {
      updated = currentSelected.filter(id => id !== catId);
    } else {
      updated = [...currentSelected, catId];
    }
    setForm({
      ...form,
      cat_ids: updated,
      cat_count: updated.length
    });
  };

  const days = calcDays();
  const subtotal = packagePrice * days;
  const total = form.cat_count > 0 ? (subtotal + adminFee) : 0;

  const selectedCats = cats.filter(c => form.cat_ids.includes(c.id));
  const selectedSitter = sitters.find(s => String(s.id) === String(form.sitter_id));

  const handleSubmit = async () => {
    if (!form.cat_ids || form.cat_ids.length === 0 || !form.sitter_id || !form.start_date || !form.end_date) {
      showToast('Mohon lengkapi semua data pemesanan (termasuk memilih kucing).', 'warning');
      return;
    }
    if (days <= 0) {
      showToast('Tanggal selesai harus setelah tanggal mulai.', 'error');
      return;
    }
    if (!user?.address) {
      showToast('Harap isi alamat rumah di profil terlebih dahulu.', 'warning');
      return;
    }
    setSaving(true);
    try {
      const catNamesString = selectedCats.map(c => `${c.name} (${c.breed})`).join(', ');
      
      const res = await api.post('/bookings', {
        booking_type: 'sitter',
        sitter_package: packageType,
        sitter_id: Number(form.sitter_id),
        check_in: form.start_date,
        check_out: form.end_date,
        cat_ids: form.cat_ids,
        visit_time: selectedPackage?.name?.includes('2x') ? 'both' : (form.visit_time === 'pagi' ? 'morning' : 'afternoon'),
        notes: `[SITTER] Paket: ${selectedPackage?.name} | Kucing: ${catNamesString} | Waktu: ${selectedPackage?.name?.includes('2x') ? 'Pagi & Sore' : (form.visit_time === 'pagi' ? 'Pagi (08-11)' : 'Sore (15-18)')} | Sitter: ${selectedSitter?.name} | Alamat: ${user?.address} | ${form.notes}`,
      });
      showToast(`Pesanan sitter ${selectedSitter?.name} berhasil dibuat! 🐾`, 'success');

      if (res.data.snap_token) {
        const snap = await loadSnapScript();
        if (!snap) {
          showToast('Gagal memuat modul pembayaran. Silakan coba lagi dari menu Riwayat.', 'error');
          navigate('/dashboard/history');
          return;
        }
        snap.pay(res.data.snap_token, {
          onSuccess: async function() {
            // Payment status will be updated by Midtrans webhook callback (server-to-server)
            showToast('Pembayaran Sitter berhasil!', 'success');
            navigate('/dashboard/history');
          },
          onPending: function() {
            showToast('Menunggu pembayaran Anda!', 'warning');
            navigate('/dashboard/history');
          },
          onError: function() {
            showToast('Pembayaran gagal atau dibatalkan. Anda dapat membayar dari halaman Riwayat.', 'error');
            navigate('/dashboard/history');
          },
          onClose: function() {
            showToast('Anda menutup popup pembayaran. Anda dapat membayar nanti dari halaman Riwayat.', 'warning');
            navigate('/dashboard/history');
          }
        });
      } else {
        navigate('/dashboard/history');
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Gagal memesan sitter. Silakan coba lagi.';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-black mb-2">Pesan Sitter Kunjungan</h1>
        <p className="text-gray-600 font-medium text-sm md:text-base max-w-2xl">Layanan kunjungan ke rumah untuk memastikan kucing kesayanganmu tetap aman, kenyang, dan bahagia saat kamu tidak ada.</p>
      </div>

      {loading ? (
        <div className="grid lg:grid-cols-5 gap-6 md:gap-8">
          <div className="lg:col-span-3 space-y-6 md:space-y-8">
            <div className="h-40 bg-gray-200 neo-skeleton w-full"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-24 bg-gray-200 neo-skeleton w-full"></div>
              <div className="h-24 bg-gray-200 neo-skeleton w-full"></div>
            </div>
            <div className="h-40 bg-gray-200 neo-skeleton w-full"></div>
          </div>
          <div className="lg:col-span-2">
            <div className="h-96 bg-gray-200 neo-skeleton w-full"></div>
          </div>
        </div>
      ) : cats.length === 0 ? (
        <div className="bg-white border-4 border-dashed border-gray-400 rounded-xl p-8 md:p-12 text-center max-w-lg mx-auto">
          <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="font-bold text-gray-500 mb-4">Kamu belum punya kucing terdaftar.</p>
          <button onClick={() => navigate('/dashboard/profile')} className="bg-neo-yellow border-4 border-neo-dark rounded-lg px-6 py-2 font-black shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
            Tambah Kucing Dulu
          </button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-5 gap-6 md:gap-8">
          {/* Left Column */}
          <div className="lg:col-span-3 space-y-6 md:space-y-8">
            {/* Package Selection */}
            <div>
              <h2 className="text-xl md:text-2xl font-black mb-4">Pilih Paket Kunjungan</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                {packages.map(pkg => {
                  const displayPrice = getDynamicPricePerDay(pkg, form.cat_count);
                  return (
                    <div 
                      key={pkg.id}
                      onClick={() => setPackageType(String(pkg.id))}
                      className={`cursor-pointer border-4 border-neo-dark rounded-xl p-4 md:p-6 transition-all shadow-[4px_4px_0_0_#1E1E1E] hover:translate-x-1 hover:translate-y-1 hover:shadow-none ${String(packageType) === String(pkg.id) ? 'bg-[#4ADE80]' : 'bg-white'}`}
                    >
                      <h3 className="font-black text-xl md:text-2xl mb-2">{pkg.name}</h3>
                      <p className="font-bold text-sm mb-4 md:mb-6 opacity-80">{pkg.description}</p>
                      <p className="font-black text-2xl md:text-3xl">Rp {(displayPrice/1000)}k <span className="text-sm font-bold opacity-80">/hari</span></p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sitter Selection */}
            <div>
              <h2 className="text-xl md:text-2xl font-black mb-4">Pilih Sitter</h2>
              {sitters.length === 0 ? (
                <div className="bg-white border-4 border-dashed border-gray-400 rounded-xl p-6 text-center">
                  <p className="font-bold text-gray-500">Belum ada sitter yang tersedia saat ini.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  {sitters.map(sitter => (
                    <div
                      key={sitter.id}
                      onClick={() => { if (sitter.is_available !== false) setForm({...form, sitter_id: String(sitter.id)}) }}
                      className={`relative border-4 border-neo-dark rounded-xl p-4 transition-all ${
                        sitter.is_available === false 
                          ? 'bg-gray-100 opacity-60 cursor-not-allowed'
                          : `cursor-pointer shadow-[3px_3px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_0_#1E1E1E] ${String(form.sitter_id) === String(sitter.id) ? 'bg-[#B983FF] ring-4 ring-neo-dark' : 'bg-white'}`
                      }`}
                    >
                      {sitter.is_available === false && (
                        <div className="absolute -top-3 -right-3 bg-red-500 text-white font-black text-xs px-3 py-1 rounded-full border-2 border-neo-dark rotate-12 z-10">
                          Jadwal Penuh
                        </div>
                      )}
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 ${sitter.is_available === false ? 'bg-gray-300' : 'bg-neo-yellow'} rounded-full border-3 border-neo-dark flex items-center justify-center overflow-hidden shrink-0`}>
                          <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${sitter.name}`} alt="" className="w-full h-full" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black text-sm truncate">{sitter.name}</h4>
                          <div className="flex items-center gap-1 text-xs font-bold opacity-80">
                            <Star size={12} className="text-yellow-500 fill-yellow-500" />
                            <span>{sitter.avg_rating}</span>
                            <span className="opacity-60">({sitter.review_count} review)</span>
                          </div>
                        </div>
                        {String(form.sitter_id) === String(sitter.id) && sitter.is_available !== false && (
                          <CheckCircle2 size={20} className="ml-auto shrink-0 text-white" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-gray-500">
                        <MapPin size={11} className="shrink-0" />
                        <span className="truncate">{sitter.area}</span>
                      </div>
                      {sitter.speciality && (
                        <p className="text-xs font-bold text-gray-400 mt-1 truncate">🐾 {sitter.speciality}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Included Services */}
            <div>
              <h2 className="text-xl md:text-2xl font-black mb-4">Layanan Termasuk</h2>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="bg-[#FFD2A5] border-4 border-neo-dark rounded-xl p-3 md:p-4 flex items-center gap-3 md:gap-4 shadow-[2px_2px_0_0_#1E1E1E]">
                  <div className="bg-white p-2 rounded-full border-2 border-neo-dark shrink-0"><UtensilsCrossed size={18} /></div>
                  <p className="font-black text-xs md:text-sm">Pemberian Makan & Minum</p>
                </div>
                <div className="bg-[#B983FF] border-4 border-neo-dark rounded-xl p-3 md:p-4 flex items-center gap-3 md:gap-4 shadow-[2px_2px_0_0_#1E1E1E]">
                  <div className="bg-white p-2 rounded-full border-2 border-neo-dark shrink-0"><CheckCircle2 size={18} /></div>
                  <p className="font-black text-xs md:text-sm">Pembersihan Litter Box</p>
                </div>
                <div className="bg-neo-yellow border-4 border-neo-dark rounded-xl p-3 md:p-4 flex items-center gap-3 md:gap-4 shadow-[2px_2px_0_0_#1E1E1E]">
                  <div className="bg-white p-2 rounded-full border-2 border-neo-dark shrink-0"><Clock size={18} /></div>
                  <p className="font-black text-xs md:text-sm">Waktu Bermain (15 mnt)</p>
                </div>
                <div className="bg-[#A2D2FF] border-4 border-neo-dark rounded-xl p-3 md:p-4 flex items-center gap-3 md:gap-4 shadow-[2px_2px_0_0_#1E1E1E]">
                  <div className="bg-white p-2 rounded-full border-2 border-neo-dark shrink-0"><Camera size={18} /></div>
                  <p className="font-black text-xs md:text-sm">Update Foto/Video</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Booking Form */}
          <div className="lg:col-span-2">
            <div className="bg-[#B983FF] border-4 border-neo-dark rounded-xl p-4 md:p-6 shadow-[4px_4px_0_0_#1E1E1E] sticky top-24">
              <h2 className="text-xl md:text-2xl font-black mb-4 md:mb-6">Detail Pemesanan</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase mb-2">Pilih Kucing Anda (Bisa lebih dari 1)</label>
                  <div className="grid grid-cols-1 gap-2 max-h-36 overflow-y-auto p-1.5 border-3 border-neo-dark rounded-lg bg-white">
                    {cats.map(cat => {
                      const isSelected = (form.cat_ids || []).includes(cat.id);
                      return (
                        <div
                          key={cat.id}
                          onClick={() => handleCatToggle(cat.id)}
                          className={`flex items-center gap-3 p-2 rounded-lg border-2 border-neo-dark cursor-pointer transition-all ${
                            isSelected ? 'bg-[#4ADE80] shadow-[2px_2px_0_0_#1E1E1E]' : 'bg-white hover:bg-neo-bg'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // toggled via click on parent
                            className="w-4 h-4 border-2 border-neo-dark accent-neo-dark"
                          />
                          <div className="text-xs font-black">
                            <p>{cat.name} <span className="text-gray-500 font-bold">({cat.breed})</span></p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selectedCats.length > 0 && (
                  <div className="bg-white/30 border-2 border-dashed border-white rounded-lg p-3 space-y-2">
                    <p className="text-xs font-black uppercase">Kucing yang terpilih ({selectedCats.length}):</p>
                    {selectedCats.map(cat => (
                      <div key={cat.id} className="flex items-center gap-3 bg-white/50 border-2 border-neo-dark rounded-md p-1.5 text-xs font-bold">
                        <div className="w-6 h-6 bg-[#FFD2A5] rounded-full border-2 border-neo-dark flex items-center justify-center font-black shrink-0">{cat.name.charAt(0)}</div>
                        <div>{cat.name} ({cat.breed})</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected Sitter Preview */}
                {selectedSitter && (
                  <div className="bg-white/30 border-2 border-dashed border-white rounded-lg p-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-neo-yellow rounded-full border-2 border-neo-dark overflow-hidden shrink-0">
                      <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${selectedSitter.name}`} alt="" className="w-full h-full" />
                    </div>
                    <div className="text-sm">
                      <p className="font-black">{selectedSitter.name}</p>
                      <p className="font-bold opacity-80 flex items-center gap-1">
                        <Star size={12} className="text-yellow-400 fill-yellow-400" /> {selectedSitter.avg_rating} • {selectedSitter.area}
                      </p>
                    </div>
                  </div>
                )}

                {/* Address Preview */}
                <div className={`border-2 rounded-lg p-3 ${user?.address ? 'bg-white/30 border-dashed border-white' : 'bg-red-200/50 border-red-300'}`}>
                  <p className="text-xs font-black uppercase mb-1">📍 Alamat Kunjungan</p>
                  {user?.address ? (
                    <p className="font-bold text-sm">{user.address}</p>
                  ) : (
                    <div>
                      <p className="font-bold text-sm text-red-600 mb-1">Alamat belum diisi!</p>
                      <button type="button" onClick={() => navigate('/dashboard/profile')} className="text-xs font-black underline">Isi di Profil →</button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-black uppercase mb-2">Tanggal Mulai</label>
                  <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="w-full bg-white border-4 border-neo-dark rounded-lg p-3 font-bold focus:outline-none focus:ring-4 focus:ring-neo-pink" />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase mb-2">Tanggal Selesai</label>
                  <input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className="w-full bg-white border-4 border-neo-dark rounded-lg p-3 font-bold focus:outline-none focus:ring-4 focus:ring-neo-pink" />
                </div>

                {selectedPackage?.name?.includes('2x') ? (
                  <div className="bg-[#E0F2FE] border-3 border-neo-dark rounded-lg p-3 text-xs font-bold text-blue-900 shadow-[2px_2px_0_0_#1E1E1E]">
                    <p className="font-black text-xs uppercase mb-1">📅 Jadwal Kunjungan (2x Sehari):</p>
                    <p className="font-bold">• Kunjungan 1: <strong className="font-black">Pagi (08:00 - 11:00)</strong></p>
                    <p className="font-bold">• Kunjungan 2: <strong className="font-black">Sore (15:00 - 18:00)</strong></p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-black uppercase mb-2">Waktu Kunjungan</label>
                    <select value={form.visit_time} onChange={e => setForm({...form, visit_time: e.target.value})} className="w-full bg-white border-4 border-neo-dark rounded-lg p-3 font-bold focus:outline-none focus:ring-4 focus:ring-neo-pink">
                      <option value="pagi">Pagi (08:00 - 11:00)</option>
                      <option value="sore">Sore (15:00 - 18:00)</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-black uppercase mb-1">Catatan Khusus</label>
                  <textarea rows="2" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Misal: Kunci dititip ke satpam..." className="w-full bg-white border-4 border-neo-dark rounded-lg p-3 font-bold focus:outline-none focus:ring-4 focus:ring-neo-pink" />
                </div>

                {days > 0 && (
                  <div className="border-t-4 border-neo-dark pt-4 mt-4">
                    <div className="flex justify-between font-bold text-sm mb-2">
                      <span>{days} hari × Rp {packagePrice.toLocaleString('id-ID')}</span>
                      <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between font-bold text-sm mb-4">
                      <span>Biaya Admin</span>
                      <span>Rp {adminFee.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between font-black text-xl md:text-2xl border-t-4 border-dashed border-neo-dark pt-4">
                      <span>Total</span>
                      <span>Rp {total.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={saving || days <= 0 || !form.sitter_id}
                  className="w-full mt-3 bg-[#4ADE80] border-4 border-neo-dark rounded-xl py-3 md:py-4 font-black text-lg md:text-xl shadow-[4px_4px_0_0_#1E1E1E] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? <><span className="neo-spinner mr-2"></span>Memproses...</> : 'Pesan Sekarang 🐾'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default SitterBooking;
