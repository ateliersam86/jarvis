'use client'

import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion"
import { MouseEvent, PropsWithChildren } from "react"
import { cn } from "@/lib/utils"

interface CardProps extends PropsWithChildren {
  className?: string
  noHover?: boolean
}

export function Card({ children, className, noHover = false }: CardProps) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    if (noHover) return
    const { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  return (
    <div
      className={cn(
        "group relative border border-border bg-surface/50 overflow-hidden rounded-xl transition-colors duration-300",
        !noHover && "hover:border-primary/50",
        className
      )}
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(59, 130, 246, 0.15),
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  )
}
