// Game variables
let gameState = {
    state: 'playing',
    wave: 1,
    waveActive: false,
    energy: 100,
    money: 200,
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




// Turret selection variables
let selectedTurretType = 'combat'; // 'combat' or 'money'

// Turret costs
let combatTurretCost = 70;
let moneyTurretCost = 100;

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
    } else if (gameState.state === 'gameWin') {
        drawGameWin();
    } else {
        drawGameOver();
    }
}



function updateGame() {
    // Handle alien spawning
    handleSpawning();
    
    // Update aliens
    for (let i = aliens.length - 1; i >= 0; i--) {
        updateAlien(aliens[i]);

        trackAlienPerformance(aliens[i]);
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


// Replace the updateTurret function with this version:
function updateTurret(turret) {
    // Check if turret should explode based on surrounding alien territory
    let gridX = floor(turret.x / cellSize);
    let gridY = floor(turret.y / cellSize);
    
    if (gridX >= 0 && gridX < mapCols && gridY >= 0 && gridY < mapRows) {
        // Check the 3x3 grid around the turret (9 tiles total)
        let alienTileCount = 0;
        let totalTilesChecked = 0;
        
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                let checkX = gridX + dx;
                let checkY = gridY + dy;
                
                // Make sure we're within bounds
                if (checkX >= 0 && checkX < mapCols && checkY >= 0 && checkY < mapRows) {
                    totalTilesChecked++;
                    if (territory[checkX][checkY] === 'alien') {
                        alienTileCount++;
                    }
                }
            }
        }
        
        // Calculate percentage of alien tiles
        let alienPercentage = alienTileCount / totalTilesChecked;
        
        // If 40% or more of surrounding tiles are alien, destroy the turret
        if (alienPercentage >= 0.3) {
            let index = turrets.indexOf(turret);
            if (index > -1) {
                turrets.splice(index, 1);
                console.log(`${turret.type} turret destroyed! ${alienTileCount}/${totalTilesChecked} surrounding tiles were alien (${(alienPercentage * 100).toFixed(1)}%)`);
            }
            return; // Exit early since turret is destroyed
        }
    }
    
    // Normal turret behavior if not destroyed
    if (turret.type === 'combat') {
        // Combat turret behavior
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
    } else if (turret.type === 'money') {
        // Money turret behavior
        if (frameCount - turret.lastMoneyTime >= turret.moneyInterval) {
            gameState.money += turret.moneyGeneration;
            turret.lastMoneyTime = frameCount;
            console.log(`Money turret generated $${turret.moneyGeneration}! Total: $${gameState.money}`);
        }
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



function checkGameOver() {
    if (capturedPercent > 60) {
        gameState.state = 'gameOver';
        evolveAliens();
    }
    if (gameState.money < moneyTurretCost && turrets.filter(t => t.type === 'money').length === 0) {
        gameState.state = 'gameOver2';
        evolveAliens();
    }
    if (gameState.wave === 25 && aliens.length === 0) { 
        gameState.state = 'gameWin';
    }
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
    
    // Draw turrets with different visuals for each type
    noStroke();
    for (let turret of turrets) {
        if (turret.type === 'combat') {
            fill(0, 0, 255); // Blue for combat turrets
            rect(turret.x - 10, turret.y - 10, 20, 20);
            
            // Draw range circle when selected
            if (selectedTurretType === 'combat') {
                stroke(0, 0, 255, 100);
                strokeWeight(1);
                noFill();
                ellipse(turret.x, turret.y, turret.range * 2);
                noStroke();
            }
        } else if (turret.type === 'money') {
            fill(255, 215, 0); // Gold for money turrets
            rect(turret.x - 10, turret.y - 10, 20, 20);
            
            // Draw dollar sign
            fill(0);
            textAlign(CENTER);
            textSize(12);
            text('$', turret.x, turret.y + 4);
            textAlign(LEFT);
            
            // Draw progress bar for money generation
            let progress = (frameCount - turret.lastMoneyTime) / turret.moneyInterval;
            fill(0, 255, 0, 150);
            rect(turret.x - 10, turret.y + 12, 20 * progress, 3);
        }
    }
    
    // Draw projectiles
    fill(255, 255, 0);
    for (let projectile of projectiles) {
        ellipse(projectile.x, projectile.y, 5, 5);
    }
    
    // Draw UI
    fill(255);
    textSize(16);
    text(`Territory Captured: ${capturedPercent.toFixed(1)}%`, 10, 20);
    text(`Aliens: ${aliens.length}`, 10, 40);
    text(`Turrets: ${turrets.length}`, 10, 60);
    text(`Wave: ${gameState.wave}`, 150, 60);
    text('Money: $' + gameState.money, 150, 40);
    
    // Turret selection buttons
    textSize(14);
    
    // Combat turret button
    if (selectedTurretType === 'combat') {
        fill(0, 0, 255, 150); // Highlighted
    } else {
        fill(100, 100, 100, 150);
    }
    rect(10, 120, 110, 30);
    fill(255);
    text(`Combat ($${combatTurretCost})`, 15, 140);
    
    // Money turret button
    if (selectedTurretType === 'money') {
        fill(255, 215, 0, 150); // Highlighted
    } else {
        fill(100, 100, 100, 150);
    }
    rect(130, 120, 110, 30);
    fill(255);
    text(`Money ($${moneyTurretCost})`, 135, 140);
    
    // Show turret info
    textSize(12);
    if (selectedTurretType === 'combat') {
        text('Combat: Shoots aliens', 10, 165);
        text('Range: 100, Damage: 25', 10, 180);
    } else {
        text('Money: Generates $50 every 5s', 10, 165);
        text('Can be destroyed by aliens', 10, 180);
    }
    
    // Show wave status
    textSize(16);
    if (!gameState.waveActive) {
        text(`Press SPACE to start wave ${gameState.wave}`, 10, 210);
    } else {
        text(`Aliens to spawn: ${aliensToSpawn}`, 10, 210);
        text(`Spawn timer: ${spawnTimer}/${spawnDelay}`, 10, 230);
    }
}

function drawGameOver() {
    
    fill(255, 0, 0, 150);
    rect(0, 0, width, height);
    
    fill(255);
    textAlign(CENTER);
    textSize(32);
    text("GAME OVER", width/2, height/2);
    if (gameState.state === 'gameOver2') {
        text("Humans have run out of money!", width/2, height/2 + 40);
    } else {
        text("Humans have lost control of Earth!", width/2, height/2 + 40);
    }
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
    // turret selection buttons
    if (mouseX >= 10 && mouseX <= 120 && mouseY >= 120 && mouseY <= 150) {
        selectedTurretType = 'combat';
        return;
    } else if (mouseX >= 130 && mouseX <= 240 && mouseY >= 120 && mouseY <= 150) {
        return;
    }
    
    // placiing turrets
    if (gameState.state === 'playing') {
        let turretCost = selectedTurretType === 'combat' ? combatTurretCost : moneyTurretCost;
        
        if (gameState.money >= turretCost) {
        
            let validPlacement = true;
            
            // cehck obstacles
            for (let obstacle of obstacles) {
                if (mouseX >= obstacle.x && mouseX <= obstacle.x + cellSize &&
                    mouseY >= obstacle.y && mouseY <= obstacle.y + cellSize) {
                    validPlacement = false;
                    break;
                }
            }
            
            // check existing turrets
            for (let turret of turrets) {
                let dist = sqrt((mouseX - turret.x)**2 + (mouseY - turret.y)**2);
                if (dist < 30) { 
                    validPlacement = false;
                    break;
                }
            }
            
            if (validPlacement) {
                gameState.money -= turretCost;
                
                if (selectedTurretType === 'combat') {
                    turrets.push({
                        x: mouseX,
                        y: mouseY,
                        type: 'combat',
                        range: 100,
                        damage: 25,
                        fireRate: 20
                    });
                    combatTurretCost += 20
                } else {
                    turrets.push({
                        x: mouseX,
                        y: mouseY,
                        type: 'money',
                        moneyGeneration: 50,
                        lastMoneyTime: frameCount,
                        moneyInterval: 300 
                    });
                    moneyTurretCost += 50;
                }
                
                console.log(`Placed ${selectedTurretType} turret for $${turretCost}`);
            } else {
                console.log("Cannot place turret here - invalid location");
            }
        } else {
            console.log(`Not enough money for ${selectedTurretType} turret ($${turretCost})`);
        }
    }
}

function keyPressed() {
    if (key === ' ') {
        startWave();
    } else if (key === 'r' || key === 'R') {
        gameState.state = 'playing';
        gameState.wave = 1;
        gameState.waveActive = false;
        gameState.money = 200; 
        aliens = [];
        turrets = [];
        projectiles = [];
        capturedPercent = 0;
        aliensToSpawn = 0;
        spawnTimer = 0;
        selectedTurretType = 'combat'; 
        initializeTerritory();
        generateMap();
    } else if (key === '1') {
        selectedTurretType = 'combat';
    } else if (key === '2') {
        selectedTurretType = 'money';
    }
}

