// Puzzle Database Import Utility
// This script downloads and processes the Lichess puzzle database

const fs = require('fs');
const https = require('https');
const { Chess } = require('chess.js');

class PuzzleImporter {
  constructor() {
    this.outputPath = './src/data/imported_puzzles.json';
    this.sampleSize = 1000; // Import first 1000 puzzles for testing
  }

  // Download a sample of puzzles (you can modify this to download the full database)
  async downloadSamplePuzzles() {
    console.log('🚀 Starting puzzle import process...');
    
    // For demo purposes, we'll create a sample based on the Lichess format
    // In production, you would download from: http://database.lichess.org/lichess_db_puzzle.csv.bz2
    
    const sampleData = `PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags
00sHx,q3k1nr/1pp1nQpp/3p4/1P2p3/4P3/B1PP1b2/B5PP/5K2 b k - 0 17,e8d7 a2e6 d7d8 f7f8,1760,80,83,72,mate mateIn2 middlegame short,https://lichess.org/yyznGmXs/black#34,Italian_Game Italian_Game_Classical_Variation
01xGT,r1bqkb1r/pppp1ppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4,f3g5,1142,74,91,104,advantage short,https://lichess.org/RFEyAWo1#8,Italian_Game Italian_Game_Classical_Variation
02KTt,8/8/8/3k4/3P4/3K4/8/8 w - - 0 1,d3e3,1346,76,85,93,endgame short,https://lichess.org/example1#32,King_and_Pawn_Endgame
03mPq,rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3,d7d6,1289,71,88,97,development short,https://lichess.org/example2#6,Italian_Game
04RzA,r1bq1rk1/ppp2ppp/2n1bn2/2bpp3/2B1P3/3P1N2/PPP1NPPP/R1BQK2R w KQ - 0 7,c4d5,1654,82,79,85,pin sacrifice,https://lichess.org/example3#14,Italian_Game`;

    return this.parseCsvData(sampleData);
  }

