// Global variables
let board = [];
let moveHistory = [];
let puzzleSolved = false;
let emptyTile = { row: 0, col: 0 };
const boardSize = 3;
const goalState = [1, 2, 3, 4, 5, 6, 7, 8, 0];

// Initialize the board with a given state
function initBoard(state) {
    board = [];
    moveHistory = [];
    puzzleSolved = false;
    let index = 0;
    for (let row = 0; row < boardSize; row++) {
        const rowArray = [];
        for (let col = 0; col < boardSize; col++) {
            const tileValue = state[index++];
            rowArray.push(tileValue === 0 ? null : tileValue);
            if (tileValue === 0) {
                emptyTile = { row, col };
            }
        }
        board.push(rowArray);
    }
    renderBoard();
    document.getElementById("steps-info").innerHTML = ""; // Clear steps info
}

// Function to generate a random solvable puzzle
function generateRandomPuzzle() {
    let puzzle;
    do {
        puzzle = [...goalState].sort(() => Math.random() - 0.5);
    } while (!isSolvable(puzzle) || puzzle.toString() === goalState.toString());
    return puzzle;
}

// Initialize multiple random puzzles
function initRandomPuzzles(n) {
    const puzzles = [];
    while (puzzles.length < n) {
        const puzzle = generateRandomPuzzle();
        if (!puzzles.some(p => p.toString() === puzzle.toString())) {
            puzzles.push(puzzle);
        }
    }
    return puzzles;
}

// Event listener for the default button
document.getElementById("default-button").addEventListener("click", () => {
    const n = 5; // Change this to the desired number of puzzles
    const puzzles = initRandomPuzzles(n);
    const randomPuzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
    initBoard(randomPuzzle);
});

// Render the board
function renderBoard() {
    const gameBoard = document.getElementById("game-board");
    gameBoard.innerHTML = "";
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            const tile = document.createElement("div");
            tile.classList.add("tile");
            if (board[row][col] === null) {
                tile.classList.add("empty");
            } else {
                tile.textContent = board[row][col];
                if (!puzzleSolved) {
                    tile.addEventListener("click", () => moveTile(row, col));
                }
            }
            gameBoard.appendChild(tile);
        }
    }
}

// Handle tile movements
function moveTile(row, col) {
    if (puzzleSolved) return;

    if ((row === emptyTile.row && Math.abs(col - emptyTile.col) === 1) ||
        (col === emptyTile.col && Math.abs(row - emptyTile.row) === 1)) {
        
        const previousState = board.flat().map(tile => tile === null ? 0 : tile).toString();

        board[emptyTile.row][emptyTile.col] = board[row][col];
        board[row][col] = null;
        emptyTile = { row, col };

        const newState = board.flat().map(tile => tile === null ? 0 : tile).toString();

        if (moveHistory.length === 0 || (moveHistory.length > 0 && moveHistory[moveHistory.length - 1] !== newState)) {
            moveHistory.push(newState);
        }

        renderBoard();

        if (isSolved()) {
            puzzleSolved = true;
            alert("Congratulations! You've solved the puzzle!");
            updateMoveHistory(); // Update move history
            displayStepsInfo();
        }
    }
}

// Check if the puzzle is solved
function isSolved() {
    const currentState = board.flat().map(tile => tile === null ? 0 : tile);
    return currentState.toString() === goalState.toString();
}

// Update move history (no additional action needed here)
function updateMoveHistory(solution = null) {
    if (solution) {
        moveHistory = solution.map(state => state.toString());
    }
    localStorage.setItem('puzzleSteps', JSON.stringify(moveHistory));
}

// Display steps information
function displayStepsInfo() {
    const stepsCount = moveHistory.length;
    document.getElementById("steps-info").innerHTML =
        `Solved in ${stepsCount} steps. <a href="steps.html">View Steps</a>`;
    document.getElementById("steps-info").style.display = "block";

    // Debugging: Log moveHistory to check its contents
    console.log("Storing moveHistory to localStorage:", moveHistory);

    // Store steps in local storage for retrieval on the next page
    localStorage.setItem('puzzleSteps', JSON.stringify(moveHistory));
}

// Get possible moves for the empty tile
function getPossibleMoves() {
    const moves = [];
    const { row, col } = emptyTile;

    if (row > 0) moves.push({ row: row - 1, col });
    if (row < boardSize - 1) moves.push({ row: row + 1, col });
    if (col > 0) moves.push({ row, col: col - 1 });
    if (col < boardSize - 1) moves.push({ row, col: col + 1 });

    return moves;
}

// Get hint for the next move
function getHint() {
    if (puzzleSolved) return;

    const startState = board.flat().map(tile => tile === null ? 0 : tile);

    const solution = astar(startState);
    if (solution && solution.length > 1) {
        const nextStep = solution[1];
        const emptyIndex = nextStep.indexOf(0);
        const currentEmptyIndex = startState.indexOf(0);

        const row = Math.floor(emptyIndex / boardSize);
        const col = emptyIndex % boardSize;

        highlightHint({ row, col });
        alert(`Hint: Move the tile at (${row + 1}, ${col + 1})`);

        // Capture the hint move as a step
        const hintState = board.flat().map(tile => tile === null ? 0 : tile).toString();
        moveHistory.push(hintState);
        localStorage.setItem('puzzleSteps', JSON.stringify(moveHistory));
    } else {
        alert("No hint available.");
    }
}

