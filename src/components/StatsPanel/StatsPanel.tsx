import { useState } from 'react';
import useGameStore from '@/store/useGameStore';
import { X, Footprints, Zap, AlertTriangle, Flame, Star } from 'lucide-react';

type TabType = 'steps' | 'combos' | 'mismatches' | 'urgents' | 'reputation';

export default function StatsPanel() {
  const { showStats, setShowStats, stats, profile } = useGameStore();
  const [activeTab, setActiveTab] = useState<TabType>('steps');

  if (!showStats) return null;

  const tabs = [
    { id: 'steps' as TabType, label: '步数', icon: Footprints },
    { id: 'combos' as TabType, label: '连击', icon: Zap },
    { id: 'mismatches' as TabType, label: '错装', icon: AlertTriangle },
    { id: 'urgents' as TabType, label: '急单', icon: Flame },
    { id: 'reputation' as TabType, label: '信誉', icon: Star },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">📊 游戏统计</h2>
          <button
            onClick={() => setShowStats(false)}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors
                ${activeTab === tab.id
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 overflow-y-auto max-h-[50vh]">
          {activeTab === 'steps' && (
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3">步数统计</h3>
              {stats.steps.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无数据</p>
              ) : (
                <div className="space-y-2">
                  {stats.steps.slice(0, 10).map(stat => (
                    <div
                      key={stat.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                    >
                      <span className="text-gray-600">{stat.date}</span>
                      <div className="flex gap-4 text-sm">
                        <span className="text-gray-500">
                          总局数: <b className="text-gray-700">{stat.gamesPlayed}</b>
                        </span>
                        <span className="text-gray-500">
                          总步数: <b className="text-blue-600">{stat.totalMoves}</b>
                        </span>
                        <span className="text-gray-500">
                          最佳: <b className="text-green-600">{stat.bestMoves}</b>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'combos' && (
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3">连击统计</h3>
              {stats.combos.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无数据</p>
              ) : (
                <div className="space-y-2">
                  {stats.combos.slice(0, 10).map(stat => (
                    <div
                      key={stat.id}
                      className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl"
                    >
                      <span className="text-gray-600">{stat.date}</span>
                      <div className="flex gap-4 text-sm">
                        <span className="text-gray-500">
                          总连击: <b className="text-yellow-600">{stat.totalCombos}</b>
                        </span>
                        <span className="text-gray-500">
                          最高: <b className="text-orange-600">x{stat.maxCombo}</b>
                        </span>
                        <span className="text-gray-500">
                          平均: <b className="text-amber-600">{stat.avgCombo.toFixed(1)}</b>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'mismatches' && (
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3">错装统计</h3>
              {stats.mismatches.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无数据</p>
              ) : (
                <div className="space-y-2">
                  {stats.mismatches.slice(0, 10).map(stat => (
                    <div
                      key={stat.id}
                      className="flex items-center justify-between p-3 bg-red-50 rounded-xl"
                    >
                      <span className="text-gray-600">{stat.date}</span>
                      <div className="flex gap-4 text-sm">
                        <span className="text-gray-500">
                          发车数: <b className="text-gray-700">{stat.dispatches}</b>
                        </span>
                        <span className="text-gray-500">
                          错装数: <b className="text-red-600">{stat.mismatchCount}</b>
                        </span>
                        <span className="text-gray-500">
                          罚金: <b className="text-red-500">-{stat.totalPenalty}</b>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'urgents' && (
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3">急单统计</h3>
              {stats.urgents.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无数据</p>
              ) : (
                <div className="space-y-2">
                  {stats.urgents.slice(0, 10).map(stat => (
                    <div
                      key={stat.id}
                      className="flex items-center justify-between p-3 bg-orange-50 rounded-xl"
                    >
                      <span className="text-gray-600">{stat.date}</span>
                      <div className="flex gap-4 text-sm">
                        <span className="text-gray-500">
                          急单总数: <b className="text-orange-600">{stat.urgentCount}</b>
                        </span>
                        <span className="text-gray-500">
                          成功: <b className="text-green-600">{stat.successCount}</b>
                        </span>
                        <span className="text-gray-500">
                          成功率: <b className="text-blue-600">
                            {(stat.successRate * 100).toFixed(0)}%
                          </b>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reputation' && (
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3">信誉统计</h3>
              <div className="mb-4 p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{profile.reputation}</div>
                  <div className="text-sm text-gray-600">当前信誉值</div>
                  <div className="text-sm text-gray-500 mt-1">等级: Lv.{profile.level}</div>
                </div>
              </div>
              {stats.reputations.length === 0 ? (
                <p className="text-gray-500 text-center py-4">暂无历史数据</p>
              ) : (
                <div className="space-y-2">
                  {stats.reputations.slice(0, 10).map(stat => (
                    <div
                      key={stat.id}
                      className="flex items-center justify-between p-3 bg-purple-50 rounded-xl"
                    >
                      <span className="text-gray-600">{stat.date}</span>
                      <div className="flex gap-4 text-sm">
                        <span className="text-gray-500">
                          信誉值: <b className="text-purple-600">{stat.reputation}</b>
                        </span>
                        <span className={stat.changeAmount >= 0 ? 'text-green-600' : 'text-red-500'}>
                          {stat.changeAmount >= 0 ? '+' : ''}{stat.changeAmount}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
