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


//------------------------     UI state     ------------------------
const padding = 20;
const fontSize = 25;
const btnfontsize = 30;
const stackFontsize = 30;
const rowHeight = 70;
const stackWidth = 70;
const boxWidth = 70;

//------------------------     Container state     ------------------------
let mainContainer, homeContainer, uiContainer;



const gameBox = new PIXI.Graphics();
gameBox.beginFill(0x444444);
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
scaleGameArea();

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
    homeContainer.visible = false;

    const bg = new PIXI.Graphics();
    bg.beginFill(0xcccc99);
    bg.drawRect(0, 0, gameWidth, gameHeight);
    bg.endFill();
    homeContainer.addChild(bg);

    const logoTexture = PIXI.Texture.from('assets/logo.png');
    const logo = new PIXI.Sprite(logoTexture);
    logo.anchor.set(0.5);
    logo.position.set(gameWidth / 2, gameHeight * 0.30);
    homeContainer.addChild(logo);

    const playButton = createButton('Play', gameWidth / 2, gameHeight * 0.60, startGame);
    homeContainer.addChild(playButton);
}

function setupUiScene() {
    uiContainer = new PIXI.Container();
    gameArea.addChild(uiContainer);

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

    setupHighlight();


    stacks = [
      {
        "letters": [
          "মে"
        ],
        "selectedIndex": 0,
        "x": 0,
        "y": 0
      },
      {
        "letters": [
          "ৰা"
        ],
        "selectedIndex": 0,
        "x": 0,
        "y": 0
      },
      {
        "letters": [
          "শে",
          "ঞ্চ",
          "ম"
        ],
        "selectedIndex": 0,
        "x": 0,
        "y": 0
      },
      {
        "letters": [
          "তি"
        ],
        "selectedIndex": 0,
        "x": 0,
        "y": 0
      }
    ];



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
    const startX = (gameWidth - totalWidth) / 2 + stackWidth / 2;
    stacks.forEach((stack, i) => {
        const k = stack.selectedIndex;
        stack.container.x = startX + i * stackWidth;
        stack.container.y = gameHeight / 2 - (k * rowHeight + rowHeight);
    });

    console.log('Level setup complete');

}

function createStack(index, letters) {
    const container = new PIXI.Container();
    const stackHeight = rowHeight * letters.length;

    letters.forEach((letter, i) => {
        const box = new PIXI.Graphics();
        box.lineStyle(2, 0x000000);
        box.beginFill(0xcccccc);
        box.drawRect(-boxWidth / 2, i * rowHeight, boxWidth, rowHeight);
        box.endFill();
        container.addChild(box);

        const text = new PIXI.Text(letter, {
            fontFamily: 'Noto Sans Bengali, Arial',
            fontSize: stackFontsize,
            fill: 0x000000,
            align: 'center'
        });
        text.anchor.set(0.5);
        text.position.set(0, i * rowHeight + rowHeight / 2);
        container.addChild(text);
    });

    container.eventMode = 'dynamic'; // or 'dynamic' if the container moves frequently
    container.hitArea = new PIXI.Rectangle(-boxWidth / 2, 0, boxWidth, stackHeight);
    container.cursor = 'pointer';


    return { container };

}



function createButton(label, x, y, onClick) {
    const button = new PIXI.Container();
    button.eventMode = 'static';
    button.cursor = 'pointer';

    const bg = new PIXI.Graphics();
    bg.beginFill(0x4CAF50);
    bg.drawRoundedRect(-180, -40, 360, 80, 30);
    bg.endFill();
    button.addChild(bg);

    const text = new PIXI.Text(label, { 
        fontFamily: 'Noto Sans Bengali, Arial', 
        fill: 'white', 
        fontSize: btnfontsize
    });
    text.anchor.set(0.5);
    button.addChild(text);

    button.x = x;
    button.y = y;

    button.on('pointerdown', onClick);
    button.on('pointerover', () => button.tint = 0x45a049); // Darker green on hover
    button.on('pointerout', () => button.tint = 0xffffff);  // Reset tint

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




  