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