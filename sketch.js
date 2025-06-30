// Game variables
let gameState = {
    state: 'playing',
    wave: 1,
    waveActive: false,
    baseResources: 1000,
    energy: 100,
    basePosition: { x: 0, y: 0 },
    spawnPosition: { x: 0, y: 0 }
};

let territory = [];
let aliens = [];
let turrets = [];
let projectiles = [];
let alienGenes = [];
let capturedPercent = 0;

// Map settings
let mapWidth = 800;
let mapHeight = 600;
let cellSize = 20;
let mapCols, mapRows;
let obstacles = [];
const GRID_SIZE = 25;

// Genetic algorithm settings
let populationSize = 50;
let mutationRate = 0.1;

// Wave spawning variables
let spawnTimer = 0;
let aliensToSpawn = 0;
let spawnDelay = 90; // frames between spawns

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    
    // Update map dimensions
    mapWidth = width;
    mapHeight = height;
    mapCols = mapWidth / cellSize;
    mapRows = mapHeight / cellSize;
    
    COLS = Math.floor(width / GRID_SIZE);
    ROWS = Math.floor(height / GRID_SIZE);
    
    // Update base and spawn positions
    gameState.basePosition = { x: width - 100, y: height / 2 };
    gameState.spawnPosition = { x: 100, y: height / 2 };
    
    // Regenerate grids and territory for new size
    initializeTerritory();
    generateMap();
    
    console.log(`Resized to ${width}x${height}`);
}

function setup() {
    // Create canvas that fills the browser window
    createCanvas(windowWidth, windowHeight);
    
    // Update map dimensions based on new canvas size
    mapWidth = width;
    mapHeight = height;
    mapCols = mapWidth / cellSize;
    mapRows = mapHeight / cellSize;
    
    COLS = Math.floor(width / GRID_SIZE);
    ROWS = Math.floor(height / GRID_SIZE);
    
    // Set base and spawn positions relative to new canvas size
    gameState.basePosition = { x: width - 100, y: height / 2 };
    gameState.spawnPosition = { x: 100, y: height / 2 };
    
    // Initialize grids with new dimensions
    infestationGrid = [];
    for (let y = 0; y < ROWS; y++) {
        infestationGrid[y] = [];
        for (let x = 0; x < COLS; x++) {
            infestationGrid[y][x] = 0;
        }
    }
    
    // Reinitialize territory with new dimensions
    territory = [];
    initializeTerritory();
    generateMap();
    initializeAlienGenes(20);
}

function draw() {
    background(50);
    
    if (gameState.state === 'playing') {
        updateGame();
        drawGame();
        checkGameOver();
    } else {
        drawGameOver();
    }
}

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

function initializeAlienGenes() {
    alienGenes = [];
    for (let i = 0; i < populationSize; i++) {
        alienGenes.push({
            health: random(50, 150),
            speed: random(0.5, 2.5),
            spawnSide: floor(random(4)) // 0=top, 1=right, 2=bottom, 3=left
        });
    }
}

function updateGame() {
    // Handle alien spawning
    handleSpawning();
    
    // Update aliens
    for (let i = aliens.length - 1; i >= 0; i--) {
        updateAlien(aliens[i]);
        if (aliens[i].health <= 0) {
            aliens.splice(i, 1);
        }
    }
    
    // Update turrets
    for (let turret of turrets) {
        updateTurret(turret);
    }
    
    // Update projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        updateProjectile(projectiles[i]);
        if (projectiles[i].life <= 0) {
            projectiles.splice(i, 1);
        }
    }
    
    updateTerritory();
    calculateCapturedPercent();
    
    // Check wave completion - only end wave if all aliens spawned AND all aliens are gone
    if (gameState.waveActive && aliens.length < 2 && aliensToSpawn === 0) {
        console.log("🏁 Wave complete - ending wave");
        endWave();
    }
    
    // Check game over condition
    if (capturedPercent > 60) {
        gameState.state = 'gameOver';
        evolveAliens();
    }
}

function handleSpawning() {
    if (gameState.waveActive && aliensToSpawn > 0) {
        spawnTimer++;
        
        if (spawnTimer >= spawnDelay) {
            // Spawn an alien
            spawnAlien();
            console.log(`✨ Spawned alien ${aliens.length}, ${aliensToSpawn - 1} remaining`);
            
            aliensToSpawn--;
            spawnTimer = 0; // Reset timer
            
            if (aliensToSpawn === 0) {
                console.log("🎯 All aliens spawned for this wave");
            }
        }
    }
}