  // Parse CSV data and convert to our format
  parseCsvData(csvData) {
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',');
    const puzzles = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length !== headers.length) continue;

      const puzzleData = {};
      headers.forEach((header, index) => {
        puzzleData[header] = values[index];
      });

      const convertedPuzzle = this.convertToPlatformFormat(puzzleData, i);
      if (convertedPuzzle) {
        puzzles.push(convertedPuzzle);
      }
    }

    console.log(`✅ Successfully parsed ${puzzles.length} puzzles`);
    return puzzles;
  }

  // Handle CSV parsing with potential commas in quoted fields
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }

  // Convert Lichess format to our platform format
  convertToPlatformFormat(lichessData, index) {
    try {
      // Determine difficulty based on rating
      const rating = parseInt(lichessData.Rating);
      let difficulty;
      if (rating < 1300) difficulty = 'Easy';
      else if (rating < 1600) difficulty = 'Medium';
      else difficulty = 'Hard';

      // Convert UCI moves to SAN
      const uciMoves = lichessData.Moves.split(' ');
      const sanMoves = this.convertUciToSan(lichessData.FEN, uciMoves);

      // Extract primary theme
      const themes = lichessData.Themes.split(' ');
      const primaryTheme = this.mapLichessTheme(themes[0]);

      // Determine board orientation
      const game = new Chess(lichessData.FEN);
      const orientation = game.turn() === 'w' ? 'white' : 'black';

      return {
        id: index + 1000, // Offset to avoid conflicts with existing puzzles
        fen: lichessData.FEN,
        difficulty: difficulty,
        theme: primaryTheme,
        rating: rating,
        description: `${difficulty} ${primaryTheme.toLowerCase()} puzzle. ${this.generateDescription(themes)}`,
        hint: this.generateHint(primaryTheme, themes),
        solution: sanMoves,
        orientation: orientation,
        solved: false,
        lichessId: lichessData.PuzzleId,
        gameUrl: lichessData.GameUrl,
        themes: themes,
        popularity: parseInt(lichessData.Popularity) || 0,
        nbPlays: parseInt(lichessData.NbPlays) || 0
      };
    } catch (error) {
      console.warn(`⚠️ Failed to convert puzzle ${lichessData.PuzzleId}:`, error.message);
      return null;
    }
  }

  // Convert UCI notation to SAN (Standard Algebraic Notation)
  convertUciToSan(fen, uciMoves) {
    const game = new Chess(fen);
    const sanMoves = [];

    for (const uci of uciMoves) {
      try {
        const move = game.move({
          from: uci.substring(0, 2),
          to: uci.substring(2, 4),
          promotion: uci.length > 4 ? uci[4] : undefined
        });
        if (move) {
          sanMoves.push(move.san);
        }
      } catch (error) {
        console.warn(`Failed to convert UCI move ${uci}:`, error.message);
        break;
      }
    }

    return sanMoves;
  }

  // Map Lichess themes to our themes
  mapLichessTheme(lichessTheme) {
    const themeMap = {
      'mate': 'Mate',
      'mateIn1': 'Mate in 1',
      'mateIn2': 'Mate in 2',
      'mateIn3': 'Mate in 3',
      'pin': 'Pin',
      'fork': 'Fork',
      'skewer': 'Skewer',
      'sacrifice': 'Sacrifice',
      'deflection': 'Deflection',
      'decoy': 'Decoy',
      'discovery': 'Discovery',
      'clearance': 'Clearance',
      'interference': 'Interference',
      'advantage': 'Tactical Advantage',
      'endgame': 'Endgame',
      'middlegame': 'Middlegame',
      'opening': 'Opening',
      'promotion': 'Promotion',
      'underPromotion': 'Under Promotion',
      'castling': 'Castling',
      'enPassant': 'En Passant',
      'zugzwang': 'Zugzwang',
      'x-ray': 'X-Ray',
      'doubleBishop': 'Bishop Pair',
      'doubleRook': 'Rook Pair'
    };

    return themeMap[lichessTheme] || 'Tactical';
  }

  // Generate description based on themes
  generateDescription(themes) {
    if (themes.includes('mate')) {
      return 'Find the checkmate sequence.';
    } else if (themes.includes('pin')) {
      return 'Exploit the pin to win material.';
    } else if (themes.includes('fork')) {
      return 'Use a fork to attack multiple pieces.';
    } else if (themes.includes('sacrifice')) {
      return 'Find the tactical sacrifice.';
    } else if (themes.includes('endgame')) {
      return 'Navigate this endgame correctly.';
    }
    return 'Find the best tactical continuation.';
  }

  // Generate hints based on theme
  generateHint(primaryTheme, themes) {
    const hintMap = {
      'Mate': 'Look for forcing moves that lead to checkmate.',
      'Mate in 1': 'Find the checkmate in one move.',
      'Mate in 2': 'Find the checkmate in two moves.',
      'Pin': 'Look for pieces that cannot move without exposing a more valuable piece.',
      'Fork': 'Find a move that attacks two or more pieces simultaneously.',
      'Skewer': 'Attack a valuable piece to force it to move and capture a less valuable piece behind it.',
      'Sacrifice': 'Consider giving up material for a tactical advantage.',
      'Endgame': 'Focus on precise calculation and pawn promotion.',
      'Discovery': 'Move a piece to reveal an attack from another piece.'
    };

    return hintMap[primaryTheme] || 'Look for tactical patterns and forcing moves.';
  }

  // Save puzzles to JSON file
  async savePuzzles(puzzles) {
    const dataDir = './src/data';
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const data = {
      importDate: new Date().toISOString(),
      source: 'lichess.org',
      count: puzzles.length,
      puzzles: puzzles
    };

    fs.writeFileSync(this.outputPath, JSON.stringify(data, null, 2));
    console.log(`💾 Saved ${puzzles.length} puzzles to ${this.outputPath}`);
  }

  // Main import function
  async importPuzzles() {
    try {
      console.log('📥 Downloading puzzle database...');
      const puzzles = await this.downloadSamplePuzzles();
      
      console.log('💾 Saving puzzles...');
      await this.savePuzzles(puzzles);
      
      console.log('✨ Import completed successfully!');
      console.log(`\n📊 Import Summary:`);
      console.log(`   • Total puzzles: ${puzzles.length}`);
      console.log(`   • Easy: ${puzzles.filter(p => p.difficulty === 'Easy').length}`);
      console.log(`   • Medium: ${puzzles.filter(p => p.difficulty === 'Medium').length}`);
      console.log(`   • Hard: ${puzzles.filter(p => p.difficulty === 'Hard').length}`);
      console.log(`   • Output file: ${this.outputPath}`);
      
      return puzzles;
    } catch (error) {
      console.error('❌ Import failed:', error);
      throw error;
    }
  }
}

// Export for use in other modules
module.exports = PuzzleImporter;

// Command line usage
if (require.main === module) {
  const importer = new PuzzleImporter();
  importer.importPuzzles().catch(console.error);
}
