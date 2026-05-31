import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { HeartPulse } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(name, email, password);
      toast.success("Kode OTP telah dikirim ke email kamu.");
      navigate('/verify-otp', { state: { email } }); 
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="neo-card p-8 md:p-12 w-full max-w-md relative bg-neo-blue">
        {/* Decorative Element */}
        <div className="absolute -top-6 -left-6 bg-white p-3 rounded-full border-4 border-neo-dark shadow-neo transform -rotate-12">
          <HeartPulse size={32} className="text-neo-pink" />
        </div>

        <div className="text-center mb-8">
          <h2 className="text-4xl font-black mb-2">Join Michu!</h2>
          <p className="font-medium text-gray-700">Create an account for your furry friend</p>
        </div>

        {error && (
          <div className="bg-neo-pink border-4 border-neo-dark p-3 rounded-lg mb-6 font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block font-bold mb-2">Full Name</label>
            <input 
              type="text" 
              className="neo-input" 
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block font-bold mb-2">Email Address</label>
            <input 
              type="email" 
              className="neo-input" 
              placeholder="meow@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="block font-bold mb-2">Password</label>
            <input 
              type="password" 
              className="neo-input" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            <p className="text-xs font-bold text-gray-500 mt-1">
              * Minimal 8 karakter, harus mengandung huruf besar, huruf kecil, angka, dan simbol.
            </p>
          </div>

          <button type="submit" disabled={loading} className="neo-btn neo-btn-secondary w-full text-xl py-4 mt-6 disabled:opacity-60 disabled:cursor-wait">
            {loading ? <><span className="neo-spinner mr-2"></span>Creating...</> : 'Create Account'}
          </button>
        </form>

        <p className="text-center font-bold mt-8">
          Already have an account? <Link to="/login" className="text-white hover:underline underline-offset-4 decoration-4">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
