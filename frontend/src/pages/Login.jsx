import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Leaf, Info } from 'lucide-react';

const API = 'https://mandi-direct-9der.vercel.app';

const DEFAULT_CREDS = [
  { role: 'buyer',  username: 'buyer1',  password: 'buyer123'  },
  { role: 'buyer',  username: 'buyer2',  password: 'buyer123'  },
  { role: 'seller', username: 'seller1', password: 'seller123' },
  { role: 'seller', username: 'seller2', password: 'seller123' },
];

export default function Login() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const role      = new URLSearchParams(location.search).get('role') || 'buyer';

  const [isLogin,  setIsLogin]  = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const fillDefaults = (cred) => {
    setUsername(cred.username);
    setPassword(cred.password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body     = isLogin ? { username, password } : { username, password, role };

    try {
      const response = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data));
        navigate(data.role === 'buyer' ? '/buyer' : '/seller');
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Could not connect to server. Please try again.');
      console.error(err);
    }
  };

  const creds = DEFAULT_CREDS.filter(c => c.role === role);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md border border-gray-100">
        <div className="text-center mb-6">
          <Leaf size={48} className="mx-auto text-green-600 mb-2" />
          <h1 className="text-2xl font-bold text-gray-800">{isLogin ? 'Login' : 'Create Account'}</h1>
          <p className="text-gray-500 capitalize">{role} Portal</p>
        </div>

        {/* Default Credentials Hint */}
        {isLogin && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2 text-green-700 text-sm font-semibold">
              <Info size={16} /> Default Test Credentials
            </div>
            <div className="flex flex-wrap gap-2">
              {creds.map(c => (
                <button
                  key={c.username}
                  type="button"
                  onClick={() => fillDefaults(c)}
                  className="bg-green-100 hover:bg-green-200 text-green-800 text-xs px-3 py-1 rounded-full font-medium transition-colors"
                >
                  {c.username} / {c.password}
                </button>
              ))}
            </div>
            <p className="text-xs text-green-600 mt-1">Click any above to auto-fill</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 text-white font-semibold py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-600">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-green-600 font-semibold hover:underline"
          >
            {isLogin ? 'Sign up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}
