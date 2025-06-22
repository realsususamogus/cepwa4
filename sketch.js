// Game state
let gameState = {
  wave: 1,
  energy: 100,
  generation: 1,
  waveActive: false,
  selectedTowerType: null,
  evolutionData: []
};

// Grid system
const GRID_SIZE = 25;
let COLS, ROWS;
let gameGrid = [];
let infestationGrid = [];

// Game objects
let towers = [];
let aliens = [];
let projectiles = [];
let infestationCells = [];

// Wave Function Collapse for map generation
let wfcTiles = [];
let mapGenerated = false;

// Genetic Algorithm parameters
let alienGenomes = [];
let fitnessHistory = [];

// Cellular Automata rules for infestation
let infestationRules = {
  birthLimit: 4,
  deathLimit: 3,
  iterationsPerFrame: 1
};

class Tower {
  constructor(x, y, type) {
      this.x = x;
      this.y = y;
      this.type = type;
      this.range = this.getRange();
      this.damage = this.getDamage();
      this.fireRate = this.getFireRate();
      this.lastFired = 0;
      this.target = null;
      this.angle = 0;
  }
  
  getRange() {
      const ranges = { laser: 120, plasma: 100, quantum: 80 };
      return ranges[this.type] || 100;
  }
  
  getDamage() {
      const damages = { laser: 25, plasma: 40, quantum: 60 };
      return damages[this.type] || 25;
  }
  
  getFireRate() {
      const rates = { laser: 200, plasma: 400, quantum: 600 };
      return rates[this.type] || 300;
  }
  
  update() {
      this.findTarget();
      if (this.target && millis() - this.lastFired > this.fireRate) {
          this.fire();
          this.lastFired = millis();
      }
  }
  
  findTarget() {
      let closest = null;
      let closestDist = this.range;
      
      for (let alien of aliens) {
          let d = dist(this.x, this.y, alien.x, alien.y);
          if (d < closestDist) {
              closest = alien;
              closestDist = d;
          }
      }
      
      this.target = closest;
      if (this.target) {
          this.angle = atan2(this.target.y - this.y, this.target.x - this.x);
      }
  }
  
  fire() {
      if (this.target) {
          projectiles.push(new Projectile(this.x, this.y, this.target, this.type, this.damage));
      }
  }
  
  draw() {
      push();
      translate(this.x, this.y);
      rotate(this.angle);
      
      // Tower base
      fill(50, 150, 255);
      stroke(100, 200, 255);
      strokeWeight(2);
      ellipse(0, 0, 20, 20);
      
      // Tower barrel
      fill(70, 170, 255);
      rect(8, -3, 15, 6);
      
      // Type indicator
      fill(255);
      noStroke();
      textAlign(CENTER);
      textSize(8);
      text(this.type[0].toUpperCase(), 0, 3);
      
      pop();
      
      // Range indicator when selected
      if (this.target) {
          stroke(255, 100, 100, 100);
          strokeWeight(1);
          noFill();
          ellipse(this.x, this.y, this.range * 2);
      }
  }
}

class Alien {
  constructor(genome) {
      this.x = 0;
      this.y = height / 2;
      this.health = genome.health;
      this.maxHealth = genome.health;
      this.speed = genome.speed;
      this.armor = genome.armor;
      this.size = genome.size;
      this.color = genome.color;
      this.fitness = 0;
      this.distanceTraveled = 0;
      this.timeAlive = 0;
      this.genome = genome;
      this.path = this.generatePath();
      this.pathIndex = 0;
      this.targetX = this.path[0].x;
      this.targetY = this.path[0].y;
  }
  
  generatePath() {
      let path = [];
      let segments = 5 + Math.floor(random(3));
      
      for (let i = 0; i <= segments; i++) {
          let x = map(i, 0, segments, 0, width);
          let y = height/2 + sin(i * this.genome.pathVariation) * this.genome.pathAmplitude;
          y = constrain(y, 50, height - 50);
          path.push({x: x, y: y});
      }
      
      return path;
  }
  
  update() {
      this.timeAlive++;
      
      // Move toward current path target
      let dx = this.targetX - this.x;
      let dy = this.targetY - this.y;
      let dist = sqrt(dx*dx + dy*dy);
      
      if (dist < 10 && this.pathIndex < this.path.length - 1) {
          this.pathIndex++;
          this.targetX = this.path[this.pathIndex].x;
          this.targetY = this.path[this.pathIndex].y;
      }
      
      if (dist > 0) {
          this.x += (dx / dist) * this.speed;
          this.y += (dy / dist) * this.speed;
          this.distanceTraveled += this.speed;
      }
      
      // Update fitness
      this.fitness = this.distanceTraveled + this.timeAlive * 0.1;
      
      // Check if reached end
      if (this.x > width - 10) {
          this.reachedEnd();
      }
      
      // Spread infestation
      this.spreadInfestation();
  }
  
