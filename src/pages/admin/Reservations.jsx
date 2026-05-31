import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../api/axios';
import { Star, MapPin, Trash2, X, FileText, Camera, AlertTriangle, MessageCircle } from 'lucide-react';
import { useToast } from '../../components/Toast';
import ChatDrawer from '../../components/ChatDrawer';
import AvailabilityCalendar from '../../components/AvailabilityCalendar';

const STATUS_MAP = {
  pending: { label: 'Pending', bg: 'bg-neo-yellow' },
  approved: { label: 'Confirmed', bg: 'bg-[#4ADE80]' },
  rejected: { label: 'Rejected', bg: 'bg-red-400 text-white' },
  checked_in: { label: 'Checked In', bg: 'bg-[#60A5FA] text-white' },
  checked_out: { label: 'Completed', bg: 'bg-[#B983FF] text-white' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-500 text-white' },
};

const Reservations = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [deleteId, setDeleteId] = useState(null);
  const [reassignModal, setReassignModal] = useState(null);
  const [checkoutConfirmModal, setCheckoutConfirmModal] = useState(null);
  const [sitters, setSitters] = useState([]);
  const [selectedNewSitter, setSelectedNewSitter] = useState('');
  const [selectedChatBooking, setSelectedChatBooking] = useState(null);
  
  // Daily Report State
  const [reportModal, setReportModal] = useState(null); // stores the booking
  const [userCats, setUserCats] = useState([]);
  const [reportForm, setReportForm] = useState({ cat_id: '', title: '', description: '', badge: '', badge_bg: 'bg-[#4ADE80]', time: '', photo: null });
  const [submittingReport, setSubmittingReport] = useState(false);

  const { showToast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const fetchBookings = async (page = 1) => {
    try {
      const statusParam = filter !== 'all' ? `status=${filter}` : '';
      const pageParam = `page=${page}`;
      const query = [statusParam, pageParam].filter(Boolean).join('&');
      const res = await api.get(`/bookings?${query}`);
      if (Array.isArray(res.data)) {
        setBookings(res.data);
        setCurrentPage(1);
        setLastPage(1);
      } else {
        setBookings(res.data.data || []);
        setCurrentPage(res.data.current_page || 1);
        setLastPage(res.data.last_page || 1);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

   
   
  useEffect(() => {
    fetchBookings(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    const fetchSitters = async () => {
      try {
        const res = await api.get('/sitters');
        setSitters(res.data);
      } catch (error) {
        console.error('Error fetching sitters:', error);
      }
    };
    fetchSitters();
  }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      await api.put(`/bookings/${id}`, { status: newStatus });
      showToast(`Status berhasil diubah ke ${STATUS_MAP[newStatus]?.label || newStatus}`, 'success');
      fetchBookings(currentPage);
    } catch (error) {
      console.error('Failed to update status:', error);
      showToast('Gagal mengubah status.', 'error');
    }
  };

  const handleCheckOut = (booking) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkoutDate = new Date(booking.check_out);
    checkoutDate.setHours(0, 0, 0, 0);
    
    if (today < checkoutDate) {
      setCheckoutConfirmModal({
        booking,
        early: true,
        message: `Tanggal check-out seharusnya adalah ${new Date(booking.check_out).toLocaleDateString('id-ID')}.\n\nBooking masih belum selesai. Anda yakin ingin menyelesaikan (Check Out) lebih awal?`
      });
    } else {
      setCheckoutConfirmModal({
        booking,
        early: false,
        message: 'Selesaikan booking ini? Pastikan semua laporan harian sudah dikirim.'
      });
    }
  };

  const confirmCheckOut = () => {
    if (checkoutConfirmModal) {
      updateStatus(checkoutConfirmModal.booking.id, 'checked_out');
      setCheckoutConfirmModal(null);
    }
  };

  const deleteBooking = async (id) => {
    try {
      await api.delete(`/bookings/${id}`);
      setDeleteId(null);
      showToast('Reservasi berhasil dihapus.', 'success');
      fetchBookings(currentPage);
    } catch (error) {
      console.error('Failed to delete:', error);
      showToast('Gagal menghapus reservasi.', 'error');
      setDeleteId(null);
    }
  };

  const handleReassign = async () => {
    if (!reassignModal || !selectedNewSitter) return;
    try {
      const newSitter = sitters.find(s => s.id === Number(selectedNewSitter));
      const appendNote = `[Admin]: Sitter Anda telah diganti menjadi ${newSitter?.name} karena sitter sebelumnya berhalangan.`;
      const finalNotes = reassignModal.notes ? `${reassignModal.notes}\n\n${appendNote}` : appendNote;

      await api.put(`/bookings/${reassignModal.id}`, { 
        sitter_id: selectedNewSitter,
        notes: finalNotes 
      });
      showToast(`Sitter berhasil diganti ke ${newSitter?.name}`, 'success');
      setReassignModal(null);
      setSelectedNewSitter('');
      fetchBookings(currentPage);
    } catch (error) {
      console.error('Failed to reassign:', error);
      showToast('Gagal mengganti sitter.', 'error');
    }
  };

  const openReportModal = async (booking) => {
    setReportModal(booking);
    setReportForm({ cat_id: '', title: '', description: '', badge: '', badge_bg: 'bg-[#4ADE80]', time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB', photo: null });
    
    try {
      const res = await api.get(`/admin/cats?user_id=${booking.user_id}`);
      setUserCats(res.data);
      if (res.data.length > 0) {
        setReportForm(prev => ({ ...prev, cat_id: res.data[0].id }));
      }
    } catch (error) {
      console.error('Failed to fetch cats:', error);
    }
  };

  const submitReport = async (e) => {
    e.preventDefault();
    if (!reportForm.cat_id || !reportForm.title || !reportForm.description) {
      showToast('Mohon isi semua field wajib.', 'warning');
      return;
    }
    
    setSubmittingReport(true);
    try {
      const formData = new FormData();
      formData.append('booking_id', reportModal.id);
      formData.append('cat_id', reportForm.cat_id);
      formData.append('title', reportForm.title);
      formData.append('description', reportForm.description);
      formData.append('time', reportForm.time);
      if (reportForm.badge) formData.append('badge', reportForm.badge);
      if (reportForm.badge_bg) formData.append('badge_bg', reportForm.badge_bg);
      if (reportForm.photo) formData.append('photo', reportForm.photo);

      await api.post('/admin/daily-reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      showToast('Laporan Harian berhasil ditambahkan! 🐾', 'success');
      setReportModal(null);
    } catch (error) {
      console.error('Failed to submit report:', error);
      showToast('Gagal mengirim laporan.', 'error');
    } finally {
      setSubmittingReport(false);
    }
  };

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Confirmed' },
    { key: 'checked_in', label: 'Active' },
    { key: 'checked_out', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  const formatDate = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black mb-2 uppercase">Reservations</h1>
          <p className="text-gray-600 font-medium text-sm md:text-base">Manage all customer bookings and boarding schedules.</p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 md:gap-3 mb-8 overflow-x-auto pb-2">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 md:px-6 py-2 rounded-full border-4 border-neo-dark font-black text-sm whitespace-nowrap transition-all ${
              filter === f.key 
                ? 'bg-neo-yellow shadow-[2px_2px_0_0_#1E1E1E]' 
                : 'bg-white hover:bg-gray-50'
            }`}
          >
            {f.label}
            {filter === f.key && ` (${bookings.length})`}
          </button>
        ))}
      </div>

      {/* Bookings Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white border-4 border-neo-dark rounded-xl p-4 md:p-6 shadow-[4px_4px_0_0_#1E1E1E]">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 neo-skeleton rounded-full border-4 border-neo-dark"></div>
                  <div>
                    <div className="w-24 h-5 bg-gray-200 neo-skeleton mb-2"></div>
                    <div className="w-32 h-4 bg-gray-200 neo-skeleton"></div>
                  </div>
                </div>
                <div className="w-20 h-6 bg-gray-200 neo-skeleton rounded-full"></div>
              </div>
              <div className="space-y-3 mb-4">
                <div className="w-full h-4 bg-gray-200 neo-skeleton"></div>
                <div className="w-3/4 h-4 bg-gray-200 neo-skeleton"></div>
              </div>
              <div className="flex gap-2">
                <div className="w-24 h-10 bg-gray-200 neo-skeleton rounded-lg"></div>
                <div className="w-24 h-10 bg-gray-200 neo-skeleton rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white border-4 border-dashed border-gray-400 rounded-xl p-12 text-center">
          <p className="font-bold text-xl text-gray-500">Tidak ada reservasi dengan filter ini.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          {bookings.map(booking => {
            let st = STATUS_MAP[booking.status] || { label: booking.status, bg: 'bg-gray-300' };
            
            // If the booking is still pending (not approved by Admin yet) but the payment is paid
            if (booking.status === 'pending' && booking.payment_status === 'paid') {
              st = { label: 'Menunggu Konfirmasi', bg: 'bg-[#4ADE80]' }; // green to indicate paid but pending
            }

            const isSitter = booking.booking_type === 'sitter';
            return (
              <div key={booking.id} className="bg-white border-4 border-neo-dark rounded-xl p-4 md:p-6 shadow-[4px_4px_0_0_#1E1E1E]">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3 md:gap-4 min-w-0">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-neo-orange rounded-full border-4 border-neo-dark flex items-center justify-center overflow-hidden shrink-0">
                      <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${booking.user?.name}`} alt="" className="w-full h-full" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-black text-lg md:text-xl truncate">{booking.user?.name || 'Unknown'}</h3>
                      <p className="font-bold text-gray-500 text-xs md:text-sm truncate">{booking.user?.email}</p>
                    </div>
                  </div>
                  <span className={`px-3 md:px-4 py-1 rounded-full border-2 border-neo-dark font-black text-xs shrink-0 ${st.bg}`}>
                    {st.label}
                  </span>
                </div>

                {/* Type badge */}
                <div className="mb-3">
                  <span className={`inline-block px-3 py-0.5 rounded-full border-2 border-neo-dark text-xs font-black ${isSitter ? 'bg-[#B983FF] text-white' : 'bg-[#60A5FA] text-white'}`}>
                    {isSitter ? '🏠 Cat Sitter' : '🏨 Cat Boarding'}
                  </span>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-3 md:gap-4 border-y-4 border-neo-dark py-3 md:py-4 mb-3 md:mb-4">
                  <div>
                    <p className="text-xs font-black uppercase text-gray-500 mb-1">{isSitter ? 'Paket' : 'Room'}</p>
                    <p className="font-bold text-sm">{isSitter ? booking.sitter_package : booking.room?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase text-gray-500 mb-1">Dates</p>
                    <p className="font-bold text-sm">{formatDate(booking.check_in)} - {formatDate(booking.check_out)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase text-gray-500 mb-1">Kucing</p>
                    <p className="font-bold text-xs truncate">
                      {booking.cats && booking.cats.length > 0 
                        ? booking.cats.map(c => c.name).join(', ') 
                        : `${booking.total_cats} ekor`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase text-gray-500 mb-1">Total Price</p>
                    <p className="font-black text-base md:text-lg">Rp {Number(booking.total_price).toLocaleString('id-ID')}</p>
                  </div>
                </div>

                {/* Sitter Info */}
                {isSitter && booking.sitter && (
                  <div className="bg-[#F3E8FF] border-2 border-neo-dark rounded-lg p-3 flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-[#B983FF] rounded-full border-2 border-neo-dark overflow-hidden shrink-0">
                        <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${booking.sitter.name}`} alt="" className="w-full h-full" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-sm truncate">Sitter: {booking.sitter.name}</p>
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                          <span className="flex items-center gap-0.5"><Star size={10} className="text-yellow-500 fill-yellow-500" /> {booking.sitter.avg_rating || booking.sitter.rating}</span>
                          <span className="flex items-center gap-0.5"><MapPin size={10} /> {booking.sitter.area}</span>
                        </div>
                      </div>
                    </div>
                    {booking.status === 'pending' && (
                      <button 
                        onClick={() => setReassignModal(booking)}
                        className="shrink-0 bg-white border-2 border-neo-dark rounded-lg px-2 py-1 text-xs font-black hover:bg-[#B983FF] hover:text-white transition-colors"
                      >
                        Ganti
                      </button>
                    )}
                  </div>
                )}

                {/* User Address */}
                {booking.user?.address && (
                  <div className="bg-blue-50 border-2 border-dashed border-blue-200 rounded-lg p-2 mb-3">
                    <p className="text-xs font-black uppercase text-gray-500 mb-0.5">📍 Alamat</p>
                    <p className="font-bold text-xs text-gray-600">{booking.user.address}</p>
                  </div>
                )}

                {booking.notes && (
                  <div className="bg-neo-bg border-2 border-dashed border-gray-300 rounded-lg p-2 md:p-3 mb-3 md:mb-4">
                    <p className="text-xs font-black uppercase text-gray-500 mb-1">Notes</p>
                    <p className="font-bold text-xs md:text-sm">{booking.notes}</p>
                  </div>
                )}

                {/* Coupon Information */}
                {booking.coupon && (
                  <div className="bg-yellow-50 border-2 border-dashed border-yellow-300 rounded-lg p-2.5 mb-3 text-xs font-bold text-gray-700 flex justify-between items-center animate-scale-in">
                    <span>🎟️ Kupon Promo:</span>
                    <span className="font-black uppercase text-neo-dark">{booking.coupon.code} (-Rp {Number(booking.discount_amount).toLocaleString('id-ID')})</span>
                  </div>
                )}

                {/* GPS Check-in details */}
                {isSitter && booking.checkin_distance_m !== null && (
                  <div className="bg-neo-bg border-2 border-neo-dark rounded-lg p-2.5 mb-3 text-xs font-bold text-neo-dark flex justify-between items-center">
                    <span>📍 GPS Check-in Sitter:</span>
                    <span className={booking.checkin_verified ? "text-green-700 font-black uppercase text-[10px]" : "text-red-600 font-black uppercase text-[10px]"}>
                      {booking.checkin_verified ? `✅ Terverifikasi (${booking.checkin_distance_m}m)` : `❌ Di luar radius (${booking.checkin_distance_m}m)`}
                    </span>
                  </div>
                )}

                {/* Refund Status Details */}
                {booking.refund_status && (
                  <div className="bg-red-50 border-2 border-dashed border-red-300 rounded-lg p-2.5 mb-3 text-xs font-bold text-red-700 flex justify-between items-center">
                    <span>💵 Status Refund:</span>
                    <span className="font-black uppercase text-red-700">
                      {booking.refund_status === 'pending' && '⏳ Diproses (Pending)'}
                      {booking.refund_status === 'processed' && '✅ Sukses (Refunded)'}
                      {booking.refund_status === 'failed' && '❌ Gagal'}
                      {booking.refund_amount > 0 && ` (Rp ${Number(booking.refund_amount).toLocaleString('id-ID')})`}
                    </span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 md:gap-3 flex-wrap">
                  {booking.status === 'pending' && (
                    <>
                      <button onClick={() => updateStatus(booking.id, 'approved')} className="flex-1 bg-[#4ADE80] border-4 border-neo-dark rounded-full py-2 font-black text-sm shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                        Approve
                      </button>
                      <button onClick={() => updateStatus(booking.id, 'rejected')} className="flex-1 bg-red-400 text-white border-4 border-neo-dark rounded-full py-2 font-black text-sm shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                        Reject
                      </button>
                    </>
                  )}
                  {booking.status === 'approved' && (
                    <button onClick={() => updateStatus(booking.id, 'checked_in')} className="flex-1 bg-[#60A5FA] text-white border-4 border-neo-dark rounded-full py-2 font-black text-sm shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                      Check In
                    </button>
                  )}
                  {(booking.status === 'pending' || booking.status === 'approved') && (
                    <button onClick={() => {
                      if (window.confirm('Batalkan pesanan ini? Jika pesanan sudah dibayar, pembatalan akan memicu refund otomatis (jika memenuhi syarat H-2).')) {
                        updateStatus(booking.id, 'cancelled');
                      }
                    }} className="flex-1 bg-red-500 text-white border-4 border-neo-dark rounded-full py-2 font-black text-sm shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                      Cancel
                    </button>
                  )}
                  {booking.status === 'checked_in' && (
                    <>
                      <button onClick={() => handleCheckOut(booking)} className="flex-1 bg-[#B983FF] text-white border-4 border-neo-dark rounded-full py-2 font-black text-sm shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                        Check Out / Selesai
                      </button>
                      <button onClick={() => openReportModal(booking)} className="flex-1 bg-[#FF9B50] text-white border-4 border-neo-dark rounded-full py-2 font-black text-sm shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-1">
                        <FileText size={16} /> Laporan
                      </button>
                    </>
                  )}
                  {booking.status === 'checked_out' && (
                    <button onClick={() => openReportModal(booking)} className="w-full bg-[#FF9B50] text-white border-4 border-neo-dark rounded-full py-2 font-black text-sm shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-1">
                      <FileText size={16} /> Buat Laporan Harian
                    </button>
                  )}
                  <button 
                    onClick={() => setSelectedChatBooking(booking)}
                    className="bg-[#A2D2FF] border-4 border-neo-dark rounded-full px-4 py-2 font-black hover:bg-[#60A5FA] transition-all shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none flex items-center justify-center cursor-pointer"
                    title="Tanya Kabar / Chat"
                  >
                    <MessageCircle size={16} />
                  </button>
                  <button onClick={() => setDeleteId(booking.id)} className="bg-white border-4 border-neo-dark rounded-full px-4 py-2 font-black hover:bg-red-100 transition-colors">
                    🗑
                  </button>
                </div>
              </div>
            );
          })}

          {/* Pagination Controls */}
          {lastPage > 1 && (
            <div className="col-span-full flex justify-center items-center gap-4 mt-8 bg-white border-4 border-neo-dark p-4 rounded-xl shadow-[4px_4px_0_0_#1E1E1E]">
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

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border-4 border-neo-dark rounded-xl p-6 shadow-[8px_8px_0_0_#1E1E1E] max-w-sm w-full text-center animate-scale-in">
            <div className="w-16 h-16 bg-red-100 border-4 border-neo-dark rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={28} className="text-red-500" />
            </div>
            <h3 className="text-xl font-black mb-2">Hapus Reservasi?</h3>
            <p className="text-sm font-bold text-gray-500 mb-6">Data reservasi akan dihapus permanen.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 bg-gray-200 border-4 border-neo-dark rounded-lg py-2.5 font-black shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">
                Batal
              </button>
              <button onClick={() => deleteBooking(deleteId)} className="flex-1 bg-red-400 text-white border-4 border-neo-dark rounded-lg py-2.5 font-black shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Confirmation Modal */}
      {checkoutConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border-4 border-neo-dark rounded-xl p-6 shadow-[8px_8px_0_0_#1E1E1E] max-w-sm w-full text-center animate-scale-in">
            <div className={`w-16 h-16 ${checkoutConfirmModal.early ? 'bg-neo-yellow' : 'bg-[#4ADE80]'} border-4 border-neo-dark rounded-full flex items-center justify-center mx-auto mb-4`}>
              {checkoutConfirmModal.early ? <AlertTriangle size={28} className="text-neo-dark" /> : <FileText size={28} className="text-neo-dark" />}
            </div>
            <h3 className="text-xl font-black mb-2">{checkoutConfirmModal.early ? 'Check Out Awal?' : 'Selesaikan Booking?'}</h3>
            <p className="text-sm font-bold text-gray-600 mb-6 whitespace-pre-wrap">{checkoutConfirmModal.message}</p>
            <div className="flex gap-3">
              <button onClick={() => setCheckoutConfirmModal(null)} className="flex-1 bg-gray-200 border-4 border-neo-dark rounded-lg py-2.5 font-black shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">
                Batal
              </button>
              <button onClick={confirmCheckOut} className={`flex-1 ${checkoutConfirmModal.early ? 'bg-neo-yellow' : 'bg-[#B983FF] text-white'} border-4 border-neo-dark rounded-lg py-2.5 font-black shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all`}>
                Ya, Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Sitter Modal */}
      {reassignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neo-yellow border-4 border-neo-dark rounded-xl p-6 shadow-[8px_8px_0_0_#1E1E1E] max-w-md w-full relative animate-scale-in">
            <button onClick={() => setReassignModal(null)} className="absolute right-3 top-3 bg-white border-2 border-neo-dark p-1 rounded-full hover:bg-red-400 hover:text-white transition-colors">
              <X size={18} />
            </button>
            <h3 className="text-xl font-black mb-2">Ganti Cat Sitter</h3>
            <p className="text-sm font-bold text-gray-600 mb-4">Sitter sebelumnya: {reassignModal.sitter?.name}</p>
            
            <div className="mb-6">
              <label className="block text-sm font-black mb-2 uppercase">Pilih Sitter Pengganti</label>
              <select 
                value={selectedNewSitter} 
                onChange={(e) => setSelectedNewSitter(e.target.value)}
                className="w-full bg-white border-4 border-neo-dark rounded-lg p-3 font-bold focus:outline-none focus:ring-4 focus:ring-neo-pink"
              >
                <option value="">-- Pilih Sitter --</option>
                {sitters.filter(s => s.id !== reassignModal.sitter_id).map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.area})</option>
                ))}
              </select>
            </div>

            {selectedNewSitter && (
              <div className="mb-6 border-4 border-neo-dark rounded-xl p-4 bg-white shadow-[2px_2px_0_0_#1E1E1E]">
                <p className="font-black text-xs uppercase mb-2 flex items-center gap-1.5 text-neo-dark">
                  📅 Kalender Ketersediaan Sitter Baru
                </p>
                <AvailabilityCalendar 
                  sitterId={selectedNewSitter}
                  checkIn={reassignModal.check_in}
                  checkOut={reassignModal.check_out}
                  type="sitter"
                />
              </div>
            )}

            <button 
              onClick={handleReassign}
              disabled={!selectedNewSitter}
              className="w-full bg-[#B983FF] text-white border-4 border-neo-dark rounded-lg py-3 font-black text-lg shadow-[4px_4px_0_0_#1E1E1E] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50"
            >
              Simpan Perubahan
            </button>
          </div>
        </div>
      )}

      {/* Daily Report Modal */}
      {reportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border-4 border-neo-dark rounded-xl p-6 shadow-[8px_8px_0_0_#1E1E1E] max-w-lg w-full relative max-h-[90vh] overflow-y-auto animate-scale-in">
            <button onClick={() => setReportModal(null)} className="absolute right-3 top-3 bg-white border-2 border-neo-dark p-1 rounded-full hover:bg-red-400 hover:text-white transition-colors">
              <X size={18} />
            </button>
            <h3 className="text-2xl font-black mb-1 flex items-center gap-2"><FileText size={24} /> Buat Laporan Harian</h3>
            <p className="text-sm font-bold text-gray-500 mb-6">Booking oleh: {reportModal.user?.name}</p>

            <form onSubmit={submitReport} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase mb-1">Pilih Kucing</label>
                <select 
                  value={reportForm.cat_id}
                  onChange={e => setReportForm({...reportForm, cat_id: e.target.value})}
                  className="w-full bg-gray-50 border-4 border-neo-dark rounded-lg p-2 font-bold"
                  required
                >
                  {userCats.length === 0 && <option value="">Tidak ada kucing terdaftar</option>}
                  {userCats.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name} ({cat.breed})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Waktu</label>
                  <input 
                    type="text" 
                    value={reportForm.time}
                    onChange={e => setReportForm({...reportForm, time: e.target.value})}
                    className="w-full bg-gray-50 border-4 border-neo-dark rounded-lg p-2 font-bold" 
                    placeholder="12:30 PM"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Judul Aktivitas</label>
                  <input 
                    type="text" 
                    value={reportForm.title}
                    onChange={e => setReportForm({...reportForm, title: e.target.value})}
                    className="w-full bg-gray-50 border-4 border-neo-dark rounded-lg p-2 font-bold" 
                    placeholder="Makan Siang / Pup"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Deskripsi Detail</label>
                <textarea 
                  rows="3"
                  value={reportForm.description}
                  onChange={e => setReportForm({...reportForm, description: e.target.value})}
                  className="w-full bg-gray-50 border-4 border-neo-dark rounded-lg p-2 font-bold"
                  placeholder="Kucing menghabiskan makanannya dengan lahap..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Teks Badge (Opsional)</label>
                  <input 
                    type="text" 
                    value={reportForm.badge}
                    onChange={e => setReportForm({...reportForm, badge: e.target.value})}
                    className="w-full bg-gray-50 border-4 border-neo-dark rounded-lg p-2 font-bold" 
                    placeholder="Lahap / Normal"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Warna Badge</label>
                  <select 
                    value={reportForm.badge_bg}
                    onChange={e => setReportForm({...reportForm, badge_bg: e.target.value})}
                    className="w-full bg-gray-50 border-4 border-neo-dark rounded-lg p-2 font-bold"
                  >
                    <option value="bg-[#4ADE80]">Hijau (Aman)</option>
                    <option value="bg-neo-yellow">Kuning (Netral)</option>
                    <option value="bg-[#B983FF]">Ungu (Bagus)</option>
                    <option value="bg-neo-pink">Pink (Lucu)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1 flex items-center gap-1"><Camera size={14} /> Upload Foto (Opsional)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => setReportForm({...reportForm, photo: e.target.files[0]})}
                  className="w-full bg-white border-4 border-dashed border-gray-400 rounded-lg p-2 font-bold file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-2 file:border-neo-dark file:bg-neo-yellow file:font-black file:text-xs"
                />
              </div>

              <button 
                type="submit"
                disabled={submittingReport || userCats.length === 0}
                className="w-full mt-4 bg-[#4ADE80] border-4 border-neo-dark rounded-lg py-3 font-black text-lg shadow-[4px_4px_0_0_#1E1E1E] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50"
              >
                {submittingReport ? <><span className="neo-spinner mr-2"></span>Menyimpan...</> : 'Kirim Laporan'}
              </button>
            </form>
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

export default Reservations;
