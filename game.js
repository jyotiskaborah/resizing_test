const app = new PIXI.Application({
    resizeTo: window,
    backgroundColor: 0x222222,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
});

document.getElementById('game-container').appendChild(app.view);

let gameArea = new PIXI.Container();
app.stage.addChild(gameArea);

const gameWidth = 800;
const gameHeight = 1200;

//------------------------    Game state    ------------------------
const maxTime = 10;
const totalStars = 3;
const maxLives = 3;
let currentLevel = 0;
let selectedIndices = [];
let correctPosition = [];
let isPaused = true;
let timerRunning = false; //change to false in production.
// Timer state for countdown
let timeLeft = maxTime;
let lastTimerUpdate = Date.now();
let levelStartTime = Date.now(); // <-- Add this declaration
let isLoading = false;
let correctWord = '';
// Life system
let remainingLives = maxLives;
let lifeDisplayContainer = null;
let totalStarsAchieved = 0;




//------------------------     UI state     ------------------------
const padding = 30;
const popupPadding = 60;
const fontSize = 25;
const uiFontSize = 30; // UI element font size
const btnfontsize = 30;
const stackFontsize = 40;
const rowHeight = 100;
const stackWidth = 100;
const boxWidth = 100;
const snapDuration = 200;
const buttonWidth = 360;
const buttonHeight = 80;

//------------------------     Container and button state     ------------------------
let mainContainer, homeContainer, uiContainer, playPauseButton, timerText, levelText, loadingScreen, popupTray;

// Sound Effects using HTML5 Audio
const scrollSound = new Audio('assets/scroll.mp3');
const winSound = new Audio('assets/win.mp3');
const loseSound = new Audio('assets/lose.mp3');
const gameOverSound = new Audio('assets/gameover.mp3'); // Using lose sound for game over
scrollSound.volume = 0.5; // Quieter for repeated scrolling
winSound.volume = 0.8;   // Louder for one-time win
loseSound.volume = 0.8;  // Louder for one-time lose
gameOverSound.volume = 0.9; // Slightly louder for game over

// Sound state
let isMuted = false;
let speakerButton = null;

// Function to toggle sound mute
function toggleSound() {
    isMuted = !isMuted;
    
    // Update all audio volumes
    const volume = isMuted ? 0 : 0.5;
    scrollSound.volume = volume;
    winSound.volume = isMuted ? 0 : 0.8;
    loseSound.volume = isMuted ? 0 : 0.8;
    gameOverSound.volume = isMuted ? 0 : 0.9;
    
    // Update speaker button icon
    if (speakerButton) {
        const iconPath = isMuted ? 'assets/mute.png' : 'assets/speaker.png';
        speakerButton.texture = PIXI.Texture.from(iconPath);
    }
}


const gameBox = new PIXI.Graphics();
gameBox.beginFill(0x224444, 0.80);
gameBox.drawRect(0, 0, gameWidth, gameHeight);
gameBox.endFill();
gameArea.addChild(gameBox);

gameArea.x = (app.screen.width - gameWidth) / 2;
gameArea.y = (app.screen.height - gameHeight) / 2;



function scaleGameArea() {
    const scaleX = app.screen.width / gameWidth;
    const scaleY = app.screen.height / gameHeight;
    const scale = Math.min(scaleX, scaleY);

    gameArea.scale.set(scale);
    gameArea.x = (app.screen.width - gameWidth * scale) / 2;
    gameArea.y = (app.screen.height - gameHeight * scale) / 2;
}

window.addEventListener('resize', scaleGameArea);
scaleGameArea();  // run at starting atleast for one time.

// Load Fonts
console.log('Attempting to load WebFont');
if (typeof WebFont !== 'undefined') {
    WebFont.load({
        google: { families: ['Noto Sans Bengali'] },
        active: () => {
            console.log('WebFont loaded successfully');
            initializeGame();
        },
        inactive: () => {
            console.error('WebFont failed to load, proceeding with fallback');
            initializeGame();
        }
    });
} else {
    console.error('WebFont Loader not available, using fallback');
    initializeGame();
}

function initializeGame() {
    console.log('Initializing game');
    setupHomeScene();
    setupUiScene();
    setupPopupTray();
}

function setupPopupTray() {
    popupTray = new PIXI.Container();
    gameArea.addChild(popupTray);
    ensurePopupTrayOnTop();
}

// Helper functions to manage popup stack
function showPopup(popup, parentPopup = null) {
    // Hide parent popup if exists
    if (parentPopup) {
        parentPopup.visible = false;
    }
    
    // Add to popup stack
    popupStack.push({ popup, parentPopup });
    
    // Show the new popup
    popup.visible = true;
    
    // Ensure popupTray stays on top
    ensurePopupTrayOnTop();
}

function hidePopup(popup) {
    // Find and remove from popup stack
    const index = popupStack.findIndex(item => item.popup === popup);
    if (index !== -1) {
        const stackItem = popupStack[index];
        popupStack.splice(index, 1);
        
        // Hide current popup
        popup.visible = false;
        
        // Show parent popup if exists
        if (stackItem.parentPopup) {
            stackItem.parentPopup.visible = true;
        }
    }
}

function hideAllPopups() {
    // Hide all popups and clear stack
    popupStack.forEach(item => {
        item.popup.visible = false;
    });
    popupStack = [];
}

// Helper function to ensure popupTray is always rendered on top within gameArea
function ensurePopupTrayOnTop() {
    if (popupTray && popupTray.parent === gameArea) {
        gameArea.setChildIndex(popupTray, gameArea.children.length - 1);
    }
}

