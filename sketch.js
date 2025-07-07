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

let mapWidth = 800;
let mapHeight = 600;
let cellSize = 20;
let mapCols, mapRows;
let obstacles = [];
const GRID_SIZE = 25;


let selectedTurretType = 'combat'; 


let combatTurretCost = 70;
let moneyTurretCost = 100;

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    
 
    mapWidth = width;
    mapHeight = height;
    mapCols = mapWidth / cellSize;
    mapRows = mapHeight / cellSize;
    
    

    gameState.basePosition = { x: width - 100, y: height / 2 };
    gameState.spawnPosition = { x: 100, y: height / 2 };
    
 
    initializeTerritory();
    generateMap();
    
    console.log(`Resized to ${width}x${height}`);
}

function setup() {
  
    createCanvas(windowWidth, windowHeight);
    mapWidth = width;
    mapHeight = height;
    mapCols = mapWidth / cellSize;
    mapRows = mapHeight / cellSize;
    COLS = Math.floor(width / GRID_SIZE);
    ROWS = Math.floor(height / GRID_SIZE);
    gameState.basePosition = { x: width - 100, y: height / 2 };
    gameState.spawnPosition = { x: 100, y: height / 2 };
    
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

function drawGame() {

    if (window.terrainGrid) {
        let tileColors = {
            'ground': [34, 139, 34],   
            'rock': [105, 105, 105] 
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
    
    // draw territory overlay
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
    
    // draw aliens with movement lines
    for (let alien of aliens) {
        //debugging stuff
        stroke(255, 255, 0, 100);
        strokeWeight(1);
        line(alien.x, alien.y, alien.target.x, alien.target.y);
        
        fill(255, 0, 0);
        noStroke();
        ellipse(alien.x, alien.y, 15, 15);

        fill(255);
        rect(alien.x - 10, alien.y - 20, 20, 3);
        fill(0, 255, 0);
        rect(alien.x - 10, alien.y - 20, 20 * (alien.health / alien.maxHealth), 3);
    }
    
    noStroke();
    for (let turret of turrets) {
        if (turret.type === 'combat') {
            fill(0, 0, 255); // blue for combat turrets
            rect(turret.x - 10, turret.y - 10, 20, 20);
            
            if (selectedTurretType === 'combat') {
                stroke(0, 0, 255, 100);
                strokeWeight(1);
                noFill();
                ellipse(turret.x, turret.y, turret.range * 2);
                noStroke();
            }
        } else if (turret.type === 'money') {
            fill(255, 215, 0); // gold for money turrets
            rect(turret.x - 10, turret.y - 10, 20, 20);
 
            fill(0);
            textAlign(CENTER);
            textSize(12);
            text('$', turret.x, turret.y + 4);
            textAlign(LEFT);
            
            let progress = (frameCount - turret.lastMoneyTime) / turret.moneyInterval;
            fill(0, 255, 0, 150);
            rect(turret.x - 10, turret.y + 12, 20 * progress, 3);
        }
    }

    for (let explosion of explosions) {
        let alpha = (explosion.life / explosion.maxLife) * 255;
        

        fill(255, 165, 0, alpha * 0.6);
        noStroke();
        ellipse(explosion.x, explosion.y, explosion.radius * 2);
        

        fill(255, 255, 100, alpha);
        ellipse(explosion.x, explosion.y, explosion.radius * 1.2);
        
 
        fill(255, 255, 255, alpha * 0.8); 
        ellipse(explosion.x, explosion.y, explosion.radius * 0.6);
        
        
        fill(255, 200, 0, alpha);
        for (let i = 0; i < 8; i++) {
            let angle = (i / 8) * TWO_PI;
            let sparkleX = explosion.x + cos(angle) * explosion.radius * 0.8;
            let sparkleY = explosion.y + sin(angle) * explosion.radius * 0.8;
            ellipse(sparkleX, sparkleY, 4);
        }
    }
    
   
    fill(255, 255, 0);
    for (let projectile of projectiles) {
   
        stroke(255, 255, 0, 100);
        strokeWeight(2);
        
        if (projectile.target) {
            
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
        
   
        fill(255, 255, 0);
        noStroke();
        ellipse(projectile.x, projectile.y, 6, 6);
        
   
        fill(255, 255, 0, 100);
        ellipse(projectile.x, projectile.y, 12, 12);
    }
    

    fill(255);
    textSize(16);
    text(`Territory Captured: ${capturedPercent.toFixed(1)}%`, 10, 20);
    text(`Aliens: ${aliens.length}`, 10, 40);
    text(`Turrets: ${turrets.length}`, 10, 60);
    text(`Wave: ${gameState.wave}`, 150, 60);
    text('Money: $' + gameState.money, 150, 40);
    
 
    textSize(14);
    

    if (selectedTurretType === 'combat') {
        fill(0, 0, 255, 150);
    } else {
        fill(100, 100, 100, 150);
    }
    rect(10, 120, 110, 30);
    fill(255);
    text(`Combat ($${combatTurretCost})`, 15, 140);
    

    if (selectedTurretType === 'money') {
        fill(255, 215, 0, 150); 
    } else {
        fill(100, 100, 100, 150);
    }
    rect(130, 120, 110, 30);
    fill(255);
    text(`Money ($${moneyTurretCost})`, 135, 140);
    
   
    textSize(12);
    if (selectedTurretType === 'combat') {
        text('Combat: Shoots aliens', 10, 165);
        text('Range: 100, Damage: 25', 10, 180);
    } else {
        text('Money: Generates $50 every 5s', 10, 165);
        text('Can be destroyed by aliens', 10, 180);
    }
    
  
    textSize(16);
    if (!gameState.waveActive) {
        text(`Press SPACE to start wave ${gameState.wave}`, 10, 210);
    } else {
        text(`Aliens to spawn: ${aliensToSpawn}`, 10, 210);
        text(`Spawn timer: ${spawnTimer}/${spawnDelay}`, 10, 230);
    }
}

function updateGame() {
   
    handleSpawning();
    
    
    for (let i = aliens.length - 1; i >= 0; i--) {
        updateAlien(aliens[i]);

        trackAlienPerformance(aliens[i]);
        if (aliens[i].health <= 0) {
            aliens.splice(i, 1);
        }
    }
    

    for (let turret of turrets) {
        updateTurret(turret);
    }
    
 
    for (let i = explosions.length - 1; i >= 0; i--) {
        let explosion = explosions[i];
        
      
        explosion.radius = (explosion.maxRadius * (explosion.maxLife - explosion.life)) / explosion.maxLife;
        explosion.life--;
        
   
        if (explosion.life <= 0) {
            explosions.splice(i, 1);
        }
    }
    

    for (let i = projectiles.length - 1; i >= 0; i--) {
        updateProjectile(projectiles[i]);
        if (projectiles[i].life <= 0) {
            projectiles.splice(i, 1);
        }
    }
    
    updateTerritory();
    calculateCapturedPercent();
    
   
    if (gameState.waveActive && aliens.length < 2 && aliensToSpawn === 0) {
        console.log("🏁 Wave complete - ending wave");
        endWave();
    }
    
 
    if (capturedPercent > 50) {
        gameState.state = 'gameOver';
        evolveAliens();
    }
}

function startWave() {
    if (gameState.waveActive) {
        console.log("Cannot start wave - already active");
        return;
    }
    
    console.log(`🚀 Starting wave ${gameState.wave}`);
    gameState.waveActive = true;
    

    aliensToSpawn = 3 + 7*gameState.wave;
    spawnTimer = 0;
   
    
    console.log(`📋 Will spawn ${aliensToSpawn} aliens with ${spawnDelay} frame delay`);
}

function endWave() {
    console.log(`🎊 Ending wave ${gameState.wave}`);
    
    gameState.waveActive = false;
    gameState.wave++;
    gameState.energy += 25;
    
  
    aliensToSpawn = 0;
    spawnTimer = 0;
    spawnDelay -= 3;
   
    aliens = [];
    

    evolveAliens();
    
    console.log(`✅ Wave ${gameState.wave - 1} completed`);
    console.log(`📊 Ready for wave ${gameState.wave}. Press Space to start.`);
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
    if (gameState.wave === 26 && aliens.length === 0) { 
        gameState.state = 'gameWin';
    }
}

function mousePressed() {

    if (gameState.state === 'intro') {
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
// restart functoln 
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
