'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import dynamic from 'next/dynamic'

const WebGLImage = dynamic(() => import('@/components/WebGLImage'), { ssr: false })

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

const categories = ['All', 'Fashion', 'Automotive', 'Commercial', 'Editorial']

const projects = [
  {
    id: 1,
    title: 'Glitch Club — Outdoor',
    category: 'Fashion',
    year: '2024',
    client: 'Glitch Goods',
    image: '/images/Fashion/GLITCH%20GOODS/GLITCH%20CLUB_outdoor/Glitch_outdoor-003.jpg',
    aspect: 'portrait',
  },
  {
    id: 2,
    title: 'Mercedes GLE 450',
    category: 'Automotive',
    year: '2024',
    client: 'Automotive Campaign',
    image: '/images/Automotive/GLE-450/GLE450_car-001.JPG',
    aspect: 'landscape',
  },
  {
    id: 3,
    title: 'Baby Gang',
    category: 'Fashion',
    year: '2024',
    client: 'Baby Gang',
    image: '/images/Childs/FAshion/Baby%20gang/BabyGang_fashion-001.jpg',
    aspect: 'portrait',
  },
  {
    id: 7,
    title: 'Bnghaty × Koptan',
    category: 'Editorial',
    year: '2024',
    client: 'Bnghaty Event',
    image: '/images/Events/Bnghaty%20event/Bnghaty_koptan-001.jpg',
    aspect: 'portrait',
  },
  {
    id: 8,
    title: 'Ayman & Salma — Party',
    category: 'Editorial',
    year: '2024',
    client: 'Ayman & Salma',
    image: '/images/Childs/PARTY/AymanSalma_party-001.JPG',
    aspect: 'landscape',
  },
  {
    id: 10,
    title: 'Glitch Club — Germany',
    category: 'Fashion',
    year: '2024',
    client: 'Glitch Goods',
    image: '/images/Fashion/GLITCH%20GOODS/Glitch_club%20germany/Glitch_germany-001.jpg',
    aspect: 'portrait',
  },
  {
    id: 11,
    title: 'Glitch Club — Party Till Die',
    category: 'Fashion',
    year: '2024',
    client: 'Glitch Goods',
    image: '/images/Fashion/GLITCH%20GOODS/Glitch_party-till-die/Glitch_partyTillDie-001.JPG',
    aspect: 'portrait',
  },
  {
    id: 12,
    title: 'Glitch Set',
    category: 'Fashion',
    year: '2024',
    client: 'Glitch Goods',
    image: '/images/Fashion/GLITCH%20GOODS/Gitch%20set/Glitch_set-001.jpg',
    aspect: 'portrait',
  },
  {
    id: 13,
    title: 'Glitch — Kanta',
    category: 'Fashion',
    year: '2024',
    client: 'Glitch Goods',
    image: '/images/Fashion/GLITCH%20GOODS/kanta/Glitch_kanta-001.JPG',
    aspect: 'portrait',
  },
  {
    id: 14,
    title: 'Glitch — Circle KK',
    category: 'Fashion',
    year: '2024',
    client: 'Glitch Goods',
    image: '/images/Fashion/GLITCH%20GOODS/circle%20kk/Glitch_circlekk-001.JPG',
    aspect: 'portrait',
  },
  {
    id: 15,
    title: 'Glitch — Bag',
    category: 'Fashion',
    year: '2024',
    client: 'Glitch Goods',
    image: '/images/Fashion/GLITCH%20GOODS/bag/Glitch_bag-001.JPG',
    aspect: 'portrait',
  },
  {
    id: 4,
    title: 'Isis Festival',
    category: 'Editorial',
    year: '2023',
    client: 'Events & Press',
    image: '/images/Events/Isis%20festival%20event/Isis_glitchybag-001.jpg',
    aspect: 'portrait',
  },
  {
    id: 9,
    title: 'Koptan — Jetta',
    category: 'Automotive',
    year: '2024',
    client: 'Koptan',
    image: '/images/Automotive/koptan%20jetta/Koptan_jetta-001.JPG',
    aspect: 'landscape',
  },
  {
    id: 5,
    title: 'Seat Ibiza',
    category: 'Automotive',
    year: '2024',
    client: 'Automotive Campaign',
    image: '/images/Automotive/Auto_ibiza-001.JPG',
    aspect: 'landscape',
  },
  {
    id: 6,
    title: 'New Capital',
    category: 'Editorial',
    year: '2023',
    client: 'Architectural Editorial',
    image: '/images/New%20capital/NewCapital_architecture-001.JPG',
    aspect: 'landscape',
  },
]

