import Image from 'next/image'
import Link from 'next/link'

export function Logo({ className, width = 32, height = 32 }: { className?: string, width?: number, height?: number }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <div className="relative overflow-hidden rounded-lg">
        <Image 
          src="/logo.png" 
          alt="Jarvis Logo" 
          width={width} 
          height={height}
          className="object-cover"
        />
      </div>
      <span className="text-lg font-bold tracking-tight text-foreground">Jarvis</span>
    </Link>
  )
}
