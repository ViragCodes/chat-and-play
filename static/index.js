const me = localStorage.getItem("client")
const chatid = localStorage.getItem("chatid")
const ws = new WebSocket(`wss://${window.location.host}/ws/chat/${chatid}/${me}`)
var opponent = ""
var gameid = ""

document.getElementById("chatid").innerHTML = "CHAT #" + chatid

function DisplayTime() {
    var date = new Date()
    var hours = date.getHours() > 12 ? date.getHours() - 12 : date.getHours()
    var am_pm = date.getHours() >= 12 ? "PM" : "AM"
    hours = hours < 10 ? "0" + hours : hours
    var minutes = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes()
    return hours + ":" + minutes + " " + am_pm
}

// shows all the participants in the chatroom
function dropdown(){
    let list = document.getElementById("client-list")
    if (list.style.display == "block") list.style.display = "none"
    else list.style.display = "block" 
}

// sets the details of for tic-tac-toe
function setGame(turn) {
    localStorage.setItem("turn", turn)
    localStorage.setItem("opponent", opponent)
    localStorage.setItem("gameid", gameid)
}

// sends request to 
function toGame(player2){
    gameid = new Date().toISOString() // unique ID for a game
    opponent = player2
    setGame(true) // first turn to play 
    ws.send(JSON.stringify({type: "game-req", from : me, to : opponent, gameid: gameid}))
    alert(`Waiting for ${opponent}...`)
}
function acceptReq() {
    ws.send(JSON.stringify({type: "game"}))
    setGame(false)
    window.location.href = "/play"
}
function rejectReq() {
    document.getElementById("req").style.display = "none"
}
const sendComponent = message => {
    var n = document.createElement("p")
    var m = document.createElement("p")
    var t = document.createElement("p")
    n.className = "small mb-1 text-muted align-self-end"
    n.style.textAlign = "right"
    m.className = "p-3 mb-2 text-white rounded-5 align-self-end"
    m.style.backgroundColor = "#79C7C5"
    t.className = "small text-muted align-self-end"
    t.style.textAlign = "right"
    n.innerHTML = me
    m.innerHTML = message
    t.innerHTML = DisplayTime()
    document.getElementById("chat-area").append(n,m,t)
}
sendMessage = event => {
    event.preventDefault()

    var input = document.getElementById("message")
    sendComponent(input.value)
    scrollToBottom()

    ws.send(JSON.stringify({type: "chat", name : me, message : input.value}))
    input.value = ''
}
ws.onmessage = event => {
    const data = JSON.parse(event.data)
    if (data.type == "chat") {
        var n = document.createElement("p")
        var m = document.createElement("p")
        var t = document.createElement("p")
        n.className = "small mb-1 text-muted"
        m.className = "p-3 mb-2 text-white rounded-5 align-self-start"
        m.style.backgroundColor = "#777777"
        t.className = "small text-muted"
        n.innerHTML = data.name
        m.innerHTML = data.message
        t.innerHTML = DisplayTime()
        document.getElementById("chat-area").append(n,m,t)
        scrollToBottom()
    }
    if (data.type == "left"){
        getNote(data.client + " left the chat...")
        document.querySelector(`.${data.client}`).remove()
    }
    if (data.type == "add"){
        getNote(data.client + " entered the chat...")
        getLi(data.client)
    }
    if (data.type == "list"){
        data.clients.forEach(client => getLi(client))
    }
    if (data.type == "game-req" && data.to == me){
        document.getElementById("req").style.display = "block"
        document.getElementById("req-msg").innerHTML = data.from + " invited you for Tic Tac Toe."
        opponent = data.from
        gameid = data.gameid
    }
    if (data.type == "game"){
        window.location.href = "/play"
    }
}
const getNote = note => {
    const m = document.createElement("p")
    m.className = "small text-muted align-self-center"
    m.innerHTML = note
    document.getElementById("chat-area").append(m)
    scrollToBottom()
    return m
}
const getLi = client => {
    if (client == me || document.querySelector(`.${client}`)) return
    
    let li = document.createElement("li")
    li.className = `dropdown-item ${client}`
    li.title = "Send request"
    li.innerHTML = client
    li.onclick = (e) => toGame(e.target.innerHTML)
    document.getElementById("client-list").append(li)
}
const scrollToBottom = () => {
    const element = document.getElementById("chat-area");
    element.scrollTop = element.scrollHeight;
}