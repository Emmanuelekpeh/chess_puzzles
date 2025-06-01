import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <Link to="/">ChessPuzzles</Link>
        </div>        <nav className="nav-menu">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/puzzles" className="nav-link">Puzzles</Link>
          <Link to="/create" className="nav-link">Create</Link>
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/accuracy" className="nav-link">Accuracy</Link>
          <Link to="/about" className="nav-link">About</Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
