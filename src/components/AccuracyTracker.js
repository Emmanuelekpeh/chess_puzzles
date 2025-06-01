import React, { useState, useEffect } from 'react';
import { getUserStats } from '../services/puzzleService';
import './AccuracyTracker.css';

const AccuracyTracker = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const userStats = await getUserStats();
        setStats(userStats);
      } catch (error) {
        console.error('Error loading accuracy stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return <div className="accuracy-tracker loading">Loading accuracy data...</div>;
  }

  if (!stats) {
    return <div className="accuracy-tracker error">Unable to load accuracy data</div>;
  }

  return (
    <div className="accuracy-tracker">
      <div className="accuracy-header">
        <h2>Accuracy Tracking</h2>
        <p>Detailed breakdown of your performance</p>
      </div>

      <div className="accuracy-overview">
        <div className="overview-card">
          <h3>Overall Performance</h3>
          <div className="metric-row">
            <span className="metric-label">Total Accuracy:</span>
            <span className="metric-value main-accuracy">{stats.accuracy}%</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">First Try Accuracy:</span>
            <span className="metric-value">{stats.accuracyFirstTry}%</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Puzzles Solved:</span>
            <span className="metric-value">{stats.solved}/{stats.attempted}</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Total Attempts:</span>
            <span className="metric-value">{stats.totalAttempts}</span>
          </div>
        </div>

        <div className="overview-card">
          <h3>Practice Habits</h3>
          <div className="metric-row">
            <span className="metric-label">Current Streak:</span>
            <span className="metric-value streak">{stats.currentStreak}</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Average Time:</span>
            <span className="metric-value">{stats.averageTime}s</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Hints Used:</span>
            <span className="metric-value">{stats.hintsUsed}</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Solutions Revealed:</span>
            <span className="metric-value">{stats.solutionsRevealed}</span>
          </div>
        </div>
      </div>

      <div className="accuracy-breakdown">
        <div className="breakdown-section">
          <h3>Accuracy by Difficulty</h3>
          <div className="difficulty-stats">
            {Object.entries(stats.accuracyByDifficulty).map(([difficulty, data]) => (
              <div key={difficulty} className="difficulty-card">
                <h4 className={`difficulty-name ${difficulty.toLowerCase()}`}>{difficulty}</h4>
                <div className="accuracy-bar">
                  <div 
                    className="accuracy-fill" 
                    style={{ 
                      width: `${data.accuracy}%`,
                      backgroundColor: difficulty === 'Easy' ? '#27ae60' : 
                                     difficulty === 'Medium' ? '#f39c12' : '#e74c3c'
                    }}
                  ></div>
                </div>
                <div className="difficulty-details">
                  <span className="accuracy-percent">{data.accuracy}%</span>
                  <span className="attempt-count">{data.solved}/{data.totalAttempts} attempts</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="breakdown-section">
          <h3>Accuracy by Theme</h3>
          <div className="theme-stats">
            {Object.entries(stats.accuracyByTheme)
              .sort(([,a], [,b]) => b.attempted - a.attempted)
              .slice(0, 8)
              .map(([theme, data]) => (
              <div key={theme} className="theme-card">
                <div className="theme-header">
                  <h4 className="theme-name">{theme}</h4>
                  <span className="theme-accuracy">{data.accuracy}%</span>
                </div>
                <div className="theme-progress">
                  <div 
                    className="progress-bar"
                    style={{ width: `${Math.min(data.accuracy, 100)}%` }}
                  ></div>
                </div>
                <div className="theme-details">
                  <span>{data.solved} solved</span>
                  <span>{data.totalAttempts} attempts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="improvement-suggestions">
        <h3>Improvement Suggestions</h3>
        <div className="suggestions-grid">
          {stats.accuracy < 70 && (
            <div className="suggestion-card warning">
              <h4>🎯 Focus on Accuracy</h4>
              <p>Your accuracy is below 70%. Try to think more carefully before making moves.</p>
            </div>
          )}
          
          {stats.hintsUsed > stats.solved * 0.5 && (
            <div className="suggestion-card info">
              <h4>💡 Reduce Hint Usage</h4>
              <p>You're using hints frequently. Try solving puzzles without hints to improve pattern recognition.</p>
            </div>
          )}
          
          {stats.currentStreak === 0 && stats.attempted > 0 && (
            <div className="suggestion-card motivational">
              <h4>🔥 Build a Streak</h4>
              <p>Start solving puzzles consistently to build a streak and improve your skills.</p>
            </div>
          )}
          
          {stats.averageTime > 180 && (
            <div className="suggestion-card tip">
              <h4>⏱️ Improve Speed</h4>
              <p>Your average solving time is high. Practice pattern recognition to solve faster.</p>
            </div>
          )}

          {Object.values(stats.accuracyByDifficulty).some(d => d.accuracy < 50) && (
            <div className="suggestion-card practice">
              <h4>📚 Practice Fundamentals</h4>
              <p>Focus on easier puzzles to build a strong foundation before tackling harder ones.</p>
            </div>
          )}
          
          {stats.accuracy >= 80 && stats.currentStreak >= 5 && (
            <div className="suggestion-card success">
              <h4>⭐ Excellent Performance!</h4>
              <p>You're doing great! Consider trying harder puzzles to continue challenging yourself.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccuracyTracker;