function setupHomeScene() {
    homeContainer = new PIXI.Container();
    gameArea.addChild(homeContainer);
    homeContainer.visible = true; //remove in production.
    // Ensure popupTray stays on top
    ensurePopupTrayOnTop();

    const bg = new PIXI.Graphics();
    bg.beginFill(0xcccc99);
    bg.drawRect(0, 0, gameWidth, gameHeight);
    bg.endFill();
    homeContainer.addChild(bg);

    const logoTexture = PIXI.Texture.from('assets/logo.png');
    const logo = new PIXI.Sprite(logoTexture);
    logo.anchor.set(0.5);
    logo.position.set(gameWidth / 2, gameHeight * 0.30);
    logo.scale.set(1.40);
    homeContainer.addChild(logo);

    const startButton = createButton('Start Game', gameWidth / 2, gameHeight * 0.5, startGame);
    homeContainer.addChild(startButton);

    const howtoPlayButton = createButton('How to Play', gameWidth / 2, gameHeight * 0.65, () => {
        showHowToPlayPopup();
    });
    homeContainer.addChild(howtoPlayButton);

    // Add help icon at right bottom corner
    const helpIcon = PIXI.Sprite.from('assets/help.png');
    helpIcon.width = uiFontSize * 1.5;
    helpIcon.height = uiFontSize * 1.5;
    helpIcon.anchor.set(1, 1); // Bottom-right anchor
    helpIcon.position.set(gameWidth - padding, gameHeight - padding);
    helpIcon.eventMode = 'static';
    helpIcon.cursor = 'pointer';
    helpIcon.on('pointerdown', showHelpPopup);
    homeContainer.addChild(helpIcon);

    // Add speaker button at left bottom corner
    const homeSpeakerButton = PIXI.Sprite.from('assets/speaker.png');
    homeSpeakerButton.width = uiFontSize * 1.5;
    homeSpeakerButton.height = uiFontSize * 1.5;
    homeSpeakerButton.anchor.set(0, 1); // Bottom-left anchor
    homeSpeakerButton.position.set(padding, gameHeight - padding);
    homeSpeakerButton.eventMode = 'static';
    homeSpeakerButton.cursor = 'pointer';
    homeSpeakerButton.on('pointerdown', () => {
        toggleSound();
        // Update home screen speaker button too
        const iconPath = isMuted ? 'assets/mute.png' : 'assets/speaker.png';
        homeSpeakerButton.texture = PIXI.Texture.from(iconPath);
    });
    homeContainer.addChild(homeSpeakerButton);
}

function createButton(label, x, y, onClick) {
    const button = new PIXI.Container();
    button.eventMode = 'static';
    button.cursor = 'pointer';

    const count = (label.match(/\n/g) || []).length;
    bHeight = buttonHeight + count * 20;

    const bg = new PIXI.Graphics();
    bg.beginFill(0x4CAF50);
    bg.drawRoundedRect(-buttonWidth / 2, -bHeight / 2, buttonWidth, bHeight, 30);
    bg.endFill();
    button.addChild(bg);

    const text = new PIXI.Text(label, { 
        fontFamily: 'Noto Sans Bengali, Arial', 
        fill: 'white', 
        align: 'center',
        fontSize: btnfontsize,
    });
    text.anchor.set(0.5);
    button.addChild(text);

    button.x = x;
    button.y = y;

    button.on('pointerdown', onClick);
    button.on('pointerover', () => bg.tint = 0x45a049); // Darker green on hover
    button.on('pointerout', () => bg.tint = 0xffffff);  // Reset tint

    return button;
}

function createPopup(content) {    
    // Create new popup container
    let popupContainer = new PIXI.Container();
    
    // Semi-transparent background - make it fully interactive to block events
    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 0.7);
    bg.drawRect(0, 0, gameWidth, gameHeight);
    bg.endFill();
    bg.eventMode = 'static'; // Make background fully interactive to block events
    popupContainer.addChild(bg);
    
    // Popup panel
    const panel = new PIXI.Graphics();
    panel.beginFill(0x333333);
    panel.drawRect(gameWidth / 2 - content.width / 2 - popupPadding, gameHeight / 2 - content.height / 2 - popupPadding, content.width + popupPadding * 2, content.height + popupPadding * 2);
    panel.endFill();
    content.position.set(gameWidth / 2 - content.width / 2, gameHeight / 2 - content.height / 2);
    panel.addChild(content);
    popupContainer.addChild(panel);

    return popupContainer;
}

function setupUiScene() {
    uiContainer = new PIXI.Container();
    gameArea.addChild(uiContainer);
    uiContainer.visible = false; //for debugging only.
    // Ensure popupTray stays on top
    ensurePopupTrayOnTop();

    // Load and add timer icon
    const timerIcon = PIXI.Sprite.from('assets/stopwatch.png');
    timerIcon.width = uiFontSize; // Use uiFontSize for icon sizing
    timerIcon.height = uiFontSize;
    timerIcon.position.set(padding, padding);
    uiContainer.addChild(timerIcon);

    timerText = new PIXI.Text('Timer : 60', {
        fontFamily: 'Noto Sans Bengali, Arial',
        fontSize: uiFontSize, // Use uiFontSize for text
        fill: 0xffffff
    });
    timerText.position.set(padding + uiFontSize + 10, padding); // Position text to the right of icon with spacing
    uiContainer.addChild(timerText);

    levelText = new PIXI.Text('Level : 1', {
        fontFamily: 'Noto Sans Bengali, Arial',
        fontSize: uiFontSize, // Use uiFontSize for text
        fill: 0xffffff
    });
    levelText.anchor.set(1, 0);
    levelText.position.set(gameWidth - padding, padding);
    uiContainer.addChild(levelText);

    // Load and add level icon
    const levelIcon = PIXI.Sprite.from('assets/level.png');
    levelIcon.width = uiFontSize; // Use uiFontSize for icon sizing
    levelIcon.height = uiFontSize;
    levelIcon.anchor.set(1, 0); // Right-align the icon like the text
    levelIcon.position.set(gameWidth - padding - uiFontSize * 4.5, padding); // Position icon to the left of text with spacing
    uiContainer.addChild(levelIcon);

    // Add life display in top middle
    setupLifeDisplay();

    playPauseButton = createButton('Play/Pause', gameWidth / 2, gameHeight * 0.90, togglePause);
    uiContainer.addChild(playPauseButton);

    // Add speaker button to bottom left corner of uiContainer
    speakerButton = PIXI.Sprite.from('assets/speaker.png');
    speakerButton.width = uiFontSize * 1.5;
    speakerButton.height = uiFontSize * 1.5;
    speakerButton.anchor.set(0, 1); // Bottom-left anchor
    speakerButton.position.set(padding, gameHeight - padding);
    speakerButton.eventMode = 'static';
    speakerButton.cursor = 'pointer';
    speakerButton.on('pointerdown', toggleSound);
    uiContainer.addChild(speakerButton);

  
}

function setupLifeDisplay() {
    // Remove existing life display if it exists
    if (lifeDisplayContainer) {
        uiContainer.removeChild(lifeDisplayContainer);
        lifeDisplayContainer.destroy({ children: true });
    }

    // Create new life display container
    lifeDisplayContainer = new PIXI.Container();
    uiContainer.addChild(lifeDisplayContainer);

    const heartSize = uiFontSize * 0.8;
    const heartSpacing = heartSize * 1.2;

    // Position in top middle
    const startX = gameWidth / 2 - (maxLives * heartSpacing) / 2;
    const heartY = padding;

    for (let i = 0; i < maxLives; i++) {
        const heart = new PIXI.Text('❤️', {
            fontSize: heartSize,
            fill: 0xff0000
        });
        heart.anchor.set(0.5);
        heart.x = startX + i * heartSpacing;
        heart.y = heartY;
        heart.name = `heart_${i}`;
        lifeDisplayContainer.addChild(heart);
    }

    updateLifeDisplay();
}

