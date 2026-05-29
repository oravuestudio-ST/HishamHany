'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { isWebGLAvailable } from '@/lib/webgl'

const vertexShader = /* glsl */`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = /* glsl */`
uniform sampler2D uTexture;
uniform sampler2D uDisplacement;
uniform float     uHover;
uniform vec2      uMouse;

varying vec2 vUv;

void main() {
  float d = texture2D(uDisplacement, vUv).r;
  float prox = 1.0 - smoothstep(0.0, 0.55, length(vUv - uMouse));
  float strength = uHover * 0.03 * (0.4 + 0.6 * prox);
  vec2 displaced = vUv + (d - 0.5) * strength;
  gl_FragColor = texture2D(uTexture, displaced);
}
`

// Module-level singleton: displacement texture loaded once, shared by all instances
let displacementPromise: Promise<THREE.Texture | null> | null = null
function getDisplacementTexture(): Promise<THREE.Texture | null> {
  if (!displacementPromise) {
    displacementPromise = new Promise((resolve) => {
      new THREE.TextureLoader().load(
        '/textures/displacement.png',
        resolve,
        undefined,
        () => {
          displacementPromise = null
          resolve(null)
        }
      )
    })
  }
  return displacementPromise
}

function initRenderer(el: HTMLDivElement, src: string): () => void {
  let mounted = true
  let rafId: number
  let isHovering = false
  let leaveTween: gsap.core.Tween | null = null

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
    leaveTween = gsap.to(uniforms.uHover, {
      value: 0, duration: 0.6, ease: 'power2.in',
      onComplete: () => { if (mounted) renderer.render(scene, camera) },
    })
  }
  const onMove = (e: PointerEvent) => {
    const rect = el.getBoundingClientRect()
    uniforms.uMouse.value.set(
      (e.clientX - rect.left)  / rect.width,
      1 - (e.clientY - rect.top) / rect.height,
    )
  }

  el.addEventListener('pointerenter', onEnter)
  el.addEventListener('pointerleave', onLeave)
  el.addEventListener('pointermove',  onMove)

  const handleResize = () => renderer.setSize(el.clientWidth, el.clientHeight)
  window.addEventListener('resize', handleResize)

  return () => {
    mounted = false
    cancelAnimationFrame(rafId)
    leaveTween?.kill()
    el.removeEventListener('pointerenter', onEnter)
    el.removeEventListener('pointerleave', onLeave)
    el.removeEventListener('pointermove',  onMove)
    window.removeEventListener('resize', handleResize)
    material.dispose()
    mesh.geometry.dispose()
    renderer.dispose()
    if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
  }
}

interface Props {
  src: string
  alt: string
  className?: string
  sizes?: string
}

export default function WebGLImage({ src, alt, className = '', sizes }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)

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

  return (
    <div
      ref={mountRef}
      className={['webgl-image', className].filter(Boolean).join(' ')}
      role="img"
      aria-label={alt}
    >
      {/* Fallback image — always rendered; WebGL canvas overlays on top when active */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="webgl-image-fallback"
      />
    </div>
  )
}
