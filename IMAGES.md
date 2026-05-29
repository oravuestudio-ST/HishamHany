# Image Replacement Guide

All placeholder images come from Unsplash. Replace them with your own work by editing each component.

---

## Hero Section
**File:** `components/Hero.tsx` — line ~55  
**Current:** `https://images.unsplash.com/photo-1509631179647-0177331693ae`  
**Replace with:** Your best full-bleed cinematic image (landscape, min 1800px wide)  
**Tip:** Dark or moody image works best — the overlay does the rest

---

## Portfolio Grid
**File:** `components/Portfolio.tsx` — the `projects` array (~lines 16–60)  
Each project has an `image` field. Replace all 6 with your work:

| ID | Title               | Suggested category |
|----|---------------------|--------------------|
| 1  | Silhouette Studies  | Fashion (portrait) |
| 2  | Void & Light        | Editorial (landscape)|
| 3  | Golden Hour         | Portraits          |
| 4  | Architectural Body  | Fashion            |
| 5  | Urban Decay         | Commercial         |
| 6  | Raw Elegance        | Editorial          |

To use local images, copy them to `public/images/` and use `/images/yourfile.jpg` as the src.  
Also update `title`, `client`, `year`, and `category` fields to match your real projects.

---

## About Section
**File:** `components/About.tsx` — line ~117  
**Current:** `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d`  
**Replace with:** A portrait of you — editorial or atmospheric

---

## Using local images
Place files in `public/images/` and reference them as:
```tsx
src="/images/your-photo.jpg"
```
Remove the `remotePatterns` in `next.config.js` if you move fully to local images.

---

## Updating content

### Stats (About section)
Edit the `stats` array in `components/About.tsx`

### Testimonials
Edit the `testimonials` array in `components/Testimonials.tsx`

### Brand names in marquee
Edit the `brands` array in `components/Testimonials.tsx`

### Services
Edit the `services` array in `components/Services.tsx`

### Contact email
Edit `components/Contact.tsx` — the footer email line
