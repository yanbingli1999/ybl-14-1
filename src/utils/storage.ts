import {
  PlayerProfile,
  AllStats,
  StatsStep,
  StatsCombo,
  StatsMismatch,
  StatsUrgent,
  StatsReputation,
  Candy,
  Train,
  StationOrder,
  Position,
  DispatchResult,
} from '@/types';
import { STATIONS, INITIAL_TRAIN, GAME_CONFIG } from '@/data/config';
import { createInitialBoard } from '@/engine/matchEngine';
import { generateOrder } from '@/engine/contractSystem';

const STORAGE_KEYS = {
  PROFILE: 'candy-train-profile',
  STATS: 'candy-train-stats',
  SETTINGS: 'candy-train-settings',
  GAME_STATE: 'candy-train-game-state',
};

export interface PersistedGameState {
  board: (Candy | null)[][];
  train: Train;
  currentOrder: StationOrder | null;
  currentStationId: string;
  score: number;
  moves: number;
  combo: number;
  maxCombo: number;
  gamePhase: 'playing' | 'dispatching' | 'result' | 'gameover';
  dispatchResult: DispatchResult | null;
  timestamp: number;
}

export function saveGameState(state: Omit<PersistedGameState, 'timestamp'>): void {
  try {
    const data: PersistedGameState = { ...state, timestamp: Date.now() };
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save game state:', e);
  }
}

export function loadGameState(profile: PlayerProfile): PersistedGameState | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.GAME_STATE);
    if (data) {
      const parsed = JSON.parse(data) as PersistedGameState;
      const now = Date.now();
      if (now - parsed.timestamp < 24 * 60 * 60 * 1000) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load game state:', e);
  }

  const stationId = profile.unlockedStations[0] || 'candy-town';
  return {
    board: createInitialBoard(),
    train: JSON.parse(JSON.stringify(INITIAL_TRAIN)),
    currentOrder: generateOrder(stationId, profile.reputation),
    currentStationId: stationId,
    score: 0,
    moves: GAME_CONFIG.INITIAL_MOVES,
    combo: 0,
    maxCombo: 0,
    gamePhase: 'playing',
    dispatchResult: null,
    timestamp: Date.now(),
  };
}

export function clearGameState(): void {
  localStorage.removeItem(STORAGE_KEYS.GAME_STATE);
}

const DEFAULT_PROFILE: PlayerProfile = {
  id: 'player-1',
  name: '列车长',
  coins: 100,
  reputation: 0,
  level: 1,
  unlockedStations: ['candy-town'],
};

const DEFAULT_STATS: AllStats = {
  steps: [],
  combos: [],
  mismatches: [],
  urgents: [],
  reputations: [],
};

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function saveProfile(profile: PlayerProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save profile:', e);
  }
}

export function loadProfile(): PlayerProfile {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load profile:', e);
  }
  return { ...DEFAULT_PROFILE };
}

export function saveStats(stats: AllStats): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save stats:', e);
  }
}

export function loadStats(): AllStats {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.STATS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load stats:', e);
  }
  return { ...DEFAULT_STATS };
}

export function recordStepStats(moves: number): void {
  const stats = loadStats();
  const today = getTodayString();
  const todayIndex = stats.steps.findIndex(s => s.date === today);

  if (todayIndex >= 0) {
    stats.steps[todayIndex].totalMoves += moves;
    stats.steps[todayIndex].gamesPlayed += 1;
    if (moves < stats.steps[todayIndex].bestMoves) {
      stats.steps[todayIndex].bestMoves = moves;
    }
  } else {
    const newStat: StatsStep = {
      id: generateId(),
      date: today,
      totalMoves: moves,
      bestMoves: moves,
      gamesPlayed: 1,
    };
    stats.steps.unshift(newStat);
  }

  saveStats(stats);
}

export function recordComboStats(combo: number, maxCombo: number): void {
  const stats = loadStats();
  const today = getTodayString();
  const todayIndex = stats.combos.findIndex(s => s.date === today);

  if (todayIndex >= 0) {
    stats.combos[todayIndex].totalCombos += combo;
    if (maxCombo > stats.combos[todayIndex].maxCombo) {
      stats.combos[todayIndex].maxCombo = maxCombo;
    }
    stats.combos[todayIndex].avgCombo = stats.combos[todayIndex].totalCombos / (stats.steps.find(s => s.date === today)?.gamesPlayed || 1);
  } else {
    const newStat: StatsCombo = {
      id: generateId(),
      date: today,
      totalCombos: combo,
      maxCombo: maxCombo,
      avgCombo: combo,
    };
    stats.combos.unshift(newStat);
  }

  saveStats(stats);
}

