const express = require('express');
const app = express();
app.use(express.json());


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
function DecodeState(message) {
}

const users = new Map();
const players = new Map();

class Player {
  constructor(playerId, playerName, playerLevel, playerClass) {
    this.playerId = playerId
    this.playerName = playerName
    this.playerLevel = playerLevel
    this.playerClass = playerClass
    this.mouse = {
      x: 0,
      y: 0
    }
    this.position = {
      x: Math.floor(Math.random() * 1000),
      y: Math.floor(Math.random() * 1000)
    }
    this.rotation = {
      x: 0,
      y: 0
    }
    this.moving = false
  }
  Move() {
    if (this.moving == true) {
      this.position.x = lerp(this.position.x, this.mouse.x, 0.05)
      this.position.y = lerp(this.position.y, this.mouse.y, 0.05)
      const message = {
        position: this.position
      }
      AddSendList(this.playerId, message)
    }
  }
  Update() {
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
function CallMove(ismove, mouse, ws) {
  const obj = WsToPlayer(ws)
  obj.moving = ismove
  obj.mouse = mouse

}

function lerp(start, end, amt) { //
  return (1 - amt) * start + amt * end //smooth移動
}

//狀態解碼
function DecodeState(message, ws) {
  if (message.type == "AddPlayer") {
    BindPlayerAndUser(message.player, ws)
  }
  if (message.type == "Move") {
    CallMove(message.mousedown, message.mouse, ws)
  }
}


let sendList = []
function AddSendList(playerId, send) {
  sendList.push(playerId, send)
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
    DeletePlayer(ws)
    DeleteUser(ws)
    clients.delete(ws);
  });
});

// 廣播訊息給所有客戶端
function broadcast(message) {
  users.forEach((value, key) => {
    value.send( Serialization(message))
  });
}

setInterval(() => {
  //broadcast(Serialization(sendList))
  broadcast(Serialization(sendList))
  sendList = []
}, 16 * 20);
setInterval(() => {
  players.forEach((value, key) => {
    value.Update()
  });
}, 16);
const port = 3001;
app.listen(port, () => {
  console.log(port)
})

