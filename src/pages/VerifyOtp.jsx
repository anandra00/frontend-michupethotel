import { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { MailCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const VerifyOtp = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const { verifyOtp, resendOtp } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      toast.error('Email tidak ditemukan, silakan login kembali.');
      navigate('/login');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    
    const newOtp = [...otp];
    // allow pasting
    if (value.length > 1) {
      const pasted = value.slice(0, 6).split('');
      for (let i = 0; i < pasted.length; i++) {
        newOtp[i] = pasted[i];
      }
      setOtp(newOtp);
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
      return;
    }

    newOtp[index] = value;
    setOtp(newOtp);

    // auto next
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      toast.error('Kode OTP harus 6 digit');
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(email, otpString);
      toast.success("Verifikasi berhasil! 🎉");
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verifikasi gagal');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setResending(true);
    try {
      await resendOtp(email);
      toast.success('OTP baru telah dikirim ke email kamu.');
      setCountdown(60);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengirim ulang OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="neo-card p-8 md:p-12 w-full max-w-md relative bg-white">
        <div className="absolute -top-6 -right-6 bg-neo-yellow p-3 rounded-full border-4 border-neo-dark shadow-neo transform rotate-12">
          <MailCheck size={32} className="text-neo-dark" />
        </div>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-black mb-2">Cek Email Kamu!</h2>
          <p className="font-medium text-gray-700">
            Kami telah mengirimkan 6-digit kode OTP ke<br/>
            <strong className="text-neo-dark bg-neo-yellow px-1">{email}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-between gap-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength={6} // to handle paste on first input
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-black neo-input p-0"
              />
            ))}
          </div>

          <button type="submit" disabled={loading} className="neo-btn neo-btn-primary w-full text-xl py-4 disabled:opacity-60 disabled:cursor-wait">
            {loading ? <><span className="neo-spinner mr-2"></span>Verifikasi...</> : 'Verifikasi Akun'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="font-bold text-gray-600 mb-2">Belum menerima email?</p>
          <button 
            type="button" 
            onClick={handleResend}
            disabled={countdown > 0 || resending}
            className={`font-black uppercase tracking-wider text-sm ${countdown > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-neo-pink hover:underline decoration-4 underline-offset-4'}`}
          >
            {resending ? 'Mengirim...' : countdown > 0 ? `Kirim ulang dalam ${countdown}s` : 'Kirim Ulang OTP'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
