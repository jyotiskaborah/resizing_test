const app = new PIXI.Application({
    resizeTo: window,
    backgroundColor: 0x222222,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });
  
  document.getElementById('game-container').appendChild(app.view);
  
  const gameScene = new PIXI.Container();
  app.stage.addChild(gameScene);
  
  let gameArea = new PIXI.Container();
  gameScene.addChild(gameArea);
  
  const gameWidth = 800;
  const gameHeight = 1200;
  
  const gameBox = new PIXI.Graphics();
  gameBox.beginFill(0x444444);
  gameBox.drawRect(0, 0, gameWidth, gameHeight);
  gameBox.endFill();
  gameArea.addChild(gameBox);
  
  gameArea.x = (app.screen.width - gameWidth) / 2;
  gameArea.y = (app.screen.height - gameHeight) / 2;
  
  // Display Text at top center
  const infoText = new PIXI.Text('', { fill: 'white', fontSize: 24 });
  infoText.anchor.set(0.5, 0);
  infoText.x = gameWidth / 2;
  infoText.y = 150;
  gameArea.addChild(infoText);
  
  function createButton(label, x, y) {
    const btn = new PIXI.Container();
    btn.interactive = true;
    btn.buttonMode = true;
  
    const bg = new PIXI.Graphics();
    bg.beginFill(0x6666ff);
    bg.drawRoundedRect(-40, -20, 80, 40, 10);
    bg.endFill();
    btn.addChild(bg);
  
    const text = new PIXI.Text(label, { fill: 'white', fontSize: 14 });
    text.anchor.set(0.5);
    btn.addChild(text);
  
    btn.x = x;
    btn.y = y;
  
    btn.on('pointerdown', () => {
      infoText.text = `You pressed: ${label}`;
    });
  
    return btn;
  }
  
  const margin = 30;
  gameArea.addChild(createButton('TL', margin, margin));
  gameArea.addChild(createButton('TR', gameWidth - margin, margin));
  gameArea.addChild(createButton('BL', margin, gameHeight - margin));
  gameArea.addChild(createButton('BR', gameWidth - margin, gameHeight - margin));
  gameArea.addChild(createButton('MID', gameWidth / 2, gameHeight / 2));
  
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
  