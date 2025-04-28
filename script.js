document.addEventListener("DOMContentLoaded", function () {

  const splashScreen = document.getElementById("splashScreen");
  const newScreen = document.getElementById("newScreen");
  const instructionsScreen = document.getElementById("instructionsScreen");
  const gameScreen = document.getElementById("gameScreen");
  const gameInstructionsPopup = document.getElementById("gameInstructionsPopup");
  const levelComplete = document.getElementById("levelComplete");
  const nextLevelBtn = document.getElementById("nextLevelBtn");
  
  const forestCanvas = document.getElementById("forestCanvas");
  const ctx = forestCanvas.getContext("2d");
  
  const title = document.getElementById("title");
  const newTitle = document.getElementById("newTitle");
  const instructionsTitle = document.getElementById("instructionsTitle");

  const asset1 = document.getElementById("asset1");
  const asset2 = document.getElementById("asset2");

  const customCursor = document.getElementById("customCursor");
  
  // New UI elements
  const timerFill = document.getElementById("timerFill");
  const emergencyWarning = document.getElementById("emergencyWarning");
  const windSpeedEl = document.getElementById("windSpeed");
  const windArrow = document.querySelector(".wind-arrow");
  const rainEffect = document.getElementById("rainEffect");
  const droughtEffect = document.getElementById("droughtEffect");
  const lightningFlash = document.getElementById("lightningFlash");
  const newsAlert = document.getElementById("newsAlert");

  // Game state
  let currentLevel = 1;
  let forestHealth = 100;
  let fireControl = 100;
  let biodiversity = 50;
  let treeCount = 0;
  let saplingCount = 0;
  let wildlifeCount = 0;
  
  // Timer variables
  let levelTimeLimit = 60; // seconds
  let levelTimeRemaining = levelTimeLimit;
  let lastTimerUpdate = 0;
  
  // Wind system
  let windDirection = 0; // in radians, 0 = right, PI/2 = down
  let windSpeed = 0; // 0-10 scale
  let windChangeTimer = 0;
  
  // Weather system
  let weatherType = "normal"; // normal, rain, drought
  let weatherIntensity = 0; // 0-10 scale
  let weatherTimer = 0;
  let weatherChangeChance = 0.002; // chance per frame to change weather
  
  // Emergency events
  let emergencyActive = false;
  let emergencyType = null;
  let emergencyTimer = 0;
  let emergencyChance = 0.0005; // chance per frame for emergency event
  
  // News system
  let newsTimer = 0;
  const newsMessages = [
    "BREAKING: Nearby county reports record drought conditions.",
    "ALERT: Wind speeds expected to increase in the next few hours.",
    "WARNING: Lightning storms reported in neighboring regions.",
    "UPDATE: Biodiversity decline affecting multiple forest ecosystems.",
    "REPORT: Climate change increasing wildfire frequency by 25%.",
    "URGENT: Protect wildlife habitats during controlled burns."
  ];
  
  // Game elements
  let trees = [];
  let overgrowth = [];
  let wildlife = [];
  let saplings = [];
  let fires = [];
  let burnedAreas = [];
  
  // Stats for level completion
  let treesSaved = 0;
  let newGrowth = 0;
  let wildlifeProtected = 0;
  
  // Cursor variables
  let isDrawing = false;
  let lastSmokeTime = 0;
  
  // Animation frame ID
  let animationFrameId;

  // Fix for blank screen issue - Add activity tracking
  let lastInteractionTime = Date.now();
  let inactivityTimeout;

  function resizeCanvas() {
    const gameContainer = document.getElementById("gameContainer");
    const forestCanvas = document.getElementById("forestCanvas");
    
    if (gameContainer && forestCanvas) {
      // Get container dimensions
      const containerWidth = gameContainer.clientWidth;
      const containerHeight = gameContainer.clientHeight;
      
      // Store old dimensions to calculate scaling
      const oldWidth = forestCanvas.width;
      const oldHeight = forestCanvas.height;
      
      // Set canvas dimensions to match container
      forestCanvas.width = containerWidth;
      forestCanvas.height = containerHeight;
      
      // Calculate scaling factors
      const scaleX = containerWidth / (oldWidth || 800);
      const scaleY = containerHeight / (oldHeight || 600);
      
      // Rescale all game elements if they exist
      if (typeof trees !== 'undefined' && trees.length > 0) {
        // Rescale tree positions
        trees.forEach(tree => {
          if (oldWidth && oldHeight) {
            tree.x = tree.x * scaleX;
            tree.y = tree.y * scaleY;
          }
        });
        
        // Rescale other game elements
        if (typeof overgrowth !== 'undefined') {
          overgrowth.forEach(brush => {
            if (oldWidth && oldHeight) {
              brush.x = brush.x * scaleX;
              brush.y = brush.y * scaleY;
            }
          });
        }
        
        if (typeof wildlife !== 'undefined') {
          wildlife.forEach(animal => {
            if (oldWidth && oldHeight) {
              animal.x = animal.x * scaleX;
              animal.y = animal.y * scaleY;
            }
          });
        }
        
        if (typeof saplings !== 'undefined') {
          saplings.forEach(sapling => {
            if (oldWidth && oldHeight) {
              sapling.x = sapling.x * scaleX;
              sapling.y = sapling.y * scaleY;
            }
          });
        }
        
        if (typeof fires !== 'undefined') {
          fires.forEach(fire => {
            if (oldWidth && oldHeight) {
              fire.x = fire.x * scaleX;
              fire.y = fire.y * scaleY;
            }
          });
        }
        
        if (typeof burnedAreas !== 'undefined') {
          burnedAreas.forEach(area => {
            if (oldWidth && oldHeight) {
              area.x = area.x * scaleX;
              area.y = area.y * scaleY;
            }
          });
        }
      }
      
      // Redraw if game is active
      if (gameScreen.classList.contains("active") && typeof drawForest === 'function') {
        drawForest();
      }
    }
  }

    // Detect touch devices
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  if (isTouchDevice) {
    // Create mobile controls if they don't exist
    let mobileControls = document.querySelector('.mobile-controls');
    if (!mobileControls) {
      mobileControls = document.createElement('div');
      mobileControls.className = 'mobile-controls';
      
      const burnBtn = document.createElement('button');
      burnBtn.className = 'burn-btn';
      burnBtn.textContent = 'BURN';
      
      // Add touch event to mobile burn button
      burnBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        if (gameScreen.classList.contains("active")) {
          isDrawing = true;
          
          // Create a fire at touch position
          const rect = forestCanvas.getBoundingClientRect();
          const touchX = e.touches[0].clientX - rect.left;
          const touchY = e.touches[0].clientY - rect.top;
          
          if (touchX >= 0 && touchX <= forestCanvas.width && touchY >= 0 && touchY <= forestCanvas.height) {
            createFire(touchX, touchY);
          }
        }
      });
      
      burnBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        isDrawing = false;
      });
      
      mobileControls.appendChild(burnBtn);
      document.getElementById('gameContainer').appendChild(mobileControls);
    }
    
    // Add touch events to the canvas
    forestCanvas.addEventListener('touchstart', function(e) {
      e.preventDefault();
      if (gameScreen.classList.contains("active")) {
        isDrawing = true;
        
        const rect = forestCanvas.getBoundingClientRect();
        const touchX = e.touches[0].clientX - rect.left;
        const touchY = e.touches[0].clientY - rect.top;
        
        if (touchX >= 0 && touchX <= forestCanvas.width && touchY >= 0 && touchY <= forestCanvas.height) {
          createFire(touchX, touchY);
        }
      }
    });
    
    forestCanvas.addEventListener('touchmove', function(e) {
      e.preventDefault();
      if (isDrawing && gameScreen.classList.contains("active")) {
        const now = Date.now();
        const smokeInterval = weatherType === "drought" ? 30 : 50;
        
        if (now - lastSmokeTime > smokeInterval) {
          const rect = forestCanvas.getBoundingClientRect();
          const touchX = e.touches[0].clientX - rect.left;
          const touchY = e.touches[0].clientY - rect.top;
          
          if (touchX >= 0 && touchX <= forestCanvas.width && touchY >= 0 && touchY <= forestCanvas.height) {
            // Spawn smoke effect
            spawnSmoke(e.touches[0].clientX, e.touches[0].clientY);
            lastSmokeTime = now;
            
            // Create fire
            createFire(touchX, touchY);
          }
        }
      }
    });
    
    forestCanvas.addEventListener('touchend', function(e) {
      e.preventDefault();
      isDrawing = false;
    });
  }
  
  // Call resizeCanvas when the game starts
  function startGame() {
    resetGame();
    startLevel();
    resizeCanvas(); // Resize canvas before game loop
    gameLoop();
  }
  
  // Call on load and window resize
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', resizeCanvas);

  function checkActivity() {
    const now = Date.now();
    if (now - lastInteractionTime > 60000) { // 10 seconds of inactivity
      // Pause game loop but keep screens visible
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        showNewsAlert("Game paused due to inactivity. Click anywhere to resume.");
      }
    } else {
      // If game is active screen, ensure animation is running
      if (gameScreen.classList.contains("active") && !animationFrameId) {
        animationFrameId = requestAnimationFrame(gameLoop);
        showNewsAlert("Game resumed!");
      }
    }
    
    // Keep checking activity
    inactivityTimeout = setTimeout(checkActivity, 60000);
  }

  // Start activity checker
  checkActivity();

  // Title wave animation setup
  const titleText = "ReGrow the Forest";
  titleText.split("").forEach((char, index) => {
    const span = document.createElement("span");
    span.textContent = char === " " ? "\u00A0" : char;
    span.style.setProperty("--i", index);
    title.appendChild(span);
  });

  const newTitleText = "Hi there!";
  newTitleText.split("").forEach((char, index) => {
    const span = document.createElement("span");
    span.textContent = char === " " ? "\u00A0" : char;
    span.style.setProperty("--i", index);
    newTitle.appendChild(span);
  });

  const instructionsText = "Forest Care Instructions";
  instructionsText.split("").forEach((char, index) => {
    const span = document.createElement("span");
    span.textContent = char === " " ? "\u00A0" : char;
    span.style.setProperty("--i", index);
    instructionsTitle.appendChild(span);
  });

  // Wave animation
  let waveStep = 0;
  setInterval(() => {
    const titleSpans = title.querySelectorAll("span");
    const newTitleSpans = newTitle.querySelectorAll("span");
    const instructionsSpans = instructionsTitle.querySelectorAll("span");

    [titleSpans, newTitleSpans, instructionsSpans].forEach(spans => {
      spans.forEach((span, index) => {
        const wave = Math.sin(waveStep + index * 0.4) * 10;
        span.style.transform = `translateY(${wave}px)`;
      });
    });

    const imgWave = Math.sin(waveStep) * 10;
    asset1.style.transform = `translateY(${imgWave}px)`;
    asset2.style.transform = `translateY(${imgWave}px)`;

    waveStep += 0.1;
  }, 30);

  // Navigation clicks
  document.getElementById("titleContainer").addEventListener("click", () => {
    lastInteractionTime = Date.now();
    splashScreen.classList.remove("active");
    newScreen.classList.add("active");
  });

  document.getElementById("newScreen").addEventListener("click", () => {
    lastInteractionTime = Date.now();
    newScreen.classList.remove("active");
    instructionsScreen.classList.add("active");
  });

  instructionsTitle.addEventListener("click", () => {
    lastInteractionTime = Date.now();
    instructionsScreen.classList.remove("active");
    gameInstructionsPopup.classList.add("active");
  });
  
  document.getElementById("startGameBtn").addEventListener("click", () => {
    lastInteractionTime = Date.now();
    gameInstructionsPopup.classList.remove("active");
    gameScreen.classList.add("active");
    startGame();
  });
  
  nextLevelBtn.addEventListener("click", () => {
    lastInteractionTime = Date.now();
    levelComplete.style.display = "none";
    currentLevel++;
    document.getElementById("levelIndicator").textContent = `Level ${currentLevel}`;
    resetLevel();
    startLevel();
  });

  document.getElementById("restartGameBtn").addEventListener("click", function() {
    lastInteractionTime = Date.now();
    document.getElementById("gameOverScreen").classList.remove("active");
    resetGame();
    startLevel();
    animationFrameId = requestAnimationFrame(gameLoop);
  });

  // Show news alert
  function showNewsAlert(message) {
    newsAlert.textContent = message;
    newsAlert.classList.add("show");
    
    setTimeout(() => {
      newsAlert.classList.remove("show");
    }, 5000);
  }
  
  // Add game tips function
  function showGameTip() {
    const tips = [
      "TIP: Create controlled burns around overgrown areas to clear them safely.",
      "TIP: Focus on clearing overgrowth to improve biodiversity.",
      "TIP: Be careful burning near trees - they're valuable for forest health!",
      "TIP: Watch the wind direction - fire spreads faster downwind.",
      "TIP: Rain helps control fires while drought makes them more dangerous.",
      "TIP: Wildlife needs protection - avoid burning their habitats.",
      "TIP: Balancing controlled burns improves forest health over time."
    ];
    
    showNewsAlert(tips[Math.floor(Math.random() * tips.length)]);
  }
  
  // Update weather conditions
  function updateWeather() {
    weatherTimer++;
    
    // Check for weather change
    if (Math.random() < weatherChangeChance && weatherTimer > 300) {
      const previousWeather = weatherType;
      
      // Choose new weather
      const weatherOptions = ["normal", "rain", "drought"];
      weatherType = weatherOptions[Math.floor(Math.random() * weatherOptions.length)];
      
      // Don't pick the same weather twice
      if (weatherType === previousWeather) {
        weatherType = weatherOptions[(weatherOptions.indexOf(weatherType) + 1) % weatherOptions.length];
      }
      
      // Set intensity
      weatherIntensity = Math.random() * 5 + 5; // 5-10 scale for stronger effect
      weatherTimer = 0;
      
      // Apply weather effects
      if (weatherType === "rain") {
        rainEffect.style.opacity = weatherIntensity / 10;
        droughtEffect.style.opacity = 0;
        fireControl += weatherIntensity; // Rain helps with fire control
        if (fireControl > 100) fireControl = 100;
        showNewsAlert("Weather changing: Rain is helping control fires but reducing visibility.");
      } else if (weatherType === "drought") {
        rainEffect.style.opacity = 0;
        droughtEffect.style.opacity = weatherIntensity / 10;
        fireControl -= weatherIntensity; // Drought hurts fire control
        if (fireControl < 0) fireControl = 0;
        showNewsAlert("Weather alert: Drought conditions increasing fire danger significantly.");
      } else {
        rainEffect.style.opacity = 0;
        droughtEffect.style.opacity = 0;
        showNewsAlert("Weather update: Conditions returning to normal.");
      }
      
      updateUI();
    }
    
    // Chance for lightning strike during rain
    if (weatherType === "rain" && Math.random() < 0.001 * weatherIntensity) {
      createLightningStrike();
    }
    
    // Weather effects fade over time
    if (weatherType === "normal") {
      if (parseFloat(rainEffect.style.opacity) > 0) {
        rainEffect.style.opacity = Math.max(0, parseFloat(rainEffect.style.opacity) - 0.01);
      }
      if (parseFloat(droughtEffect.style.opacity) > 0) {
        droughtEffect.style.opacity = Math.max(0, parseFloat(droughtEffect.style.opacity) - 0.01);
      }
    }
  }
  
  // Create lightning strike
  function createLightningStrike() {
    // Visual effect
    lightningFlash.style.opacity = 0.8;
    setTimeout(() => {
      lightningFlash.style.opacity = 0;
    }, 100);
    
    // Screen shake
    gameContainer.classList.add("screen-shake");
    setTimeout(() => {
      gameContainer.classList.remove("screen-shake");
    }, 500);
    
    // Create fire at random location
    const x = Math.random() * forestCanvas.width;
    const y = Math.random() * forestCanvas.height;
    
    createFire(x, y, 2); // More intense fire from lightning
    
    showNewsAlert("⚡ LIGHTNING STRIKE! New fire has started!");
  }
  
  // Update wind conditions
  function updateWind() {
    windChangeTimer++;
    
    // Change wind periodically
    if (windChangeTimer > 300) {
      if (Math.random() < 0.05) {
        // Dramatic wind change
        const previousSpeed = windSpeed;
        windSpeed = Math.floor(Math.random() * 10) + 1;
        windDirection = Math.random() * Math.PI * 2;
        
        // Update UI
        windSpeedEl.textContent = getWindSpeedText(windSpeed);
        windArrow.style.transform = `rotate(${windDirection}rad)`;
        
        // Notify if significant change
        if (Math.abs(windSpeed - previousSpeed) > 3 && windSpeed > 5) {
          showNewsAlert(`Wind alert: Strong ${getWindSpeedText(windSpeed).toLowerCase()} winds affecting fire spread!`);
        }
        
        windChangeTimer = 0;
      } else {
        // Subtle wind change
        windSpeed += (Math.random() - 0.5) * 2;
        if (windSpeed < 0) windSpeed = 0;
        if (windSpeed > 10) windSpeed = 10;
        
        windDirection += (Math.random() - 0.5) * 0.5;
        
        // Update UI
        windSpeedEl.textContent = getWindSpeedText(windSpeed);
        windArrow.style.transform = `rotate(${windDirection}rad)`;
      }
    }
  }
  
  // Get text description of wind speed
  function getWindSpeedText(speed) {
    if (speed < 1) return "None";
    if (speed < 3) return "Light";
    if (speed < 6) return "Moderate";
    if (speed < 8) return "Strong";
    return "Severe";
  }
  
  // Update emergency situations
  function updateEmergencies() {
    // Check for new emergency
    if (!emergencyActive && Math.random() < emergencyChance * currentLevel) {
      // Start emergency
      emergencyActive = true;
      emergencyTimer = 600; // 10 seconds at 60fps
      
      // Choose emergency type
      const emergencyTypes = ["wildfire", "drought", "infestation", "storm"];
      emergencyType = emergencyTypes[Math.floor(Math.random() * emergencyTypes.length)];
      
      // Apply emergency effects
      if (emergencyType === "wildfire") {
        emergencyWarning.textContent = "WILDFIRE APPROACHING!";
        emergencyWarning.style.display = "block";
        // Create several fires at edge of map
        const edgeSide = Math.floor(Math.random() * 4);
        for (let i = 0; i < 5; i++) {
          let x, y;
          if (edgeSide === 0) { // Top
            x = Math.random() * forestCanvas.width;
            y = 20;
          } else if (edgeSide === 1) { // Right
            x = forestCanvas.width - 20;
            y = Math.random() * forestCanvas.height;
          } else if (edgeSide === 2) { // Bottom
            x = Math.random() * forestCanvas.width;
            y = forestCanvas.height - 20;
          } else { // Left
            x = 20;
            y = Math.random() * forestCanvas.height;
          }
          createFire(x, y, 3); // Intense fire
        }
        showNewsAlert("EMERGENCY: Wildfire approaching from neighboring forest! Act quickly!");
      } else if (emergencyType === "drought") {
        emergencyWarning.textContent = "EXTREME DROUGHT!";
        emergencyWarning.style.display = "block";
        droughtEffect.style.opacity = 0.6;
        fireControl -= 30;
        if (fireControl < 0) fireControl = 0;
        updateUI();
        showNewsAlert("EMERGENCY: Extreme drought conditions! Fire danger critical!");
      } else if (emergencyType === "infestation") {
        emergencyWarning.textContent = "BARK BEETLE INFESTATION!";
        emergencyWarning.style.display = "block";
        // Damage random trees
        trees.forEach(tree => {
          if (Math.random() < 0.3) {
            tree.health -= 40;
          }
        });
        forestHealth -= 15;
        if (forestHealth < 0) forestHealth = 0;
        updateUI();
        showNewsAlert("EMERGENCY: Bark beetle infestation detected! Trees weakening rapidly!");
      } else if (emergencyType === "storm") {
        emergencyWarning.textContent = "INCOMING STORM!";
        emergencyWarning.style.display = "block";
        // Increase wind dramatically
        windSpeed = 10;
        windDirection = Math.random() * Math.PI * 2;
        windSpeedEl.textContent = getWindSpeedText(windSpeed);
        windArrow.style.transform = `rotate(${windDirection}rad)`;
        
        // Create occasional lightning strikes
        const stormInterval = setInterval(() => {
          if (Math.random() < 0.3) {
            createLightningStrike();
          }
        }, 2000);
        
        // Clear interval when emergency ends
        setTimeout(() => {
          clearInterval(stormInterval);
        }, 10000);
        
        showNewsAlert("EMERGENCY: Severe thunderstorm approaching! Lightning strikes imminent!");
      }
    }
    
    // Update active emergency
    if (emergencyActive) {
      emergencyTimer--;
      
      // Flash warning text
      if (emergencyTimer % 30 < 15) {
        emergencyWarning.style.color = "#F44336";
      } else {
        emergencyWarning.style.color = "#FFD700";
      }
      
      // End emergency
      if (emergencyTimer <= 0) {
        emergencyActive = false;
        emergencyWarning.style.display = "none";
        
        // Clear emergency effects
        if (emergencyType === "drought") {
          droughtEffect.style.opacity = 0;
          showNewsAlert("Drought emergency has ended. Conditions returning to normal.");
        } else if (emergencyType === "storm") {
          windSpeed = Math.random() * 3;
          windSpeedEl.textContent = getWindSpeedText(windSpeed);
          showNewsAlert("Storm has passed. Wind conditions stabilizing.");
        } else {
          showNewsAlert("Emergency situation contained. Stay vigilant.");
        }
      }
    }
  }
  
  // Normalize angle to 0-2π range
  function normalizeAngle(angle) {
    while (angle < 0) angle += 2 * Math.PI;
    while (angle >= 2 * Math.PI) angle -= 2 * Math.PI;
    return angle;
  }
  
  // Update timer with more generous timing
  function updateTimer() {
    // Update timer every second
    const now = Date.now();
    if (now - lastTimerUpdate >= 1000) {
      levelTimeRemaining--;
      const percentRemaining = (levelTimeRemaining / levelTimeLimit) * 100;
      timerFill.style.width = `${percentRemaining}%`;
      
      // Change color based on time remaining
      if (percentRemaining < 20) {
        timerFill.style.backgroundColor = "#F44336"; // Red
      } else if (percentRemaining < 50) {
        timerFill.style.backgroundColor = "#FFC107"; // Yellow
      } else {
        timerFill.style.backgroundColor = "#4CAF50"; // Green
      }
      
      // Warning when time is low
      if (levelTimeRemaining <= 10 && levelTimeRemaining > 0) {
        showNewsAlert(`WARNING: Only ${levelTimeRemaining} seconds remaining!`);
      }
      
      lastTimerUpdate = now;
      
      // Time's up
      if (levelTimeRemaining <= 0) {
        timeUp();
      }
    }
  }
  
  function timeUp() {
    // Check if objectives are met - more forgiving conditions
    const objectivesMet = biodiversity >= 60 && trees.length >= 5 + currentLevel;
    
    if (objectivesMet) {
      // Level complete despite time running out
      document.getElementById("treesSaved").textContent = treesSaved;
      document.getElementById("newGrowth").textContent = newGrowth;
      document.getElementById("wildlifeProtected").textContent = wildlife.length;
      
      levelComplete.style.display = "block";
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    } else {
      // First time running out - give extension
      if (levelTimeRemaining === 0) {
        levelTimeRemaining = 30; // Extra 30 seconds
        showNewsAlert("Time extension granted! You have 30 more seconds to complete your objectives.");
      } else {
        // Second time running out - game over
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        
        document.getElementById("finalForestHealth").textContent = `${Math.round(forestHealth)}%`;
        document.getElementById("finalBiodiversity").textContent = `${Math.round(biodiversity)}%`;
        document.getElementById("finalTreesSaved").textContent = treesSaved;
        
        document.getElementById("gameOverScreen").classList.add("active");
        showNewsAlert("Time's up! The forest management has failed.");
      }
    }
  }

  // Game initialization
  function startGame() {
    resetGame();
    startLevel();
    gameLoop();
  }
  
  function resetGame() {
    currentLevel = 1;
    document.getElementById("levelIndicator").textContent = `Level ${currentLevel}`;
    
    forestHealth = 100;
    fireControl = 100;
    biodiversity = 50;
    
    // Reset time
    levelTimeLimit = 60;
    levelTimeRemaining = levelTimeLimit;
    lastTimerUpdate = Date.now();
    
    // Reset weather
    weatherType = "normal";
    weatherIntensity = 0;
    rainEffect.style.opacity = 0;
    droughtEffect.style.opacity = 0;
    
    // Reset wind
    windSpeed = 0;
    windDirection = 0;
    windSpeedEl.textContent = getWindSpeedText(windSpeed);
    windArrow.style.transform = `rotate(${windDirection}rad)`;
    
    // Reset emergencies
    emergencyActive = false;
    emergencyWarning.style.display = "none";
    
    updateUI();
  }
  
  // Improved resetLevel function with better starting conditions
  function resetLevel() {
    // Clear all elements
    trees = [];
    overgrowth = [];
    wildlife = [];
    saplings = [];
    fires = [];
    burnedAreas = [];
    
    // Reset stats
    treesSaved = 0;
    newGrowth = 0;
    wildlifeProtected = 0;
    
    // Reset metrics but make them more manageable with each level
    forestHealth = 100;
    fireControl = 100;
    biodiversity = 50 + (currentLevel * 3); // Starting higher - was 40 + (currentLevel * 5)
    if (biodiversity > 100) biodiversity = 100;
    
    // Reset timer with more time for each level
    levelTimeLimit = Math.max(45, 90 - (currentLevel * 5)); // More time - was max(30, 60-(currentLevel*5))
    levelTimeRemaining = levelTimeLimit;
    lastTimerUpdate = Date.now();
    
    // Reset weather
    weatherType = "normal";
    weatherIntensity = 0;
    rainEffect.style.opacity = 0;
    droughtEffect.style.opacity = 0;
    
    // Reset wind to be more manageable in higher levels
    windSpeed = Math.min(Math.max(0, currentLevel - 2), 3); // Lower wind speed - was min(currentLevel-1, 5)
    windDirection = Math.random() * Math.PI * 2;
    windSpeedEl.textContent = getWindSpeedText(windSpeed);
    windArrow.style.transform = `rotate(${windDirection}rad)`;
    
    // Reset emergencies
    emergencyActive = false;
    emergencyWarning.style.display = "none";
    emergencyChance = 0.0003 * currentLevel; // Reduced from 0.0005
    
    updateUI();
  }
  
  // Improved startLevel function with better initial conditions
  function startLevel() {
    // Generate trees
    const treeCount = 15 + (currentLevel * 2); // Reduced from 3 trees per level
    for (let i = 0; i < treeCount; i++) {
      trees.push({
        x: Math.random() * (forestCanvas.width - 60) + 30,
        y: Math.random() * (forestCanvas.height - 100) + 70,
        health: 100,
        age: Math.floor(Math.random() * 4) + 1,  // 1-4 age groups
        scale: (Math.random() * 0.5) + 0.8,      // Random size variation
        burning: false
      });
    }
    
    // Generate overgrowth - reduced amount for easier management
    const overgrowthCount = 15 + (currentLevel * 3); // Reduced from 20 + (currentLevel * 5)
    for (let i = 0; i < overgrowthCount; i++) {
      overgrowth.push({
        x: Math.random() * (forestCanvas.width - 80) + 40,
        y: Math.random() * (forestCanvas.height - 80) + 40,
        density: Math.floor(Math.random() * 2) + 1,  // 1-2 density levels - was 1-3
        burning: false
      });
    }
    
    // Generate wildlife
    const wildlifeCount = 5 + currentLevel;
    for (let i = 0; i < wildlifeCount; i++) {
      wildlife.push({
        x: Math.random() * (forestCanvas.width - 60) + 30,
        y: Math.random() * (forestCanvas.height - 60) + 30,
        type: Math.floor(Math.random() * 3),  // Different wildlife types
        moveDirection: Math.random() * Math.PI * 2,
        moveSpeed: Math.random() * 0.5 + 0.2,
        scared: false
      });
    }
    
    // Show level start news with tips
    showNewsAlert(`Level ${currentLevel} started: You have ${levelTimeLimit} seconds to restore forest health! Clear overgrowth to increase biodiversity.`);
  }
  
  function updateUI() {
    document.getElementById("forestHealth").style.width = `${forestHealth}%`;
    document.getElementById("fireControl").style.width = `${fireControl}%`;
    document.getElementById("biodiversity").style.width = `${biodiversity}%`;
    
    // Change colors based on values
    if (forestHealth < 30) {
      document.getElementById("forestHealth").style.backgroundColor = "#F44336";
    } else if (forestHealth < 60) {
      document.getElementById("forestHealth").style.backgroundColor = "#FFC107";
    } else {
      document.getElementById("forestHealth").style.backgroundColor = "#4CAF50";
    }
    
    if (fireControl < 30) {
      document.getElementById("fireControl").style.backgroundColor = "#F44336";
    } else if (fireControl < 60) {
      document.getElementById("fireControl").style.backgroundColor = "#FFC107";
    } else {
      document.getElementById("fireControl").style.backgroundColor = "#FF9800";
    }
  }
  
  // Add this new function to boost biodiversity
  function boostBiodiversity(amount) {
    biodiversity += amount;
    if (biodiversity > 100) biodiversity = 100;
    updateUI();
    
    // Show feedback to the player
    if (amount >= 1) {
      showNewsAlert(`Biodiversity increased by ${amount.toFixed(1)}%!`);
    }
  }
  
  // Improved game loop with better balance
  function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, forestCanvas.width, forestCanvas.height);
    
    // Update game state with improved mechanics
    updateGameState();
    
    // Update timer with more generous timing
    updateTimer();
    
    // Update weather with more balanced effects
    updateWeather();
    
    // Update wind with improved mechanics
    updateWind();
    
    // Update emergencies with better balance
    updateEmergencies();
    
    // Show periodic tips/news
    if (Math.random() < 0.001) {
      showGameTip();
    }
    
    // Draw all elements
    drawForest();
    
    // Small chance for natural biodiversity increase
    if (Math.random() < 0.01) {
      boostBiodiversity(0.3);
    }
    
    // Check win/lose conditions with improved balance
    checkGameConditions();
    
    // Continue the loop
    animationFrameId = requestAnimationFrame(gameLoop);
  }

  function checkGameConditions() {
    // Check if level is lost (forest health too low)
    if (forestHealth <= 0) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
      
      // Show game over screen instead of alert
      document.getElementById("finalForestHealth").textContent = "0%";
      document.getElementById("finalBiodiversity").textContent = `${Math.round(biodiversity)}%`;
      document.getElementById("finalTreesSaved").textContent = treesSaved;
      
      document.getElementById("gameOverScreen").classList.add("active");
      return;
    }
    
    // Check if level is won (biodiversity high enough with enough trees)
    if (biodiversity >= 70 && trees.length >= 5 + currentLevel) { // Easier requirement
      // Level complete!
      document.getElementById("treesSaved").textContent = treesSaved;
      document.getElementById("newGrowth").textContent = newGrowth;
      document.getElementById("wildlifeProtected").textContent = wildlife.length;
      
      levelComplete.style.display = "block";
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  function updateGameState() {
    // Update wildlife movement
    wildlife.forEach(animal => {
      // Change direction occasionally
      if (Math.random() < 0.02) {
        animal.moveDirection = Math.random() * Math.PI * 2;
      }
      
      // Move based on direction
      animal.x += Math.cos(animal.moveDirection) * animal.moveSpeed;
      animal.y += Math.sin(animal.moveDirection) * animal.moveSpeed;
      
      // Boundary check
      if (animal.x < 0) animal.x = 0;
      if (animal.x > forestCanvas.width - 30) animal.x = forestCanvas.width - 30;
      if (animal.y < 0) animal.y = 0;
      if (animal.y > forestCanvas.height - 30) animal.y = forestCanvas.height - 30;
      
      // Update burning overgrowth
      for (let i = overgrowth.length - 1; i >= 0; i--) {
        if (overgrowth[i].burning) {
          // Burn rate based on weather
          let burnRate = 0.05;
          if (weatherType === "drought") burnRate *= 1.5;
          if (weatherType === "rain") burnRate *= 0.6;
          
          overgrowth[i].density -= burnRate;
          
          if (overgrowth[i].density <= 0) {
            // Overgrowth is cleared
            burnedAreas.push({
              x: overgrowth[i].x,
              y: overgrowth[i].y,
              age: 0
            });
            
            overgrowth.splice(i, 1);
            
            // Increase biodiversity when overgrowth is cleared properly
            boostBiodiversity(3.0);
          }
        }
      }
      
      // Run away from fire
      fires.forEach(fire => {
        const dx = animal.x - fire.x;
        const dy = animal.y - fire.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 80) {  // If fire is close
          animal.scared = true;
          
          // Show warning above animal
          const warningEl = document.createElement("div");
          warningEl.classList.add("animal-warning");
          warningEl.textContent = "!";
          warningEl.style.left = `${animal.x + forestCanvas.getBoundingClientRect().left}px`;
          warningEl.style.top = `${animal.y + forestCanvas.getBoundingClientRect().top - 20}px`;
          document.body.appendChild(warningEl);
          
          setTimeout(() => {
            warningEl.remove();
          }, 1000);
          
          // Run in opposite direction
          animal.moveDirection = Math.atan2(dy, dx);
          animal.moveSpeed = 2;
        } else {
          animal.scared = false;
          animal.moveSpeed = Math.random() * 0.5 + 0.2;
        }
      });
    });
    
    // Update fires with better wind influence and more balanced spread
    for (let i = fires.length - 1; i >= 0; i--) {
      fires[i].ttl--;
      
      // Balance fire duration based on weather
      if (weatherType === "drought") {
        fires[i].ttl -= 0.2 * weatherIntensity / 10; // Reduced effect - was 0.5
      } else if (weatherType === "rain") {
        fires[i].ttl -= 1.5 * weatherIntensity / 10; // Reduced effect - was 2
      }
      
      if (fires[i].ttl <= 0) {
        // Add biodiversity boost when fires burn out naturally
        boostBiodiversity(1.5);
        
        // Convert to burned area
        burnedAreas.push({
          x: fires[i].x,
          y: fires[i].y,
          age: 0
        });
        
        fires.splice(i, 1);
      } else {
        // Wind influence on fire spread - reduced to make game more manageable
        const spreadDistance = 30 + (windSpeed * 3); // Reduced from 40 + (windSpeed * 4)
        const windAngleInfluence = 0.5; // Reduced from 0.6
        
        // Reduce spread probability to make game easier
        const baseSpreadChance = 0.02; // Reduced from 0.05
        
        // Check for spread to nearby overgrowth and trees with wind direction influence
        overgrowth.forEach(brush => {
          if (!brush.burning) {
            // Calculate distance with wind direction influence
            const dx = brush.x - fires[i].x;
            const dy = brush.y - fires[i].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Calculate angle between fire and brush
            const angle = Math.atan2(dy, dx);
            
            // Calculate angle difference (how aligned with wind direction)
            let angleDiff = Math.abs(normalizeAngle(angle - windDirection));
            if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
            
            // Increased spread chance in wind direction - reduced for better balance
            const spreadChance = baseSpreadChance + (windSpeed / 30) * (1 - (angleDiff / Math.PI) * windAngleInfluence);
            
            if (distance < spreadDistance && Math.random() < spreadChance) {
              // Start burning
              brush.burning = true;
              
              // Create new fire at this location
              fires.push({
                x: brush.x,
                y: brush.y,
                intensity: fires[i].intensity,
                ttl: 100
              });
              
              // Reduce fire control for each new spread - less severe penalty
              fireControl -= 0.2; // Reduced from 0.5
              if (fireControl < 0) fireControl = 0;
              updateUI();
            }
          }
        });
        
        // Reduce tree burning chance for better balance
        trees.forEach(tree => {
          if (!tree.burning) {
            const dx = tree.x - fires[i].x;
            const dy = tree.y - fires[i].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Calculate angle between fire and tree
            const angle = Math.atan2(dy, dx);
            
            // Calculate angle difference (how aligned with wind direction)
            let angleDiff = Math.abs(normalizeAngle(angle - windDirection));
            if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
            
            // Reduced spread chance to trees - make it less common
            const spreadChance = 0.01 + (windSpeed / 40) * (1 - (angleDiff / Math.PI) * windAngleInfluence);
            
            if (distance < spreadDistance && Math.random() < spreadChance) {
              // Start burning
              tree.burning = true;
              
              // Create new fire at this location
              fires.push({
                x: tree.x,
                y: tree.y,
                intensity: fires[i].intensity,
                ttl: 150
              });
              
              // Reduce forestHealth for burning trees - less severe
              forestHealth -= 1; // Reduced from 2
              if (forestHealth < 0) forestHealth = 0;
              updateUI();
            }
          }
        });
      }
    }
    
    // Update burning trees
    for (let i = trees.length - 1; i >= 0; i--) {
      if (trees[i].burning) {
        // Damage based on fire intensity and weather
        let damageRate = 1;
        if (weatherType === "drought") damageRate *= 1.5;
        if (weatherType === "rain") damageRate *= 0.7;
        
        trees[i].health -= damageRate;
        
        if (trees[i].health <= 0) {
          // Tree is destroyed
          burnedAreas.push({
            x: trees[i].x,
            y: trees[i].y,
            age: 0
          });
          
          trees.splice(i, 1);
        }
      }
    }
    
    // Age burned areas and potentially spawn saplings
    for (let i = burnedAreas.length - 1; i >= 0; i--) {
      burnedAreas[i].age++;
      
      // After some time, burned areas can spawn saplings
      if (burnedAreas[i].age > 250 && Math.random() < 0.01) { // Reduced time and increased chance
        saplings.push({
          x: burnedAreas[i].x + (Math.random() * 20 - 10),
          y: burnedAreas[i].y + (Math.random() * 20 - 10),
          age: 0,
          growth: 0
        });
        
        newGrowth++;
        
        // Increase biodiversity for new growth
        boostBiodiversity(1.0);
        
        // Remove the burned area
        burnedAreas.splice(i, 1);
      }
      
      // Eventually, burned areas disappear
      if (burnedAreas[i].age > 400) { // Reduced time for cleanup
        burnedAreas.splice(i, 1);
      }
    }
    
    // Grow saplings into trees
    for (let i = saplings.length - 1; i >= 0; i--) {
      saplings[i].age++;
      
      // Growth rate affected by weather
      let growthRate = 1.5; // Faster base growth rate
      if (weatherType === "rain") growthRate = 2.5; // Even faster in rain
      if (weatherType === "drought") growthRate = 0.8; // Slower but still possible in drought
      
      saplings[i].growth = Math.min(1, (saplings[i].age * growthRate) / 350); // Reduced time to grow
      
      // When fully grown, convert to a tree
      if (saplings[i].growth >= 1) {
        trees.push({
          x: saplings[i].x,
          y: saplings[i].y,
          health: 100,
          age: 1,
          scale: 0.8,
          burning: false
        });
        
        saplings.splice(i, 1);
        treesSaved++;
        
        // Increase forest health and biodiversity for new trees
        forestHealth += 2; // Increased bonus
        if (forestHealth > 100) forestHealth = 100;
        
        boostBiodiversity(2.0); // Boost biodiversity for tree growth
        updateUI();
      }
    }
    
    // Natural forest health decline - slower than before
    let healthDeclineRate = 0.005; // Reduced from 0.01
    if (weatherType === "drought") healthDeclineRate *= 1.5; // Reduced multiplier
    healthDeclineRate *= (1 + (currentLevel * 0.1)); // Reduced multiplier
    
    forestHealth -= healthDeclineRate;
    if (forestHealth < 0) forestHealth = 0;
    
    // Natural fire control recovery - improved rates
    let fireControlRecoveryRate = 0.1; // Increased from 0.05
    if (weatherType === "drought") fireControlRecoveryRate *= 0.6; // Less reduction
    if (weatherType === "rain") fireControlRecoveryRate *= 2.0; // More increase
    
    fireControl += fireControlRecoveryRate;
    if (fireControl > 100) fireControl = 100;
    
    // Natural biodiversity decline due to overgrowth - slower rate
    let biodiversityDeclineRate = 0.01 * (1 + (currentLevel * 0.05)); // Reduced from 0.02
    biodiversity -= biodiversityDeclineRate;
    if (biodiversity < 0) biodiversity = 0;
    
    updateUI();
  }})