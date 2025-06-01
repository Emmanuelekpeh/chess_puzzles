import React, { useState, useEffect, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { saveUserProgress } from '../services/puzzleService';
import './PuzzleSolver.css';

const PuzzleSolver = ({ puzzle, onSolved, onNext }) => {
  const [game, setGame] = useState(new Chess());
  const [gamePosition, setGamePosition] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [moveHistory, setMoveHistory] = useState([]);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [solutionMoveIndex, setSolutionMoveIndex] = useState(0);
  const animationTimerRef = useRef(null);
  const startTimeRef = useRef(null);
  const intervalRef = useRef(null);  useEffect(() => {
    if (puzzle) {
      const newGame = new Chess();
      newGame.load(puzzle.fen);
      setGame(newGame);
      setGamePosition(puzzle.fen);
      setFeedback(null);
      setShowHint(false);
      setShowSolution(false);
      setMoveHistory([]);
      setTimeSpent(0);
      setIsActive(true); // Start timer when new puzzle loads
      setIsAnimating(false);
      setSolutionMoveIndex(0);
      // Clear any existing animation timer
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
    }
  }, [puzzle]);

  useEffect(() => {
    if (isActive) {
      startTimeRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        setTimeSpent(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isActive]);

  const makeMove = (move) => {
    const gameCopy = new Chess();
    gameCopy.load(gamePosition);
    
    try {
      const result = gameCopy.move(move);
      if (result) {
        setGame(gameCopy);
        setGamePosition(gameCopy.fen());
        setMoveHistory([...moveHistory, result.san]);
          // Check if this is the correct solution move
        if (puzzle.solution && puzzle.solution.includes(result.san)) {
          setFeedback({ type: 'success', message: 'Correct! Well done!' });
          setIsActive(false); // Stop timer when puzzle is solved
          
          // Save progress with timing data
          saveUserProgress(puzzle.id, {
            solved: true,
            timeSpent: timeSpent,
            movesUsed: moveHistory.length + 1,
            hintsUsed: showHint ? 1 : 0,
            solutionRevealed: showSolution
          });
          
          if (onSolved) onSolved(puzzle.id);
        } else {
          setFeedback({ type: 'error', message: 'Not quite right. Try again!' });
        }
        
        return true;
      }
    } catch (error) {
      setFeedback({ type: 'error', message: 'Invalid move. Try again!' });
      return false;
    }
    return false;
  };

  const onDrop = (sourceSquare, targetSquare, piece) => {
    const move = makeMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q' // Always promote to queen for simplicity
    });
    return move;
  };  const resetPuzzle = () => {
    if (puzzle) {
      const newGame = new Chess();
      newGame.load(puzzle.fen);
      setGame(newGame);
      setGamePosition(puzzle.fen);
      setFeedback(null);
      setShowHint(false);
      setShowSolution(false);
      setMoveHistory([]);
      setTimeSpent(0);
      setIsActive(true); // Restart timer on reset
      setIsAnimating(false);
      setSolutionMoveIndex(0);
      
      // Clear animation timer if it exists
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
        animationTimerRef.current = null;
      }
    }
  };

  const playSolution = () => {
    if (!puzzle || !puzzle.solution || puzzle.solution.length === 0) {
      setFeedback({ type: 'error', message: 'No solution available for this puzzle.' });
      return;
    }

    // Stop the timer
    setIsActive(false);

    // Set UI state
    setShowSolution(true);
    setIsAnimating(true);
    setFeedback({ type: 'info', message: 'Playing solution...' });

    // Start the animation from the initial FEN
    animateSolutionFromStart(0);
  };

  // Helper to convert UCI string to { from, to, promotion? } object
  const uciToMoveObj = (uci) => {
    if (uci.length < 4) return null;
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promotion = uci.length > 4 ? uci[4] : undefined;
    return promotion ? { from, to, promotion } : { from, to };
  };

  // Animate solution playback from the initial FEN
  const animateSolutionFromStart = (moveIndex) => {
    if (!puzzle || !puzzle.solution || moveIndex >= puzzle.solution.length) {
      setIsAnimating(false);
      setFeedback({
        type: 'success',
        message: `Solution complete: ${puzzle.solution.join(', ')}`
      });
      return;
    }

    // Always start from the initial FEN and replay all moves up to moveIndex
    const gameCopy = new Chess();
    gameCopy.load(puzzle.fen);
    let sanHistory = [];
    let lastFen = puzzle.fen;
    for (let i = 0; i < moveIndex; i++) {
      const moveObj = uciToMoveObj(puzzle.solution[i]);
      if (!moveObj) {
        setFeedback({ type: 'error', message: `Invalid move format at step ${i + 1}: ${puzzle.solution[i]}` });
        setIsAnimating(false);
        return;
      }
      const result = gameCopy.move(moveObj);
      if (!result) {
        setFeedback({ type: 'error', message: `Error playing move ${puzzle.solution[i]} at step ${i + 1}` });
        setIsAnimating(false);
        return;
      }
      sanHistory.push(result.san);
      lastFen = gameCopy.fen();
    }

    // Now play the current move
    const moveObj = uciToMoveObj(puzzle.solution[moveIndex]);
    if (!moveObj) {
      setFeedback({ type: 'error', message: `Invalid move format at step ${moveIndex + 1}: ${puzzle.solution[moveIndex]}` });
      setIsAnimating(false);
      return;
    }
    const result = gameCopy.move(moveObj);
    if (!result) {
      setFeedback({ type: 'error', message: `Error playing move ${puzzle.solution[moveIndex]} at step ${moveIndex + 1}` });
      setIsAnimating(false);
      return;
    }
    sanHistory.push(result.san);
    lastFen = gameCopy.fen();

    // Update the board and move history
    setGame(gameCopy);
    setGamePosition(lastFen);
    setMoveHistory(sanHistory);
    setSolutionMoveIndex(moveIndex + 1);

    // Schedule the next move
    animationTimerRef.current = setTimeout(() => {
      animateSolutionFromStart(moveIndex + 1);
    }, 1000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const showHintHandler = () => {
    setShowHint(true);
    if (puzzle.hint) {
      setFeedback({ type: 'info', message: `Hint: ${puzzle.hint}` });
    }
  };

  const showSolutionHandler = () => {
    setShowSolution(true);
    if (puzzle.solution) {
      setFeedback({ 
        type: 'info', 
        message: `Solution: ${puzzle.solution.join(', ')}` 
      });
    }
  };

  if (!puzzle) {
    return <div className="puzzle-solver">No puzzle selected</div>;
  }

  return (
    <div className="puzzle-solver">      <div className="puzzle-info">
        <h3>Puzzle #{puzzle.id}</h3>
        <div className="puzzle-meta">
          <span className={`difficulty ${puzzle.difficulty.toLowerCase()}`}>
            {puzzle.difficulty}
          </span>
          <span className="theme">{puzzle.theme}</span>
          {puzzle.rating && <span className="rating">Rating: {puzzle.rating}</span>}
          <span className="timer">Time: {formatTime(timeSpent)}</span>
        </div>
        <p className="puzzle-description">
          {puzzle.description || `Find the best move for ${game.turn() === 'w' ? 'White' : 'Black'}`}
        </p>
      </div>      <div className="puzzle-board">
        <Chessboard
          position={gamePosition}
          onPieceDrop={onDrop}
          boardWidth={400}
          arePiecesDraggable={!isAnimating}
          boardOrientation={puzzle.orientation || 'white'}
        />
      </div>

      <div className="puzzle-controls">
        <div className="move-history">
          <strong>Moves: </strong>
          {moveHistory.join(', ') || 'None yet'}
        </div>
        
        {feedback && (
          <div className={`feedback ${feedback.type}`}>
            {feedback.message}
          </div>
        )}        <div className="action-buttons">
          <button onClick={resetPuzzle} className="btn btn-secondary" disabled={isAnimating}>
            Reset
          </button>
          <button onClick={showHintHandler} className="btn btn-info" disabled={showHint || isAnimating}>
            {showHint ? 'Hint Shown' : 'Show Hint'}
          </button>
          <button onClick={showSolutionHandler} className="btn btn-warning" disabled={showSolution || isAnimating}>
            {showSolution ? 'Solution Shown' : 'Show Solution'}
          </button>
          <button onClick={playSolution} className="btn btn-primary" disabled={isAnimating}>
            {isAnimating ? 'Playing...' : 'Play Solution'}
          </button>
          {onNext && (
            <button onClick={onNext} className="btn btn-primary" disabled={isAnimating}>
              Next Puzzle
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PuzzleSolver;
