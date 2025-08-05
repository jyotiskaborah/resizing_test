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
const maxTime = 60;
const totalStars = 3;
let currentLevel = 0;
let selectedIndices = [];
let correctPosition = [];
let isPaused = false;
let timerRunning = true; //change to false in production.
// Timer state for countdown
let timeLeft = maxTime;
let lastTimerUpdate = Date.now();
let levelStartTime = Date.now(); // <-- Add this declaration
let isLoading = false;




//------------------------     UI state     ------------------------
const padding = 30;
const popupPadding = 60;
const fontSize = 25;
const btnfontsize = 30;
const stackFontsize = 30;
const rowHeight = 100;
const stackWidth = 100;
const boxWidth = 100;
const snapDuration = 200;
const buttonWidth = 360;
const buttonHeight = 80;

//------------------------     Container and button state     ------------------------
let mainContainer, homeContainer, uiContainer, playPauseButton, timerText, levelText, loadingScreen;

// Sound Effects using HTML5 Audio
const scrollSound = new Audio('assets/scroll.mp3');
const winSound = new Audio('assets/win.mp3');
const loseSound = new Audio('assets/lose.mp3');
scrollSound.volume = 0.5; // Quieter for repeated scrolling
winSound.volume = 0.8;   // Louder for one-time win
loseSound.volume = 0.8;  // Louder for one-time lose


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
    setupMainScene();

}

function setupHomeScene() {
    homeContainer = new PIXI.Container();
    gameArea.addChild(homeContainer);
    homeContainer.visible = false; //remove in production.

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

    const playButton = createButton('Play', gameWidth / 2, gameHeight * 0.60, startGame);
    homeContainer.addChild(playButton);
}

function setupUiScene() {
    uiContainer = new PIXI.Container();
    gameArea.addChild(uiContainer);
    uiContainer.visible = true; //for debugging only.

    timerText = new PIXI.Text('Timer : 60', {
        fontFamily: 'Noto Sans Bengali, Arial',
        fontSize: fontSize,
        fill: 0xffffff
    });
    timerText.position.set(padding, padding);
    uiContainer.addChild(timerText);

    levelText = new PIXI.Text('Level : 1', {
        fontFamily: 'Noto Sans Bengali, Arial',
        fontSize: fontSize,
        fill: 0xffffff
    });
    levelText.anchor.set(1, 0);
    levelText.position.set(gameWidth - padding, padding);
    uiContainer.addChild(levelText);

    playPauseButton = createButton('Play/Pause', gameWidth / 2, gameHeight * 0.90, togglePause);
    uiContainer.addChild(playPauseButton);

  
}

function setupMainScene() {
    mainContainer = new PIXI.Container();
    gameArea.addChild(mainContainer);
    mainContainer.visible = true; // for debugging only.

    loadLevel(currentLevel);
}

async function loadLevel(levelIndex) {
    console.log(`Loading level ${levelIndex + 1}`);
    mainContainer.removeChildren();
    stacks = [];
    selectedIndices = [];

    // Show loading screen
    isLoading = true;
    showLoadingScreen();

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
    } catch (error) {
        console.error('Failed to load level:', error);
        showLevelUnavailablePopup(levelIndex + 1, 'Failed to fetch level data');
    } finally {
        // Hide loading screen
        isLoading = false;
        hideLoadingScreen();
    }
}

function showLoadingScreen() {
    loadingScreen = new PIXI.Container();
    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 0.7);
    bg.drawRect(0, 0, gameWidth, gameHeight);
    bg.endFill();
    loadingScreen.addChild(bg);

    const loadingText = new PIXI.Text('Loading...', {
        fontFamily: 'Noto Sans Bengali, Arial',
        fontSize: fontSize,
        fill: 0xffffff
    });
    loadingText.position.set(gameWidth / 2, gameHeight / 2);
    loadingScreen.addChild(loadingText);
    mainContainer.addChild(loadingScreen);
    
}

function hideLoadingScreen() {
    if (loadingScreen) {
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

    const retryLoading = createButton('Retry', 0, failedMessage.y + failedMessage.height + totalHeight * 0.30, retryLoadingLevel);
    contentBox.addChild(retryLoading);

    totalWidth = Math.max(failedMessage.width, retryLoading.width);
    failedMessage.x = totalWidth / 2;
    retryLoading.x = totalWidth / 2;

    const levelUnavailablePopup = createPopup(contentBox);  
    mainContainer.addChild(levelUnavailablePopup);
}

function retryLoadingLevel() {
    console.log('Retrying Loading level');
    //place holder for other codes.
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

function createPopup(content) {    
    // Create new popup container
    let popupContainer = new PIXI.Container();
    
    // Semi-transparent background
    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 0.7);
    bg.drawRect(0, 0, gameWidth, gameHeight);
    bg.endFill();
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

function showWinPopup() {
    console.log('Congrats');

    // Calculate time taken and stars
    const timeTaken = Math.round((Date.now() - levelStartTime) / 1000);
    let stars = timeTaken <= 20 ? 3 : timeTaken <= 30 ? 2 : 1;

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
    console.log('StarContainer.width =', starContainer.width);
    contentBox.addChild(starContainer);

    nextLevelButton = createButton('পৰৱৰ্তী স্তৰ\n(Next Level)', 0, starContainer.y + starContainer.height + totalHeight * 0.40, levelUp);
    contentBox.addChild(nextLevelButton);
    
    // Calculate the maximum width needed
    totalWidth = Math.max(
        congratMessageAssamese.width,
        nextLevelButton.width,
        starContainer.width
    );

    // Position elements horizontally in the center of totalWidth
    congratMessageAssamese.x = totalWidth / 2;
    nextLevelButton.x = totalWidth / 2;
    starContainer.x = totalWidth / 2 - starContainer.width / 2;

    winPopup = createPopup(contentBox);
    mainContainer.addChild(winPopup);
    winSound.play(); // Play win sound. 
}

function levelUp() {
    currentLevel++;
    loadLevel(currentLevel);
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

function startGame() {
    console.log('Starting game');
    //place holder for other codes.
}

function togglePause() {
    console.log('Pausing game');
    //pause func yet to copy.
  
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
                // Optionally handle timeout here (e.g., showLosePopup())
            }
        }
    }
});


//ygguyvhgctrdxweaed45w54edyug98yhyur6dr5d65r6576f87iuhoihoih86rfytg




  