const express = require('express');
const server = express();
server.use(express.json());
server.set('views', './views');
server.set('view engine', 'ejs')
server.use('/static', express.static(__dirname + '/public'));
const indexRouter = require('./routers/index');
server.use('/',indexRouter)


const WebSocket = require('ws');
// 建立WebSocket伺服器
const wss = new WebSocket.Server({ port: 8080 });
console.log('WebSocket port: 8080');
// 用於保存所有連接的客戶端
const clients = new Set();


function Serialization(obj) {
  const jsonString = JSON.stringify(obj);
  return jsonString
}
function Deserialization(jsonString) {
  const obj = JSON.parse(jsonString);
  return obj
}
const users = new Map();
const players = new Map();

class Player {
  constructor(playerId, playerName, playerLevel, playerClass) {
    this.playerId = playerId
    this.playerName = playerName
    this.playerLevel = playerLevel
    this.playerClass = playerClass
    this.position = {
      x: Math.floor(Math.random() * 1000),
      y: Math.floor(Math.random() * 1000)
    }
    this.toPosition = this.position
    this.rotation = {
      x: 0,
      y: 0
    }
    this.moving = false
    this.bullets = []
  }
  Move() {
    this.position.x = Math.floor(Lerp(this.position.x, this.toPosition.x, 0.05))
    this.position.y = Math.floor(Lerp(this.position.y, this.toPosition.y, 0.05))
    }
  Update() {
    this.Move()
  }
}

class Bullet {
  constructor(position, toPosition) {
    this.position = position
    this.toPosition = toPosition
    this.exist = true
  }
  Move() {
    this.position.x = Math.floor(Lerp(this.position.x, this.toPosition.x, 0.2))
    this.position.y = Math.floor(Lerp(this.position.y, this.toPosition.y, 0.2))
    if (Math.abs(this.position.x - this.toPosition.x) < 100 && Math.abs(this.position.y - this.toPosition.y) < 100) {
        this.exist = false    
    }
  }
  Update() {
    console.log(this)
    this.Move()
  }
}


//創建使用者
function AddUser(userId, userSocket) {
  users.set(userId, userSocket);
}
//創建使用者

//刪除使用者
function DeleteUser(ws) {
  for (const [userId, userSocket] of users) {
    if (userSocket === ws) {
      DeletePlayer(userId);
      CallDeletePlayer(userId)
      users.delete(userId);
      break;
    }
  }
}
//刪除使用者

//創建玩家
function AddPlayer(playerId, player) {
  players.set(playerId, new Player(player.playerId, player.playerName, player.playerLevel, player.playerClass));
}
//創建玩家

//刪除玩家
function DeletePlayer(userId) {
  for (const [playerId, player] of players) {
    if (playerId === userId) {
      players.delete(playerId);
      console.log('user disconnected:', playerId);
      console.log(players)
      break;
    }
  }
}
function CallDeletePlayer(playerId) {
  const message = {
    type: "DeletePlayer",
    player: playerId
  }
  broadcast(message)
}
//刪除玩家



function BindPlayerAndUser(player, ws) {
  const messagePlayers = []
  players.forEach((value, key) => {
    messagePlayers.push(value)
  });
  let message = {
    type: "CreatPlayer",
    players: messagePlayers
  }
  ws.send(Serialization(message))
  AddUser(player.playerId, ws)
  AddPlayer(player.playerId, player)
  message = {
    type: "AddPlayer",
    players: players.get(player.playerId)
  }
  broadcast(message)
  console.log(players)
}

function WsToPlayer(ws) {
  for (const [userId, userSocket] of users) {
    if (userSocket === ws) {
      for (const [playerId, player] of players) {
        if (playerId === userId) {
          return player
        }
      }
    }
  }
}


//玩家移動
function CallMove(isMove, toPosition, ws) {
  const obj = WsToPlayer(ws)
  obj.moving = isMove
  obj.toPosition = toPosition
  const message = {
    moving: isMove,
    toPosition: toPosition
  }
  AddSendBuffer("MoveToPoint", obj.playerId, message)
}





function Lerp(start, end, amt) { //
  return (1 - amt) * start + amt * end //smooth移動
}

//狀態解碼
function DecodeState(message, ws) {
  switch (message.type) {
    case "AddPlayer":
      BindPlayerAndUser(message.player, ws)
      break;
    case "Move":
      CallMove(message.isMove, message.toPosition, ws)
      break;
    default:
      break;
  }

}


let sendBuffer = []
function AddSendBuffer(type, playerId, send) {
  const message = {
    type: type,
    playerId: playerId,
    message: send
  }
  sendBuffer.push(message)
}


wss.on('connection', (ws) => {
  console.log('WebSocket連接已建立');
  clients.add(ws);
  console.log('WebSocket connected!');
  ws.on('message', (messageJson) => {
    const message = Deserialization(messageJson)
    console.log('收到訊息:', message);
    DecodeState(message, ws)
  });
  ws.on('close', () => {
    console.log('WebSocket連接已關閉')
    //CallDeletePlayer(ws)
    //DeletePlayer(ws)
    DeleteUser(ws)

    clients.delete(ws);
  });
});

// 廣播訊息給所有客戶端
function broadcast(message) {
  users.forEach((value, key) => {
    value.send(Serialization(message))
  });
}

setInterval(() => {
  const message = {
    type: "SendBuffer",
    sendBuffer
  }
  broadcast(message)
  sendBuffer = []
}, 16);
setInterval(() => {
  players.forEach((value, key) => {

    value.Update()
    value.bullets.forEach(i=>{
      i.Update()
    })
  });

}, 16);
//


const port = 3001;
server.listen(port, () => {
  console.log(port)
})

