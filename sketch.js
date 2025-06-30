// Game variables
let gameState = {
    state: 'intro',
    wave: 1,
    waveActive: false,
    money: 200,
};

let territory = [];
let aliens = [];
let turrets = [];
let projectiles = [];
let alienGenes = [];
let capturedPercent = 0;
let explosions = [];

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
   
    
    // Reinitialize territory with new dimensions
    territory = [];
    initializeTerritory();
    generateMap();
    initializeAlienGenes(20);
}

function draw() {
    background(50);
    if (gameState.state === 'intro') {
        drawIntro()
    }
    else if (gameState.state === 'playing') {
        updateGame();
        drawGame();
        checkGameOver();
    } else if (gameState.state === 'gameWin') {
        drawGameWin();
    } else {
        drawGameOver();
    }
}

function drawIntro() {
    // Create animated background
    background(20, 20, 40);
    
    // Draw moving stars
    fill(255, 255, 255, 150);
    for (let i = 0; i < 50; i++) {
        let x = (frameCount * 0.5 + i * 123) % width;
        let y = (i * 234) % height;
        ellipse(x, y, 2, 2);
    }
    
    // Draw larger moving stars
    fill(255, 255, 255, 100);
    for (let i = 0; i < 20; i++) {
        let x = (frameCount * 0.2 + i * 456) % width;
        let y = (i * 789) % height;
        ellipse(x, y, 3, 3);
    }
    
    // Title with glow effect
    textAlign(CENTER);
    
    // Glow effect
    fill(255, 0, 0, 50);
    textSize(52);
    text("ALIEN INVASION", width/2 + 2, height/2 - 180 + 2);
    fill(255, 0, 0, 50);
    text("ALIEN INVASION", width/2 - 2, height/2 - 180 - 2);
    
    // Main title
    fill(255, 50, 50);
    textSize(50);
    text("ALIEN INVASION", width/2, height/2 - 180);
    
    // Subtitle with animation
    let pulseAlpha = 150 + sin(frameCount * 0.1) * 105;
    fill(255, 255, 100, pulseAlpha);
    textSize(24);
    text("Defend Earth from the Evolving Threat", width/2, height/2 - 140);
    
    // Game description
    fill(200, 200, 255);
    textSize(16);
    text("In the year 2157, Earth detects a massive alien presence—Xenomorphs—emerging ", width/2, height/2 - 100);
    text("from the void between galaxies. These adaptive beings evolve with every battle,", width/2, height/2 - 80);
    text("growing stronger through surviving units. As humanity’s last line of defense,", width/2, height/2 - 60);
    text("you must fortify invasion routes before their deadlier return", width/2, height/2 - 40);
    text("The fate of mankind depends on your strategy.", width/2, height/2 - 20);
    // Instructions box
    fill(0, 0, 0, 100);
    rect(width/2 - 200, height/2 + 20, 400, 160, 10);
    
    fill(255, 255, 255);
    textSize(18);
    text("HOW TO PLAY:", width/2, height/2 + 45);
    
    textSize(14);
    textAlign(LEFT);
    text("• Press SPACE to start each wave", width/2 - 180, height/2 + 70);
    text("• Click to place turrets (Combat or Money)", width/2 - 180, height/2 + 90);
    text("• Combat turrets shoot aliens", width/2 - 180, height/2 + 110);
    text("• Money turrets generate income", width/2 - 180, height/2 + 130);
    text("• Don't let aliens capture 50% of the world!", width/2 - 180, height/2 + 150);
    text("• Survive 25 waves to secure our future!", width/2 - 180, height/2 + 170);
    
    // Start button with animation
    textAlign(CENTER);
    let buttonPulse = 1 + sin(frameCount * 0.15) * 0.1;
    
    // Button background
    fill(0, 150, 0, 200);
    rect(width/2 - 130 * buttonPulse, height/2 + 200, 260 * buttonPulse, 50 * buttonPulse, 10);
    
    // Button border
    stroke(0, 255, 0);
    strokeWeight(2);
    noFill();
    rect(width/2 - 130 * buttonPulse, height/2 + 200, 260 * buttonPulse, 50 * buttonPulse, 10);
    noStroke();
    
    // Button text
    fill(255, 255, 255);
    textSize(20 * buttonPulse);
    text("PRESS ENTER TO START", width/2, height/2 + 230);
    
    // Credits
    fill(150, 150, 150);
    textSize(12);
    text("Features: Wave Function Collapse • Genetic Algorithm • Line of Sight", width/2, height - 40);
    text("Press 'R' anytime to restart", width/2, height - 20);
    
    // Add some alien silhouettes floating around
    fill(255, 0, 0, 100);
    for (let i = 0; i < 5; i++) {
        let alienX = width/4 - 50 + sin(frameCount * 0.02 + i) * 100;
        let alienY = 125 + i * 80 + cos(frameCount * 0.03 + i) * 30;
        ellipse(alienX, alienY, 15, 15);
        
        alienX = 3 * width/4 + 50 + sin(frameCount * 0.025 + i + PI) * 80;
        alienY = 145 + i * 70 + cos(frameCount * 0.035 + i + PI) * 40;
        ellipse(alienX, alienY, 12, 12);
    }
    
    textAlign(LEFT); // Reset text alignment
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
    
    // Update explosions
    for (let i = explosions.length - 1; i >= 0; i--) {
        let explosion = explosions[i];
        
        // Expand the explosion radius
        explosion.radius = (explosion.maxRadius * (explosion.maxLife - explosion.life)) / explosion.maxLife;
        explosion.life--;
        
        // Remove explosion when it's finished
        if (explosion.life <= 0) {
            explosions.splice(i, 1);
        }
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
    if (capturedPercent > 50) {
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
    spawnDelay -= 3
    2
    // Clear aliens array
    aliens = [];
    
    // Evolve aliens
    evolveAliens();
    
    console.log(`✅ Wave ${gameState.wave - 1} completed`);
    console.log(`📊 Ready for wave ${gameState.wave}. Press Space to start.`);
}

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
        
        // If 30% or more of surrounding tiles are alien, destroy the turret
        if (alienPercentage >= 0.3) {
            let index = turrets.indexOf(turret);
            if (index > -1) {
                // Create explosion effect before removing turret
                explosions.push({
                    x: turret.x,
                    y: turret.y,
                    radius: 0,
                    maxRadius: 60,
                    life: 60, // frames to live
                    maxLife: 60
                });
                
                turrets.splice(index, 1);
                
                console.log(`${turret.type} turret destroyed! ${alienTileCount}/${totalTilesChecked} surrounding tiles were alien (${(alienPercentage * 100).toFixed(1)}%)`);
            }
            return; // Exit early since turret is destroyed
        }
    }
    
    // Normal turret behavior if not destroyed
    if (turret.type === 'combat') {
        // Combat turret behavior with line-of-sight checking
        let nearest = null;
        let minDist = turret.range;
        
        for (let alien of aliens) {
            let dist = sqrt((alien.x - turret.x) ** 2 + (alien.y - turret.y) ** 2);
            
            // Check both distance and line of sight
            if (dist < minDist && hasLineOfSight(turret.x, turret.y, alien.x, alien.y)) {
                nearest = alien;
                minDist = dist;
            }
        }
        
        // Shoot at nearest alien (only if line of sight is clear)
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
        // Money turret behavior stays the same
        if (frameCount - turret.lastMoneyTime >= turret.moneyInterval && aliens.length > 1) {
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
            // Calculate next position
            let nextX = projectile.x + (dx / dist) * projectile.speed;
            let nextY = projectile.y + (dy / dist) * projectile.speed;
            
            // Check if next position would hit an obstacle
            if (checkObstacleCollision(nextX, nextY)) {
                // Projectile hits obstacle - destroy it
                projectile.life = 0;
                console.log("💥 Projectile hit obstacle!");
                
                // Optional: Create small explosion effect at impact
                explosions.push({
                    x: projectile.x,
                    y: projectile.y,
                    radius: 0,
                    maxRadius: 20, // Smaller explosion for projectile
                    life: 30,
                    maxLife: 30
                });
            } else {
                // Move toward target
                projectile.x = nextX;
                projectile.y = nextY;
            }
        }
    }
    
    projectile.life--;
}

