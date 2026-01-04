import { useState, useRef, useEffect, useLayoutEffect, useCallback, forwardRef } from "react"
import { cn } from "@/lib/utils"
import { X, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react"

interface Project {
  id: string
  image: string
  title: string
  year?: number
}

interface AnimatedFolderProps {
  title: string
  projects: Project[]
  className?: string
}

export function AnimatedFolder({ title, projects, className }: AnimatedFolderProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [sourceRect, setSourceRect] = useState<DOMRect | null>(null)
  const [hiddenCardId, setHiddenCardId] = useState<string | null>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  const handleProjectClick = (project: Project, index: number) => {
    const cardEl = cardRefs.current[index]
    if (cardEl) {
      setSourceRect(cardEl.getBoundingClientRect())
    }
    setSelectedIndex(index)
    setHiddenCardId(project.id)
  }

  const handleCloseLightbox = () => {
    setSelectedIndex(null)
    setSourceRect(null)
  }

  const handleCloseComplete = () => {
    setHiddenCardId(null)
  }

  return (
    <>
      <div
        className={cn(
          "relative flex flex-col items-center justify-center",
          "p-8 rounded-2xl cursor-pointer",
          "bg-card border border-border",
          "transition-all duration-500 ease-out",
          "hover:shadow-2xl hover:shadow-accent/10",
          "hover:border-accent/30",
          "group",
          className,
        )}
        style={{
          minWidth: "280px",
          minHeight: "320px",
          perspective: "1000px",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Subtle background glow on hover */}
        <div
          className="absolute inset-0 rounded-2xl transition-opacity duration-500"
          style={{
            background: "radial-gradient(circle at 50% 70%, var(--accent) 0%, transparent 70%)",
            opacity: isHovered ? 0.08 : 0,
          }}
        />

        <div className="relative flex items-center justify-center mb-4" style={{ height: "160px", width: "200px" }}>
          {/* Folder back layer - z-index 10 */}
          <div
            className="absolute w-32 h-24 bg-folder-back rounded-xl shadow-md"
            style={{
              transformOrigin: "bottom center",
              transform: isHovered ? "rotateX(-15deg)" : "rotateX(0deg)",
              transition: isHovered 
                ? "transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)"
                : "transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1) 160ms",
              zIndex: 10,
            }}
          />

          {/* Folder tab - z-index 10 */}
          <div
            className="absolute w-12 h-4 bg-folder-tab rounded-t-lg"
            style={{
              top: "calc(50% - 48px - 12px)",
              left: "calc(50% - 64px + 16px)",
              transformOrigin: "bottom center",
              transform: isHovered ? "rotateX(-25deg) translateY(-2px)" : "rotateX(0deg)",
              transition: isHovered 
                ? "transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)"
                : "transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1) 160ms",
              zIndex: 10,
            }}
          />

          {/* Project cards - z-index 20, between back and front */}
          <div
            className="absolute"
            style={{
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 20,
            }}
          >
            {projects.slice(0, 3).map((project, index) => (
              <ProjectCard
                key={project.id}
                ref={(el) => {
                  cardRefs.current[index] = el
                }}
                image={project.image}
                title={project.title}
                delay={index * 80}
                isVisible={isHovered}
                index={index}
                onClick={() => handleProjectClick(project, index)}
                isSelected={hiddenCardId === project.id}
              />
            ))}
          </div>

          {/* Folder front layer - z-index 30 */}
          <div
            className="absolute w-32 h-24 bg-folder-front rounded-xl shadow-lg"
            style={{
              top: "calc(50% - 48px + 4px)",
              transformOrigin: "bottom center",
              transform: isHovered ? "rotateX(25deg) translateY(8px)" : "rotateX(0deg)",
              transition: isHovered 
                ? "transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)"
                : "transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1) 160ms",
              zIndex: 30,
            }}
          />

          {/* Folder shine effect - z-index 31 */}
          <div
            className="absolute w-32 h-24 rounded-xl overflow-hidden pointer-events-none"
            style={{
              top: "calc(50% - 48px + 4px)",
              background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)",
              transformOrigin: "bottom center",
              transform: isHovered ? "rotateX(25deg) translateY(8px)" : "rotateX(0deg)",
              transition: isHovered 
                ? "transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)"
                : "transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1) 160ms",
              zIndex: 31,
            }}
          />
        </div>

        {/* Folder title */}
        <h3
          className="text-lg font-semibold text-foreground mt-4 transition-all duration-300"
          style={{
            transform: isHovered ? "translateY(4px)" : "translateY(0)",
          }}
        >
          {title}
        </h3>

        {/* Project count */}
        <p
          className="text-sm text-muted-foreground transition-all duration-300"
          style={{
            opacity: isHovered ? 0.7 : 1,
          }}
        >
          {projects.length} projects
        </p>
      </div>

      <ImageLightbox
        projects={projects}
        currentIndex={selectedIndex ?? 0}
        isOpen={selectedIndex !== null}
        onClose={handleCloseLightbox}
        onIndexChange={setSelectedIndex}
        sourceRect={sourceRect}
        onCloseComplete={handleCloseComplete}
      />
    </>
  )
}

interface ImageLightboxProps {
  projects: Project[]
  currentIndex: number
  isOpen: boolean
  onClose: () => void
  onIndexChange: (index: number) => void
  sourceRect: DOMRect | null
  onCloseComplete?: () => void
}

export function ImageLightbox({
  projects,
  currentIndex,
  isOpen,
  onClose,
  onIndexChange,
  sourceRect,
  onCloseComplete,
}: ImageLightboxProps) {
  const [animationPhase, setAnimationPhase] = useState<"initial" | "animating" | "complete">("initial")
  const [isClosing, setIsClosing] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Touch/swipe state
  const touchStartX = useRef<number>(0)
  const touchEndX = useRef<number>(0)
  const isSwiping = useRef<boolean>(false)

  const currentProject = projects[currentIndex]
  const canGoPrev = currentIndex > 0
  const canGoNext = currentIndex < projects.length - 1

  const handlePrev = useCallback(() => {
    if (canGoPrev) {
      onIndexChange(currentIndex - 1)
    }
  }, [canGoPrev, currentIndex, onIndexChange])

  const handleNext = useCallback(() => {
    if (canGoNext) {
      onIndexChange(currentIndex + 1)
    }
  }, [canGoNext, currentIndex, onIndexChange])

  const handleClose = useCallback(() => {
    setIsClosing(true)
    onClose()
    setTimeout(() => {
      setIsClosing(false)
      setShouldRender(false)
      setAnimationPhase("initial")
      onCloseComplete?.()
    }, 400)
  }, [onClose, onCloseComplete])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === "Escape") handleClose()
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        handlePrev()
      }
      if (e.key === "ArrowRight") {
        e.preventDefault()
        handleNext()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    if (isOpen) {
      document.body.style.overflow = "hidden"
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [isOpen, handleClose, handlePrev, handleNext])

  useLayoutEffect(() => {
    if (isOpen && sourceRect) {
      setShouldRender(true)
      setAnimationPhase("initial")
      setIsClosing(false)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimationPhase("animating")
        })
      })
      const timer = setTimeout(() => {
        setAnimationPhase("complete")
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isOpen, sourceRect])

  if (!shouldRender || !currentProject) return null

  const getInitialStyles = (): React.CSSProperties => {
    if (!sourceRect) return {}

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const targetWidth = Math.min(768, viewportWidth - 64)
    const targetHeight = Math.min(viewportHeight * 0.85, 600)

    const targetX = (viewportWidth - targetWidth) / 2
    const targetY = (viewportHeight - targetHeight) / 2

    const scaleX = sourceRect.width / targetWidth
    const scaleY = sourceRect.height / targetHeight
    const scale = Math.max(scaleX, scaleY)

    const translateX = sourceRect.left + sourceRect.width / 2 - (targetX + targetWidth / 2)
    const translateY = sourceRect.top + sourceRect.height / 2 - (targetY + targetHeight / 2)

    return {
      transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
      opacity: 1,
    }
  }

  const getFinalStyles = (): React.CSSProperties => {
    return {
      transform: "translate(0, 0) scale(1)",
      opacity: 1,
    }
  }

  const currentStyles = animationPhase === "initial" && !isClosing ? getInitialStyles() : getFinalStyles()

  // Touch/swipe handlers for mobile navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchEndX.current = e.touches[0].clientX
    isSwiping.current = false
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
    const diffX = Math.abs(touchEndX.current - touchStartX.current)
    // Only consider it a swipe if horizontal movement is significant
    if (diffX > 10) {
      isSwiping.current = true
    }
  }

  const handleTouchEnd = () => {
    if (!isSwiping.current) return
    
    const diffX = touchStartX.current - touchEndX.current
    const minSwipeDistance = 50 // Minimum swipe distance in pixels
    
    if (Math.abs(diffX) > minSwipeDistance) {
      if (diffX > 0) {
        // Swiped left -> next
        handleNext()
      } else {
        // Swiped right -> prev
        handlePrev()
      }
    }
    
    isSwiping.current = false
  }

  return (
    <div
      className={cn("fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8")}
      onClick={handleClose}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        opacity: isClosing ? 0 : 1,
        transition: "opacity 400ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-xl"
        style={{
          opacity: animationPhase === "initial" && !isClosing ? 0 : 1,
          transition: "opacity 400ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />

      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleClose()
        }}
        className={cn(
          "absolute top-5 right-5 z-50",
          "w-10 h-10 flex items-center justify-center",
          "rounded-full bg-muted/50 backdrop-blur-md",
          "border border-border",
          "text-muted-foreground hover:text-foreground hover:bg-muted",
          "transition-all duration-300 ease-out hover:scale-105 active:scale-95",
        )}
        style={{
          opacity: animationPhase === "complete" && !isClosing ? 1 : 0,
          transform: animationPhase === "complete" && !isClosing ? "translateY(0)" : "translateY(-10px)",
          transition: "opacity 300ms ease-out, transform 300ms ease-out",
        }}
      >
        <X className="w-4 h-4" strokeWidth={2.5} />
      </button>

      {/* Left arrow navigation button */}
      {projects.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            handlePrev()
          }}
          disabled={!canGoPrev}
          className={cn(
            "absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-50",
            "w-10 h-10 md:w-12 md:h-12 flex items-center justify-center",
            "rounded-full bg-muted/50 backdrop-blur-md",
            "border border-border",
            "text-muted-foreground hover:text-foreground hover:bg-muted",
            "transition-all duration-300 ease-out hover:scale-105 active:scale-95",
            "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100",
          )}
          style={{
            opacity: animationPhase === "complete" && !isClosing ? 1 : 0,
            transform: animationPhase === "complete" && !isClosing ? "translateY(-50%)" : "translateY(-50%) translateX(-10px)",
            transition: "opacity 300ms ease-out, transform 300ms ease-out",
          }}
          aria-label="Previous certificate"
        >
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2} />
        </button>
      )}

      {/* Right arrow navigation button */}
      {projects.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleNext()
          }}
          disabled={!canGoNext}
          className={cn(
            "absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-50",
            "w-10 h-10 md:w-12 md:h-12 flex items-center justify-center",
            "rounded-full bg-muted/50 backdrop-blur-md",
            "border border-border",
            "text-muted-foreground hover:text-foreground hover:bg-muted",
            "transition-all duration-300 ease-out hover:scale-105 active:scale-95",
            "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100",
          )}
          style={{
            opacity: animationPhase === "complete" && !isClosing ? 1 : 0,
            transform: animationPhase === "complete" && !isClosing ? "translateY(-50%)" : "translateY(-50%) translateX(10px)",
            transition: "opacity 300ms ease-out, transform 300ms ease-out",
          }}
          aria-label="Next certificate"
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2} />
        </button>
      )}

      <div
        ref={containerRef}
        className="relative z-10 w-full max-w-3xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          ...currentStyles,
          transform: isClosing ? "translate(0, 0) scale(0.95)" : currentStyles.transform,
          transition:
            animationPhase === "initial" && !isClosing
              ? "none"
              : "transform 400ms cubic-bezier(0.16, 1, 0.3, 1), opacity 400ms ease-out",
          transformOrigin: "center center",
        }}
      >
        <div
          className={cn("relative overflow-hidden", "rounded-2xl", "bg-card", "ring-1 ring-border", "shadow-2xl")}
          style={{
            borderRadius: animationPhase === "initial" && !isClosing ? "8px" : "16px",
            transition: "border-radius 500ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div className="relative overflow-hidden">
            <img
              src={currentProject.image}
              alt={currentProject.title}
              className="w-full h-auto max-h-[70vh] object-contain bg-background"
              onError={(e) => {
                e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='600' viewBox='0 0 400 600'%3E%3Crect width='400' height='600' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%23999'%3EImage not found%3C/text%3E%3C/svg%3E";
              }}
            />

            {/* Subtle vignette effect */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-card/20 via-transparent to-card/10" />
          </div>

          <div
            className={cn("px-6 py-5", "bg-card", "border-t border-border")}
            style={{
              opacity: animationPhase === "complete" && !isClosing ? 1 : 0,
              transform: animationPhase === "complete" && !isClosing ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 300ms ease-out 100ms, transform 300ms ease-out 100ms",
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-foreground tracking-tight truncate h-7">
                  {currentProject?.title}
                </h3>
                {currentProject?.year && (
                  <p className="text-sm font-medium text-muted-foreground mt-1">
                    {currentProject.year}
                  </p>
                )}
              </div>

              <button
                className={cn(
                  "flex items-center gap-2 px-4 py-2",
                  "text-sm font-medium text-muted-foreground",
                  "bg-muted/50 hover:bg-muted",
                  "rounded-lg border border-border",
                  "transition-all duration-200 ease-out",
                  "hover:text-foreground",
                )}
              >
                <span>View</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ProjectCardProps {
  image: string
  title: string
  delay: number
  isVisible: boolean
  index: number
  onClick: () => void
  isSelected: boolean
}

export const ProjectCard = forwardRef<HTMLDivElement, ProjectCardProps>(
  ({ image, title, delay, isVisible, index, onClick, isSelected }, ref) => {
    const rotations = [-12, 0, 12]
    const translations = [-55, 0, 55]

    return (
      <div
        ref={ref}
        className={cn(
          "absolute w-20 h-28 rounded-xl overflow-hidden shadow-xl",
          "bg-card border border-border",
          "cursor-pointer hover:ring-2 hover:ring-accent/50",
          isSelected && "opacity-0",
        )}
        style={{
          transform: isVisible
            ? `translateY(-90px) translateX(${translations[index]}px) rotate(${rotations[index]}deg) scale(1)`
            : "translateY(0px) translateX(0px) rotate(0deg) scale(0.5)",
          opacity: isSelected ? 0 : isVisible ? 1 : 0,
          transition: `all 600ms cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`,
          zIndex: 10 - index,
          left: "-40px",
          top: "-56px",
        }}
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
      >
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='112' viewBox='0 0 80 112'%3E%3Crect width='80' height='112' fill='%23f0f0f0'/%3E%3C/svg%3E";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
        <p className="absolute bottom-1.5 left-1.5 right-1.5 text-[10px] font-medium text-primary-foreground truncate">
          {title}
        </p>
      </div>
    )
  },
)

ProjectCard.displayName = "ProjectCard"
