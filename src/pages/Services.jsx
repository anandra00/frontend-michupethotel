import { Link } from 'react-router-dom';
import { BedDouble, MapPin } from 'lucide-react';

const Services = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-black mb-6">Our Services 🐾</h1>
        <p className="text-xl font-medium max-w-2xl mx-auto">
          We offer premium care for your beloved feline friends. Choose the service that best fits your needs!
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
        {/* Cat Hotel / Boarding */}
        <Link to="/rooms" className="bg-[#FF9B50] p-10 border-4 border-neo-dark rounded-xl shadow-[8px_8px_0_0_#1E1E1E] flex flex-col items-center text-center hover:-translate-y-2 hover:shadow-[12px_12px_0_0_#1E1E1E] transition-all group">
          <div className="bg-white p-6 rounded-full border-4 border-neo-dark mb-6 group-hover:scale-110 transition-transform">
            <BedDouble size={48} className="text-neo-dark" />
          </div>
          <h2 className="text-3xl font-black mb-4">Cat Hotel (Inap)</h2>
          <p className="font-bold text-lg">Fasilitas kamar premium dan VIP untuk anabulmu dengan pelayanan bintang 5 selama kamu bepergian.</p>
          <button className="mt-8 bg-white border-4 border-neo-dark px-8 py-3 rounded-full font-black text-xl hover:bg-gray-100">
            Lihat Kamar
          </button>
        </Link>

        {/* Cat Sitter */}
        <Link to="/dashboard/sitter" className="bg-[#4ADE80] p-10 border-4 border-neo-dark rounded-xl shadow-[8px_8px_0_0_#1E1E1E] flex flex-col items-center text-center hover:-translate-y-2 hover:shadow-[12px_12px_0_0_#1E1E1E] transition-all group">
          <div className="bg-white p-6 rounded-full border-4 border-neo-dark mb-6 group-hover:scale-110 transition-transform">
            <MapPin size={48} className="text-neo-dark" />
          </div>
          <h2 className="text-3xl font-black mb-4">Cat Sitter</h2>
          <p className="font-bold text-lg">Layanan kunjungan ke rumah untuk memastikan kucing kesayanganmu tetap aman, kenyang, dan bahagia.</p>
          <button className="mt-8 bg-white border-4 border-neo-dark px-8 py-3 rounded-full font-black text-xl hover:bg-gray-100">
            Pesan Sitter
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Services;
