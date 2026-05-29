'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const vertexShader = /* glsl */`
void main() {
  gl_Position = vec4(position, 1.0);
}
`

const fragmentShader = /* glsl */`
uniform float uTime;
uniform vec2  uResolution;

float rand(vec2 n) {
  return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(rand(i), rand(i + vec2(1.0, 0.0)), u.x),
    mix(rand(i + vec2(0.0, 1.0)), rand(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.1 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}
void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float t = uTime * 0.08;
  float f = fbm(uv * 2.5 + t) + 0.5 * fbm(uv * 5.0 - t * 0.7);
  float ember = smoothstep(0.4, 0.0, uv.x) * 0.12 * smoothstep(0.3, 0.7, f);
  float teal  = smoothstep(0.6, 1.0, uv.x) * 0.09 * smoothstep(0.4, 0.8, 1.0 - f);
  vec3 col = vec3(0.059, 0.059, 0.063);
  col += ember * vec3(0.745, 0.298, 0.0);
  col += teal  * vec3(0.0,  0.286, 0.357);
  gl_FragColor = vec4(col, 1.0);
}
`

interface Props { className?: string }

export default function WebGLHero({ className = '' }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    // Reduced motion: static fallback, no RAF
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // WebGL availability check
    const probe = document.createElement('canvas')
    const probeCtx = probe.getContext('webgl') || probe.getContext('experimental-webgl')
    if (!probeCtx) return

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(el.clientWidth, el.clientHeight)
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    const uniforms = {
      uTime:       { value: 0 },
      uResolution: { value: new THREE.Vector2(el.clientWidth, el.clientHeight) },
    }

    const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms })
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
    scene.add(mesh)

    let rafId: number
    let lastTime = 0
    const FPS_CAP = reduced ? 10 : 60
    const INTERVAL = 1000 / FPS_CAP
    const clock = new THREE.Clock()

    const animate = (now: number) => {
      rafId = requestAnimationFrame(animate)
      if (now - lastTime < INTERVAL) return
      lastTime = now
      uniforms.uTime.value = clock.getElapsedTime()
      renderer.render(scene, camera)
    }
    rafId = requestAnimationFrame(animate)

    const handleResize = () => {
      renderer.setSize(el.clientWidth, el.clientHeight)
      uniforms.uResolution.value.set(el.clientWidth, el.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', handleResize)
      material.dispose()
      mesh.geometry.dispose()
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} className={['webgl-hero', className].filter(Boolean).join(' ')} aria-hidden="true" />
}