function hasLineOfSight(startX, startY, endX, endY) {
    // Check if there's a clear path between two points
    let steps = max(abs(endX - startX), abs(endY - startY));
    let stepX = (endX - startX) / steps;
    let stepY = (endY - startY) / steps;
    
    for (let i = 0; i <= steps; i++) {
        let checkX = startX + stepX * i;
        let checkY = startY + stepY * i;
        
        if (checkObstacleCollision(checkX, checkY)) {
            return false; // Obstacle blocks the path
        }
    }
    
    return true; // Clear line of sight
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
    
    // Draw explosions
    for (let explosion of explosions) {
        let alpha = (explosion.life / explosion.maxLife) * 255; // Fade out over time
        
        // Outer orange circle
        fill(255, 165, 0, alpha * 0.6); // Orange with transparency
        noStroke();
        ellipse(explosion.x, explosion.y, explosion.radius * 2);
        
        // Inner bright yellow/white circle
        fill(255, 255, 100, alpha); // Bright yellow
        ellipse(explosion.x, explosion.y, explosion.radius * 1.2);
        
        // Core white flash
        fill(255, 255, 255, alpha * 0.8); // White core
        ellipse(explosion.x, explosion.y, explosion.radius * 0.6);
        
        // Optional: Add some sparkle effects
        fill(255, 200, 0, alpha);
        for (let i = 0; i < 8; i++) {
            let angle = (i / 8) * TWO_PI;
            let sparkleX = explosion.x + cos(angle) * explosion.radius * 0.8;
            let sparkleY = explosion.y + sin(angle) * explosion.radius * 0.8;
            ellipse(sparkleX, sparkleY, 4);
        }
    }
    
    // Draw projectiles
    fill(255, 255, 0);
    for (let projectile of projectiles) {
        // Draw projectile trail
        stroke(255, 255, 0, 100);
        strokeWeight(2);
        
        if (projectile.target) {
            // Draw line from projectile to target (but only partially for trail effect)
            let trailLength = 20;
            let dx = projectile.target.x - projectile.x;
            let dy = projectile.target.y - projectile.y;
            let dist = sqrt(dx * dx + dy * dy);
            
            if (dist > 0) {
                let trailX = projectile.x - (dx / dist) * trailLength;
                let trailY = projectile.y - (dy / dist) * trailLength;
                line(trailX, trailY, projectile.x, projectile.y);
            }
        }
        
        // Draw projectile
        fill(255, 255, 0);
        noStroke();
        ellipse(projectile.x, projectile.y, 6, 6);
        
        // Draw small glow effect
        fill(255, 255, 0, 100);
        ellipse(projectile.x, projectile.y, 12, 12);
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
    // Dark, ominous background with gradient effect
    for (let i = 0; i < height; i++) {
        let inter = map(i, 0, height, 0, 1);
        let c = lerpColor(color(20, 0, 0), color(80, 20, 20), inter);
        stroke(c);
        line(0, i, width, i);
    }
    
    // Add some dark alien ships silhouettes in the sky
    fill(0, 0, 0, 150);
    for (let i = 0; i < 8; i++) {
        let shipX = width * 0.2 + i * (width * 0.1) + sin(frameCount * 0.01 + i) * 20;
        let shipY = 50 + i * 15 + cos(frameCount * 0.015 + i) * 10;
        
        // Draw alien ship silhouette
        ellipse(shipX, shipY, 40, 15);
        ellipse(shipX, shipY - 5, 25, 8);
        
        // Add some dim red lights
        fill(150, 0, 0, 100);
        ellipse(shipX - 8, shipY, 3, 3);
        ellipse(shipX + 8, shipY, 3, 3);
        fill(0, 0, 0, 150);
    }
    
    // Flickering emergency lighting effect
    let flicker = 200 + sin(frameCount * 0.3) * 55;
    fill(255, 0, 0, flicker * 0.3);
    rect(0, 0, width, height);
    
    // Main "GAME OVER" title with dramatic effect
    textAlign(CENTER);
    
    // Shadow/glow effect for title
    fill(0, 0, 0, 150);
    textSize(48);
    text("GAME OVER", width/2 + 3, height/2 - 180 + 3);
    
    // Main title with red glow
    fill(255, 50, 50);
    textSize(45);
    text("GAME OVER", width/2, height/2 - 180);
    
    // Subtitle based on failure type
    fill(255, 100, 100);
    textSize(18);
    if (gameState.state === 'gameOver2') {
        text("ECONOMIC COLLAPSE", width/2, height/2 - 140);
        text("Resources Depleted - Defense Systems Offline", width/2, height/2 - 120);
    } else {
        text("PLANETARY INVASION COMPLETE", width/2, height/2 - 140);
        text("Territory Lost - Earth Overrun", width/2, height/2 - 120);
    }
    
    // Main dramatic narrative text
    fill(220, 220, 220);
    textSize(16);
    textLeading(22); // Increase line spacing for better readability
    
    let narrativeText = "The base has been overrun. The Xenomorphs have breached\n" +
                       "Earth's final defensive line. As their ships darken the sky\n" +
                       "above, one truth becomes clear: they have learned everything\n" +
                       "they needed to know. Humanity's last transmission echoes\n" +
                       "into the void...";
    
    text(narrativeText, width/2, height/2 - 80);
    
    // Darwin quote in italics effect (using slightly different styling)
    fill(180, 180, 255);
    textSize(14);
    textLeading(18);
    
    let quoteText = '"It is not the strongest of the species that survives,\n' +
                   'nor the most intelligent that survives.\n' +
                   'It is the one that is the most adaptable to change"\n\n' +
                   '- Charles Darwin';
    
    text(quoteText, width/2, height/2 + 60);
    
    // Statistics box showing what went wrong
    fill(0, 0, 0, 120);
    rect(width/2 - 200, height/2 + 140, 400, 100, 8);
    
    fill(255, 150, 150);
    textSize(16);
    text("FINAL STATISTICS", width/2, height/2 + 160);
    
    fill(200, 200, 200);
    textSize(12);
    textAlign(LEFT);
    text(`Wave Reached: ${gameState.wave}`, width/2 - 180, height/2 + 180);
    text(`Territory Lost: ${capturedPercent.toFixed(1)}%`, width/2 - 180, height/2 + 195);
    text(`Turrets Deployed: ${turrets.length}`, width/2 - 180, height/2 + 210);
    text(`Final Resources: $${gameState.money}`, width/2 - 180, height/2 + 225);
    
    textAlign(RIGHT);
    text(`Aliens Eliminated: ${Math.max(0, (gameState.wave - 1) * 8)}`, width/2 + 180, height/2 + 180);
    text(`Defense Duration: ${Math.floor(frameCount / 60)}s`, width/2 + 180, height/2 + 195);
    text(`Evolution Cycles: ${gameState.wave - 1}`, width/2 + 180, height/2 + 210);
    text(`Survival Rating: FAILED`, width/2 + 180, height/2 + 225);
    
    // Restart instructions with pulsing effect
    textAlign(CENTER);
    let pulseAlpha = 150 + sin(frameCount * 0.1) * 105;
    fill(255, 255, 255, pulseAlpha);
    textSize(18);
    text("Press R to attempt defense again", width/2, height/2 + 270);
    
    fill(150, 150, 150);
    textSize(12);
    text("Press ENTER to return to briefing", width/2, height/2 + 295);
    
    // Add some floating ash/debris particles
    fill(100, 100, 100, 150);
    for (let i = 0; i < 20; i++) {
        let ashX = (frameCount * 0.3 + i * 67) % width;
        let ashY = (frameCount * 0.5 + i * 123) % height;
        ellipse(ashX, ashY, 2, 2);
    }
    
    fill(80, 80, 80, 100);
    for (let i = 0; i < 15; i++) {
        let ashX = (frameCount * 0.2 + i * 234) % width;
        let ashY = (frameCount * 0.4 + i * 345) % height;
        ellipse(ashX, ashY, 3, 3);
    }
    
    textAlign(LEFT); // Reset alignment
}

function drawGameWin() {
    // Purple-blue gradient background matching the CSS gradient
    for (let i = 0; i < height; i++) {
        let inter = map(i, 0, height, 0, 1);
        // Converting the CSS gradient: rgba(166,64,221,1) to rgba(102,165,235,1)
        let c = lerpColor(color(166, 64, 221), color(102, 165, 235), inter);
        stroke(c);
        line(0, i, width, i);
    }
    
    // Add celebratory fireworks effect
    fill(255, 255, 255, 200);
    for (let i = 0; i < 12; i++) {
        let fireworkX = (frameCount * 0.02 + i * 234) % width;
        let fireworkY = 50 + (i * 123) % (height * 0.4);
        
        // Firework burst
        for (let j = 0; j < 8; j++) {
            let angle = (j / 8) * TWO_PI + frameCount * 0.1;
            let burstRadius = 20 + sin(frameCount * 0.15 + i) * 15;
            let sparkX = fireworkX + cos(angle) * burstRadius;
            let sparkY = fireworkY + sin(angle) * burstRadius;
            
            fill(255, 215 + sin(frameCount * 0.1 + j) * 40, 0, 180);
            ellipse(sparkX, sparkY, 4, 4);
        }
    }
    
    // Add triumphant human ships in formation
    fill(0, 100, 255, 200);
    for (let i = 0; i < 6; i++) {
        let shipX = width * 0.15 + i * (width * 0.12) + sin(frameCount * 0.008 + i) * 10;
        let shipY = 80 + i * 8 + cos(frameCount * 0.01 + i) * 5;
        
        // Draw human ship silhouette (more angular/military)
        rect(shipX - 15, shipY, 30, 8);
        triangle(shipX - 20, shipY + 4, shipX - 15, shipY, shipX - 15, shipY + 8);
        triangle(shipX + 15, shipY, shipX + 20, shipY + 4, shipX + 15, shipY + 8);
        
        // Add blue engine glow
        fill(100, 200, 255, 150);
        ellipse(shipX - 18, shipY + 2, 4, 2);
        ellipse(shipX - 18, shipY + 6, 4, 2);
        fill(0, 100, 255, 200);
    }
    
    // Triumphant lighting effect
    let triumph = 100 + sin(frameCount * 0.08) * 50;
    fill(255, 255, 255, triumph * 0.1);
    rect(0, 0, width, height);
    
    // Main "VICTORY!" title with white outline and dramatic effect
    textAlign(CENTER);
    
    // White outline for title
    stroke(255, 255, 255);
    strokeWeight(4);
    fill(255, 215, 0);
    textSize(50);
    text("VICTORY!", width/2, height/2 - 180);
    
    // Remove stroke for clean fill
    noStroke();
    fill(255, 223, 0);
    text("VICTORY!", width/2, height/2 - 180);
    
    // Secondary title with white outline
    stroke(255, 255, 255);
    strokeWeight(2);
    fill(255, 255, 255);
    textSize(24);
    text("EARTH DEFENDED SUCCESSFULLY", width/2, height/2 - 140);
    noStroke();
    
    // Subtitle with pulsing effect and white outline
    let pulseAlpha = 200 + sin(frameCount * 0.12) * 55;
    stroke(255, 255, 255);
    strokeWeight(2);
    fill(100, 255, 100, pulseAlpha);
    textSize(18);
    text("The Xenomorph Threat Has Been Neutralized", width/2, height/2 - 110);
    noStroke();
    
    // Main victory narrative text with white outline
    stroke(0, 0, 0);
    strokeWeight(1);
    fill(230, 230, 255);
    textSize(16);
    textLeading(22);
    
    let victoryText = "Against all odds, humanity has prevailed. The alien\n" +
                     "invasion fleet retreats into the void, their evolutionary\n" +
                     "advantage overcome by human ingenuity and determination.\n" +
                     "Earth's defenses held strong through 25 waves of\n" +
                     "relentless assault. The future is secure.";
    
    text(victoryText, width/2, height/2 - 70);
    noStroke();
    
    // Inspirational quote with white outline
    stroke(0, 0, 0);
    strokeWeight(1);
    fill(200, 200, 255);
    textSize(14);
    textLeading(18);
    
    let inspirationText = '"The ultimate measure of a man is not where he stands\n' +
                         'in moments of comfort and convenience, but where he\n' +
                         'stands at times of challenge and controversy"\n\n' +
                         '- Martin Luther King Jr.';
    
    text(inspirationText, width/2, height/2 + 40);
    noStroke();
    
    // Victory statistics box with updated colors
    fill(0, 0, 0, 100); // More transparent black
    rect(width/2 - 200, height/2 + 120, 400, 120, 8);
    
    // White border for stats box instead of golden
    stroke(0, 0, 0);
    strokeWeight(2);
    noFill();
    rect(width/2 - 200, height/2 + 120, 400, 120, 8);
    noStroke();
    
    // Stats title with white outline
    stroke(0, 0, 0);
    strokeWeight(2);
    fill(255, 215, 0);
    textSize(16);
    text("MISSION ACCOMPLISHED", width/2, height/2 + 145);
    noStroke();
    
    // Stats text with white outline
    stroke(0, 0, 0);
    strokeWeight(1);
    fill(255, 255, 255);
    textSize(12);
    textAlign(LEFT);
    text(`Waves Survived: ${gameState.wave - 1}/25`, width/2 - 180, height/2 + 165);
    text(`Territory Defended: ${(100 - capturedPercent).toFixed(1)}%`, width/2 - 180, height/2 + 180);
    text(`Turrets Deployed: ${turrets.length}`, width/2 - 180, height/2 + 195);
    text(`Resources Remaining: $${gameState.money}`, width/2 - 180, height/2 + 210);
    text(`Final Defense Rating: HEROIC`, width/2 - 180, height/2 + 225);
    
    textAlign(RIGHT);
    text(`Total Aliens Defeated: ${gameState.wave * 8}`, width/2 + 180, height/2 + 165);
    text(`Mission Duration: ${Math.floor(frameCount / 60)}s`, width/2 + 180, height/2 + 180);
    text(`Evolution Cycles Survived: ${gameState.wave - 1}`, width/2 + 180, height/2 + 195);
    text(`Humanity Status: VICTORIOUS`, width/2 + 180, height/2 + 210);
    text(`Earth Status: SECURED`, width/2 + 180, height/2 + 225);
    noStroke();
    
    // Restart instructions with white outline
    textAlign(CENTER);
    let goldPulse = 200 + sin(frameCount * 0.15) * 55;
    stroke(0, 0, 0);
    strokeWeight(2);
    fill(255, 215, 0, goldPulse);
    textSize(18);
    text("Press R to defend Earth again", width/2, height/2 + 270);
    
    strokeWeight(1);
    fill(0, 0, 0);
    textSize(12);
    text("Press ENTER to return to mission briefing", width/2, height/2 + 295);
    noStroke();
    
    // Add victory confetti effect with updated colors
    fill(255, 215, 0, 200);
    for (let i = 0; i < 30; i++) {
        let confettiX = (frameCount * 0.8 + i * 89) % width;
        let confettiY = (frameCount * 1.2 + i * 156) % height;
        rect(confettiX, confettiY, 4, 2);
    }
    
    fill(166, 64, 221, 200); // Purple confetti to match gradient
    for (let i = 0; i < 25; i++) {
        let confettiX = (frameCount * 0.6 + i * 134) % width;
        let confettiY = (frameCount * 1.0 + i * 178) % height;
        rect(confettiX, confettiY, 3, 3);
    }
    
    fill(102, 165, 235, 200); // Blue confetti to match gradient
    for (let i = 0; i < 20; i++) {
        let confettiX = (frameCount * 0.7 + i * 167) % width;
        let confettiY = (frameCount * 0.9 + i * 201) % height;
        ellipse(confettiX, confettiY, 3, 3);
    }
    
    textAlign(LEFT); // Reset alignment
}

function mousePressed() {
    // turret selection buttons
    if (gameState.state === 'intro') {
        // Check if clicked on start button area
        if (mouseX >= width/2 - 100 && mouseX <= width/2 + 100 && 
            mouseY >= height/2 + 200 && mouseY <= height/2 + 250) {
            gameState.state = 'playing';
            console.log("🎮 Game started!");
            return;
        }
    } 
     // placiing turrets
    if (gameState.state === 'playing') {
        if (mouseX >= 10 && mouseX <= 120 && mouseY >= 120 && mouseY <= 150) {
            selectedTurretType = 'combat';
            console.log("Selected Combat Turret");
            return;
        } else if (mouseX >= 130 && mouseX <= 240 && mouseY >= 120 && mouseY <= 150) {
            selectedTurretType = 'money';
            return;
        }
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
    if (gameState.state === 'intro') {
        if (keyCode === ENTER) {
            gameState.state = 'playing';
            console.log("🎮 Game started!");
        }
    } else if (gameState.state === 'playing') {
        if (key === ' ') {
            startWave();
        } else if (key === 'r' || key === 'R') {
            restartGame();
        } else if (key === '1') {
            selectedTurretType = 'combat';
        } else if (key === '2') {
            selectedTurretType = 'money';
        }
    } else if (gameState.state === 'gameOver' || gameState.state === 'gameOver2' || gameState.state === 'gameWin') {
        if (key === 'r' || key === 'R') {
            restartGame();
        } else if (keyCode === ENTER) {
            // Return to intro screen
            gameState.state = 'intro';
            gameState.wave = 1;
            gameState.waveActive = false;
            gameState.money = 200; 
            aliens = [];
            turrets = [];
            projectiles = [];
            explosions = [];
            capturedPercent = 0;
            aliensToSpawn = 0;
            spawnTimer = 0;
            selectedTurretType = 'combat'; 
            combatTurretCost = 70;
            moneyTurretCost = 100;
            console.log("🎬 Returned to intro");
        }
    }
}

// Create a separate restart function for cleaner code:
function restartGame() {
    gameState.state = 'playing';
    gameState.wave = 1;
    gameState.waveActive = false;
    gameState.money = 200; 
    aliens = [];
    turrets = [];
    projectiles = [];
    explosions = [];
    capturedPercent = 0;
    aliensToSpawn = 0;
    spawnTimer = 0;
    selectedTurretType = 'combat'; 
    combatTurretCost = 70;
    moneyTurretCost = 100;
    initializeTerritory();
    generateMap();
    console.log("🔄 Game restarted!");
}