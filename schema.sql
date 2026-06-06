-- Cloudflare D1 schema for Omen Labs orders
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT UNIQUE,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  address TEXT,
  address2 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT,
  notes TEXT,
  items TEXT,            -- JSON array of line items
  total REAL,
  status TEXT DEFAULT 'processing',
  tracking_number TEXT,
  created_date TEXT
);
