'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { isWebGLAvailable } from '@/lib/webgl'
import { acquireWebGLContext, releaseWebGLContext } from '@/lib/webgl-budget'

const MODEL_URL = '/models/canon-at-1.glb'
const ROTATION_SPEED = 0.25 // rad/s — slow, lets detail breathe

export default function AboutCamera3D() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const hoverRef = useRef(false)
  const [inView, setInView] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const node = wrapperRef.current
    if (!node) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { rootMargin: '400px' },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!inView) return
    const container = wrapperRef.current
    if (!container) return
    if (!isWebGLAvailable()) return
    if (!acquireWebGLContext()) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      40,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    )

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    container.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.4))
    const key = new THREE.DirectionalLight(0xfff0d4, 1.6)
    key.position.set(4, 5, 4)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0xc8d4e0, 0.7)
    rim.position.set(-4, 2, -4)
    scene.add(rim)

    const root = new THREE.Group()
    scene.add(root)

    let frame = 0
    let lastTime = performance.now()
    let disposed = false

    const loader = new GLTFLoader()
    loader.load(
      MODEL_URL,
      (gltf) => {
        if (disposed) return
        const model = gltf.scene
        const box = new THREE.Box3().setFromObject(model)
        const sphere = new THREE.Sphere()
        box.getBoundingSphere(sphere)
        model.position.sub(sphere.center)

        const fov = (camera.fov * Math.PI) / 180
        const aspect = container.clientWidth / container.clientHeight
        const distV = sphere.radius / Math.sin(fov / 2)
        const distH = sphere.radius / Math.sin(Math.atan(Math.tan(fov / 2) * aspect))
        const dist = Math.max(distV, distH) * 0.9

        camera.position.set(dist * 0.55, dist * 0.25, dist * 0.78)
        camera.lookAt(0, 0, 0)

        root.add(model)
        setReady(true)
      },
      undefined,
      (err) => console.error('[AboutCamera3D] GLTF load failed', err),
    )

    const tick = () => {
      const now = performance.now()
      const dt = Math.min(0.05, (now - lastTime) / 1000)
      lastTime = now
      if (!reduceMotion && !hoverRef.current) {
        root.rotation.y += ROTATION_SPEED * dt
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
      renderer.dispose()
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
      releaseWebGLContext()
    }
  }, [inView])

  return (
    <div
      ref={wrapperRef}
      onPointerEnter={() => { hoverRef.current = true }}
      onPointerLeave={() => { hoverRef.current = false }}
      className="relative w-full h-full"
      aria-hidden="true"
      data-ready={ready}
      style={{ opacity: ready ? 1 : 0, transition: 'opacity var(--dur-medium) var(--ease-premium)' }}
    />
  )
}
