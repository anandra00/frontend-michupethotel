import { useState } from 'react';
import { X, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  {
    q: 'Apa itu layanan Michu MeowStay?',
    a: 'Michu MeowStay menyediakan dua layanan utama: Cat Boarding (penginapan kucing) dan Cat Sitter (kunjungan perawatan ke rumah Anda).'
  },
  {
    q: 'Apakah harga kamar sudah termasuk makanan?',
    a: 'Tidak, makanan kucing disediakan oleh pemilik (*Cat Owner*) agar anabul tidak kaget dengan makanan baru. Kami menyediakan pasir (litter) dan air minum bersih.'
  },
  {
    q: 'Berapa durasi kunjungan Cat Sitter?',
    a: 'Setiap sesi kunjungan Cat Sitter berlangsung sekitar 45-60 menit. Sitter akan memberi makan, membersihkan litter box, dan bermain dengan kucing Anda.'
  },
  {
    q: 'Kapan saya harus melunasi pembayaran?',
    a: 'Pembayaran harus dilunasi segera setelah pemesanan dilakukan via aplikasi menggunakan sistem pembayaran digital yang tersedia.'
  },
  {
    q: 'Apakah ada update kondisi kucing selama menginap/dikunjungi?',
    a: 'Tentu! Anda akan menerima Laporan Harian (Daily Report) yang berisi status kesehatan, nafsu makan, dan foto kucing Anda langsung melalui menu History di aplikasi.'
  }
];

const FAQWidget = ({ isOpen, onClose }) => {
  const [openIndex, setOpenIndex] = useState(null);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 right-4 md:right-8 w-[90vw] md:w-[400px] h-[500px] bg-white border-4 border-neo-dark rounded-xl shadow-[8px_8px_0_0_#1E1E1E] flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-[#B983FF] border-b-4 border-neo-dark p-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-full border-2 border-neo-dark">
            <HelpCircle size={20} className="text-neo-dark" />
          </div>
          <div>
            <h3 className="font-black text-lg leading-tight">Bantuan & FAQ</h3>
            <p className="text-xs font-bold opacity-80">Pertanyaan yang sering diajukan</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="bg-white p-1 rounded-full border-2 border-neo-dark hover:bg-neo-pink transition-colors shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#f8f9fa] space-y-3">
        {faqs.map((faq, idx) => (
          <div key={idx} className="bg-white border-3 border-neo-dark rounded-xl overflow-hidden shadow-[2px_2px_0_0_#1E1E1E]">
            <button
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full p-4 flex justify-between items-center text-left hover:bg-neo-yellow transition-colors"
            >
              <span className="font-bold text-sm md:text-base pr-4">{faq.q}</span>
              <span className="shrink-0 bg-white border-2 border-neo-dark p-1 rounded-full">
                {openIndex === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </button>
            {openIndex === idx && (
              <div className="p-4 bg-neo-bg border-t-3 border-neo-dark font-medium text-sm text-gray-700 leading-relaxed">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQWidget;
