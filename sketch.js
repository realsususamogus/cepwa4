// Game state
let gameState = {
  wave: 1,
  energy: 100,
  generation: 1,
  waveActive: false,
  selectedTowerType: null,
  evolutionData: [],
  baseResources: 1000, // Resources at the base
  basePosition: { x: 0, y: 0 }, // Will be set in setup
  spawnPosition: { x: 0, y: 0 } // Will be set in setup
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

// Alien spawning variables
let spawnTimer = 0;
let aliensToSpawn = 0;
let spawnDelay = 90; // frames between spawns

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
      // Halved damage for balance
      const damages = { laser: 6, plasma: 10, quantum: 15 };
      return damages[this.type] || 12;
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
          let d = dist(this.x, this.y, alien.x, alien.y); // This one is fine - using p5.js dist()
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
      this.x = gameState.spawnPosition.x;
      this.y = gameState.spawnPosition.y;
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
      
      // Ensure we have a valid path before setting targets
      if (this.path.length > 0) {
          this.targetX = this.path[0].x;
          this.targetY = this.path[0].y;
      } else {
          // Fallback if path generation fails
          this.targetX = gameState.basePosition.x;
          this.targetY = gameState.basePosition.y;
      }
      
      this.state = 'goingToBase';
      this.resourcesCarried = 0;
      this.baseStayTime = 60;
      this.baseStayCounter = 0;
      
      // Debug the new alien
      console.log(`Created alien with path:`, this.path);
  }
  
  generatePath() {
      let path = [];
      let segments = 5 + Math.floor(random(3));
      
      console.log(`Generating path with ${segments} segments`);
      console.log(`From spawn (${gameState.spawnPosition.x}, ${gameState.spawnPosition.y}) to base (${gameState.basePosition.x}, ${gameState.basePosition.y})`);
      
      // Path from spawn to base
      for (let i = 0; i <= segments; i++) {
          let progress = i / segments;
          let x = lerp(gameState.spawnPosition.x, gameState.basePosition.x, progress);
          let y = lerp(gameState.spawnPosition.y, gameState.basePosition.y, progress);
          
          // Add some variation based on genome, but reduce it near the endpoints
          let variationStrength = 1.0 - abs(progress - 0.5) * 2; // Strong in middle, weak at ends
          y += sin(i * this.genome.pathVariation) * this.genome.pathAmplitude * variationStrength;
          y = constrain(y, 50, height - 50);
          
          path.push({x: x, y: y});
          console.log(`Path point ${i}: (${x}, ${y})`);
      }
      
      // Force the last point to be exactly at the base
      if (path.length > 0) {
          path[path.length - 1] = {
              x: gameState.basePosition.x,
              y: gameState.basePosition.y
          };
          console.log(`Fixed final path point to base: (${gameState.basePosition.x}, ${gameState.basePosition.y})`);
      }
      
      return path;
  }
  
  update() {
      this.timeAlive++;
      
      if (this.state === 'goingToBase') {
          this.moveTowardsBase();
      } else if (this.state === 'atBase') {
          this.stayAtBase();
      } else if (this.state === 'returning') {
          this.returnToSpawn();
      }
      
      // Update fitness based on progress and resources
      this.fitness = this.distanceTraveled + this.timeAlive * 0.1 + this.resourcesCarried * 100;
      
      // Spread infestation
      this.spreadInfestation();
  }
  
  moveTowardsBase() {
      // Move toward current path target
      let dx = this.targetX - this.x;
      let dy = this.targetY - this.y;
      let distance = sqrt(dx*dx + dy*dy);
      
      // Debug more frequently for troubleshooting
      if (frameCount % 30 === 0) { // Every half second instead of every second
          console.log(`Alien at (${this.x.toFixed(1)}, ${this.y.toFixed(1)}) moving to (${this.targetX}, ${this.targetY}), distance: ${distance.toFixed(1)}`);
          console.log(`  PathIndex: ${this.pathIndex}/${this.path.length-1}, Speed: ${this.speed}`);
      }
      
      // Check if we need to advance to next path point
      if (distance < 15 && this.pathIndex < this.path.length - 1) {
          this.pathIndex++;
          this.targetX = this.path[this.pathIndex].x;
          this.targetY = this.path[this.pathIndex].y;
          console.log(`🎯 Advanced to path index ${this.pathIndex}, new target: (${this.targetX}, ${this.targetY})`);
      }
      
      // Move towards target
      if (distance > 0) {
          let moveX = (dx / distance) * this.speed;
          let moveY = (dy / distance) * this.speed;
          this.x += moveX;
          this.y += moveY;
          this.distanceTraveled += this.speed;
          
          // Debug movement
          if (frameCount % 60 === 0) {
              console.log(`  Moving by (${moveX.toFixed(2)}, ${moveY.toFixed(2)})`);
          }
      }
      
      // Check if reached base - use more generous distance and also check if at final path point
      let distToBase = dist(this.x, this.y, gameState.basePosition.x, gameState.basePosition.y);
      let atFinalPathPoint = this.pathIndex >= this.path.length - 1;
      
      if (distToBase < 80 || (atFinalPathPoint && distance < 20)) {
          console.log(`🏠 Alien reached base! Distance to base: ${distToBase}, at final path point: ${atFinalPathPoint}`);
          this.state = 'atBase';
          this.baseStayCounter = 0;
          // Move alien to exact base position
          this.x = gameState.basePosition.x;
          this.y = gameState.basePosition.y;
      }
  }
  
  stayAtBase() {
      this.baseStayCounter++;
      
      // Keep alien at base position while staying
      this.x = gameState.basePosition.x;
      this.y = gameState.basePosition.y;
      
      // Take resources from base
      if (this.baseStayCounter === 30) { // Take resources halfway through stay
          let resourcesTaken = min(20, gameState.baseResources);
          gameState.baseResources -= resourcesTaken;
          this.resourcesCarried = resourcesTaken;
          this.fitness += resourcesTaken * 10; // Bonus for taking resources
          console.log(`💰 Alien took ${resourcesTaken} resources, carrying ${this.resourcesCarried}`);
      }
      
      if (this.baseStayCounter >= this.baseStayTime) {
          console.log(`🔄 Alien starting return journey`);
          this.state = 'returning';
          // Reverse path for return journey
          this.path.reverse();
          this.pathIndex = 0;
          
          // Ensure first return target is valid
          if (this.path.length > 0) {
              this.targetX = this.path[0].x;
              this.targetY = this.path[0].y;
              
              // Force the first point of return path to be exactly at spawn
              this.path[this.path.length - 1] = {
                  x: gameState.spawnPosition.x,
                  y: gameState.spawnPosition.y
              };
          }
      }
  }
  
  returnToSpawn() {
      // Move toward current path target (now reversed)
      let dx = this.targetX - this.x;
      let dy = this.targetY - this.y;
      let distance = sqrt(dx*dx + dy*dy);
      
      if (distance < 15 && this.pathIndex < this.path.length - 1) {
          this.pathIndex++;
          this.targetX = this.path[this.pathIndex].x;
          this.targetY = this.path[this.pathIndex].y;
      }
      
      if (distance > 0) {
          this.x += (dx / distance) * this.speed;
          this.y += (dy / distance) * this.speed;
          this.distanceTraveled += this.speed;
      }
      
      // Check if returned to spawn - use more generous distance
      let distToSpawn = dist(this.x, this.y, gameState.spawnPosition.x, gameState.spawnPosition.y);
      let atFinalReturnPoint = this.pathIndex >= this.path.length - 1;
      
      if (distToSpawn < 60 || (atFinalReturnPoint && distance < 20)) {
          console.log(`🚀 Alien returned to spawn! Distance: ${distToSpawn}`);
          this.state = 'survived';
          this.fitness += 1000; // Big bonus for surviving
          this.remove();
      }
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
      
      // Alien body color based on state
      let bodyColor = this.color;
      if (this.state === 'atBase') {
          bodyColor = { r: 255, g: 255, b: 0 }; // Yellow when at base
      } else if (this.state === 'returning' && this.resourcesCarried > 0) {
          bodyColor = { r: 0, g: 255, b: 0 }; // Green when carrying resources
      }
      
      fill(bodyColor.r, bodyColor.g, bodyColor.b);
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
      
      // Resource indicator
      if (this.resourcesCarried > 0) {
          fill(255, 255, 0);
          textAlign(CENTER);
          textSize(8);
          text(this.resourcesCarried, 0, this.size/2 + 10);
      }
      
      // State indicator
      fill(255);
      textAlign(CENTER);
      textSize(6);
      let stateText = this.state.charAt(0).toUpperCase();
      text(stateText, 0, -this.size/2 - 12);
      
      // Path index indicator
      fill(255, 255, 0);
      textSize(8);
      text(`${this.pathIndex}`, this.size/2 + 5, 0);
      
      pop();
      
      // Draw line to current target
      stroke(255, 0, 255, 150);
      strokeWeight(2);
      line(this.x, this.y, this.targetX, this.targetY);
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
          let distance = sqrt(dx*dx + dy*dy); // Changed from 'dist' to 'distance'
          
          if (distance < 10) {
              this.target.takeDamage(this.damage);
              this.remove();
              return;
          }
          
          this.x += (dx / distance) * this.speed;
          this.y += (dy / distance) * this.speed;
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
      health: 30 + random(40), // Reduced health for balance
      speed: 0.8 + random(1.5), // Slightly faster
      armor: random(5), // Reduced armor
      size: 12 + random(8),
      pathVariation: random(TWO_PI),
      pathAmplitude: 30 + random(60), // Reduced amplitude
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
  
  gameState.generation++;
  
  // Sort by fitness
  let sortedGenomes = fitnessHistory.sort((a, b) => b.fitness - a.fitness);
  
  // Keep survivors (aliens that returned successfully or had high fitness)
  let survivors = sortedGenomes.filter(entry => entry.fitness > 500); // Threshold for survivors
  
  if (survivors.length === 0) {
      // If no survivors, keep top 20%
      survivors = sortedGenomes.slice(0, Math.max(1, Math.floor(sortedGenomes.length * 0.2)));
  }
  
  console.log(`Generation ${gameState.generation}: ${survivors.length} survivors out of ${sortedGenomes.length}`);
  
  // Calculate average genome of survivors
  let avgGenome = calculateAverageGenome(survivors.map(s => s.genome));
  
  // Create new population based on average with mutations
  let newGenomes = [];
  
  // Add the average genome
  newGenomes.push(avgGenome);
  
  // Fill remaining with mutations of the average
  while (newGenomes.length < alienGenomes.length) {
      newGenomes.push(mutate(avgGenome, 0.4)); // Higher mutation rate
  }
  
  alienGenomes = newGenomes;
  fitnessHistory = [];
  
  console.log(`New population created with average genome:`, avgGenome);
}

