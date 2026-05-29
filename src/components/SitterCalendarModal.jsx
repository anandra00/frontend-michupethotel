import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User } from 'lucide-react';
import api from '../api/axios';

const SitterCalendarModal = ({ isOpen, onClose, sitter }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/sitters/${sitter.id}/schedule`);
      setSchedules(res.data);
    } catch (err) {
      console.error('Error fetching sitter schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && sitter) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchSchedule();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, sitter]);

  if (!isOpen || !sitter) return null;

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  // Convert Sunday=0 to Monday=1 (for Mon-Sun week)
  const startingDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  // Helper to get bookings for a specific date
  const getBookingsForDate = (day) => {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    targetDate.setHours(0, 0, 0, 0);

    return schedules.filter(booking => {
      const checkIn = new Date(booking.check_in);
      checkIn.setHours(0, 0, 0, 0);
      const checkOut = new Date(booking.check_out);
      checkOut.setHours(0, 0, 0, 0);
      return targetDate >= checkIn && targetDate <= checkOut;
    });
  };

  const getVisitTimeColor = (time) => {
    switch(time) {
      case 'morning': return 'bg-neo-yellow';
      case 'afternoon': return 'bg-[#FF9B50]';
      case 'both': return 'bg-[#B983FF]';
      default: return 'bg-gray-200';
    }
  };

  const translateVisitTime = (time) => {
    switch(time) {
      case 'morning': return 'Pagi';
      case 'afternoon': return 'Sore';
      case 'both': return 'Pagi & Sore';
      default: return 'Belum Diatur';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neo-dark/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto border-4 border-neo-dark rounded-xl shadow-[8px_8px_0_0_#1E1E1E] flex flex-col">
        {/* Header */}
        <div className="bg-neo-pink border-b-4 border-neo-dark p-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 border-2 border-neo-dark rounded-lg">
              <CalendarIcon size={24} className="text-neo-dark" />
            </div>
            <div>
              <h2 className="text-xl font-black text-neo-dark">Jadwal Sitter</h2>
              <p className="text-sm font-bold text-gray-800">{sitter.name} • {sitter.area}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-full transition-colors border-2 border-transparent hover:border-neo-dark"
          >
            <X size={24} className="text-neo-dark" />
          </button>
        </div>

        {/* Calendar Body */}
        <div className="p-6 flex-grow">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-black">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 bg-white border-2 border-neo-dark rounded-lg shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">
                <ChevronLeft size={20} />
              </button>
              <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 bg-neo-yellow font-black text-sm border-2 border-neo-dark rounded-lg shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">
                Bulan Ini
              </button>
              <button onClick={nextMonth} className="p-2 bg-white border-2 border-neo-dark rounded-lg shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-neo-dark"></div>
            </div>
          ) : (
            <div className="border-4 border-neo-dark rounded-xl overflow-hidden">
              <div className="grid grid-cols-7 bg-gray-100 border-b-4 border-neo-dark">
                {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(day => (
                  <div key={day} className="p-3 text-center font-black border-r-2 border-neo-dark last:border-r-0 text-sm md:text-base">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 bg-white auto-rows-[120px]">
                {/* Empty blocks before start of month */}
                {Array.from({ length: startingDay }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="border-r-2 border-b-2 border-neo-dark bg-gray-50/50"></div>
                ))}

                {/* Days of month */}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const day = idx + 1;
                  const dayBookings = getBookingsForDate(day);
                  const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

                  return (
                    <div key={day} className={`p-2 border-r-2 border-b-2 border-neo-dark last:border-r-0 relative overflow-y-auto custom-scrollbar ${isToday ? 'bg-blue-50' : ''}`}>
                      <div className={`font-black text-sm mb-2 w-8 h-8 flex items-center justify-center rounded-full ${isToday ? 'bg-neo-blue border-2 border-neo-dark' : ''}`}>
                        {day}
                      </div>
                      
                      <div className="flex flex-col gap-1.5">
                        {dayBookings.map(b => (
                          <div 
                            key={b.id} 
                            className={`${getVisitTimeColor(b.visit_time)} border-2 border-neo-dark rounded-md p-1.5 shadow-[1px_1px_0_0_#1E1E1E] text-xs`}
                          >
                            <div className="font-bold flex items-center gap-1 truncate">
                              <User size={12} className="shrink-0" />
                              <span className="truncate">{b.user?.name || 'Pelanggan'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-bold opacity-80 mt-0.5">
                              <Clock size={10} className="shrink-0" />
                              {translateVisitTime(b.visit_time)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Fill remaining cells to complete the grid */}
                {Array.from({ length: (7 - ((startingDay + daysInMonth) % 7)) % 7 }).map((_, idx) => (
                  <div key={`fill-${idx}`} className="border-r-2 border-b-2 border-neo-dark bg-gray-50/50"></div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-4 text-xs font-bold bg-gray-50 p-4 border-4 border-neo-dark rounded-xl">
            <span className="flex items-center gap-2"><div className="w-4 h-4 bg-neo-yellow border-2 border-neo-dark rounded"></div> Pagi</span>
            <span className="flex items-center gap-2"><div className="w-4 h-4 bg-[#FF9B50] border-2 border-neo-dark rounded"></div> Sore</span>
            <span className="flex items-center gap-2"><div className="w-4 h-4 bg-[#B983FF] border-2 border-neo-dark rounded"></div> Pagi & Sore</span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SitterCalendarModal;
