"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion"
import { TechnicalProject } from "@/types/technical"
import { Github, ExternalLink } from "lucide-react"

interface ProjectShowcaseProps {
  projects: TechnicalProject[]
}

export function ProjectShowcase({ projects }: ProjectShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Mouse position for magnetic effect
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springConfig = { damping: 25, stiffness: 200 }
  const x = useSpring(mouseX, springConfig)
  const y = useSpring(mouseY, springConfig)

  // Transform for parallax on the large number
  const numberX = useTransform(x, [-200, 200], [-20, 20])
  const numberY = useTransform(y, [-200, 200], [-10, 10])

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      mouseX.set(e.clientX - centerX)
      mouseY.set(e.clientY - centerY)
    }
  }

  const goNext = () => setActiveIndex((prev) => (prev + 1) % projects.length)
  const goPrev = () => setActiveIndex((prev) => (prev - 1 + projects.length) % projects.length)

  useEffect(() => {
    if (projects.length === 0) return
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % projects.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [projects.length])

  if (projects.length === 0) {
    return null
  }

  const current = projects[activeIndex]

  return (
    <div className="flex items-center justify-center min-h-[600px] bg-background overflow-hidden py-12">
      <div ref={containerRef} className="relative w-full max-w-5xl px-4 md:px-8" onMouseMove={handleMouseMove}>
        {/* Oversized index number - positioned behind content as background layer */}
        <motion.div
          className="absolute -left-8 md:-left-16 top-1/2 -translate-y-1/2 text-[16rem] md:text-[28rem] font-bold text-foreground/[0.03] select-none pointer-events-none leading-none tracking-tighter z-0"
          style={{ x: numberX, y: numberY }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={activeIndex}
              initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="block"
            >
              {String(activeIndex + 1).padStart(2, "0")}
            </motion.span>
          </AnimatePresence>
        </motion.div>
        {/* Main content - asymmetric layout */}
        <div className="relative flex flex-col md:flex-row z-10">
          {/* Left column - vertical text */}
          <div className="hidden md:flex flex-col items-center justify-center pr-8 md:pr-16 border-r border-border">
            <motion.span
              className="text-xs font-mono text-muted-foreground tracking-widest uppercase"
              style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Projects
            </motion.span>

            {/* Vertical progress line */}
            <div className="relative h-32 w-px bg-border mt-8">
              <motion.div
                className="absolute top-0 left-0 w-full bg-foreground origin-top"
                animate={{
                  height: `${((activeIndex + 1) / projects.length) * 100}%`,
                }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>

          {/* Center - main content */}
          <div className="flex-1 pl-0 md:pl-16 py-12">
            {/* Project Status & Year Badge */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4 }}
                className="mb-8 flex gap-3"
              >
                <span className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground border border-border rounded-full px-3 py-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    current.status?.toLowerCase() === 'live' 
                      ? 'bg-success' 
                      : current.status?.toLowerCase() === 'in development' 
                      ? 'bg-warning' 
                      : 'bg-muted-foreground'
                  }`} />
                  {current.status || 'Live'}
                </span>
                <span className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground border border-border rounded-full px-3 py-1">
                  {current.dev_year}
                </span>
              </motion.div>
            </AnimatePresence>

            {/* Project Title with character reveal */}
            <div className="relative mb-8 min-h-[140px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  className="space-y-4"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <motion.h3
                    className="text-3xl md:text-4xl lg:text-5xl font-light text-foreground leading-[1.15] tracking-tight"
                  >
                    {current.title.split(" ").map((word, i) => (
                      <motion.span
                        key={i}
                        className="inline-block mr-[0.3em]"
                        variants={{
                          hidden: { opacity: 0, y: 20, rotateX: 90 },
                          visible: {
                            opacity: 1,
                            y: 0,
                            rotateX: 0,
                            transition: {
                              duration: 0.5,
                              delay: i * 0.05,
                              ease: [0.22, 1, 0.36, 1],
                            },
                          },
                          exit: {
                            opacity: 0,
                            y: -10,
                            transition: { duration: 0.2, delay: i * 0.02 },
                          },
                        }}
                      >
                        {word}
                      </motion.span>
                    ))}
                  </motion.h3>
                  
                  <motion.p
                    className="text-base md:text-lg text-muted-foreground leading-relaxed"
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: {
                          duration: 0.5,
                          delay: 0.3,
                          ease: [0.22, 1, 0.36, 1],
                        },
                      },
                      exit: {
                        opacity: 0,
                        y: -10,
                        transition: { duration: 0.2 },
                      },
                    }}
                  >
                    {current.description}
                  </motion.p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Technologies */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="mb-8"
              >
                <div className="flex flex-wrap gap-2">
                  {current.languages.map((tech, idx) => (
                    <motion.span
                      key={tech}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + idx * 0.05 }}
                      className="text-xs font-mono text-muted-foreground/60 px-3 py-1 bg-muted/30 rounded-full border border-border/50"
                    >
                      {tech}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Links & Navigation row */}
            <div className="flex items-end justify-between">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="flex items-center gap-3"
                >
                  {/* Animated line before links */}
                  <motion.div
                    className="w-8 h-px bg-foreground hidden md:block"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    style={{ originX: 0 }}
                  />
                  <div className="flex gap-2">
                    {current.github_link && (
                      <a
                        href={current.github_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative w-10 h-10 rounded-full border border-border flex items-center justify-center overflow-hidden hover:border-foreground/50 transition-colors"
                      >
                        <Github className="w-4 h-4 relative z-10" />
                      </a>
                    )}
                    {current.live_link && (
                      <a
                        href={current.live_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative w-10 h-10 rounded-full border border-border flex items-center justify-center overflow-hidden hover:border-foreground/50 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 relative z-10" />
                      </a>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex items-center gap-4">
                <motion.button
                  onClick={goPrev}
                  className="group relative w-12 h-12 rounded-full border border-border flex items-center justify-center overflow-hidden hover:bg-muted/50 transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="relative z-10 text-foreground"
                  >
                    <path
                      d="M10 12L6 8L10 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.button>

                <motion.button
                  onClick={goNext}
                  className="group relative w-12 h-12 rounded-full border border-border flex items-center justify-center overflow-hidden hover:bg-muted/50 transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="relative z-10 text-foreground"
                  >
                    <path
                      d="M6 4L10 8L6 12"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.button>
              </div>
            </div>
          </div>
        </div>


      </div>
    </div>
  )
}
