'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { isWebGLAvailable } from '@/lib/webgl'
import { acquireWebGLContext, releaseWebGLContext } from '@/lib/webgl-budget'

const MODEL_URL = '/models/mercedes-logo.glb'
const ROTATION_SPEED = 0.35 // rad/s

export default function MercedesLogo3D() {
  const containerRef = useRef<HTMLDivElement>(null)
  const hoverRef = useRef(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    if (!isWebGLAvailable()) return
    if (!acquireWebGLContext()) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      35,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    )
    camera.position.set(0, 0, 6)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    container.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.55))
    const key = new THREE.DirectionalLight(0xffffff, 1.6)
    key.position.set(3, 4, 5)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0xc8d4e0, 0.7)
    rim.position.set(-4, 2, -3)
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
        const size = new THREE.Vector3()
        const center = new THREE.Vector3()
        box.getSize(size)
        box.getCenter(center)
        model.position.sub(center)

        const maxDim = Math.max(size.x, size.y, size.z) || 1
        const scale = 2.4 / maxDim
        model.scale.setScalar(scale)

        root.add(model)
        setReady(true)
      },
      undefined,
      (err) => {
        console.error('[MercedesLogo3D] GLTF load failed', err)
      },
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
  }, [])

  return (
    <div
      ref={containerRef}
      onPointerEnter={() => { hoverRef.current = true }}
      onPointerLeave={() => { hoverRef.current = false }}
      className="relative w-full h-full"
      aria-hidden="true"
      data-ready={ready}
    />
  )
}
