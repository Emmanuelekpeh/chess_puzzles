const express = require('express');
const { getKomodoProcess } = require('./engineService');
const router = express.Router();

router.post('/komodo/move', (req, res) => {
  const { fen, elo } = req.body;
  if (!fen) return res.status(400).json({ error: 'FEN required' });
  const komodo = getKomodoProcess(elo || 1500);

  let output = '';
  let responded = false;

  komodo.stdout.on('data', data => {
    output += data;
    if (output.includes('bestmove') && !responded) {
      const match = output.match(/bestmove\s(\S+)/);
      if (match) {
        responded = true;
        res.json({ move: match[1] });
        komodo.kill();
      }
    }
  });

  komodo.stdin.write(`position fen ${fen}\n`);
  komodo.stdin.write('go movetime 2000\n'); // 2 seconds per move
});

module.exports = router; 