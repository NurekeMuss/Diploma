import type React from "react"
import { cn } from "@/lib/utils"

interface StepsProps {
  children: React.ReactNode
  className?: string
}

export function Steps({ children, className }: StepsProps) {
  return <ol className={cn("relative border-l border-muted-foreground/20", className)}>{children}</ol>
}

interface StepProps {
  children: React.ReactNode
  className?: string
}

export function Step({ children, className }: StepProps) {
  return (
    <li className={cn("mb-10 ml-6", className)}>
      <span className="absolute flex items-center justify-center w-8 h-8 bg-primary rounded-full -left-4 ring-4 ring-background">
        <svg
          className="w-3.5 h-3.5 text-primary-foreground"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 16 12"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M1 5.917 5.724 10.5 15 1.5"
          />
        </svg>
      </span>
      {children}
    </li>
  )
}

interface StepTitleProps {
  children: React.ReactNode
  className?: string
}

export function StepTitle({ children, className }: StepTitleProps) {
  return <h3 className={cn("font-medium leading-tight", className)}>{children}</h3>
}

interface StepDescriptionProps {
  children: React.ReactNode
  className?: string
}

export function StepDescription({ children, className }: StepDescriptionProps) {
  return <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>
}