function updateLifeDisplay() {
    if (!lifeDisplayContainer) return;

    for (let i = 0; i < maxLives; i++) {
        const heart = lifeDisplayContainer.getChildByName(`heart_${i}`);
        if (heart) {
            if (i < remainingLives) {
                heart.text = '❤️';
                heart.style.fill = 0xff0000;
            } else {
                heart.text = '🖤';
                heart.style.fill = 0x000000;
            }
        }
    }
}

function setupMainScene() {
    mainContainer = new PIXI.Container();
    gameArea.addChild(mainContainer);
    // Ensure popupTray stays on top
    ensurePopupTrayOnTop();
}

async function loadLevel(levelIndex) {
    console.log(`Loading level ${levelIndex + 1}`);
    mainContainer.removeChildren();
    stacks = [];
    selectedIndices = [];
    
    // Hide all popups when loading a new level
    hideAllPopups();

    // Update speaker button icon to match current mute state
    if (speakerButton) {
        const iconPath = isMuted ? 'assets/mute.png' : 'assets/speaker.png';
        speakerButton.texture = PIXI.Texture.from(iconPath);
    }

    // Show loading screen
    isLoading = true;
    await showLoadingScreen();

    try {
        if (levelIndex !== 0) {

            const response = await fetch(`https://jyotiskaborah.pythonanywhere.com/api/game/?level=${levelIndex + 1}`);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            data = await response.json();
        }
        else {
            data = {
                "puzzle_id": 22,
                "word": "অসমীয়া",
                "stacks": [
                  {
                    "letters": [
                      "অ"
                    ],
                    "selected_index": 0,
                    "x": 0,
                    "y": 0
                  },
                  {
                    "letters": [
                      "ৰ"
                    ],
                    "selected_index": 0,
                    "x": 0,
                    "y": 0
                  },
                  {
                    "letters": [
                      "প্ৰা",
                      "খী",
                      "বু",
                      "ও"
                    ],
                    "selected_index": 2,
                    "x": 0,
                    "y": 0
                  },
                  {
                    "letters": [
                      "তি",
                      "স"
                    ],
                    "selected_index": 0,
                    "x": 0,
                    "y": 0
                  },
                  {
                    "letters": [
                      "মী"
                    ],
                    "selected_index": 0,
                    "x": 0,
                    "y": 0
                  },
                  {
                    "letters": [
                      "য়া",
                      "প্ৰা",
                      "বু",
                      "ৰ",
                      "সু"
                    ],
                    "selected_index": 0,
                    "x": 0,
                    "y": 0
                  }
                ],
                "correct_position": [0, 0, 2, 1, 0, 0]
            }
        }

        if (!data.stacks || !data.correct_position) {
            showLevelUnavailablePopup(levelIndex + 1, data.message || 'No data available');
            return;
        }

        correctPosition = data.correct_position;
        stacks = data.stacks.map(stackData => ({
            letters: stackData.letters,
            selectedIndex: stackData.selected_index,
            container: null // Will be set in setupLevel
        }));

        levelStartTime = Date.now(); // <-- Already set in loadLevel
        pausedTime = 0;
        isPaused = false;
        timerRunning = true;
        playPauseButton.label = 'Pause';
        // Reset timer state on level start
        timeLeft = maxTime;
        lastTimerUpdate = Date.now();
        timerText.text = `Timer : ${timeLeft}`;
        timerText.style.fill = 0xffffff;
        levelText.text = `Level : ${levelIndex + 1}`;

        setupHighlight();
        setupLevel();
        // After loading data in loadLevel
        correctWord = data.word || '';
    } catch (error) {
        console.error('Failed to load level:', error);
        showLevelUnavailablePopup(levelIndex + 1, 'Failed to fetch level data');
    } finally {
        // Hide loading screen
        isLoading = false;
        hideLoadingScreen();
    }
}

async function showLoadingScreen() {
    loadingScreen = new PIXI.Container();
    const bg = new PIXI.Graphics();
    bg.beginFill(0x224444, 0.7);
    bg.drawRect(0, 0, gameWidth, gameHeight);
    bg.endFill();
    loadingScreen.addChild(bg);

    // Load single PNG and rotate it programmatically
    const spinnerTexture = await PIXI.Assets.load('assets/LoadingWheel.png');
    const spinner = new PIXI.Sprite(spinnerTexture);
    spinner.anchor.set(0.5);
    spinner.x = gameWidth / 2;
    spinner.y = gameHeight / 2;
    loadingScreen.addChild(spinner);

    // Add rotation animation
    let rotation = 0;
    const rotationSpeed = 0.1; // Adjust speed as needed
    
    const animateSpinner = () => {
        rotation += rotationSpeed;
        spinner.rotation = rotation;
    };
    
    // Store the animation function so we can remove it later
    loadingScreen._animateSpinner = animateSpinner;
    app.ticker.add(animateSpinner);

    mainContainer.addChild(loadingScreen);
}

function hideLoadingScreen() {
    if (loadingScreen) {
        // Remove the spinner animation from ticker
        if (loadingScreen._animateSpinner) {
            app.ticker.remove(loadingScreen._animateSpinner);
        }
        app.stage.removeChild(loadingScreen);
        loadingScreen.destroy({ children: true });
        loadingScreen = null;
    }
}

function showLevelUnavailablePopup(level, message) {
    console.log('Level unavailable');

    let totalWidth = 0;
    const totalHeight = 300;

    const contentBox = new PIXI.Container();
    
    const failedMessage = new PIXI.Text(`Level ${level} Unavailable!`, {
        fontFamily: 'Noto Sans Bengali, Arial',
        fontSize: fontSize * 2,
        fill: 0xff0000,
        align: 'center'
    });
    failedMessage.anchor.set(0.5, 0);
    contentBox.addChild(failedMessage);

    const retryLoading = createButton('Retry Loading', 0, failedMessage.y + failedMessage.height + totalHeight * 0.30, retryLoadingLevel);
    contentBox.addChild(retryLoading);

    totalWidth = Math.max(failedMessage.width, retryLoading.width);
    failedMessage.x = totalWidth / 2;
    retryLoading.x = totalWidth / 2;

    const levelUnavailablePopup = createPopup(contentBox);  
    popupTray.addChild(levelUnavailablePopup);
    showPopup(levelUnavailablePopup);
}

