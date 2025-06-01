const fs = require('fs');
const path = require('path');
const readline = require('readline');

class StreamingCSVProcessor {
  constructor(options = {}) {
    this.options = {
      inputFile: './temp_puzzles.csv',
      outputFile: './src/data/lichess_puzzles.json',
      limit: 4000,
      ...options
    };
  }

  async process() {
    try {
      console.log('🔄 Processing CSV file with streaming...');
      console.log(`📂 Input: ${this.options.inputFile}`);
      console.log(`💾 Output: ${this.options.outputFile}`);
      console.log(`🔢 Limit: ${this.options.limit} puzzles`);

      const puzzles = await this.parseCSVStream();
      const converted = this.convertPuzzles(puzzles);
      
      await this.saveJSON(converted);
      
      console.log('✅ Processing completed successfully!');
      console.log(`📊 Total puzzles processed: ${converted.length}`);
      
    } catch (error) {
      console.error('❌ Processing failed:', error.message);
      throw error;
    }
  }
  async parseCSVStream() {
    console.log('📖 Reading CSV file with streaming...');
    
    return new Promise((resolve, reject) => {
      const puzzles = [];
      const fileStream = fs.createReadStream(this.options.inputFile);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });
      
      // Define headers since CSV doesn't have them
      const headers = ['PuzzleId', 'FEN', 'Moves', 'Rating', 'RatingDeviation', 'Popularity', 'NbPlays', 'Themes', 'GameUrl', 'Opening'];
      console.log(`📊 Using predefined headers: ${headers.join(', ')}`);
      
      let lineCount = 0;
      let processedCount = 0;
      
      rl.on('line', (line) => {
        lineCount++;
        
        if (processedCount >= this.options.limit) {
          rl.close();
          return;
        }
        
        if (!line.trim()) return;
        
        try {
          const values = this.parseCSVLine(line.trim());
          if (values.length >= 8) { // Minimum required fields
            const puzzle = {};
            headers.forEach((header, index) => {
              puzzle[header] = values[index] || '';
            });
            puzzles.push(puzzle);
            processedCount++;
          }
          
          if (processedCount % 1000 === 0) {
            console.log(`📊 Parsed ${processedCount} puzzles...`);
          }
        } catch (error) {
          console.warn(`⚠️ Error parsing line ${lineCount}: ${error.message}`);
        }
      });
      
      rl.on('close', () => {
        console.log(`✅ Parsed ${puzzles.length} puzzles from CSV`);
        resolve(puzzles);
      });
      
      rl.on('error', (error) => {
        console.error('❌ Error reading file:', error);
        reject(error);
      });
    });
  }

  parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current.trim());
    return values;
  }

  convertPuzzles(puzzles) {
    console.log('🔧 Converting puzzles to standard format...');
    const converted = [];
    
    for (let i = 0; i < puzzles.length; i++) {
      const puzzle = puzzles[i];
      
      try {
        // Lichess CSV format: PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl
        const converted_puzzle = {
          id: puzzle.PuzzleId || `puzzle_${i + 1}`,
          fen: puzzle.FEN || '',
          moves: puzzle.Moves ? puzzle.Moves.split(' ') : [],
          rating: parseInt(puzzle.Rating) || 1500,
          themes: puzzle.Themes ? puzzle.Themes.split(' ') : ['puzzle'],
          popularity: parseInt(puzzle.Popularity) || 0,
          nbPlays: parseInt(puzzle.NbPlays) || 0,
          gameUrl: puzzle.GameUrl || '',
          difficulty: this.getDifficulty(parseInt(puzzle.Rating) || 1500)
        };
        
        // Only add puzzles with valid data
        if (converted_puzzle.fen && converted_puzzle.moves.length > 0) {
          converted.push(converted_puzzle);
        }
        
        if ((i + 1) % 1000 === 0) {
          console.log(`🔧 Converted ${i + 1} puzzles...`);
        }
        
      } catch (error) {
        console.warn(`⚠️ Error converting puzzle ${i + 1}: ${error.message}`);
      }
    }
    
    console.log(`✅ Converted ${converted.length} valid puzzles`);
    return converted;
  }

  getDifficulty(rating) {
    if (rating < 1200) return 'beginner';
    if (rating < 1600) return 'intermediate';
    if (rating < 2000) return 'advanced';
    return 'expert';
  }

  async saveJSON(puzzles) {
    console.log('💾 Saving puzzles to JSON file...');
    
    // Ensure data directory exists
    const outputDir = path.dirname(this.options.outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const output = {
      metadata: {
        source: 'Lichess Puzzle Database',
        processed_at: new Date().toISOString(),
        total_puzzles: puzzles.length,
        rating_range: {
          min: Math.min(...puzzles.map(p => p.rating)),
          max: Math.max(...puzzles.map(p => p.rating))
        },
        themes: [...new Set(puzzles.flatMap(p => p.themes))].sort()
      },
      puzzles: puzzles
    };
    
    fs.writeFileSync(this.options.outputFile, JSON.stringify(output, null, 2));
    console.log(`✅ Saved ${puzzles.length} puzzles to ${this.options.outputFile}`);
  }
}

// Run the processor
const processor = new StreamingCSVProcessor();
processor.process().catch(console.error);
