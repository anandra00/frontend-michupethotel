import { useState, useEffect } from 'react';
import { CalendarDays, Cat, StickyNote, CreditCard, Sparkles, X } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import api from '../../api/axios';
import { useToast } from '../../components/Toast';

const BookingModal = ({ 
  isOpen, 
  onClose, 
  selectedRoom, 
  bookingForm, 
  setBookingForm, 
  onSubmit, 
  saving, 
  nights, 
  totalPrice 
}) => {
  const [cats, setCats] = useState([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const { showToast } = useToast();

  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchCats = async () => {
        setLoadingCats(true);
        try {
          const res = await api.get('/cats');
          setCats(res.data);
        } catch (error) {
          console.error('Error fetching cats for booking:', error);
        } finally {
          setLoadingCats(false);
        }
      };
      fetchCats();
    }
  }, [isOpen]);

  // Reset coupon when nights, selectedRoom, or modal opens/closes change
  useEffect(() => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponError('');
    setCouponCode('');
    setIsExpired(false);
  }, [nights, selectedRoom, isOpen]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    setIsExpired(false);
    try {
      const res = await api.post('/coupons/validate', {
        code: couponCode,
        subtotal: totalPrice
      });
      setAppliedCoupon(res.data);
      setDiscountAmount(res.data.discount);
      setIsExpired(false);
      showToast('Kupon promo berhasil diterapkan! 🎉', 'success');
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Kupon tidak valid.';
      setCouponError(msg);
      if (msg.toLowerCase().includes('kedaluwarsa') || msg.toLowerCase().includes('expired')) {
        setIsExpired(true);
      } else {
        setIsExpired(false);
      }
      showToast(msg, 'error');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCatToggle = (catId) => {
    const currentSelected = bookingForm.cat_ids || [];
    let updated;
    if (currentSelected.includes(catId)) {
      updated = currentSelected.filter(id => id !== catId);
    } else {
      updated = [...currentSelected, catId];
    }
    setBookingForm({
      ...bookingForm,
      cat_ids: updated,
      total_cats: updated.length
    });
  };

  if (!selectedRoom) return null;

  const finalTotal = Math.max(0, totalPrice - discountAmount);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`${selectedRoom.name} - ${selectedRoom.type}`}
      icon={<Sparkles size={22} />}
    >
      <div className="bg-white/60 border-2 border-neo-dark rounded-lg px-3 py-1.5 inline-block mb-4">
        <span className="font-black text-lg">Rp {Number(selectedRoom.price_per_night).toLocaleString('id-ID')}</span>
        <span className="font-bold text-sm opacity-70"> / malam</span>
      </div>

      <form onSubmit={(e) => onSubmit(e, appliedCoupon ? appliedCoupon.code : null)} className="space-y-4">
        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-black uppercase mb-1.5 text-gray-600">
              <CalendarDays size={12} /> Check-in
            </label>
            <input 
              type="date" 
              required 
              value={bookingForm.check_in} 
              onChange={e => setBookingForm({...bookingForm, check_in: e.target.value})} 
              className="w-full bg-neo-bg border-3 border-neo-dark rounded-lg p-2.5 font-bold text-sm focus:outline-none focus:ring-4 focus:ring-neo-pink transition-all" 
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-black uppercase mb-1.5 text-gray-600">
              <CalendarDays size={12} /> Check-out
            </label>
            <input 
              type="date" 
              required 
              value={bookingForm.check_out} 
              onChange={e => setBookingForm({...bookingForm, check_out: e.target.value})} 
              className="w-full bg-neo-bg border-3 border-neo-dark rounded-lg p-2.5 font-bold text-sm focus:outline-none focus:ring-4 focus:ring-neo-pink transition-all" 
            />
          </div>
        </div>

        {/* Pilih Kucing spesifik */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-black uppercase mb-1.5 text-gray-600">
            <Cat size={12} /> Pilih Kucing Anda (Bisa lebih dari 1)
          </label>
          {loadingCats ? (
            <div className="bg-neo-bg border-3 border-neo-dark rounded-lg p-3 text-center text-sm font-bold neo-skeleton">
              Memuat kucing...
            </div>
          ) : cats.length === 0 ? (
            <div className="bg-red-100 border-3 border-red-400 text-red-700 rounded-lg p-3 text-center text-sm font-bold">
              Belum ada kucing terdaftar. Silakan tambah kucing di halaman profil terlebih dahulu.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto p-1.5 border-3 border-neo-dark rounded-lg bg-neo-bg">
              {cats.map(cat => {
                const isSelected = (bookingForm.cat_ids || []).includes(cat.id);
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
                      onChange={() => {}} // toggled via parent div click
                      className="w-4 h-4 border-2 border-neo-dark accent-neo-dark"
                    />
                    <div className="text-xs font-black">
                      <p>{cat.name} <span className="text-gray-500 font-bold">({cat.breed})</span></p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-black uppercase mb-1.5 text-gray-600">
            <StickyNote size={12} /> Catatan (Opsional)
          </label>
          <textarea 
            rows="2" 
            value={bookingForm.notes} 
            onChange={e => setBookingForm({...bookingForm, notes: e.target.value})} 
            placeholder="Misal: Kucing takut gelap, butuh lampu malam..." 
            className="w-full bg-neo-bg border-3 border-neo-dark rounded-lg p-2.5 font-bold text-sm focus:outline-none focus:ring-4 focus:ring-neo-pink transition-all" 
          />
        </div>

        {/* Price Summary */}
        {nights > 0 && (
          <div className="bg-[#F3E8FF] border-3 border-neo-dark rounded-xl p-4">
            {/* Coupon promo block */}
            <div className="mb-4 bg-white/50 p-2.5 rounded-lg border-2 border-dashed border-neo-dark">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] font-black uppercase text-gray-600">Punya Kode Kupon?</label>
                {isExpired && (
                  <span className="bg-[#EF4444] text-white text-[8px] font-black px-1.5 py-0.5 rounded border-2 border-neo-dark shadow-[1px_1px_0_0_#1E1E1E] animate-pulse">
                    KADALUWARSA
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="KODEPROMO"
                  value={couponCode}
                  onChange={e => {
                    setCouponCode(e.target.value.toUpperCase());
                    setCouponError('');
                    setIsExpired(false);
                  }}
                  disabled={!!appliedCoupon}
                  className="flex-1 bg-white border-2 border-neo-dark rounded-md px-2 py-1 font-bold uppercase disabled:bg-gray-100 disabled:opacity-75 text-xs text-neo-dark"
                />
                {appliedCoupon ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedCoupon(null);
                      setDiscountAmount(0);
                      setCouponCode('');
                      setIsExpired(false);
                    }}
                    className="bg-[#EF4444] text-white border-2 border-neo-dark rounded-md px-2.5 py-1 font-black hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all shadow-[1px_1px_0_0_#1E1E1E] text-xs"
                  >
                    Hapus
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="bg-[#FDE047] border-2 border-neo-dark rounded-md px-2.5 py-1 font-black hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all shadow-[1px_1px_0_0_#1E1E1E] disabled:opacity-50 text-xs"
                  >
                    {couponLoading ? '...' : 'Terapkan'}
                  </button>
                )}
              </div>
              {couponError && <p className="text-red-600 text-[10px] font-black mt-1 bg-red-100/80 p-0.5 rounded border border-red-200">{couponError}</p>}
              {appliedCoupon && (
                <p className="text-green-800 text-[10px] font-black mt-1 bg-green-100/80 p-0.5 rounded border border-green-200">
                  ✅ Kupon diterapkan: {appliedCoupon.description || `${appliedCoupon.code} digunakan`}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1.5 mb-3">
              <CreditCard size={14} />
              <span className="text-xs font-black uppercase">Ringkasan Biaya</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-sm">
                <span>{nights} malam × Rp {Number(selectedRoom.price_per_night).toLocaleString('id-ID')}</span>
                <span>Rp {totalPrice.toLocaleString('id-ID')}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between font-bold text-sm text-green-800 bg-green-100/50 p-0.5 rounded">
                  <span>Diskon Kupon</span>
                  <span>-Rp {discountAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
              {bookingForm.total_cats > 1 && (
                <div className="flex justify-between font-bold text-xs text-gray-500">
                  <span>Jumlah kucing</span>
                  <span>{bookingForm.total_cats} ekor</span>
                </div>
              )}
            </div>
            <div className="flex justify-between font-black text-xl border-t-3 border-dashed border-neo-dark pt-3 mt-3">
              <span>Total</span>
              <span className="text-[#7C3AED]">Rp {finalTotal.toLocaleString('id-ID')}</span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button 
          type="submit" 
          isLoading={saving}
          disabled={nights <= 0} 
          className="w-full mt-4"
        >
          Konfirmasi Booking 🐾
        </Button>
      </form>
    </Modal>
  );
};

export default BookingModal;
