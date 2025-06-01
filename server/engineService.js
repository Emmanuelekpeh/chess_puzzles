const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

function getKomodoPath() {
  const base = path.join(__dirname, 'engines', 'komodo');
  if (os.platform() === 'win32') {
    return path.join(base, 'Windows', 'komodo-14.1-64bit.exe');
  } else if (os.platform() === 'darwin') {
    return path.join(base, 'OSX', 'komodo-14.1-64bit');
  } else {
    return path.join(base, 'Linux', 'komodo-14.1-64bit');
  }
}

function getKomodoProcess(elo = 1500) {
  const komodoPath = getKomodoPath();
  const komodo = spawn(komodoPath);
  komodo.stdin.setEncoding('utf-8');
  komodo.stdout.setEncoding('utf-8');
  komodo.stderr.on('data', data => console.error('[Komodo]', data.toString()));

  // Start UCI and set ELO
  komodo.stdin.write('uci\n');
  komodo.stdin.write(`setoption name UCI_Elo value ${elo}\n`);
  komodo.stdin.write('isready\n');

  return komodo;
}

module.exports = { getKomodoProcess }; 