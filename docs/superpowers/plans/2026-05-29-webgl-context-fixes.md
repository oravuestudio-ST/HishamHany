# WebGL Context Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix three console issues found during smoke testing: too many WebGL contexts (dev StrictMode artifact), THREE.Clock deprecation, and favicon.ico 404.

**Architecture:** Extract the per-component WebGL availability probe into a module-level singleton (`lib/webgl.ts`) so it runs once per page load instead of once per component mount. Wrap `WebGLImage`'s renderer init in an `IntersectionObserver` so contexts are only created when cards are in the viewport. Replace deprecated `THREE.Clock` with `THREE.Timer` in `WebGLHero`. Add a minimal ICO to eliminate the favicon 404.

**Tech Stack:** Three.js r184, TypeScript, Next.js 14 App Router, IntersectionObserver API

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `lib/webgl.ts` | Module-level singleton WebGL availability check |
| Modify | `components/WebGLHero.tsx` | Use `isWebGLAvailable()`, replace `THREE.Clock` → `THREE.Timer` |
| Modify | `components/WebGLImage.tsx` | Use `isWebGLAvailable()`, IntersectionObserver lazy init |
| Create | `scripts/gen-favicon.mjs` | One-shot: generates minimal ICO |
| Create | `app/favicon.ico` | Eliminates the 404 |

---

## Task 1: Create `lib/webgl.ts`

**Files:**
- Create: `lib/webgl.ts`

- [ ] **Step 1: Create the file**

```ts
let _webglAvailable: boolean | null = null

export function isWebGLAvailable(): boolean {
  if (_webglAvailable !== null) return _webglAvailable
  const probe = document.createElement('canvas')
  _webglAvailable = !!(probe.getContext('webgl') || probe.getContext('experimental-webgl'))
  return _webglAvailable
}
```

The probe canvas is created once, the boolean is cached in module scope. Subsequent calls return the cached value immediately. The probe canvas is GC'd after this function returns — no context is held.

- [ ] **Step 2: Verify TypeScript accepts the file**

```bash
cd "Hisham Hany - shader/Hisham Hany - Shader/hisham-hany-portfolio"
npx tsc --noEmit 2>&1 | grep "lib/webgl" | head -10
```

Expected: no output (no errors referencing the new file).

---

## Task 2: Update `components/WebGLHero.tsx`

**Files:**
- Modify: `components/WebGLHero.tsx`

Two changes: swap the inline probe for `isWebGLAvailable()`, and replace `THREE.Clock` with `THREE.Timer`.

- [ ] **Step 1: Replace the import line and add `isWebGLAvailable`**

Replace:
```ts
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
```

With:
```ts
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { isWebGLAvailable } from '@/lib/webgl'
```

- [ ] **Step 2: Remove the inline probe block and replace with `isWebGLAvailable()`**

Replace:
```ts
    // WebGL availability check
    const probe = document.createElement('canvas')
    const probeCtx = probe.getContext('webgl') || probe.getContext('experimental-webgl')
    if (!probeCtx) return
```

With:
```ts
    if (!isWebGLAvailable()) return
```

- [ ] **Step 3: Replace `THREE.Clock` with `THREE.Timer`**

Replace:
```ts
    const clock = new THREE.Clock()

    const animate = (now: number) => {
      rafId = requestAnimationFrame(animate)
      if (now - lastTime < INTERVAL) return
      lastTime = now
      uniforms.uTime.value = clock.getElapsedTime()
      renderer.render(scene, camera)
    }
```

With:
```ts
    const timer = new THREE.Timer()

    const animate = (now: number) => {
      rafId = requestAnimationFrame(animate)
      if (now - lastTime < INTERVAL) return
      lastTime = now
      timer.update()
      uniforms.uTime.value = timer.getElapsed()
      renderer.render(scene, camera)
    }
```

