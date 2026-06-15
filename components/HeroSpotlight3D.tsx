'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { isWebGLAvailable } from '@/lib/webgl'
import { acquireWebGLContext, releaseWebGLContext } from '@/lib/webgl-budget'

const MODEL_URL = '/models/spotlight.glb'

// Headline target in canvas world coords. The wrapper sits in the top-right
// of the hero; the headline sits at lower-left of the page. We aim the
// model's barrel at a point that projects (under our camera basis) to the
// lower-left of the canvas — so visually the spotlight "throws" toward the
// headline area beyond the canvas edge.
const HEADLINE_TARGET = new THREE.Vector3(-5, -3, 0.5)

// Cursor adds a small deviation on top of the locked aim — the spotlight
// is doing its job (lighting the headline) but it notices the viewer.
const YAW_CURSOR_RANGE = 0.22
const PITCH_CURSOR_RANGE = 0.16

// Floating motion — slow, low-amplitude bob/sway. Amplitudes are in units
// of the normalized model radius (targetRadius = 1).
const FLOAT_Y_AMP = 0.04
const FLOAT_X_AMP = 0.022
const FLOAT_ROLL_AMP = 0.025 // radians — barely perceptible barrel sway

export default function HeroSpotlight3D() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const aimRef = useRef({ x: 0, y: 0 })
  const [ready, setReady] = useState(false)

  // Cursor tracking — global, so the spotlight notices the viewer even when
  // the cursor is over text or the navigation. Resets to 0 when the cursor
  // leaves the window so the locked aim reasserts.
  useEffect(() => {
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
  }, [])

  useEffect(() => {
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
    renderer.toneMappingExposure = 1.4
    container.appendChild(renderer.domElement)

    // PMREM-baked room environment — required for PBR metal materials to
    // read as "metal" instead of pitch black.
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

    // Scene graph:
    //   scene
    //    └─ cursorGroup  (cursor delta + floating motion — the "alive" layer)
    //        └─ aimGroup (locked aim at the headline via lookAt)
    //            └─ model
    const cursorGroup = new THREE.Group()
    const aimGroup = new THREE.Group()
    cursorGroup.add(aimGroup)
    scene.add(cursorGroup)

    let currentYaw = 0
    let currentPitch = 0
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

        model.traverse((obj) => {
          obj.visible = true
        })

        // Normalize: center on origin, scale so bounding sphere has radius 1.
        const box = new THREE.Box3().setFromObject(model)
        const sphere = new THREE.Sphere()
        box.getBoundingSphere(sphere)
        const targetRadius = 1
        const s = targetRadius / Math.max(sphere.radius, 1e-4)
        model.scale.setScalar(s)
        model.position.copy(sphere.center).multiplyScalar(-s)

        aimGroup.add(model)

        // Aim. lookAt() rotates so the group's local -Z points at the target.
        // The spotlight GLB has its throw direction along local +Z, so after
        // lookAt() the barrel points AWAY from the headline. A 180° rotation
        // around local Y flips +Z to where -Z was — now the barrel aims AT
        // the headline target.
        aimGroup.lookAt(HEADLINE_TARGET)
        aimGroup.rotateY(Math.PI)

        // Camera framing — pull in tight so the spotlight body uses most of
        // the canvas. The bounding sphere includes the transparent lightbeam,
        // so 0.55 (vs the usual ~0.9) is what fills the frame visually.
        const fov = (camera.fov * Math.PI) / 180
        const aspect = container.clientWidth / container.clientHeight
        const distV = targetRadius / Math.sin(fov / 2)
        const distH = targetRadius / Math.sin(Math.atan(Math.tan(fov / 2) * aspect))
        const dist = Math.max(distV, distH) * 0.55

        camera.position.set(dist * 0.45, dist * 0.55, dist * 0.85)
        camera.lookAt(0, 0, 0)

        setReady(true)
      },
      undefined,
      (err) => console.error('[HeroSpotlight] GLTF load failed', err),
    )

    const tick = () => {
      const now = performance.now()
      const dt = Math.min(0.05, (now - lastTime) / 1000)
      lastTime = now
      const elapsed = (now - startTime) / 1000

      const targetYaw = aimRef.current.x * YAW_CURSOR_RANGE
      const targetPitch = aimRef.current.y * PITCH_CURSOR_RANGE

      if (!reduceMotion) {
        const k = 1 - Math.exp(-dt * 4)
        currentYaw += (targetYaw - currentYaw) * k
        currentPitch += (targetPitch - currentPitch) * k
      } else {
        currentYaw = targetYaw
        currentPitch = targetPitch
      }

      cursorGroup.rotation.y = currentYaw
      cursorGroup.rotation.x = currentPitch

      if (!reduceMotion) {
        cursorGroup.position.y = Math.sin(elapsed * 0.9) * FLOAT_Y_AMP
        cursorGroup.position.x = Math.sin(elapsed * 0.67 + 0.8) * FLOAT_X_AMP
        cursorGroup.rotation.z = Math.sin(elapsed * 0.52 + 1.3) * FLOAT_ROLL_AMP
      } else {
        cursorGroup.position.set(0, 0, 0)
        cursorGroup.rotation.z = 0
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
  }, [])

  return (
    <div
      ref={wrapperRef}
      className="relative w-full h-full"
      aria-hidden="true"
      data-ready={ready}
      style={{ opacity: ready ? 1 : 0, transition: 'opacity 250ms ease-out' }}
    />
  )
}
