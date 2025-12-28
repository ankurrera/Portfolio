"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

const skills = [
  { name: "Design", level: 95 },
  { name: "Development", level: 90 },
  { name: "Branding", level: 85 },
  { name: "Motion", level: 78 },
  { name: "Strategy", level: 82 },
]

export function Skills() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <div className="flex flex-col w-full max-w-md">
      <div className="flex items-center gap-4 mb-10">
        <div className="h-px w-12 bg-foreground/20 dark:bg-foreground/10" />
        <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-muted-foreground">Expertise</span>
      </div>

      {/* Skills list */}
      <div className="flex flex-col gap-1">
        {skills.map((skill, index) => (
          <div
            key={skill.name}
            className="group relative"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div
              className={cn(
                "relative flex items-center justify-between py-5 px-4 -mx-4 cursor-pointer",
                "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                "rounded-lg",
                hoveredIndex === index ? "bg-foreground/[0.03] dark:bg-foreground/[0.05]" : "bg-transparent",
              )}
            >
              {/* Left side - skill name with animated elements */}
              <div className="relative flex items-center gap-4">
                <div
                  className={cn(
                    "h-5 w-0.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    hoveredIndex === index ? "bg-accent scale-y-100 opacity-100" : "bg-border scale-y-50 opacity-0",
                  )}
                />

                {/* Skill name */}
                <span
                  className={cn(
                    "text-base font-medium tracking-tight transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    hoveredIndex === index ? "text-foreground translate-x-0" : "text-muted-foreground -translate-x-5",
                  )}
                >
                  {skill.name}
                </span>
              </div>

              {/* Right side - progress visualization */}
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-1 rounded-full overflow-hidden bg-border/50 dark:bg-border/30">
                  {/* Background track */}
                  <div className="absolute inset-0 bg-muted/50 dark:bg-muted/20" />

                  {/* Animated fill */}
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
                      "bg-gradient-to-r from-accent/80 to-accent",
                    )}
                    style={{
                      width: hoveredIndex === index ? `${skill.level}%` : "0%",
                      transitionDelay: hoveredIndex === index ? "100ms" : "0ms",
                    }}
                  />

                  {/* Shine effect on hover */}
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent",
                      "transition-transform duration-700 ease-out",
                      hoveredIndex === index ? "translate-x-full" : "-translate-x-full",
                    )}
                    style={{
                      transitionDelay: hoveredIndex === index ? "300ms" : "0ms",
                    }}
                  />
                </div>

                <div className="relative w-10 overflow-hidden">
                  <span
                    className={cn(
                      "block text-sm font-mono tabular-nums text-right",
                      "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                      hoveredIndex === index
                        ? "text-foreground opacity-100 translate-y-0 blur-0"
                        : "text-muted-foreground/40 opacity-0 translate-y-3 blur-sm",
                    )}
                  >
                    {skill.level}%
                  </span>
                </div>
              </div>
            </div>

            {index < skills.length - 1 && (
              <div
                className={cn(
                  "mx-4 h-px transition-all duration-500",
                  hoveredIndex === index || hoveredIndex === index + 1
                    ? "bg-transparent"
                    : "bg-border/30 dark:bg-border/20",
                )}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mt-10 pt-6 border-t border-border/30 dark:border-border/20">
        <div className="w-1.5 h-1.5 rounded-full bg-accent/60 animate-pulse" />
        <p className="text-[11px] text-muted-foreground tracking-wide">Hover to explore</p>
      </div>
    </div>
  )
}
