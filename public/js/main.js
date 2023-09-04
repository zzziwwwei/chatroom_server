document.oncontextmenu = function () {
    event.returnValue = false;
}
let mouse = {
    x: 0,
    y: 0
}
document.oncontextmenu = function () {
    event.returnValue = false;
}
let mousedown = 0
window.addEventListener('mousemove', (event) => {
    mouse.x = event.pageX;
    mouse.y = event.pageY;
})
window.addEventListener("mousedown", function (event) {
    if (event.button === 0) {
    }
    if (event.button === 2) {
        mousedown = 1
        Move(mousedown, mouse)
    }
})
window.addEventListener("mouseup", function (event) {
    if (event.button === 0) {
    }
    if (event.button === 2) {
        mousedown = 0
        Move(mousedown, mouse)

    }
});
window.addEventListener("click", function (event) {
    
})
var canvas = document.getElementById("canvas");
var c = canvas.getContext("2d");
window.addEventListener("resize", resizeCanvas);
function resizeCanvas() {                   //螢幕顯示100%
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
const test = [1, 2, 3, 4, 5]
test.splice(2, 1)
console.log(test)
const players = new Map();
//player
class Player {
    constructor(player) {
        this.playerId = player.playerId
        this.playerName = player.playerName
        this.playerLevel = player.playerLevel
        this.playerClass = player.playerClass
        this.toPosition = player.toPosition
        this.position = player.position
        this.rotation = player.rotation
        this.moving = player.moving
        this.bullets = []
    }
    Draw() {
        c.beginPath()
        c.arc(this.position.x, this.position.y, 30, 0, Math.PI * 2)
        c.fillStyle = "red"
        c.fill()
        c.closePath()
    }
    Move() {
        this.position.x = Math.floor(Lerp(this.position.x, this.toPosition.x, 0.05))
        this.position.y = Math.floor(Lerp(this.position.y, this.toPosition.y, 0.05))
    }
    Update() {
      


        this.Draw()
        this.Move()
    }
}
class Bullet {
    constructor() {
        this.position = {
            x: 0,
            y: 0
        }
        this.toPosition = {
            x: 1000,
            y: 1000
        }
        this.exist = true
    }
    Draw() {
        c.beginPath()
        c.arc(this.position.x, this.position.y, 10, 0, Math.PI * 2)
        c.fillStyle = "blue"
        c.fill()
        c.closePath()
    }
    Move() {
        this.position.x = Lerp(this.position.x, this.toPosition.x, 0.01)
        this.position.y = Lerp(this.position.y, this.toPosition.y, 0.01)
        if (Math.abs(this.position.x - this.toPosition.x) < 100 && Math.abs(this.position.y - this.toPosition.y) < 100) {
            this.exist = false
        }
    }
    Update() {
        //console.log(this)
        this.Draw()
        this.Move()
    }
}
function Lerp(start, end, amt) { //
    return (1 - amt) * start + amt * end //smooth移動
}

class ThisPlayer {
    constructor(playerId, playerName, playerLevel, playerClass) {
        this.playerId = playerId
        this.playerName = playerName
        this.playerLevel = playerLevel
        this.playerClass = playerClass
    }
}
const thisPlayer = new ThisPlayer(Math.floor(Math.random() * 1000), "test", 1, "knight")




function Move(isMove, toPosition) {
    const message = {
        type: "Move",
        isMove,
        toPosition
    }
    SocketSend(Serialization(message));
}
function Serialization(obj) {
    const jsonString = JSON.stringify(obj);
    return jsonString
}
function Deserialization(jsonString) {
    const obj = JSON.parse(jsonString);
    return obj
}
function AddThisPlayer(player) {
    const message = {
        type: "AddPlayer",
        player
    };
    return message
}
//創建玩家
function CreatPlayer(playersInfo) {
    playersInfo.forEach(player => {
        players.set(player.playerId, new Player(player))
    });

}
function AddPlayer(player) {
    players.set(player.playerId, new Player(player))
}
//創建玩家

//刪除玩家
function DeletePlayer(id) {
    for (const [playerId, player] of players) {
        if (playerId === id) {
            players.delete(playerId);
            console.log('user disconnected:', playerId);
        }
    }
}

function DecodeState(message) {
    switch (message.type) {
        case "CreatPlayer":
            if (message.players !== []) {
                CreatPlayer(message.players)
                console.log("CreatPlayer")
            }
            break;
        case "AddPlayer":
            if (message.players !== []) {
                AddPlayer(message.players)
                console.log("AddPlayer")
            }
            break;
        case "DeletePlayer":
            if (message.players !== []) {
                DeletePlayer(message.player)
                console.log("DeletePlayerr")
            }
            break;
        case "SendBuffer":
            message.sendBuffer.forEach(i => { DecodeSendBuffer(i) })
            break;
        
        default:
           
            break;
    }

}
function DecodeSendBuffer(action) {
    if (action.type == "MoveToPoint") {
        GraphicsMove(action.playerId, action.message.toPosition, action.message.moving)
    }
}

//玩家移動
function GraphicsMove(playerId, position, moving) {
    const obj = players.get(playerId)
    obj.toPosition = position
    obj.moving = moving
}


const socket = new WebSocket('ws://localhost:8080');
socket.onopen = function (event) {
    console.log('WebSocket connected!');
    socket.send(Serialization(AddThisPlayer(thisPlayer)));
};
socket.onmessage = function (event) {
    const messageJson = event.data;
    const message = Deserialization(messageJson)
    //console.log('收到訊息:', message);
    DecodeState(message)
};
socket.onclose = function (event) {
    console.log('WebSocket disconnected!');
};
socket.onerror = function (error) {
    console.error('WebSocket error:', error);
};

function SocketSend(json) {
    socket.send(json);
}
function animate() {
    requestAnimationFrame(animate)
    c.fillStyle = "rgba(35, 36, 42, 0.8)";
    c.fillRect(0, 0, canvas.width, canvas.height)
    players.forEach((value, key) => {
        for (let i = 0; i < value.bullets.length; i++) {
            value.bullets[i].Update()
            if (value.bullets[i].exist == false) {
                value.bullets.splice(i, 1)
                console.log(value.bullets.length)
            }
            i--
        }
        value.Update()
    });
}
resizeCanvas()
animate()
