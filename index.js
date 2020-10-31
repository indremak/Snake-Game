const requestAnimationFrame =
  window.requestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  window.webkitRequestAnimationFrame;

const cancelAnimationFrame =
  window.cancelAnimationFrame || window.mozCancelAnimationFrame;

let requestAnimationFrameID;

const STATE_PLAYING = 1;
const STATE_GAME_OVER = 2;
const STATE_PAUSED = 3;

const board = document.querySelector(".board");

const score = document.querySelector(".score-number");
const highScore = document.querySelector(".high-score-number");

const newGameBtn = document.querySelector(".btn-newGame");
const pauseBtn = document.querySelector(".btn-pause");
const startBtn = document.querySelector(".btn-start");

const audioBtn = document.querySelector(".btn-audio");
const audioOnIcon = document.querySelector(".icon-audio-on");
const audioOffIcon = document.querySelector(".icon-audio-off");
const musicOnIcon = document.querySelector(".icon-music_note");
const musicOffIcon = document.querySelector(".icon-music_off");
const bgMusic = document.querySelector(".btn-bgm");

const gameOverText = document.getElementById("game-over");
const inv = document.querySelector(".btn-inv");
const desc = document.querySelector(".desc");
const hardModeCheckbox = document.querySelector("#switch__checkbox");

const HIGHSCORESTRING = "highscore";

const HARDMODEHIGHSCORESTRING = "hardmodehighscore";

const STARTSPEED = 200;
const SPEEDINCREMENT = 5;
const MINSPEED = 25;
const MAX_DIRECTION_BUFFER_LENGTH = 3;
let hardMode = 0;
const audio = {
  eat: new Audio("assets/sounds/eat.wav"),
  hit: new Audio("assets/sounds/hit.wav"),
  lost: new Audio("assets/sounds/lost.wav"),
  enabled: true,
};
let backgroundMusicEnabled = true;

let boardWidth = 20;
let boardHeight = 15;

let gameState;

function setBoardDimension() {
  const cellWidth = (cellHeight =
    Math.min(800, document.body.clientWidth) / 20);
  const root = document.body;
  root.style.setProperty("--cellWidth", `${cellWidth}px`);
  root.style.setProperty("--cellHeight", `${cellHeight}px`);
}

function createBoard(x, y) {
  let cellNumber = 0;
  for (let i = 0; i < y; i++) {
    for (let j = 0; j < x; j++) {
      let cell = document.createElement("div");
      cell.classList.add("cell");
      cell.classList.add(`cell-${cellNumber}`);
      board.appendChild(cell);
      cellNumber++;
    }
  }
}

function drawSnake() {
  for (let i = 0; i < gameState.snake.length; i++) {
    if (i === 0) {
      updateSnakeCell("add-head", gameState.snake[i]);
    } else {
      updateSnakeCell("add", gameState.snake[i]);
    }
  }
}

function createFood() {
  let foodCell = Math.floor(Math.random() * 300);
  //checks if food doesnt appear where snake is
  if (!gameState.snake.includes(foodCell)) {
    gameState.food = foodCell;
  } else {
    createFood();
  }
}

// remove or add snake class to cell
function updateSnakeCell(action, cellNumber) {
  let cellEl = document.querySelector(`.cell-${cellNumber}`);
  cellEl.classList.remove("snake-head__first-position");
  cellEl.classList.remove("snake-head__second-position");
  if (action === "add-head") {
    if (gameState.direction === "left" || gameState.direction === "right") {
      cellEl.classList.add("snake-head__first-position");
    }
    if (gameState.direction === "up" || gameState.direction === "down") {
      cellEl.classList.add("snake-head__second-position");
    }
  }
  if (action === "add") {
    cellEl.classList.add("hasSnake");
  }
  if (action === "remove") {
    cellEl.classList.remove("hasSnake");
  }
}

function updateFoodCell(action, cellNumber) {
  let cellEl = document.querySelector(`.cell-${cellNumber}`);
  if (action === "add") {
    cellEl.classList.add("food");
  }
  if (action === "remove") {
    cellEl.classList.remove("food");
  }
}

//call function every time snake moves
function eatFood() {
  if (gameState.snakeStart === gameState.food) {
    updateFoodCell("remove", gameState.food);
    createFood();
    updateFoodCell("add", gameState.food);
    gameState.score += Math.ceil((gameState.score+1)/10);
    increaseSpeed();
    showScore();
    return true;
  }
}

function showScore() {
  score.innerHTML = gameState.score;
}

