import { Candy } from '@/types';
import { CANDY_CONFIG } from '@/data/config';
import { cn } from '@/lib/utils';

interface CandyCellProps {
  candy: Candy | null;
  isSelected: boolean;
  onClick: () => void;
  row: number;
  col: number;
}

export default function CandyCell({ candy, isSelected, onClick }: CandyCellProps) {
  if (!candy) {
    return <div className="w-12 h-12 sm:w-14 sm:h-14" />;
  }

  const config = CANDY_CONFIG[candy.type];
  const isSpecial = candy.isSpecial;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-2xl sm:text-3xl',
        'transition-all duration-200 transform',
        'hover:scale-110 active:scale-95',
        'shadow-md hover:shadow-lg',
        isSelected && 'ring-4 ring-white ring-opacity-80 scale-110 z-10',
        candy.isMatched && 'animate-pulse scale-0 opacity-0',
        candy.isFalling && 'animate-bounce',
        isSpecial && 'animate-pulse'
      )}
      style={{
        background: isSpecial && candy.specialType === 'rainbow'
          ? 'linear-gradient(135deg, #FF6B9D, #FFD93D, #6BCB77, #4D96FF, #9B59B6)'
          : config.color,
        boxShadow: isSelected
          ? `0 0 20px ${config.color}, 0 4px 6px rgba(0,0,0,0.2)`
          : `0 4px 6px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.3)`,
      }}
    >
      <span className="drop-shadow-md">{config.emoji}</span>
    </button>
  );
}
