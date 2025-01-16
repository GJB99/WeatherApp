import { ArrowUpIcon } from '@heroicons/react/24/solid'

interface WindDirectionArrowProps {
  degrees: number;
  className?: string;
}

export default function WindDirectionArrow({ degrees, className = "" }: WindDirectionArrowProps) {
  const arrowDirection = (degrees + 180) % 360;
  
  return (
    <ArrowUpIcon 
      className={`h-4 w-4 inline-block ${className}`} 
      style={{ transform: `rotate(${arrowDirection}deg)` }}
    />
  )
}