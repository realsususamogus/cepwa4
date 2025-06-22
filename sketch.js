let path = []; // Path for aliens to follow
let aliens = []; // Array to store alien entities
let towers = []; // Array to store towers
let baseHealth = 100; // Player's base health
let wave = 1; // Current wave of aliens
let towerCost = 50; // Cost to place a tower
let playerMoney = 200; // Player's starting money
let level = 1; // Current level
let selectedTower = null; // Currently selected tower for upgrades
let spawningWave = false; // Flag to prevent multiple wave spawning

function setup() {
  createCanvas(1000, 700);
  generatePath(level); // Create the path for aliens based on level
  spawnAliens(); // Spawn initial wave of aliens
}

function draw() {
  // Nice gradient background
  for (let i = 0; i <= height; i++) {
    let inter = map(i, 0, height, 0, 1);
    let c = lerpColor(color(10, 10, 30), color(5, 5, 15), inter);
    stroke(c);
    line(0, i, width, i);
  }
  
  drawPath(); // Render the path
  updateAliens(); // Update alien positions
  updateTowers(); // Update tower attacks
  checkBaseHealth(); // Check if base health is depleted
  displayUI(); // Display player stats (money, health, wave, level)
  drawUpgradePanel(); // Draw upgrade buttons
}

function generatePath(level) {
  path = []; // Clear the path for the new level

  let currentX = 0; // Start point
  let currentY = height / 2; // Start in the middle

  path.push({ x: currentX, y: currentY }); // Add the starting point

  let steps = 15; // More segments for longer path
  let zigzagDirection = 1; // For creating zigzag pattern
  
  for (let i = 0; i < steps; i++) {
    let nextX = currentX + random(40, 80); // Move forward in X direction
    let nextY = currentY + (zigzagDirection * random(50, 120)); // Zigzag pattern
    
    // Alternate zigzag direction
    if (i % 2 === 0) {
      zigzagDirection *= -1;
    }

    // Ensure the path stays within canvas bounds
    nextX = constrain(nextX, 0, width - 100);
    nextY = constrain(nextY, 100, height - 100);

    path.push({ x: nextX, y: nextY }); // Add the next point to the path

    currentX = nextX;
    currentY = nextY;
  }

  // Ensure the path ends at the right edge of the canvas
  path.push({ x: width, y: currentY });
}

function drawPath() {
  // Draw path background
  stroke(100, 50, 150);
  strokeWeight(20);
  noFill();
  beginShape();
  for (let point of path) {
    vertex(point.x, point.y);
  }
  endShape();
  
  // Draw path center line
  stroke(150, 100, 200);
  strokeWeight(4);
  beginShape();
  for (let point of path) {
    vertex(point.x, point.y);
  }
  endShape();
  
  // Draw base at the end
  fill(255, 100, 100);
  stroke(255);
  strokeWeight(2);
  rect(width - 50, path[path.length - 1].y - 25, 50, 50);
  fill(255);
  textAlign(CENTER);
  text("BASE", width - 25, path[path.length - 1].y + 5);
}

function spawnAliens() {
  for (let i = 0; i < wave * 3; i++) {
    setTimeout(() => {
      let alienType = random() > 0.5 ? new FastAlien(path[0].x, path[0].y) : new StrongAlien(path[0].x, path[0].y);
      aliens.push(alienType);
    }, i * 500); // Spawn with delay
  }
}

function updateAliens() {
  let survivingAliens = []; // Track aliens that survive the wave

  for (let i = aliens.length - 1; i >= 0; i--) {
    let alien = aliens[i];
    alien.update();
    alien.display();
    
    if (alien.reachedBase()) {
      baseHealth -= alien.damage; // Reduce base health if alien reaches the base
      aliens.splice(i, 1); // Remove alien
    } else if (alien.health <= 0) {
      playerMoney += 10; // Give money for killing alien
      aliens.splice(i, 1); // Remove dead alien
    } else {
      survivingAliens.push(alien); // Add alien to surviving list if not killed
    }
  }

  // Progress to the next wave if all aliens are defeated or reach the base
  if (aliens.length === 0 && !spawningWave) {
    spawningWave = true; // Set flag to prevent multiple calls
    wave++;
    if (wave > 5) {
      wave = 1;
      level++;
      generatePath(level); // Generate new path for the next level
    }
    evolveAliens(survivingAliens); // Evolve aliens for the next wave
  }
}

