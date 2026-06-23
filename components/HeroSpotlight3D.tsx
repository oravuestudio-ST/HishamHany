'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { isWebGLAvailable } from '@/lib/webgl'
import { acquireWebGLContext, releaseWebGLContext } from '@/lib/webgl-budget'

const MODEL_URL = '/models/spotlight.glb'

// Headline target in canvas world coords. Derived by:
//  1. Measuring the screen vector from spotlight-wrapper center (~1152, 252)
//     to headline center (~364, 600) at 1440×900 → ~(-788, +348), a pitch
//     of ~24° below horizontal.
//  2. Inverting that screen vector through the camera's basis vectors
//     (forward (-0.40, -0.49, -0.76), right (0.88, 0, -0.47), up
//     (-0.23, 0.86, -0.43)) to a world direction (~(-0.77, -0.26, 0.58)).
//  3. Scaling by 5 to keep the target outside the model: (-3.85, -1.3, 2.9).
// Cleaned up to (-4, -1.3, 3) for legibility.
const HEADLINE_TARGET = new THREE.Vector3(-4, -1.3, 3)

// Floating motion — slow, low-amplitude bob/sway so the spotlight reads as
// "rigged on a soft cable" rather than locked in space. Amplitudes are in
// units of the normalized model radius (targetRadius = 1).
const FLOAT_Y_AMP = 0.04
const FLOAT_X_AMP = 0.022
const FLOAT_ROLL_AMP = 0.025 // radians — barely perceptible barrel sway

