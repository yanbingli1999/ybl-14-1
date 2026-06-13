import useGameStore from '@/store/useGameStore';
import { Zap, Star, Coins, Footprints, BarChart3, RotateCcw } from 'lucide-react';

export default function StatusBar() {
  const { score, moves, combo, maxCombo, profile, setShowStats, resetGame } = useGameStore();

  return (
    <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 rounded-2xl p-4 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <Footprints className="w-5 h-5 text-white/80" />
            <div>
              <div className="text-xs text-white/70">剩余步数</div>
              <div className={`text-xl font-bold text-white ${moves <= 5 ? 'text-yellow-300 animate-pulse' : ''}`}>
                {moves}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-300" />
            <div>
              <div className="text-xs text-white/70">连击</div>
              <div className="text-xl font-bold text-yellow-300">
                {combo > 0 ? `x${combo}` : '-'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-white/80" />
            <div>
              <div className="text-xs text-white/70">得分</div>
              <div className="text-xl font-bold text-white">{score}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/20 rounded-xl px-3 py-2">
            <Coins className="w-5 h-5 text-yellow-300" />
            <div>
              <div className="text-xs text-white/70">金币</div>
              <div className="text-lg font-bold text-yellow-300">{profile.coins}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/20 rounded-xl px-3 py-2">
            <Star className="w-5 h-5 text-white" />
            <div>
              <div className="text-xs text-white/70">信誉</div>
              <div className="text-lg font-bold text-white">{profile.reputation}</div>
            </div>
          </div>

          <button
            onClick={() => setShowStats(true)}
            className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
            title="统计数据"
          >
            <BarChart3 className="w-5 h-5 text-white" />
          </button>

          <button
            onClick={resetGame}
            className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
            title="重新开始"
          >
            <RotateCcw className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {combo > 1 && (
        <div className="mt-2 text-center">
          <span className="inline-block px-4 py-1 bg-yellow-400 text-yellow-900 rounded-full font-bold text-sm animate-bounce">
            🔥 {combo} 连击！ +{Math.floor(combo * 10)} 额外分数
          </span>
        </div>
      )}

      {maxCombo > 0 && combo === 0 && (
        <div className="mt-2 text-center">
          <span className="text-xs text-white/60">
            本局最高连击: x{maxCombo}
          </span>
        </div>
      )}
    </div>
  );
}
