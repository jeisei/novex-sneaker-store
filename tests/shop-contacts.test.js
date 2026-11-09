import test from 'node:test';
import assert from 'node:assert/strict';
import { contactLinks, shopContactsMarkup } from '../src/components/shop-contacts.js';

test('empty contacts show three non-navigating placeholders', () => {
  const markup = shopContactsMarkup({ phone: '', telegram: '', instagram: '' });
  assert.equal((markup.match(/aria-disabled="true"/g) ?? []).length, 3);
  assert.doesNotMatch(markup, /href=|<a\s|tabindex=/);
  assert.match(markup, />Contact<\/span>/);
  assert.doesNotMatch(markup, /↗/);
  assert.match(markup, /aria-label="Telegram/);
  assert.match(markup, /aria-label="Instagram/);
});

test('configured contacts produce a phone link and secure social links', () => {
  // Synthetic fixtures for validation only; never used as project contacts.
  const config = { phone: '+1 (202) 555-0123', telegram: 'https://t.me/example', instagram: 'https://www.instagram.com/example/' };
  assert.deepEqual(contactLinks(config), {
    phone: 'tel:+12025550123', telegram: config.telegram, instagram: config.instagram,
  });
  const markup = shopContactsMarkup(config);
  assert.equal((markup.match(/target="_blank" rel="noopener noreferrer"/g) ?? []).length, 2);
  assert.doesNotMatch(markup, /aria-disabled/);
});

test('invalid or unrelated destinations remain placeholders instead of false links', () => {
  for (const config of [
    { phone: 'not supplied', telegram: 'javascript:alert(1)', instagram: 'https://example.com/profile' },
    { phone: '', telegram: 'http://t.me/example', instagram: 'https://instagram.com/' },
    { phone: '', telegram: 'https://t.me@evil.example/profile', instagram: 'https://instagram.com:444/profile' },
  ]) {
    assert.deepEqual(contactLinks(config), { phone: null, telegram: null, instagram: null });
    assert.doesNotMatch(shopContactsMarkup(config), /href=/);
  }
});
