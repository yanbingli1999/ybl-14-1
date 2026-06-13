import useGameStore from '@/store/useGameStore';
import { RotateCcw, Star, Zap, Coins } from 'lucide-react';

export default function GameOverModal() {
  const { gamePhase, score, maxCombo, resetGame, profile } = useGameStore();

  if (gamePhase !== 'gameover') return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-8 text-center">
          <div className="text-6xl mb-4">🎮</div>
          <h2 className="text-2xl font-bold text-white mb-2">游戏结束</h2>
          <p className="text-white/80 text-sm">步数已用完，下次加油！</p>
        </div>

        <div className="bg-white rounded-t-3xl p-6 -mt-2">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-purple-50 rounded-xl">
              <Star className="w-6 h-6 text-purple-500 mx-auto mb-1" />
              <div className="text-xl font-bold text-purple-600">{score}</div>
              <div className="text-xs text-gray-500">得分</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-xl">
              <Zap className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
              <div className="text-xl font-bold text-yellow-600">x{maxCombo}</div>
              <div className="text-xs text-gray-500">最高连击</div>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-xl">
              <Coins className="w-6 h-6 text-amber-500 mx-auto mb-1" />
              <div className="text-xl font-bold text-amber-600">{profile.coins}</div>
              <div className="text-xs text-gray-500">金币</div>
            </div>
          </div>

          <button
            onClick={resetGame}
            className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl
              hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 active:scale-95
              flex items-center justify-center gap-2 shadow-lg"
          >
            <RotateCcw className="w-5 h-5" />
            再来一局
          </button>
        </div>
      </div>
    </div>
  );
}
