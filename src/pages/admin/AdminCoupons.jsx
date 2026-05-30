import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Tag, Plus, Edit2, Trash2, Calendar, Ticket, Percent, Check, X, ShieldAlert } from 'lucide-react';
import api from '../../api/axios';

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  // Form state
  const [form, setForm] = useState({
    code: '',
    type: 'percentage',
    value: '',
    min_order: '',
    max_discount: '',
    usage_limit: '',
    valid_from: '',
    valid_until: '',
    is_active: true,
    description: '',
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/coupons');
      setCoupons(res.data);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat daftar kupon.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setForm({
      code: '',
      type: 'percentage',
      value: '',
      min_order: '0',
      max_discount: '',
      usage_limit: '0',
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      is_active: true,
      description: '',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleOpenEdit = (coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      min_order: coupon.min_order || '0',
      max_discount: coupon.max_discount || '',
      usage_limit: coupon.usage_limit || '0',
      valid_from: coupon.valid_from.split(' ')[0],
      valid_until: coupon.valid_until.split(' ')[0],
      is_active: coupon.is_active === 1 || coupon.is_active === true,
      description: coupon.description || '',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus kupon ini?')) return;
    try {
      await api.delete(`/admin/coupons/${id}`);
      setCoupons(coupons.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus kupon.');
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!form.code.trim()) errors.code = 'Kode kupon wajib diisi';
    if (!form.value || parseFloat(form.value) <= 0) errors.value = 'Nilai diskon harus lebih besar dari 0';
    if (form.type === 'percentage' && parseFloat(form.value) > 100) errors.value = 'Persentase diskon maksimal 100%';
    if (!form.valid_from) errors.valid_from = 'Tanggal mulai wajib diisi';
    if (!form.valid_until) errors.valid_until = 'Tanggal selesai wajib diisi';
    if (form.valid_from && form.valid_until && form.valid_until < form.valid_from) {
      errors.valid_until = 'Tanggal selesai tidak boleh sebelum tanggal mulai';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      ...form,
      value: parseFloat(form.value),
      min_order: form.min_order ? parseFloat(form.min_order) : 0,
      max_discount: form.max_discount ? parseFloat(form.max_discount) : null,
      usage_limit: form.usage_limit ? parseInt(form.usage_limit) : 0,
      is_active: form.is_active ? 1 : 0,
    };

    try {
      if (editingCoupon) {
        const res = await api.put(`/admin/coupons/${editingCoupon.id}`, payload);
        setCoupons(coupons.map(c => c.id === editingCoupon.id ? res.data : c));
      } else {
        const res = await api.post('/admin/coupons', payload);
        setCoupons([res.data, ...coupons]);
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
      } else {
        setError('Gagal menyimpan kupon.');
      }
    }
  };

  const toggleActiveStatus = async (coupon) => {
    try {
      const newStatus = coupon.is_active === 1 || coupon.is_active === true ? 0 : 1;
      const res = await api.put(`/admin/coupons/${coupon.id}`, {
        is_active: newStatus
      });
      setCoupons(coupons.map(c => c.id === coupon.id ? res.data : c));
    } catch (err) {
      console.error(err);
      alert('Gagal mengubah status kupon.');
    }
  };

  const formatPrice = (value) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-black mb-2 uppercase flex items-center gap-3">
            <Ticket className="w-10 h-10" /> Kupon & Promo
          </h1>
          <p className="text-gray-600 font-medium">Buat dan kelola kupon diskon untuk pelanggan.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-[#A78BFA] border-4 border-neo-dark rounded-xl px-6 py-3 font-black shadow-[4px_4px_0_0_#1E1E1E] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <Plus size={20} /> Tambah Kupon
        </button>
      </div>

      {error && (
        <div className="bg-[#EF4444] text-white border-4 border-neo-dark rounded-xl p-4 mb-6 font-black flex items-center gap-2 shadow-[4px_4px_0_0_#1E1E1E]">
          <ShieldAlert size={20} /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-neo-dark"></div>
        </div>
      ) : coupons.length === 0 ? (
        <div className="bg-white border-4 border-neo-dark rounded-xl p-8 text-center shadow-[4px_4px_0_0_#1E1E1E]">
          <p className="text-xl font-bold text-gray-500 mb-4">Belum ada kupon yang dibuat.</p>
          <button
            onClick={handleOpenCreate}
            className="bg-[#A78BFA] border-4 border-neo-dark rounded-xl px-6 py-3 font-black shadow-[4px_4px_0_0_#1E1E1E] inline-flex items-center gap-2"
          >
            <Plus size={20} /> Buat Kupon Pertama
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((coupon) => {
            const isActive = coupon.is_active === 1 || coupon.is_active === true;
            const isExpired = new Date(coupon.valid_until) < new Date();
            const limitReached = coupon.usage_limit > 0 && coupon.used_count >= coupon.usage_limit;

            return (
              <div
                key={coupon.id}
                className={`bg-white border-4 border-neo-dark rounded-2xl p-6 shadow-[6px_6px_0_0_#1E1E1E] relative flex flex-col justify-between ${
                  !isActive || isExpired || limitReached ? 'opacity-75' : ''
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <span className="bg-[#FDE047] text-neo-dark font-black px-4 py-1.5 border-2 border-neo-dark rounded-lg text-lg tracking-wider shadow-[2px_2px_0_0_#1E1E1E]">
                      {coupon.code}
                    </span>
                    <span
                      className={`text-xs font-black uppercase px-2.5 py-1 border-2 border-neo-dark rounded-md ${
                        isActive && !isExpired && !limitReached
                          ? 'bg-[#4ADE80]'
                          : 'bg-[#EF4444] text-white'
                      }`}
                    >
                      {isActive && !isExpired && !limitReached
                        ? 'Aktif'
                        : isExpired
                        ? 'Expired'
                        : limitReached
                        ? 'Limit Habis'
                        : 'Non-aktif'}
                    </span>
                  </div>

                  <h3 className="text-2xl font-black mb-1 flex items-center gap-1.5">
                    {coupon.type === 'percentage' ? (
                      <>
                        <Percent className="w-6 h-6 text-indigo-600" /> {coupon.value}% OFF
                      </>
                    ) : (
                      <>
                        <Ticket className="w-6 h-6 text-emerald-600" /> {formatPrice(coupon.value)} OFF
                      </>
                    )}
                  </h3>

                  <p className="text-gray-600 font-bold text-sm mb-4 min-h-[40px]">
                    {coupon.description || 'Tidak ada deskripsi.'}
                  </p>

                  <div className="space-y-2 border-t-2 border-dashed border-gray-300 pt-4 text-xs font-bold text-gray-700">
                    <div className="flex justify-between">
                      <span>Min. Belanja:</span>
                      <span>{coupon.min_order > 0 ? formatPrice(coupon.min_order) : 'Tanpa Min.'}</span>
                    </div>
                    {coupon.type === 'percentage' && coupon.max_discount > 0 && (
                      <div className="flex justify-between">
                        <span>Maks. Potongan:</span>
                        <span>{formatPrice(coupon.max_discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Penggunaan:</span>
                      <span className="font-extrabold text-neo-dark">
                        {coupon.used_count} / {coupon.usage_limit > 0 ? coupon.usage_limit : '∞'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> Periode:
                      </span>
                      <span>
                        {coupon.valid_from.split(' ')[0]} s/d {coupon.valid_until.split(' ')[0]}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2.5 mt-6 border-t-4 border-neo-dark pt-4">
                  <button
                    onClick={() => toggleActiveStatus(coupon)}
                    className={`flex-1 border-2 border-neo-dark rounded-lg py-2 text-xs font-black shadow-[2px_2px_0_0_#1E1E1E] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none flex items-center justify-center gap-1 ${
                      isActive ? 'bg-[#EF4444] text-white' : 'bg-[#4ADE80]'
                    }`}
                  >
                    {isActive ? (
                      <>
                        <X size={14} /> Nonaktifkan
                      </>
                    ) : (
                      <>
                        <Check size={14} /> Aktifkan
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(coupon)}
                    className="bg-[#3B82F6] text-white border-2 border-neo-dark rounded-lg p-2 shadow-[2px_2px_0_0_#1E1E1E] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
                    title="Edit Kupon"
                  >
                    <Edit2 size={16} />
                  </button>

                  <button
                    onClick={() => handleDelete(coupon.id)}
                    className="bg-[#EF4444] text-white border-2 border-neo-dark rounded-lg p-2 shadow-[2px_2px_0_0_#1E1E1E] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
                    title="Hapus Kupon"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Create/Edit */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white border-4 border-neo-dark rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-[8px_8px_0_0_#1E1E1E] my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b-4 border-neo-dark pb-4">
              <h2 className="text-3xl font-black uppercase flex items-center gap-2">
                <Tag /> {editingCoupon ? 'Edit Kupon' : 'Kupon Baru'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="bg-gray-200 border-2 border-neo-dark rounded-md p-1 font-bold hover:bg-gray-300"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase mb-1">Kode Kupon (Unique)</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PROMOHEBAT"
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  disabled={!!editingCoupon}
                  className="w-full bg-neo-bg border-4 border-neo-dark rounded-lg p-3 font-bold placeholder:text-gray-400"
                />
                {formErrors.code && <p className="text-red-500 text-xs font-bold mt-1">{formErrors.code}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Tipe Diskon</label>
                  <select
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value })}
                    className="w-full bg-neo-bg border-4 border-neo-dark rounded-lg p-3 font-bold"
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="flat">Potongan Harga (Rp)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">
                    Nilai ({form.type === 'percentage' ? '%' : 'Rp'})
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={form.value}
                    onChange={e => setForm({ ...form, value: e.target.value })}
                    className="w-full bg-neo-bg border-4 border-neo-dark rounded-lg p-3 font-bold"
                  />
                  {formErrors.value && <p className="text-red-500 text-xs font-bold mt-1">{formErrors.value}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Min. Order (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.min_order}
                    onChange={e => setForm({ ...form, min_order: e.target.value })}
                    className="w-full bg-neo-bg border-4 border-neo-dark rounded-lg p-3 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Maks. Potongan (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Hanya untuk Persentase"
                    disabled={form.type !== 'percentage'}
                    value={form.max_discount}
                    onChange={e => setForm({ ...form, max_discount: e.target.value })}
                    className="w-full bg-neo-bg border-4 border-neo-dark rounded-lg p-3 font-bold disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Kuota Penggunaan</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 = Unlimited"
                    value={form.usage_limit}
                    onChange={e => setForm({ ...form, usage_limit: e.target.value })}
                    className="w-full bg-neo-bg border-4 border-neo-dark rounded-lg p-3 font-bold"
                  />
                </div>
                <div className="flex items-center mt-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={form.is_active}
                      onChange={e => setForm({ ...form, is_active: e.target.checked })}
                    />
                    <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-neo-pink rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#4ADE80]"></div>
                    <span className="ml-3 text-sm font-black uppercase text-gray-700">Aktif</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Berlaku Mulai</label>
                  <input
                    type="date"
                    required
                    value={form.valid_from}
                    onChange={e => setForm({ ...form, valid_from: e.target.value })}
                    className="w-full bg-neo-bg border-4 border-neo-dark rounded-lg p-3 font-bold"
                  />
                  {formErrors.valid_from && <p className="text-red-500 text-xs font-bold mt-1">{formErrors.valid_from}</p>}
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Berlaku Sampai</label>
                  <input
                    type="date"
                    required
                    value={form.valid_until}
                    onChange={e => setForm({ ...form, valid_until: e.target.value })}
                    className="w-full bg-neo-bg border-4 border-neo-dark rounded-lg p-3 font-bold"
                  />
                  {formErrors.valid_until && <p className="text-red-500 text-xs font-bold mt-1">{formErrors.valid_until}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Deskripsi</label>
                <textarea
                  rows="2"
                  placeholder="Keterangan mengenai kupon ini..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-neo-bg border-4 border-neo-dark rounded-lg p-3 font-bold placeholder:text-gray-400"
                />
              </div>

              <div className="flex gap-4 mt-6 border-t-4 border-neo-dark pt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 bg-gray-200 border-4 border-neo-dark rounded-xl py-3 font-black shadow-[4px_4px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#4ADE80] border-4 border-neo-dark rounded-xl py-3 font-black shadow-[4px_4px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                >
                  {editingCoupon ? 'Simpan Perubahan' : 'Buat Kupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminCoupons;