//keycode: up 38, down 40, right 39, left 37
// w: 87, a: 65, s: 83, d: 68
function handleInput(e) {
  if (e.keyCode === 82) {
    init();
  } else if (e.keyCode === 39 || e.keyCode === 68) {
    if (hardMode === 0) {
      addNewDirection("right");
    } else {
      addNewDirection("left");
    }
  } else if (e.keyCode === 37 || e.keyCode === 65) {
    if (hardMode === 0) {
      addNewDirection("left");
    } else {
      addNewDirection("right");
    }
  } else if (e.keyCode === 38 || e.keyCode === 87) {
    if (hardMode === 0) {
      addNewDirection("up");
    } else {
      addNewDirection("down");
    }
  } else if (e.keyCode === 40 || e.keyCode === 83) {
    if (hardMode === 0) {
      addNewDirection("down");
    } else {
      addNewDirection("up");
    }
  }
  // The arrow keys can scroll the window while playing, we disable this
  e.preventDefault();
}

let xDown = null;
let yDown = null;

function getTouches(evt) {
  return (
    evt.touches || // browser API
    evt.originalEvent.touches
  ); // jQuery
}

function handleTouchStart(evt) {
  const firstTouch = getTouches(evt)[0];
  xDown = firstTouch.clientX;
  yDown = firstTouch.clientY;
}

function handleTouchMove(evt) {
  if (!xDown || !yDown) {
    return;
  }

  var xUp = evt.touches[0].clientX;
  var yUp = evt.touches[0].clientY;

  var xDiff = xDown - xUp;
  var yDiff = yDown - yUp;

  if (Math.abs(xDiff) > Math.abs(yDiff)) {
    /*most significant*/
    if (xDiff > 0) {
      /* left swipe */
      addNewDirection("left");
    } else {
      /* right swipe */
      addNewDirection("right");
    }
  } else {
    if (yDiff > 0) {
      /* up swipe */
      addNewDirection("up");
    } else {
      /* down swipe */
      addNewDirection("down");
    }
  }
  /* reset values */
  xDown = null;
  yDown = null;
}

function addNewDirection(direction) {
  const buffer = gameState.directionBuffer;
  if (
    buffer[buffer.length - 1] !== direction &&
    buffer.length < MAX_DIRECTION_BUFFER_LENGTH
  ) {
    gameState.directionBuffer.push(direction);
  }
}

function move() {
  const lastCell = gameState.snake[gameState.snake.length - 1];
  const nextMove = gameState.directionBuffer.shift();
  const invalidDirectionCombinations = [
    "right_left",
    "left_right",
    "up_down",
    "down_up",
  ];
  if (
    nextMove &&
    !invalidDirectionCombinations.includes(`${nextMove}_${gameState.direction}`)
  ) {
    gameState.direction = nextMove;
  }

  let start;
  if (gameState.direction === "right") {
    start = gameState.snakeStart + 1;
  } else if (gameState.direction === "left") {
    start = gameState.snakeStart - 1;
  } else if (gameState.direction === "up") {
    start = gameState.snakeStart - boardWidth;
  } else if (gameState.direction === "down") {
    start = gameState.snakeStart + boardWidth;
  }
  gameState.snake.unshift(start);
  gameState.snakeStart = start;

  if (hasLost()) {
    gameOver();
    return;
  }

  let ateFood = eatFood();
  if (!ateFood) {
    updateSnakeCell("remove", lastCell);
    gameState.snake.pop();
  } else {
    audio.enabled && audio.eat.cloneNode().play();
  }
  drawSnake();
}

function hasLost() {
  const dir = gameState.direction;
  const start = gameState.snakeStart;
  return (
    (dir === "right" && start % boardWidth === 0) ||
    (dir === "left" && (start < 0 || start % boardWidth === boardWidth - 1)) ||
    (dir === "up" && start < 0) ||
    (dir === "down" && start > boardWidth * boardHeight) ||
    gameState.snake.slice(1, gameState.snake.length - 1).includes(start)
  );
}

function increaseSpeed() {
  gameState.speed = Math.max(MINSPEED, gameState.speed - SPEEDINCREMENT);
}

function startAnimation() {
  requestAnimationFrame(onEachFrame);
}

let ts;
function onEachFrame(timestamp) {
  if (gameState.state === STATE_PLAYING) {
    if (!ts || timestamp - ts > gameState.speed) {
      this.move();
      ts = timestamp;
    }
    requestAnimationFrameID = requestAnimationFrame(onEachFrame);
  } else {
    cancelAnimationFrame(requestAnimationFrameID);
  }
}

function startGame() {
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  startAnimation();
}

