from fastapi import FastAPI, WebSocketDisconnect, WebSocket, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from typing import Dict, List
import json
# import uvicorn

app = FastAPI()

#use html templates
templates = Jinja2Templates(directory="templates")

#use static javascript/css files
app.mount("/static", StaticFiles(directory="static"), name="static")

#collection of all sockets in chatrooms
chatrooms : Dict[str, List[WebSocket]] = {} 

#collection of all sockets in gamerooms
gamerooms : Dict[str, List[WebSocket]] = {} 

#collection of all client names
clients : Dict[str, List[str]] = {} 
    

#manage chatroom communication
class ChatManager:

    #initialize new chatroom for new chat-ID
    def __init__(self, chatid: str):
        if chatid not in chatrooms :
            chatrooms[chatid] : List[WebSocket] = []
            clients[chatid] : List[str] = []

    #add socket to chatroom
    async def connect(self, websocket: WebSocket, chatid: str, client: str):
        clients[chatid].append(client)  
        await websocket.accept()
        chatrooms[chatid].append(websocket)

    #remove socket from chatroom
    def disconnect(self, websocket: WebSocket, chatid: str):
        chatrooms[chatid].remove(websocket)
        if not chatrooms[chatid]:
            del chatrooms[chatid]
            del clients[chatid]

    #send message to others in chatroom
    async def send_message(self, message: str, websocket: WebSocket, chatid: str):
        for connection in chatrooms[chatid]:
            if (connection != websocket):
                await connection.send_text(message)
    
    #send message to everyone in chatroom
    async def broadcast(self, message: str, chatid: str):
        for connection in chatrooms[chatid]:
            await connection.send_text(message)

#get homepage
@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse("login.html", {"request": request, "data": json.dumps(clients)})

#get chatroom
@app.get("/chat", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

#get gameroom
@app.get("/play", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse("game.html", {"request": request})

#create chatroom websocket
@app.websocket("/ws/chat/{chatid}/{client}")
async def chatroom(websocket: WebSocket, chatid: str, client: str):
   cm = ChatManager(chatid)
   await cm.connect(websocket, chatid, client)

   #send all existing clients to new client
   await websocket.send_text(json.dumps({"type": "list", "clients": clients[chatid]}))

   #send new client to all exesting clients
   await cm.broadcast(json.dumps({"type": "add", "client": client}), chatid)

   try:
    while True:
        data = await websocket.receive_text()
        await cm.send_message(data, websocket, chatid)
   except WebSocketDisconnect:
        cm.disconnect(websocket, chatid)
        if chatid in chatrooms:
            await cm.broadcast(json.dumps({"type": "left", "client": client}), chatid)

# gameroom websocket
@app.websocket("/ws/game/{gameid}/{client}")
async def gameroom(websocket: WebSocket, gameid: str, client: str):
    await websocket.accept()
    if gameid not in gamerooms:
        gamerooms[gameid] = []
    gamerooms[gameid].append(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            for player in gamerooms[gameid]:
                if (player != websocket):
                    await player.send_text(data)
    except WebSocketDisconnect:
        gamerooms[gameid].remove(websocket)
        if not gamerooms[gameid]:
            del gamerooms[gameid]
        else:
            await gamerooms[gameid][0].send_text(json.dumps({"type": "left", "client": client}))

#start uvicorn server
# if __name__ == "__main__":
#     uvicorn.run("main:app", reload=True, ssl_keyfile="key.pem", ssl_certfile="cert.pem")
