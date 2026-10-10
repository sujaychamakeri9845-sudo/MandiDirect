import React, { useState, useEffect } from 'react';
import { Leaf, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SellerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [view, setView] = useState('add');
  const [formData, setFormData] = useState({ item_name: '', quantity: '', current_price: '', original_price: '', pickup_location: '' });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) { navigate('/login?role=seller'); return; }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    fetchRequests(parsedUser.id);
  }, [navigate]);

  const fetchRequests = async (sellerId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/requests/seller/${sellerId}`);
      if (res.ok) setRequests(await res.json());
    } catch (e) { console.error(e); }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/surplus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, seller_id: user.id }),
      });
      if (res.ok) {
        alert('Item posted successfully!');
        setFormData({ item_name: '', quantity: '', current_price: '', original_price: '', pickup_location: '' });
      }
    } catch (e) { console.error(e); }
  };

  const handleAccept = async (reqId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/requests/${reqId}/accept`, { method: 'PUT' });
      if (res.ok) fetchRequests(user.id);
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
            <h1 className="text-2xl font-bold tracking-tight">Seller Dashboard</h1>
          </div>
          <div className="flex gap-4 items-center">
            <span className="font-medium text-green-50">Welcome, {user.username}</span>
            <button onClick={logout} className="flex items-center text-green-100 hover:text-white transition-colors"><LogOut size={20} className="mr-1"/> Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 mt-6">
        <div className="flex gap-4 mb-6 border-b pb-2">
          <button onClick={() => setView('add')} className={`text-lg font-semibold ${view === 'add' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'}`}>Post Item</button>
          <button onClick={() => setView('logs')} className={`text-lg font-semibold ${view === 'logs' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'}`}>Incoming Requests (Logs)</button>
        </div>

        {view === 'add' ? (
          <div className="max-w-md bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold mb-4">List New Produce</h2>
            <form onSubmit={handlePost} className="space-y-4">
              <input type="text" name="item_name" value={formData.item_name} onChange={e=>setFormData({...formData, item_name: e.target.value})} placeholder="Item Description" className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-green-500 outline-none" required />
              <input type="text" name="quantity" value={formData.quantity} onChange={e=>setFormData({...formData, quantity: e.target.value})} placeholder="Quantity (e.g. 50kg)" className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-green-500 outline-none" required />
              <input type="number" name="current_price" value={formData.current_price} onChange={e=>setFormData({...formData, current_price: e.target.value})} placeholder="Clearance Price (₹)" className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-green-500 outline-none" required />
              <input type="text" name="pickup_location" value={formData.pickup_location} onChange={e=>setFormData({...formData, pickup_location: e.target.value})} placeholder="Pickup Location" className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-green-500 outline-none" required />
              <button type="submit" className="w-full bg-green-600 text-white font-bold p-3 rounded hover:bg-green-700 transition-colors">Post Immediately</button>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b text-gray-600">
                <tr>
                  <th className="p-4 font-semibold">Item</th>
                  <th className="p-4 font-semibold">Price</th>
                  <th className="p-4 font-semibold">Buyer</th>
                  <th className="p-4 font-semibold">Action/Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => (
                  <tr key={req.request_id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">{req.item_name}</td>
                    <td className="p-4 text-gray-600">₹{req.current_price}</td>
                    <td className="p-4 text-gray-600">{req.buyer_name}</td>
                    <td className="p-4">
                      {req.request_status === 'pending' ? (
                        <button onClick={() => handleAccept(req.request_id)} className="bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700 transition-colors">Accept Request</button>
                      ) : (
                        <span className="text-green-700 font-bold bg-green-50 px-3 py-1 rounded-full">ACCEPTED</span>
                      )}
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && <tr><td colSpan="4" className="p-4 text-center text-gray-500 py-8">No incoming requests yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