function retryLoadingLevel() {
    console.log('Retrying Loading level');
    // Hide the level unavailable popup by finding it in popupTray
    const levelUnavailablePopup = popupTray.children.find(child => 
        child.children && child.children.length > 0 && 
        child.children[0].children && child.children[0].children.length > 0 &&
        child.children[0].children[0].text && child.children[0].children[0].text.includes('Level') &&
        child.children[0].children[0].text.includes('Unavailable')
    );
    if (levelUnavailablePopup) {
        levelUnavailablePopup.visible = false;
        // Remove from popup stack if it exists there
        const stackIndex = popupStack.findIndex(item => item.popup === levelUnavailablePopup);
        if (stackIndex !== -1) {
            popupStack.splice(stackIndex, 1);
        }
    }
    // Retry loading the level
    loadLevel(currentLevel);
}

function setupHighlight() {
  const highlight = new PIXI.Graphics();
  highlight.beginFill(0xffff00, 0.3);
  highlight.drawRect(0, gameHeight / 2 - rowHeight, gameWidth, rowHeight);
  highlight.endFill();
  mainContainer.addChild(highlight);
  
}

function setupLevel() {
    console.log('Setting up level');
    const N = stacks.length;
    console.log('N=', N);

    for (let i = 0; i < N; i++) {
        const stack = stacks[i];
        stack.container = createStack(i, stack.letters).container;
        mainContainer.addChild(stack.container);
        selectedIndices[i] = stack.selectedIndex;
    }

    const totalWidth = N * stackWidth;
    const startX = (gameWidth - totalWidth) / 2 ;
    stacks.forEach((stack, i) => {
        const k = stack.selectedIndex;
        stack.container.x = startX + i * stackWidth;
        stack.container.y = gameHeight / 2 - (k + 1) * rowHeight;
    });

    console.log('Level setup complete');

}

function createStack(index, letters) {
    const container = new PIXI.Container();
    const stackHeight = rowHeight * letters.length;

    letters.forEach((letter, i) => {
        const box = createBox(letter);
        box.y = i * rowHeight;
        container.addChild(box);
    });

    container.eventMode = 'dynamic'; // or 'dynamic' if the container moves frequently
    container.hitArea = new PIXI.Rectangle(0, 0, boxWidth, stackHeight);
    container.cursor = 'pointer';

    let dragging = false;
    let dragStartY = 0;

    container.on('pointerdown', (event) => {
        if (isPaused || !timerRunning || letters.length === 1) return;
        dragging = true;
        // Store the global position and adjust for game area scaling
        const scale = gameArea.scale.y; // Current scale factor of the game area
        dragStartY = event.data.global.y / scale - container.y;
    });

    container.on('pointermove', (event) => {
        if (!dragging) return;
        const H = letters.length;
        
        // Store previous position before updating
        const previousY = container.y;
        
        // Calculate new position, accounting for game area scaling
        const scale = gameArea.scale.y; // Current scale factor of the game area
        const newY = event.data.global.y / scale - dragStartY;
        const minY = gameHeight / 2 - H * rowHeight;
        const maxY = gameHeight / 2 - rowHeight;
        container.y = Math.max(minY, Math.min(maxY, newY));

        // Calculate which row the stack is currently aligned with
        // We need to account for the gameHeight/2 offset in the container positioning
        const previousRowIndex = Math.round((gameHeight / 2 - previousY - rowHeight) / rowHeight);
        const currentRowIndex = Math.round((gameHeight / 2 - container.y - rowHeight) / rowHeight);
        
        // Play sound when crossing from one row to another
        if (previousRowIndex !== currentRowIndex) {
            // Play or restart sound
            scrollSound.currentTime = 0;
            scrollSound.play();
        }
    });

    container.on('pointerup', () => {
        if (!dragging) return;
        dragging = false;
        snapStack(container, letters, index);
    });

    container.on('pointerupoutside', () => {
        if (!dragging) return;
        dragging = false;
        snapStack(container, letters, index);
    });

    return { container };
}

function createBox(letter) {
    const box = new PIXI.Graphics();
    box.lineStyle(3, 0x000000);
    box.beginFill(0xcccccc);
    box.drawRect(0, 0, boxWidth, rowHeight);
    box.endFill();

    const text = new PIXI.Text(letter, {
        fontFamily: 'Noto Sans Bengali, Arial',
        fontSize: stackFontsize,
        fill: 0x000000,
    });
    text.anchor.set(0.5);
    text.position.set(boxWidth / 2, rowHeight / 2);
    box.addChild(text);
    
    return box;
}

function snapStack(container, letters, index) {
    const H = letters.length;
    const baseY = gameHeight / 2 - rowHeight;
    const k = Math.round((baseY - container.y) / rowHeight);
    const clampedK = Math.max(0, Math.min(H , k));
    const targetY = baseY - (clampedK * rowHeight);

    const startTime = Date.now();
    const startY = container.y;

    function animate() {
        const elapsed = Date.now() - startTime;
        const t = Math.min(elapsed / snapDuration, 1);
        const ease = 1 - Math.pow(1 - t, 2);
        container.y = startY + (targetY - startY) * ease;

        if (t < 1) {
            requestAnimationFrame(animate);
        } else {
            container.y = targetY;
            stacks[index].selectedIndex = clampedK;
            selectedIndices[index] = clampedK;
            checkWin();
        }
    }
    requestAnimationFrame(animate);
}

function checkWin() {
    if (selectedIndices.every((index, i) => index === correctPosition[i])) {
        timerRunning = false;
        showWinPopup();
    }
}



