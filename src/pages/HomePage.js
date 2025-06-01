import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="homepage">
      <div className="hero-section">
        <div className="hero-content">
          <h1>Master Chess Puzzles</h1>
          <p>
            Sharpen your tactical skills with thousands of chess puzzles sourced from real games. 
            Solve puzzles, create your own, and track your progress as you improve.
          </p>
          <div className="cta-buttons">
            <Link to="/puzzles" className="btn btn-primary">
              Start Solving Puzzles
            </Link>
            <Link to="/create" className="btn btn-secondary">
              Create Your Puzzle
            </Link>
          </div>
        </div>
      </div>
      
      <div className="features-section">
        <div className="container">
          <h2>Why Choose Our Platform?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">♟️</div>
              <h3>Real Game Puzzles</h3>
              <p>Puzzles extracted from actual games played by masters and enthusiasts</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Difficulty Levels</h3>
              <p>From beginner to grandmaster level, find puzzles that match your skill</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Track Progress</h3>
              <p>Monitor your improvement with detailed statistics and performance tracking</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">✨</div>
              <h3>Create Puzzles</h3>
              <p>Import your games and create custom puzzles to share with the community</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