// Highlight hint tile
function highlightHint(move) {
    const tiles = document.querySelectorAll("#game-board .tile");
    tiles.forEach((tile, index) => {
        const row = Math.floor(index / boardSize);
        const col = index % boardSize;
        if (row === move.row && col === move.col) {
            tile.style.border = "2px solid yellow";
            tile.style.backgroundColor = "#f39c12";
        } else {
            tile.style.border = "1px solid #3498db";
            tile.style.backgroundColor = "";
        }
    });
}

// Solve the puzzle using A* algorithm
function solvePuzzle() {
    const startState = board.flat().map(tile => tile === null ? 0 : tile);

    if (!isSolvable(startState)) {
        alert("This puzzle configuration is not solvable.");
        return;
    }

    const solution = astar(startState);

    if (solution) {
        puzzleSolved = true;
        solution.forEach((step, index) => {
            setTimeout(() => {
                initBoard(step);
                if (index === solution.length - 1) {
                    alert("Puzzle solved by the algorithm!");
                    updateMoveHistory(solution); // Update move history for algorithm steps
                    displayStepsInfo();
                }
            }, 500 * index); // Adds a delay between each move for visualization
        });
    } else {
        alert("No solution found.");

        // Re-enable buttons if no solution is found
        document.getElementById("initialize-button").disabled = false;
        document.getElementById("default-button").disabled = false;
        document.getElementById("solve-button").disabled = false;
        document.getElementById("help-button").disabled = false;
    }
}

// Check if the puzzle is solvable
function isSolvable(state) {
    let inversions = 0;
    for (let i = 0; i < state.length; i++) {
        for (let j = i + 1; j < state.length; j++) {
            if (state[i] > state[j] && state[i] !== 0 && state[j] !== 0) {
                inversions++;
            }
        }
    }
    return inversions % 2 === 0;
}

// A* algorithm implementation
function astar(startState) {
    const openList = [];
    const closedList = new Set();
    const gScores = new Map();
    const fScores = new Map();
    const cameFrom = new Map();

    function heuristic(state) {
        let distance = 0;
        for (let i = 0; i < state.length; i++) {
            if (state[i] !== 0) {
                const targetRow = Math.floor((state[i] - 1) / boardSize);
                const targetCol = (state[i] - 1) % boardSize;
                const currentRow = Math.floor(i / boardSize);
                const currentCol = i % boardSize;
                distance += Math.abs(targetRow - currentRow) + Math.abs(targetCol - currentCol);
            }
        }
        return distance;
    }

    function reconstructPath(current) {
        const path = [current];
        while (cameFrom.has(current.toString())) {
            current = cameFrom.get(current.toString());
            path.unshift(current);
        }
        return path;
    }

    gScores.set(startState.toString(), 0);
    fScores.set(startState.toString(), heuristic(startState));
    openList.push({ state: startState, fScore: fScores.get(startState.toString()) });

    while (openList.length > 0) {
        openList.sort((a, b) => a.fScore - b.fScore);
        const current = openList.shift().state;

        if (current.toString() === goalState.toString()) {
            return reconstructPath(current);
        }

        closedList.add(current.toString());

        const emptyIndex = current.indexOf(0);
        const emptyRow = Math.floor(emptyIndex / boardSize);
        const emptyCol = emptyIndex % boardSize;

        const possibleMoves = [
            { row: emptyRow - 1, col: emptyCol },
            { row: emptyRow + 1, col: emptyCol },
            { row: emptyRow, col: emptyCol - 1 },
            { row: emptyRow, col: emptyCol + 1 }
        ];

        for (const move of possibleMoves) {
            if (move.row >= 0 && move.row < boardSize && move.col >= 0 && move.col < boardSize) {
                const newState = [...current];
                const targetIndex = move.row * boardSize + move.col;
                [newState[emptyIndex], newState[targetIndex]] = [newState[targetIndex], newState[emptyIndex]];

                if (closedList.has(newState.toString())) continue;

                const tentativeGScore = gScores.get(current.toString()) + 1;

                if (!gScores.has(newState.toString()) || tentativeGScore < gScores.get(newState.toString())) {
                    cameFrom.set(newState.toString(), current);
                    gScores.set(newState.toString(), tentativeGScore);
                    fScores.set(newState.toString(), tentativeGScore + heuristic(newState));

                    if (!openList.some(item => item.state.toString() === newState.toString())) {
                        openList.push({ state: newState, fScore: fScores.get(newState.toString()) });
                    }
                }
            }
        }
    }
  
   return null;
}

// Default button event listener
document.getElementById("default-button").addEventListener("click", () => {
    const shuffledPuzzle = shufflePuzzle(goalState.slice());
    initBoard(shuffledPuzzle);
});

// Initialize button event listener
// Initialize button event listener
document.getElementById("initialize-button").addEventListener("click", () => {
    const state = [];
    const usedValues = new Set();

    for (let i = 0; i < 9; i++) {
        let value;
        while (true) {
            value = parseInt(prompt(`Enter value for tile ${i + 1} (0 for empty):`), 10);
            if (isNaN(value) || value < 0 || value > 8) {
                alert("Invalid input. Please enter a number between 0 and 8.");
            } else if (usedValues.has(value)) {
                alert(`The value ${value} has already been used. Please enter a different value.`);
                alert(`Values not used yet: ${[...Array(9).keys()].filter(n => !usedValues.has(n)).join(', ')}`);
            } else {
                usedValues.add(value);
                break;
            }
        }
        state.push(value);
    }

    initBoard(state);
});


// Solve and help buttons event listeners
document.getElementById("solve-button").addEventListener("click", solvePuzzle);
document.getElementById("help-button").addEventListener("click", getHint);

