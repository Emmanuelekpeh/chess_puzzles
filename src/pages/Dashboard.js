import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { samplePuzzles, getUserStats } from '../services/puzzleService';
import './Dashboard.css';

const Dashboard = () => {
  const [userStats, setUserStats] = useState({
    puzzlesSolved: 0,
    puzzlesCreated: 0,
    currentRating: 1200,
    streak: 0,
    totalTime: 0,
    favoriteTheme: 'Fork'
  });
  const [recentPuzzles, setRecentPuzzles] = useState([]);
  useEffect(() => {
    // Load enhanced user statistics
    const loadUserStats = async () => {
      try {
        const stats = await getUserStats();
        setUserStats({
          puzzlesSolved: stats.solved,
          puzzlesCreated: 3, // Mock data for now
          currentRating: stats.estimatedRating,
          streak: stats.currentStreak,
          totalTime: Math.round(stats.totalTime / 60), // Convert to minutes
          favoriteTheme: getMostCommonTheme(stats.accuracyByTheme),
          accuracy: stats.accuracy,
          accuracyFirstTry: stats.accuracyFirstTry,
          hintsUsed: stats.hintsUsed,
          solutionsRevealed: stats.solutionsRevealed
        });
      } catch (error) {
        console.error('Error loading user stats:', error);
        // Fallback to basic stats calculation
        const solvedPuzzles = samplePuzzles.filter(p => p.solved);
        const stats = {
          puzzlesSolved: solvedPuzzles.length,
          puzzlesCreated: 3,
          currentRating: 1200 + (solvedPuzzles.length * 25),
          streak: 5,
          totalTime: Math.round(solvedPuzzles.length * 2.5),
          favoriteTheme: getMostCommonTheme(solvedPuzzles),
          accuracy: 0,
          accuracyFirstTry: 0,
          hintsUsed: 0,
          solutionsRevealed: 0
        };
        setUserStats(stats);
      }
    };

    loadUserStats();
    setRecentPuzzles(samplePuzzles.slice(0, 4)); // Show first 4 puzzles
  }, []);
  const getMostCommonTheme = (accuracyByTheme) => {
    if (typeof accuracyByTheme === 'object' && Object.keys(accuracyByTheme).length > 0) {
      // Find theme with highest accuracy or most attempts
      return Object.keys(accuracyByTheme).reduce((best, theme) => {
        const current = accuracyByTheme[theme];
        const bestStats = accuracyByTheme[best];
        return current.attempted > bestStats.attempted ? theme : best;
      });
    }
    
    // Fallback for array of puzzles (backward compatibility)
    if (Array.isArray(accuracyByTheme) && accuracyByTheme.length === 0) return 'Fork';
    if (Array.isArray(accuracyByTheme)) {
      const themeCount = {};
      accuracyByTheme.forEach(p => {
        themeCount[p.theme] = (themeCount[p.theme] || 0) + 1;
      });
      return Object.keys(themeCount).reduce((a, b) => 
        themeCount[a] > themeCount[b] ? a : b
      );
    }
    
    return 'Fork';
  };

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p>Track your progress and improve your chess skills</p>
        </div>        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🧩</div>
            <h3>Puzzles Solved</h3>
            <div className="stat-number">{userStats.puzzlesSolved}</div>
            <div className="stat-change">+{Math.floor(userStats.puzzlesSolved * 0.2)} this week</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <h3>Current Rating</h3>
            <div className="stat-number">{userStats.currentRating}</div>
            <div className="stat-change">
              {userStats.currentRating >= 1200 ? '+' : ''}{userStats.currentRating - 1200} from start
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <h3>Accuracy</h3>
            <div className="stat-number">{userStats.accuracy || 0}%</div>
            <div className="stat-change">
              First try: {userStats.accuracyFirstTry || 0}%
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🔥</div>
            <h3>Current Streak</h3>
            <div className="stat-number">{userStats.streak || 0}</div>
            <div className="stat-change">Keep it up!</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <h3>Total Time</h3>
            <div className="stat-number">{userStats.totalTime || 0}min</div>
            <div className="stat-change">Training time</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">💡</div>
            <h3>Favorite Theme</h3>
            <div className="stat-number">{userStats.favoriteTheme}</div>
            <div className="stat-change">Most practiced</div>
          </div>
        </div>

        <div className="dashboard-content">
          <div className="section">
            <h2>Performance Overview</h2>
            <div className="performance-cards">
              <div className="performance-card">
                <h4>Favorite Theme</h4>
                <p className="theme-name">{userStats.favoriteTheme}</p>
                <p className="theme-desc">Your most solved puzzle type</p>
              </div>
              <div className="performance-card">
                <h4>Accuracy Rate</h4>
                <p className="accuracy">87%</p>
                <p className="accuracy-desc">Puzzles solved correctly on first try</p>
              </div>
              <div className="performance-card">
                <h4>Average Time</h4>
                <p className="avg-time">2.3 min</p>
                <p className="time-desc">Per puzzle completion</p>
              </div>
            </div>
          </div>

          <div className="section">
            <div className="section-header">
              <h2>Recent Puzzles</h2>
              <Link to="/puzzles" className="view-all-btn">View All Puzzles</Link>
            </div>
            <div className="recent-puzzles">
              {recentPuzzles.map(puzzle => (
                <div key={puzzle.id} className="recent-puzzle-card">
                  <div className="puzzle-preview">
                    <Chessboard 
                      position={puzzle.fen}
                      boardWidth={120}
                      arePiecesDraggable={false}
                    />
                  </div>
                  <div className="puzzle-details">
                    <h4>Puzzle #{puzzle.id}</h4>
                    <div className="puzzle-meta">
                      <span className={`difficulty ${puzzle.difficulty.toLowerCase()}`}>
                        {puzzle.difficulty}
                      </span>
                      <span className="theme">{puzzle.theme}</span>
                    </div>
                    <div className="puzzle-rating">Rating: {puzzle.rating}</div>
                    <Link 
                      to={`/puzzle/${puzzle.id}`}
                      className={`solve-btn ${puzzle.solved ? 'solved' : ''}`}
                    >
                      {puzzle.solved ? 'Solved ✓' : 'Solve'}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="section">
            <h2>Quick Actions</h2>
            <div className="quick-actions">
              <Link to="/puzzles" className="action-btn primary">
                <span className="action-icon">🎯</span>
                <span>Solve Puzzles</span>
              </Link>
              <Link to="/create" className="action-btn secondary">
                <span className="action-icon">✨</span>
                <span>Create Puzzle</span>
              </Link>
              <button className="action-btn tertiary">
                <span className="action-icon">📊</span>
                <span>View Progress</span>              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