  reachedEnd() {
      this.fitness += 1000; // Bonus for reaching the end
      gameState.energy -= 10;
      this.remove();
  }
  
  spreadInfestation() {
      let gridX = Math.floor(this.x / GRID_SIZE);
      let gridY = Math.floor(this.y / GRID_SIZE);
      
      if (gridX >= 0 && gridX < COLS && gridY >= 0 && gridY < ROWS) {
          if (random() < 0.1) { // 10% chance per frame
              infestationGrid[gridY][gridX] = 1;
          }
      }
  }
  
  takeDamage(damage) {
      let actualDamage = max(1, damage - this.armor);
      this.health -= actualDamage;
      
      if (this.health <= 0) {
          gameState.energy += 5;
          this.remove();
      }
  }
  
  remove() {
      let index = aliens.indexOf(this);
      if (index > -1) {
          aliens.splice(index, 1);
      }
  }
  
  draw() {
      push();
      translate(this.x, this.y);
      
      // Alien body
      fill(this.color.r, this.color.g, this.color.b);
      stroke(255, 100);
      strokeWeight(1);
      ellipse(0, 0, this.size, this.size);
      
      // Health bar
      let healthRatio = this.health / this.maxHealth;
      fill(255, 0, 0);
      noStroke();
      rect(-this.size/2, -this.size/2 - 8, this.size, 3);
      fill(0, 255, 0);
      rect(-this.size/2, -this.size/2 - 8, this.size * healthRatio, 3);
      
      // Pulsing effect
      let pulse = sin(millis() * 0.01) * 3;
      fill(this.color.r, this.color.g, this.color.b, 100);
      noStroke();
      ellipse(0, 0, this.size + pulse, this.size + pulse);
      
      pop();
      
      // Draw path (debug)
      if (false) { // Set to true to see paths
          stroke(this.color.r, this.color.g, this.color.b, 100);
          strokeWeight(1);
          noFill();
          beginShape();
          for (let point of this.path) {
              vertex(point.x, point.y);
          }
          endShape();
      }
  }
}

class Projectile {
  constructor(x, y, target, type, damage) {
      this.x = x;
      this.y = y;
      this.target = target;
      this.type = type;
      this.damage = damage;
      this.speed = 8;
      this.life = 60; // frames
  }
  
  update() {
      if (this.target && aliens.includes(this.target)) {
          // Track target
          let dx = this.target.x - this.x;
          let dy = this.target.y - this.y;
          let dist = sqrt(dx*dx + dy*dy);
          
          if (dist < 10) {
              this.target.takeDamage(this.damage);
              this.remove();
              return;
          }
          
          this.x += (dx / dist) * this.speed;
          this.y += (dy / dist) * this.speed;
      } else {
          // Target lost, continue straight
          this.y -= this.speed;
      }
      
      this.life--;
      if (this.life <= 0) {
          this.remove();
      }
  }
  
  remove() {
      let index = projectiles.indexOf(this);
      if (index > -1) {
          projectiles.splice(index, 1);
      }
  }
  
  draw() {
      let colors = {
          laser: [255, 100, 100],
          plasma: [100, 255, 100],
          quantum: [255, 100, 255]
      };
      
      let color = colors[this.type] || [255, 255, 255];
      
      fill(color[0], color[1], color[2]);
      noStroke();
      ellipse(this.x, this.y, 6, 6);
      
      // Trail effect
      fill(color[0], color[1], color[2], 100);
      ellipse(this.x - 2, this.y + 2, 4, 4);
  }
}

// Wave Function Collapse implementation
function generateMapWFC() {
  // Simple tile-based map generation
  let tiles = [
      { type: 'ground', passable: true, color: [20, 40, 20] },
      { type: 'rock', passable: false, color: [60, 60, 60] },
      { type: 'crystal', passable: false, color: [100, 50, 150] }
  ];
  
  gameGrid = [];
  for (let y = 0; y < ROWS; y++) {
      gameGrid[y] = [];
      for (let x = 0; x < COLS; x++) {
          // Create clear path through middle
          if (y >= ROWS/2 - 2 && y <= ROWS/2 + 2) {
              gameGrid[y][x] = tiles[0]; // ground
          } else {
              // Random terrain with constraints
              let r = random();
              if (r < 0.7) gameGrid[y][x] = tiles[0];
              else if (r < 0.9) gameGrid[y][x] = tiles[1];
              else gameGrid[y][x] = tiles[2];
          }
      }
  }
}

