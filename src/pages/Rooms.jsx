import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { useToast } from '../components/Toast';
import { loadSnapScript } from '../utils/snap';
import RoomCard from './Rooms/RoomCard';
import BookingModal from './Rooms/BookingModal';

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showBooking, setShowBooking] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [bookingForm, setBookingForm] = useState({
    check_in: '',
    check_out: '',
    total_cats: 1,
    notes: ''
  });

  useEffect(() => {
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
    fetchRooms();
  }, []);

  const handleBookClick = (room) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSelectedRoom(room);
    setBookingForm({ check_in: '', check_out: '', total_cats: 1, notes: '' });
    setShowBooking(true);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (calcNights() <= 0) {
      showToast('Check-out harus setelah check-in.', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await api.post('/bookings', {
        booking_type: 'board',
        room_id: selectedRoom.id,
        check_in: bookingForm.check_in,
        check_out: bookingForm.check_out,
        total_cats: Number(bookingForm.total_cats),
        notes: bookingForm.notes || null,
      });

      setShowBooking(false);

      if (res.data.snap_token) {
        const snap = await loadSnapScript();
        if (!snap) {
          showToast('Gagal memuat modul pembayaran. Silakan coba lagi dari menu Riwayat.', 'error');
          navigate('/dashboard/history');
          return;
        }
        snap.pay(res.data.snap_token, {
          onSuccess: async function () {
            // Payment status will be updated by Midtrans webhook callback (server-to-server)
            showToast('Pembayaran berhasil! 🎉', 'success');
            navigate('/dashboard/history');
          },
          onPending: function () {
            showToast('Menunggu pembayaran Anda.', 'success');
            navigate('/dashboard/history');
          },
          onError: function () {
            showToast('Pembayaran gagal atau dibatalkan. Anda dapat membayar dari halaman Riwayat.', 'error');
            navigate('/dashboard/history');
          },
          onClose: function () {
            showToast('Anda menutup popup pembayaran. Anda dapat membayar nanti dari halaman Riwayat.', 'warning');
            navigate('/dashboard/history');
          }
        });
      } else {
        showToast(`Booking "${selectedRoom.name}" berhasil! 🎉`, 'success');
        navigate('/dashboard/history');
      }

    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        showToast(err.response.data.message, 'error');
      } else {
        showToast('Gagal booking. Coba lagi.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const calcNights = () => {
    if (!bookingForm.check_in || !bookingForm.check_out) return 0;
    const d1 = new Date(bookingForm.check_in);
    const d2 = new Date(bookingForm.check_out);
    const diff = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const nights = calcNights();
  const totalPrice = nights * (selectedRoom?.price_per_night || 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
      <div className="text-center mb-8 md:mb-16">
        <h1 className="text-3xl md:text-5xl font-black mb-2 md:mb-4">Our Rooms 🏠</h1>
        <p className="text-base md:text-xl font-medium text-gray-700">Choose the perfect stay for your furry friend</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white border-4 border-neo-dark rounded-xl p-6 shadow-[4px_4px_0_0_#1E1E1E] flex flex-col h-[350px]">
               <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-gray-200 neo-skeleton rounded-full border-4 border-neo-dark"></div>
                  <div className="w-20 h-6 bg-gray-200 neo-skeleton rounded-full border-2 border-neo-dark"></div>
               </div>
               <div className="w-3/4 h-8 bg-gray-200 neo-skeleton mb-2"></div>
               <div className="w-1/2 h-4 bg-gray-200 neo-skeleton mb-4"></div>
               <div className="w-full h-12 bg-gray-200 neo-skeleton mb-4"></div>
               <div className="mt-auto flex justify-between items-center">
                  <div className="w-1/3 h-6 bg-gray-200 neo-skeleton"></div>
                  <div className="w-24 h-10 bg-gray-200 neo-skeleton rounded-full border-4 border-neo-dark"></div>
               </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} onBookClick={handleBookClick} />
          ))}
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal 
        isOpen={showBooking}
        onClose={() => setShowBooking(false)}
        selectedRoom={selectedRoom}
        bookingForm={bookingForm}
        setBookingForm={setBookingForm}
        onSubmit={handleBookingSubmit}
        saving={saving}
        nights={nights}
        totalPrice={totalPrice}
      />
    </div>
  );
};

export default Rooms;
