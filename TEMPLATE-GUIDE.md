# Template Guide — where everything lives

## 1. Identity & SEO
`src/config/site.config.ts` — name, studio, role, tagline, email, location,
start year, site URL, social links. The site title/description come from here.

## 2. Homepage copy
`src/components/sites/portfolio/content.json` → `home`
One HTML string, in page order: header/menu, hero, about, stats
(120+ projects), journey milestones (2015 / 2017 / 2021 / 2025),
"Beyond design" interests, services heading, work heading, the Spotlight
panel, and the contact finale (email, socials, footer links, © line).
Edit the text between tags; keep classes and `data-*` attributes as they are —
the scroll engine positions elements by them.

⚠️ The Copy-email button also hard-codes the address in
`src/components/sites/portfolio/scene.ts` (search for `@`) — change it there too.

## 3. Services
`content.json` → `services` — five services, each `[name, [sub-skills]]`.
They appear as the large floating names in the "What I do" scene and on `/services`.

## 4. Projects
`content.json` → `projects` — six projects. Each has:
`slug` (URL), `title`, `category`, `client`, `services`, `description`
(blank line = new paragraph), `cover`, `coverAr`, `images` (gallery),
`videos` (optional: `{src, after}` inserts a video into the gallery).
Images live in `public/sites/portfolio/projects/<slug>/`.
To add a project: copy a project object, change the slug, add a folder of
images. The homepage builds its work cards from this list automatically.
Keep six projects for the exact demo layout rhythm.

## 5. Info pages
`content.json` → `info` — `services`, `faq`, `for-businesses`, `for-agencies`.
Each is `{title, html}`. The URL is the key: rename a key to rename the route
(and update the footer links in `home`).

## 6. Images & video to replace first
- `public/sites/portfolio/img/pose0.webp` … `pose5.webp` — the about-section
  cutouts (transparent, tall). Replace with your own cutout photos, same names.
- `public/sites/portfolio/img/ht-can.webp`, `ht-ih.webp` — "Beyond design" cutouts.
- `public/sites/portfolio/img/spotlight-preview.mp4` — Spotlight panel video.
- Project covers/galleries (see §4).

## 7. Colors & type
`public/sites/portfolio/scene.css` `:root` — `--bg`, `--ink`, `--line`
(the blue line/accent), `--orange` (Spotlight panel), fonts.
`public/sites/portfolio/info.css` — info-page styling.

## 8. Deploy
Any Next.js host works (Vercel is one click: import the repo, deploy).
Set your real domain in `site.config.ts` (`url`) when you go live.
