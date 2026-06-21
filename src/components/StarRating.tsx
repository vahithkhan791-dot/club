import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

export default function StarRating({ 
  rating, 
  maxStars = 5, 
  size = 16, 
  interactive = false, 
  onRatingChange 
}: StarRatingProps) {
  const starsArray = Array.from({ length: maxStars }, (_, i) => i + 1);

  return (
    <div className="flex items-center gap-0.5 select-none text-amber-400">
      {starsArray.map((num) => {
        const fillValue = rating >= num ? 'fill-current' : rating >= num - 0.5 ? 'opacity-50 fill-current' : 'text-gray-200';
        return (
          <Star
            key={num}
            size={size}
            className={`${fillValue} ${interactive ? 'cursor-pointer hover:scale-115 transition-transform duration-100' : ''}`}
            onClick={() => interactive && onRatingChange && onRatingChange(num)}
          />
        );
      })}
    </div>
  );
}
