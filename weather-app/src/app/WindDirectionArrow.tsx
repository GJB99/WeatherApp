import { ArrowUpIcon } from '@heroicons/react/24/solid'

interface WindDirectionArrowProps {
  degrees: number;
  className?: string;
}

export default function WindDirectionArrow({ degrees, className = "" }: WindDirectionArrowProps) {
  return (
    <ArrowUpIcon 
      className={`h-4 w-4 inline-block ${className}`} 
      style={{ transform: `rotate(${degrees}deg)` }}
    />
  )
}