import { Carriage } from '@/types';
import { CANDY_CONFIG } from '@/data/config';
import { getLoadPercentage } from '@/engine/loadingSystem';

interface CarriageCardProps {
  carriage: Carriage;
}

export default function CarriageCard({ carriage }: CarriageCardProps) {
  const config = CANDY_CONFIG[carriage.candyType];
  const loadPercent = getLoadPercentage(carriage);
  const isFull = loadPercent >= 100;

  return (
    <div
      className="relative flex flex-col items-center p-2 rounded-xl bg-gradient-to-b from-gray-100 to-gray-200 shadow-md border-2 border-gray-300 min-w-[70px] sm:min-w-[80px]"
      style={{
        borderColor: config.color + '40',
      }}
    >
      <div
        className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-gray-400"
        style={{ backgroundColor: config.color }}
      />
      <div
        className="absolute -top-1 left-1/4 -translate-x-1/2 w-3 h-3 rounded-full"
        style={{ backgroundColor: config.color }}
      />
      <div
        className="absolute -top-1 right-1/4 translate-x-1/2 w-3 h-3 rounded-full"
        style={{ backgroundColor: config.color }}
      />

      <div className="text-2xl sm:text-3xl mb-1">{config.emoji}</div>

      <div className="text-xs font-bold text-gray-700 mb-1">
        {carriage.currentLoad}/{carriage.capacity}
      </div>

      <div className="w-full h-2 bg-gray-300 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${Math.min(loadPercent, 100)}%`,
            backgroundColor: config.color,
            boxShadow: isFull ? `0 0 8px ${config.color}` : 'none',
          }}
        />
      </div>

      {isFull && (
        <div className="absolute -top-2 -right-2 text-lg animate-bounce">✨</div>
      )}
    </div>
  );
}
