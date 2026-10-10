import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, ShoppingBag, Store } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-gray-800">
      <div className="text-center mb-10">
        <Leaf size={64} className="mx-auto text-green-600 mb-4" />
        <h1 className="text-4xl font-bold tracking-tight text-green-700">MandiDirect</h1>
        <p className="text-gray-500 mt-2 text-lg">Hyper-Local Perishable Surplus Marketplace</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl">
        <Link to="/login?role=buyer" className="flex-1 bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md hover:border-green-300 transition-all text-center group cursor-pointer">
          <ShoppingBag size={48} className="mx-auto text-green-500 mb-4 group-hover:scale-110 transition-transform" />
          <h2 className="text-2xl font-bold mb-2">I am a Buyer</h2>
          <p className="text-gray-600 text-sm">Hunt for cheap, bulk fresh ingredients near you.</p>
        </Link>
        
        <Link to="/login?role=seller" className="flex-1 bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md hover:border-green-300 transition-all text-center group cursor-pointer">
          <Store size={48} className="mx-auto text-green-500 mb-4 group-hover:scale-110 transition-transform" />
          <h2 className="text-2xl font-bold mb-2">I am a Seller</h2>
          <p className="text-gray-600 text-sm">Offload near-expiration surplus produce directly.</p>
        </Link>
      </div>
    </div>
  );
}
