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
  const [userMoveIndex, setUserMoveIndex] = useState(0);
  const animationTimerRef = useRef(null);
  const startTimeRef = useRef(null);
  const intervalRef = useRef(null);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [animationDuration, setAnimationDuration] = useState(300); // ms
  const [pendingOpponentMove, setPendingOpponentMove] = useState(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [isCheckmate, setIsCheckmate] = useState(false);
  const [vsKomodo, setVsKomodo] = useState(false);
  const [komodoColor, setKomodoColor] = useState(null); // 'w' or 'b'
  const [komodoThinking, setKomodoThinking] = useState(false);

  useEffect(() => {
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
      setUserMoveIndex(0); // Reset user move index
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
    if (waitingForOpponent) return false;
    const gameCopy = new Chess();
    gameCopy.load(gamePosition);
    try {
      const result = gameCopy.move(move);
      if (result) {
        const expectedMoveUci = puzzle.solution[userMoveIndex];
        const userMoveUci = result.from + result.to + (result.promotion ? result.promotion : '');
        if (userMoveUci === expectedMoveUci) {
          let nextMoveIndex = userMoveIndex + 1;
          let sanHistory = [...moveHistory, result.san];
          let lastFen = gameCopy.fen();

          setGame(gameCopy);
          setGamePosition(lastFen);
          setMoveHistory(sanHistory);
          setUserMoveIndex(nextMoveIndex);
          setAnimationDuration(300); // normal for user

          // If there is an opponent move, schedule it after a pause
          if (nextMoveIndex < puzzle.solution.length) {
            setWaitingForOpponent(true);
            setFeedback({ type: 'info', message: 'Waiting for opponent...' });
            setTimeout(() => {
              setPendingOpponentMove({
                fen: lastFen,
                moveIndex: nextMoveIndex,
                sanHistory: sanHistory.slice(),
              });
            }, 500); // short pause after user move
            return true;
          }

          // If this was the last move
          if (nextMoveIndex === puzzle.solution.length) {
            setFeedback({ type: 'success', message: 'Correct! Well done!' });
            setIsActive(false);
            saveUserProgress(puzzle.id, {
              solved: true,
              timeSpent: timeSpent,
              movesUsed: sanHistory.length,
              hintsUsed: showHint ? 1 : 0,
              solutionRevealed: showSolution
            });
            if (onSolved) onSolved(puzzle.id);
            setShowCompletion(true);
          } else {
            setFeedback({ type: 'success', message: 'Correct! Next move...' });
          }
        } else {
          setFeedback({ type: 'error', message: 'That is not the expected move. Try again!' });
        }
        return true;
      }
    } catch (error) {
      setFeedback({ type: 'error', message: 'Invalid move. Try again!' });
      return false;
    }
    return false;
  };

  useEffect(() => {
    if (pendingOpponentMove) {
      const { fen, moveIndex, sanHistory } = pendingOpponentMove;
      const gameCopy = new Chess();
      gameCopy.load(fen);
      const opponentMoveUci = puzzle.solution[moveIndex];
      const opponentMoveObj = uciToMoveObj(opponentMoveUci);
      setAnimationDuration(600); // slightly slower for opponent
      setTimeout(() => {
        const opponentResult = gameCopy.move(opponentMoveObj);
        let newSanHistory = sanHistory;
        let lastFen = fen;
        let nextMoveIndex = moveIndex;
        if (opponentResult) {
          newSanHistory = [...sanHistory, opponentResult.san];
          lastFen = gameCopy.fen();
          nextMoveIndex++;
        }
        setGame(gameCopy);
        setGamePosition(lastFen);
        setMoveHistory(newSanHistory);
        setUserMoveIndex(nextMoveIndex);
        setWaitingForOpponent(false);
        setAnimationDuration(300); // reset for user
        setPendingOpponentMove(null);
        // Check if this was the last move
        if (nextMoveIndex === puzzle.solution.length) {
          setFeedback({ type: 'success', message: 'Correct! Well done!' });
          setIsActive(false);
          saveUserProgress(puzzle.id, {
            solved: true,
            timeSpent: timeSpent,
            movesUsed: newSanHistory.length,
            hintsUsed: showHint ? 1 : 0,
            solutionRevealed: showSolution
          });
          if (onSolved) onSolved(puzzle.id);
          setShowCompletion(true);
        } else {
          setFeedback({ type: 'success', message: 'Correct! Next move...' });
        }
      }, 600); // match animation duration
    }
  }, [pendingOpponentMove]);

  const onDrop = (sourceSquare, targetSquare, piece) => {
    const move = makeMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q' // Always promote to queen for simplicity
    });
    return move;
  };

  const resetPuzzle = () => {
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
      setUserMoveIndex(0); // Reset user move index
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
    if (!uci || uci.length < 4) return null;
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

  const handleCloseCompletion = () => setShowCompletion(false);

  // After puzzle is completed, check for checkmate
  useEffect(() => {
    if (showCompletion) {
      // Get final FEN after solution
      const chess = new Chess();
      chess.load(puzzle.fen);
      for (const uci of puzzle.solution) {
        const moveObj = uciToMoveObj(uci);
        if (moveObj) chess.move(moveObj);
      }
      setIsCheckmate(chess.isCheckmate());
    }
    // eslint-disable-next-line
  }, [showCompletion]);

  // Handler for Continue vs Komodo
  const handleContinueVsKomodo = () => {
    // Set up board at final position, user plays the side to move
    const chess = new Chess();
    chess.load(puzzle.fen);
    for (const uci of puzzle.solution) {
      const moveObj = uciToMoveObj(uci);
      if (moveObj) chess.move(moveObj);
    }
    setGame(chess);
    setGamePosition(chess.fen());
    setMoveHistory([...moveHistory]);
    setShowCompletion(false);
    setVsKomodo(true);
    setKomodoColor(chess.turn()); // Komodo plays the side to move
    setKomodoThinking(false);
    // If Komodo is to move, trigger Komodo move
    if (chess.turn() === 'w' && puzzle.orientation === 'white' || chess.turn() === 'b' && puzzle.orientation === 'black') {
      handleKomodoMove(chess.fen());
    }
  };

  // Handler for user move in vsKomodo mode
  const handleVsKomodoDrop = (sourceSquare, targetSquare, piece) => {
    if (!vsKomodo || komodoThinking) return false;
    const chess = new Chess(game.fen());
    const move = chess.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
    if (move) {
      setGame(chess);
      setGamePosition(chess.fen());
      setMoveHistory([...moveHistory, move.san]);
      // After user move, Komodo moves if not game over
      if (!chess.game_over()) {
        handleKomodoMove(chess.fen());
      }
      return true;
    }
    return false;
  };

  // Call backend API to get Komodo's move
  const handleKomodoMove = async (fen) => {
    setKomodoThinking(true);
    try {
      const res = await fetch('/api/komodo/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fen, elo: puzzle.rating || 1500 })
      });
      const data = await res.json();
      if (data.move) {
        const chess = new Chess(fen);
        chess.move({ from: data.move.slice(0,2), to: data.move.slice(2,4), promotion: data.move[4] });
        setGame(chess);
        setGamePosition(chess.fen());
        setMoveHistory(m => [...m, chess.history({ verbose: true }).slice(-1)[0].san]);
      }
    } catch (e) {
      setFeedback({ type: 'error', message: 'Komodo error: ' + e.message });
    }
    setKomodoThinking(false);
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
          onPieceDrop={vsKomodo ? handleVsKomodoDrop : onDrop}
          boardWidth={400}
          arePiecesDraggable={!isAnimating && !waitingForOpponent && (!vsKomodo || !komodoThinking)}
          boardOrientation={puzzle.orientation || 'white'}
          animationDuration={animationDuration}
        />
        {vsKomodo && komodoThinking && (
          <div className="feedback info">Komodo is thinking...</div>
        )}
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
        )}        {waitingForOpponent && (
          <div className="feedback info">Waiting for opponent...</div>
        )}        <div className="action-buttons">
          <button onClick={resetPuzzle} className="btn btn-secondary" disabled={isAnimating || waitingForOpponent}>
            Reset
          </button>
          <button onClick={showHintHandler} className="btn btn-info" disabled={showHint || isAnimating || waitingForOpponent}>
            {showHint ? 'Hint Shown' : 'Show Hint'}
          </button>
          <button onClick={showSolutionHandler} className="btn btn-warning" disabled={showSolution || isAnimating || waitingForOpponent}>
            {showSolution ? 'Solution Shown' : 'Show Solution'}
          </button>
          <button onClick={playSolution} className="btn btn-primary" disabled={isAnimating || waitingForOpponent}>
            {isAnimating ? 'Playing...' : 'Play Solution'}
          </button>
          {onNext && (
            <button onClick={onNext} className="btn btn-primary" disabled={isAnimating || waitingForOpponent}>
              Next Puzzle
            </button>
          )}
        </div>
      </div>
      {showCompletion && (
        <div className="puzzle-complete-overlay">
          <div className="puzzle-complete-modal">
            <h2>🎉 Puzzle Complete!</h2>
            <p>Congratulations, you solved the puzzle!</p>
            <div className="puzzle-complete-stats">
              <div><strong>Time:</strong> {formatTime(timeSpent)}</div>
              <div><strong>Moves:</strong> {moveHistory.length}</div>
              {puzzle.difficulty && <div><strong>Difficulty:</strong> {puzzle.difficulty}</div>}
              {puzzle.theme && <div><strong>Theme:</strong> {puzzle.theme}</div>}
            </div>
            <div className="puzzle-complete-actions">
              {!isCheckmate && (
                <button className="btn btn-success" onClick={handleContinueVsKomodo}>
                  Continue vs Komodo
                </button>
              )}
              {onNext && (
                <button className="btn btn-primary" onClick={() => { setShowCompletion(false); onNext(); }}>
                  Next Puzzle
                </button>
              )}
              <button className="btn btn-secondary" onClick={handleCloseCompletion}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PuzzleSolver;
