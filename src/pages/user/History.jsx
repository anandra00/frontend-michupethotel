import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../api/axios';
import { Star, X, MapPin, MessageCircle } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { loadSnapScript } from '../../utils/snap';
import ChatDrawer from '../../components/ChatDrawer';

const STATUS_MAP = {
  pending: { label: 'Menunggu', bg: 'bg-[#FFDE4D]' },
  approved: { label: 'Disetujui', bg: 'bg-[#55EC8C]' },
  checked_in: { label: 'Sedang Berjalan', bg: 'bg-[#5CBDF9] text-neo-dark' },
  checked_out: { label: 'Selesai', bg: 'bg-[#C28CFF] text-neo-dark' },
  cancelled: { label: 'Dibatalkan', bg: 'bg-[#FF7B7B] text-white' },
  rejected: { label: 'Ditolak', bg: 'bg-[#E53E3E] text-white' },
};

const parseBookingNotes = (notesStr) => {
  if (!notesStr) return null;
  if (notesStr.startsWith('[SITTER]')) {
    const cleanStr = notesStr.replace('[SITTER] ', '');
    const parts = cleanStr.split(' | ');
    const details = {};
    let customNotes = '';

    parts.forEach(part => {
      const colonIndex = part.indexOf(':');
      if (colonIndex !== -1) {
        const label = part.slice(0, colonIndex).trim().toLowerCase();
        const value = part.slice(colonIndex + 1).trim();
        details[label] = value;
      } else {
        if (part.trim() && part !== 'none' && part !== 'null') {
          customNotes = part.trim();
        }
      }
    });
    return { type: 'sitter', details, customNotes };
  }
  return { type: 'custom', customNotes: notesStr };
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
  const [cancelConfirmation, setCancelConfirmation] = useState(null); // { id, isPaid, msg }

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
  useEffect(() => {
    const checkRedirectPayment = async () => {
      const params = new URLSearchParams(window.location.search);
      const orderId = params.get('order_id');

      if (orderId) {
        const parts = orderId.split('-');
        if (parts.length >= 2) {
          const bookingId = parts[1];
          showToast('Memverifikasi status pembayaran Anda...', 'info');
          try {
            await api.post(`/bookings/${bookingId}/verify-payment`);
            showToast('Pembayaran berhasil diverifikasi! 🎉', 'success');
            // Clean up the URL query parameters so they don't trigger again on page refreshes
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch (err) {
            console.error(err);
            showToast('Pemeriksaan status pembayaran selesai.', 'info');
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }
      }
      fetchBookings(1);
    };

    checkRedirectPayment();
  }, []);

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
        showToast('Memverifikasi pembayaran...', 'info');
        try {
          await api.post(`/bookings/${booking.id}/verify-payment`);
          showToast('Pembayaran berhasil diverifikasi! 🎉', 'success');
        } catch (err) {
          console.error(err);
          showToast('Pembayaran berhasil! Menunggu konfirmasi sistem.', 'success');
        }
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

  const triggerCancelBooking = (id, isPaid = false) => {
    let confirmMsg = 'Apakah Anda yakin ingin membatalkan pesanan ini?';
    if (isPaid) {
      confirmMsg = 'Apakah Anda yakin ingin membatalkan pesanan ini? Pembatalan lunas H-2 atau lebih sebelum check-in akan mendapatkan refund otomatis. Kurang dari H-2 tidak ada refund.';
    }
    setCancelConfirmation({ id, isPaid, msg: confirmMsg });
  };

  const handleCancelBooking = async (id) => {
    try {
      showToast('Memproses pembatalan...', 'info');
      const res = await api.post(`/bookings/${id}/cancel`);
      showToast(res.data.message || 'Pesanan berhasil dibatalkan.', 'success');
      fetchBookings(currentPage);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Gagal membatalkan pesanan.';
      showToast(msg, 'error');
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
              st = { label: 'Menunggu Konfirmasi', bg: 'bg-[#55EC8C]' }; // green but different label
            }

            const isSitter = isSitterBooking(booking);
            const canReview = isSitter && booking.status === 'checked_out' && !booking.sitter_review;
            const hasReview = isSitter && booking.sitter_review;

            return (
              <div key={booking.id} className="bg-white border-4 border-neo-dark rounded-xl p-5 md:p-6 shadow-[6px_6px_0_0_#1E1E1E] transition-all hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#1E1E1E] relative overflow-hidden">
                {/* Visual Accent Strip based on status */}
                <div className={`absolute top-0 left-0 right-0 h-2.5 ${st.bg.split(' ')[0]}`} />
                
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4 mt-2">
                  <div className="flex-grow min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-[10px] font-black bg-neo-bg border-2 border-neo-dark text-gray-500 px-2 py-0.5 rounded-md uppercase">
                        {isSitter ? '🐱 CAT SITTER' : '🏨 CAT BOARDING'}
                      </span>
                      {booking.coupon && (
                        <span className="bg-[#FFE353] border-2 border-neo-dark px-2 py-0.5 rounded-md font-black text-[9px] shadow-[1px_1px_0_0_#1E1E1E]">
                          🎁 PROMO
                        </span>
                      )}
                    </div>
                    
                    <h3 className="font-black text-xl md:text-2xl text-neo-dark tracking-tight mb-1">
                      {isSitter ? `Sitter Visit` : `Boarding: ${booking.room?.name || 'Kamar'}`}
                    </h3>
                    
                    <p className="font-bold text-gray-500 text-xs flex items-center gap-1 mb-2">
                      📅 {formatDate(booking.check_in)} — {formatDate(booking.check_out)}
                    </p>

                    {/* Cats rendering */}
                    {booking.cats && booking.cats.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {booking.cats.map(cat => (
                          <span key={cat.id} className="bg-[#FFF0F5] border-2 border-neo-dark px-2.5 py-1 rounded-md font-black text-xs text-neo-pink shadow-[2px_2px_0_0_#1E1E1E]">
                            🐱 {cat.name} <span className="text-gray-400 font-bold">({cat.breed || 'Campuran'})</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="bg-[#FFF0F5] border-2 border-neo-dark px-2.5 py-1 rounded-md font-black text-xs text-neo-pink shadow-[2px_2px_0_0_#1E1E1E]">
                        🐱 {booking.total_cats} Ekor Anabul
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-row md:flex-col items-start md:items-end justify-between md:justify-start gap-3 shrink-0">
                    <span className={`${st.bg} border-3 border-neo-dark px-4 py-1.5 rounded-full font-black text-xs shadow-[3px_3px_0_0_#1E1E1E]`}>
                      {st.label}
                    </span>
                    
                    <div className="text-left md:text-right">
                      <span className="text-[10px] font-black text-gray-400 uppercase block leading-none mb-1">Total Biaya</span>
                      <span className="font-black text-xl md:text-2xl text-neo-dark block">
                        Rp {Number(booking.total_price).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sitter / Room info cards */}
                {isSitter && booking.sitter && (
                  <div className="bg-[#F5EFFF] border-3 border-neo-dark rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 shadow-[3px_3px_0_0_#1E1E1E] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 bg-[#DDBBFF] rounded-full border-2 border-neo-dark overflow-hidden shrink-0 shadow-[2px_2px_0_0_#1E1E1E]">
                        <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${booking.sitter.name}`} alt="" className="w-full h-full" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-black text-sm text-neo-dark truncate">Sitter: {booking.sitter.name}</span>
                          <span className="bg-[#B983FF] text-white border-2 border-neo-dark text-[9px] font-black px-1.5 py-0.25 rounded shrink-0">MITRA</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-bold text-gray-500">
                          <span className="flex items-center gap-0.5"><Star size={12} className="text-yellow-500 fill-yellow-500" /> {booking.sitter.avg_rating || booking.sitter.rating}</span>
                          <span className="flex items-center gap-0.5"><MapPin size={12} /> {booking.sitter.area}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <button
                        onClick={() => setSelectedChatBooking(booking)}
                        className="bg-[#A2D2FF] hover:bg-[#60A5FA] border-3 border-neo-dark px-3 py-2 rounded-xl font-black text-xs shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <MessageCircle size={13} className="shrink-0" /> Chat Sitter
                      </button>

                      {canReview && (
                        <button
                          onClick={() => openReviewModal(booking)}
                          className="bg-neo-yellow border-3 border-neo-dark rounded-xl px-3 py-2 font-black text-xs shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Star size={13} /> Review
                        </button>
                      )}

                      {hasReview && (
                        <div className="flex items-center gap-0.5 bg-[#55EC8C] border-3 border-neo-dark rounded-full px-3 py-1.5 text-xs font-black shadow-[2px_2px_0_0_#1E1E1E]">
                          {[...Array(booking.sitter_review.rating)].map((_, i) => (
                            <Star key={i} size={11} className="text-yellow-600 fill-yellow-600" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!isSitter && booking.room && (
                  <div className="bg-[#FFF4E0] border-3 border-neo-dark rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 shadow-[3px_3px_0_0_#1E1E1E] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 bg-[#FFC55A] rounded-full border-2 border-neo-dark overflow-hidden shrink-0 flex items-center justify-center font-black text-xl shadow-[2px_2px_0_0_#1E1E1E]">
                        🏨
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-black text-sm text-neo-dark">Kamar: {booking.room.name}</span>
                          <span className="bg-[#FF9F1C] text-white border-2 border-neo-dark text-[9px] font-black px-1.5 py-0.25 rounded uppercase shrink-0">{booking.room.type}</span>
                        </div>
                        <p className="text-xs font-bold text-gray-500 truncate">{booking.room.description || 'Layanan rawat inap kucing premium dengan AC dan sterilisasi berkala.'}</p>
                      </div>
                    </div>
                    <div className="shrink-0 self-end sm:self-auto">
                      <button
                        onClick={() => setSelectedChatBooking(booking)}
                        className="bg-[#A2D2FF] hover:bg-[#60A5FA] border-3 border-neo-dark px-3 py-2 rounded-xl font-black text-xs shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <MessageCircle size={13} className="shrink-0" /> Chat Admin
                      </button>
                    </div>
                  </div>
                )}

                {/* Dynamic Styled Notes & Details Grid */}
                {(() => {
                  const notesData = parseBookingNotes(booking.notes);
                  if (!notesData) return null;

                  if (notesData.type === 'sitter') {
                    const { details, customNotes } = notesData;
                    return (
                      <div className="bg-[#FAF8F5] border-3 border-neo-dark rounded-xl p-4 mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-3 shadow-[2px_2px_0_0_#1E1E1E]">
                        {details.paket && (
                          <div>
                            <span className="font-black uppercase text-[10px] text-gray-400 block mb-0.5">📦 Layanan Paket</span>
                            <span className="font-bold text-gray-800">{details.paket}</span>
                          </div>
                        )}
                        {details.waktu && (
                          <div>
                            <span className="font-black uppercase text-[10px] text-gray-400 block mb-0.5">⏰ Jadwal Shift</span>
                            <span className="font-bold text-gray-800 uppercase">{details.waktu}</span>
                          </div>
                        )}
                        {details.alamat && (
                          <div className="sm:col-span-2">
                            <span className="font-black uppercase text-[10px] text-gray-400 block mb-0.5">📍 Alamat Kunjungan</span>
                            <span className="font-bold text-gray-800">{details.alamat}</span>
                          </div>
                        )}
                        {customNotes && (
                          <div className="sm:col-span-2 bg-[#FEF08A] border-2 border-neo-dark p-2.5 rounded-lg mt-1">
                            <span className="font-black uppercase text-[9px] text-neo-dark block mb-0.5">📝 Catatan Khusus Kamu</span>
                            <span className="font-bold text-neo-dark italic">"{customNotes}"</span>
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div className="bg-[#FAF8F5] border-3 border-neo-dark p-3.5 rounded-xl mt-3 mb-3 shadow-[2px_2px_0_0_#1E1E1E]">
                      <span className="font-black uppercase text-[10px] text-gray-400 block mb-1">📝 Catatan Pemesan</span>
                      <p className="font-bold text-xs text-gray-700 italic">"{notesData.customNotes}"</p>
                    </div>
                  );
                })()}

                {/* Show review comment if exists */}
                {hasReview && booking.sitter_review?.comment && (
                  <div className="mt-2 bg-neo-bg border-2 border-dashed border-gray-300 rounded-lg p-2.5 text-xs font-bold text-gray-500 italic">
                    "{booking.sitter_review.comment}"
                  </div>
                )}

                {/* GPS Check-in verification details */}
                {isSitter && booking.checkin_distance_m !== null && (
                  <div className="mt-3 bg-neo-bg border-3 border-neo-dark rounded-xl p-3 text-xs font-black text-neo-dark flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shadow-[2px_2px_0_0_#1E1E1E]">
                    <span className="flex items-center gap-1.5">📍 LOKASI CHECK-IN SITTER:</span>
                    <span className={`px-3 py-1 border-2 border-neo-dark rounded-full font-black text-xs uppercase shadow-[1px_1px_0_0_#1E1E1E] ${booking.checkin_verified ? "bg-[#DCFCE7] text-green-700" : "bg-[#FFE4E6] text-red-600"}`}>
                      {booking.checkin_verified ? `✅ Terverifikasi (${booking.checkin_distance_m}m)` : `❌ Di luar radius (${booking.checkin_distance_m}m)`}
                    </span>
                  </div>
                )}

                {/* Refund status details */}
                {booking.refund_status && (
                  <div className="mt-3 bg-[#FFF5F5] border-3 border-neo-dark border-dashed rounded-xl p-3 text-xs font-black text-red-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shadow-[2px_2px_0_0_#1E1E1E]">
                    <span className="flex items-center gap-1.5">⏳ STATUS REFUND MIDTRANS:</span>
                    <span className="bg-[#FFE4E6] border-2 border-neo-dark px-3 py-1 rounded-full text-xs font-black uppercase shadow-[1px_1px_0_0_#1E1E1E]">
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
                      className="bg-[#FFDE4D] text-neo-dark border-3 border-neo-dark rounded-xl px-4 py-2 font-black text-xs shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer flex items-center gap-1"
                    >
                      📍 Verifikasi Sitter Check-in (GPS)
                    </button>
                  </div>
                )}

                {/* Pay/Cancel Buttons for unpaid pending bookings */}
                {booking.status === 'pending' && booking.payment_status !== 'paid' && (
                  <div className="mt-4 pt-4 border-t-3 border-neo-dark flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#FFE4E6] border-3 border-neo-dark text-[#FF4A4A] px-3.5 py-1.5 rounded-full font-black text-xs uppercase shadow-[2px_2px_0_0_#1E1E1E] animate-pulse">
                        🔴 Belum Dibayar
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => triggerCancelBooking(booking.id, false)}
                        className="bg-[#FF7B7B] hover:bg-[#E53E3E] text-white border-3 border-neo-dark rounded-xl px-4 py-2 font-black text-xs shadow-[3px_3px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
                      >
                        ❌ Batal
                      </button>
                      {booking.midtrans_order_id && (
                        <button
                          onClick={async () => {
                            showToast('Memeriksa status pembayaran...', 'info');
                            try {
                              const res = await api.post(`/bookings/${booking.id}/verify-payment`);
                              if (res.data.booking?.payment_status === 'paid') {
                                showToast('Status terverifikasi: Lunas! 🎉', 'success');
                              } else {
                                showToast(`Status Midtrans: ${res.data.midtrans_status || 'Belum Lunas'}`, 'warning');
                              }
                              fetchBookings(currentPage);
                            } catch (err) {
                              console.error(err);
                              showToast('Gagal memverifikasi status pembayaran.', 'error');
                            }
                          }}
                          className="bg-[#FFDE4D] hover:bg-[#FCE100] text-neo-dark border-3 border-neo-dark rounded-xl px-4 py-2 font-black text-xs shadow-[3px_3px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center gap-1 cursor-pointer"
                        >
                          🔄 Cek Status
                        </button>
                      )}
                      <button
                        onClick={() => handlePayNow(booking)}
                        className="bg-[#22C55E] hover:bg-[#16A34A] text-white border-3 border-neo-dark rounded-xl px-4 py-2 font-black text-xs shadow-[3px_3px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        💳 Bayar Sekarang
                      </button>
                    </div>
                  </div>
                )}

                {/* Cancel button for PAID bookings (cancellable) */}
                {booking.payment_status === 'paid' && (booking.status === 'pending' || booking.status === 'approved') && (
                  <div className="mt-4 pt-4 border-t-3 border-neo-dark flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#DCFCE7] border-3 border-neo-dark text-[#16A34A] px-3.5 py-1.5 rounded-full font-black text-xs uppercase shadow-[2px_2px_0_0_#1E1E1E]">
                        🟢 Sudah Lunas (Paid)
                      </span>
                    </div>
                    <button
                      onClick={() => triggerCancelBooking(booking.id, true)}
                      className="bg-[#FF7B7B] hover:bg-[#E53E3E] text-white border-3 border-neo-dark rounded-xl px-4 py-2 font-black text-xs shadow-[3px_3px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
                    >
                      ❌ Batalkan Pesanan & Refund
                    </button>
                  </div>
                )}

                {/* Status indicator for finished bookings */}
                {booking.payment_status === 'paid' && !['pending', 'approved'].includes(booking.status) && (
                  <div className="mt-4 pt-4 border-t-3 border-neo-dark flex justify-between items-center">
                    <span className="bg-[#DCFCE7] border-3 border-neo-dark text-[#16A34A] px-3.5 py-1.5 rounded-full font-black text-xs uppercase shadow-[2px_2px_0_0_#1E1E1E]">
                      🟢 Sudah Lunas (Paid)
                    </span>
                    <span className="text-xs font-bold text-gray-400">
                      Transaksi Selesai & Terverifikasi
                    </span>
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
      {/* Neo-Brutalist Confirmation Modal */}
      {cancelConfirmation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#FFE353] border-4 border-neo-dark rounded-2xl p-6 shadow-[8px_8px_0_0_#1E1E1E] max-w-md w-full relative animate-scale-in text-neo-dark">
            <button 
              onClick={() => setCancelConfirmation(null)} 
              className="absolute right-4 top-4 bg-white border-2 border-neo-dark p-1 rounded-full hover:bg-[#FF7B7B] hover:text-white transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
            
            <div className="flex items-start gap-4 mt-2 mb-6">
              <div className="w-12 h-12 bg-[#FF7B7B] rounded-xl border-3 border-neo-dark flex items-center justify-center font-black text-2xl shrink-0 shadow-[2px_2px_0_0_#1E1E1E]">
                ⚠️
              </div>
              <div>
                <h3 className="text-xl font-black mb-1 leading-tight">Konfirmasi Pembatalan</h3>
                <p className="text-sm font-bold text-gray-700 leading-relaxed">
                  {cancelConfirmation.msg}
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-4">
              <button
                onClick={() => setCancelConfirmation(null)}
                className="bg-white border-3 border-neo-dark rounded-xl px-4 py-2 font-black text-xs shadow-[3px_3px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
              >
                Kembali
              </button>
              <button
                onClick={async () => {
                  const { id } = cancelConfirmation;
                  setCancelConfirmation(null);
                  await handleCancelBooking(id);
                }}
                className="bg-[#FF7B7B] hover:bg-[#E53E3E] text-white border-3 border-neo-dark rounded-xl px-4 py-2 font-black text-xs shadow-[3px_3px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
              >
                Batalkan Pesanan
              </button>
            </div>
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
