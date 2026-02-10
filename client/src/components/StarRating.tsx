import { Star, StarHalf } from "lucide-react";

interface StarRatingProps {
  rating: number;
  count?: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
}

export default function StarRating({
  rating,
  count,
  size = "md",
  showCount = true,
}: StarRatingProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  if (count === 0 || rating === 0) {
    return (
      <div className="flex items-center gap-1 text-muted-foreground text-sm">
        <Star className={`${sizeClasses[size]} text-gray-300`} />
        <span>Sem avaliações</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1" data-testid="star-rating-display">
      {Array(fullStars)
        .fill(0)
        .map((_, i) => (
          <Star
            key={`full-${i}`}
            className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400`}
          />
        ))}
      {hasHalfStar && (
        <div className="relative">
          <Star className={`${sizeClasses[size]} text-gray-300`} />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Star className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400`} />
          </div>
        </div>
      )}
      {Array(emptyStars)
        .fill(0)
        .map((_, i) => (
          <Star key={`empty-${i}`} className={`${sizeClasses[size]} text-gray-300`} />
        ))}
      {showCount && count !== undefined && (
        <span className="ml-1 text-sm text-muted-foreground">
          {rating.toFixed(1)} ({count})
        </span>
      )}
    </div>
  );
}
