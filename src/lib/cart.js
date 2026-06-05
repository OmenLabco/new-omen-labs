const CART_KEY = 'omenlabs_cart';

function readCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export const cart = {
  list() {
    return readCart();
  },

  add({ product_id, product_name, quantity, price }) {
    const items = readCart();
    const existing = items.find((i) => i.product_id === product_id);
    if (existing) {
      existing.quantity += quantity;
      existing.price = price; // update price in case discount tier changed
    } else {
      items.push({
        id: `${product_id}_${Date.now()}`,
        product_id,
        product_name,
        quantity,
        price,
      });
    }
    writeCart(items);
    return items;
  },

  update(id, { quantity }) {
    const items = readCart();
    const item = items.find((i) => i.id === id);
    if (item) item.quantity = quantity;
    writeCart(items);
    return items;
  },

  remove(id) {
    const items = readCart().filter((i) => i.id !== id);
    writeCart(items);
    return items;
  },

  clear() {
    writeCart([]);
  },
};
