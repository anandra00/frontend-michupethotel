import { Link } from 'react-router-dom';
import { Cat, CalendarDays, HeartPulse, CheckCircle2 } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="flex flex-col gap-12 md:gap-24 pb-12 md:pb-24">
      {/* Marquee Banner */}
      <div className="marquee-container">
        <div className="marquee-content gap-4 px-4 font-black text-xl uppercase tracking-widest">
          <span>🐾 MICHU MEOWSTAY • PREMIUM CAT HOTEL • OPEN 24/7</span>
          <span>🐾 MICHU MEOWSTAY • PREMIUM CAT HOTEL • OPEN 24/7</span>
          <span>🐾 MICHU MEOWSTAY • PREMIUM CAT HOTEL • OPEN 24/7</span>
          <span>🐾 MICHU MEOWSTAY • PREMIUM CAT HOTEL • OPEN 24/7</span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-8 md:pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-8">
            <div className="inline-block bg-neo-yellow border-4 border-neo-dark px-4 py-2 rounded-full font-bold shadow-[4px_4px_0_0_#1E1E1E] -rotate-2 transform">
              🐾 #1 Premium Cat Hotel
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-fredoka font-black leading-tight text-neo-dark">
              Michu <span className="text-neo-pink underline decoration-8 decoration-neo-dark">MeowStay</span>
            </h1>
            <p className="text-base md:text-xl font-poppins font-medium text-gray-800 max-w-lg">
              Pet Hotel & Cat Care Service for Your Lovely Cats. We treat your cats like royalty!
            </p>
            <div className="flex flex-wrap gap-3 md:gap-4 pt-4">
              <Link to="/rooms" className="neo-btn neo-btn-primary text-base md:text-xl px-6 md:px-8 py-3 md:py-4">
                Book Now 🐱
              </Link>
              <Link to="/services" className="neo-btn bg-white text-base md:text-xl px-6 md:px-8 py-3 md:py-4">
                Our Services
              </Link>
            </div>
          </div>
          <div className="flex-1 relative">
            <div className="absolute inset-0 bg-neo-blue rounded-full border-4 border-neo-dark translate-x-4 translate-y-4 shadow-neo"></div>
            <img 
              src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
              alt="Cute cat" 
              className="relative z-10 w-full h-[300px] md:h-[500px] object-cover rounded-full border-4 border-neo-dark"
            />
            
            {/* Floating Badges */}
            <div className="absolute top-10 -left-4 md:-left-10 bg-white p-2 md:p-4 rounded-xl border-3 md:border-4 border-neo-dark shadow-neo z-20 items-center gap-2 md:gap-3 animate-bounce hidden sm:flex" style={{animationDuration: '3s'}}>
              <HeartPulse className="text-neo-pink" size={24} />
              <div>
                <p className="font-bold text-sm md:text-base">24/7 Care</p>
                <p className="text-xs md:text-sm">Vet on call</p>
              </div>
            </div>

            <div className="absolute bottom-20 -right-4 md:-right-10 bg-neo-yellow p-2 md:p-4 rounded-xl border-3 md:border-4 border-neo-dark shadow-neo z-20 items-center gap-2 md:gap-3 animate-bounce hidden sm:flex" style={{animationDuration: '4s'}}>
              <CheckCircle2 className="text-neo-dark" size={24} />
              <div>
                <p className="font-bold text-sm md:text-base">100+ Cats</p>
                <p className="text-xs md:text-sm">Happy guests</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="bg-neo-blue py-10 md:py-20 border-y-4 border-neo-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-2 md:mb-4">Our Services</h2>
            <p className="text-base md:text-xl font-medium">Everything your cat needs while you are away!</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
            <div className="neo-card p-8 bg-white text-center group">
              <div className="bg-neo-pink w-20 h-20 rounded-full border-4 border-neo-dark flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <CalendarDays size={40} className="text-neo-dark" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Cat Hotel</h3>
              <p className="font-medium text-gray-700">Premium boarding with AC, daily playground time, and constant supervision.</p>
            </div>
            
            <div className="neo-card p-8 bg-neo-yellow text-center group">
              <div className="bg-white w-20 h-20 rounded-full border-4 border-neo-dark flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Cat size={40} className="text-neo-dark" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Home Visit</h3>
              <p className="font-medium text-gray-700">We visit your home to feed, clean litter box, and play with your cat.</p>
            </div>

            <div className="neo-card p-8 bg-white text-center group">
              <div className="bg-neo-orange w-20 h-20 rounded-full border-4 border-neo-dark flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <HeartPulse size={40} className="text-neo-dark" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Grooming</h3>
              <p className="font-medium text-gray-700">Basic grooming, nail clipping, and ear cleaning during their stay.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
