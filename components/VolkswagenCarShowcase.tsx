'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { isWebGLAvailable } from '@/lib/webgl'
import { acquireWebGLContext, releaseWebGLContext } from '@/lib/webgl-budget'

const MODEL_URL = '/models/volkswagen-jetta-opt.glb'
const MODEL_SIZE_MB = 14

type Phase = 'idle' | 'loading' | 'ready' | 'error'

export default function VolkswagenCarShowcase() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [started, setStarted] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!started) return
    const container = containerRef.current
    if (!container) { setPhase('error'); return }
    if (!isWebGLAvailable()) { setPhase('error'); return }
    if (!acquireWebGLContext()) { setPhase('error'); return }

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      40,
      container.clientWidth / container.clientHeight,
      0.1,
      1000,
    )

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
    container.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.45))
    const key = new THREE.DirectionalLight(0xffffff, 1.8)
    key.position.set(5, 6, 4)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xb0c4d8, 0.6)
    fill.position.set(-5, 3, -4)
    scene.add(fill)
    const rim = new THREE.DirectionalLight(0xffffff, 0.5)
    rim.position.set(0, 4, -8)
    scene.add(rim)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.enablePan = false
    controls.enableZoom = false
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.5
    controls.minPolarAngle = Math.PI / 3.2
    controls.maxPolarAngle = Math.PI / 1.85

    let frame = 0
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
        const center = sphere.center.clone()
        model.position.sub(center)

        const fov = (camera.fov * Math.PI) / 180
        const aspect = container.clientWidth / container.clientHeight
        const distV = sphere.radius / Math.sin(fov / 2)
        const distH = sphere.radius / Math.sin(Math.atan(Math.tan(fov / 2) * aspect))
        const dist = Math.max(distV, distH) * 0.85

        camera.position.set(dist * 0.6, dist * 0.28, dist * 0.78)
        camera.lookAt(0, 0, 0)
        controls.target.set(0, 0, 0)
        controls.update()

        scene.add(model)
        setPhase('ready')
      },
      (event) => {
        if (event.lengthComputable) {
          setProgress((event.loaded / event.total) * 100)
        }
      },
      (err) => {
        console.error('[VolkswagenCarShowcase] GLTF load failed', err)
        if (!disposed) setPhase('error')
      },
    )

    const tick = () => {
      controls.update()
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
      controls.dispose()
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh
          mesh.geometry?.dispose()
          const mat = mesh.material as THREE.Material | THREE.Material[]
          if (Array.isArray(mat)) {
            mat.forEach((m) => disposeMaterial(m))
          } else if (mat) {
            disposeMaterial(mat)
          }
        }
      })
      renderer.dispose()
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
      releaseWebGLContext()
    }
  }, [started])

  const showCanvas = phase === 'loading' || phase === 'ready'

  return (
    <div className="relative w-full h-[62vh] min-h-[420px] max-h-[720px] bg-bone/[0.025] overflow-hidden">
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{ opacity: showCanvas ? 1 : 0, transition: 'opacity var(--dur-medium) var(--ease-premium)' }}
        aria-hidden="true"
      />

      {phase === 'idle' && (
        <button
          type="button"
          onClick={() => { setStarted(true); setPhase('loading') }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-bone/80 hover:text-bone transition-colors cursor-pointer group"
        >
          <span className="flex items-center justify-center w-14 h-14 rounded-full border border-bone/30 group-hover:border-bone/70 transition-colors">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2l9 5v10l-9 5-9-5V7l9-5z" strokeLinejoin="round" />
              <path d="M3 7l9 5 9-5M12 12v10" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="font-sans text-[0.65rem] tracking-[0.35em] uppercase">Explore in 3D</span>
          <span className="font-sans text-[0.55rem] tracking-[0.3em] uppercase text-silver/40">
            {MODEL_SIZE_MB} MB · click to load
          </span>
        </button>
      )}

      {phase === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none">
          <span className="font-sans text-[0.6rem] tracking-[0.35em] uppercase text-silver/60">
            Loading {Math.round(progress)}%
          </span>
          <div className="w-40 h-px bg-silver/10 overflow-hidden">
            <div
              className="h-full bg-bone transition-[width] duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {phase === 'ready' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
          <span className="font-sans text-[0.5rem] tracking-[0.35em] uppercase text-silver/40">
            Drag to rotate
          </span>
        </div>
      )}

      {phase === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-sans text-[0.6rem] tracking-[0.3em] uppercase text-silver/40">
            3D preview unavailable
          </span>
        </div>
      )}
    </div>
  )
}

function disposeMaterial(material: THREE.Material) {
  const m = material as THREE.MeshStandardMaterial
  m.map?.dispose()
  m.normalMap?.dispose()
  m.roughnessMap?.dispose()
  m.metalnessMap?.dispose()
  m.aoMap?.dispose()
  m.emissiveMap?.dispose()
  m.dispose()
}