`timer.update()` must be called once per rendered frame before reading `getElapsed()`. It internally calls `performance.now()`.

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep -i "webglhero\|error" | head -10
```

Expected: no errors referencing `WebGLHero.tsx`.

---

## Task 3: Update `components/WebGLImage.tsx`

**Files:**
- Modify: `components/WebGLImage.tsx`

Two changes: swap the inline probe for `isWebGLAvailable()`, and wrap the renderer init in an `IntersectionObserver` so contexts are created only when cards enter the viewport.

- [ ] **Step 1: Add the `isWebGLAvailable` import**

Replace:
```ts
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap'
```

With:
```ts
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { isWebGLAvailable } from '@/lib/webgl'
```

- [ ] **Step 2: Extract the renderer body into a standalone `initRenderer` function**

Above the `export default function WebGLImage` line, add the following function. It contains the exact same renderer logic that is currently inside `useEffect`, extracted verbatim, with the early-exit guards removed (those now live in `useEffect`). It returns a cleanup callback.

```ts
function initRenderer(el: HTMLDivElement, src: string): () => void {
  let mounted = true
  let rafId: number
  let isHovering = false

  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  renderer.setSize(el.clientWidth, el.clientHeight)
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;'
  el.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

  const uniforms = {
    uTexture:      { value: null as THREE.Texture | null },
    uDisplacement: { value: null as THREE.Texture | null },
    uHover:        { value: 0 },
    uMouse:        { value: new THREE.Vector2(0.5, 0.5) },
  }

  const material = new THREE.ShaderMaterial({
    vertexShader, fragmentShader, uniforms, transparent: true,
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
  scene.add(mesh)

  const loader = new THREE.TextureLoader()
  Promise.all([
    new Promise<THREE.Texture>((res) => loader.load(src, res)),
    getDisplacementTexture(),
  ]).then(([tex, disp]) => {
    if (!mounted) return
    tex.minFilter = THREE.LinearFilter
    uniforms.uTexture.value = tex
    if (disp) uniforms.uDisplacement.value = disp
  })

  const loop = () => {
    if (!isHovering && uniforms.uHover.value <= 0.001) return
    rafId = requestAnimationFrame(loop)
    renderer.render(scene, camera)
  }

  const onEnter = () => {
    isHovering = true
    gsap.to(uniforms.uHover, { value: 1, duration: 0.4, ease: 'power2.out' })
    cancelAnimationFrame(rafId)
    loop()
  }
  const onLeave = () => {
    isHovering = false
    gsap.to(uniforms.uHover, {
      value: 0, duration: 0.6, ease: 'power2.in',
      onComplete: () => renderer.render(scene, camera),
    })
  }
  const onMove = (e: PointerEvent) => {
    const rect = el.getBoundingClientRect()
    uniforms.uMouse.value.set(
      (e.clientX - rect.left) / rect.width,
      1 - (e.clientY - rect.top) / rect.height,
    )
  }

  el.addEventListener('pointerenter', onEnter)
  el.addEventListener('pointerleave', onLeave)
  el.addEventListener('pointermove', onMove)

  const handleResize = () => renderer.setSize(el.clientWidth, el.clientHeight)
  window.addEventListener('resize', handleResize)

  return () => {
    mounted = false
    cancelAnimationFrame(rafId)
    el.removeEventListener('pointerenter', onEnter)
    el.removeEventListener('pointerleave', onLeave)
    el.removeEventListener('pointermove', onMove)
    window.removeEventListener('resize', handleResize)
    material.dispose()
    mesh.geometry.dispose()
    renderer.dispose()
    if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
  }
}
```

- [ ] **Step 3: Replace the `useEffect` body with the IntersectionObserver pattern**

Replace the entire `useEffect(() => { ... }, [src])` block with:

```ts
  useEffect(() => {
    const el = mountRef.current
    if (!el || !isWebGLAvailable() || navigator.hardwareConcurrency < 4) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let cleanup: (() => void) | null = null

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!cleanup) cleanup = initRenderer(el, src)
        } else {
          cleanup?.()
          cleanup = null
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )

    observer.observe(el)

    return () => {
      observer.disconnect()
      cleanup?.()
    }
  }, [src])
```

`threshold: 0.1` fires when 10% of the card is visible. `rootMargin: '100px'` pre-warms 100px before the card enters — the texture loads before the user sees it.

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep -i "webglimage\|error" | head -10
```

Expected: no errors referencing `WebGLImage.tsx`.

---

## Task 4: Add `app/favicon.ico`

