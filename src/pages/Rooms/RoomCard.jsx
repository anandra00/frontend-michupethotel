import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { BACKEND_URL } from '../../api/axios';

const RoomCard = ({ room, onBookClick }) => {
  const facilities = room.facilities ? (() => { try { return JSON.parse(room.facilities); } catch { return []; } })() : [];

  return (
    <Card hoverEffect>
      <div className="h-40 md:h-48 border-b-4 border-neo-dark bg-neo-yellow relative overflow-hidden rounded-t-[7px]">
        {room.photo ? (
          <img 
            src={`${BACKEND_URL}/storage/${room.photo}`} 
            alt={room.name} 
            className="w-full h-full object-cover" 
            loading="lazy" 
          />
        ) : (
          <div className="flex items-center justify-center h-full text-4xl">📸</div>
        )}
        <div className="absolute top-3 right-3 bg-neo-pink border-3 md:border-4 border-neo-dark px-2 md:px-3 py-1 font-bold rounded-full text-xs md:text-sm transform rotate-3">
          {room.type}
        </div>
      </div>
      <div className="p-4 md:p-6 flex-grow flex flex-col">
        <h2 className="text-xl md:text-2xl font-bold mb-2">{room.name}</h2>
        <p className="text-gray-700 mb-3 md:mb-4 line-clamp-2 text-sm md:text-base">{room.description}</p>
        
        <div className="mb-3 md:mb-4">
          <h3 className="font-bold text-xs md:text-sm mb-2 uppercase">Facilities:</h3>
          <div className="flex flex-wrap gap-1 md:gap-2">
            {facilities.map((f, i) => (
              <span key={i} className="bg-neo-bg border-2 border-neo-dark px-2 py-0.5 text-xs font-bold rounded">{f}</span>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-3 md:pt-4 border-t-4 border-dashed border-neo-dark flex items-end justify-between gap-2">
          <div>
            <p className="text-xs md:text-sm font-bold text-gray-500">Per Night</p>
            <p className="text-lg md:text-2xl font-black">Rp {Number(room.price_per_night).toLocaleString('id-ID')}</p>
          </div>
          <Button onClick={() => onBookClick(room)} className="shrink-0">
            Book Now
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default RoomCard;
