import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-links">
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
          <a href="/contact">Contact</a>
        </div>        <div className="social-icons">
          <a href="mailto:contact@example.com" aria-label="Email">📧</a>
          <a href="https://github.com" aria-label="GitHub" target="_blank" rel="noopener noreferrer">💻</a>
          <a href="https://discord.gg" aria-label="Discord" target="_blank" rel="noopener noreferrer">💬</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