function evolveAliens(survivingAliens) {
  setTimeout(() => {
    for (let i = 0; i < wave * 3; i++) {
      setTimeout(() => {
        if (survivingAliens.length > 0) {
          // Select a random surviving alien as a "parent"
          let parent = random(survivingAliens);

          // Mutate attributes slightly to make aliens stronger
          let speed = constrain(parent.speed + random(-0.5, 0.5), 1, 5);
          let health = constrain(parent.health + random(-5, 10), 10, 100);
          let damage = constrain(parent.damage + random(-1, 2), 5, 30);

          // Create a new alien with mutated attributes
          aliens.push(new Alien(path[0].x, path[0].y, speed, damage, health, true)); // Mark as mutated
        } else {
          // If no survivors, spawn default aliens
          let alienType = random() > 0.5 ? new FastAlien(path[0].x, path[0].y) : new StrongAlien(path[0].x, path[0].y);
          aliens.push(alienType);
        }
        
        // Reset the spawning flag when the last alien is spawned
        if (i === wave * 3 - 1) {
          spawningWave = false;
        }
      }, i * 500);
    }
  }, 2000); // Wait 2 seconds before next wave
}

function updateTowers() {
  for (let tower of towers) {
    tower.attack(aliens); // Attack aliens within range
    tower.display();
  }
}

function checkBaseHealth() {
  if (baseHealth <= 0) {
    noLoop(); // Stop the game
    fill(255, 0, 0);
    textSize(48);
    textAlign(CENTER);
    text("GAME OVER!", width/2, height/2);
  }
}

function displayUI() {
  // UI Background
  fill(0, 0, 0, 150);
  rect(10, 10, 300, 120);
  
  fill(255);
  textAlign(LEFT);
  textSize(16);
  text(`Base Health: ${baseHealth}`, 20, 30);
  text(`Money: $${playerMoney}`, 20, 50);
  text(`Wave: ${wave}`, 20, 70);
  text(`Level: ${level}`, 20, 90);
  text(`Tower Cost: $${towerCost}`, 20, 110);
}

function drawUpgradePanel() {
  if (selectedTower) {
    // Upgrade panel background
    fill(0, 0, 0, 200);
    rect(width - 250, 50, 240, 200);
    
    fill(255);
    textAlign(CENTER);
    textSize(18);
    text("Tower Upgrades", width - 130, 75);
    
    textSize(14);
    text(`Damage: ${selectedTower.damage}`, width - 130, 100);
    text(`Fire Rate: ${60/selectedTower.fireRate}`, width - 130, 120);
    
    // Upgrade buttons
    fill(100, 150, 255);
    rect(width - 230, 140, 100, 30);
    rect(width - 120, 140, 100, 30);
    
    fill(255);
    text("Upgrade Damage", width - 180, 160);
    text("($50)", width - 180, 175);
    text("Upgrade Fire Rate", width - 70, 160);
    text("($30)", width - 70, 175);
    
    // Close button
    fill(255, 100, 100);
    rect(width - 230, 200, 200, 30);
    fill(255);
    text("Close", width - 130, 220);
  }
}

