import { useState, useEffect } from 'react';
import api from '../api/axios';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAYS_OF_WEEK = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

const isDateOccupied = (date, occupiedRanges, type, currentVisitTime) => {
  if (!date) return false;
  const dStr = date.toISOString().split('T')[0];
  
  return occupiedRanges.some(range => {
    const start = range.check_in;
    const end = range.check_out;
    
    if (type === 'board') {
      // Boarding occupies from check_in day up to the day before check_out
      return dStr >= start && dStr < end;
    } else {
      // Sitter occupies all days in range inclusive, but check shift
      if (dStr >= start && dStr <= end) {
        if (!currentVisitTime || currentVisitTime === 'both') return true;
        if (range.visit_time === 'both') return true;
        if (range.visit_time === currentVisitTime) return true;
      }
      return false;
    }
  });
};

const isDateBetween = (date, startStr, endStr) => {
  if (!date || !startStr || !endStr) return false;
  const dStr = date.toISOString().split('T')[0];
  return dStr >= startStr && dStr <= endStr;
};

const AvailabilityCalendar = ({ roomId, sitterId, checkIn, checkOut, onChange, type, visitTime }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [occupiedRanges, setOccupiedRanges] = useState([]);
  const [loading, setLoading] = useState(false);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  useEffect(() => {
    const fetchOccupiedDates = async () => {
      if (!roomId && !sitterId) return;
      setLoading(true);
      try {
        const params = {};
        if (roomId) params.room_id = roomId;
        if (sitterId) params.sitter_id = sitterId;

        const res = await api.get('/bookings/occupied-dates', { params });
        setOccupiedRanges(res.data || []);
      } catch (err) {
        console.error('Failed to fetch occupied dates:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOccupiedDates();
  }, [roomId, sitterId]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Generate calendar days grid
  const days = [];
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  let startDayOfWeek = firstDayOfMonth.getDay() - 1; // Align to Mon = 0
  if (startDayOfWeek === -1) startDayOfWeek = 6; // Sun = 6

  // Pad previous month empty days
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }

  // Get total days in month
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
  for (let d = 1; d <= totalDays; d++) {
    days.push(new Date(currentYear, currentMonth, d));
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleDateClick = (date) => {
    if (!date) return;
    const dateStr = date.toISOString().split('T')[0];
    
    // 1. Cannot pick past dates
    if (date < today) return;
    
    // 2. Cannot pick occupied dates
    if (isDateOccupied(date, occupiedRanges, type, visitTime)) return;

    if (!checkIn || (checkIn && checkOut)) {
      // First click: set checkIn
      onChange(dateStr, null);
    } else {
      // Second click: set checkOut
      if (dateStr === checkIn) {
        // Double click same date: cancel selection
        onChange(null, null);
      } else if (dateStr < checkIn) {
        // Clicked date is earlier: swap to checkIn
        onChange(dateStr, null);
      } else {
        // Check if there are any occupied dates between checkIn and clicked date
        let hasConflict = false;
        let temp = new Date(checkIn);
        const target = new Date(dateStr);
        while (temp <= target) {
          if (isDateOccupied(temp, occupiedRanges, type, visitTime)) {
            hasConflict = true;
            break;
          }
          temp.setDate(temp.getDate() + 1);
        }

        if (hasConflict) {
          alert('Ups, terdapat tanggal yang sudah ter-booking di antara rentang pilihan Anda!');
        } else {
          onChange(checkIn, dateStr);
        }
      }
    }
  };

  return (
    <div className="font-fredoka select-none mt-2">
      {/* Header */}
      <div className="flex justify-between items-center bg-[#FFE353] border-3 border-neo-dark rounded-lg p-2.5 mb-3 shadow-[2px_2px_0_0_#1E1E1E]">
        <button 
          type="button" 
          onClick={handlePrevMonth}
          className="p-1 hover:bg-white/40 rounded border-2 border-transparent hover:border-neo-dark transition-all cursor-pointer"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="font-black text-sm uppercase tracking-tight">
          {MONTH_NAMES[currentMonth]} {currentYear}
        </span>
        <button 
          type="button" 
          onClick={handleNextMonth}
          className="p-1 hover:bg-white/40 rounded border-2 border-transparent hover:border-neo-dark transition-all cursor-pointer"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 gap-1 text-center font-black text-[10px] text-gray-500 mb-1.5 uppercase">
        {DAYS_OF_WEEK.map(d => <div key={d}>{d}</div>)}
      </div>

      {/* Days Grid */}
      {loading ? (
        <div className="h-44 flex items-center justify-center border-3 border-neo-dark border-dashed rounded-lg bg-neo-bg neo-skeleton">
          <span className="text-xs font-bold text-gray-400">Loading ketersediaan...</span>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, idx) => {
            if (!date) return <div key={`empty-${idx}`} className="h-7" />;

            const dateStr = date.toISOString().split('T')[0];
            const isPast = date < today;
            const isOccupied = isDateOccupied(date, occupiedRanges, type, visitTime);
            const isToday = date.getTime() === today.getTime();
            
            const isSelectedCheckin = checkIn === dateStr;
            const isSelectedCheckout = checkOut === dateStr;
            const isInRange = isDateBetween(date, checkIn, checkOut);

            let bgClass = 'bg-white hover:bg-neo-bg border-neo-dark text-neo-dark';
            let cursorClass = 'cursor-pointer hover:scale-105';

            if (isPast) {
              bgClass = 'bg-gray-100 border-gray-300 text-gray-300';
              cursorClass = 'cursor-not-allowed';
            } else if (isOccupied) {
              bgClass = 'bg-[#FF7B7B] border-neo-dark text-neo-dark font-black';
              cursorClass = 'cursor-not-allowed';
            } else if (isSelectedCheckin || isSelectedCheckout) {
              bgClass = 'bg-[#C28CFF] border-neo-dark text-neo-dark font-black shadow-[1px_1px_0_0_#1E1E1E]';
            } else if (isInRange) {
              bgClass = 'bg-[#E2F0D9] border-neo-dark text-neo-dark';
            } else if (isToday) {
              bgClass = 'bg-[#FAF8F5] border-dashed border-neo-pink text-neo-dark font-black';
            }

            return (
              <div
                key={`day-${dateStr}`}
                onClick={() => !isPast && !isOccupied && handleDateClick(date)}
                className={`h-7 flex flex-col items-center justify-center text-xs font-bold border-2 rounded-md transition-all relative ${bgClass} ${cursorClass}`}
                title={isOccupied ? 'Sudah ter-booking' : (isPast ? 'Tanggal lampau' : dateStr)}
              >
                <span>{date.getDate()}</span>
                {isOccupied && (
                  <span className="absolute bottom-0.5 w-1 h-1 bg-neo-dark rounded-full" />
                )}
                {(isSelectedCheckin || isSelectedCheckout) && (
                  <div className="absolute -top-1 -right-1 bg-[#55EC8C] border border-neo-dark p-0.5 rounded-full z-10 scale-75">
                    <Check size={6} className="text-neo-dark font-black" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 mt-4 text-[10px] font-black uppercase text-gray-500 border-t-2 border-dashed border-gray-200 pt-3">
        <div className="flex items-center gap-1">
          <div className="w-3.5 h-3.5 bg-white border-2 border-neo-dark rounded" />
          <span>Tersedia</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3.5 h-3.5 bg-[#FF7B7B] border-2 border-neo-dark rounded" />
          <span>Terisi (Booked)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3.5 h-3.5 bg-[#C28CFF] border-2 border-neo-dark rounded shadow-[1px_1px_0_0_#1E1E1E]" />
          <span>Dipilih</span>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityCalendar;
