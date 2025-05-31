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
let currentLevel = 0;
let selectedIndices = [];
let correctPosition = [];
let isPaused = false;
let timerRunning = true; //change to false in production.




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

//------------------------     Container state     ------------------------
let mainContainer, homeContainer, uiContainer;

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

    let timerText = new PIXI.Text('Time: 60', {
        fontFamily: 'Noto Sans Bengali, Arial',
        fontSize: fontSize,
        fill: 0xffffff
    });
    timerText.position.set(padding, padding);
    uiContainer.addChild(timerText);

    let levelText = new PIXI.Text('Level: 1', {
        fontFamily: 'Noto Sans Bengali, Arial',
        fontSize: fontSize,
        fill: 0xffffff
    });
    levelText.anchor.set(1, 0);
    levelText.position.set(gameWidth - padding, padding);
    uiContainer.addChild(levelText);

    const playPauseButton = createButton('Play/Pause', gameWidth / 2, gameHeight * 0.90, togglePause);
    uiContainer.addChild(playPauseButton);

  
}

function setupMainScene() {
    mainContainer = new PIXI.Container();
    gameArea.addChild(mainContainer);
    mainContainer.visible = true; // for debugging only.

    setupHighlight();

// kngrkmrbrtbporkbrtb         for debugging only.    wkjnfeorigergbeijbtreonb

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

      correctPosition = data.correct_position;
      stacks = data.stacks.map(stackData => ({
          letters: stackData.letters,
          selectedIndex: stackData.selected_index,
          container: null // Will be set in setupLevel
      }));

//  oegijnhbrtbrtbijmrbrt    for debugging only.   veirjngerjnverbveknmben

    setupLevel();
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

    const totalWidth = 360;
    const totalHeight = 300;

    const contentBox = new PIXI.Container();
    
    const congratMessageAssamese = new PIXI.Text('অভিনন্দন!', {
        fontFamily: 'Noto Sans Bengali, Arial',
        fontSize: fontSize,
        fill: 0xffffff,
        align: 'center'
    });
    congratMessageAssamese.position.set(totalWidth / 2 - congratMessageAssamese.width / 2, totalHeight * 0.05);
    contentBox.addChild(congratMessageAssamese);

    const nextLevelButton = createButton('পৰৱৰ্তী স্তৰ\n(Next Level)', totalWidth / 2, totalHeight * 0.80, levelUp);
    //nextLevelButton.position.set();
    contentBox.addChild(nextLevelButton);
    
    winPopup = createPopup(contentBox);

    mainContainer.addChild(winPopup); 
}

function levelUp() {
    currentLevel++;
}



function createButton(label, x, y, onClick) {
    const button = new PIXI.Container();
    button.eventMode = 'static';
    button.cursor = 'pointer';

    const count = (label.match(/\n/g) || []).length;
    bHeight = buttonHeight + count * 20;

    const bg = new PIXI.Graphics();
    bg.beginFill(0x4CAF50);
    bg.drawRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, bHeight, 30);
    bg.endFill();
    button.addChild(bg);



    const text = new PIXI.Text(label, { 
        fontFamily: 'Noto Sans Bengali, Arial', 
        fill: 'white', 
        align: 'center',
        fontSize: btnfontsize
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


//ygguyvhgctrdxweaed45w54edyug98yhyur6dr5d65r6576f87iuhoihoih86rfytg




  