function showWinPopup() {
    console.log('Congrats');

    // Calculate time taken and stars
    const timeTaken = Math.round((Date.now() - levelStartTime) / 1000);
    let stars = timeTaken <= 20 ? 3 : timeTaken <= 30 ? 2 : 1;
    
    // Add stars to total
    totalStarsAchieved += stars;

    let totalWidth = 0;
    const totalHeight = 300;

    const contentBox = new PIXI.Container();
    
    congratMessageAssamese = new PIXI.Text('অভিনন্দন!', {
        fontFamily: 'Noto Sans Bengali, Arial',
        fontSize: fontSize * 2,
        fill: 0xffffff,
        align: 'center'
    });
    congratMessageAssamese.anchor.set(0.5, 0);
    console.log('congratMessageAssamese.width =', congratMessageAssamese.width);
    contentBox.addChild(congratMessageAssamese);

    // Star container - positioned in the middle
    starContainer = new PIXI.Container();
    const starFontSize = fontSize * 2;
    const starSpacing = starFontSize * 1.5; // Space between stars
    // Keep track of animation timers to clear them if needed
    const animationTimers = [];
    for (let i = 0; i < totalStars; i++) {
        const starChar = i < stars ? '★' : '☆';
        const star = new PIXI.Text(starChar, {
            fontSize: starFontSize,
            fill: 0xffff00
        });
        star.x = i * starSpacing;
        star.y = 0; // Center of the popup (since contentContainer is positioned at center)
        star.scale.set(0); // Start invisible
        star.anchor.set(0.5);
        starContainer.addChild(star);
        // Animate star
        const delay = i * 300; // 300ms delay between each star
        const duration = 500; // 500ms zoom animation
        const startScale = 2;
        const endScale = 1;
        const timerId = setTimeout(() => {
            let startTime = null;
            const animateFunction = (delta) => {
                if (!startTime) startTime = app.ticker.lastTime;
                const elapsed = app.ticker.lastTime - startTime;
                const t = Math.min(elapsed / duration, 1);
                const ease = 1 - Math.pow(1 - t, 2); // Ease-out quadratic
                star.scale.set(startScale + (endScale - startScale) * ease);
                if (t === 1) {
                    star.scale.set(endScale);
                    app.ticker.remove(animateFunction);
                }
            };
            star._animateFunction = animateFunction; // Store reference to remove later if needed
            app.ticker.add(animateFunction);
        }, delay);
        animationTimers.push(timerId);
    }
    starContainer.position.set(0, congratMessageAssamese.y + congratMessageAssamese.height + totalHeight * 0.20);
    contentBox.addChild(starContainer);

    nextLevelButton = createButton('পৰৱৰ্তী স্তৰ\n(Next Level)', 0, starContainer.y + starContainer.height + totalHeight * 0.40, levelUp);
    contentBox.addChild(nextLevelButton);
    
    // Add End Game button
    const endButton = createButton('End Game', 0, nextLevelButton.y + nextLevelButton.height + 40, endGame);
    contentBox.addChild(endButton);
    
    // Calculate the maximum width needed
    totalWidth = Math.max(
        congratMessageAssamese.width,
        nextLevelButton.width,
        endButton.width,
        starContainer.width
    );

    // Position elements horizontally in the center of totalWidth
    congratMessageAssamese.x = totalWidth / 2;
    nextLevelButton.x = totalWidth / 2;
    endButton.x = totalWidth / 2;
    starContainer.x = totalWidth / 2 - starContainer.width / 2;

    winPopup = createPopup(contentBox);
    popupTray.addChild(winPopup);
    showPopup(winPopup);
    winSound.play(); // Play win sound. 
}

function levelUp() {
    currentLevel++;
    if (winPopup) hidePopup(winPopup);
    loadLevel(currentLevel);
}



function startGame() {
    setupMainScene();
    homeContainer.visible = false;
    mainContainer.visible = true;
    uiContainer.visible = true;
    
    // Hide all popups when starting a new game
    hideAllPopups();
    
    // Reset game state
    remainingLives = maxLives;
    currentLevel = 0;
    totalStarsAchieved = 0;
    timerRunning = true;
    isPaused = false;
    
    // Update life display
    updateLifeDisplay();
    
    // Update speaker button icon to match current mute state
    if (speakerButton) {
        const iconPath = isMuted ? 'assets/mute.png' : 'assets/speaker.png';
        speakerButton.texture = PIXI.Texture.from(iconPath);
    }
    
    loadLevel(currentLevel);
}

let pausePopup = null;
let howToPlayPopup = null;
let helpPopup = null;
let popupStack = []; // Stack to manage popup hierarchy

function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
        // Show pause menu
        if (!pausePopup) {
            const contentBox = new PIXI.Container();
            const pauseLabel = new PIXI.Text('Paused', {
                fontFamily: 'Noto Sans Bengali, Arial',
                fontSize: fontSize * 2,
                fill: 0xffffff,
                align: 'center'
            });
            pauseLabel.anchor.set(0.5, 0);
            contentBox.addChild(pauseLabel);
            // Resume button
            const resumeButton = createButton('Resume', 0, pauseLabel.height + 60, () => {
                isPaused = false;
                hidePopup(pausePopup);
            });
            contentBox.addChild(resumeButton);
            // How to Play button
            const howToPlayButton = createButton('How to Play', 0, pauseLabel.height + resumeButton.height + 90, () => {
                showHowToPlayPopup(pausePopup);
            });
            contentBox.addChild(howToPlayButton);
            // End Game button
            const endButton = createButton('End Game', 0, pauseLabel.height + resumeButton.height + howToPlayButton.height + 120, endGame);
            contentBox.addChild(endButton);
            // Center all
            let maxWidth = Math.max(pauseLabel.width, resumeButton.width, endButton.width, howToPlayButton.width);
            pauseLabel.x = maxWidth / 2;
            resumeButton.x = maxWidth / 2;
            endButton.x = maxWidth / 2;
            howToPlayButton.x = maxWidth / 2;
            pausePopup = createPopup(contentBox);
            popupTray.addChild(pausePopup);
        }
        showPopup(pausePopup);
    } else {
        // Hide pause menu if unpausing
        hidePopup(pausePopup);
    }
}

function showHowToPlayPopup(parentPopup = null) {
    if (!howToPlayPopup) {
        const contentBox = new PIXI.Container();
        const title = new PIXI.Text('খেলৰ নিয়ম', {
            fontFamily: 'Noto Sans Bengali, Arial',
            fontSize: fontSize * 2,
            fill: 0xffffff,
            align: 'center'
        });
        title.anchor.set(0.5, 0);
        contentBox.addChild(title);
        const instructions = new PIXI.Text(
            'সঠিক শব্দটো গঠন কৰিবলৈ স্তম্ভসমূহ সজাওক।\n\n• স্তম্ভসমূহ ওপৰলৈ বা তললৈ টানি স্থানান্তৰ কৰক।\n• সময়-সীমা শেষ হোৱাৰ আগতে সম্পূৰ্ণ কৰক।\n• সোনকালে শেষ কৰিলে অধিক ষ্টাৰ পাব!',
            {
                fontFamily: 'Noto Sans Bengali, Arial',
                fontSize: fontSize * 1.2,
                fill: 0xffff4d,
                align: 'left',
                wordWrap: true,
                wordWrapWidth: 400
            }
        );
        instructions.anchor.set(0.5, 0);
        instructions.y = title.height + 20;
        contentBox.addChild(instructions);
        // Close button
        const closeButton = createButton('Close', 0, instructions.y + instructions.height + 60, () => {
            hidePopup(howToPlayPopup);
        });
        contentBox.addChild(closeButton);
        // Center all
        let maxWidth = Math.max(title.width, instructions.width, closeButton.width);
        title.x = maxWidth / 2;
        instructions.x = maxWidth / 2;
        closeButton.x = maxWidth / 2;
        howToPlayPopup = createPopup(contentBox);
        popupTray.addChild(howToPlayPopup);
    }
    showPopup(howToPlayPopup, parentPopup);
}

