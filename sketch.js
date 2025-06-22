let grid; // Cellular Automata grid
let aliens = []; // Array to store alien entities
let player; // Player object
let map; // Map generated using Wave Function Collapse
let generation = 0; // Current generation for Genetic Algorithm

function setup() {
  createCanvas(800, 600);
  grid = createGrid(20, 15); // Initialize Cellular Automata grid
  map = generateMap(); // Generate map using Wave Function Collapse
  player = new Player(width / 2, height - 50); // Initialize player
  spawnAliens(); // Spawn initial alien swarm
}

function draw() {
  background(0);
  drawMap(); // Render the map
  updateGrid(); // Update Cellular Automata
  updateAliens(); // Update alien swarm
  player.update(); // Update player
  player.display(); // Display player
  checkCollisions(); // Check for collisions
}

function createGrid(cols, rows) {
  let grid = [];
  for (let i = 0; i < rows; i++) {
    grid[i] = [];
    for (let j = 0; j < cols; j++) {
      grid[i][j] = random() > 0.8 ? 1 : 0; // Randomly initialize infestation
    }
  }
  return grid;
}

function updateGrid() {
  // Placeholder for Cellular Automata logic
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      // Example rule: Spread infestation
      if (grid[i][j] === 1 && random() > 0.7) {
        if (i > 0) grid[i - 1][j] = 1;
        if (i < grid.length - 1) grid[i + 1][j] = 1;
        if (j > 0) grid[i][j - 1] = 1;
        if (j < grid[i].length - 1) grid[i][j + 1] = 1;
      }
    }
  }
}

function generateMap() {
  // Placeholder for Wave Function Collapse logic
  let map = [];
  for (let i = 0; i < 20; i++) {
    map[i] = [];
    for (let j = 0; j < 15; j++) {
      map[i][j] = random() > 0.5 ? 1 : 0; // Randomly generate terrain
    }
  }
  return map;
}

function drawMap() {
  for (let i = 0; i < map.length; i++) {
    for (let j = 0; j < map[i].length; j++) {
      fill(map[i][j] === 1 ? 100 : 50);
      rect(j * 40, i * 40, 40, 40);
    }
  }
}

function spawnAliens() {
  // Placeholder for Genetic Algorithm logic
  for (let i = 0; i < 10; i++) {
    aliens.push(new Alien(random(width), random(height / 2)));
  }
}

function updateAliens() {
  for (let alien of aliens) {
    alien.update();
    alien.display();
  }
}

function checkCollisions() {
  for (let alien of aliens) {
    if (dist(player.x, player.y, alien.x, alien.y) < 20) {
      console.log("Collision detected!");
      // Handle collision (e.g., reduce player health)
    }
  }
}

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = 5;
  }

  update() {
    if (keyIsDown(LEFT_ARROW)) this.x -= this.speed;
    if (keyIsDown(RIGHT_ARROW)) this.x += this.speed;
    if (keyIsDown(UP_ARROW)) this.y -= this.speed;
    if (keyIsDown(DOWN_ARROW)) this.y += this.speed;
  }

  display() {
    fill(255);
    ellipse(this.x, this.y, 20, 20);
  }
}

class Alien {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = random(1, 3);
  }

  update() {
    this.y += this.speed; // Move downward
    if (this.y > height) this.y = 0; // Reset position if out of bounds
  }

  display() {
    fill(255, 0, 0);
    ellipse(this.x, this.y, 20, 20);
  }
}

