export const escapeHTML = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

export function formatMoney(cents, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style:'currency', currency, minimumFractionDigits:0, maximumFractionDigits:2 }).format(cents / 100);
}
