import { CalendarDays, Cat, StickyNote, CreditCard, Sparkles } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';

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
  if (!selectedRoom) return null;

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

      <form onSubmit={onSubmit} className="space-y-4">
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

        {/* Total Cats */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-black uppercase mb-1.5 text-gray-600">
            <Cat size={12} /> Jumlah Kucing
          </label>
          <div className="flex items-center gap-2">
            <button 
              type="button" 
              onClick={() => setBookingForm({...bookingForm, total_cats: Math.max(1, bookingForm.total_cats - 1)})}
              className="w-10 h-10 bg-neo-bg border-3 border-neo-dark rounded-lg font-black text-lg hover:bg-neo-yellow transition-colors flex items-center justify-center shadow-[2px_2px_0_0_#1E1E1E] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
            >−</button>
            <div className="flex-1 bg-neo-bg border-3 border-neo-dark rounded-lg p-2.5 font-black text-center text-lg">
              {bookingForm.total_cats}
            </div>
            <button 
              type="button" 
              onClick={() => setBookingForm({...bookingForm, total_cats: Math.min(5, Number(bookingForm.total_cats) + 1)})}
              className="w-10 h-10 bg-neo-bg border-3 border-neo-dark rounded-lg font-black text-lg hover:bg-neo-yellow transition-colors flex items-center justify-center shadow-[2px_2px_0_0_#1E1E1E] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
            >+</button>
          </div>
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
            <div className="flex items-center gap-1.5 mb-3">
              <CreditCard size={14} />
              <span className="text-xs font-black uppercase">Ringkasan Biaya</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-sm">
                <span>{nights} malam × Rp {Number(selectedRoom.price_per_night).toLocaleString('id-ID')}</span>
                <span>Rp {totalPrice.toLocaleString('id-ID')}</span>
              </div>
              {bookingForm.total_cats > 1 && (
                <div className="flex justify-between font-bold text-xs text-gray-500">
                  <span>Jumlah kucing</span>
                  <span>{bookingForm.total_cats} ekor</span>
                </div>
              )}
            </div>
            <div className="flex justify-between font-black text-xl border-t-3 border-dashed border-neo-dark pt-3 mt-3">
              <span>Total</span>
              <span className="text-[#7C3AED]">Rp {totalPrice.toLocaleString('id-ID')}</span>
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