// Genetic Algorithm implementation
function createRandomGenome() {
  return {
      health: 50 + random(50),
      speed: 0.5 + random(2),
      armor: random(10),
      size: 12 + random(8),
      pathVariation: random(TWO_PI),
      pathAmplitude: 50 + random(100),
      color: {
          r: 150 + random(105),
          g: random(100),
          b: random(100)
      }
  };
}

function initializePopulation(size) {
  alienGenomes = [];
  for (let i = 0; i < size; i++) {
      alienGenomes.push(createRandomGenome());
  }
}

function evolvePopulation() {
  if (fitnessHistory.length === 0) return;
  
  // Sort by fitness
  let sortedGenomes = fitnessHistory.sort((a, b) => b.fitness - a.fitness);
  
  // Keep top 30%
  let survivors = sortedGenomes.slice(0, Math.floor(sortedGenomes.length * 0.3));
  
  // Create new population
  let newGenomes = [];
  
  // Add survivors
  for (let survivor of survivors) {
      newGenomes.push(survivor.genome);
  }
  
  // Fill remaining with mutations and crossovers
  while (newGenomes.length < alienGenomes.length) {
      if (random() < 0.7 && survivors.length > 1) {
          // Crossover
          let parent1 = random(survivors).genome;
          let parent2 = random(survivors).genome;
          newGenomes.push(crossover(parent1, parent2));
      } else {
          // Mutation
          let parent = random(survivors).genome;
          newGenomes.push(mutate(parent));
      }
  }
  
  alienGenomes = newGenomes;
  fitnessHistory = [];
  gameState.generation++;
}

function crossover(parent1, parent2) {
  let child = {};
  for (let key in parent1) {
      if (typeof parent1[key] === 'object' && parent1[key].r !== undefined) {
          // Handle color objects
          child[key] = random() < 0.5 ? {...parent1[key]} : {...parent2[key]};
      } else {
          child[key] = random() < 0.5 ? parent1[key] : parent2[key];
      }
  }
  return mutate(child, 0.1); // Light mutation
}

function mutate(genome, rate = 0.3) {
  let mutated = JSON.parse(JSON.stringify(genome)); // Deep copy
  
  if (random() < rate) mutated.health += random(-10, 10);
  if (random() < rate) mutated.speed += random(-0.3, 0.3);
  if (random() < rate) mutated.armor += random(-2, 2);
  if (random() < rate) mutated.size += random(-2, 2);
  if (random() < rate) mutated.pathVariation += random(-0.5, 0.5);
  if (random() < rate) mutated.pathAmplitude += random(-20, 20);
  
  // Clamp values
  mutated.health = max(20, min(150, mutated.health));
  mutated.speed = max(0.1, min(4, mutated.speed));
  mutated.armor = max(0, min(20, mutated.armor));
  mutated.size = max(8, min(25, mutated.size));
  mutated.pathAmplitude = max(20, min(200, mutated.pathAmplitude));
  
  return mutated;
}

// Cellular Automata for infestation spread
function updateInfestation() {
  let newGrid = [];
  
  for (let y = 0; y < ROWS; y++) {
      newGrid[y] = [];
      for (let x = 0; x < COLS; x++) {
          let neighbors = countInfestationNeighbors(x, y);
          
          if (infestationGrid[y][x] === 1) {
              // Cell is infested
              newGrid[y][x] = neighbors >= infestationRules.deathLimit ? 1 : 0;
          } else {
              // Cell is clean
              newGrid[y][x] = neighbors > infestationRules.birthLimit ? 1 : 0;
          }
      }
  }
  
  infestationGrid = newGrid;
}

function countInfestationNeighbors(x, y) {
  let count = 0;
  for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          
          let nx = x + dx;
          let ny = y + dy;
          
          if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) {
              count++; // Treat out of bounds as infested
          } else if (infestationGrid[ny][nx] === 1) {
              count++;
          }
      }
  }
  return count;
}

// p5.js setup and draw functions
function setup() {
  createCanvas(1200, 800);
  
  COLS = Math.floor(width / GRID_SIZE);
  ROWS = Math.floor(height / GRID_SIZE);
  
  // Initialize grids
  infestationGrid = [];
  for (let y = 0; y < ROWS; y++) {
      infestationGrid[y] = [];
      for (let x = 0; x < COLS; x++) {
          infestationGrid[y][x] = 0;
      }
  }
  
  generateMapWFC();
  initializePopulation(20);
}

