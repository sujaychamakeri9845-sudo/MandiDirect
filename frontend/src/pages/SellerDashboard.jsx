import React, { useState, useEffect } from 'react';
import { Leaf, LogOut, Package, CheckCircle, Clock, PlusCircle, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API = 'https://mandi-direct-9der.vercel.app';

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const STATUS_STYLE = {
  available: 'bg-green-100 text-green-700',
  pending:   'bg-yellow-100 text-yellow-700',
  sold:      'bg-gray-100 text-gray-500',
};

export default function SellerDashboard() {
  const navigate = useNavigate();
  const [user, setUser]         = useState(null);
  const [requests, setRequests] = useState([]);
  const [myItems, setMyItems]   = useState([]);
  const [view, setView]         = useState('add');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    item_name: '', quantity: '', current_price: '', original_price: '', pickup_location: '',
  });

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { navigate('/login?role=seller'); return; }
    const u = JSON.parse(stored);
    setUser(u);
    fetchRequests(u.id);
    fetchMyItems(u.id);
  }, [navigate]);

  const fetchRequests = async (sellerId) => {
    try {
      const res = await fetch(`${API}/api/requests/seller/${sellerId}`);
      if (res.ok) setRequests(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchMyItems = async (sellerId) => {
    try {
      const res = await fetch(`${API}/api/surplus/seller/${sellerId}`);
      if (res.ok) setMyItems(await res.json());
    } catch (e) { console.error(e); }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/surplus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, seller_id: user.id }),
      });
      if (res.ok) {
        alert('✅ Item posted to marketplace!');
        setFormData({ item_name: '', quantity: '', current_price: '', original_price: '', pickup_location: '' });
        fetchMyItems(user.id);
      }
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  const handleAccept = async (reqId) => {
    try {
      const res = await fetch(`${API}/api/requests/${reqId}/accept`, { method: 'PUT' });
      if (res.ok) {
        fetchRequests(user.id);
        fetchMyItems(user.id);
      }
    } catch (e) { console.error(e); }
  };

  const logout = () => { localStorage.removeItem('user'); navigate('/'); };

  const pendingCount = requests.filter(r => r.request_status === 'pending').length;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Header */}
      <header className="bg-green-600 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Leaf size={26} />
            <div>
              <h1 className="text-xl font-bold leading-none">MandiDirect</h1>
              <p className="text-green-200 text-xs">Seller Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-green-100 text-sm hidden sm:block">👋 {user.username}</span>
            <button onClick={logout} className="flex items-center gap-1 text-green-100 hover:text-white text-sm">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 mt-4">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { icon: <Package size={20} />, label: 'Total Listed', value: myItems.length, color: 'text-blue-600 bg-blue-50' },
            { icon: <Clock size={20} />, label: 'Pending Requests', value: pendingCount, color: 'text-yellow-600 bg-yellow-50' },
            { icon: <CheckCircle size={20} />, label: 'Deals Closed', value: requests.filter(r => r.request_status === 'accepted').length, color: 'text-green-600 bg-green-50' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.color}`}>{s.icon}</div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-200 rounded-xl p-1 w-fit mb-6">
          {[
            ['add', '➕ Post Item'],
            ['listings', '📦 My Listings'],
            ['requests', `📬 Requests${pendingCount > 0 ? ` (${pendingCount})` : ''}`],
          ].map(([v, label]) => (
            <button
              key={v}
              onClick={() => { setView(v); if (v === 'requests') fetchRequests(user.id); if (v === 'listings') fetchMyItems(user.id); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${view === v ? 'bg-white text-green-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Post Item Form */}
        {view === 'add' && (
          <div className="max-w-lg bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-bold mb-5 flex items-center gap-2 text-gray-800">
              <PlusCircle className="text-green-600" size={22} /> List New Surplus Produce
            </h2>
            <form onSubmit={handlePost} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Description</label>
                <input type="text" value={formData.item_name} onChange={e => setFormData({...formData, item_name: e.target.value})} placeholder="e.g. Overripe Tomatoes, 50kg" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input type="text" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} placeholder="e.g. 50 kg / 10 crates" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Clearance Price (₹)</label>
                  <input type="number" value={formData.current_price} onChange={e => setFormData({...formData, current_price: e.target.value})} placeholder="₹" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Original Price (opt)</label>
                  <input type="number" value={formData.original_price} onChange={e => setFormData({...formData, original_price: e.target.value})} placeholder="₹" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pick-up Location</label>
                <input type="text" value={formData.pickup_location} onChange={e => setFormData({...formData, pickup_location: e.target.value})} placeholder="e.g. Azadpur Mandi, Gate 2" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
              </div>
              <button type="submit" disabled={submitting} className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold py-3 rounded-lg transition-colors">
                {submitting ? 'Posting...' : '⚡ Post Immediately'}
              </button>
            </form>
          </div>
        )}

        {/* My Listings */}
        {view === 'listings' && (
          <div>
            <div className="mb-3 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-700">My Posted Items</h2>
              <button onClick={() => fetchMyItems(user.id)} className="text-green-600 text-sm font-medium hover:text-green-700">🔄 Refresh</button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Item', 'Qty', 'Price', 'Location', 'Posted', 'Status'].map(h => (
                      <th key={h} className="px-4 py-3 font-semibold text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {myItems.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-12 text-gray-400">No items posted yet. Go to "Post Item" to list your first lot!</td></tr>
                  ) : myItems.map(item => (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{item.item_name}</td>
                      <td className="px-4 py-3 text-gray-600">{item.quantity}</td>
                      <td className="px-4 py-3 text-green-600 font-semibold">₹{item.current_price}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-[140px] truncate">{item.pickup_location}</td>
                      <td className="px-4 py-3 text-gray-400">{timeAgo(item.created_at)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${STATUS_STYLE[item.status] || 'bg-gray-100 text-gray-500'}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Incoming Requests */}
        {view === 'requests' && (
          <div>
            <div className="mb-3 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-700">Incoming Buyer Requests</h2>
              <button onClick={() => fetchRequests(user.id)} className="text-green-600 text-sm font-medium hover:text-green-700">🔄 Refresh</button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Item', 'Price', 'Buyer', 'Requested', 'Action'].map(h => (
                      <th key={h} className="px-4 py-3 font-semibold text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-12 text-gray-400">No incoming requests yet.</td></tr>
                  ) : requests.map(r => (
                    <tr key={r.request_id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{r.item_name}</td>
                      <td className="px-4 py-3 text-green-600 font-semibold">₹{r.current_price}</td>
                      <td className="px-4 py-3 text-gray-600">{r.buyer_name}</td>
                      <td className="px-4 py-3 text-gray-400">{timeAgo(r.created_at)}</td>
                      <td className="px-4 py-3">
                        {r.request_status === 'pending' ? (
                          <button
                            onClick={() => handleAccept(r.request_id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors"
                          >
                            ✅ Accept
                          </button>
                        ) : (
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">ACCEPTED</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