function mousePressed() {
  // Check upgrade panel clicks
  if (selectedTower) {
    // Damage upgrade button
    if (mouseX > width - 230 && mouseX < width - 130 && mouseY > 140 && mouseY < 170) {
      if (playerMoney >= 50) {
        selectedTower.damage += 5;
        playerMoney -= 50;
      }
      return;
    }
    // Fire rate upgrade button
    if (mouseX > width - 120 && mouseX < width - 20 && mouseY > 140 && mouseY < 170) {
      if (playerMoney >= 30) {
        selectedTower.fireRate = max(5, selectedTower.fireRate - 3);
        playerMoney -= 30;
      }
      return;
    }
    // Close button
    if (mouseX > width - 230 && mouseX < width - 30 && mouseY > 200 && mouseY < 230) {
      selectedTower = null;
      return;
    }
  }
  
  // Check if clicking on existing tower
  for (let tower of towers) {
    if (dist(mouseX, mouseY, tower.x, tower.y) < 20) {
      selectedTower = tower;
      return;
    }
  }
  
  // Place a tower if the player has enough money
  if (playerMoney >= towerCost) {
    towers.push(new Tower(mouseX, mouseY));
    playerMoney -= towerCost;
  }
}

class Alien {
  constructor(x, y, speed, damage, health, mutated = false) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.damage = damage;
    this.health = health;
    this.maxHealth = health;
    this.pathIndex = 0; // Current point in the path
    this.mutated = mutated; // Flag to indicate if the alien is mutated
  }

  update() {
    // Move toward the next point in the path
    if (this.pathIndex < path.length - 1) {
      let target = path[this.pathIndex + 1];
      let dx = target.x - this.x;
      let dy = target.y - this.y;
      let distToTarget = sqrt(dx * dx + dy * dy);
      if (distToTarget < 10) {
        this.pathIndex++;
      } else {
        this.x += (dx / distToTarget) * this.speed;
        this.y += (dy / distToTarget) * this.speed;
      }
    }
  }

  display() {
    // Health bar
    let barWidth = 20;
    let barHeight = 4;
    fill(255, 0, 0);
    rect(this.x - barWidth/2, this.y - 15, barWidth, barHeight);
    fill(0, 255, 0);
    rect(this.x - barWidth/2, this.y - 15, (this.health/this.maxHealth) * barWidth, barHeight);
    
    // Alien body
    if (this.mutated) {
      fill(255, 0, 255); // Purple color for mutated aliens
      stroke(255, 100, 255);
    } else {
      fill(255, 0, 0); // Red color for normal aliens
      stroke(255, 100, 100);
    }
    strokeWeight(2);
    ellipse(this.x, this.y, 20, 20);
    
    // Eyes
    fill(255);
    ellipse(this.x - 5, this.y - 3, 4, 4);
    ellipse(this.x + 5, this.y - 3, 4, 4);
  }

  reachedBase() {
    return this.pathIndex >= path.length - 1;
  }
}

class FastAlien extends Alien {
  constructor(x, y, mutated = false) {
    super(x, y, 4, 5, 20, mutated); // Faster speed, lower damage, lower health
  }

  display() {
    // Health bar
    let barWidth = 20;
    let barHeight = 4;
    fill(255, 0, 0);
    rect(this.x - barWidth/2, this.y - 15, barWidth, barHeight);
    fill(0, 255, 0);
    rect(this.x - barWidth/2, this.y - 15, (this.health/this.maxHealth) * barWidth, barHeight);
    
    if (this.mutated) {
      fill(100, 100, 255); // Light blue for mutated fast aliens
      stroke(150, 150, 255);
    } else {
      fill(0, 0, 255); // Blue color for fast aliens
      stroke(100, 100, 255);
    }
    strokeWeight(2);
    ellipse(this.x, this.y, 18, 18);
    
    // Speed lines
    stroke(255);
    strokeWeight(1);
    line(this.x - 15, this.y, this.x - 10, this.y);
    line(this.x - 15, this.y - 3, this.x - 8, this.y - 3);
    line(this.x - 15, this.y + 3, this.x - 8, this.y + 3);
  }
}

class StrongAlien extends Alien {
  constructor(x, y, mutated = false) {
    super(x, y, 2, 15, 50, mutated); // Slower speed, higher damage, higher health
  }

