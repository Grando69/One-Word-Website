const socket = io("http://139.177.178.13:8080");
// const socket = io("http://localhost:8080");

const wordConfirm = document.getElementById("wordConfirm");
const wordConfirmDisabled = document.getElementById("wordConfirmDisabled");
const wordInput = document.getElementById("wordInput");
const currentSentence = document.getElementById("currentSentence");
const id = document.getElementById("id");
const joinButton = document.getElementById("joinButton");
const joinInput = document.getElementById("joinInput");
const joinButtonMobile = document.getElementById("joinButtonMobile");
const joinInputMobile = document.getElementById("joinInputMobile");
const createNewButton = document.getElementById("createNewButton");
const titleScreen = document.getElementById("titleScreen");
const gameScreen = document.getElementById("gameScreen");
const resetButton = document.getElementById("reset");
const resetDisabled = document.getElementById("resetDisabled");
const currentPlayerSpan = document.getElementById("currentPlayerSpan");
const playerNumberSpan = document.getElementById("playerNumberSpan");
const playerCountSpan = document.getElementById("playerCountSpan");
const endTimeSpan = document.getElementById("endTimeSpan");

let buttonEnabled = true;
let playerNumber;
wordInput.value = "";
let currentPlayer;
let playerCount = 1;
let inGame = false;
wordConfirm.addEventListener("click", handleWordConfirm);
createNewButton.addEventListener("click", handleNewGame);
joinButton.addEventListener("click", handleJoinGame);
joinButtonMobile.addEventListener("click", handleJoinGameMobile);
resetButton.addEventListener("click", handleReset);

document.querySelector("#wordInput").addEventListener("keyup", (event) => {
  if (event.key !== "Enter" || !buttonEnabled) return;
  else wordConfirm.click();
});

socket.on("gameCode", handleGameCode);
socket.on("init", handleInit);
socket.on("continue", handleContinue);
socket.on("running", handleRunning);
socket.on("tooManyPlayers", handleTooManyPlayers);
socket.on("unknownCode", handleUnknownCode);
socket.on("playerDisconnect", handlePlayerDisconnect);
socket.on("updatePlayerCount", handleUpdatePlayerCount);
socket.on("updateTime", handleUpdateTime);
socket.on("end", handleEnd);

window.addEventListener("beforeunload", function (e) {
  if (inGame) {
    var confirmationMessage = "o/";
    (e || window.event).returnValue = confirmationMessage; //Gecko + IE
    return confirmationMessage; //Webkit, Safari, Chrome
  }
  socket.emit("disconnect");
  inGame = false;
});

function handleWordConfirm() {
  if (wordInput.value) {
    wordInput.value = wordInput.value.trim();
    socket.emit("next", id.innerText, wordInput.value.split(" ")[0]);
    wordInput.value = "";
    disableButton();
  } else {
    alert("Please Input something bruh");
  }
}

function disableButton() {
  buttonEnabled = false;
  wordConfirm.style.display = "none";
  resetButton.style.display = "none";
  wordConfirmDisabled.style.display = "block";
  resetDisabled.style.display = "block";
}

function enableButton() {
  buttonEnabled = true;
  wordConfirm.style.display = "block";
  resetButton.style.display = "block";
  wordConfirmDisabled.style.display = "none";
  resetDisabled.style.display = "none";
}

function handleGameCode(gameCode) {
  id.innerText = gameCode;
}

function handleNewGame() {
  socket.emit("newGame");
  init();
  currentPlayer = playerNumber;
  inGame = true;
  currentPlayerSpan.innerText = "your";
  enableButton();
  playerCountSpan.innerHTML = playerCount;
}

function handleJoinGame() {
  if (inGame) return;
  inGame = true;
  const code = joinInput.value;
  socket.emit("joinGame", code);
  init();
  handleGameCode(code);
  currentPlayerSpan.innerText = `player number 1's`;
  disableButton();
}

function handleJoinGameMobile() {
  if (inGame) return;
  const code = joinInputMobile.value;
  socket.emit("joinGame", code);
  init();
  handleGameCode(code);
  currentPlayerSpan.innerText = `player number 1's`;
  disableButton();
}

function init() {
  titleScreen.style.display = "none";
  gameScreen.style.display = "flex";
}

function unInit() {
  playerNumber = null;
  joinInput.value = "";
  titleScreen.style.display = "flex";
  gameScreen.style.display = "none";
  inGame = false;
}

function handleInit(number) {
  playerNumber = number;
  playerNumberSpan.innerText = `${playerNumber}`;
  console.log(playerNumber);
}

function handleContinue(state) {
  currentPlayer = state.currentPlayer;
  // console.log(state);
  if (state.currentPlayer === playerNumber.toString()) {
    enableButton();
    currentPlayerSpan.innerText = "your";
  } else {
    currentPlayerSpan.innerText = "player number " + currentPlayer + "'s";
  }
  currentSentence.innerText = state.currentSentence;
  playerCount = state.players.length;
  playerNumberSpan.innerText = `${playerNumber}`;
}

function download(filename, text) {
  var element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(text)
  );
  element.setAttribute("download", filename);

  element.style.display = "none";
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

function handleReset() {
  if (currentSentence.innerText.split(" ").length < 3) {
    alert(
      "Please have a sentence with 3 or more words to reset and download it."
    );
    return;
  }
  socket.emit("reset", id.innerText);
  download(`${id.innerText}.txt`, currentSentence.innerText);
}

function reset() {
  playerNumber = null;
  joinInput.value = "";
  titleScreen.style.display = "flex";
  gameScreen.style.display = "none";
}

function handleRunning() {
  reset();
  alert("The game you tried to join is allready running");
}

function handleTooManyPlayers() {
  reset();
  alert("This room already has 8 players in it.");
}

function handleUnknownCode() {
  reset();
  alert("The gamecode is invalid. Please try again.");
}

function handlePlayerDisconnect(playerNumberOfDisconnected) {
  console.log(`Player ${playerNumberOfDisconnected} disconected`);
  if (playerNumberOfDisconnected < playerNumber) playerNumber -= 1;
  playerCount -= 1;
  handleUpdatePlayerCount(playerCount);
  // console.log(`you are now player ${playerNumber}`);
}

function handleUpdatePlayerCount(number) {
  playerCount = number;
  playerCountSpan.innerHTML = playerCount;
  console.log(playerCount);
}

function handleUpdateTime(date) {
  const currentDate = new Date(Date.now());
  date = new Date(date);
  endTimeSpan.innerHTML = getTimeBetweenDates(currentDate, date);
}

// get difference in milliseconds between two dates
function getTimeBetweenDates(date1, date2) {
  let difference = date2 - date1;
  difference = difference / 1000;
  return (
    Math.floor(difference / 3600) +
    " hours " +
    Math.floor((difference % 3600) / 60) +
    " minutes " +
    Math.floor((difference % 3600) % 60) +
    " seconds"
  );
}

function handleEnd() {
  unInit();
}
