import { PlayerProfile, AllStats, StatsStep, StatsCombo, StatsMismatch, StatsUrgent, StatsReputation } from '@/types';
import { STATIONS, INITIAL_TRAIN } from '@/data/config';

const STORAGE_KEYS = {
  PROFILE: 'candy-train-profile',
  STATS: 'candy-train-stats',
  SETTINGS: 'candy-train-settings',
};

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

export function resetAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.PROFILE);
  localStorage.removeItem(STORAGE_KEYS.STATS);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
}

export { DEFAULT_PROFILE, DEFAULT_STATS, INITIAL_TRAIN };