  display() {
    // Health bar
    let barWidth = 25;
    let barHeight = 5;
    fill(255, 0, 0);
    rect(this.x - barWidth/2, this.y - 20, barWidth, barHeight);
    fill(0, 255, 0);
    rect(this.x - barWidth/2, this.y - 20, (this.health/this.maxHealth) * barWidth, barHeight);
    
    if (this.mutated) {
      fill(100, 255, 100); // Light green for mutated strong aliens
      stroke(150, 255, 150);
    } else {
      fill(0, 255, 0); // Green color for strong aliens
      stroke(100, 255, 100);
    }
    strokeWeight(3);
    ellipse(this.x, this.y, 25, 25);
    
    // Armor spikes
    fill(200);
    triangle(this.x, this.y - 12, this.x - 3, this.y - 8, this.x + 3, this.y - 8);
    triangle(this.x - 10, this.y - 5, this.x - 6, this.y - 8, this.x - 6, this.y - 2);
    triangle(this.x + 10, this.y - 5, this.x + 6, this.y - 8, this.x + 6, this.y - 2);
  }
}

class Tower {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.range = 100; // Attack range
    this.damage = 20; // Damage dealt to aliens
    this.projectiles = []; // Array to store projectiles
    this.fireRate = 30; // Frames between shots
    this.lastShot = 0; // Track the last frame a shot was fired
  }

  attack(aliens) {
    // Fire projectiles at aliens in range
    if (frameCount - this.lastShot >= this.fireRate) {
      for (let alien of aliens) {
        let d = dist(this.x, this.y, alien.x, alien.y);
        if (d < this.range) {
          this.projectiles.push(new Projectile(this.x, this.y, alien, this.damage));
          this.lastShot = frameCount; // Update last shot time
          break; // Shoot at one alien per frame
        }
      }
    }

    // Update and display projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      let projectile = this.projectiles[i];
      projectile.update();
      projectile.display();
      if (projectile.hitTarget()) {
        projectile.target.health -= projectile.damage; // Deal damage to the alien
        this.projectiles.splice(i, 1); // Remove projectile after hitting target
      } else if (projectile.outOfBounds()) {
        this.projectiles.splice(i, 1); // Remove projectile if it goes out of bounds
      }
    }
  }

  display() {
    // Tower base
    fill(100, 100, 100);
    stroke(150);
    strokeWeight(2);
    ellipse(this.x, this.y, 35, 35);
    
    // Tower turret
    fill(0, 200, 0);
    ellipse(this.x, this.y, 25, 25);
    
    // Tower barrel
    fill(50);
    rect(this.x - 2, this.y - 15, 4, 15);
    
    // Range indicator when selected
    if (selectedTower === this) {
      noFill();
      stroke(0, 255, 0, 100);
      strokeWeight(2);
      ellipse(this.x, this.y, this.range * 2, this.range * 2);
    }
  }
}

class Projectile {
  constructor(x, y, target, damage) {
    this.x = x;
    this.y = y;
    this.target = target; // Target alien
    this.damage = damage; // Damage dealt to the target
    this.speed = 8; // Speed of the projectile
  }

  update() {
    // Move toward the target
    let dx = this.target.x - this.x;
    let dy = this.target.y - this.y;
    let distToTarget = sqrt(dx * dx + dy * dy);
    this.x += (dx / distToTarget) * this.speed;
    this.y += (dy / distToTarget) * this.speed;
  }

  display() {
    fill(255, 255, 0);
    stroke(255, 200, 0);
    strokeWeight(2);
    ellipse(this.x, this.y, 8, 8); // Draw the projectile
  }

  hitTarget() {
    // Check if the projectile hits the target
    return dist(this.x, this.y, this.target.x, this.target.y) < 12;
  }

  outOfBounds() {
    // Check if the projectile goes out of bounds
    return this.x < 0 || this.x > width || this.y < 0 || this.y > height;
  }
}

