$(document).ready(function () {
   let grid, gridSize, snake, tail, gameLoop, dir, lives, file;
   let coef = 20,
      score = 0;
   let backButton = $("#back");
   let canvas = $("#canvas"),
      ctx = canvas[0].getContext("2d");
   let snakeSVG = new Image(),
      appleSVG = new Image(),
      heartSVG = new Image();
   snakeSVG.src = "./snake_tip.svg";
   appleSVG.src = "./apple.svg";
   heartSVG.src = "./heart.svg";

   function changeMenu() {
      let divmenu = $("#menu");
      let divgame = $("#game");
      if (divgame.is(":visible")) {
         divgame.hide();
         divmenu.show();
      } else {
         divgame.show();
         divmenu.hide();
      }
   }

   function startLevel(filename) {
      $.getJSON("./levels/" + filename + ".json", function (json) {
         changeScore();
         console.log(json.delay);
         gridSize = json.dimensions;
         snake = json.snake;
         dir = [snake[0][0] - snake[1][0], snake[0][1] - snake[1][1]];

         grid = [...Array(gridSize)].map((_e) => Array(gridSize).fill("EMPTY"));
         ctx.canvas.width = gridSize * coef;
         ctx.canvas.height = gridSize * coef;

         updateCell(json.food, "FOOD");
         updateCell(snake[0], "HEAD");
         snake.slice(1, snake.length).forEach((item) => {
            updateCell(item, "SNAKE");
         });

         canvas.css("top", "0");
         backButton.css("top", "0");

         gameLoop = setInterval(function () {
            step();
         }, json.delay);
      });
   }

   function step() {
      tail = [snake[snake.length - 1][0], snake[snake.length - 1][1]];
      snakeMovement();
      if (!hitboxesChecker()) {
         if (isEating()) {
            score++;
            changeScore();
            snake[snake.length] = [tail[0], tail[1]];
            addFood();
         }
         gridRefresh();
      } else {
         clearInterval(gameLoop);
         lives--;
         removeHeart();
         if (lives > 0) {
            sleep(750).then(() => {
               startLevel(file);
            });
         } else {
            score = 0;
         }
         console.log("game over");
      }
   }

   function snakeMovement() {
      let curDir = [snake[0][0] - snake[1][0], snake[0][1] - snake[1][1]];
      snake.pop();

      if (arrayEquals(curDir, [-dir[0], -dir[1]])) {
         snake.unshift([snake[0][0] + curDir[0], snake[0][1] + curDir[1]]);
      } else {
         snake.unshift([snake[0][0] + dir[0], snake[0][1] + dir[1]]);
      }
      dir = [snake[0][0] - snake[1][0], snake[0][1] - snake[1][1]];
   }

   function hitboxesChecker() {
      let check = false;
      if (
         snake[0][0] < 0 ||
         snake[0][0] > gridSize - 1 ||
         snake[0][1] < 0 ||
         snake[0][1] > gridSize - 1
      ) {
         return true;
      }

      snake.slice(4, snake.length).forEach((item) => {
         check = check || arrayEquals(item, snake[0]);
      });
      return check;
   }

   function gridRefresh() {
      if (!isEating()) {
         updateCell(tail, "EMPTY");
      }
      updateCell(snake[0], "HEAD");
      updateCell(snake[1], "SNAKE");
   }

   function isEating() {
      return grid[snake[0][0]][snake[0][1]] === "FOOD";
   }

   function addFood() {
      let retry, random;

      do {
         retry = false;
         random = [getRandomInt(0, gridSize), getRandomInt(0, gridSize)];
         snake.forEach((item) => {
            retry = retry || arrayEquals(item, random);
         });
      } while (retry === true);
      updateCell(random, "FOOD");
   }

   function changeScore() {
      $("#score").text(score);
   }

   function addLives() {
      let heart = $("#heart");
      heart.empty();
      for (let i = 0; i < lives; i++) {
         heart.append("<img src='" + heartSVG.src + "' width='15px' height='15px' alt='heart'/>");
      }
   }

   function removeHeart() {
      let heart = $("#heart");
      heart.find("img:last").remove();
      if (lives === 0){
         heart.append("<p>Game Over</p>");
         canvas.css("top", "-14.5px");
         backButton.css("top", "-14.5px");
      }
   }

   function updateCell(cell, type) {
      switch (type) {
         case "EMPTY":
            drawSquare(cell, "#222222");
            break;
         case "SNAKE":
            drawSquare(cell, "#008800");
            break;
         case "HEAD":
            drawHead(cell);
            break;
         case "FOOD":
            ctx.drawImage(appleSVG, cell[0] * coef, cell[1] * coef);
            break;
         default:
      }
      grid[cell[0]][cell[1]] = type;
   }

   function drawSquare(cell, colorCode) {
      ctx.beginPath();
      ctx.rect(cell[0] * coef, cell[1] * coef, coef, coef);
      ctx.fillStyle = colorCode;
      ctx.fill();
   }

   function drawHead(cell) {
      let canvasX = cell[0] * coef,
         canvasY = cell[1] * coef;
      if (arrayEquals(dir, [1, 0])) {
         drawRotated(snakeSVG, canvasX, canvasY, Math.PI / 2);
      } else if (arrayEquals(dir, [-1, 0])) {
         drawRotated(snakeSVG, canvasX, canvasY, -Math.PI / 2);
      } else if (arrayEquals(dir, [0, 1])) {
         drawRotated(snakeSVG, canvasX, canvasY, Math.PI);
      } else if (arrayEquals(dir, [0, -1])) {
         ctx.drawImage(snakeSVG, canvasX, canvasY);
      }
   }

   function drawRotated(image, x, y, radian) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(radian);
      ctx.translate(-x, -y);
      switch (radian) {
         case Math.PI:
            ctx.drawImage(image, x - coef, y - coef);
            break;
         case -Math.PI / 2:
            ctx.drawImage(image, x - coef, y);
            break;
         case Math.PI / 2:
            ctx.drawImage(image, x, y - coef);
            break;
      }
      ctx.restore();
   }

   $(document).keydown(function (event) {
      if (event.which === 38) {
         dir = [0, -1];
      } else if (event.which === 37) {
         dir = [-1, 0];
      } else if (event.which === 39) {
         dir = [1, 0];
      } else if (event.which === 40) {
         dir = [0, 1];
      }
   });

   $("#lvl1").click(function () {
      changeMenu();
      lives = 3;
      addLives();
      file = "level1";
      startLevel(file);
   });
   $("#lvl2").click(function () {
      changeMenu();
      lives = 3;
      addLives();
      file = "level2";
      startLevel(file);
   });
   $("#lvl3").click(function () {
      changeMenu();
      lives = 5;
      addLives();
      file = "level3";
      startLevel(file);
   });
   backButton.click(function () {
      if (gameLoop) {
         clearInterval(gameLoop);
         score = 0;
      }
      changeMenu();
   });
});

const sleep = (milliseconds) => {
   return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

function getRandomInt(min, max) {
   min = Math.ceil(min);
   max = Math.floor(max);
   return Math.floor(Math.random() * (max - min)) + min;
}

function arrayEquals(a, b) {
   return (
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((val, index) => val === b[index])
   );
}
