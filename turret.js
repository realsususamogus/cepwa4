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