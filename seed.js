const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const db = new sqlite3.Database('database.sqlite', (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
        process.exit(1);
    }
    console.log('Connected to the SQLite database for seeding.');
});

// Read the menu_data.json file
const jsonContent = fs.readFileSync('menu_data.json', 'utf8');

// Ensure proper syntax for parsing (using eval since it's an object literal string from JS code without strict JSON formatting)
let menuData;
try {
    eval('menuData = ' + jsonContent);
} catch (e) {
    console.error("Error parsing menuData from JSON file:", e);
    process.exit(1);
}

db.serialize(() => {
    // Drop existing tables if they exist to start fresh
    db.run("DROP TABLE IF EXISTS menu");
    db.run("DROP TABLE IF EXISTS orders");

    // Create menu table
    db.run(`CREATE TABLE menu (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT,
        n TEXT,
        p INTEGER,
        img TEXT,
        available BOOLEAN DEFAULT 1
    )`);

    // Create orders table
    db.run(`CREATE TABLE orders (
        id INTEGER PRIMARY KEY,
        items_json TEXT,
        total INTEGER,
        status TEXT,
        time TEXT
    )`);

    // Prepare statement for inserting menu items
    const stmt = db.prepare("INSERT INTO menu (category, n, p, img, available) VALUES (?, ?, ?, ?, ?)");

    // Insert data into menu table
    let count = 0;
    Object.keys(menuData).forEach(category => {
        menuData[category].forEach(item => {
            stmt.run(category, item.n, item.p, item.img, item.available !== false ? 1 : 0);
            count++;
        });
    });

    stmt.finalize();
    console.log(`Successfully seeded database with ${count} menu items.`);
});

db.close();
