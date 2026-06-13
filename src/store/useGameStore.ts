import { create } from 'zustand';
import {
  Candy,
  Position,
  MatchResult,
  Train,
  StationOrder,
  DispatchResult,
  PlayerProfile,
  AllStats,
} from '@/types';
import {
  createInitialBoard,
  isAdjacent,
  swapCandies,
  findAllMatches,
  findSpecialMatches,
  markMatched,
  removeMatched,
  applyGravity,
  fillEmptySpaces,
  placeSpecialCandies,
  countClearedCandies,
  calculateScore,
  checkSwapHasSpecial,
  triggerSpecialCandy,
} from '@/engine/matchEngine';
import { loadCandiesToTrain, clearTrain } from '@/engine/loadingSystem';
import { calculateDispatchResult } from '@/engine/dispatchSystem';
import { generateOrder } from '@/engine/contractSystem';
import {
  loadProfile,
  saveProfile,
  loadStats,
  checkUnlockedStations,
  saveGameState,
  loadGameState,
  clearGameState,
  recordDispatchStats,
} from '@/utils/storage';
import { INITIAL_TRAIN, GAME_CONFIG, STATIONS } from '@/data/config';

interface GameStore {
  board: (Candy | null)[][];
  selectedCandy: Position | null;
  score: number;
  moves: number;
  combo: number;
  maxCombo: number;
  train: Train;
  currentOrder: StationOrder | null;
  currentStationId: string;
  isAnimating: boolean;
  gamePhase: 'playing' | 'dispatching' | 'result' | 'gameover';
  dispatchResult: DispatchResult | null;
  profile: PlayerProfile;
  stats: AllStats;
  showStats: boolean;

  selectCandy: (pos: Position) => void;
  processSwap: (pos1: Position, pos2: Position) => void;
  processMatches: (forcedMatches?: MatchResult[]) => Promise<void>;
  dispatchTrain: () => void;
  nextOrder: () => void;
  resetGame: () => void;
  setShowStats: (show: boolean) => void;
  closeResult: () => void;
  changeStation: (stationId: string) => void;
  persist: () => void;
}