export default function HeroSpotlight3D() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

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
    // Scene graph:
    //   scene
    //    └─ floatGroup  (floating bob/sway only — no cursor input)
    //        └─ aimGroup (locked aim at the headline via lookAt)
    //            └─ model
    const floatGroup = new THREE.Group()
    const aimGroup = new THREE.Group()
    floatGroup.add(aimGroup)
    scene.add(floatGroup)

    const startTime = performance.now()
    let frame = 0
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

        // The GLB ships three meshes:
        //   - Cylinder000_MAT_SceneProps_0 — opaque, the yoke/arm
        //   - Cylinder003_MAT_SceneProps_0 — opaque, the lamp housing
        //   - Cylinder003_MAT_Lightbeam_0  — transparent cone, the BEAM
        // The beam mesh is too low-poly to fake volumetric light with any
        // shader, so we hide it and attach a programmatic high-poly cone
        // below. The opaque-only bounding box also stays tight around the
        // fixture body (the lightbeam mesh would inflate the sphere and
        // shrink the visible body).
        const opaqueBox = new THREE.Box3()
        let hasOpaque = false
        model.traverse((obj) => {
          const mesh = obj as THREE.Mesh
          if (!mesh.isMesh) return
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
          const matName = (mats[0] as THREE.Material | undefined)?.name ?? ''
          if (matName === 'MAT_Lightbeam') {
            // Hide the GLB's low-poly beam — the geometry is too coarse
            // for a smooth volumetric look. We'll attach a programmatic
            // cone after the model is sized + centered.
            mesh.visible = false
            return
          }
          opaqueBox.expandByObject(mesh)
          hasOpaque = true
        })
        const box = hasOpaque ? opaqueBox : new THREE.Box3().setFromObject(model)
        const sphere = new THREE.Sphere()
        box.getBoundingSphere(sphere)
        const targetRadius = 1
        const s = targetRadius / Math.max(sphere.radius, 1e-4)
        model.scale.setScalar(s)
        model.position.copy(sphere.center).multiplyScalar(-s)

        aimGroup.add(model)

        // Programmatic beam cone — replaces the hidden GLB beam with a
        // smooth high-poly cone (32 radial × 6 height segments, open at
        // the base). It's attached to aimGroup so it inherits the
        // lookAt rotation; rotated + translated so the apex sits at the
        // spotlight center and the cone extends along local -Z.
        const BEAM_HEIGHT = 3.0
        const BEAM_RADIUS = 0.75
        const beamGeo = new THREE.ConeGeometry(
          BEAM_RADIUS,
          BEAM_HEIGHT,
          32, // radial segments — smooth silhouette
          6, // height segments — smooth length-wise fade
          true, // openEnded — no closing disc at the tip
        )
        // ConeGeometry: apex at (0, +h/2, 0), base at (0, -h/2, 0).
        // Translate apex to origin, then rotate so the base points along +Z.
        // (Object3D.lookAt orients local +Z toward the target for non-Camera
        // objects — opposite the Camera convention. The barn doors of this
        // GLB sit at local +Z, so the beam should also extend along +Z.)
        beamGeo.translate(0, -BEAM_HEIGHT / 2, 0) // apex at origin, base at (0, -h, 0)
        beamGeo.rotateX(-Math.PI / 2) // (0, -h, 0) → (0, 0, +h): base now at +Z
        const beamMat = new THREE.ShaderMaterial({
          uniforms: {
            uColor: { value: new THREE.Color(0xffd9a0) }, // tungsten warm
            uIntensity: { value: 1.35 },
            uHeight: { value: BEAM_HEIGHT },
          },
          vertexShader: /* glsl */ `
            varying vec3 vViewNormal;
            varying vec3 vViewDir;
            varying float vLength;
            uniform float uHeight;
            void main() {
              vec4 mv = modelViewMatrix * vec4(position, 1.0);
              vViewNormal = normalize(normalMatrix * normal);
              vViewDir = normalize(-mv.xyz);
              vLength = clamp(position.z / uHeight, 0.0, 1.0);
              gl_Position = projectionMatrix * mv;
            }
          `,
          fragmentShader: /* glsl */ `
            varying vec3 vViewNormal;
            varying vec3 vViewDir;
            varying float vLength;
            uniform vec3 uColor;
            uniform float uIntensity;
            void main() {
              // View-angle volume: bright where surface faces camera,
              // soft at silhouette
              float facing = abs(dot(vViewNormal, vViewDir));
              float volume = pow(facing, 1.3);
              // Length-wise fade: bright at lens (apex), zero at tip
              float lengthFade = pow(1.0 - vLength, 1.6);
              float alpha = volume * lengthFade * uIntensity;
              gl_FragColor = vec4(uColor * alpha, alpha);
            }
          `,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
          toneMapped: false,
        })
        const beamMesh = new THREE.Mesh(beamGeo, beamMat)
        beamMesh.renderOrder = 2
        aimGroup.add(beamMesh)

        // Aim. lookAt() rotates so local -Z points at the target. The GLB's
        // BARN DOORS (the true emitting front of the fixture) are at local
        // -Z and the silver REFLECTOR HOUSING is at local +Z — what I
        // initially read as the lens was actually the back reflector. So
        // lookAt alone aims the barn doors at the target, with the
        // reflector showing on the opposite side. No rotateY(π) needed.
        aimGroup.lookAt(HEADLINE_TARGET)

        // Camera framing — the bounding sphere is now tight around the
        // opaque body (lightbeam excluded), so we need extra breathing room
        // around it. 0.95 gives the model space to live without crowding
        // the canvas edges, while still being noticeably larger than the
        // ~20%-of-canvas footprint we had before the opaque-only fix.
        const fov = (camera.fov * Math.PI) / 180
        const aspect = container.clientWidth / container.clientHeight
        const distV = targetRadius / Math.sin(fov / 2)
        const distH = targetRadius / Math.sin(Math.atan(Math.tan(fov / 2) * aspect))
        const dist = Math.max(distV, distH) * 0.95

        camera.position.set(dist * 0.45, dist * 0.55, dist * 0.85)
        camera.lookAt(0, 0, 0)

        setReady(true)
      },
      undefined,
      (err) => console.error('[HeroSpotlight] GLTF load failed', err),
    )

    const tick = () => {
      const elapsed = (performance.now() - startTime) / 1000

      if (!reduceMotion) {
        floatGroup.position.y = Math.sin(elapsed * 0.9) * FLOAT_Y_AMP
        floatGroup.position.x = Math.sin(elapsed * 0.67 + 0.8) * FLOAT_X_AMP
        floatGroup.rotation.z = Math.sin(elapsed * 0.52 + 1.3) * FLOAT_ROLL_AMP
      } else {
        floatGroup.position.set(0, 0, 0)
        floatGroup.rotation.z = 0
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