export function recordMismatchStats(mismatchCount: number, penalty: number): void {
  const stats = loadStats();
  const today = getTodayString();
  const todayIndex = stats.mismatches.findIndex(s => s.date === today);

  if (todayIndex >= 0) {
    stats.mismatches[todayIndex].mismatchCount += mismatchCount;
    stats.mismatches[todayIndex].totalPenalty += penalty;
    stats.mismatches[todayIndex].dispatches += 1;
  } else {
    const newStat: StatsMismatch = {
      id: generateId(),
      date: today,
      mismatchCount,
      totalPenalty: penalty,
      dispatches: 1,
    };
    stats.mismatches.unshift(newStat);
  }

  saveStats(stats);
}

export function recordUrgentStats(success: boolean): void {
  const stats = loadStats();
  const today = getTodayString();
  const todayIndex = stats.urgents.findIndex(s => s.date === today);

  if (todayIndex >= 0) {
    stats.urgents[todayIndex].urgentCount += 1;
    if (success) {
      stats.urgents[todayIndex].successCount += 1;
    }
    stats.urgents[todayIndex].successRate =
      stats.urgents[todayIndex].successCount / stats.urgents[todayIndex].urgentCount;
  } else {
    const newStat: StatsUrgent = {
      id: generateId(),
      date: today,
      urgentCount: 1,
      successCount: success ? 1 : 0,
      successRate: success ? 1 : 0,
    };
    stats.urgents.unshift(newStat);
  }

  saveStats(stats);
}

export function recordReputationStats(reputation: number, changeAmount: number): void {
  const stats = loadStats();
  const today = getTodayString();
  const todayIndex = stats.reputations.findIndex(s => s.date === today);

  if (todayIndex >= 0) {
    stats.reputations[todayIndex].reputation = reputation;
    stats.reputations[todayIndex].changeAmount += changeAmount;
  } else {
    const newStat: StatsReputation = {
      id: generateId(),
      date: today,
      reputation,
      changeAmount,
    };
    stats.reputations.unshift(newStat);
  }

  saveStats(stats);
}

export function checkUnlockedStations(reputation: number): string[] {
  return STATIONS
    .filter(s => s.reputationRequired <= reputation)
    .map(s => s.id);
}

export function recordDispatchStats(
  movesUsed: number,
  maxCombo: number,
  mismatchCount: number,
  penalty: number,
  isUrgent: boolean,
  urgentSuccess: boolean,
  newReputation: number,
  reputationChange: number
): void {
  recordStepStats(movesUsed);
  recordComboStats(Math.max(1, maxCombo), maxCombo);
  recordMismatchStats(mismatchCount, penalty);

  if (isUrgent) {
    recordUrgentStats(urgentSuccess);
  } else {
    const stats = loadStats();
    const today = getTodayString();
    const todayIndex = stats.urgents.findIndex(s => s.date === today);
    if (todayIndex < 0) {
      stats.urgents.unshift({
        id: generateId(),
        date: today,
        urgentCount: 0,
        successCount: 0,
        successRate: 0,
      });
      saveStats(stats);
    }
  }

  recordReputationStats(newReputation, reputationChange);

  const stats = loadStats();
  const today = getTodayString();

  const mmIdx = stats.mismatches.findIndex(s => s.date === today);
  if (mmIdx < 0) {
    stats.mismatches.unshift({
      id: generateId(),
      date: today,
      mismatchCount: 0,
      totalPenalty: 0,
      dispatches: 1,
    });
  } else {
    stats.mismatches[mmIdx].dispatches += 1;
  }

  saveStats(stats);
}

export function resetAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.PROFILE);
  localStorage.removeItem(STORAGE_KEYS.STATS);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  localStorage.removeItem(STORAGE_KEYS.GAME_STATE);
}

export { DEFAULT_PROFILE, DEFAULT_STATS, INITIAL_TRAIN };
