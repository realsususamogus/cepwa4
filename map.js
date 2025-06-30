function initializeTerritory() {
    territory = [];
    for (let i = 0; i < mapCols; i++) {
        territory[i] = [];
        for (let j = 0; j < mapRows; j++) {
            territory[i][j] = 'neutral'; // 'neutral', 'player', 'alien'
        }
    }
}

function generateMap() {
    // Define tile types and their adjacency rules - removed water, reduced rock probability
    let tileTypes = {
        'ground': { adjacent: ['ground', 'rock'], color: [34, 139, 34] },
        'rock': { adjacent: ['ground', 'rock'], color: [105, 105, 105] }
    };
    
    // Initialize grid with all possibilities
    let waveGrid = [];
    for (let i = 0; i < mapCols; i++) {
        waveGrid[i] = [];
        for (let j = 0; j < mapRows; j++) {
            // Weight the initial possibilities to favor ground over rock
            let possibilities = [];
            // Add ground multiple times to increase its probability
            for (let k = 0; k < 9; k++) { // 8 ground vs 2 rock = 80% ground, 20% rock
                possibilities.push('ground');
            }
            for (let k = 0; k < 1; k++) {
                possibilities.push('rock');
            }
            waveGrid[i][j] = possibilities;
        }
    }
    
    // Simple WFC implementation
    let maxIterations = mapCols * mapRows * 2; // Prevent infinite loops
    let iterations = 0;
    
    while (!isFullyCollapsed(waveGrid) && iterations < maxIterations) {
        let cell = findLowestEntropy(waveGrid);
        if (cell) {
            let chosenTile = random(waveGrid[cell.x][cell.y]);
            waveGrid[cell.x][cell.y] = [chosenTile];
            
            // Propagate constraints to neighbors
            propagateConstraints(waveGrid, cell.x, cell.y, tileTypes);
        }
        iterations++;
    }
    
    // Convert to obstacles and store terrain
    obstacles = [];
    window.terrainGrid = []; // Store terrain for drawing
    
    for (let i = 0; i < mapCols; i++) {
        window.terrainGrid[i] = [];
        for (let j = 0; j < mapRows; j++) {
            let tileType = waveGrid[i][j].length > 0 ? waveGrid[i][j][0] : 'ground';
            window.terrainGrid[i][j] = tileType;
            
            if (tileType === 'rock') {
                obstacles.push({x: i * cellSize, y: j * cellSize});
            }
        }
    }
}

function isFullyCollapsed(grid) {
    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[i].length; j++) {
            if (grid[i][j].length > 1) {
                return false;
            }
        }
    }
    return true;
}

function findLowestEntropy(grid) {
    let minEntropy = Infinity;
    let candidates = [];
    
    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[i].length; j++) {
            let entropy = grid[i][j].length;
            if (entropy > 1 && entropy < minEntropy) {
                minEntropy = entropy;
                candidates = [{x: i, y: j}];
            } else if (entropy === minEntropy && entropy > 1) {
                candidates.push({x: i, y: j});
            }
        }
    }
    
    return candidates.length > 0 ? random(candidates) : null;
}

function propagateConstraints(grid, x, y, tileTypes) {
    let stack = [{x: x, y: y}];
    
    while (stack.length > 0) {
        let current = stack.pop();
        let currentTile = grid[current.x][current.y][0];
        
        // Check all 4 neighbors
        let neighbors = [
            {x: current.x - 1, y: current.y},
            {x: current.x + 1, y: current.y},
            {x: current.x, y: current.y - 1},
            {x: current.x, y: current.y + 1}
        ];
        
        for (let neighbor of neighbors) {
            if (neighbor.x >= 0 && neighbor.x < grid.length && 
                neighbor.y >= 0 && neighbor.y < grid[0].length) {
                
                if (grid[neighbor.x][neighbor.y].length > 1) {
                    let oldLength = grid[neighbor.x][neighbor.y].length;
                    
                    // Filter neighbor possibilities based on current tile's adjacency rules
                    grid[neighbor.x][neighbor.y] = grid[neighbor.x][neighbor.y].filter(tile => 
                        tileTypes[currentTile].adjacent.includes(tile)
                    );
                    
                    // If possibilities changed, add to stack for further propagation
                    if (grid[neighbor.x][neighbor.y].length < oldLength && 
                        grid[neighbor.x][neighbor.y].length > 0) {
                        stack.push(neighbor);
                    }
                    
                    // Handle contradiction (no valid tiles left)
                    if (grid[neighbor.x][neighbor.y].length === 0) {
                        grid[neighbor.x][neighbor.y] = ['ground']; // Fallback
                    }
                }
            }
        }
    }
}

function updateTerritory() {
    // Slowly convert alien territory back to neutral
    if (frameCount % 300 === 0) {
        for (let i = 0; i < mapCols; i++) {
            for (let j = 0; j < mapRows; j++) {
                if (territory[i][j] === 'alien' && random() < 0.1) {
                    territory[i][j] = 'neutral';
                }
            }
        }
    }
}

function calculateCapturedPercent() {
    let alienCells = 0;
    let totalCells = mapCols * mapRows;
    
    for (let i = 0; i < mapCols; i++) {
        for (let j = 0; j < mapRows; j++) {
            if (territory[i][j] === 'alien') {
                alienCells++;
            }
        }
    }
    
    capturedPercent = (alienCells / totalCells) * 100;
}