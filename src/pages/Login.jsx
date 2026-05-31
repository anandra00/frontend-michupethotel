import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Cat } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back! 🐾");
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="neo-card p-8 md:p-12 w-full max-w-md relative bg-neo-yellow">
        {/* Decorative Element */}
        <div className="absolute -top-6 -right-6 bg-white p-3 rounded-full border-4 border-neo-dark shadow-neo transform rotate-12">
          <Cat size={32} className="text-neo-dark" />
        </div>

        <div className="text-center mb-8">
          <h2 className="text-4xl font-black mb-2">Welcome Back!</h2>
          <p className="font-medium text-gray-700">We missed you and your cats 🐾</p>
        </div>

        {error && (
          <div className="bg-neo-pink border-4 border-neo-dark p-3 rounded-lg mb-6 font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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
            />
          </div>

          <button type="submit" disabled={loading} className="neo-btn neo-btn-primary w-full text-xl py-4 mt-4 disabled:opacity-60 disabled:cursor-wait">
            {loading ? <><span className="neo-spinner mr-2"></span>Logging in...</> : 'Let me in!'}
          </button>
        </form>

        <p className="text-center font-bold mt-8">
          Don't have an account? <Link to="/register" className="text-neo-pink hover:underline underline-offset-4 decoration-4">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