function gameOver() {
  if (audio.enabled) {
    audio.hit.play().catch(() => (gameOverText.style.display = "initial"));
    audio.hit.addEventListener("ended", () => {
      audio.lost.play();
      gameOverText.style.display = "initial";
    });
  } else {
    gameOverText.style.display = "initial";
  }
  
  gameState.state = STATE_GAME_OVER;


  if(hardMode ===1){
    setHardModeHighScore(gameState.score);
  }else{
    setHighScore(gameState.score);
  }
  pauseBtn.disabled = true;
  startBtn.disabled = true;
}

startBtn.addEventListener("click", () => {
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  gameState.state = STATE_PLAYING;
  startAnimation();
});

pauseBtn.addEventListener("click", () => {
  gameState.state = STATE_PAUSED;
  startBtn.disabled = false;
  pauseBtn.disabled = true;
});
//Hard Mode high Score
function setHardModeHighScore(score) {
  let currentHardModeHighScore = localStorage.getItem(HARDMODEHIGHSCORESTRING);
  if (currentHardModeHighScore != null) {
    if (score > currentHardModeHighScore) {
      localStorage.setItem(HARDMODEHIGHSCORESTRING, score);
    }
  } else {
    localStorage.setItem(HARDMODEHIGHSCORESTRING, score);
  }
  displayHardModeHighScore();
}

function displayHardModeHighScore() {
  highScore.innerHTML = getHardModeHighScore();
}

function getHardModeHighScore() {
  let currentHardModeHighScore = localStorage.getItem(HARDMODEHIGHSCORESTRING);
  if (currentHardModeHighScore != null) {
    return currentHardModeHighScore;
  } else {
    return 0;
  }
}


//================================================================

function setHighScore(score) {
  let currentHighScore = localStorage.getItem(HIGHSCORESTRING);
  if (currentHighScore != null) {
    if (score > currentHighScore) {
      localStorage.setItem(HIGHSCORESTRING, score);
    }
  } else {
    localStorage.setItem(HIGHSCORESTRING, score);
  }
  displayHighScore();
}

function displayHighScore() {
  highScore.innerHTML = getHighScore();
}

function getHighScore() {
  let currentHighScore = localStorage.getItem(HIGHSCORESTRING);
  if (currentHighScore != null) {
    return currentHighScore;
  } else {
    return 0;
  }
}

function toggleMusic() {
  let backgroundMusic = document.getElementById("player");
  backgroundMusicEnabled = !backgroundMusicEnabled;
  if (backgroundMusicEnabled) {
    musicOnIcon.classList.remove("hidden");
    musicOffIcon.classList.add("hidden");
    backgroundMusic.play();
  } else {
    musicOnIcon.classList.add("hidden");
    musicOffIcon.classList.remove("hidden");
    backgroundMusic.pause();
  }
}
function startMusic() {
  let backgroundMusic = document.getElementById("player");
  backgroundMusic.play();
}

bgMusic.addEventListener("click", toggleMusic);

hardModeCheckbox.addEventListener("click", () => {
  if (hardModeCheckbox.checked) {
    hardMode = 1;
    displayHardModeHighScore();
    desc.style.opacity = "1";
  } else {
    hardMode = 0;
    displayHighScore();
    desc.style.opacity = "0";
  }
});

function stopSounds() {
  audio.hit.pause();
  audio.hit.currentTime = 0;
  audio.lost.pause();
  audio.lost.currentTime = 0;
}

function toggleAudio() {
  audio.enabled = !audio.enabled;
  if (audio.enabled) {
    audioOnIcon.classList.remove("hidden");
    audioOffIcon.classList.add("hidden");
  } else {
    audioOnIcon.classList.add("hidden");
    audioOffIcon.classList.remove("hidden");
  }
}

function init() {
  gameState = {
    snake: [147, 146, 145],
    snakeStart: 147,
    direction: "right",
    speed: STARTSPEED,
    score: 0,
    directionBuffer: [],
    state: STATE_PLAYING,
  };
  cancelAnimationFrame(requestAnimationFrameID);
  if(hardMode === 1){
    displayHardModeHighScore();
  }else {
    displayHighScore();
  }
 
  stopSounds();
  gameOverText.style.display = "none";
  board.innerHTML = "";
  setBoardDimension();
  createBoard(boardWidth, boardHeight);
  createFood();
  drawSnake();
  updateFoodCell("add", gameState.food);
  startGame();
  desc.style.opacity = "0";
}

document.addEventListener("keydown", handleInput);
document.addEventListener("touchstart", handleTouchStart, false);
document.addEventListener("touchmove", handleTouchMove, false);
window.addEventListener("resize", setBoardDimension);
newGameBtn.addEventListener("click", init);
audioBtn.addEventListener("click", toggleAudio);

init();
startMusic();
