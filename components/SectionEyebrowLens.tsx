'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { isWebGLAvailable } from '@/lib/webgl'
import { acquireWebGLContext, releaseWebGLContext } from '@/lib/webgl-budget'

const MODEL_URL = '/models/camera-lens-opt.glb'
const ROTATION_SPEED = 0.7 // rad/s

// Module-level shared loader so the GLB lands in HTTP cache once and every
// instance reuses it across the page.
const sharedLoader = new GLTFLoader()

export default function SectionEyebrowLens() {
  const wrapperRef = useRef<HTMLSpanElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const node = wrapperRef.current
    if (!node) return
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: '200px' },
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
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100)
    camera.position.set(0, 0, 4.5)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    container.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.65))
    const key = new THREE.DirectionalLight(0xffffff, 2.0)
    key.position.set(2, 3, 4)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0xc8d4e0, 0.6)
    rim.position.set(-3, 1, -2)
    scene.add(rim)

    const root = new THREE.Group()
    scene.add(root)

    let frame = 0
    let lastTime = performance.now()
    let disposed = false

    sharedLoader.load(MODEL_URL, (gltf) => {
      if (disposed) return
      const model = gltf.scene
      const box = new THREE.Box3().setFromObject(model)
      const sphere = new THREE.Sphere()
      box.getBoundingSphere(sphere)
      model.position.sub(sphere.center)
      model.scale.setScalar(1.4 / Math.max(sphere.radius, 0.01))
      root.add(model)
    })

    const tick = () => {
      const now = performance.now()
      const dt = Math.min(0.05, (now - lastTime) / 1000)
      lastTime = now
      if (!reduceMotion) {
        root.rotation.y += ROTATION_SPEED * dt
      }
      renderer.render(scene, camera)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
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
    <span
      ref={wrapperRef}
      className="inline-block align-middle w-6 h-6 mr-2"
      aria-hidden="true"
    />
  )
}
