import { contacts } from '../data/contacts.js';

const telegramIcon = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M21.4 3.2 2.9 10.4c-.9.4-.9.9-.2 1.1l4.7 1.5 1.8 5.6c.2.6.4.7.8.3l2.6-2.5 4.8 3.5c.6.4 1 .2 1.2-.6l3-14.9c.2-1-.2-1.5-1.2-1.2ZM8.2 12.7l10.1-6.3c.5-.3.7-.1.3.2l-8.3 7.5-.4 3.6-1.7-5Z"/></svg>';
const instagramIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true" focusable="false"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.1"/><circle cx="17.5" cy="6.6" r="1" fill="currentColor" stroke="none"/></svg>';

function escapeAttribute(value) {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function socialURL(value, hosts) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !hosts.includes(url.hostname) || url.port || url.username || url.password || url.pathname === '/') return null;
    return url.href;
  } catch { return null; }
}

export function contactLinks(config = contacts) {
  const phone = typeof config.phone === 'string' ? config.phone.replace(/[\s().-]/g, '') : '';
  return {
    phone: /^\+[1-9]\d{6,14}$/.test(phone) ? `tel:${phone}` : null,
    telegram: socialURL(config.telegram, ['t.me', 'telegram.me']),
    instagram: socialURL(config.instagram, ['instagram.com', 'www.instagram.com']),
  };
}

function item(label, content, href, className = '') {
  const classes = `shop-contact-item ${className}`.trim();
  if (!href) return `<span class="${classes}" role="link" aria-disabled="true" aria-label="${label} — coming soon" title="${label} — coming soon">${content}</span>`;
  const external = href.startsWith('https:') ? ' target="_blank" rel="noopener noreferrer"' : '';
  return `<a class="${classes}" href="${escapeAttribute(href)}" aria-label="${label}"${external}>${content}</a>`;
}

export function shopContactsMarkup(config = contacts) {
  const links = contactLinks(config);
  return `<div class="shop-contact-zone" role="group" aria-label="NOVEX contacts">
    ${item('Contact', 'Contact', links.phone, 'shop-contact-phone')}
    <div class="shop-contact-socials">
      ${item('Telegram', telegramIcon, links.telegram)}
      ${item('Instagram', instagramIcon, links.instagram)}
    </div>
  </div>`;
}
