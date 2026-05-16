import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await signup(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'radial-gradient(ellipse at center, #0a1628 0%, #06060f 100%)' }}>
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold" style={{ color: '#00f0ff', textShadow: '0 0 20px rgba(0, 240, 255, 0.5)' }}>Taskify</h1>
          <p className="text-sm mt-2" style={{ color: '#8888aa' }}>Collaborate. Track. Deliver.</p>
        </div>
        <form onSubmit={handleSubmit} className="rounded-2xl px-8 py-8" style={{ background: '#12121a', border: '1px solid #2a2a4a', boxShadow: '0 0 30px rgba(0, 240, 255, 0.1), inset 0 0 60px rgba(0, 240, 255, 0.02)' }}>
          <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: '#e0e0ff' }}>Create account</h2>
          {error && (
            <div className="border px-4 py-3 rounded-lg mb-4 text-sm" style={{ background: '#1a0a0a', borderColor: '#ff4466', color: '#ff4466' }}>
              {error}
            </div>
          )}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: '#8888aa' }}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg transition"
              style={{ background: '#0a0a0f', border: '1px solid #2a2a4a', color: '#e0e0ff' }}
              placeholder="John Doe"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: '#8888aa' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg transition"
              style={{ background: '#0a0a0f', border: '1px solid #2a2a4a', color: '#e0e0ff' }}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" style={{ color: '#8888aa' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg transition"
              style={{ background: '#0a0a0f', border: '1px solid #2a2a4a', color: '#e0e0ff' }}
              placeholder="At least 6 characters"
              minLength={6}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg font-medium disabled:opacity-50 transition-all"
            style={{ background: '#00f0ff', color: '#0a0a0f', boxShadow: '0 0 15px rgba(0, 240, 255, 0.4)' }}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
          <p className="text-center mt-6 text-sm" style={{ color: '#666688' }}>
            Already have an account?{' '}
            <Link to="/" className="font-medium hover:underline" style={{ color: '#00f0ff' }}>
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
