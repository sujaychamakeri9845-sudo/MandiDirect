import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Leaf, PlusCircle, Search, ArrowLeft, LogOut, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function BuyerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [requests, setRequests] = useState([]);
  const [view, setView] = useState('browse'); // browse | logs

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login?role=buyer');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    fetchItems();
    fetchRequests(parsedUser.id);
  }, [navigate]);

  const fetchItems = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/surplus');
      if (res.ok) setItems(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchRequests = async (buyerId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/requests/buyer/${buyerId}`);
      if (res.ok) setRequests(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleReserve = async (item) => {
    try {
      const res = await fetch(`http://localhost:5000/api/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: item.id, buyer_id: user.id, seller_id: item.seller_id }),
      });
      if (res.ok) {
        alert('Request sent to seller! Check Logs for updates.');
        fetchItems();
        fetchRequests(user.id);
      }
    } catch (e) { console.error(e); }
  };

  const logout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <header className="bg-green-600 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Leaf size={28} />
            <h1 className="text-2xl font-bold tracking-tight">Buyer Dashboard</h1>
          </div>
          <div className="flex gap-4 items-center">
            <span className="font-medium text-green-50">Welcome, {user.username}</span>
            <button onClick={logout} className="flex items-center text-green-100 hover:text-white transition-colors"><LogOut size={20} className="mr-1"/> Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 mt-6">
        <div className="flex gap-4 mb-6 border-b pb-2">
          <button onClick={() => setView('browse')} className={`text-lg font-semibold ${view === 'browse' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'}`}>Browse Surplus</button>
          <button onClick={() => setView('logs')} className={`text-lg font-semibold ${view === 'logs' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'}`}>My Requests (Logs)</button>
        </div>

        {view === 'browse' ? (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {items.map((item) => (
                <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900">{item.item_name}</h3>
                    <p className="text-2xl font-bold text-green-600 mb-4">₹{item.current_price}</p>
                    <p className="text-sm text-gray-600 mb-1">Qty: <strong>{item.quantity}</strong></p>
                    <p className="text-sm text-gray-600 flex items-center"><MapPin size={16} className="mr-1 text-gray-400"/> {item.pickup_location}</p>
                  </div>
                  <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-xs text-gray-500">Seller: {item.seller_name}</span>
                    <button onClick={() => handleReserve(item)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">Send Request</button>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="col-span-full text-center p-12 bg-white rounded-lg border">
                  <p className="text-gray-500">No surplus available right now.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b text-gray-600">
                  <tr>
                    <th className="p-4 font-semibold">Item</th>
                    <th className="p-4 font-semibold">Price</th>
                    <th className="p-4 font-semibold">Seller</th>
                    <th className="p-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => (
                    <tr key={req.request_id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-900">{req.item_name}</td>
                      <td className="p-4 text-gray-600">₹{req.current_price}</td>
                      <td className="p-4 text-gray-600">{req.seller_name}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${req.request_status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {req.request_status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {requests.length === 0 && <tr><td colSpan="4" className="p-4 text-center text-gray-500 py-8">No requests found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
