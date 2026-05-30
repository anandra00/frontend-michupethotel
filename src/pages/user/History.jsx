import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../api/axios';
import { Star, X, MapPin, MessageCircle } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { loadSnapScript } from '../../utils/snap';
import ChatDrawer from '../../components/ChatDrawer';

const STATUS_MAP = {
  pending: { label: 'Menunggu', bg: 'bg-neo-yellow' },
  approved: { label: 'Dikonfirmasi', bg: 'bg-[#4ADE80]' },
  checked_in: { label: 'Sedang Berjalan', bg: 'bg-[#60A5FA] text-white' },
  checked_out: { label: 'Selesai', bg: 'bg-[#B983FF] text-white' },
  cancelled: { label: 'Dibatalkan', bg: 'bg-red-400 text-white' },
  rejected: { label: 'Ditolak', bg: 'bg-red-500 text-white' },
};

const History = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState(null); // booking object
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [selectedChatBooking, setSelectedChatBooking] = useState(null);
  const { showToast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const fetchBookings = async (page = 1) => {
    try {
      const res = await api.get(`/bookings?page=${page}`);
      if (Array.isArray(res.data)) {
        setBookings(res.data);
        setCurrentPage(1);
        setLastPage(1);
      } else {
        setBookings(res.data.data || []);
        setCurrentPage(res.data.current_page || 1);
        setLastPage(res.data.last_page || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line
  useEffect(() => { fetchBookings(1); }, []);

  const formatDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  const isSitterBooking = (b) => b.booking_type === 'sitter';

  const openReviewModal = (booking) => {
    setReviewForm({ rating: 5, comment: '' });
    setReviewModal(booking);
  };

  const submitReview = async () => {
    if (!reviewModal) return;
    setSubmitting(true);
    try {
      await api.post(`/bookings/${reviewModal.id}/review`, reviewForm);
      showToast(`Review untuk ${reviewModal.sitter?.name} berhasil dikirim! ⭐`, 'success');
      setReviewModal(null);
      fetchBookings(currentPage);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Gagal mengirim review.';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayNow = async (booking) => {
    if (!booking.snap_token) {
      showToast('Token pembayaran tidak ditemukan.', 'error');
      return;
    }
    const snap = await loadSnapScript();
    if (!snap) {
      showToast('Gagal memuat modul pembayaran. Cek koneksi Anda.', 'error');
      return;
    }
    snap.pay(booking.snap_token, {
      onSuccess: async function () {
        // Payment status will be updated by Midtrans webhook callback (server-to-server)
        showToast('Pembayaran berhasil! 🎉', 'success');
        fetchBookings(currentPage);
      },
      onPending: function () {
        showToast('Menunggu pembayaran Anda.', 'success');
      },
      onError: function () {
        showToast('Pembayaran gagal atau dibatalkan.', 'error');
      },
      onClose: function () {
        showToast('Anda menutup popup pembayaran.', 'warning');
      }
    });
  };

  const handleCancelBooking = async (id, isPaid = false) => {
    let confirmMsg = 'Apakah Anda yakin ingin membatalkan pesanan ini?';
    if (isPaid) {
      confirmMsg = 'Apakah Anda yakin ingin membatalkan pesanan ini? Pembatalan lunas H-2 atau lebih sebelum check-in akan mendapatkan refund otomatis. Kurang dari H-2 tidak ada refund.';
    }
    if (window.confirm(confirmMsg)) {
      try {
        const res = await api.post(`/bookings/${id}/cancel`);
        showToast(res.data.message || 'Pesanan berhasil dibatalkan.', 'success');
        fetchBookings(currentPage);
      } catch (err) {
        console.error(err);
        const msg = err.response?.data?.message || 'Gagal membatalkan pesanan.';
        showToast(msg, 'error');
      }
    }
  };

  const handleSitterCheckin = (bookingId) => {
    if (!navigator.geolocation) {
      showToast('Browser Anda tidak mendukung Geolocation.', 'error');
      return;
    }
    showToast('Mendapatkan lokasi Anda untuk verifikasi...', 'info');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await api.post(`/bookings/${bookingId}/sitter-checkin`, {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          showToast(res.data.message || 'Check-in sitter berhasil diverifikasi!', 'success');
          fetchBookings(currentPage);
        } catch (err) {
          console.error(err);
          const msg = err.response?.data?.message || 'Gagal melakukan check-in GPS.';
          showToast(msg, 'error');
        }
      },
      (error) => {
        console.error(error);
        showToast('Gagal mengakses GPS. Pastikan izin lokasi diaktifkan.', 'error');
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black mb-2">Riwayat Transaksi</h1>
        <p className="text-gray-600 font-medium text-sm md:text-base">Pantau status pesanan dan riwayat inap anabulmu di sini.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-neo-dark"></div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white border-4 border-dashed border-gray-400 rounded-xl p-12 text-center">
          <p className="font-bold text-xl text-gray-500">Belum ada riwayat transaksi.</p>
        </div>
      ) : (
        <div className="max-w-3xl space-y-4">
          {bookings.map(booking => {
            let st = STATUS_MAP[booking.status] || { label: booking.status, bg: 'bg-gray-300' };
            
            // If the booking is still pending (not approved by Admin yet) but the payment is paid
            if (booking.status === 'pending' && booking.payment_status === 'paid') {
              st = { label: 'Menunggu Konfirmasi', bg: 'bg-[#4ADE80]' }; // green but different label
            }

            const isSitter = isSitterBooking(booking);
            const canReview = isSitter && booking.status === 'checked_out' && !booking.sitter_review;
            const hasReview = isSitter && booking.sitter_review;

            return (
              <div key={booking.id} className="bg-white border-4 border-neo-dark rounded-xl p-4 md:p-6 shadow-[4px_4px_0_0_#1E1E1E] transition-transform hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#1E1E1E]">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">
                      {isSitter ? `Cat Sitter — Paket ${booking.sitter_package || 'Kunjungan'}` : `Cat Boarding — ${booking.room?.name || 'Kamar'}`}
                    </p>
                    <h3 className="font-black text-xl md:text-2xl">{isSitter ? 'Sitter Visit' : (booking.room?.type || 'Standard')}</h3>
                    {booking.cats && booking.cats.length > 0 ? (
                      <p className="text-sm font-bold text-gray-500 mt-0.5">
                        Kucing: <span className="text-neo-pink font-black">{booking.cats.map(c => c.name).join(', ')}</span> • Rp {Number(booking.total_price).toLocaleString('id-ID')}
                      </p>
                    ) : (
                      <p className="text-sm font-bold text-gray-500 mt-0.5">{booking.total_cats} ekor • Rp {Number(booking.total_price).toLocaleString('id-ID')}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-start sm:items-end gap-1.5">
                    <div className="flex gap-1.5 items-center">
                      {booking.coupon && (
                        <span className="bg-[#FDE047] border-2 border-neo-dark px-2.5 py-0.5 rounded-md font-black text-[10px]">
                          PROMO
                        </span>
                      )}
                      <span className={`${st.bg} border-2 border-neo-dark px-4 py-1 rounded-full font-black text-xs shadow-[2px_2px_0_0_#1E1E1E]`}>
                        {st.label}
                      </span>
                    </div>
                    <p className="font-bold text-gray-500 text-xs">{formatDate(booking.check_in)} — {formatDate(booking.check_out)}</p>
                    <button
                      onClick={() => setSelectedChatBooking(booking)}
                      className="mt-1 flex items-center gap-1 bg-[#A2D2FF] hover:bg-[#60A5FA] border-2 border-neo-dark px-2.5 py-1 rounded-lg font-black text-[10px] shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
                    >
                      <MessageCircle size={11} className="shrink-0" /> Tanya Kabar
                    </button>
                  </div>
                </div>

                {/* Sitter Info */}
                {isSitter && booking.sitter && (
                  <div className="bg-[#F3E8FF] border-3 border-neo-dark rounded-lg p-3 flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-[#B983FF] rounded-full border-2 border-neo-dark overflow-hidden shrink-0">
                      <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${booking.sitter.name}`} alt="" className="w-full h-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm">Sitter: {booking.sitter.name}</p>
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                        <span className="flex items-center gap-0.5"><Star size={11} className="text-yellow-500 fill-yellow-500" /> {booking.sitter.avg_rating || booking.sitter.rating}</span>
                        <span className="flex items-center gap-0.5"><MapPin size={11} /> {booking.sitter.area}</span>
                      </div>
                    </div>

                    {/* Review Button */}
                    {canReview && (
                      <button
                        onClick={() => openReviewModal(booking)}
                        className="shrink-0 bg-neo-yellow border-3 border-neo-dark rounded-lg px-3 py-1.5 font-black text-xs shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center gap-1"
                      >
                        <Star size={12} /> Review
                      </button>
                    )}

                    {/* Already Reviewed */}
                    {hasReview && (
                      <div className="shrink-0 flex items-center gap-1 bg-[#4ADE80] border-2 border-neo-dark rounded-full px-3 py-1 text-xs font-black">
                        {[...Array(booking.sitter_review.rating)].map((_, i) => (
                          <Star key={i} size={10} className="text-yellow-600 fill-yellow-600" />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                {booking.notes && (
                  <p className="text-xs text-gray-400 italic border-l-4 border-neo-yellow pl-2">{booking.notes}</p>
                )}

                {/* Show review comment if exists */}
                {hasReview && booking.sitter_review?.comment && (
                  <div className="mt-2 bg-neo-bg border-2 border-dashed border-gray-300 rounded-lg p-2 text-xs font-bold text-gray-500 italic">
                    "{booking.sitter_review.comment}"
                  </div>
                )}

                {/* GPS Check-in verification details */}
                {isSitter && booking.checkin_distance_m !== null && (
                  <div className="mt-2.5 bg-neo-bg border-2 border-neo-dark rounded-lg p-2.5 text-xs font-bold text-neo-dark flex justify-between items-center">
                    <span>Lokasi Check-in Sitter:</span>
                    <span className={booking.checkin_verified ? "text-green-700 font-black uppercase" : "text-red-600 font-black uppercase"}>
                      {booking.checkin_verified ? `✅ Terverifikasi (${booking.checkin_distance_m}m)` : `❌ Di luar radius (${booking.checkin_distance_m}m)`}
                    </span>
                  </div>
                )}

                {/* Refund status details */}
                {booking.refund_status && (
                  <div className="mt-2.5 bg-red-50 border-2 border-dashed border-red-300 rounded-lg p-2.5 text-xs font-bold text-red-700 flex justify-between items-center">
                    <span>Status Refund Midtrans:</span>
                    <span className="font-black uppercase">
                      {booking.refund_status === 'pending' && '⏳ Diproses (Pending)'}
                      {booking.refund_status === 'processed' && '✅ Selesai (Refunded)'}
                      {booking.refund_status === 'failed' && '❌ Gagal / Tidak Memenuhi Syarat'}
                    </span>
                  </div>
                )}

                {/* Sitter check-in button for approved status */}
                {isSitter && booking.status === 'approved' && (
                  <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-300">
                    <button
                      onClick={() => handleSitterCheckin(booking.id)}
                      className="bg-neo-yellow text-neo-dark border-3 border-neo-dark rounded-lg px-4 py-2 font-black text-xs shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer flex items-center gap-1"
                    >
                      📍 Verifikasi Sitter Check-in (GPS)
                    </button>
                  </div>
                )}

                {/* Pay/Cancel Buttons for unpaid pending bookings */}
                {booking.status === 'pending' && booking.payment_status !== 'paid' && (
                  <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-xs font-bold text-red-500 flex items-center gap-1">
                      ⚠️ Belum Dibayar
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCancelBooking(booking.id, false)}
                        className="bg-red-400 text-white border-3 border-neo-dark rounded-lg px-4 py-2 font-black text-xs shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        onClick={() => handlePayNow(booking)}
                        className="bg-[#4ADE80] border-3 border-neo-dark rounded-lg px-4 py-2 font-black text-xs shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center gap-1 cursor-pointer"
                      >
                        💳 Bayar Sekarang
                      </button>
                    </div>
                  </div>
                )}

                {/* Cancel button for PAID bookings (cancellable) */}
                {booking.payment_status === 'paid' && (booking.status === 'pending' || booking.status === 'approved') && (
                  <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-xs font-bold text-gray-500">
                      Kebijakan Refund: H-2 pembatalan
                    </p>
                    <button
                      onClick={() => handleCancelBooking(booking.id, true)}
                      className="bg-red-400 text-white border-3 border-neo-dark rounded-lg px-4 py-2 font-black text-xs shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
                    >
                      Batalkan Pesanan & Refund
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination Controls */}
          {lastPage > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8 bg-white border-4 border-neo-dark p-4 rounded-xl shadow-[4px_4px_0_0_#1E1E1E]">
              <button
                disabled={currentPage <= 1}
                onClick={() => fetchBookings(currentPage - 1)}
                className="px-4 py-2 border-3 border-neo-dark rounded-lg font-black text-xs bg-neo-yellow hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none shadow-[2px_2px_0_0_#1E1E1E] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sebelumnya
              </button>
              <span className="font-black text-sm">
                Halaman {currentPage} dari {lastPage}
              </span>
              <button
                disabled={currentPage >= lastPage}
                onClick={() => fetchBookings(currentPage + 1)}
                className="px-4 py-2 border-3 border-neo-dark rounded-lg font-black text-xs bg-neo-yellow hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none shadow-[2px_2px_0_0_#1E1E1E] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Berikutnya
              </button>
            </div>
          )}
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neo-yellow border-4 border-neo-dark rounded-xl p-6 shadow-[8px_8px_0_0_#1E1E1E] max-w-sm w-full relative animate-scale-in">
            <button onClick={() => setReviewModal(null)} className="absolute right-3 top-3 bg-white border-2 border-neo-dark p-1 rounded-full hover:bg-red-400 hover:text-white transition-colors">
              <X size={18} />
            </button>

            <div className="text-center mb-5">
              <div className="w-16 h-16 bg-[#B983FF] rounded-full border-4 border-neo-dark mx-auto mb-3 overflow-hidden">
                <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${reviewModal.sitter?.name}`} alt="" className="w-full h-full" />
              </div>
              <h3 className="text-xl font-black">Review Sitter</h3>
              <p className="text-sm font-bold text-gray-600">{reviewModal.sitter?.name}</p>
            </div>

            {/* Star Rating */}
            <div className="flex justify-center gap-2 mb-5">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setReviewForm({...reviewForm, rating: star})}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={36}
                    className={`${star <= reviewForm.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'} transition-colors`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center font-black text-lg mb-4">
              {reviewForm.rating === 1 ? '😞 Kurang' : reviewForm.rating === 2 ? '😐 Cukup' : reviewForm.rating === 3 ? '🙂 Baik' : reviewForm.rating === 4 ? '😊 Bagus!' : '🤩 Luar Biasa!'}
            </p>

            <div className="mb-4">
              <label className="block text-xs font-black uppercase mb-1">Komentar (Opsional)</label>
              <textarea
                rows="3"
                value={reviewForm.comment}
                onChange={e => setReviewForm({...reviewForm, comment: e.target.value})}
                className="w-full bg-white border-4 border-neo-dark rounded-lg p-3 font-bold focus:outline-none focus:ring-4 focus:ring-neo-pink"
                placeholder="Ceritakan pengalamanmu dengan sitter ini..."
              />
            </div>

            <button
              onClick={submitReview}
              disabled={submitting}
              className="w-full bg-[#4ADE80] border-4 border-neo-dark rounded-lg py-3 font-black text-lg shadow-[4px_4px_0_0_#1E1E1E] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50"
            >
              {submitting ? <><span className="neo-spinner mr-2"></span>Mengirim...</> : 'Kirim Review ⭐'}
            </button>
          </div>
        </div>
      )}
      {selectedChatBooking && (
        <ChatDrawer 
          booking={selectedChatBooking} 
          onClose={() => setSelectedChatBooking(null)} 
        />
      )}
    </DashboardLayout>
  );
};

export default History;