**Files:**
- Create: `scripts/gen-favicon.mjs`
- Create: `app/favicon.ico`

- [ ] **Step 1: Create the generator script**

Create `scripts/gen-favicon.mjs`:

```js
import { writeFileSync } from 'fs'

// Minimal 1×1 24-bit ICO in ebony (#0f0f10)
const ico = Buffer.from([
  // ICO header (6 bytes)
  0x00, 0x00,             // reserved
  0x01, 0x00,             // type: 1 = ICO
  0x01, 0x00,             // image count: 1
  // Image directory entry (16 bytes)
  0x01,                   // width: 1px
  0x01,                   // height: 1px
  0x00,                   // color count: 0 = true color
  0x00,                   // reserved
  0x01, 0x00,             // planes: 1
  0x18, 0x00,             // bit count: 24
  0x30, 0x00, 0x00, 0x00, // bytes in resource: 48
  0x16, 0x00, 0x00, 0x00, // image data offset: 22
  // BITMAPINFOHEADER (40 bytes)
  0x28, 0x00, 0x00, 0x00, // header size: 40
  0x01, 0x00, 0x00, 0x00, // width: 1
  0x02, 0x00, 0x00, 0x00, // height: 2 (×2 required by ICO format)
  0x01, 0x00,             // planes: 1
  0x18, 0x00,             // bit count: 24
  0x00, 0x00, 0x00, 0x00, // compression: none
  0x04, 0x00, 0x00, 0x00, // image data size: 4 bytes
  0x00, 0x00, 0x00, 0x00, // x pixels/meter
  0x00, 0x00, 0x00, 0x00, // y pixels/meter
  0x00, 0x00, 0x00, 0x00, // colors used
  0x00, 0x00, 0x00, 0x00, // important colors
  // XOR image: BGR pixel for #0f0f10 + 1 byte row padding (rows must be 4-byte aligned)
  0x10, 0x0f, 0x0f, 0x00,
  // AND mask: 4 bytes, all 0x00 = fully opaque
  0x00, 0x00, 0x00, 0x00,
])

writeFileSync('app/favicon.ico', ico)
console.log('Generated app/favicon.ico (' + ico.length + ' bytes)')
```

- [ ] **Step 2: Run the script**

```bash
node scripts/gen-favicon.mjs
```

Expected output: `Generated app/favicon.ico (70 bytes)`

- [ ] **Step 3: Verify the file exists**

```bash
file app/favicon.ico
ls -lh app/favicon.ico
```

Expected: file size 70 bytes.

---

## Task 5: Smoke test

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Open `http://localhost:3000`.

- [ ] **Step 2: Check the console**

Open DevTools → Console. Verify:

1. `THREE.Clock: This module has been deprecated` — **gone**
2. `WARNING: Too many active WebGL contexts` — **gone or significantly reduced** (≤1 in a clean load)
3. `THREE.WebGLRenderer: A WebGL context could not be created` — **gone**
4. `favicon.ico` 404 — **gone**

- [ ] **Step 3: Confirm effects still work**

- Hero atmosphere still animates (canvas present behind hero text)
- Portfolio cards still render images on scroll
- Distortion still fires on card hover
- Chromatic aberration still activates on all headings

- [ ] **Step 4: Commit**

```bash
git add lib/webgl.ts components/WebGLHero.tsx components/WebGLImage.tsx app/favicon.ico scripts/gen-favicon.mjs
git commit -m "fix: eliminate WebGL context explosion, THREE.Clock deprecation, favicon 404"
```

---

## Self-Review

**Spec coverage:**
- Too many WebGL contexts → Task 1 (singleton probe) + Task 3 (IntersectionObserver lazy init) ✓
- THREE.Clock deprecation → Task 2 Step 3 ✓
- favicon.ico 404 → Task 4 ✓

**Placeholder scan:** No TBD or TODO markers. All code blocks complete. ✓

**Type consistency:**
- `isWebGLAvailable` defined in Task 1, imported identically in Tasks 2 and 3 ✓
- `initRenderer(el: HTMLDivElement, src: string): () => void` defined in Task 3 Step 2, called in Task 3 Step 3 ✓
- `cleanup: (() => void) | null` matches the return type of `initRenderer` ✓
