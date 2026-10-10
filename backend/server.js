const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ─── Default Credentials ────────────────────────────────────────────────────
const DEFAULT_USERS = [
  { id: 1, username: 'buyer1',  password: 'buyer123',  role: 'buyer'  },
  { id: 2, username: 'buyer2',  password: 'buyer123',  role: 'buyer'  },
  { id: 3, username: 'seller1', password: 'seller123', role: 'seller' },
  { id: 4, username: 'seller2', password: 'seller123', role: 'seller' },
];

// ─── In-Memory Store ─────────────────────────────────────────────────────────
let users    = [...DEFAULT_USERS];
let items    = [];
let requests = [];
let itemId   = 1;
let reqId    = 1;

// ─── AUTH ────────────────────────────────────────────────────────────────────
app.post('/api/auth/register', (req, res) => {
  const { username, password, role } = req.body;
  if (users.find(u => u.username === username))
    return res.status(400).json({ error: 'Username already exists' });
  const newUser = { id: users.length + 1, username, password, role };
  users.push(newUser);
  const { password: _, ...safeUser } = newUser;
  res.json(safeUser);
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const { password: _, ...safeUser } = user;
  res.json(safeUser);
});

// ─── SURPLUS ITEMS ───────────────────────────────────────────────────────────
app.get('/api/surplus', (req, res) => {
  const available = items
    .filter(i => i.status === 'available')
    .map(i => ({
      ...i,
      seller_name: users.find(u => u.id === i.seller_id)?.username || 'Unknown',
    }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(available);
});

// Get items posted by a specific seller (for My Listings tab)
app.get('/api/surplus/seller/:id', (req, res) => {
  const sellerId = Number(req.params.id);
  const result = items
    .filter(i => i.seller_id === sellerId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(result);
});

app.post('/api/surplus', (req, res) => {
  const { seller_id, item_name, quantity, current_price, original_price, pickup_location } = req.body;
  const newItem = {
    id: itemId++,
    seller_id: Number(seller_id),
    item_name,
    quantity,
    current_price,
    original_price,
    pickup_location,
    status: 'available',
    created_at: new Date().toISOString(),
  };
  items.push(newItem);
  res.json(newItem);
});

// ─── REQUESTS ────────────────────────────────────────────────────────────────
app.post('/api/requests', (req, res) => {
  const { item_id, buyer_id, seller_id } = req.body;
  const newReq = {
    id: reqId++,
    item_id: Number(item_id),
    buyer_id: Number(buyer_id),
    seller_id: Number(seller_id),
    status: 'pending',
    created_at: new Date().toISOString(),
  };
  requests.push(newReq);
  const item = items.find(i => i.id === Number(item_id));
  if (item) item.status = 'pending';
  res.json(newReq);
});

app.get('/api/requests/seller/:id', (req, res) => {
  const sellerId = Number(req.params.id);
  const result = requests
    .filter(r => r.seller_id === sellerId)
    .map(r => {
      const item  = items.find(i => i.id === r.item_id) || {};
      const buyer = users.find(u => u.id === r.buyer_id) || {};
      return {
        request_id:     r.id,
        request_status: r.status,
        created_at:     r.created_at,
        item_name:      item.item_name,
        current_price:  item.current_price,
        buyer_name:     buyer.username,
      };
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(result);
});

app.get('/api/requests/buyer/:id', (req, res) => {
  const buyerId = Number(req.params.id);
  const result = requests
    .filter(r => r.buyer_id === buyerId)
    .map(r => {
      const item   = items.find(i => i.id === r.item_id) || {};
      const seller = users.find(u => u.id === r.seller_id) || {};
      return {
        request_id:     r.id,
        request_status: r.status,
        created_at:     r.created_at,
        item_name:      item.item_name,
        current_price:  item.current_price,
        seller_name:    seller.username,
      };
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(result);
});

app.put('/api/requests/:id/accept', (req, res) => {
  const request = requests.find(r => r.id === Number(req.params.id));
  if (!request) return res.status(404).json({ error: 'Not found' });
  request.status = 'accepted';
  const item = items.find(i => i.id === request.item_id);
  if (item) item.status = 'sold';
  res.json({ success: true });
});

module.exports = app;

if (require.main === module) {
  app.listen(5000, () => console.log('Local dev server running on port 5000'));
}
