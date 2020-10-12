const board = document.querySelector(".board");
const score = document.querySelector(".score-number");
const highScore = document.querySelector(".high-score-number");
const pauseBtn = document.querySelector(".btn-pause");
const startBtn = document.querySelector(".btn-start");
const gameOverText = document.getElementById("game-over");
const newGameBtn = document.querySelector(".btn-newGame");

const HIGHSCORESTRING = "highscore";

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

function drawSnake(snakeLength) {
  for (let i = 0; i < snakeLength; i++) {
    updateSnakeCell("add", gameState.snake[i]);
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

// remove or add hasSnake class to cell
function updateSnakeCell(action, cellNumber) {
  let cellEl = document.querySelector(`.cell-${cellNumber}`);
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
    gameState.snakeLength++;

    updateFoodCell("remove", gameState.food);

    createFood();
    updateFoodCell("add", gameState.food);
    gameState.score++;
    showScore();
    return true;
  }
}

function showScore() {
  score.innerHTML = gameState.score;
}
let movementTimer;
/* Add: When keyup happens, just reset the movementTimer  */
document.addEventListener("keyup", () => {
  console.log(movementTimer);
  if (movementTimer) {
    clearTimeout(movementTimer);
    movementTimer = null;
  }
});
//keycode: up 38, down 40, right 39, left 37
function changeDirection(e) {
  console.log(e);
  if (!movementTimer) {
    if (e.keyCode === 39) {
      if (gameState.direction === "left") {
        return;
      }
      gameState.direction = "right";
    }
    if (e.keyCode === 37) {
      if (gameState.direction === "right") {
        return;
      }
      gameState.direction = "left";
    }
    if (e.keyCode === 38) {
      if (gameState.direction === "down") {
        return;
      }
      gameState.direction = "up";
    }
    if (e.keyCode === 40) {
      if (gameState.direction === "up") {
        return;
      }
      gameState.direction = "down";
    }
    if (e.keyCode === 82) {
      init();
    }
    movementTimer = setTimeout(() => {
      movementTimer = null;

      /* Your movementTimer interval - reduce/increase this number to suit you needs */
    }, 1000);
  }
}

function move() {
  let lastCell = gameState.snake[gameState.snakeLength - 1];
  let start;
  if (gameState.direction === "right") {
    start = gameState.snakeStart + 1;
    if (start % boardWidth === 0) {
      gameOver();
      return;
    }
  } else if (gameState.direction === "left") {
    start = gameState.snakeStart - 1;
    if (start < 0 || start % boardWidth === boardWidth - 1) {
      gameOver();
      return;
    }
  } else if (gameState.direction === "up") {
    start = gameState.snakeStart - boardWidth;
    if (start < 0) {
      gameOver();
      return;
    }
  } else if (gameState.direction === "down") {
    start = gameState.snakeStart + boardWidth;
    if (start > boardWidth * boardHeight) {
      gameOver();
      return;
    }
  }
  if (gameState.snake.includes(start)) {
    gameOver();
    return;
  }
  gameState.snakeStart = start;
  gameState.snake.unshift(start);
  let ateFood = eatFood();
  if (!ateFood) {
    updateSnakeCell("remove", lastCell);
    gameState.snake.pop();
  }
  drawSnake(gameState.snakeLength);
}

let intervalId;

function startGame() {
  intervalId = setInterval(move, 200);
  startBtn.disabled = true;
  pauseBtn.disabled = false;
}

function gameOver() {
  setHighScore(gameState.score);
  gameOverText.style.display = "initial";
  clearInterval(intervalId);
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

function init() {
  gameState = {
    snakeLength: 3,
    snake: [147, 146, 145],
    snakeStart: 147,
    direction: "right",
    score: 0,
  };
  displayHighScore();
  gameOverText.style.display = "none";
  board.innerHTML = "";
  createBoard(boardWidth, boardHeight);
  createFood();
  drawSnake(gameState.snakeLength, gameState.snakeStart);
  updateFoodCell("add", gameState.food);
  startGame();
}

startBtn.addEventListener("click", startGame);
document.addEventListener("keydown", changeDirection);
newGameBtn.addEventListener("click", init);

init();
