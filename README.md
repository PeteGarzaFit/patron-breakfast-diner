# Patron Breakfast Diner: website

A static site with no build step and no dependencies. Upload the folder to any host (Netlify drag-and-drop, GitHub Pages, cPanel, or GoDaddy file manager).

```
index.html   page markup and SEO/schema data
styles.css   design tokens, layout and animations
main.js      interactions (vanilla JS, about 9 KB)
img/         optimized photos (800w + 1400w versions)
```

## Before launch

1. **Online ordering link:** set `ORDER_URL` at the top of `main.js`. Until it's set, every "Order" button calls the diner.
2. **Menu:** the items in `index.html` (search for `NOTE: Menu items`) were drafted from the old site's description and photos. Confirm the dishes with the owner, and add prices if wanted.
3. **Hours:** the site assumes every day, 7am–3pm (Central Time). If that's wrong, update `OPEN_HOUR` and `CLOSE_HOUR` in `main.js`, the hours text in `index.html`, and the JSON-LD block in `<head>`.
4. **Photos:** the site uses the 8 photos from the current GoDaddy site. You can swap in better shots with the same file names. Landscape photos should be 4:3, and `sign-*` is portrait.

## Motion

- Hero: the sun rises, the waves drift, the headline slides up line by line, and the photo reveals inside an arch.
- Scroll: sections fade and rise in with a stagger, and the sign and catering photos have a light parallax.
- Menu: the tab indicator slides and the items cascade in.
- Mobile: the menu opens in an expanding circle, and a quick bar with Call / Order / Directions appears once you scroll.

All motion uses only transform/opacity and pauses when off screen. With the OS "Reduce motion" setting on, it's switched off completely.
