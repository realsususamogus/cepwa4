// Genetic algorithm settings
let populationSize = 50;
let mutationRate = 0.1;

// Wave spawning variables
let spawnTimer = 0;
let aliensToSpawn = 0;
let spawnDelay = 90; // frames between spawns

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
    while (attempts < 100) {
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

function trackAlienPerformance(alien) {
    // Track when alien dies and calculate survival time
    if (!alien.spawnTime) {
        alien.spawnTime = frameCount;
    }
    
    if (alien.health <= 0) {
        gameState.money += 100; // Reward for killing alien
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
    // Enhanced genetic algorithm using performance data
    let newGenes = [];
    
    // Calculate fitness scores based on performance
    for (let gene of alienGenes) {
        if (gene.spawnCount > 0) {
            gene.avgSurvivalTime = gene.totalSurvivalTime / gene.spawnCount;
            gene.fitness = gene.avgSurvivalTime + (gene.health * 0.1) + (gene.speed * 10);
        } else {
            gene.fitness = gene.health * 0.1; // Fallback for unspawned genes
        }
    }
    
    // Sort by fitness instead of just health
    alienGenes.sort((a, b) => (b.fitness || 0) - (a.fitness || 0));
    
    // Keep best performers
    for (let i = 0; i < populationSize / 2; i++) {
        newGenes.push({...alienGenes[i]}); // Copy to avoid reference issues
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
        
        // Clamp values to reasonable ranges
        child.health = constrain(child.health, 30, 200);
        child.speed = constrain(child.speed, 0.3, 3.0);
        
        newGenes.push(child);
    }
    
    alienGenes = newGenes;
    console.log(`🧬 Evolution complete. Best fitness: ${alienGenes[0].fitness?.toFixed(1) || 'N/A'}`);
} 
