import useGameStore from '@/store/useGameStore';
import CandyCell from './CandyCell';
import { BOARD_SIZE } from '@/types';

export default function GameBoard() {
  const { board, selectedCandy, selectCandy, isAnimating, gamePhase } = useGameStore();

  const handleCellClick = (row: number, col: number) => {
    if (isAnimating || gamePhase !== 'playing') return;
    selectCandy({ row, col });
  };

  return (
    <div className="relative">
      <div
        className="grid gap-1 sm:gap-1.5 p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 shadow-xl"
        style={{
          gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
          boxShadow: '0 10px 40px rgba(139, 69, 19, 0.3), inset 0 2px 4px rgba(255,255,255,0.5)',
        }}
      >
        {board.map((row, rowIndex) =>
          row.map((candy, colIndex) => (
            <CandyCell
              key={candy?.id || `empty-${rowIndex}-${colIndex}`}
              candy={candy}
              row={rowIndex}
              col={colIndex}
              isSelected={
                selectedCandy?.row === rowIndex && selectedCandy?.col === colIndex
              }
              onClick={() => handleCellClick(rowIndex, colIndex)}
            />
          ))
        )}
      </div>

      <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-amber-600 shadow-lg border-4 border-amber-200" />
      <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-amber-600 shadow-lg border-4 border-amber-200" />
      <div className="absolute -bottom-3 -left-3 w-8 h-8 rounded-full bg-amber-600 shadow-lg border-4 border-amber-200" />
      <div className="absolute -bottom-3 -right-3 w-8 h-8 rounded-full bg-amber-600 shadow-lg border-4 border-amber-200" />
    </div>
  );
}