function startWave() {
    if (gameState.waveActive) {
        console.log("❌ Cannot start wave - already active");
        return;
    }
    
    console.log(`🚀 Starting wave ${gameState.wave}`);
    gameState.waveActive = true;
    
    // Set up spawning parameters
    aliensToSpawn = 3 + 5*gameState.wave; // Increase aliens per wave
    spawnTimer = 0;
    spawnDelay = 90; // frames betwe en spawns
    
    console.log(`📋 Will spawn ${aliensToSpawn} aliens with ${spawnDelay} frame delay`);
}

function endWave() {
    console.log(`🎊 Ending wave ${gameState.wave}`);
    
    gameState.waveActive = false;
    gameState.wave++;
    gameState.energy += 25;
    
    // Reset spawning variables
    aliensToSpawn = 0;
    spawnTimer = 0;
    
    // Clear aliens array
    aliens = [];
    
    // Evolve aliens
    evolveAliens();
    
    console.log(`✅ Wave ${gameState.wave - 1} completed`);
    console.log(`📊 Ready for wave ${gameState.wave}. Press Space to start.`);
}

function checkObstacleCollision(x, y) {
    // Check bounds
    if (x < 0 || x >= width || y < 0 || y >= height) {
        return true;
    }
    
    // Check terrain grid for rocks - FIX: correct array indexing
    if (window.terrainGrid) {
        let gridX = floor(x / cellSize);
        let gridY = floor(y / cellSize);
        
        if (gridX >= 0 && gridX < mapCols && gridY >= 0 && gridY < mapRows) {
            return window.terrainGrid[gridX][gridY] === 'rock'; // Fixed: was [gridY][gridX]
        }
    }
    
    return false;
}

function updateAlien(alien) {
    // Move toward target with improved collision detection
    let dx = alien.target.x - alien.x;
    let dy = alien.target.y - alien.y;
    let distance = sqrt(dx * dx + dy * dy);
    
    if (distance > 5) {
        // Calculate movement direction
        let moveX = (dx / distance) * alien.speed;
        let moveY = (dy / distance) * alien.speed;
        
        // Use smaller steps for collision detection to prevent tunneling
        let steps = ceil(alien.speed); // Break movement into smaller steps
        let stepX = moveX / steps;
        let stepY = moveY / steps;
        
        let currentX = alien.x;
        let currentY = alien.y;
        let alienRadius = 7.5;
        let collisionDetected = false;
        
        // Check each small step
        for (let step = 0; step < steps; step++) {
            let nextX = currentX + stepX;
            let nextY = currentY + stepY;
            
            // Check collision at multiple points around the alien
            let checkPoints = [
                {x: nextX, y: nextY}, // center
                {x: nextX - alienRadius, y: nextY - alienRadius}, // top-left
                {x: nextX + alienRadius, y: nextY - alienRadius}, // top-right
                {x: nextX - alienRadius, y: nextY + alienRadius}, // bottom-left
                {x: nextX + alienRadius, y: nextY + alienRadius}  // bottom-right
            ];
            
            let stepCollision = false;
            for (let point of checkPoints) {
                if (checkObstacleCollision(point.x, point.y)) {
                    stepCollision = true;
                    collisionDetected = true;
                    break;
                }
            }
            
            if (stepCollision) {
                break; // Stop moving if we hit an obstacle
            }
            
            // Move to next step position
            currentX = nextX;
            currentY = nextY;
        }
        
        if (!collisionDetected) {
            // Safe to move to final position
            alien.x = currentX;
            alien.y = currentY;
        } else {
            // Collision detected - try to move around obstacle
            moveAroundObstacle(alien, dx, dy, distance);
        }
    } else {
        // Pick new target that's not on a rock
        alien.target = findValidTarget();
    }
    
    // Capture territory
    let gridX = floor(alien.x / cellSize);
    let gridY = floor(alien.y / cellSize);
    if (gridX >= 0 && gridX < mapCols && gridY >= 0 && gridY < mapRows) {
        territory[gridX][gridY] = 'alien';
    }
}