function showHelpPopup() {
    if (!helpPopup) {
        const contentBox = new PIXI.Container();

        const title = new PIXI.Text('Help & Support', {
            fontFamily: 'Noto Sans Bengali, Arial',
            fontSize: 32,
            fill: 0xffffff,
            align: 'center'
        });
        title.anchor.set(0.5,0);
        contentBox.addChild(title);

        const faqButton = createButton('FAQ', 0, title.height + 60, () => {
            // TODO: Implement FAQ functionality
            console.log('FAQ clicked');
        });
        contentBox.addChild(faqButton);

        const contactButton = createButton('Contact Support', 0, title.height + faqButton.height + 90, () => {
            // TODO: Implement contact support functionality
            console.log('Contact Support clicked');
        });
        contentBox.addChild(contactButton);

        const aboutButton = createButton('About', 0, title.height + faqButton.height + contactButton.height + 120, () => {
            showAboutPopup(helpPopup);
        });
        contentBox.addChild(aboutButton);        

        // Add close button
        const closeButton = createButton('Close', 0, title.height + faqButton.height + contactButton.height + aboutButton.height + 150, () => {
            hidePopup(helpPopup);
        });
        contentBox.addChild(closeButton);

        // Center all buttons horizontally
        let maxWidth = Math.max(title.width, faqButton.width, contactButton.width, closeButton.width);
        title.x = maxWidth / 2;
        faqButton.x = maxWidth / 2;
        contactButton.x = maxWidth / 2;
        closeButton.x = maxWidth / 2;
        aboutButton.x = maxWidth / 2;
        closeButton.x = maxWidth / 2;

        helpPopup = createPopup(contentBox);
        popupTray.addChild(helpPopup);
    }
    showPopup(helpPopup);
}

let aboutPopup = null;

function showAboutPopup(parentPopup = null) {
    if (!aboutPopup) {
        const contentBox = new PIXI.Container();
        
        // Game Title
        const gameTitle = new PIXI.Text('Xobdotola', {
            fontFamily: 'Noto Sans Bengali, Arial',
            fontSize: fontSize * 2.5,
            fill: 0x4CAF50,
            align: 'center',
            fontWeight: 'bold'
        });
        gameTitle.anchor.set(0.5, 0);
        contentBox.addChild(gameTitle);

        // Game Subtitle
        const gameSubtitle = new PIXI.Text('Word Puzzle Game', {
            fontFamily: 'Noto Sans Bengali, Arial',
            fontSize: fontSize * 1.2,
            fill: 0xffffff,
            align: 'center'
        });
        gameSubtitle.anchor.set(0.5, 0);
        gameSubtitle.y = gameTitle.height + 10;
        contentBox.addChild(gameSubtitle);

        // Game Description
        const gameDescription = new PIXI.Text(
            'Xobdotola is an engaging word puzzle game where players arrange letter stacks to form correct words. Challenge your vocabulary and quick thinking skills as you race against time to solve each level.',
            {
                fontFamily: 'Noto Sans Bengali, Arial',
                fontSize: fontSize * 0.9,
                fill: 0xcccccc,
                align: 'left',
                wordWrap: true,
                wordWrapWidth: 450
            }
        );
        gameDescription.anchor.set(0.5, 0);
        gameDescription.y = gameSubtitle.y + gameSubtitle.height + 20;
        contentBox.addChild(gameDescription);

        // Features Section
        const featuresTitle = new PIXI.Text('Features:', {
            fontFamily: 'Noto Sans Bengali, Arial',
            fontSize: fontSize * 1.1,
            fill: 0xffff4d,
            align: 'left'
        });
        featuresTitle.anchor.set(0.5, 0);
        featuresTitle.y = gameDescription.y + gameDescription.height + 20;
        contentBox.addChild(featuresTitle);

        const featuresList = new PIXI.Text(
            '• Multiple challenging levels\n• Time-based gameplay\n• Star rating system\n• Assamese language support\n• Intuitive drag-and-drop controls',
            {
                fontFamily: 'Noto Sans Bengali, Arial',
                fontSize: fontSize * 0.85,
                fill: 0xffffff,
                align: 'left',
                wordWrap: true,
                wordWrapWidth: 400
            }
        );
        featuresList.anchor.set(0.5, 0);
        featuresList.y = featuresTitle.y + featuresTitle.height + 10;
        contentBox.addChild(featuresList);

        // Publisher Section
        const publisherTitle = new PIXI.Text('Published by:', {
            fontFamily: 'Noto Sans Bengali, Arial',
            fontSize: fontSize * 1.1,
            fill: 0xffff4d,
            align: 'center'
        });
        publisherTitle.anchor.set(0.5, 0);
        publisherTitle.y = featuresList.y + featuresList.height + 20;
        contentBox.addChild(publisherTitle);

        const publisherName = new PIXI.Text('Jeuti.in', {
            fontFamily: 'Noto Sans Bengali, Arial',
            fontSize: fontSize * 1.5,
            fill: 0x4CAF50,
            align: 'center',
            fontWeight: 'bold'
        });
        publisherName.anchor.set(0.5, 0);
        publisherName.y = publisherTitle.y + publisherTitle.height + 5;
        contentBox.addChild(publisherName);

        const publisherDescription = new PIXI.Text(
            'Creating innovative and engaging games for Assamese language learners and puzzle enthusiasts.',
            {
                fontFamily: 'Noto Sans Bengali, Arial',
                fontSize: fontSize * 0.8,
                fill: 0xcccccc,
                align: 'center',
                wordWrap: true,
                wordWrapWidth: 400
            }
        );
        publisherDescription.anchor.set(0.5, 0);
        publisherDescription.y = publisherName.y + publisherName.height + 10;
        contentBox.addChild(publisherDescription);

        // Version Info
        const versionInfo = new PIXI.Text('Version 1.0.0', {
            fontFamily: 'Noto Sans Bengali, Arial',
            fontSize: fontSize * 0.7,
            fill: 0x888888,
            align: 'center'
        });
        versionInfo.anchor.set(0.5, 0);
        versionInfo.y = publisherDescription.y + publisherDescription.height + 15;
        contentBox.addChild(versionInfo);

        // Close button
        const closeButton = createButton('Close', 0, versionInfo.y + versionInfo.height + 50, () => {
            hidePopup(aboutPopup);
        });
        contentBox.addChild(closeButton);

        // Center all elements horizontally
        const maxWidth = Math.max(
            gameTitle.width,
            gameSubtitle.width,
            gameDescription.width,
            featuresTitle.width,
            featuresList.width,
            publisherTitle.width,
            publisherName.width,
            publisherDescription.width,
            versionInfo.width,
            closeButton.width
        );

        gameTitle.x = maxWidth / 2;
        gameSubtitle.x = maxWidth / 2;
        gameDescription.x = maxWidth / 2;
        featuresTitle.x = maxWidth / 2;
        featuresList.x = maxWidth / 2;
        publisherTitle.x = maxWidth / 2;
        publisherName.x = maxWidth / 2;
        publisherDescription.x = maxWidth / 2;
        versionInfo.x = maxWidth / 2;
        closeButton.x = maxWidth / 2;

        aboutPopup = createPopup(contentBox);
        popupTray.addChild(aboutPopup);
    }
    showPopup(aboutPopup, parentPopup);
}