const useGameStore = create<GameStore>((set, get) => {
  const initialProfile = loadProfile();
  const initialStats = loadStats();
  const persisted = loadGameState(initialProfile);

  return {
    board: persisted?.board || createInitialBoard(),
    selectedCandy: null,
    score: persisted?.score ?? 0,
    moves: persisted?.moves ?? GAME_CONFIG.INITIAL_MOVES,
    combo: persisted?.combo ?? 0,
    maxCombo: persisted?.maxCombo ?? 0,
    train: persisted?.train || JSON.parse(JSON.stringify(INITIAL_TRAIN)),
    currentOrder: persisted?.currentOrder,
    currentStationId: persisted?.currentStationId || initialProfile.unlockedStations[0] || 'candy-town',
    isAnimating: false,
    gamePhase: persisted?.gamePhase === 'result' ? 'playing' : (persisted?.gamePhase || 'playing'),
    dispatchResult: null,
    profile: initialProfile,
    stats: initialStats,
    showStats: false,

    persist: () => {
      const s = get();
      saveGameState({
        board: s.board,
        train: s.train,
        currentOrder: s.currentOrder,
        currentStationId: s.currentStationId,
        score: s.score,
        moves: s.moves,
        combo: s.combo,
        maxCombo: s.maxCombo,
        gamePhase: s.gamePhase,
        dispatchResult: s.dispatchResult,
      });
    },

    selectCandy: (pos: Position) => {
      const { selectedCandy, board, isAnimating, gamePhase } = get();

      if (isAnimating || gamePhase !== 'playing') return;
      if (!board[pos.row][pos.col]) return;

      if (!selectedCandy) {
        set({ selectedCandy: pos });
      } else if (selectedCandy.row === pos.row && selectedCandy.col === pos.col) {
        set({ selectedCandy: null });
      } else if (isAdjacent(selectedCandy, pos)) {
        get().processSwap(selectedCandy, pos);
        set({ selectedCandy: null });
      } else {
        set({ selectedCandy: pos });
      }
    },

    processSwap: (pos1: Position, pos2: Position) => {
      const { board, moves, isAnimating, gamePhase } = get();

      if (isAnimating || gamePhase !== 'playing' || moves <= 0) return;

      const specialInfo = checkSwapHasSpecial(pos1, pos2, board);

      if (specialInfo.hasSpecial && specialInfo.specialPos && specialInfo.specialType) {
        const newBoard = swapCandies(board, pos1, pos2);
        const forced = triggerSpecialCandy(
          newBoard,
          specialInfo.specialPos,
          specialInfo.specialType,
          specialInfo.normalType
        );

        set({
          board: newBoard,
          moves: moves - 1,
          combo: 0,
          isAnimating: true,
        });

        setTimeout(() => {
          get().processMatches([forced]);
        }, 200);
        return;
      }

      const newBoard = swapCandies(board, pos1, pos2);
      const matches = findAllMatches(newBoard);

      if (matches.length > 0) {
        set({
          board: newBoard,
          moves: moves - 1,
          combo: 0,
          isAnimating: true,
        });

        setTimeout(() => {
          get().processMatches();
        }, 200);
      } else {
        set({ board: newBoard });
        setTimeout(() => {
          set(state => ({
            board: swapCandies(state.board, pos1, pos2),
          }));
        }, 200);
      }
    },

    processMatches: async (initialMatches?: MatchResult[]) => {
      let currentBoard = get().board;
      let totalCombo = 0;
      let totalScore = 0;
      let allMatches: MatchResult[] = [];

      const processOneRound = (roundIndex: number): Promise<boolean> => {
        return new Promise(resolve => {
          let matches: MatchResult[];

          if (roundIndex === 0 && initialMatches && initialMatches.length > 0) {
            matches = [...initialMatches];
            const extraSpecials = findSpecialMatches(currentBoard, matches);
            matches = [...matches, ...extraSpecials];
          } else {
            matches = findAllMatches(currentBoard);
            const specialMatches = findSpecialMatches(currentBoard, matches);
            matches = [...matches, ...specialMatches];
          }

          if (matches.length === 0) {
            resolve(false);
            return;
          }

          totalCombo++;
          const roundScore = calculateScore(matches, totalCombo - 1);
          totalScore += roundScore;
          allMatches = [...allMatches, ...matches];

          currentBoard = markMatched(currentBoard, matches);
          set({ board: currentBoard });

          setTimeout(() => {
            currentBoard = removeMatched(currentBoard);
            currentBoard = placeSpecialCandies(currentBoard, matches);
            currentBoard = applyGravity(currentBoard);
            currentBoard = fillEmptySpaces(currentBoard);

            for (let r = 0; r < currentBoard.length; r++) {
              for (let c = 0; c < currentBoard[r].length; c++) {
                if (currentBoard[r][c]) {
                  currentBoard[r][c] = { ...currentBoard[r][c]!, isFalling: false };
                }
              }
            }

            set({ board: currentBoard });
            resolve(true);
          }, 300);
        });
      };

      const runCascade = async () => {
        let hasMatches = true;
        let round = 0;
        while (hasMatches) {
          hasMatches = await processOneRound(round);
          round++;
        }

        const candyCounts = countClearedCandies(allMatches);
        const { train: newTrain } = loadCandiesToTrain(get().train, candyCounts);

        const newMaxCombo = Math.max(get().maxCombo, totalCombo);

        set(state => ({
          train: newTrain,
          score: state.score + totalScore,
          combo: totalCombo,
          maxCombo: newMaxCombo,
          isAnimating: false,
        }));

        get().persist();

        if (get().moves <= 0) {
          set({ gamePhase: 'gameover' });
          clearGameState();
        }
      };

      runCascade();
    },

    dispatchTrain: () => {
      const { train, currentOrder, profile, gamePhase, moves, maxCombo } = get();

      if (gamePhase !== 'playing' || !currentOrder) return;

      const result = calculateDispatchResult(train, currentOrder);

      let newCoins = profile.coins + result.reward - result.penalty;
      newCoins = Math.max(0, newCoins);
      let newReputation = profile.reputation + result.reputationChange;
      newReputation = Math.max(0, newReputation);

      const newUnlocked = checkUnlockedStations(newReputation);

      const newProfile: PlayerProfile = {
        ...profile,
        coins: newCoins,
        reputation: newReputation,
        unlockedStations: newUnlocked,
        level: Math.floor(newReputation / 100) + 1,
      };

      saveProfile(newProfile);

      const movesUsed = GAME_CONFIG.INITIAL_MOVES - moves;
      recordDispatchStats(
        Math.max(1, movesUsed),
        Math.max(1, maxCombo),
        result.mismatches.length,
        result.penalty,
        currentOrder.isUrgent,
        result.success,
        newReputation,
        result.reputationChange
      );

      set({
        gamePhase: 'result',
        dispatchResult: result,
        profile: newProfile,
        stats: loadStats(),
      });

      clearGameState();
    },

    nextOrder: () => {
      const { currentStationId, profile } = get();
      const newOrder = generateOrder(currentStationId, profile.reputation);

      set(state => ({
        train: clearTrain(state.train),
        currentOrder: newOrder,
        gamePhase: 'playing',
        dispatchResult: null,
        board: createInitialBoard(),
        score: 0,
        moves: GAME_CONFIG.INITIAL_MOVES,
        combo: 0,
        maxCombo: 0,
      }));

      get().persist();
    },

    resetGame: () => {
      const profile = loadProfile();
      const stationId = profile.unlockedStations[0] || 'candy-town';
      const order = generateOrder(stationId, profile.reputation);

      set({
        board: createInitialBoard(),
        selectedCandy: null,
        score: 0,
        moves: GAME_CONFIG.INITIAL_MOVES,
        combo: 0,
        maxCombo: 0,
        train: JSON.parse(JSON.stringify(INITIAL_TRAIN)),
        currentOrder: order,
        currentStationId: stationId,
        isAnimating: false,
        gamePhase: 'playing',
        dispatchResult: null,
        profile,
        stats: loadStats(),
      });

      clearGameState();
      get().persist();
    },

    setShowStats: (show: boolean) => {
      if (show) {
        set({ showStats: show, stats: loadStats() });
      } else {
        set({ showStats: show });
      }
    },

    closeResult: () => {
      set({ gamePhase: 'playing', dispatchResult: null });
    },

    changeStation: (stationId: string) => {
      const { profile } = get();
      const station = STATIONS.find(s => s.id === stationId);

      if (!station || station.reputationRequired > profile.reputation) return;

      const newOrder = generateOrder(stationId, profile.reputation);

      set(state => ({
        currentStationId: stationId,
        currentOrder: newOrder,
        train: clearTrain(state.train),
      }));

      get().persist();
    },
  };
});

export default useGameStore;
