'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { isWebGLAvailable } from '@/lib/webgl'
import { acquireWebGLContext, releaseWebGLContext } from '@/lib/webgl-budget'

const MODEL_URL = '/models/spotlight.glb'

// Default aim — slightly left and down, so on first paint the spotlight
// is already pointing toward the headline area (lower-left of the hero).
const DEFAULT_AIM = { x: -0.5, y: -0.3 }
const YAW_RANGE = 0.6 // ~34° each side
const PITCH_RANGE = 0.45 // ~26° each side

export default function HeroSpotlight3D() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const aimRef = useRef({ x: DEFAULT_AIM.x, y: DEFAULT_AIM.y })
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
  // even when it's over other parts of the page.
  useEffect(() => {
    if (!shouldMount) return
    const onMove = (e: MouseEvent) => {
      aimRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
      aimRef.current.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
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

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    container.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.45))
    const key = new THREE.DirectionalLight(0xfff0d4, 1.8)
    key.position.set(3, 4, 4)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0x88a8c4, 0.8)
    rim.position.set(-4, 2, -3)
    scene.add(rim)

    const root = new THREE.Group()
    scene.add(root)

    let currentYaw = aimRef.current.x * YAW_RANGE
    let currentPitch = aimRef.current.y * PITCH_RANGE
    let frame = 0
    let lastTime = performance.now()
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

        const fov = (camera.fov * Math.PI) / 180
        const aspect = container.clientWidth / container.clientHeight
        const distV = targetRadius / Math.sin(fov / 2)
        const distH = targetRadius / Math.sin(Math.atan(Math.tan(fov / 2) * aspect))
        const dist = Math.max(distV, distH) * 0.95

        camera.position.set(dist * 0.45, dist * 0.55, dist * 0.85)
        camera.lookAt(0, 0, 0)

        console.log('[HeroSpotlight] loaded', {
          meshCount,
          sphereRadius: sphere.radius,
          sphereCenter: sphere.center.toArray(),
          scale: s,
          dist,
          cameraPos: camera.position.toArray(),
        })

        root.add(model)
        setReady(true)
      },
      undefined,
      (err) => console.error('[HeroSpotlight] GLTF load failed', err),
    )

    const tick = () => {
      const now = performance.now()
      const dt = Math.min(0.05, (now - lastTime) / 1000)
      lastTime = now

      if (!reduceMotion) {
        // Critically-damped smoothing — feels alive without jitter
        const k = 1 - Math.exp(-dt * 4)
        const targetYaw = aimRef.current.x * YAW_RANGE
        const targetPitch = aimRef.current.y * PITCH_RANGE
        currentYaw += (targetYaw - currentYaw) * k
        currentPitch += (targetPitch - currentPitch) * k
      } else {
        currentYaw = aimRef.current.x * YAW_RANGE
        currentPitch = aimRef.current.y * PITCH_RANGE
      }

      root.rotation.y = currentYaw
      root.rotation.x = currentPitch - 0.1

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
