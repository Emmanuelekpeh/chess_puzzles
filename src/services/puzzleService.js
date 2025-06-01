// Import Lichess puzzles
import lichessPuzzleData from '../data/lichess_puzzles.json';

// Helper function to map Lichess difficulty to our standard format
const mapDifficulty = (lichessDifficulty) => {
  switch (lichessDifficulty) {
    case 'beginner':
      return 'Easy';
    case 'intermediate':
      return 'Medium';
    case 'advanced':
    case 'expert':
      return 'Hard';
    default:
      return 'Medium'; // Default fallback
  }
};

// Use real Lichess puzzles from the imported data
export const samplePuzzles = lichessPuzzleData.puzzles.map(puzzle => ({
  id: puzzle.id,
  fen: puzzle.fen,
  difficulty: mapDifficulty(puzzle.difficulty),
  theme: puzzle.themes[0] || 'puzzle', // Use first theme as primary
  themes: puzzle.themes, // Keep all themes
  rating: puzzle.rating,
  description: `${puzzle.themes.join(', ')} puzzle (Rating: ${puzzle.rating})`,
  hint: `This is a ${puzzle.themes[0]} puzzle. Look for tactical opportunities.`,
  solution: puzzle.moves,
  orientation: puzzle.fen.includes(' w ') ? 'white' : 'black',
  solved: false,
  popularity: puzzle.popularity,
  nbPlays: puzzle.nbPlays,
  gameUrl: puzzle.gameUrl
}));

// Extract unique themes from Lichess puzzles
export const themes = [...new Set(lichessPuzzleData.puzzles.flatMap(p => p.themes))].sort();

export const difficulties = ['Easy', 'Medium', 'Hard'];

// Simulate API calls with pagination
export const fetchPuzzles = async (filters = {}, page = 1, pageSize = 24) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  let filteredPuzzles = [...samplePuzzles];
  
  if (filters.difficulty && filters.difficulty !== 'all') {
    filteredPuzzles = filteredPuzzles.filter(p => p.difficulty === filters.difficulty);
  }
  
  if (filters.theme && filters.theme !== 'all') {
    filteredPuzzles = filteredPuzzles.filter(p => 
      p.theme === filters.theme || (p.themes && p.themes.includes(filters.theme))
    );
  }
  
  if (filters.rating) {
    const [min, max] = filters.rating;
    filteredPuzzles = filteredPuzzles.filter(p => p.rating >= min && p.rating <= max);
  }
  
  // Calculate pagination
  const total = filteredPuzzles.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedPuzzles = filteredPuzzles.slice(startIndex, endIndex);
  
  return {
    puzzles: paginatedPuzzles,
    pagination: {
      currentPage: page,
      pageSize,
      totalItems: total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  };
};

export const fetchPuzzleById = async (id) => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return samplePuzzles.find(p => p.id === id);
};

// Get count of puzzles matching filters (without loading all data)
export const getPuzzleCount = async (filters = {}) => {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  let filteredPuzzles = [...samplePuzzles];
  
  if (filters.difficulty && filters.difficulty !== 'all') {
    filteredPuzzles = filteredPuzzles.filter(p => p.difficulty === filters.difficulty);
  }
  
  if (filters.theme && filters.theme !== 'all') {
    filteredPuzzles = filteredPuzzles.filter(p => 
      p.theme === filters.theme || (p.themes && p.themes.includes(filters.theme))
    );
  }
  
  if (filters.rating) {
    const [min, max] = filters.rating;
    filteredPuzzles = filteredPuzzles.filter(p => p.rating >= min && p.rating <= max);
  }
  
  return {
    total: filteredPuzzles.length,
    solved: filteredPuzzles.filter(p => p.solved).length
  };
};

export const markPuzzleSolved = async (puzzleId) => {
  await new Promise(resolve => setTimeout(resolve, 100));
  const puzzle = samplePuzzles.find(p => p.id === puzzleId);
  if (puzzle) {
    puzzle.solved = true;
  }
  return puzzle;
};

// User progress tracking data store (in production, this would be a database)
let userProgressData = {
  userId: 'default-user', // In a real app, this would be dynamic
  attempts: [], // Array of attempt objects
  totalTimeSpent: 0,
  hintsUsed: 0,
  solutionsRevealed: 0,
  currentStreak: 0,
  lastAttemptDate: null
};

