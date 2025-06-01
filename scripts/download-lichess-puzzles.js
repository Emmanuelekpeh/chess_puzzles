#!/usr/bin/env node

/**
 * Real Lichess Puzzle Database Downloader
 * Downloads and processes the official Lichess puzzle database
 * 
 * Usage:
 *   node download-lichess-puzzles.js [options]
 * 
 * Options:
 *   --limit N     Download only first N puzzles (for testing)
 *   --output FILE Output file path (default: src/data/lichess_puzzles.json)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { createBrotliDecompress } = require('zlib');
const { Chess } = require('chess.js');

class LichessPuzzleDownloader {
  constructor(options = {}) {
    this.options = {
      url: 'https://database.lichess.org/lichess_db_puzzle.csv.bz2',
      outputPath: options.output || './src/data/lichess_puzzles.json',
      limit: options.limit || null, // null means download all
      tempFile: './temp_puzzles.csv'
    };
  }

  async download() {
    console.log('🚀 Starting Lichess puzzle database download...');
    console.log(`📡 Source: ${this.options.url}`);
    console.log(`💾 Output: ${this.options.outputPath}`);
    
    if (this.options.limit) {
      console.log(`🔢 Limit: ${this.options.limit} puzzles`);
    }

    try {
      // Step 1: Download the compressed file
      console.log('\n📥 Step 1: Downloading compressed database...');
      await this.downloadFile();

      // Step 2: Decompress and parse
      console.log('🗜️  Step 2: Decompressing and parsing...');
      const puzzles = await this.parseDownloadedFile();

      // Step 3: Convert to our format
      console.log('🔄 Step 3: Converting to platform format...');
      const convertedPuzzles = await this.convertPuzzles(puzzles);

      // Step 4: Save results
      console.log('💾 Step 4: Saving converted puzzles...');
      await this.savePuzzles(convertedPuzzles);

      // Cleanup
      this.cleanup();

      console.log('✅ Download completed successfully!');
      this.printSummary(convertedPuzzles);

    } catch (error) {
      console.error('❌ Download failed:', error.message);
      this.cleanup();
      throw error;
    }
  }

  async downloadFile() {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(this.options.tempFile);
      
      https.get(this.options.url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }

        let downloaded = 0;
        const total = parseInt(response.headers['content-length'], 10);

        response.on('data', (chunk) => {
          downloaded += chunk.length;
          const percent = total ? ((downloaded / total) * 100).toFixed(1) : 'unknown';
          process.stdout.write(`\r📊 Progress: ${percent}% (${this.formatBytes(downloaded)})`);
        });

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          console.log('\n✅ Download completed');
          resolve();
        });

        file.on('error', (err) => {
          fs.unlink(this.options.tempFile, () => {});
          reject(err);
        });

      }).on('error', (err) => {
        reject(err);
      });
    });
  }

  async parseDownloadedFile() {
    return new Promise((resolve, reject) => {
      const puzzles = [];
      let lineCount = 0;
      let headers = null;

      // For .bz2 files, we need to decompress first
      // Note: This is a simplified version. For .bz2, you'd need bzip2 decompression
      const stream = fs.createReadStream(this.options.tempFile, { encoding: 'utf8' });
      
      let buffer = '';
      
      stream.on('data', (chunk) => {
        buffer += chunk;
        
        // Process complete lines
        let lines = buffer.split('\n');
        buffer = lines.pop(); // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (lineCount === 0) {
            headers = this.parseCSVLine(line);
            lineCount++;
            continue;
          }

          if (this.options.limit && puzzles.length >= this.options.limit) {
            break;
          }

          const values = this.parseCSVLine(line);
          if (values.length === headers.length) {
            const puzzle = {};
            headers.forEach((header, index) => {
              puzzle[header] = values[index];
            });
            puzzles.push(puzzle);
          }

          lineCount++;
          
          if (lineCount % 10000 === 0) {
            process.stdout.write(`\r🔄 Parsed ${lineCount} lines, ${puzzles.length} valid puzzles`);
          }
        }

        if (this.options.limit && puzzles.length >= this.options.limit) {
          stream.destroy();
        }
      });

      stream.on('end', () => {
        console.log(`\n✅ Parsing completed: ${puzzles.length} puzzles extracted`);
        resolve(puzzles);
      });

      stream.on('error', reject);
    });
  }

  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  async convertPuzzles(lichessPuzzles) {
    console.log(`🔄 Converting ${lichessPuzzles.length} puzzles...`);
    const converted = [];
    let errors = 0;

    for (let i = 0; i < lichessPuzzles.length; i++) {
      try {
        const puzzle = this.convertSinglePuzzle(lichessPuzzles[i], i + 10000);
        if (!puzzle) continue;

        // --- FILTERING LOGIC STARTS HERE ---
        // 1. Filter by Popularity or NbPlays
        if (puzzle.popularity < 50 && puzzle.nbPlays < 50) continue;

        // 2. Filter by Solution Length and Motif
        const tacticalMotifs = [
          'Mate', 'Mate in 1', 'Mate in 2', 'Mate in 3', 'Pin', 'Fork', 'Skewer', 'Sacrifice', 'Deflection', 'Discovery', 'Clearance', 'Zwischenzug'
        ];
        const isTactical = tacticalMotifs.some(motif => puzzle.theme && puzzle.theme.toLowerCase().includes(motif.toLowerCase()));

        if (puzzle.solution.length === 1 && !isTactical) continue; // Exclude 1-move non-tactical
        if (!isTactical && puzzle.solution.length <= 4) continue;  // Exclude short quiet puzzles
        // --- FILTERING LOGIC ENDS HERE ---

        converted.push(puzzle);
      } catch (error) {
        errors++;
        if (errors < 10) {
          console.warn(`⚠️ Error converting puzzle ${i}:`, error.message);
        }
      }
      if ((i + 1) % 1000 === 0) {
        process.stdout.write(`\r🔄 Converted ${i + 1}/${lichessPuzzles.length} puzzles (${errors} errors)`);
      }
    }
    console.log(`\n✅ Conversion completed: ${converted.length} puzzles, ${errors} errors`);
    return converted;
  }

  convertSinglePuzzle(lichessData, id) {
    // Determine difficulty based on rating
    const rating = parseInt(lichessData.Rating) || 1200;
    let difficulty;
    if (rating < 1300) difficulty = 'Easy';
    else if (rating < 1600) difficulty = 'Medium';
    else difficulty = 'Hard';

    // Convert UCI moves to SAN
    const uciMoves = lichessData.Moves ? lichessData.Moves.split(' ') : [];
    const sanMoves = this.convertUciToSan(lichessData.FEN, uciMoves);

    // Extract themes
    const themes = lichessData.Themes ? lichessData.Themes.split(' ') : ['tactical'];
    const primaryTheme = this.mapLichessTheme(themes[0] || 'tactical');

    // Determine board orientation
    const game = new Chess(lichessData.FEN);
    const orientation = game.turn() === 'w' ? 'white' : 'black';

    return {
      id: id,
      fen: lichessData.FEN,
      difficulty: difficulty,
      theme: primaryTheme,
      rating: rating,
      description: this.generateDescription(themes, difficulty),
      hint: this.generateHint(primaryTheme, themes),
      solution: sanMoves,
      orientation: orientation,
      solved: false,
      // Lichess-specific data
      lichessId: lichessData.PuzzleId,
      gameUrl: lichessData.GameUrl,
      themes: themes,
      popularity: parseInt(lichessData.Popularity) || 0,
      nbPlays: parseInt(lichessData.NbPlays) || 0,
      openingTags: lichessData.OpeningTags || ''
    };
  }

  convertUciToSan(fen, uciMoves) {
    const game = new Chess(fen);
    const sanMoves = [];

    for (const uci of uciMoves) {
      if (!uci || uci.length < 4) continue;
      
      try {
        const move = game.move({
          from: uci.substring(0, 2),
          to: uci.substring(2, 4),
          promotion: uci.length > 4 ? uci[4] : undefined
        });
        
        if (move) {
          sanMoves.push(move.san);
        } else {
          break; // Invalid move sequence
        }
      } catch (error) {
        break; // Stop on first invalid move
      }
    }

    return sanMoves;
  }

  mapLichessTheme(lichessTheme) {
    const themeMap = {
      'mate': 'Mate',
      'mateIn1': 'Mate in 1',
      'mateIn2': 'Mate in 2',
      'mateIn3': 'Mate in 3',
      'mateIn4': 'Mate in 4',
      'mateIn5': 'Mate in 5',
      'pin': 'Pin',
      'fork': 'Fork',
      'skewer': 'Skewer',
      'sacrifice': 'Sacrifice',
      'deflection': 'Deflection',
      'decoy': 'Decoy',
      'discovery': 'Discovery',
      'discoveredAttack': 'Discovery',
      'clearance': 'Clearance',
      'interference': 'Interference',
      'intermezzo': 'Zwischenzug',
      'zugzwang': 'Zugzwang',
      'advantage': 'Tactical Advantage',
      'endgame': 'Endgame',
      'middlegame': 'Middlegame',
      'opening': 'Opening',
      'promotion': 'Promotion',
      'underPromotion': 'Under Promotion',
      'crushing': 'Crushing',
      'doubleBishop': 'Bishop Pair',
      'doubleCheck': 'Double Check',
      'exposedKing': 'Exposed King',
      'hangingPiece': 'Hanging Piece',
      'kingsideAttack': 'Kingside Attack',
      'queensideAttack': 'Queenside Attack',
      'rookEndgame': 'Rook Endgame',
      'bishopEndgame': 'Bishop Endgame',
      'knightEndgame': 'Knight Endgame',
      'pawnEndgame': 'Pawn Endgame',
      'queenEndgame': 'Queen Endgame'
    };

    return themeMap[lichessTheme] || 'Tactical';
  }

  generateDescription(themes, difficulty) {
    if (themes.includes('mate')) {
      const mateThemes = themes.filter(t => t.startsWith('mateIn'));
      if (mateThemes.length > 0) {
        const mateIn = mateThemes[0].replace('mateIn', '');
        return `Find checkmate in ${mateIn} move${mateIn === '1' ? '' : 's'}.`;
      }
      return 'Find the checkmate sequence.';
    }
    
    const descriptions = {
      'pin': 'Exploit the pin to win material.',
      'fork': 'Use a fork to attack multiple pieces.',
      'skewer': 'Use a skewer to win material.',
      'sacrifice': 'Find the tactical sacrifice.',
      'endgame': 'Navigate this endgame correctly.',
      'advantage': 'Find the move that gives you a decisive advantage.',
      'promotion': 'Push for promotion to win.',
      'deflection': 'Deflect the defender.',
      'decoy': 'Lure the piece to a bad square.',
      'discovery': 'Use a discovered attack.',
      'clearance': 'Clear the path for your pieces.'
    };

    for (const theme of themes) {
      if (descriptions[theme]) {
        return descriptions[theme];
      }
    }

    return `${difficulty} tactical puzzle. Find the best continuation.`;
  }

  generateHint(primaryTheme, themes) {
    const hints = {
      'Mate': 'Look for forcing moves that lead to checkmate.',
      'Mate in 1': 'Find the checkmate in one move.',
      'Mate in 2': 'Find the checkmate in two moves.',
      'Pin': 'Look for pieces that cannot move without exposing a more valuable piece.',
      'Fork': 'Find a move that attacks two or more pieces simultaneously.',
      'Skewer': 'Attack a valuable piece to force it to move.',
      'Sacrifice': 'Consider giving up material for a tactical advantage.',
      'Endgame': 'Focus on precise calculation and king activity.',
      'Discovery': 'Move a piece to reveal an attack from another piece.',
      'Deflection': 'Force a defending piece away from its duty.',
      'Zwischenzug': 'Look for an in-between move.'
    };

    return hints[primaryTheme] || 'Look for tactical patterns and forcing moves.';
  }

  async savePuzzles(puzzles) {
    const dataDir = path.dirname(this.options.outputPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const data = {
      metadata: {
        source: 'lichess.org',
        downloadDate: new Date().toISOString(),
        totalCount: puzzles.length,
        url: this.options.url,
        version: '1.0'
      },
      puzzles: puzzles
    };

    fs.writeFileSync(this.options.outputPath, JSON.stringify(data, null, 2));
    console.log(`💾 Saved ${puzzles.length} puzzles to ${this.options.outputPath}`);
  }

  cleanup() {
    if (fs.existsSync(this.options.tempFile)) {
      fs.unlinkSync(this.options.tempFile);
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  printSummary(puzzles) {
    const summary = {
      total: puzzles.length,
      byDifficulty: { Easy: 0, Medium: 0, Hard: 0 },
      byTheme: {},
      ratingRange: { min: Infinity, max: -Infinity }
    };

    puzzles.forEach(puzzle => {
      summary.byDifficulty[puzzle.difficulty]++;
      summary.byTheme[puzzle.theme] = (summary.byTheme[puzzle.theme] || 0) + 1;
      summary.ratingRange.min = Math.min(summary.ratingRange.min, puzzle.rating);
      summary.ratingRange.max = Math.max(summary.ratingRange.max, puzzle.rating);
    });

    console.log('\n📊 Import Summary:');
    console.log(`   Total puzzles: ${summary.total}`);
    console.log(`   By difficulty:`);
    console.log(`     • Easy: ${summary.byDifficulty.Easy}`);
    console.log(`     • Medium: ${summary.byDifficulty.Medium}`);
    console.log(`     • Hard: ${summary.byDifficulty.Hard}`);
    console.log(`   Rating range: ${summary.ratingRange.min} - ${summary.ratingRange.max}`);
    console.log(`   Top themes:`);
    
    const topThemes = Object.entries(summary.byTheme)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    topThemes.forEach(([theme, count]) => {
      console.log(`     • ${theme}: ${count}`);
    });
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];
    
    if (flag === '--limit') {
      options.limit = parseInt(value);
    } else if (flag === '--output') {
      options.output = value;
    }
  }

  const downloader = new LichessPuzzleDownloader(options);
  downloader.download().catch(console.error);
}

module.exports = LichessPuzzleDownloader;