function moveAroundObstacle(alien, dx, dy, distance) {
    // Add a stuckCounter to track if alien is stuck
    if (!alien.stuckCounter) alien.stuckCounter = 0;
    if (!alien.lastPosition) alien.lastPosition = {x: alien.x, y: alien.y};
    
    // Check if alien hasn't moved much (is stuck)
    let distanceMoved = sqrt((alien.x - alien.lastPosition.x)**2 + (alien.y - alien.lastPosition.y)**2);
    if (distanceMoved < 1) {
        alien.stuckCounter++;
    } else {
        alien.stuckCounter = 0;
    }
    
    // If stuck for too long, pick a completely new target
    if (alien.stuckCounter > 20) {
        alien.target = findValidTarget();
        alien.stuckCounter = 0;
        alien.lastPosition = {x: alien.x, y: alien.y};
        return;
    }
    
    // Try moving perpendicular to the obstacle with smaller steps
    let alienRadius = 7.5;
    let avoidanceSpeed = alien.speed * 0.5; // Slower when avoiding obstacles
    let perpX1 = -dy / distance * avoidanceSpeed;
    let perpY1 = dx / distance * avoidanceSpeed;
    let perpX2 = dy / distance * avoidanceSpeed;
    let perpY2 = -dx / distance * avoidanceSpeed;
    
    // Try first perpendicular direction with step-by-step checking
    if (canMoveTo(alien.x + perpX1, alien.y + perpY1, alienRadius)) {
        alien.x += perpX1;
        alien.y += perpY1;
        alien.lastPosition = {x: alien.x, y: alien.y};
    }
    // Try second perpendicular direction
    else if (canMoveTo(alien.x + perpX2, alien.y + perpY2, alienRadius)) {
        alien.x += perpX2;
        alien.y += perpY2;
        alien.lastPosition = {x: alien.x, y: alien.y};
    }
    // Try moving at an angle (diagonal avoidance)
    else {
        let angleOffset = alien.stuckCounter * 0.2; // More dramatic angle changes
        let newDx = dx * cos(angleOffset) - dy * sin(angleOffset);
        let newDy = dx * sin(angleOffset) + dy * cos(angleOffset);
        let newDistance = sqrt(newDx * newDx + newDy * newDy);
        
        if (newDistance > 0) {
            let testX = alien.x + (newDx / newDistance) * avoidanceSpeed;
            let testY = alien.y + (newDy / newDistance) * avoidanceSpeed;
            
            if (canMoveTo(testX, testY, alienRadius)) {
                alien.x = testX;
                alien.y = testY;
                alien.lastPosition = {x: alien.x, y: alien.y};
            }
        }
    }
}

function canMoveTo(x, y, radius) {
    // Check multiple points around the alien's intended position
    let checkPoints = [
        {x: x, y: y}, // center
        {x: x - radius, y: y - radius}, // top-left
        {x: x + radius, y: y - radius}, // top-right
        {x: x - radius, y: y + radius}, // bottom-left
        {x: x + radius, y: y + radius}, // bottom-right
        {x: x - radius, y: y}, // left
        {x: x + radius, y: y}, // right
        {x: x, y: y - radius}, // top
        {x: x, y: y + radius}  // bottom
    ];
    
    for (let point of checkPoints) {
        if (checkObstacleCollision(point.x, point.y)) {
            return false;
        }
    }
    
    return true;
}

function findValidTarget() {
    let attempts = 0;
    let target = { x: random(width), y: random(height) };
    
    // Try up to 50 times to find a valid target
    while (attempts < 70) {
        target = { 
            x: random(cellSize, width - cellSize), 
            y: random(cellSize, height - cellSize) 
        };
        
        // Check a small area around the target, not just the exact point
        let validTarget = true;
        for (let offsetX = -10; offsetX <= 10; offsetX += 5) {
            for (let offsetY = -10; offsetY <= 10; offsetY += 5) {
                if (checkObstacleCollision(target.x + offsetX, target.y + offsetY)) {
                    validTarget = false;
                    break;
                }
            }
            if (!validTarget) break;
        }
        
        if (validTarget) {
            break;
        }
        
        attempts++;
    }
    
    return target;
}

function spawnAlien() {
    let gene = random(alienGenes);
    let alien = {
        x: 0,
        y: 0,
        health: gene.health,
        maxHealth: gene.health,
        speed: gene.speed,
        target: findValidTarget(),
        captureRadius: 30,
        stuckCounter: 0,
        lastPosition: {x: 0, y: 0}
    };
    
    // Set spawn position based on gene, avoiding rocks
    let spawnAttempts = 0;
    let validSpawn = false;
    
    while (!validSpawn && spawnAttempts < 50) {
        switch(gene.spawnSide) {
            case 0: // top
                alien.x = random(20, width - 20);
                alien.y = 20;
                break;
            case 1: // right
                alien.x = width - 20;
                alien.y = random(20, height - 20);
                break;
            case 2: // bottom
                alien.x = random(20, width - 20);
                alien.y = height - 20;
                break;
            case 3: // left
                alien.x = 20;
                alien.y = random(20, height - 20);
                break;
        }
        
        // Check if spawn position is clear (including area around alien)
        validSpawn = true;
        for (let offsetX = -10; offsetX <= 10; offsetX += 5) {
            for (let offsetY = -10; offsetY <= 10; offsetY += 5) {
                if (checkObstacleCollision(alien.x + offsetX, alien.y + offsetY)) {
                    validSpawn = false;
                    break;
                }
            }
            if (!validSpawn) break;
        }
        
        spawnAttempts++;
    }
    
    // If we couldn't find a valid spawn position, try center of map
    if (!validSpawn) {
        alien.x = width / 2;
        alien.y = height / 2;
    }
    
    alien.lastPosition = {x: alien.x, y: alien.y};
    aliens.push(alien);
}

