import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ContentCardProps {
  title?: string
  subtitle?: string
  className?: string
  children: ReactNode
  actions?: ReactNode
}

export function ContentCard({ title, subtitle, className, children, actions }: ContentCardProps) {
  return (
    <section className={cn("bg-card border border-border rounded-lg shadow-sm", className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-border">
          <div>
            {title && <h2 className="text-lg font-bold text-foreground">{title}</h2>}
            {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-4 md:p-6">{children}</div>
    </section>
  )
}
