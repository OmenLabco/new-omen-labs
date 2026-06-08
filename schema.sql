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
  subtotal REAL,
  shipping_cost REAL,
  shipping_method TEXT,
  discount REAL,
  crypto_discount REAL,
  affiliate_discount REAL,
  affiliate_code TEXT,
  commission REAL,
  points_earned INTEGER,
  points_redeemed INTEGER,
  points_value REAL,
  total REAL,
  payment_method TEXT,
  billing TEXT,          -- JSON billing address (or null = same as shipping)
  status TEXT DEFAULT 'processing',
  tracking_number TEXT,
  created_date TEXT
);

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  name TEXT,
  password_hash TEXT,
  points INTEGER DEFAULT 0,
  lifetime_spend REAL DEFAULT 0,
  membership TEXT,
  membership_expires TEXT,
  created_date TEXT
);

CREATE TABLE IF NOT EXISTS affiliates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE,
  name TEXT,
  email TEXT UNIQUE,
  password_hash TEXT,
  payout_info TEXT,
  created_date TEXT
);
