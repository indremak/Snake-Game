const board = document.querySelector(".board");
const score = document.querySelector(".score-number");
const highScore = document.querySelector(".high-score-number");
const pauseBtn = document.querySelector(".btn-pause");
const startBtn = document.querySelector(".btn-start");
const gameOverText = document.getElementById("game-over");
const newGameBtn = document.querySelector(".btn-newGame");
const bgm = document.querySelector(".btn-bgm");

const HIGHSCORESTRING = "highscore";
const STARTSPEED = 200;
const SPEEDINCREMENT = 5;
const MINSPEED = 25;
const MAX_DIRECTION_BUFFER_LENGTH = 3;

const audio = {
  eat: new Audio('assets/sounds/eat.wav'),
  hit: new Audio('assets/sounds/hit.wav'),
  lost: new Audio('assets/sounds/lost.wav'),
}

let boardWidth = 20;
let boardHeight = 15;

let gameState;

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
    gameState.score++;
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
  if (e.keyCode === 39 || e.keyCode === 68) {
    addNewDirection("right");
  } else if (e.keyCode === 37 || e.keyCode === 65) {
    addNewDirection("left");
  } else if (e.keyCode === 38 || e.keyCode === 87) {
    addNewDirection("up");
  } else if (e.keyCode === 40 || e.keyCode === 83) {
    addNewDirection("down");
  } else if (e.keyCode === 82) {
    init();
  }
}

function addNewDirection(direction) {
  const buffer = gameState.directionBuffer;
  if (buffer[buffer.length - 1] !== direction && buffer.length < MAX_DIRECTION_BUFFER_LENGTH) {
    gameState.directionBuffer.push(direction);
  }
}

function move() {
  const lastCell = gameState.snake[gameState.snake.length - 1];
  const nextMove = gameState.directionBuffer.shift();
  const invalidDirectionCombinations = ["right_left", "left_right", "up_down", "down_up"];
  if (nextMove && !invalidDirectionCombinations.includes(`${nextMove}_${gameState.direction}`)) {
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
    audio.eat.play();
  }
  drawSnake();
}

function hasLost() {
  const dir = gameState.direction;
  const start = gameState.snakeStart;
  return (dir === "right" && start % boardWidth === 0) ||
  (dir === "left" && (start < 0 || start % boardWidth === boardWidth - 1)) ||
  (dir === "up" && start < 0) ||
  (dir === "down" && (start > boardWidth * boardHeight)) ||
  gameState.snake.slice(1, gameState.snake.length - 1).includes(start);
}

let intervalId;

function increaseSpeed() {
  clearInterval(intervalId);
  gameState.speed = Math.max(MINSPEED, gameState.speed - SPEEDINCREMENT);
  intervalId = setInterval(move, gameState.speed);
}

function startGame() {
  intervalId = setInterval(move, gameState.speed);
  startBtn.disabled = true;
  pauseBtn.disabled = false;
}

function gameOver() {
  audio.hit.play().catch(() => gameOverText.style.display = "flex");
  audio.hit.addEventListener("ended", () => {
    audio.lost.play()
    gameOverText.style.display = "flex";
  });
  clearInterval(intervalId);
  setHighScore(gameState.score);
  pauseBtn.disabled = true;
  startBtn.disabled = true;
}

pauseBtn.addEventListener("click", () => {
  clearInterval(intervalId);
  startBtn.disabled = false;
  pauseBtn.disabled = true;
});

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

function startbgm(){
  let x = document.getElementById("player");
  x.play();
}

bgm.addEventListener("click",()=>{
  let x = document.getElementById("player");
  let text = bgm.innerHTML;
  if(text == "Stop Music"){
    bgm.innerHTML = "Play Music";
    x.pause();
  }else{
    bgm.innerHTML = "Stop Music";
    x.play();
  }

});


function stopSounds() {
  audio.hit.pause();
  audio.hit.currentTime = 0;
  audio.lost.pause();
  audio.lost.currentTime = 0;
}

function init() {
  gameState = {
    snake: [147, 146, 145],
    snakeStart: 147,
    direction: "right",
    speed: STARTSPEED,
    score: 0,
    directionBuffer: [],
  };
  clearInterval(intervalId);
  displayHighScore();
  stopSounds();
  gameOverText.style.display = "none";
  board.innerHTML = "";
  createBoard(boardWidth, boardHeight);
  createFood();
  drawSnake();
  updateFoodCell("add", gameState.food);
  startGame();
  startbgm();
}

startBtn.addEventListener("click", startGame);
document.addEventListener("keydown", handleInput);
newGameBtn.addEventListener("click", init);

init();
