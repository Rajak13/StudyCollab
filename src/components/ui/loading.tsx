import { cn } from '@/lib/utils'
import { Skeleton } from './skeleton'
import { Spinner } from './spinner'

interface LoadingProps {
  className?: string
  size?: 'sm' | 'default' | 'lg' | 'xl'
  text?: string
  variant?: 'spinner' | 'skeleton' | 'dots'
}

export function Loading({
  className,
  size = 'default',
  text,
  variant = 'spinner',
}: LoadingProps) {
  if (variant === 'skeleton') {
    return (
      <div className={cn('space-y-2', className)}>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    )
  }

  if (variant === 'dots') {
    return (
      <div
        className={cn('flex items-center justify-center space-x-1', className)}
      >
        <div className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.3s]"></div>
        <div className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.15s]"></div>
        <div className="h-2 w-2 animate-bounce rounded-full bg-current"></div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center space-y-2',
        className
      )}
    >
      <Spinner size={size} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  )
}

// Page-level loading component
export function PageLoading({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Loading size="lg" text={text} />
    </div>
  )
}

// Card-level loading component
export function CardLoading({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4 p-6', className)}>
      <Skeleton className="h-6 w-1/3" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  )
}

// List item loading component
export function ListItemLoading({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center space-x-4 p-4', className)}>
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}
