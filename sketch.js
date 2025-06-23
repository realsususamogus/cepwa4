// Game variables
let gameState = 'playing'; // 'playing', 'gameOver'
let territory = [];
let aliens = [];
let turrets = [];
let projectiles = [];
let alienGenes = [];
let currentWave = 0;
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

// Add this function to handle window resizing:
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
    generateMapWFC();
    
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
    
    if (gameState === 'playing') {
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
    obstacles = [];
    // Simple wave function collapse for obstacle generation
    for (let i = 0; i < mapCols; i++) {
        for (let j = 0; j < mapRows; j++) {
            if (noise(i * 0.1, j * 0.1) > 0.7) {
                obstacles.push({x: i * cellSize, y: j * cellSize});
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
    // Spawn aliens based on genetic algorithm
    if (frameCount % 60 === 0) {
        spawnAlien();
    }
    
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
}
// Wave system variables
let waveActive = false;
let waveStartTime = 0;
let waveDuration = 30000; // 30 seconds per wave
let waveBreakDuration = 10000; // 10 seconds between waves
let aliensToSpawn = 0;
let aliensSpawned = 0;

function updateWaveSystem() {
    let currentTime = millis();
    
    if (!waveActive) {
        // Between waves
        if (currentTime - waveStartTime >= waveBreakDuration) {
            startNewWave();
        }
    } else {
        // During wave
        if (aliensSpawned < aliensToSpawn && frameCount % 60 === 0) {
            spawnAlien();
            aliensSpawned++;
        }
        
        // Check if wave is complete
        if (aliensSpawned >= aliensToSpawn && aliens.length === 0) {
            endWave();
        }
        
        // Force end wave after duration
        if (currentTime - waveStartTime >= waveDuration) {
            endWave();
        }
    }
}

function startNewWave() {
    currentWave++;
    waveActive = true;
    waveStartTime = millis();
    aliensToSpawn = 5 + (currentWave * 3); // Increase aliens per wave
    aliensSpawned = 0;
}

function endWave() {
    waveActive = false;
    waveStartTime = millis();
}
function spawnAlien() {
    let gene = random(alienGenes);
    let alien = {
        x: 0,
        y: 0,
        health: gene.health,
        maxHealth: gene.health,
        speed: gene.speed,
        target: {x: random(width), y: random(height)},
        captureRadius: 30
    };
    
    // Set spawn position based on gene
    switch(gene.spawnSide) {
        case 0: // top
            alien.x = random(width);
            alien.y = 0;
            break;
        case 1: // right
            alien.x = width;
            alien.y = random(height);
            break;
        case 2: // bottom
            alien.x = random(width);
            alien.y = height;
            break;
        case 3: // left
            alien.x = 0;
            alien.y = random(height);
            break;
    }
    
    aliens.push(alien);
}
function checkObstacleCollision(x, y) {
    for (let obstacle of obstacles) {
        if (x >= obstacle.x && x <= obstacle.x + cellSize &&
            y >= obstacle.y && y <= obstacle.y + cellSize) {
            return true;
        }
    }
    return false;
}
function updateAlien(alien) {
    // Move toward target
    let dx = alien.target.x - alien.x;
    let dy = alien.target.y - alien.y;
    let dist = sqrt(dx * dx + dy * dy);
    
    if (dist > 5) {
        alien.x += (dx / dist) * alien.speed;
        alien.y += (dy / dist) * alien.speed;
    } else {
        // Pick new target
        alien.target = {x: random(width), y: random(height)};
    }
    
    // Capture territory
    let gridX = floor(alien.x / cellSize);
    let gridY = floor(alien.y / cellSize);
    if (gridX >= 0 && gridX < mapCols && gridY >= 0 && gridY < mapRows) {
        territory[gridX][gridY] = 'alien';
    }
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
        gameState = 'gameOver';
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
    // Draw territory
    for (let i = 0; i < mapCols; i++) {
        for (let j = 0; j < mapRows; j++) {
            fill(territory[i][j] === 'alien' ? color(255, 0, 0, 100) : 
                     territory[i][j] === 'player' ? color(0, 255, 0, 100) : 
                     color(100, 100, 100, 50));
            rect(i * cellSize, j * cellSize, cellSize, cellSize);
        }
    }
    
    // Draw obstacles
    fill(80);
    for (let obstacle of obstacles) {
        rect(obstacle.x, obstacle.y, cellSize, cellSize);
    }
    
    // Draw aliens
    for (let alien of aliens) {
        fill(255, 0, 0);
        ellipse(alien.x, alien.y, 15, 15);
        // Health bar
        fill(255);
        rect(alien.x - 10, alien.y - 20, 20, 3);
        fill(0, 255, 0);
        rect(alien.x - 10, alien.y - 20, 20 * (alien.health / alien.maxHealth), 3);
    }
    
    // Draw turrets
    fill(0, 0, 255);
    for (let turret of turrets) {
        rect(turret.x - 10, turret.y - 10, 20, 20);
    }
    
    // Draw projectiles
    fill(255, 255, 0);
    for (let projectile of projectiles) {
        ellipse(projectile.x, projectile.y, 5, 5);
    }
    
    // Draw UI
    fill(255);
    text(`Territory Captured: ${capturedPercent.toFixed(1)}%`, 10, 20);
    text(`Aliens: ${aliens.length}`, 10, 40);
    text(`Turrets: ${turrets.length}`, 10, 60);
    text(`Wave: ${currentWave}`, 150, 60);
    
    if (!waveActive) {
        let timeLeft = Math.max(0, waveBreakDuration - (millis() - waveStartTime));
        text(`Next wave in: ${Math.ceil(timeLeft / 1000)}s`, 10, 80);
    } else {
        text(`Aliens remaining: ${aliensToSpawn - aliensSpawned}`, 10, 80);
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

function mousePressed() {
    if (gameState === 'playing') {
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
    if (key === 'r' || key === 'R') {
        // Restart game
        gameState = 'playing';
        aliens = [];
        turrets = [];
        projectiles = [];
        capturedPercent = 0;
        initializeTerritory();
        generateMap();
    }
}

