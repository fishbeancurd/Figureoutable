# Pawgress website

A single-page promo site for the app: animated hero with real app screens, feature tabs, a "Can my dog eat this?" checker, a puppy needs calculator (same formulas as the app), an XP mini game, life stages, FAQ and download links.

It's plain HTML, CSS and JavaScript with no build step. Open `index.html` in a browser to preview.

## Before launch

- Replace the App Store and Google Play placeholders: the two `.store` links in the hero and in the download section have `href="#download"` and `aria-disabled="true"`. Swap in the real store URLs and remove `aria-disabled` and the "Soon" labels. Use the official store badges from Apple and Google once the app is listed.
- Add real privacy policy and terms pages, then link them in the footer.
- Refresh `assets/*.webp` screenshots when the app changes.

## Hosting

Any static host works: upload the `website` folder as is.

- **Netlify or Cloudflare Pages:** drag and drop the folder, or point it at this repo with `website` as the publish directory.
- **GitHub Pages:** publish from a branch with the site at the root or in `/docs`.
