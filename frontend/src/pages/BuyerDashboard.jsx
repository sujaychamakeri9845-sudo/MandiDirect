import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Leaf, Search, ArrowLeft, LogOut, Tag, Filter, Package, TrendingDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const API = 'https://mandi-direct-9der.vercel.app';

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function DiscountBadge({ original, current }) {
  if (!original || original <= current) return null;
  const pct = Math.round(((original - current) / original) * 100);
  return (
    <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
      <TrendingDown size={12} /> {pct}% OFF
    </span>
  );
}

const STATUS_COLORS = {
  pending:  'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
};

export default function BuyerDashboard() {
  const navigate = useNavigate();
  const [user, setUser]         = useState(null);
  const [items, setItems]       = useState([]);
  const [requests, setRequests] = useState([]);
  const [view, setView]         = useState('browse');
  const [search, setSearch]     = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sending, setSending]   = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { navigate('/login?role=buyer'); return; }
    const u = JSON.parse(stored);
    setUser(u);
    fetchItems();
    fetchRequests(u.id);
  }, [navigate]);

  const fetchItems = async () => {
    try {
      const res = await fetch(`${API}/api/surplus`);
      if (res.ok) setItems(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchRequests = async (buyerId) => {
    try {
      const res = await fetch(`${API}/api/requests/buyer/${buyerId}`);
      if (res.ok) setRequests(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleRequest = async (item) => {
    setSending(item.id);
    try {
      const res = await fetch(`${API}/api/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: item.id, buyer_id: user.id, seller_id: item.seller_id }),
      });
      if (res.ok) {
        alert('✅ Request sent to seller! Check "My Requests" for updates.');
        fetchItems();
        fetchRequests(user.id);
      }
    } catch (e) { console.error(e); }
    setSending(null);
  };

  const logout = () => { localStorage.removeItem('user'); navigate('/'); };

  const filteredItems = items.filter(item => {
    const matchSearch = item.item_name.toLowerCase().includes(search.toLowerCase()) ||
      item.pickup_location.toLowerCase().includes(search.toLowerCase());
    const matchPrice = !maxPrice || item.current_price <= Number(maxPrice);
    return matchSearch && matchPrice;
  });

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
              <p className="text-green-200 text-xs">Buyer Portal</p>
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

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-4 mt-4">
        <div className="flex gap-1 bg-gray-200 rounded-xl p-1 w-fit mb-6">
          {[['browse', '🛒 Browse Lots'], ['requests', '📋 My Requests']].map(([v, label]) => (
            <button
              key={v}
              onClick={() => { setView(v); if (v === 'requests') fetchRequests(user.id); }}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${view === v ? 'bg-white text-green-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {view === 'browse' ? (
          <div>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input
                  type="text" placeholder="Search item or location..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input
                  type="number" placeholder="Max Price (₹)"
                  value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                  className="w-full sm:w-44 pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <button onClick={fetchItems} className="bg-green-50 text-green-700 border border-green-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors">
                🔄 Refresh
              </button>
            </div>

            {/* Stats Bar */}
            <div className="mb-4 text-sm text-gray-500">
              Showing <strong className="text-gray-700">{filteredItems.length}</strong> available lot{filteredItems.length !== 1 ? 's' : ''}
            </div>

            {/* Item Grid */}
            {filteredItems.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border">
                <Package size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No lots found</p>
                <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or check back later</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredItems.map(item => (
                  <div key={item.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                    <div className="p-5 flex-1">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-gray-900 text-base leading-snug">{item.item_name}</h3>
                        <DiscountBadge original={item.original_price} current={item.current_price} />
                      </div>
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-2xl font-bold text-green-600">₹{item.current_price}</span>
                        {item.original_price > item.current_price && (
                          <span className="text-sm text-gray-400 line-through">₹{item.original_price}</span>
                        )}
                      </div>
                      <div className="space-y-1.5 text-sm text-gray-600">
                        <div className="flex items-center gap-2"><Tag size={14} className="text-gray-400 shrink-0" /><span>Qty: <strong>{item.quantity}</strong></span></div>
                        <div className="flex items-center gap-2"><MapPin size={14} className="text-gray-400 shrink-0" /><span className="truncate">{item.pickup_location}</span></div>
                        <div className="flex items-center gap-2"><Clock size={14} className="text-gray-400 shrink-0" /><span>{timeAgo(item.created_at)}</span></div>
                      </div>
                    </div>
                    <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-between items-center">
                      <span className="text-xs text-gray-500">🧑‍🌾 {item.seller_name}</span>
                      <button
                        onClick={() => handleRequest(item)}
                        disabled={sending === item.id}
                        className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                      >
                        {sending === item.id ? 'Sending...' : 'Request Lot'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Requests Log
          <div>
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-700">My Reserve Requests</h2>
              <button onClick={() => fetchRequests(user.id)} className="text-green-600 hover:text-green-700 text-sm font-medium">🔄 Refresh</button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Item', 'Price', 'Seller', 'Requested At', 'Status'].map(h => (
                      <th key={h} className="px-4 py-3 font-semibold text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-12 text-gray-400">No requests yet. Browse lots and send your first request!</td></tr>
                  ) : requests.map(r => (
                    <tr key={r.request_id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{r.item_name}</td>
                      <td className="px-4 py-3 text-green-600 font-semibold">₹{r.current_price}</td>
                      <td className="px-4 py-3 text-gray-600">{r.seller_name}</td>
                      <td className="px-4 py-3 text-gray-400">{timeAgo(r.created_at)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${STATUS_COLORS[r.request_status] || 'bg-gray-100 text-gray-600'}`}>
                          {r.request_status}
                        </span>
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
