'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { isWebGLAvailable } from '@/lib/webgl'
import { acquireWebGLContext, releaseWebGLContext } from '@/lib/webgl-budget'
import { MOTION } from '@/lib/motion'

const MODEL_URL = '/models/studio-equipment.glb'
const BONE = 0xdfd7c5
const EMBER = 0xbe4c00

/**
 * Ghosted photographic props scattered down the page, drifting on scroll.
 *
 * One shared, fixed, full-viewport WebGL canvas holds every prop — browsers cap
 * live WebGL contexts (~8–16) and the site already spends a few, so giving each
 * prop its own canvas would exhaust the budget. All 20 meshes in the GLB share a
 * single material/texture, so a single scene with many objects is cheap.
 *
 * Each prop is anchored to a fraction of the document height and tracks scroll
 * at its own parallax speed, so the field reads as quiet studio atmosphere
 * passing behind the editorial content rather than a 3D showroom.
 *
 * `node` is the exact GLB node name (the descriptive parent of each mesh).
 * `xFrac` is horizontal position as a fraction of the half-viewport-width
 * (edge-biased so props never crowd the centred text). `anchor` is the prop's
 * centre as a fraction of total document height. `speed` is its scroll parallax
 * multiplier (<1 drifts slower/further, >1 faster/nearer). `op` is its opacity.
 */
interface PropConfig {
  node: string
  xFrac: number
  anchor: number
  scale: number
  op: number
  speed: number
  tint?: number
}

// Left-side props (negative xFrac) sit over imagery and carry more presence;
// right-side props (positive xFrac) drift over the body-text column, so they're
// kept fainter and pushed further out to never fight legibility.
const PROPS: PropConfig[] = [
  { node: 'Camera.02_0',   xFrac:  0.84, anchor: 0.06, scale: 1.1,  op: 0.20, speed: 1.15 },
  { node: 'Um.Flash.01_16',xFrac: -0.78, anchor: 0.15, scale: 1.25, op: 0.30, speed: 0.80 },
  { node: 'SoftBox.01_15', xFrac:  0.88, anchor: 0.24, scale: 1.3,  op: 0.18, speed: 0.90 },
  { node: 'Flash.02_4',    xFrac: -0.70, anchor: 0.33, scale: 0.82, op: 0.34, speed: 1.22 },
  { node: 'SoftBox.02_2',  xFrac:  0.90, anchor: 0.42, scale: 1.25, op: 0.16, speed: 0.74 },
  { node: 'Camera.01_19',  xFrac: -0.68, anchor: 0.50, scale: 1.05, op: 0.36, speed: 1.10 },
  { node: 'Um.Flash.02_1', xFrac:  0.86, anchor: 0.58, scale: 1.2,  op: 0.18, speed: 0.85 },
  { node: 'Flash.01_13',   xFrac: -0.74, anchor: 0.66, scale: 0.85, op: 0.32, speed: 1.25 },
  { node: 'SoftBox.03_3',  xFrac:  0.88, anchor: 0.74, scale: 1.25, op: 0.17, speed: 0.80 },
  { node: 'Red Light_14',  xFrac: -0.66, anchor: 0.80, scale: 0.95, op: 0.40, speed: 1.0, tint: EMBER },
  { node: 'Flash.03_5',    xFrac:  0.84, anchor: 0.86, scale: 0.82, op: 0.20, speed: 1.15 },
  { node: 'Ladder_17',     xFrac: -0.82, anchor: 0.90, scale: 1.35, op: 0.18, speed: 0.70 },
  { node: 'Flash.04_12',   xFrac:  0.80, anchor: 0.95, scale: 0.85, op: 0.22, speed: 1.05 },
]

const TARGET_RADIUS = 1.3 // world units each prop is normalised to before its per-prop scale

interface LiveProp {
  mesh: THREE.Mesh
  cfg: PropConfig
  phase: number
  dir: number
}

