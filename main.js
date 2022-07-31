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

const playersList = JSON.parse(localStorage.getItem("playersJSON"));
const positions = {
  Goalkeeper: "GK",
  Defender: "DEF",
  Midfielder: "MID",
  Attacker: "ATT",
};

var myHeaders = new Headers();
myHeaders.append("x-rapidapi-key", config.MY_KEY);
myHeaders.append("x-rapidapi-host", "api-football-v1.p.rapidapi.com");
var requestOptions = {
  method: "GET",
  headers: myHeaders,
  redirect: "follow",
};

//Class to encapsulate app info
class App {
  #history = {
    averageGuesses: 0,
    currentStreak: 0,
    gamesPlayed: 33,
    gamesWon: 21,
    guesses: [3, 4, 10, 1, 3, 0],
    maxStreak: 0,
    winPercentage: 0,
    fails: 12,
  };
  #result = [];
  #userGuess;
  #stats;

  constructor() {
    // this.__asyncLocalStorage.getItem().then(res => (this.#history = res));
    // this.__updateLocalStorage.bind(this);

    (async function () {
      try {
        console.log("Fetching data from local storage");
        this.__localStorageBackup();
      } catch (err) {
        console.errror(new Error(err));
      } finally {
        loadingBox.style.display = "none";
        boardContainer.style.display = "flex";
        inputContainer.classList.remove("hide");
      }

      // this.#stats.solution.number = (
      //   await this.__getJSON(
      //     `https://api-football-v1.p.rapidapi.com/v3/players/squads?player=${this.#stats.solution.id}`
      //   )
      // ).response.find(
      //   e => e.team.name === this.#stats.solution.team.name
      // ).players[0].number;
    }.bind(this)());

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
    setItem: async function (string, item) {
      await null;
      localStorage.setItem(string, JSON.stringify(item));
    },
    getItem: async function () {
      await null;
      return JSON.parse(localStorage.getItem("footuizHistory"));
    },
  };

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

    if (this.#stats) {
      attempts.textContent += `${5 - this.#stats.rowIndex}`;

      this.#stats.boardState.forEach(({ id }) =>
        playersList.splice(
          playersList.findIndex((e) => e.id === id),
          1
        )
      );

      for (let i = this.#stats.boardState.length - 1; i >= 0; i--) {
        //this.#result = this.#stats.evaluations[i];
        this.__createBoard(this.#stats.boardState[i], i);
        this.__populateStatistics();
      }

      if (this.#stats.gameStatus != "IN_PROGRESS") {
        this.__updateUI();
      }
    } else {
      attempts.textContent += `5`;
      this.#stats = {
        boardState: [],
        evaluations: [],
        rowIndex: 0,
        solution: {
          id: 1460,
          name: "Bukayo Saka",
          firstname: "Bukayo",
          lastname: "Saka",
          age: 21,
          nationality: "England",
          photo: "https://media.api-sports.io/football/players/1460.png",
          team: {
            id: 42,
            name: "Arsenal",
            logo: "https://media.api-sports.io/football/teams/42.png",
          },
          league: {
            id: 39,
            name: "Premier League",
            country: "England",
            logo: "https://media.api-sports.io/football/leagues/39.png",
            flag: "https://media.api-sports.io/flags/gb.svg",
            season: 2022,
          },
          position: "Attacker",
          number: "?",
        },
        gameStatus: "IN_PROGRESS",
        lastPlayedTs: new Date().getTime(),
      };
    }
  }

  //Get JSONs for APIs
  async __getJSON(url) {
    return (await fetch(url, requestOptions)).json();
  }

  //Predict player by taking current input and create dropdown
  __predictiveText() {
    dropdown.innerHTML = "";
    let predicted = [];
    let regex = new RegExp("^" + input.value, "i");

    //eric bailly won't work because his full name is Eric Bertrand Bailly

    for (let i in playersList) {
      if (
        (regex.test(playersList[i].name) ||
          regex.test(playersList[i].firstname) ||
          regex.test(playersList[i].lastname) ||
          regex.test(
            playersList[i].firstname + " " + playersList[i].lastname
          )) &&
        input.value.length != 0
      ) {
        predicted.push(playersList[i]);
      }
    }

    predicted.forEach((e) => {
      dropdown.insertAdjacentHTML(
        "beforeend",
        `<li id ="${e.name}" ><img src=  "${e.team.logo}"><p>${
          e.firstname + " " + e.lastname
        }</p></li>`
      );
    });
  }

  //function used to create another Div element
  __createDiv(className, obj) {
    const x = document.createElement("div");
    const playerName = document.createElement("p");

    playerName.textContent = obj.lastname.split(" ").at(-1);

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
    if (field === "team") {
      this.#result.push(
        this.#userGuess[field].name == this.#stats.solution[field].name
          ? "correct"
          : this.#userGuess.league.name == this.#stats.solution.league.name
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
    //Remove from list so user can pick that player again
    [this.#userGuess] = playersList.splice(
      playersList.findIndex((e) => e.name === guess),
      1
    );

    (async function () {
      try {
        this.#userGuess.number = "?";
        // (
        //   await this.__getJSON(
        //     `https://api-football-v1.p.rapidapi.com/v3/players/squads?player=${
        //       this.#userGuess.id
        //     }`
        //   )
        // ).response.find(
        //   e => e.team.name === this.#userGuess.team.name
        // ).players[0].number;
      } catch (err) {
        console.error(new Error(err));
      } finally {
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
    }.bind(this)());
  }

  //Add items to each box
  __addToSquares = (node, html) => {
    node.insertAdjacentHTML("beforeend", html);
  };

  //Populate the board with user guess and related icons
  __populateBoard(gehsus) {
    const board = document.querySelector(".board");
    const guess = document.querySelector(".guess");

    (async function () {
      try {
        const flag = await this.__getJSON(
          `https://restcountries.com/v3.1/name/${
            gehsus.nationality === "England" || "Scotland" || "Wales"
              ? "United Kingdom"
              : gehsus.nationality
          }`
        );
        const html = `<img src="${flag[0].flags.svg}"></img>`;

        this.__addToSquares(board.childNodes[0], html);

        this.__addToSquares(
          board.childNodes[1],
          `<img src="${gehsus.team.logo}">`
        );
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
        this.__addToSquares(board.childNodes[2], `${gehsus.number}`);
        this.__addToSquares(
          board.childNodes[3],
          `${positions[gehsus.position]}`
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
    }.bind(this)());
  }

  //Check to see if user has won or lost
  __checkResult(result, attempt) {
    attempts.textContent = `Attempts left: ${5 - attempt}`;

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

  //Get record stored in cookies and display here
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
  async __updateLocalStorage() {
    await this.__asyncLocalStorage.setItem("stats", this.#stats);
    await this.__asyncLocalStorage.setItem("footuizHistory", this.#history);
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
