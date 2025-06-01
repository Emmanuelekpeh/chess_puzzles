import React, { useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import './PuzzleCreator.css';

const PuzzleCreator = () => {
  const [game, setGame] = useState(new Chess());
  const [position, setPosition] = useState(game.fen());
  const [pgnInput, setPgnInput] = useState('');
  const [fenInput, setFenInput] = useState('');
  const [puzzleData, setPuzzleData] = useState({
    title: '',
    description: '',
    difficulty: 'Beginner',
    theme: 'Fork',
    solution: ''
  });
  const [error, setError] = useState('');
  const [moves, setMoves] = useState([]);

  const themes = ['Fork', 'Pin', 'Skewer', 'Discovery', 'Deflection', 'Decoy', 'Clearance', 'Sacrifice'];
  const difficulties = ['Beginner', 'Intermediate', 'Advanced'];

  const handlePgnImport = () => {
    try {
      const newGame = new Chess();
      newGame.loadPgn(pgnInput);
      setGame(newGame);
      setPosition(newGame.fen());
      setMoves(newGame.history({ verbose: true }));
      setError('');
    } catch (err) {
      setError('Invalid PGN format. Please check your input.');
    }
  };

  const handleFenLoad = () => {
    try {
      const newGame = new Chess(fenInput);
      setGame(newGame);
      setPosition(newGame.fen());
      setMoves([]);
      setError('');
    } catch (err) {
      setError('Invalid FEN string. Please check your input.');
    }
  };

  const resetToStartPosition = () => {
    const newGame = new Chess();
    setGame(newGame);
    setPosition(newGame.fen());
    setMoves([]);
    setFenInput('');
    setPgnInput('');
    setError('');
  };
  const handlePieceClick = (piece, square) => {
    // Allow piece placement/removal in edit mode
    try {
      // Simple piece placement logic - this could be enhanced
      // For now, just track clicks for future implementation
      console.log(`Clicked ${piece} on ${square}`);
    } catch (err) {
      console.error('Error handling piece click:', err);
    }
  };

  const generatePuzzleFromPosition = () => {
    if (!puzzleData.title || !puzzleData.description) {
      setError('Please fill in puzzle title and description.');
      return;
    }

    const puzzle = {
      id: Date.now(),
      title: puzzleData.title,
      description: puzzleData.description,
      fen: position,
      difficulty: puzzleData.difficulty,
      theme: puzzleData.theme,
      solution: puzzleData.solution,
      moves: moves,
      created: new Date().toISOString()
    };

    console.log('Generated puzzle:', puzzle);
    alert('Puzzle created! (This would be saved to the database)');
    
    // Reset form
    setPuzzleData({
      title: '',
      description: '',
      difficulty: 'Beginner',
      theme: 'Fork',
      solution: ''
    });
  };

  return (
    <div className="puzzle-creator">
      <div className="container">
        <h1>Create a Chess Puzzle</h1>
        <p>Import games, set positions, and create custom puzzles</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="creator-content">
          <div className="left-panel">
            <div className="board-container">
              <Chessboard 
                position={position}
                onPieceClick={handlePieceClick}
                boardWidth={400}
                arePiecesDraggable={false}
              />
              <button className="reset-btn" onClick={resetToStartPosition}>
                Reset Board
              </button>
            </div>
          </div>

          <div className="right-panel">
            <div className="import-section">
              <h3>Import Game (PGN)</h3>
              <textarea 
                value={pgnInput}
                onChange={(e) => setPgnInput(e.target.value)}
                placeholder="Paste your PGN here..."
                rows="4"
                className="pgn-input"
              />
              <button className="import-btn" onClick={handlePgnImport}>
                Import PGN
              </button>
            </div>
            
            <div className="fen-section">
              <h3>Set Position (FEN)</h3>
              <input 
                type="text" 
                value={fenInput}
                onChange={(e) => setFenInput(e.target.value)}
                placeholder="Enter FEN string..."
                className="fen-input"
              />
              <button className="import-btn" onClick={handleFenLoad}>
                Load Position
              </button>
            </div>

            <div className="current-fen">
              <h4>Current Position:</h4>
              <code className="fen-display">{position}</code>
            </div>

            {moves.length > 0 && (
              <div className="moves-section">
                <h4>Game Moves:</h4>
                <div className="moves-list">
                  {moves.map((move, index) => (
                    <span key={index} className="move">
                      {Math.floor(index / 2) + 1}{index % 2 === 0 ? '.' : '...'} {move.san}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="puzzle-form">
          <h3>Puzzle Details</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Puzzle Title:</label>
              <input
                type="text"
                value={puzzleData.title}
                onChange={(e) => setPuzzleData({...puzzleData, title: e.target.value})}
                placeholder="Enter puzzle title..."
              />
            </div>

            <div className="form-group">
              <label>Description:</label>
              <textarea
                value={puzzleData.description}
                onChange={(e) => setPuzzleData({...puzzleData, description: e.target.value})}
                placeholder="Describe the puzzle objective..."
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Difficulty:</label>
              <select
                value={puzzleData.difficulty}
                onChange={(e) => setPuzzleData({...puzzleData, difficulty: e.target.value})}
              >
                {difficulties.map(diff => (
                  <option key={diff} value={diff}>{diff}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Theme:</label>
              <select
                value={puzzleData.theme}
                onChange={(e) => setPuzzleData({...puzzleData, theme: e.target.value})}
              >
                {themes.map(theme => (
                  <option key={theme} value={theme}>{theme}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Solution (moves):</label>
              <input
                type="text"
                value={puzzleData.solution}
                onChange={(e) => setPuzzleData({...puzzleData, solution: e.target.value})}
                placeholder="e.g., Nf7+ Kg8 Nxd6"
              />
            </div>
          </div>

          <button className="create-btn" onClick={generatePuzzleFromPosition}>
            Create Puzzle
          </button>
        </div>
      </div>
    </div>
  );
};

export default PuzzleCreator;
