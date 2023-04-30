"use strict";

//DOM selectors initialisings
const loadingBox = document.querySelector(".box");

const game = document.querySelector(".game");
const boardContainer = document.querySelector(".board__container");
const inputContainer = document.querySelector(".input__container");
const help = document.querySelector(".help__btn");
const stats = document.querySelector(".stats__btn");
const input = document.querySelector(".input");
const dropdown = document.querySelector(".dropdown__content");
const attempts = document.querySelector(".attempts");

const modal = document.getElementById("myModal");
const span = document.querySelectorAll(".close");
const played = document.getElementById("played");
const winsPerc = document.getElementById("wins%");
const wins = document.getElementById("wins");
const losses = document.getElementById("lost");
const countdown = document.querySelector(".countdown");
const guessDistr = document.querySelector(".guessDistribution");

const positions = {
  Goalkeeper: "GK",
  Defender: "DEF",
  Midfielder: "MID",
  Attacker: "ATT",
};

//Class to encapsulate app info
class App {
  #players;
  #history = {
    averageGuesses: 0,
    currentStreak: 0,
    fails: 0,
    gamesPlayed: 0,
    gamesWon: 0,
    guesses: [0, 0, 0, 0, 0, 0],
    maxStreak: 0,
    winPercentage: 0,
  };
  #result = [];
  #userGuess;
  #stats;

  constructor() {
    this.__updateLocalStorage.bind(this);

    (async function () {
      try {
        //getting history from local storage if exists or initialise if first time player
        this.#history = this.__asyncLocalStorage.getItem() || this.#history;

        console.log("Getting players from server");
        const response = await this.__getPlayers();
        const resp = await response.json();
        this.#players = resp.players;

        console.log("Fetching data from local storage");

        this.__localStorageBackup();
      } catch (err) {
        console.error(err);
      } finally {
        loadingBox.style.display = "none";
        boardContainer.style.display = "flex";
      }
    }).bind(this)();

    dropdown.addEventListener("click", (e) => {
      this.__checkGuess(e.target.closest("li").id);
    });

    input.addEventListener("input", this.__predictiveText.bind(this));
    help.addEventListener("click", this.__showModal.bind(this));
    stats.addEventListener("click", this.__showModal.bind(this));

    span.forEach((e) => {
      e.onclick = this.__closeModal;
    });

    window.onclick = (event) => {
      if (event.target == modal) this.__closeModal(event);
    };
    this.__timer();
  }

  //GET and SET game data in local storage
  __asyncLocalStorage = {
    setItem: function (string, item) {
      //await null;
      localStorage.setItem(string, JSON.stringify(item));
    },
    getItem: function () {
      //await null;
      return JSON.parse(localStorage.getItem("footuizHistory"));
    },
  };

  __getPlayers = async () =>
    await fetch("http://3.8.180.45:9000/api/v1/players/getAllPlayers");

  //Delay function
  __wait(seconds) {
    return new Promise(function (resolve) {
      setTimeout(resolve, seconds * 1000);
    });
  }

  //Close the modal when user interacts with the button or background
  __closeModal(e) {
    this.parentElement?.classList.toggle("hide");

    [...e.target.children].find(
      (e) => !e.classList.contains(`hide`) && e.classList.add("hide")
    );

    modal.classList.toggle("hide");
    boardContainer.style.filter = null;
  }

  //Showing modals on screen
  __showModal(e) {
    modal.classList.remove("hide");

    if (e?.target.parentElement.classList.contains("help__btn")) {
      modal.children[1].classList.toggle("hide");
    } else {
      modal.children[0].classList.toggle("hide");
    }

    boardContainer.style.filter = "blur(4px)";
    modal.style.display = null;
    modal.classList.add("fade-in");
  }

  //if there are stats history do this first
  __localStorageBackup() {
    //get game status
    this.#stats = JSON.parse(localStorage.getItem("stats"));

    //populate Statistics modal
    this.__populateStatistics();

    if (this.#stats) {
      attempts.textContent = ` ${5 - this.#stats.rowIndex}`;

      this.#stats.boardState.forEach(({ id }) =>
        this.#players.splice(
          this.#players.findIndex((e) => e.id === id),
          1
        )
      );

      for (let i = this.#stats.boardState.length - 1; i >= 0; i--) {
        //this.#result = this.#stats.evaluations[i];
        this.__createBoard(this.#stats.boardState[i], i);
      }

      if (this.#stats.gameStatus != "IN_PROGRESS") {
        this.__updateUI();
      } else {
        inputContainer.classList.remove("hide");
      }
    } else {
      inputContainer.classList.remove("hide");
      attempts.textContent += `5`;
      this.#stats = {
        boardState: [],
        evaluations: [],
        rowIndex: 0,
        solution:
          this.#players[Math.floor(Math.random() * this.#players.length) + 1],
        gameStatus: "IN_PROGRESS",
        lastPlayedTs: new Date().getTime(),
      };
    }
  }

  //Get JSONs for APIs
  async __getJSON(url) {
    return (
      await fetch(url, {
        method: "GET",
        redirect: "follow",
      })
    ).json();
  }

  //Predict player by taking current input and create dropdown
  __predictiveText() {
    dropdown.innerHTML = "";
    let predicted = [];
    let regex = new RegExp("^" + input.value, "i");

    //eric bailly won't work because his full name is Eric Bertrand Bailly
    for (let i in this.#players) {
      if (
        (regex.test(this.#players[i].name) ||
          regex.test(this.#players[i].firstname) ||
          regex.test(this.#players[i].lastname) ||
          regex.test(
            this.#players[i].firstname + " " + this.#players[i].lastname
          )) &&
        input.value.length != 0
      ) {
        predicted.push(this.#players[i]);
      }
    }

    predicted.forEach((e) => {
      dropdown.insertAdjacentHTML(
        "beforeend",
        `<li id ="${e.name}" ><img src=  "${e.teamLogo}"><p>${
          e.firstname + " " + e.lastname
        }</p></li>`
      );
    });
  }

  //function used to create another Div element
  __createDiv(className, obj) {
    const x = document.createElement("div");
    const playerName = document.createElement("p");

    playerName.textContent = obj.name;

    x.classList.add(className, "hide");

    boardContainer.children[0].insertAdjacentElement("afterend", x);

    document
      .querySelector(`.${className}`)
      .insertAdjacentElement("afterbegin", playerName);

    const img = document.createElement("img");
    img.src = obj.photo;
    document
      .querySelector(`.${className}`)
      .insertAdjacentElement("afterbegin", img);

    const board = document.createElement("div");
    board.classList.add("board");

    x.insertAdjacentElement("afterend", board);

    return board;
  }

  //Create the 5 x 6 grid where user enter inputs
  __createBoard(gehsus) {
    const board = this.__createDiv(["guess"], gehsus);

    for (let i = 0; i < 5; i++) {
      const html = `<div class="square hide""</div>`;
      board.insertAdjacentHTML("beforeend", html);
    }

    input.focus();
    this.__populateBoard(gehsus);
  }

  //check the guess against
  __isValuesSame(field) {
    //Checks if the fields for the correct answer are the same as those the user has guessed
    //Each field is then given a correct/ present / absent
    if (field === "team") {
      this.#result.push(
        this.#userGuess[field] == this.#stats.solution[field].name
          ? "correct"
          : this.#userGuess.league == this.#stats.solution.league.name
          ? "present"
          : "absent"
      );
    } else {
      this.#result.push(
        this.#userGuess[field] == this.#stats.solution[field]
          ? "correct"
          : "absent"
      );
    }
  }

  //Check the user guess against the correct answer
  __checkGuess(guess) {
    //Get the guess user made from data
    //Remove from list so user cant pick that player again
    [this.#userGuess] = this.#players.splice(
      this.#players.findIndex((e) => e.name === guess),
      1
    );

    ["nationality", "team", "number", "position", "age"].forEach((e) => {
      this.__isValuesSame(e);
    });

    //store data in LS if user closes app
    this.#stats.boardState.unshift(this.#userGuess);
    this.#stats.evaluations.unshift(this.#result);

    //Clear input and dropwdown after guess submission
    input.value = "";
    dropdown.textContent = "";
    this.#stats.rowIndex++;
    this.__createBoard(this.#userGuess);
    this.__checkResult(this.#stats.evaluations, this.#stats.rowIndex);

    //Clear results array after guess
    this.#result = [];
  }

  //Add items to each box
  __addToSquares = (node, html) => {
    node.insertAdjacentHTML("beforeend", html);
  };

  //Populate the board with user guess and related icons
  __populateBoard(gehsus) {
    const board = document.querySelector(".board");
    const guess = document.querySelector(".guess");
    const missingCountries = ["England", "Wales", "Scotland"];

    (async function () {
      const country = missingCountries.includes(gehsus.nationality)
        ? "United Kingdom"
        : gehsus.nationality;

      try {
        const flag = await this.__getJSON(
          `https://restcountries.com/v3.1/name/${country}`
        );
        const html = `<img src="${flag[0].flags.svg}"></img>`;

        //[0] Adds players national flag to the board
        this.__addToSquares(board.childNodes[0], html);

        //[1] Adds players club crest to the baord
        this.__addToSquares(
          board.childNodes[1],
          `<img src="${gehsus.teamLogo}">`
        );

        //[2] Adds players shirt number to the board

        this.__addToSquares(board.childNodes[2], `${gehsus.number}`);

        //[3]Adds players position played to the board
        this.__addToSquares(
          board.childNodes[3],
          `${positions[gehsus.position]}`
        );

        //[4]Adds players age to the board
        this.__addToSquares(
          board.childNodes[4],
          `${
            this.#stats.solution.age < gehsus.age
              ? '<span class="arrows">⬇</span>' + gehsus.age
              : this.#stats.solution.age > gehsus.age
              ? '<span class="arrows">⬆</span>' + gehsus.age
              : '<span class="arrows"></span>' + gehsus.age
          }`
        );
      } catch (err) {
        console.error(new Error(err));
      } finally {
        for (let i = 0; i < 5; i++) {
          //Populate the boxes with the user guess
          if (
            this.#stats.evaluations[this.#stats.boardState.indexOf(gehsus)][
              i % 5
            ] == "correct"
          ) {
            board.childNodes[i].style.background = "darkseagreen";
            board.childNodes[i].classList.add("bounce");
          } else if (
            this.#stats.evaluations[this.#stats.boardState.indexOf(gehsus)][
              i % 5
            ] == "absent"
          ) {
            board.childNodes[i].style.background = "indianred";
          } else if (
            this.#stats.evaluations[this.#stats.boardState.indexOf(gehsus)][
              i % 5
            ] == "present"
          ) {
            board.childNodes[i].style.background = "#ced55c";
          }

          guess.classList.remove("hide");
          guess.classList.add("slideDown");
          board.childNodes[i].classList.remove("hide");

          await this.__wait(0.15);
        }
      }
    }).bind(this)();
  }

  //Check to see if user has won or lost
  __checkResult(result, attempt) {
    attempts.textContent = 5 - attempt;

    //Update local items
    this.__updateLocalStorage();

    //Check if user won
    if (result[0].every((el) => el === "correct")) {
      this.__endGame("win");
    }
    // //If maximum attempts have been made
    else if (attempt === 5) {
      this.#history.fails++;
      this.__endGame("loss");
    }
  }

  //End the game by disabling the input bar and display pop-up
  __endGame(str) {
    if (str === "win") {
      input.blur();
      this.#history.gamesWon++;
      this.#history.guesses[this.#stats.rowIndex - 1]++;
      this.#stats.gameStatus = "WIN";
    } else {
      this.#stats.gameStatus = "LOSE";
    }

    this.__updateUI();
    this.__populateStatistics();
  }

  //disable the textbox and popup modal
  __updateUI() {
    inputContainer.classList.add("hide");

    this.__wait(2)
      .then(() => {
        if (this.#stats.gameStatus != "WIN")
          boardContainer.insertAdjacentHTML(
            "afterbegin",
            `
              <div class="solution guess glassEffect fade-in">
                <p>Answer: ${this.#stats.solution.name}</p>
                <img src="${this.#stats.solution.photo}">
              </div>
            `
          );
      })
      .then(() => this.__wait(2))
      .then(() => this.__showModal());

    this.#history.gamesPlayed++;
  }

  //Get record stored in localstorage and display here
  __populateStatistics() {
    const winPerc = Math.round(
      (this.#history.gamesWon / this.#history.gamesPlayed) * 100
    );
    played.textContent = ` ${this.#history.gamesPlayed}`;
    winsPerc.textContent = ` ${winPerc}`;
    wins.textContent = `${this.#history.gamesWon}`;
    losses.textContent = `${this.#history.fails}`;

    this.#history.guesses.forEach(
      (val, index) =>
        (guessDistr.children[index + 1].innerHTML = `${
          index + 1
        } <span style="background-color: aqua;     margin-left: 10px; width:${
          val != 0
            ? Math.ceil((val / this.#history.gamesWon) * 100) + "%"
            : "10px"
        };">${val}</span>`)
    );

    this.__updateLocalStorage();
  }

  //Update the local Storage at the end of the game
  __updateLocalStorage() {
    this.__asyncLocalStorage.setItem("stats", this.#stats);
    this.__asyncLocalStorage.setItem("footuizHistory", this.#history);
  }

  //Timer until the next guess is available for the user
  __timer() {
    //Set time to 24hrs in seconds
    let time = 86401;

    //Call the timer every seconds
    const tick = function () {
      const date = new Date();

      const hours = `${23 - date.getHours()}`.padStart(2, 0);
      const min = `${59 - date.getMinutes()}`.padStart(2, 0);
      const second = `${59 - date.getSeconds()}`.padStart(2, 0);

      //In each call, print the remaining time to UI
      countdown.textContent = `${hours}:${min}:${second}`;
      time--;
    };

    tick();
    setInterval(tick, 1000);
  }
}

//Create an instance of the App class
const app = new App();