// Save user progress with detailed tracking
export const saveUserProgress = async (puzzleId, progressData) => {
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API delay
  
  const attempt = {
    puzzleId,
    timestamp: new Date(),
    solved: progressData.solved,
    timeSpent: progressData.timeSpent || 0,
    movesUsed: progressData.movesUsed || 0,
    hintsUsed: progressData.hintsUsed || 0,
    solutionRevealed: progressData.solutionRevealed || false,
    firstTry: true // Will be updated if this is a retry
  };
  
  // Check if this puzzle was attempted before
  const previousAttempts = userProgressData.attempts.filter(a => a.puzzleId === puzzleId);
  if (previousAttempts.length > 0) {
    attempt.firstTry = false;
  }
  
  // Add the attempt
  userProgressData.attempts.push(attempt);
  
  // Update global stats
  userProgressData.totalTimeSpent += attempt.timeSpent;
  userProgressData.hintsUsed += attempt.hintsUsed;
  if (attempt.solutionRevealed) {
    userProgressData.solutionsRevealed++;
  }
  
  // Update streak
  if (attempt.solved) {
    if (userProgressData.lastAttemptDate) {
      const daysDiff = Math.floor((attempt.timestamp - userProgressData.lastAttemptDate) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 1) {
        userProgressData.currentStreak++;
      } else {
        userProgressData.currentStreak = 1;
      }
    } else {
      userProgressData.currentStreak = 1;
    }
  } else {
    userProgressData.currentStreak = 0;
  }
  
  userProgressData.lastAttemptDate = attempt.timestamp;
  
  return attempt;
};

