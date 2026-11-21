# ScrollFolio — Scroll-Driven Portfolio Template

A portfolio template for **any creative freelancer** — designers, photographers,
web creatives, videographers, illustrators, motion artists and studios.

Instead of a normal scrolling page, visitors fly through your work along a
drawn line: hero → about → stats → journey → services → selected work →
contact, with a numbered progress
rail (01 Home → 08 Contact) tracking the whole trip. Project pages open as
full-screen panels with a sticky info column and a scrolling gallery.

Built with Next.js 16, React 19, TypeScript and Tailwind CSS v4.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
npm run check      # lint + typecheck + production build
```

Requires Node 24 (see .nvmrc).

## Make it yours

Read **TEMPLATE-GUIDE.md** — it maps every piece of content to the file that
controls it. In short:

1. `src/config/site.config.ts` — your name, role, email, tagline, socials (SEO metadata).
2. `src/components/sites/portfolio/content.json` — all page copy, services,
   projects and info pages (`/services`, `/faq`, `/for-businesses`, `/for-agencies`).
3. `public/sites/portfolio/projects/<slug>/` — project cover + gallery images
   (the included ones are generated placeholders — drop in your real work).
4. `public/sites/portfolio/img/` — abstract art frames (`pose0–5.webp`), spray-can
   and palette cutouts, and a sample gallery video.

The demo persona is **Alex Carter**, a fictional creative freelancer, and all
six demo projects (Lumen Café, North Peak, Pulse Studio, Atlas Journal, Bloom
Skincare, Echo Live) are fictional with placeholder imagery — everything is
safe to publish as-is and easy to replace.

## Routes

| Route | What it is |
| --- | --- |
| `/` | Scroll-driven homepage |
| `/projects/[slug]` | Project panel (sticky details + gallery) |
| `/services`, `/faq` | Info pages |
| `/for-businesses`, `/for-agencies` | Landing pages to pitch two audiences |

## Notes

- The scroll engine (`src/components/sites/portfolio/scene.ts`) is delicate by
  design — it projects every section from scroll position. Edit copy and
  images freely; change section structure only if you are comfortable in code.
- Fonts in `public/sites/portfolio/gfonts/` are Google Fonts (open license).
  The display font is Bebas Neue (free, open license) in `public/sites/portfolio/fonts/`.