export default function StudioPropsField() {
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = wrapperRef.current
    if (!container) return
    if (!isWebGLAvailable()) return

    // Decorative-only: stand down for users who asked for reduced motion, on
    // touch / coarse pointers, and on narrow viewports (perf + the overlay would
    // crowd small screens).
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const coarse = window.matchMedia('(pointer: coarse)').matches
    if (reduceMotion || coarse || window.innerWidth < 768) return
    if (!acquireWebGLContext()) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.set(0, 0, 12)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(renderer.domElement)

    // Soft, form-revealing light. No environment map — keeps the ghosts matte
    // and cheap rather than glossy studio renders.
    scene.add(new THREE.AmbientLight(0xffffff, 0.75))
    const key = new THREE.DirectionalLight(0xfff2dc, 1.2)
    key.position.set(2, 3, 4)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0x9fb6c8, 0.5)
    rim.position.set(-3, 1, -2)
    scene.add(rim)

    const propsGroup = new THREE.Group()
    scene.add(propsGroup)

    // Viewport → world mapping (recomputed on resize). vH/vW are the half-extent
    // of the camera frustum at z = 0, in world units.
    let winW = window.innerWidth
    let winH = window.innerHeight
    let docH = document.documentElement.scrollHeight
    let vH = Math.tan((camera.fov * Math.PI) / 180 / 2) * camera.position.z
    let vW = vH * (winW / winH)

    const live: LiveProp[] = []
    let disposed = false
    let frame = 0

    const loader = new GLTFLoader()
    loader.load(
      MODEL_URL,
      (gltf) => {
        if (disposed) return
        gltf.scene.updateMatrixWorld(true)

        // Index meshes by their descriptive parent-node name.
        const byNode = new Map<string, THREE.Mesh>()
        gltf.scene.traverse((obj) => {
          const mesh = obj as THREE.Mesh
          if (mesh.isMesh && mesh.parent?.name) byNode.set(mesh.parent.name, mesh)
        })

        PROPS.forEach((cfg, i) => {
          const src = byNode.get(cfg.node)
          if (!src) return

          // Bake the source world transform into a fresh geometry, then recentre
          // and normalise to TARGET_RADIUS so every prop reads at a comparable
          // size regardless of its native scale in the GLB.
          const geo = src.geometry.clone()
          geo.applyMatrix4(src.matrixWorld)
          geo.computeBoundingSphere()
          const sph = geo.boundingSphere!
          geo.translate(-sph.center.x, -sph.center.y, -sph.center.z)
          const norm = TARGET_RADIUS / Math.max(sph.radius, 1e-4)

          const mat = new THREE.MeshStandardMaterial({
            color: cfg.tint ?? BONE,
            roughness: 0.9,
            metalness: 0.05,
            transparent: true,
            opacity: cfg.op,
            depthWrite: false, // low-opacity ghosts shouldn't z-fight against each other
          })

          const mesh = new THREE.Mesh(geo, mat)
          mesh.scale.setScalar(norm * cfg.scale)
          // A pleasant static three-quarter base tilt; drift is added per frame.
          mesh.rotation.set(-0.15 + (i % 3) * 0.05, 0.6 + (i % 5) * 0.25, 0)
          propsGroup.add(mesh)

          live.push({ mesh, cfg, phase: i * 1.7, dir: i % 2 === 0 ? 1 : -1 })
        })
      },
      undefined,
      (err) => console.error('[StudioPropsField] GLTF load failed', err),
    )

    const place = (lp: LiveProp, scrollY: number, t: number) => {
      const { mesh, cfg } = lp
      // Screen offset (px, down-positive) of the prop's centre, with parallax.
      const screenPx = cfg.anchor * docH - winH / 2 - scrollY * cfg.speed
      mesh.position.x = cfg.xFrac * vW
      mesh.position.y = -(screenPx / winH) * (2 * vH)
      mesh.position.z = 0
      // Barely-there life: slow yaw drift + a shallow pitch breath.
      mesh.rotation.y += 0.0012 * lp.dir
      mesh.rotation.x = -0.15 + Math.sin(t * 0.3 + lp.phase) * 0.05
    }

    let lastT = performance.now()
    const tick = () => {
      const now = performance.now()
      const t = now / 1000
      lastT = now
      const scrollY = window.scrollY || window.pageYOffset || 0
      for (const lp of live) place(lp, scrollY, t)
      renderer.render(scene, camera)
      frame = requestAnimationFrame(tick)
    }

    const start = () => {
      if (!frame) frame = requestAnimationFrame(tick)
    }
    const stop = () => {
      if (frame) cancelAnimationFrame(frame)
      frame = 0
    }
    start()

    // Pause when the tab is hidden — nothing to animate off-screen.
    const onVisibility = () => (document.hidden ? stop() : start())
    document.addEventListener('visibilitychange', onVisibility)

    const recompute = () => {
      winW = window.innerWidth
      winH = window.innerHeight
      docH = document.documentElement.scrollHeight
      camera.aspect = winW / winH
      camera.updateProjectionMatrix()
      renderer.setSize(winW, winH)
      vH = Math.tan((camera.fov * Math.PI) / 180 / 2) * camera.position.z
      vW = vH * (winW / winH)
    }
    window.addEventListener('resize', recompute)
    // Document height grows as images/sections settle — keep the mapping honest.
    const ro = new ResizeObserver(recompute)
    ro.observe(document.body)

    return () => {
      disposed = true
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('resize', recompute)
      ro.disconnect()
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh
        if (mesh.isMesh) {
          mesh.geometry?.dispose()
          const mat = mesh.material as THREE.Material | THREE.Material[]
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
          else mat?.dispose()
        }
      })
      renderer.dispose()
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
      releaseWebGLContext()
    }
  }, [])

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      className="fixed inset-0 z-[40] pointer-events-none overflow-hidden"
    />
  )
}
