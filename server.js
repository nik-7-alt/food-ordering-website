const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database connection
const db = new sqlite3.Database('database.sqlite', (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// API Endpoints

// GET /api/menu
app.get('/api/menu', (req, res) => {
    db.all('SELECT * FROM menu', [], (err, rows) => {
        if (err) {
            console.error('Error querying menu:', err.message);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        // Restructure the flat rows into the categorized menuData format
        const menuData = {};
        rows.forEach(row => {
            if (!menuData[row.category]) {
                menuData[row.category] = [];
            }
            menuData[row.category].push({
                n: row.n,
                p: row.p,
                img: row.img,
                available: row.available === 1 // Convert integer 1/0 to boolean
            });
        });

        res.json(menuData);
    });
});

// POST /api/menu/update
app.post('/api/menu/update', (req, res) => {
    const { n, p, available } = req.body;

    if (!n) {
        return res.status(400).json({ error: 'Missing item name' });
    }

    const isAvailable = available ? 1 : 0;

    db.run(
        'UPDATE menu SET p = ?, available = ? WHERE n = ?',
        [p, isAvailable, n],
        function(err) {
            if (err) {
                console.error('Error updating menu item:', err.message);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }
            res.json({ success: true, changes: this.changes });
        }
    );
});

// GET /api/orders
app.get('/api/orders', (req, res) => {
    db.all('SELECT * FROM orders ORDER BY id DESC', [], (err, rows) => {
        if (err) {
            console.error('Error querying orders:', err.message);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        // Parse items JSON back to array
        const orders = rows.map(row => ({
            id: row.id,
            items: JSON.parse(row.items_json),
            total: row.total,
            status: row.status,
            time: row.time
        }));

        res.json(orders);
    });
});

// POST /api/orders
app.post('/api/orders', (req, res) => {
    const { id, items, total, status, time } = req.body;

    if (!id || !items) {
        return res.status(400).json({ error: 'Missing order details' });
    }

    db.run(
        'INSERT INTO orders (id, items_json, total, status, time) VALUES (?, ?, ?, ?, ?)',
        [id, JSON.stringify(items), total, status, time],
        function(err) {
            if (err) {
                console.error('Error inserting order:', err.message);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }
            res.json({ success: true, id: id });
        }
    );
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