export default function Portfolio() {
  const [active, setActive] = useState('All')
  const sectionRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  const filtered = active === 'All' ? projects : projects.filter((p) => p.category === active)

  useEffect(() => {
    const lines = titleRef.current?.querySelectorAll('.reveal-inner')
    if (!lines) return

    const ctx = gsap.context(() => {
      gsap.from(lines, {
        yPercent: 110,
        duration: 1.4,
        ease: 'expo.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: titleRef.current,
          start: 'top 82%',
          once: true,
        },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  // Animate grid items in on filter change
  useEffect(() => {
    const items = gridRef.current?.querySelectorAll('.portfolio-item')
    if (!items) return
    gsap.fromTo(items,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out', stagger: 0.08 }
    )
  }, [filtered])

  return (
    <section ref={sectionRef} id="work" className="section-pad">
      {/* Section header */}
      <div ref={titleRef} className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
        <div>
          <p className="font-sans text-[0.58rem] tracking-[0.4em] uppercase text-silver/40 mb-5">
            02 — Selected Work
          </p>
          <div className="overflow-hidden">
            <h2 className="reveal-inner font-serif text-[clamp(3rem,7vw,7rem)] text-bone italic" style={{ fontWeight: 300 }}>
              Visual Stories
            </h2>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`font-sans text-[0.58rem] tracking-[0.25em] uppercase px-4 py-2 border transition-all duration-400 ${
                active === cat
                  ? 'border-bone/40 text-bone bg-bone/5'
                  : 'border-bone/10 text-silver/40 hover:border-bone/20 hover:text-silver/70'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Masonry-style grid */}
      <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((project, i) => (
          <ProjectCard key={project.id} project={project} index={i} />
        ))}
      </div>

      {/* View all */}
      <div className="flex justify-center mt-20">
        <button
          data-cursor="View All"
          className="magnetic-btn group flex items-center gap-4 font-sans text-[0.62rem] tracking-[0.35em] uppercase text-silver/60 hover:text-bone transition-colors duration-400"
        >
          <span className="w-12 h-px bg-silver/30 group-hover:w-20 group-hover:bg-bone/60 transition-all duration-500" />
          View Complete Archive
          <span className="w-12 h-px bg-silver/30 group-hover:w-20 group-hover:bg-bone/60 transition-all duration-500" />
        </button>
      </div>
    </section>
  )
}

function ProjectCard({ project, index }: { project: typeof projects[0]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLDivElement>(null)
  const infoRef = useRef<HTMLDivElement>(null)

  const handleMouseEnter = () => {
    gsap.to(infoRef.current, { y: 0, opacity: 1, duration: 0.5, ease: 'expo.out' })
  }

  const handleMouseLeave = () => {
    gsap.to(infoRef.current, { y: 6, opacity: 0, duration: 0.4, ease: 'expo.in' })
  }

  const aspectClass = project.aspect === 'portrait' ? 'aspect-[3/4]' : 'aspect-[4/3]'
  // Make some items span 2 columns for visual variety
  const wide = index === 1 || index === 4

  return (
    <div
      ref={cardRef}
      className={`portfolio-item group relative ${wide ? 'md:col-span-2 lg:col-span-1' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-cursor="View"
    >
      {/* Image */}
      <div ref={imgRef} className={`relative overflow-hidden ${aspectClass} bg-silver/5`}>
        <WebGLImage
          src={project.image}
          alt={project.title}
          className="absolute inset-0 w-full h-full"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-ebony/0 group-hover:bg-ebony/30 transition-colors duration-500" />

        {/* Category badge */}
        <div className="absolute top-4 left-4">
          <span className="font-sans text-[0.5rem] tracking-[0.3em] uppercase text-bone/60 bg-ebony/40 backdrop-blur-sm px-3 py-1.5">
            {project.category}
          </span>
        </div>
      </div>

      {/* Info */}
      <div ref={infoRef} className="flex items-start justify-between mt-4 md:opacity-0 md:translate-y-1.5">
        <div>
          <h3 className="font-serif text-[1.15rem] text-bone italic" style={{ fontWeight: 300 }}>
            {project.title}
          </h3>
          <p className="font-sans text-[0.58rem] tracking-[0.2em] uppercase text-silver/50 mt-1">
            {project.client}
          </p>
        </div>
        <span className="font-sans text-[0.55rem] tracking-[0.15em] text-silver/30 mt-1">
          {project.year}
        </span>
      </div>
    </div>
  )
}
