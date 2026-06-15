'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { isWebGLAvailable } from '@/lib/webgl'
import { acquireWebGLContext, releaseWebGLContext } from '@/lib/webgl-budget'

const MODEL_URL = '/models/spotlight.glb'

// Rest pose — where the spotlight points when the cursor is idle.
// The wrapper sits top-right of the hero; the headline sits bottom-left.
// So the barrel needs to angle down-and-to-the-left at rest.
const REST_YAW = -0.55 // ~31° toward the headline (negative = camera-left)
const REST_PITCH = -0.42 // ~24° downward toward the headline baseline

// Cursor adds a smaller delta on top of the rest pose, so the light
// reads as "aimed at the headline, but it notices you."
const YAW_CURSOR_RANGE = 0.35
const PITCH_CURSOR_RANGE = 0.25

// Floating motion — slow, low-amplitude bob/sway. Amplitudes are in the
// same units as the normalized model radius (targetRadius = 1), so 0.035
// = 3.5% of the spotlight's bounding radius.
const FLOAT_Y_AMP = 0.035
const FLOAT_X_AMP = 0.018
const FLOAT_ROLL_AMP = 0.025 // radians — barely perceptible barrel sway

export default function HeroSpotlight3D() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  // Cursor offset stored in normalized device coords (-1..1 each axis).
  // Resets to 0,0 when the cursor leaves the window — so the rest pose
  // reasserts itself instead of staying pinned at the last seen position.
  const aimRef = useRef({ x: 0, y: 0 })
  const [shouldMount, setShouldMount] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let idleHandle: number | null = null
    const trigger = () => setShouldMount(true)

    if (typeof window.requestIdleCallback === 'function') {
      idleHandle = window.requestIdleCallback(trigger, { timeout: 2500 })
    } else {
      timeoutId = setTimeout(trigger, 1500)
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      if (idleHandle !== null && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleHandle)
      }
    }
  }, [])

  // Cursor tracking — runs globally so the spotlight follows the cursor
  // even when it's over other parts of the page. When the cursor leaves
  // the window we ease back to 0,0 so the rest pose takes over.
  useEffect(() => {
    if (!shouldMount) return
    const onMove = (e: MouseEvent) => {
      aimRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
      aimRef.current.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    const onLeave = () => {
      aimRef.current.x = 0
      aimRef.current.y = 0
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseleave', onLeave)
    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
    }
  }, [shouldMount])

  useEffect(() => {
    if (!shouldMount) return
    const container = wrapperRef.current
    if (!container) return
    if (!isWebGLAvailable()) return
    if (!acquireWebGLContext()) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      35,
      container.clientWidth / container.clientHeight,
      0.01,
      10000,
    )

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.4
    container.appendChild(renderer.domElement)

    // PMREM-baked room environment — required for metal materials to read
    // as "metal" rather than pitch black. Three.js PBR needs reflections.
    const pmrem = new THREE.PMREMGenerator(renderer)
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture

    scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const key = new THREE.DirectionalLight(0xfff0d4, 2.5)
    key.position.set(3, 4, 4)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0x88a8c4, 1.4)
    rim.position.set(-4, 2, -3)
    scene.add(rim)
    const back = new THREE.DirectionalLight(0xffffff, 0.9)
    back.position.set(0, 1, -5)
    scene.add(back)

    const root = new THREE.Group()
    scene.add(root)

    // Start at the rest pose so the first paint is already aimed at the headline.
    let currentYaw = REST_YAW
    let currentPitch = REST_PITCH
    const startTime = performance.now()
    let frame = 0
    let lastTime = startTime
    let disposed = false

    const loader = new GLTFLoader()
    loader.load(
      MODEL_URL,
      (gltf) => {
        if (disposed) return
        const model = gltf.scene

        // Force-visible every mesh — defensive against models that ship
        // with hidden groups/layers from authoring tools.
        let meshCount = 0
        model.traverse((obj) => {
          obj.visible = true
          if ((obj as THREE.Mesh).isMesh) meshCount++
        })

        const box = new THREE.Box3().setFromObject(model)
        const sphere = new THREE.Sphere()
        box.getBoundingSphere(sphere)
        const targetRadius = 1
        const s = targetRadius / Math.max(sphere.radius, 1e-4)
        model.scale.setScalar(s)
        model.position.copy(sphere.center).multiplyScalar(-s)

        // The GLB's +Z is the throw direction. We want the spotlight body
        // facing the camera and the beam pointing away into the scene, so
        // flip the model 180° around Y. The cursor-driven rotations on
        // `root` then layer on top of this base orientation.
        model.rotation.y = Math.PI

        const fov = (camera.fov * Math.PI) / 180
        const aspect = container.clientWidth / container.clientHeight
        const distV = targetRadius / Math.sin(fov / 2)
        const distH = targetRadius / Math.sin(Math.atan(Math.tan(fov / 2) * aspect))
        const dist = Math.max(distV, distH) * 0.95

        camera.position.set(dist * 0.45, dist * 0.55, dist * 0.85)
        camera.lookAt(0, 0, 0)

        root.add(model)
        setReady(true)
        void meshCount
      },
      undefined,
      (err) => console.error('[HeroSpotlight] GLTF load failed', err),
    )

    const tick = () => {
      const now = performance.now()
      const dt = Math.min(0.05, (now - lastTime) / 1000)
      lastTime = now
      const elapsed = (now - startTime) / 1000 // seconds since mount

      // Rest pose + cursor delta. The cursor adds a smaller offset on top
      // of the rest pose so the spotlight reads as "aimed at the headline,
      // but it notices you" instead of being purely cursor-driven.
      const targetYaw = REST_YAW + aimRef.current.x * YAW_CURSOR_RANGE
      const targetPitch = REST_PITCH + aimRef.current.y * PITCH_CURSOR_RANGE

      if (!reduceMotion) {
        const k = 1 - Math.exp(-dt * 4) // critically-damped smoothing
        currentYaw += (targetYaw - currentYaw) * k
        currentPitch += (targetPitch - currentPitch) * k
      } else {
        currentYaw = targetYaw
        currentPitch = targetPitch
      }

      root.rotation.y = currentYaw
      root.rotation.x = currentPitch

      // Floating motion — slow bob/sway on the group. Frozen for users
      // with prefers-reduced-motion so the spotlight just sits at rest.
      if (!reduceMotion) {
        // Y bob ~7s period, X drift ~9.4s, gentle roll ~12s — incommensurate
        // periods keep the motion from ever repeating in a way you'd notice.
        root.position.y = Math.sin(elapsed * 0.9) * FLOAT_Y_AMP
        root.position.x = Math.sin(elapsed * 0.67 + 0.8) * FLOAT_X_AMP
        root.rotation.z = Math.sin(elapsed * 0.52 + 1.3) * FLOAT_ROLL_AMP
      } else {
        root.position.set(0, 0, 0)
        root.rotation.z = 0
      }

      renderer.render(scene, camera)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    const handleResize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      if (!w || !h) return
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    const ro = new ResizeObserver(handleResize)
    ro.observe(container)

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      ro.disconnect()
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh
          mesh.geometry?.dispose()
          const mat = mesh.material as THREE.Material | THREE.Material[]
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
          else mat?.dispose()
        }
      })
      pmrem.dispose()
      if (scene.environment) {
        (scene.environment as THREE.Texture).dispose()
        scene.environment = null
      }
      renderer.dispose()
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
      releaseWebGLContext()
    }
  }, [shouldMount])

  return (
    <div
      ref={wrapperRef}
      className="relative w-full h-full"
      aria-hidden="true"
      data-ready={ready}
      style={{ opacity: ready ? 1 : 0, transition: 'opacity 900ms ease-out' }}
    />
  )
}