function calculateAverageGenome(genomes) {
  if (genomes.length === 0) return createRandomGenome();
  
  let avg = {
      health: 0,
      speed: 0,
      armor: 0,
      size: 0,
      pathVariation: 0,
      pathAmplitude: 0,
      color: { r: 0, g: 0, b: 0 }
  };
  
  // Sum all values
  for (let genome of genomes) {
      avg.health += genome.health;
      avg.speed += genome.speed;
      avg.armor += genome.armor;
      avg.size += genome.size;
      avg.pathVariation += genome.pathVariation;
      avg.pathAmplitude += genome.pathAmplitude;
      avg.color.r += genome.color.r;
      avg.color.g += genome.color.g;
      avg.color.b += genome.color.b;
  }
  
  // Calculate averages
  let count = genomes.length;
  avg.health /= count;
  avg.speed /= count;
  avg.armor /= count;
  avg.size /= count;
  avg.pathVariation /= count;
  avg.pathAmplitude /= count;
  avg.color.r /= count;
  avg.color.g /= count;
  avg.color.b /= count;
  
  return avg;
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
  
  if (random() < rate) mutated.health += random(-5, 5);
  if (random() < rate) mutated.speed += random(-0.2, 0.2);
  if (random() < rate) mutated.armor += random(-1, 1);
  if (random() < rate) mutated.size += random(-2, 2);
  if (random() < rate) mutated.pathVariation += random(-0.3, 0.3);
  if (random() < rate) mutated.pathAmplitude += random(-10, 10);
  
  // Color mutations
  if (random() < rate) mutated.color.r += random(-20, 20);
  if (random() < rate) mutated.color.g += random(-20, 20);
  if (random() < rate) mutated.color.b += random(-20, 20);
  
  // Clamp values
  mutated.health = max(15, min(100, mutated.health));
  mutated.speed = max(0.2, min(3, mutated.speed));
  mutated.armor = max(0, min(10, mutated.armor));
  mutated.size = max(8, min(25, mutated.size));
  mutated.pathAmplitude = max(10, min(100, mutated.pathAmplitude));
  
  mutated.color.r = max(50, min(255, mutated.color.r));
  mutated.color.g = max(0, min(255, mutated.color.g));
  mutated.color.b = max(0, min(255, mutated.color.b));
  
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
  
  // Set base and spawn positions
  gameState.basePosition = { x: width - 100, y: height / 2 };
  gameState.spawnPosition = { x: 100, y: height / 2 };
  
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
  
  // Draw base and spawn
  drawBaseAndSpawn();
  
  // Draw infestation
  drawInfestation();
  
  // Handle alien spawning
  handleSpawning();
  
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

function drawBaseAndSpawn() {
  // Draw base
  fill(0, 255, 0);
  stroke(255);
  strokeWeight(3);
  rect(gameState.basePosition.x - 40, gameState.basePosition.y - 40, 80, 80);
  fill(255);
  textAlign(CENTER);
  textSize(12);
  text("BASE", gameState.basePosition.x, gameState.basePosition.y - 5);
  text(`Resources: ${gameState.baseResources}`, gameState.basePosition.x, gameState.basePosition.y + 10);
  
  // Draw spawn point
  fill(255, 0, 0);
  stroke(255);
  strokeWeight(3);
  ellipse(gameState.spawnPosition.x, gameState.spawnPosition.y, 60, 60);
  fill(255);
  text("SPAWN", gameState.spawnPosition.x, gameState.spawnPosition.y);
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
  
  // Debug wave state every 2 seconds
  if (frameCount % 120 === 0) {
    console.log(`🌊 Wave Status: Active=${gameState.waveActive}, Aliens=${aliens.length}, ToSpawn=${aliensToSpawn}`);
  }
  
  // Check wave completion - only end wave if all aliens spawned AND all aliens are gone
  if (gameState.waveActive && aliens.length === 0 && aliensToSpawn === 0) {
      console.log("🏁 Wave complete - ending wave");
      endWave();
  }
  
  // Check game over condition
  if (gameState.baseResources <= 0) {
      fill(255, 0, 0);
      textAlign(CENTER);
      textSize(48);
      text("GAME OVER - BASE DEPLETED!", width/2, height/2);
      noLoop();
  }
}

function drawGame() {
  // Draw towers
  for (let tower of towers) {
      tower.draw();
  }
  
  // Draw aliens with debug info
  for (let i = 0; i < aliens.length; i++) {
      let alien = aliens[i];
      alien.draw();
      
      // Draw path for debugging (only for first 3 aliens to avoid clutter)
      if (i < 3 && alien.path && alien.path.length > 0) {
          stroke(255, 255, 0, 100);
          strokeWeight(2);
          noFill();
          beginShape();
          for (let point of alien.path) {
              vertex(point.x, point.y);
          }
          endShape();
          
          // Draw current target
          fill(255, 0, 255);
          noStroke();
          ellipse(alien.targetX, alien.targetY, 10, 10);
      }
  }
  
  // Draw projectiles
  for (let projectile of projectiles) {
      projectile.draw();
  }
  
  // Draw wave status
  drawWaveStatus();
  
  // Draw debug info
  showWaveDebug();
  
  // Draw spawn and base positions for debugging (more subtle)
  fill(255, 255, 0, 50);
  noStroke();
  ellipse(gameState.spawnPosition.x, gameState.spawnPosition.y, 80, 80);
  ellipse(gameState.basePosition.x, gameState.basePosition.y, 80, 80);
}

function updateUI() {
  if (document.getElementById('wave')) {
    document.getElementById('wave').textContent = gameState.wave;
  }
  if (document.getElementById('energy')) {
    document.getElementById('energy').textContent = gameState.energy;
  }
  if (document.getElementById('aliens')) {
    document.getElementById('aliens').textContent = aliens.length;
  }
  if (document.getElementById('towers')) {
    document.getElementById('towers').textContent = towers.length;
  }
  if (document.getElementById('generation')) {
    document.getElementById('generation').textContent = gameState.generation;
  }
}

// UI Functions
function placeTower(type) {
  gameState.selectedTowerType = type;
}

function startWave() {
  if (gameState.waveActive) {
    console.log("❌ Cannot start wave - already active");
    return;
  }
  
  console.log(`🚀 Starting wave ${gameState.wave}`);
  gameState.waveActive = true;
  
  // Set up spawning parameters
  aliensToSpawn = 3 + gameState.wave; // Reduced count for balance
  spawnTimer = 0;
  spawnDelay = 90; // frames between spawns (longer delay)
  
  console.log(`📋 Will spawn ${aliensToSpawn} aliens with ${spawnDelay} frame delay`);
  console.log(`⏱️ Expected duration: ${(aliensToSpawn * spawnDelay) / 60} seconds`);
}

function handleSpawning() {
  if (gameState.waveActive && aliensToSpawn > 0) {
    spawnTimer++;
    
    // Debug the spawning process
    if (spawnTimer % 30 === 0) { // Every half second
      console.log(`⏰ Spawn timer: ${spawnTimer}/${spawnDelay}, aliens to spawn: ${aliensToSpawn}`);
    }
    
    if (spawnTimer >= spawnDelay) {
      // Spawn an alien
      let genome = random(alienGenomes);
      let newAlien = new Alien(genome);
      aliens.push(newAlien);
      
      // Debug the alien's initial state
      console.log(`✨ Spawned alien ${aliens.length} at (${newAlien.x}, ${newAlien.y})`);
      console.log(`   Target: (${newAlien.targetX}, ${newAlien.targetY})`);
      console.log(`   Path length: ${newAlien.path.length}`);
      console.log(`   State: ${newAlien.state}`);
      
      aliensToSpawn--;
      spawnTimer = 0; // Reset timer
      
      if (aliensToSpawn === 0) {
        console.log("🎯 All aliens spawned for this wave");
      }
    }
  }
}

function endWave() {
  console.log(`🎊 Ending wave ${gameState.wave}`);
  
  gameState.waveActive = false;
  gameState.wave++;
  gameState.energy += 25;
  
  // Reset spawning variables
  aliensToSpawn = 0;
  spawnTimer = 0;
  
  // Collect fitness data from all aliens (dead and alive)
  for (let alien of aliens) {
      fitnessHistory.push({
          genome: alien.genome,
          fitness: alien.fitness
      });
  }
  
  // Clear aliens array
  aliens = [];
  
  // Evolve every wave
  evolvePopulation();
  
  console.log(`✅ Wave ${gameState.wave - 1} completed. Base resources: ${gameState.baseResources}`);
  console.log(`📊 Ready for wave ${gameState.wave}. Press Space to start.`);
}

function drawWaveStatus() {
  // Draw wave status in top right
  fill(255);
  textAlign(RIGHT);
  textSize(14);
  
  let yPos = 30;
  
  if (gameState.waveActive) {
    if (aliensToSpawn > 0) {
      text(`Wave ${gameState.wave} - Spawning: ${aliensToSpawn} left`, width - 20, yPos);
    } else {
      text(`Wave ${gameState.wave} - Active`, width - 20, yPos);
    }
  } else {
    text(`Wave ${gameState.wave} - Ready (Press Space)`, width - 20, yPos);
  }
  
  yPos += 20;
  text(`Aliens alive: ${aliens.length}`, width - 20, yPos);
  
  yPos += 20;
  text(`Spawn: (${gameState.spawnPosition.x}, ${gameState.spawnPosition.y})`, width - 20, yPos);
  
  yPos += 20;
  text(`Base: (${gameState.basePosition.x}, ${gameState.basePosition.y})`, width - 20, yPos);
  
  // Show alien states and positions
  yPos += 20;
  for (let i = 0; i < Math.min(aliens.length, 5); i++) { // Limit to 5 aliens to avoid clutter
      let alien = aliens[i];
      text(`A${i}: ${alien.state} at (${alien.x.toFixed(0)}, ${alien.y.toFixed(0)})`, width - 20, yPos);
      text(`  Target: (${alien.targetX.toFixed(0)}, ${alien.targetY.toFixed(0)})`, width - 20, yPos + 15);
      text(`  PathIdx: ${alien.pathIndex}/${alien.path.length-1}`, width - 20, yPos + 30);
      yPos += 50;
  }
  
  if (aliens.length > 5) {
      text(`... and ${aliens.length - 5} more aliens`, width - 20, yPos);
  }
}

function showWaveDebug() {
  // Draw debug info in top left
  fill(255, 255, 0);
  textAlign(LEFT);
  textSize(12);
  
  let yPos = 20;
  text(`🌊 Wave Debug:`, 20, yPos);
  yPos += 20;
  text(`Active: ${gameState.waveActive}`, 20, yPos);
  yPos += 15;
  text(`Aliens Alive: ${aliens.length}`, 20, yPos);
  yPos += 15;
  text(`To Spawn: ${aliensToSpawn}`, 20, yPos);
  yPos += 15;
  text(`Spawn Timer: ${spawnTimer}/${spawnDelay}`, 20, yPos);
  yPos += 15;
  text(`Wave: ${gameState.wave}`, 20, yPos);
  yPos += 15;
  text(`Generation: ${gameState.generation}`, 20, yPos);
  
  // Show progress bar for spawning
  if (gameState.waveActive && aliensToSpawn > 0) {
    yPos += 20;
    fill(100);
    rect(20, yPos, 200, 10);
    fill(0, 255, 0);
    let progress = spawnTimer / spawnDelay;
    rect(20, yPos, 200 * progress, 10);
    
    fill(255);
    text(`Next spawn in ${spawnDelay - spawnTimer} frames`, 20, yPos + 25);
  }
}

function evolveEnemies() {
  // Manual evolution trigger
  evolvePopulation();
  
  // Spawn new evolved aliens immediately
  let alienCount = 5;
  for (let i = 0; i < alienCount; i++) {
    let genome = random(alienGenomes);
    aliens.push(new Alien(genome));
  }
  
  console.log(`Forced evolution to generation ${gameState.generation}`);
}

function forceSpawnAlien() {
  if (alienGenomes.length > 0) {
      let genome = random(alienGenomes);
      let newAlien = new Alien(genome);
      aliens.push(newAlien);
      console.log(`🚀 Force spawned alien at (${newAlien.x}, ${newAlien.y})`);
      console.log(`   Path: `, newAlien.path);
      return newAlien;
  }
}

function mousePressed() {
  if (gameState.selectedTowerType && mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
      let cost = { laser: 20, plasma: 35, quantum: 50 }[gameState.selectedTowerType];
      
      if (gameState.energy >= cost) {
          // Check if position is valid (not on path, not on existing tower, not near base/spawn)
          let gridX = Math.floor(mouseX / GRID_SIZE);
          let gridY = Math.floor(mouseY / GRID_SIZE);
          
          if (gridX >= 0 && gridX < COLS && gridY >= 0 && gridY < ROWS) {
              let tile = gameGrid[gridY][gridX];
              if (tile.passable) {
                  // Check for existing towers
                  let canPlace = true;
                  
                  // Check distance from other towers
                  for (let tower of towers) {
                      if (dist(tower.x, tower.y, mouseX, mouseY) < 40) {
                          canPlace = false;
                          break;
                      }
                  }
                  
                  // Check distance from base and spawn
                  if (dist(mouseX, mouseY, gameState.basePosition.x, gameState.basePosition.y) < 80 ||
                      dist(mouseX, mouseY, gameState.spawnPosition.x, gameState.spawnPosition.y) < 80) {
                      canPlace = false;
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
  } else if (key === 'f' || key === 'F') {
      forceSpawnAlien(); // Force spawn for testing
  }
}
