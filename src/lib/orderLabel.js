// Draw a compact packing label for an order and download it as a PNG the owner
// can import into the Niimbot app (5:3 aspect ≈ a 50×30mm label). No deps — it's
// all Canvas 2D, so "one click → label.png" works entirely in the browser.
export function downloadOrderLabel(order) {
  if (!order) return;
  const W = 600, H = 360;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const x = cv.getContext('2d');

  // Card
  x.fillStyle = '#ffffff';
  x.fillRect(0, 0, W, H);
  x.strokeStyle = '#0b1220';
  x.lineWidth = 6;
  x.strokeRect(9, 9, W - 18, H - 18);

  x.fillStyle = '#0b1220';
  x.textBaseline = 'alphabetic';

  // Header: brand (left) + date (right)
  x.font = '800 26px Arial, sans-serif';
  x.fillText('OMEN LABS', 28, 52);
  const d = order.created_date || order.created_at || order.date;
  if (d) {
    const dt = new Date(d);
    if (!isNaN(dt)) {
      x.font = '15px Arial, sans-serif';
      x.textAlign = 'right';
      x.fillText(dt.toLocaleDateString(), W - 28, 50);
      x.textAlign = 'left';
    }
  }

  // Divider
  x.strokeStyle = '#0b1220';
  x.lineWidth = 2;
  x.beginPath(); x.moveTo(28, 66); x.lineTo(W - 28, 66); x.stroke();

  // Order number (big) + customer
  x.font = '800 42px Arial, sans-serif';
  x.fillText(String(order.order_number || `#${order.id ?? ''}`), 28, 116);
  x.font = '20px Arial, sans-serif';
  x.fillText(String(order.customer_name || order.customer_email || '').slice(0, 34), 28, 146);

  // Items (up to 5 lines)
  const items = Array.isArray(order.items) ? order.items : [];
  x.font = '19px Arial, sans-serif';
  let y = 184;
  for (const it of items.slice(0, 5)) {
    const name = it.product_name || it.name || it.product_id || '';
    x.fillText(`${String(name).slice(0, 34)}  ×${it.quantity || 1}`, 28, y);
    y += 27;
  }
  if (items.length > 5) { x.fillText(`+${items.length - 5} more…`, 28, y); }

  // Footer: total (left) + status (right)
  x.font = '800 24px Arial, sans-serif';
  const total = Number(order.total);
  if (!isNaN(total)) x.fillText(`$${total.toFixed(2)}`, 28, H - 30);
  const status = String(order.status || '').replace(/_/g, ' ');
  if (status) {
    x.font = '15px Arial, sans-serif';
    x.textAlign = 'right';
    x.fillText(status.toUpperCase(), W - 28, H - 32);
    x.textAlign = 'left';
  }

  const a = document.createElement('a');
  a.href = cv.toDataURL('image/png');
  a.download = `label-${order.order_number || order.id || 'order'}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