function endGame() {
    isPaused = false;
    timerRunning = false;
    currentLevel = 0;
    
    // Hide game containers
    mainContainer.visible = false;
    uiContainer.visible = false;
    
    // Show home container
    homeContainer.visible = true;
    
    // Hide all open popups using visibility
    hideAllPopups();
    
    // Update home screen speaker button to match current mute state
    const homeSpeakerButton = homeContainer.children.find(child => 
        child.texture && (child.texture.baseTexture.resource?.url?.includes('speaker.png') || 
                         child.texture.baseTexture.resource?.url?.includes('mute.png'))
    );
    if (homeSpeakerButton) {
        const iconPath = isMuted ? 'assets/mute.png' : 'assets/speaker.png';
        homeSpeakerButton.texture = PIXI.Texture.from(iconPath);
    }
}

app.ticker.add(() => {
    if (timerRunning && !isPaused) {
        const now = Date.now();
        if (now - lastTimerUpdate >= 1000 && timeLeft > 0) {
            timeLeft--;
            lastTimerUpdate = now;
            timerText.text = `Timer : ${timeLeft}`;
            if (timeLeft <= 5) {
                timerText.style.fill = 0xff0000; // Red
            } else {
                timerText.style.fill = 0xffffff; // White
            }
            if (timeLeft === 0) {
                timerRunning = false;
                // Only show lose popup if not already won
                if (!selectedIndices.every((index, i) => index === correctPosition[i])) {
                    showLosePopup();
                }
            }
        }
    }
});

let losePopup = null;

function showLosePopup() {
    // Decrement lives
    remainingLives--;
    updateLifeDisplay();

    // If there's an existing losePopup, remove and destroy it
    if (losePopup) {
        popupTray.removeChild(losePopup);
        losePopup.destroy({children: true});
        losePopup = null;
    }

    // Check if game over
    if (remainingLives <= 0) {
        showGameOverPopup();
        return;
    }

    // Now create new
    const contentBox = new PIXI.Container();
    const loseMessage = new PIXI.Text('আপুনি হাৰি গ’ল!', {
        fontFamily: 'Noto Sans Bengali, Arial',
        fontSize: fontSize * 2,
        fill: 0xff4444,
        align: 'center'
    });
    loseMessage.anchor.set(0.5, 0);
    contentBox.addChild(loseMessage);

    // Show animated heart transition - similar to star container
    const heartContainer = new PIXI.Container();
    heartContainer.y = loseMessage.height + 40;
    contentBox.addChild(heartContainer);
    
    // Use same measurement system as stars
    const heartFontSize = fontSize * 2;
    const heartSpacing = heartFontSize * 1.5; // Same spacing calculation as stars
    
    // Keep track of animation timers to clear them if needed
    const animationTimers = [];
    
    for (let i = 0; i < maxLives; i++) {
        const heartChar = i < remainingLives ? '❤️' : '🖤';
        const heart = new PIXI.Text(heartChar, {
            fontSize: heartFontSize,
            fill: i < remainingLives ? 0xff0000 : 0x000000 // Red for remaining, black for consumed
        });
        heart.x = i * heartSpacing;
        heart.y = 0;
        heart.scale.set(0); // Start invisible
        heart.anchor.set(0.5);
        heartContainer.addChild(heart);
        
        // Animate the heart that just got consumed
        if (i === remainingLives) {
            // Start with red heart and animate to black
            heart.text = '❤️';
            heart.style.fill = 0xff0000;
            heart.scale.set(2); // Start at scale 2
            
            // Animate to black heart
            const delay = 200; // 200ms delay
            const duration = 800; // 800ms animation
            const startScale = 2;
            const endScale = 1;
            const timerId = setTimeout(() => {
                let startTime = null;
                const animateFunction = (delta) => {
                    if (!startTime) startTime = app.ticker.lastTime;
                    const elapsed = app.ticker.lastTime - startTime;
                    const t = Math.min(elapsed / duration, 1);
                    const ease = 1 - Math.pow(1 - t, 2); // Ease-out quadratic
                    heart.scale.set(startScale + (endScale - startScale) * ease);
                    
                    // Change to black heart when reaching end scale
                    if (t >= 0.8) {
                        heart.text = '🖤';
                        heart.style.fill = 0x000000;
                    }
                    
                    if (t === 1) {
                        heart.scale.set(endScale);
                        app.ticker.remove(animateFunction);
                    }
                };
                heart._animateFunction = animateFunction; // Store reference to remove later if needed
                app.ticker.add(animateFunction);
            }, delay);
            animationTimers.push(timerId);
        } else if (i < remainingLives) {
            // Remaining hearts - show immediately
            heart.scale.set(1);
        } else {
            // Already consumed hearts - show immediately
            heart.scale.set(1);
        }
    }
    
    // Center the heart container using same method as stars
    heartContainer.x = 0; // Will be centered later with totalWidth calculation

    // Show correct word
    if (correctWord) {
        const wordLabel = new PIXI.Text('Correct Word:', {
            fontFamily: 'Noto Sans Bengali, Arial',
            fontSize: fontSize,
            fill: 0xffffff,
            align: 'center'
        });
        wordLabel.anchor.set(0.5, 0);
        wordLabel.y = heartContainer.y + heartContainer.height;
        contentBox.addChild(wordLabel);
        const wordText = new PIXI.Text(correctWord, {
            fontFamily: 'Noto Sans Bengali, Arial',
            fontSize: fontSize * 1.5,
            fill: 0xffff00,
            align: 'center'
        });
        wordText.anchor.set(0.5, 0);
        wordText.y = wordLabel.y + wordLabel.height + 5;
        contentBox.addChild(wordText);
    }
    
    // Retry button
    const retryButton = createButton('Retry', 0, heartContainer.y + heartContainer.height + 200, () => {
        hidePopup(losePopup);
        loadLevel(currentLevel);
    });
    contentBox.addChild(retryButton);
    
    // End button
    const endButton = createButton('End Game', 0, retryButton.y + retryButton.height + 40, endGame);
    contentBox.addChild(endButton);
    
    // Center buttons using same method as stars
    let maxWidth = Math.max(loseMessage.width, heartContainer.width, retryButton.width, endButton.width);
    loseMessage.x = maxWidth / 2;
    heartContainer.x = maxWidth / 2 - heartContainer.width / 2 + heartFontSize; // Same centering as stars
    retryButton.x = maxWidth / 2;
    endButton.x = maxWidth / 2;
    
    // Center word label and word text if present
    if (correctWord) {
        const wordLabelIndex = contentBox.children.findIndex(child => child.text && child.text.includes('Correct Word'));
        const wordTextIndex = wordLabelIndex + 1;
        if (wordLabelIndex !== -1) contentBox.children[wordLabelIndex].x = maxWidth / 2;
        if (wordTextIndex !== -1) contentBox.children[wordTextIndex].x = maxWidth / 2;
    }
    // Create and show popup
    losePopup = createPopup(contentBox);
    popupTray.addChild(losePopup);
    showPopup(losePopup);
    // Optionally play lose sound
    if (typeof loseSound !== 'undefined') loseSound.play();
}

