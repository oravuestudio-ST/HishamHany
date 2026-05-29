# Hisham Hany — Portfolio Website

Cinematic Next.js portfolio. Fashion, editorial, luxury.

## Getting Started

```bash
cd hisham-hany-portfolio
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Stack
- **Next.js 14** — App Router
- **GSAP + ScrollTrigger** — All scroll and reveal animations
- **Lenis** — Momentum smooth scrolling
- **Framer Motion** — Micro-interactions
- **Tailwind CSS** — Utility styling
- **Cormorant Garamond** — Serif editorial headings
- **Inter** — Clean sans-serif body

## Structure
```
app/
  layout.tsx       # Fonts, metadata, grain overlay
  globals.css      # Design tokens, animations
  page.tsx         # Main page — loader + all sections

components/
  SmoothScroll.tsx # Lenis wrapper
  Cursor.tsx       # Custom cinematic cursor
  Loader.tsx       # Cinematic intro sequence
  Navigation.tsx   # Transparent header + fullscreen menu
  Hero.tsx         # Fullscreen hero with parallax
  Portfolio.tsx    # Filterable project grid
  About.tsx        # Split layout with sticky image
  Services.tsx     # Hover-reveal service cards
  Testimonials.tsx # Brand marquee + testimonial cards
  Contact.tsx      # Cinematic contact form
```

## Replace your images
See `IMAGES.md` for a full guide on swapping placeholder images with your work.

## Build for production
```bash
npm run build
npm start
```
