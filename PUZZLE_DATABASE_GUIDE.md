# Chess Puzzle Database Integration Guide

## Quick Start - Download Lichess Puzzles

### Option 1: Official Lichess CSV Database (Recommended for beginners)
```bash
# Download the official puzzles CSV file
curl -o lichess_puzzles.csv "http://database.lichess.org/lichess_db_puzzle.csv.bz2"
# Extract the file
bunzip2 lichess_puzzles.csv.bz2
```

### Option 2: Enhanced Database with Game Info
```bash
# Download sample files first to test
wget https://github.com/mcognetta/lichess-combined-puzzle-game-db/raw/main/combined_puzzle_db_first_50k.ndjson.bz2
bunzip2 combined_puzzle_db_first_50k.ndjson.bz2
```

## CSV Format (Lichess Official)
The CSV contains these columns:
- `PuzzleId`: Unique identifier
- `FEN`: Chess position in FEN notation
- `Moves`: Solution moves in UCI format (e.g., "e2e4 e7e5")
- `Rating`: Difficulty rating (800-2800)
- `RatingDeviation`: Confidence in rating
- `Popularity`: How often it's played
- `NbPlays`: Number of times played
- `Themes`: Space-separated themes (e.g., "mate mateIn2 middlegame")
- `GameUrl`: Link to original game
- `OpeningTags`: Opening classification

## Sample CSV Data
```csv
PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags
00sHx,q3k1nr/1pp1nQpp/3p4/1P2p3/4P3/B1PP1b2/B5PP/5K2 b k - 0 17,e8d7 a2e6 d7d8 f7f8,1760,80,83,72,mate mateIn2 middlegame short,https://lichess.org/yyznGmXs/black#34,Italian_Game Italian_Game_Classical_Variation
```

## Implementation Steps

1. **Download the database file**
2. **Create a puzzle import script** 
3. **Parse and convert the data**
4. **Update your puzzle service**

The next step would be to create a script that:
- Downloads the CSV file
- Converts UCI moves to SAN (standard algebraic notation)
- Maps themes to your format
- Determines difficulty levels based on ratings
- Imports puzzles into your database

Would you like me to create this import script for your platform?
