const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, 'mandidirect.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to SQLite.');
    
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS surplus_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          seller_id INTEGER,
          item_name TEXT NOT NULL,
          quantity TEXT NOT NULL,
          current_price REAL NOT NULL,
          original_price REAL,
          pickup_location TEXT NOT NULL,
          status TEXT DEFAULT 'available',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(seller_id) REFERENCES users(id)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS requests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          item_id INTEGER,
          buyer_id INTEGER,
          seller_id INTEGER,
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(item_id) REFERENCES surplus_items(id),
          FOREIGN KEY(buyer_id) REFERENCES users(id),
          FOREIGN KEY(seller_id) REFERENCES users(id)
        )
      `);
    });
  }
});

// AUTH
app.post('/api/auth/register', (req, res) => {
  const { username, password, role } = req.body;
  db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, password, role], function(err) {
    if (err) return res.status(400).json({ error: 'Username may already exist' });
    res.json({ id: this.lastID, username, role });
  });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT id, username, role FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
    if (err || !row) return res.status(401).json({ error: 'Invalid credentials' });
    res.json(row);
  });
});

// ITEMS
app.get('/api/surplus', (req, res) => {
  db.all(`
    SELECT s.*, u.username as seller_name 
    FROM surplus_items s 
    JOIN users u ON s.seller_id = u.id 
    WHERE s.status = 'available' 
    ORDER BY s.created_at DESC
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(rows);
  });
});

app.post('/api/surplus', (req, res) => {
  const { seller_id, item_name, quantity, current_price, original_price, pickup_location } = req.body;
  const sql = `INSERT INTO surplus_items (seller_id, item_name, quantity, current_price, original_price, pickup_location) VALUES (?, ?, ?, ?, ?, ?)`;
  db.run(sql, [seller_id, item_name, quantity, current_price, original_price, pickup_location], function(err) {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json({ id: this.lastID });
  });
});

// REQUESTS
app.post('/api/requests', (req, res) => {
  const { item_id, buyer_id, seller_id } = req.body;
  db.run('INSERT INTO requests (item_id, buyer_id, seller_id) VALUES (?, ?, ?)', [item_id, buyer_id, seller_id], function(err) {
    if (err) return res.status(500).json({ error: 'Server error' });
    db.run("UPDATE surplus_items SET status = 'pending' WHERE id = ?", [item_id]);
    res.json({ id: this.lastID });
  });
});

app.get('/api/requests/seller/:id', (req, res) => {
  db.all(`
    SELECT r.id as request_id, r.status as request_status, r.created_at, s.item_name, s.current_price, u.username as buyer_name
    FROM requests r
    JOIN surplus_items s ON r.item_id = s.id
    JOIN users u ON r.buyer_id = u.id
    WHERE r.seller_id = ? ORDER BY r.created_at DESC
  `, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(rows);
  });
});

app.get('/api/requests/buyer/:id', (req, res) => {
  db.all(`
    SELECT r.id as request_id, r.status as request_status, r.created_at, s.item_name, s.current_price, u.username as seller_name
    FROM requests r
    JOIN surplus_items s ON r.item_id = s.id
    JOIN users u ON r.seller_id = u.id
    WHERE r.buyer_id = ? ORDER BY r.created_at DESC
  `, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(rows);
  });
});

app.put('/api/requests/:id/accept', (req, res) => {
  const reqId = req.params.id;
  db.get('SELECT item_id FROM requests WHERE id = ?', [reqId], (err, row) => {
    if (!row) return res.status(404).json({ error: 'Not found' });
    db.run("UPDATE requests SET status = 'accepted' WHERE id = ?", [reqId]);
    db.run("UPDATE surplus_items SET status = 'sold' WHERE id = ?", [row.item_id]);
    res.json({ success: true });
  });
});

app.listen(port, () => console.log(`Running on port ${port}`));
