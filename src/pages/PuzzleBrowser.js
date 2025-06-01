import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { fetchPuzzles, getPuzzleCount, themes, difficulties } from '../services/puzzleService';
import './PuzzleBrowser.css';

const PuzzleBrowser = () => {
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedTheme, setSelectedTheme] = useState('all');
  const [puzzles, setPuzzles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [puzzleStats, setPuzzleStats] = useState({ total: 0, solved: 0 });
  const [pageSize] = useState(24); // Show 24 puzzles per page
  const loadPuzzles = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {
        difficulty: selectedDifficulty,
        theme: selectedTheme
      };
      
      // Load puzzles with pagination
      const result = await fetchPuzzles(filters, currentPage, pageSize);
      setPuzzles(result.puzzles);
      setPagination(result.pagination);
      
      // Load stats for the sidebar
      const stats = await getPuzzleCount(filters);
      setPuzzleStats(stats);
    } catch (error) {
      console.error('Error fetching puzzles:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDifficulty, selectedTheme, currentPage, pageSize]);
  useEffect(() => {
    loadPuzzles();
  }, [loadPuzzles]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDifficulty, selectedTheme]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDifficultyChange = (difficulty) => {
    setSelectedDifficulty(difficulty);
  };

  const handleThemeChange = (theme) => {
    setSelectedTheme(theme);
  };

  return (
    <div className="puzzle-browser">
      <div className="puzzle-browser-container">
        <div className="sidebar">
          <h3>Filters</h3>
            <div className="filter-group">
            <label>Difficulty:</label>
            <select 
              value={selectedDifficulty} 
              onChange={(e) => handleDifficultyChange(e.target.value)}
            >
              <option value="all">All</option>
              {difficulties.map(diff => (
                <option key={diff} value={diff}>{diff}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Theme:</label>
            <select 
              value={selectedTheme} 
              onChange={(e) => handleThemeChange(e.target.value)}
            >
              <option value="all">All</option>
              {themes.map(theme => (
                <option key={theme} value={theme}>{theme}</option>
              ))}
            </select>
          </div>

          <div className="stats">
            <p>Total puzzles: {puzzleStats.total}</p>
            <p>Solved: {puzzleStats.solved}</p>
            {pagination && (
              <p>Page {pagination.currentPage} of {pagination.totalPages}</p>
            )}
          </div>
        </div>        <div className="puzzle-grid">
          <h2>Chess Puzzles</h2>
          
          {loading ? (
            <div className="loading">Loading puzzles...</div>
          ) : (
            <>
              <div className="puzzles-container">
                {puzzles.map(puzzle => (
                  <div key={puzzle.id} className="puzzle-card">
                    <div className="puzzle-board">
                      <Chessboard 
                        position={puzzle.fen}
                        boardWidth={200}
                        arePiecesDraggable={false}
                      />
                    </div>
                    <div className="puzzle-info">
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
                        {puzzle.solved ? 'Solved ✓' : 'Solve Puzzle'}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination Controls */}
              {pagination && pagination.totalPages > 1 && (
                <div className="pagination-controls">
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!pagination.hasPreviousPage}
                    className="page-btn"
                  >
                    ← Previous
                  </button>
                  
                  <div className="page-numbers">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="page-btn"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
          
          {!loading && puzzles.length === 0 && (
            <div className="no-puzzles">
              <p>No puzzles found with the selected filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PuzzleBrowser;
