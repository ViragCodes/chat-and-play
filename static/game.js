window.addEventListener("unload", () => localStorage.removeItem("gameid"))
if (!localStorage.getItem("gameid")) window.location.href = "/chat"

const me = localStorage.getItem("client")
const opponent = localStorage.getItem("opponent")
const gameid = localStorage.getItem("gameid")
var turn = localStorage.getItem("turn")

document.getElementById("chatid").innerHTML = me + " Vs " + opponent

const ws = new WebSocket(`wss://${window.location.host}/ws/game/${gameid}/${me}`)

const cells = document.querySelectorAll(".cell");
const statusText = document.querySelector("#statusText");
const restartBtn = document.querySelector("#restartBtn");
const winConditions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];
let options = ["", "", "", "", "", "", "", "", ""];
let running = false;

initializeGame();

function initializeGame(){
    cells.forEach(cell => cell.addEventListener("click", cellClicked));
    restartBtn.addEventListener("click", toRestart);
    if (turn === 'true') {
        statusText.textContent = "Your turn"
        running = true;
    } else statusText.textContent = opponent + "'s turn"
}
function cellClicked(){
    const cellIndex = this.getAttribute("cellIndex");

    if(options[cellIndex] == "" && running){
        updateCell(this, cellIndex)
        checkWinner(me)
    }
}
function updateCell(cell, index){
    running = false
    options[index] = "X"
    cell.textContent = "X"
    statusText.textContent = opponent + "'s turn"
    var object = {type: "game", from : me, move : index}
    ws.send(JSON.stringify(object))
}

function checkWinner(player){

    for(let i = 0; i < winConditions.length; i++){
        const condition = winConditions[i];
        const cellA = options[condition[0]];
        const cellB = options[condition[1]];
        const cellC = options[condition[2]];

        if(cellA == "" || cellB == "" || cellC == ""){
            continue;
        }
        if(cellA == cellB && cellB == cellC){
            statusText.textContent = `${player} wins!`
            running = false;
            return
        }
    }

    if(!options.includes("")){
        statusText.textContent = `Draw!`;
        running = false;
    }
}

function toRestart() {
    var object = {type: "restart-req", from : me}
    ws.send(JSON.stringify(object))
    alert(`Waiting for ${opponent}...`)
}

function restartGame(){
    options = ["", "", "", "", "", "", "", "", ""];
    cells.forEach(cell => cell.textContent = "");
    turn = turn === 'true' ? 'false' : 'true'
    if (turn === 'true') {
        statusText.textContent = "Your turn"
        running = true;
    } else statusText.textContent = opponent + "'s turn"
}
function rejectReq() {
    document.getElementById("req").style.display = "none"
}
function acceptReq() {
    ws.send(JSON.stringify({type: "restart"}))
    restartGame()
    document.getElementById("req").style.display = "none"
}
ws.onmessage = event => {
    var data = JSON.parse(event.data)
    if (data.type == "game"){
        var cell = document.querySelector(`[cellIndex="${data.move}"]`)
        cell.textContent = "O"
        options[data.move] = "O"
        statusText.textContent = "Your turn"
        running = true
        checkWinner(data.from)
    }
    if (data.type == "restart-req"){
        console.log("sent")
        document.getElementById("req").style.display = "block"
        document.getElementById("req-msg").innerHTML = data.from + " wants to restart the game."
    }
    if (data.type == "restart"){
        restartGame()
    }
    if (data.type == "left"){
        alert(`${data.client} has left the game!`)
    }
}

function toggle(){
    window.location.href = "/chat"
}
