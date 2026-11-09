import { headerMarkup } from '../components/header.js';
import { shopContactsMarkup } from '../components/shop-contacts.js';
import '../styles/home.css';

export async function mountHome(app, signal, { chrome=true }={}) {
  signal.throwIfAborted();
  app.innerHTML = `<section class="home" aria-labelledby="home-title">
    ${chrome ? '<div class="site-wall" aria-hidden="true"></div>' : ''}
    ${chrome ? headerMarkup('home') : ''}
    <div class="home-copy">
      <p class="home-eyebrow">PREMIUM SNEAKERS</p>
      <h1 id="home-title">NOVEX</h1>
      <p class="home-description">Curated sneakers for<br>a modern lifestyle.</p>
      <a class="home-shop-link" href="#/shop"><span>Shop Now</span><svg viewBox="0 0 32 24" fill="none" aria-hidden="true"><path d="M2 12h26M20 3l9 9-9 9"/></svg></a>
    </div>
    ${chrome ? shopContactsMarkup() : ''}
  </section>`;
  const root = app.querySelector('.home');
  root.dataset.ready = 'true';
}
