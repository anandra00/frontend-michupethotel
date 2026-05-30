import React from 'react';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';

const NotFound = () => {
  return (
    <PageTransition>
      <div className="min-h-[70vh] flex items-center justify-center bg-neo-bg px-4 py-12">
        <div className="max-w-md w-full bg-white border-4 border-neo-dark p-8 rounded-2xl shadow-[8px_8px_0_0_#1E1E1E] text-center">
          <div className="text-8xl font-black text-neo-pink mb-4 animate-bounce select-none">
            404
          </div>
          <h1 className="text-3xl font-black text-neo-dark mb-4 font-fredoka">
            Wah, Halaman Hilang! 😿
          </h1>
          <p className="text-gray-600 font-bold mb-8">
            Sepertinya anabul kami menyembunyikan mainan atau halaman yang kamu cari di tempat rahasia. Yuk kembali ke jalan yang benar!
          </p>
          <Link
            to="/"
            className="inline-block w-full bg-neo-yellow text-neo-dark font-black px-6 py-4 rounded-xl border-4 border-neo-dark shadow-[4px_4px_0_0_#1E1E1E] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all text-lg"
          >
            Kembali ke Beranda 🐾
          </Link>
        </div>
      </div>
    </PageTransition>
  );
};

export default NotFound;