function updateTurret(turret) {
    // Check if turret is on alien territory
    let gridX = floor(turret.x / cellSize);
    let gridY = floor(turret.y / cellSize);
    if (gridX >= 0 && gridX < mapCols && gridY >= 0 && gridY < mapRows) {
        if (territory[gridX][gridY] === 'alien') {
            // Turret explodes - remove it from the array
            let index = turrets.indexOf(turret);
            if (index > -1) {
                turrets.splice(index, 1);
            }
            return; // Exit early since turret is destroyed
        }
    }
    
    // Find nearest alien
    let nearest = null;
    let minDist = turret.range;
    
    for (let alien of aliens) {
        let dist = sqrt((alien.x - turret.x) ** 2 + (alien.y - turret.y) ** 2);
        if (dist < minDist) {
            nearest = alien;
            minDist = dist;
        }
    }
    
    // Shoot at nearest alien
    if (nearest && frameCount % turret.fireRate === 0) {
        projectiles.push({
            x: turret.x,
            y: turret.y,
            target: nearest,
            speed: 5,
            damage: turret.damage,
            life: 100
        });
    }
}

function updateProjectile(projectile) {
    if (projectile.target && projectile.target.health > 0) {
        let dx = projectile.target.x - projectile.x;
        let dy = projectile.target.y - projectile.y;
        let dist = sqrt(dx * dx + dy * dy);
        
        if (dist < 10) {
            // Hit target
            projectile.target.health -= projectile.damage;
            projectile.life = 0;
        } else {
            // Move toward target
            projectile.x += (dx / dist) * projectile.speed;
            projectile.y += (dy / dist) * projectile.speed;
        }
    }
    
    projectile.life--;
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

function checkGameOver() {
    if (capturedPercent > 60) {
        gameState.state = 'gameOver';
        evolveAliens();
    }
}

function trackAlienPerformance(alien) {
    // Track when alien dies and calculate survival time
    if (!alien.spawnTime) {
        alien.spawnTime = frameCount;
    }
    
    if (alien.health <= 0) {
        alien.survivalTime = frameCount - alien.spawnTime;
        // Store performance data for genetic algorithm
        if (!alien.geneIndex && alien.geneIndex !== 0) {
            // Find which gene this alien came from
            for (let i = 0; i < alienGenes.length; i++) {
                if (alienGenes[i].health === alien.maxHealth && 
                    alienGenes[i].speed === alien.speed) {
                    alien.geneIndex = i;
                    break;
                }
            }
        }
        
        if (alien.geneIndex !== undefined) {
            if (!alienGenes[alien.geneIndex].totalSurvivalTime) {
                alienGenes[alien.geneIndex].totalSurvivalTime = 0;
                alienGenes[alien.geneIndex].spawnCount = 0;
            }
            alienGenes[alien.geneIndex].totalSurvivalTime += alien.survivalTime;
            alienGenes[alien.geneIndex].spawnCount++;
        }
    }
}

function evolveAliens() {
    // Simple genetic algorithm
    let newGenes = [];
    
    // Keep best performers
    alienGenes.sort((a, b) => b.health - a.health);
    for (let i = 0; i < populationSize / 2; i++) {
        newGenes.push(alienGenes[i]);
    }
    
    // Create offspring with mutations
    while (newGenes.length < populationSize) {
        let parent1 = random(newGenes);
        let parent2 = random(newGenes);
        
        let child = {
            health: lerp(parent1.health, parent2.health, 0.5),
            speed: lerp(parent1.speed, parent2.speed, 0.5),
            spawnSide: random() < 0.5 ? parent1.spawnSide : parent2.spawnSide
        };
        
        // Mutation
        if (random() < mutationRate) {
            child.health += random(-20, 20);
            child.speed += random(-0.5, 0.5);
            child.spawnSide = floor(random(4));
        }
        
        newGenes.push(child);
    }
    
    alienGenes = newGenes;
}

function drawGame() {
    // Draw terrain using WFC results
    if (window.terrainGrid) {
        let tileColors = {
            'ground': [34, 139, 34],   // Forest green
            'rock': [105, 105, 105]    // Gray
        };
        
        for (let i = 0; i < mapCols; i++) {
            for (let j = 0; j < mapRows; j++) {
                let tileType = window.terrainGrid[i][j];
                let color = tileColors[tileType] || [34, 139, 34];
                fill(color[0], color[1], color[2]);
                noStroke();
                rect(i * cellSize, j * cellSize, cellSize, cellSize);
            }
        }
    }
    
    // Draw territory overlay
    for (let i = 0; i < mapCols; i++) {
        for (let j = 0; j < mapRows; j++) {
            if (territory[i][j] === 'alien') {
                fill(255, 0, 0, 100);
                rect(i * cellSize, j * cellSize, cellSize, cellSize);
            } else if (territory[i][j] === 'player') {
                fill(0, 255, 0, 100);
                rect(i * cellSize, j * cellSize, cellSize, cellSize);
            }
        }
    }
    
    // Draw aliens with movement lines
    for (let alien of aliens) {
        // Draw line to target (for debugging pathfinding)
        stroke(255, 255, 0, 100);
        strokeWeight(1);
        line(alien.x, alien.y, alien.target.x, alien.target.y);
        
        // Draw alien
        fill(255, 0, 0);
        noStroke();
        ellipse(alien.x, alien.y, 15, 15);
        
        // Health bar
        fill(255);
        rect(alien.x - 10, alien.y - 20, 20, 3);
        fill(0, 255, 0);
        rect(alien.x - 10, alien.y - 20, 20 * (alien.health / alien.maxHealth), 3);
    }
    
    // Draw turrets
    fill(0, 0, 255);
    noStroke();
    for (let turret of turrets) {
        rect(turret.x - 10, turret.y - 10, 20, 20);
    }
    
    // Draw projectiles
    fill(255, 255, 0);
    for (let projectile of projectiles) {
        ellipse(projectile.x, projectile.y, 5, 5);
    }
    
    // Draw UI - FIXED: Use gameState.wave instead of currentWave
    fill(255);
    textSize(16);
    text(`Territory Captured: ${capturedPercent.toFixed(1)}%`, 10, 20);
    text(`Aliens: ${aliens.length}`, 10, 40);
    text(`Turrets: ${turrets.length}`, 10, 60);
    text(`Wave: ${gameState.wave}`, 150, 60); // FIXED: Use gameState.wave
    
    // Show wave status
    if (!gameState.waveActive) {
        text(`Press SPACE to start wave ${gameState.wave}`, 10, 80);
    } else {
        text(`Aliens to spawn: ${aliensToSpawn}`, 10, 80);
        text(`Spawn timer: ${spawnTimer}/${spawnDelay}`, 10, 100);
    }
}

function drawGameOver() {
    fill(255, 0, 0, 150);
    rect(0, 0, width, height);
    
    fill(255);
    textAlign(CENTER);
    textSize(32);
    text("GAME OVER", width/2, height/2);
    text("Aliens captured the territory!", width/2, height/2 + 40);
    text("Press R to restart", width/2, height/2 + 80);
    textAlign(LEFT);
}

function drawGameWin() {
    fill(34, 209, 31, 150);
    rect(0, 0, width, height);
    
    fill(255);
    textAlign(CENTER);
    textSize(32);
    text("Humans win!", width/2, height/2);
    text("Player has fended off the Alien Attacks!", width/2, height/2 + 40);
    text("Press R to restart", width/2, height/2 + 80);
    textAlign(LEFT);
}

function mousePressed() {
    if (gameState.state === 'playing') {
        // Place turret
        let validPlacement = true;
        
        // Check if position is clear
        for (let obstacle of obstacles) {
            if (mouseX >= obstacle.x && mouseX <= obstacle.x + cellSize &&
                    mouseY >= obstacle.y && mouseY <= obstacle.y + cellSize) {
                validPlacement = false;
                break;
            }
        }
        
        if (validPlacement) {
            turrets.push({
                x: mouseX,
                y: mouseY,
                range: 100,
                damage: 25,
                fireRate: 20
            });
        }
    }
}

function keyPressed() {
    if (key === ' ') {
        startWave();
    } else if (key === 'r' || key === 'R') {
        // Restart game
        gameState.state = 'playing';
        gameState.wave = 1;
        gameState.waveActive = false;
        aliens = [];
        turrets = [];
        projectiles = [];
        capturedPercent = 0;
        aliensToSpawn = 0;
        spawnTimer = 0;
        initializeTerritory();
        generateMap();
    }
}