// Get comprehensive user statistics
export const getUserStats = async () => {
  await new Promise(resolve => setTimeout(resolve, 200)); // Simulate API delay
  
  const attempts = userProgressData.attempts;
  
  if (attempts.length === 0) {
    return {
      solved: 0,
      attempted: 0,
      totalAttempts: 0,
      accuracy: 0,
      accuracyFirstTry: 0,
      accuracyByDifficulty: {
        Easy: { solved: 0, attempted: 0, totalAttempts: 0, accuracy: 0 },
        Medium: { solved: 0, attempted: 0, totalAttempts: 0, accuracy: 0 },
        Hard: { solved: 0, attempted: 0, totalAttempts: 0, accuracy: 0 }
      },
      accuracyByTheme: {},
      currentStreak: 0,
      longestStreak: 0,
      averageTime: 0,
      totalTime: 0,
      hintsUsed: 0,
      solutionsRevealed: 0,
      estimatedRating: 1200
    };
  }
  
  // Calculate basic stats
  const uniquePuzzlesAttempted = [...new Set(attempts.map(a => a.puzzleId))];
  const solvedAttempts = attempts.filter(a => a.solved);
  const uniquePuzzlesSolved = [...new Set(solvedAttempts.map(a => a.puzzleId))];
  const firstTryAttempts = attempts.filter(a => a.firstTry);
  const firstTrySolved = firstTryAttempts.filter(a => a.solved);
  
  const accuracy = Math.round((uniquePuzzlesSolved.length / uniquePuzzlesAttempted.length) * 100);
  const accuracyFirstTry = firstTryAttempts.length > 0 ? 
    Math.round((firstTrySolved.length / firstTryAttempts.length) * 100) : 0;
  
  // Calculate accuracy by difficulty
  const accuracyByDifficulty = { 
    Easy: { solved: 0, attempted: 0, totalAttempts: 0, accuracy: 0 },
    Medium: { solved: 0, attempted: 0, totalAttempts: 0, accuracy: 0 },
    Hard: { solved: 0, attempted: 0, totalAttempts: 0, accuracy: 0 } 
  };
  
  uniquePuzzlesAttempted.forEach(puzzleId => {
    const puzzle = samplePuzzles.find(p => p.id === puzzleId);
    if (puzzle) {
      const puzzleAttempts = attempts.filter(a => a.puzzleId === puzzleId);
      const solved = puzzleAttempts.some(a => a.solved);
      
      accuracyByDifficulty[puzzle.difficulty].attempted++;
      accuracyByDifficulty[puzzle.difficulty].totalAttempts += puzzleAttempts.length;
      if (solved) {
        accuracyByDifficulty[puzzle.difficulty].solved++;
      }
    }
  });
  
  // Calculate accuracy percentages for each difficulty
  Object.keys(accuracyByDifficulty).forEach(difficulty => {
    const data = accuracyByDifficulty[difficulty];
    data.accuracy = data.attempted > 0 ? Math.round((data.solved / data.attempted) * 100) : 0;
  });
  
  // Calculate accuracy by theme
  const accuracyByTheme = {};
  uniquePuzzlesAttempted.forEach(puzzleId => {
    const puzzle = samplePuzzles.find(p => p.id === puzzleId);
    if (puzzle) {
      if (!accuracyByTheme[puzzle.theme]) {
        accuracyByTheme[puzzle.theme] = { solved: 0, attempted: 0, totalAttempts: 0, accuracy: 0 };
      }
      
      const puzzleAttempts = attempts.filter(a => a.puzzleId === puzzleId);
      const solved = puzzleAttempts.some(a => a.solved);
      
      accuracyByTheme[puzzle.theme].attempted++;
      accuracyByTheme[puzzle.theme].totalAttempts += puzzleAttempts.length;
      if (solved) {
        accuracyByTheme[puzzle.theme].solved++;
      }
    }
  });
  
  // Calculate accuracy percentages for each theme
  Object.keys(accuracyByTheme).forEach(theme => {
    const data = accuracyByTheme[theme];
    data.accuracy = data.attempted > 0 ? Math.round((data.solved / data.attempted) * 100) : 0;
  });
  
  // Calculate longest streak
  let longestStreak = 0;
  let currentStreakCount = 0;
  attempts.forEach(attempt => {
    if (attempt.solved) {
      currentStreakCount++;
      longestStreak = Math.max(longestStreak, currentStreakCount);
    } else {
      currentStreakCount = 0;
    }
  });
  
  // Calculate average time (only for solved puzzles)
  const solvedTimes = solvedAttempts.map(a => a.timeSpent).filter(t => t > 0);
  const averageTime = solvedTimes.length > 0 ? 
    Math.round(solvedTimes.reduce((sum, time) => sum + time, 0) / solvedTimes.length) : 0;
  
  // Estimate rating based on performance
  let estimatedRating = 1200; // Starting rating
  const difficultyMultipliers = { Easy: 1, Medium: 1.5, Hard: 2 };
  
  uniquePuzzlesSolved.forEach(puzzleId => {
    const puzzle = samplePuzzles.find(p => p.id === puzzleId);
    if (puzzle) {
      const basePoints = 25 * difficultyMultipliers[puzzle.difficulty];
      const puzzleAttempts = attempts.filter(a => a.puzzleId === puzzleId);
      const firstTrySolved = puzzleAttempts.length > 0 && puzzleAttempts[0].solved;
      
      if (firstTrySolved) {
        estimatedRating += basePoints;
      } else {
        estimatedRating += Math.round(basePoints * 0.7); // Reduced points for multiple attempts
      }
    }
  });
  
  return {
    solved: uniquePuzzlesSolved.length,
    attempted: uniquePuzzlesAttempted.length,
    totalAttempts: attempts.length,
    accuracy,
    accuracyFirstTry,
    accuracyByDifficulty,
    accuracyByTheme,
    currentStreak: userProgressData.currentStreak,
    longestStreak,
    averageTime,
    totalTime: userProgressData.totalTimeSpent,
    hintsUsed: userProgressData.hintsUsed,
    solutionsRevealed: userProgressData.solutionsRevealed,
    estimatedRating: Math.round(estimatedRating)
  };
};

// Get random puzzles for variety
export const getRandomPuzzles = async (count = 10, filters = {}) => {
  const result = await fetchPuzzles(filters, 1, Math.min(count * 3, 100)); // Get more than needed to randomize
  const shuffled = [...result.puzzles].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Function to get puzzle database statistics
export const getPuzzleStats = async () => {
  const stats = {
    total: samplePuzzles.length,
    source: 'Lichess Database',
    byDifficulty: {
      Easy: 0,
      Medium: 0,
      Hard: 0
    },
    byTheme: {},
    ratingRange: {
      min: Math.min(...samplePuzzles.map(p => p.rating)),
      max: Math.max(...samplePuzzles.map(p => p.rating))
    }
  };
  
  samplePuzzles.forEach(puzzle => {
    stats.byDifficulty[puzzle.difficulty]++;
    stats.byTheme[puzzle.theme] = (stats.byTheme[puzzle.theme] || 0) + 1;
  });
  
  return stats;
};