let gameOverPopup = null;

function showGameOverPopup() {
    // If there's an existing gameOverPopup, remove and destroy it
    if (gameOverPopup) {
        popupTray.removeChild(gameOverPopup);
        gameOverPopup.destroy({children: true});
        gameOverPopup = null;
    }

    const contentBox = new PIXI.Container();
    
    // Game Over Title
    const gameOverTitle = new PIXI.Text('Game Over!', {
        fontFamily: 'Noto Sans Bengali, Arial',
        fontSize: fontSize * 2.5,
        fill: 0xff4444,
        align: 'center',
        fontWeight: 'bold'
    });
    gameOverTitle.anchor.set(0.5, 0);
    contentBox.addChild(gameOverTitle);

    // Level Won Info
    const levelWonText = new PIXI.Text(`Level Won: ${currentLevel}`, {
        fontFamily: 'Noto Sans Bengali, Arial',
        fontSize: fontSize * 1.5,
        fill: 0xffffff,
        align: 'center'
    });
    levelWonText.anchor.set(0.5, 0);
    levelWonText.y = gameOverTitle.height + 20;
    contentBox.addChild(levelWonText);

    // Lives exhausted message
    const livesMessage = new PIXI.Text('All lives exhausted!', {
        fontFamily: 'Noto Sans Bengali, Arial',
        fontSize: fontSize * 1.2,
        fill: 0xffff4d,
        align: 'center'
    });
    livesMessage.anchor.set(0.5, 0);
    livesMessage.y = levelWonText.y + levelWonText.height + 20;
    contentBox.addChild(livesMessage);

    // Total stars achieved
    const starsMessage = new PIXI.Text(`Total Stars: ${totalStarsAchieved}`, {
        fontFamily: 'Noto Sans Bengali, Arial',
        fontSize: fontSize * 1.3,
        fill: 0xffff00,
        align: 'center'
    });
    starsMessage.anchor.set(0.5, 0);
    starsMessage.y = livesMessage.y + livesMessage.height + 20;
    contentBox.addChild(starsMessage);

    // Show correct word if available
    let correctWordY = starsMessage.y + starsMessage.height + 20;
    if (correctWord) {
        const wordLabel = new PIXI.Text('Correct Word:', {
            fontFamily: 'Noto Sans Bengali, Arial',
            fontSize: fontSize,
            fill: 0xffffff,
            align: 'center'
        });
        wordLabel.anchor.set(0.5, 0);
        wordLabel.y = correctWordY;
        contentBox.addChild(wordLabel);
        
        const wordText = new PIXI.Text(correctWord, {
            fontFamily: 'Noto Sans Bengali, Arial',
            fontSize: fontSize * 1.5,
            fill: 0xffff00,
            align: 'center'
        });
        wordText.anchor.set(0.5, 0);
        wordText.y = wordLabel.y + wordLabel.height + 5;
        contentBox.addChild(wordText);
        
        correctWordY = wordText.y + wordText.height + 20;
    }

    // Restart Game button
    const restartButton = createButton('Restart Game', 0, correctWordY + 20, () => {
        hidePopup(gameOverPopup);
        restartGame();
    });
    contentBox.addChild(restartButton);

    // End Game button
    const endButton = createButton('End Game', 0, restartButton.y + restartButton.height + 40, endGame);
    contentBox.addChild(endButton);

    // Center all elements
    let maxWidth = Math.max(gameOverTitle.width, levelWonText.width, livesMessage.width, starsMessage.width, restartButton.width, endButton.width);
    gameOverTitle.x = maxWidth / 2;
    levelWonText.x = maxWidth / 2;
    livesMessage.x = maxWidth / 2;
    starsMessage.x = maxWidth / 2;
    restartButton.x = maxWidth / 2;
    endButton.x = maxWidth / 2;
    
    // Center correct word elements if present
    if (correctWord) {
        const wordLabelIndex = contentBox.children.findIndex(child => child.text && child.text.includes('Correct Word'));
        const wordTextIndex = wordLabelIndex + 1;
        if (wordLabelIndex !== -1) contentBox.children[wordLabelIndex].x = maxWidth / 2;
        if (wordTextIndex !== -1) contentBox.children[wordTextIndex].x = maxWidth / 2;
    }

    // Create and show popup
    gameOverPopup = createPopup(contentBox);
    popupTray.addChild(gameOverPopup);
    showPopup(gameOverPopup);
    
    // Play game over sound
    if (typeof gameOverSound !== 'undefined') gameOverSound.play();
}

function restartGame() {
    // Reset game state
    remainingLives = maxLives;
    currentLevel = 0;
    totalStarsAchieved = 0;
    isPaused = false;
    timerRunning = true;
    
    // Update life display
    updateLifeDisplay();
    
    // Hide all open popups
    hideAllPopups();
    
    // Update speaker button icon to match current mute state
    if (speakerButton) {
        const iconPath = isMuted ? 'assets/mute.png' : 'assets/speaker.png';
        speakerButton.texture = PIXI.Texture.from(iconPath);
    }
    
    // Start fresh with level 1
    loadLevel(currentLevel);
}


//ygguyvhgctrdxweaed45w54edyug98yhyur6dr5d65r6576f87iuhoihoih86rfytg




  