function draw() {
  background(5, 5, 15);
  
  // Draw terrain
  drawTerrain();
  
  // Draw infestation
  drawInfestation();
  
  // Update and draw game objects
  updateGame();
  drawGame();
  
  // Update UI
  updateUI();
  
  // Cellular automata update (slower rate)
  if (frameCount % 10 === 0) {
      updateInfestation();
  }
}

function drawTerrain() {
  for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
          let tile = gameGrid[y][x];
          fill(tile.color[0], tile.color[1], tile.color[2]);
          noStroke();
          rect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
      }
  }
}

function drawInfestation() {
  for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
          if (infestationGrid[y][x] === 1) {
              fill(150, 0, 150, 100 + sin(frameCount * 0.1 + x + y) * 50);
              noStroke();
              rect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
              
              // Pulsing effect
              fill(255, 0, 255, 50);
              ellipse(x * GRID_SIZE + GRID_SIZE/2, y * GRID_SIZE + GRID_SIZE/2, 
                     GRID_SIZE + sin(frameCount * 0.2 + x + y) * 5);
          }
      }
  }
}

function updateGame() {
  // Update towers
  for (let tower of towers) {
      tower.update();
  }
  
  // Update aliens
  for (let alien of aliens) {
      alien.update();
  }
  
  // Update projectiles
  for (let projectile of projectiles) {
      projectile.update();
  }
  
  // Check wave completion
  if (gameState.waveActive && aliens.length === 0) {
      endWave();
  }
}

function drawGame() {
  // Draw towers
  for (let tower of towers) {
      tower.draw();
  }
  
  // Draw aliens
  for (let alien of aliens) {
      alien.draw();
  }
  
  // Draw projectiles
  for (let projectile of projectiles) {
      projectile.draw();
  }
}

function updateUI() {
  document.getElementById('wave').textContent = gameState.wave;
  document.getElementById('energy').textContent = gameState.energy;
  document.getElementById('aliens').textContent = aliens.length;
  document.getElementById('towers').textContent = towers.length;
  document.getElementById('generation').textContent = gameState.generation;
}

// UI Functions
function placeTower(type) {
  gameState.selectedTowerType = type;
}

function startWave() {
  if (gameState.waveActive) return;
  
  gameState.waveActive = true;
  
  // Spawn aliens based on current wave
  let alienCount = 5 + gameState.wave * 2;
  let spawnDelay = 60; // frames between spawns
  
  for (let i = 0; i < alienCount; i++) {
      setTimeout(() => {
          if (gameState.waveActive) {
              let genome = random(alienGenomes);
              aliens.push(new Alien(genome));
          }
      }, i * spawnDelay * 16.67); // Convert frames to milliseconds
  }
}

function endWave() {
  gameState.waveActive = false;
  gameState.wave++;
  gameState.energy += 25;
  
  // Collect fitness data from aliens that died
  for (let alien of aliens) {
      fitnessHistory.push({
          genome: alien.genome,
          fitness: alien.fitness
      });
  }
  
  // Evolve if we have enough data
  if (fitnessHistory.length >= 20) {
      evolvePopulation();
  }
}

function evolveEnemies() {
  if (fitnessHistory.length > 0) {
      evolvePopulation();
  }
}

function mousePressed() {
  if (gameState.selectedTowerType && mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
      let cost = { laser: 20, plasma: 35, quantum: 50 }[gameState.selectedTowerType];
      
      if (gameState.energy >= cost) {
          // Check if position is valid (not on path, not on existing tower)
          let gridX = Math.floor(mouseX / GRID_SIZE);
          let gridY = Math.floor(mouseY / GRID_SIZE);
          
          if (gridX >= 0 && gridX < COLS && gridY >= 0 && gridY < ROWS) {
              let tile = gameGrid[gridY][gridX];
              if (tile.passable) {
                  // Check for existing towers
                  let canPlace = true;
                  for (let tower of towers) {
                      if (dist(tower.x, tower.y, mouseX, mouseY) < 30) {
                          canPlace = false;
                          break;
                      }
                  }
                  
                  if (canPlace) {
                      towers.push(new Tower(mouseX, mouseY, gameState.selectedTowerType));
                      gameState.energy -= cost;
                      gameState.selectedTowerType = null;
                  }
              }
          }
      }
  }
}

function keyPressed() {
  if (key === ' ') {
      startWave();
  } else if (key === 'e' || key === 'E') {
      evolveEnemies();
  }
}
