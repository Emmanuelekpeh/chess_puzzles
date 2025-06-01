import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PuzzleSolver from '../components/PuzzleSolver';
import { fetchPuzzleById, markPuzzleSolved } from '../services/puzzleService';
import './PuzzleSolverPage.css';

const PuzzleSolverPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [puzzle, setPuzzle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const loadPuzzle = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedPuzzle = await fetchPuzzleById(id);
      if (fetchedPuzzle) {
        setPuzzle(fetchedPuzzle);
      } else {
        setError('Puzzle not found');
      }
    } catch (err) {
      setError('Error loading puzzle');
      console.error('Error fetching puzzle:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPuzzle();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePuzzleSolved = async (puzzleId) => {
    try {
      const updatedPuzzle = await markPuzzleSolved(puzzleId);
      setPuzzle(updatedPuzzle);
    } catch (error) {
      console.error('Error marking puzzle as solved:', error);
    }
  };
  const handleNextPuzzle = () => {
    // Find a random puzzle from the collection
    navigate(`/puzzles`);
  };

  const handleBackToPuzzles = () => {
    navigate('/puzzles');
  };

  if (loading) {
    return (
      <div className="puzzle-solver-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading puzzle...</p>
        </div>
      </div>
    );
  }

  if (error || !puzzle) {
    return (
      <div className="puzzle-solver-page">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error || 'Puzzle not found'}</p>
          <button onClick={handleBackToPuzzles} className="btn btn-primary">
            Back to Puzzles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="puzzle-solver-page">
      <div className="page-header">
        <button onClick={handleBackToPuzzles} className="back-btn">
          ← Back to Puzzles
        </button>
        <h1>Puzzle #{puzzle.id}</h1>
      </div>
      
      <PuzzleSolver 
        puzzle={puzzle}
        onSolved={handlePuzzleSolved}
        onNext={handleNextPuzzle}
      />
    </div>
  );
};

export default PuzzleSolverPage;
