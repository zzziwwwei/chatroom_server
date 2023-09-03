# game_gameServer

#環境安裝

> *download node.js

> *npm install

> *執行server

> *node server.js

# 狀態同步實作

> * 狀態同步能處理中途加入與中斷連線。
> * 安全性高，資料都由伺服器做運算，客戶端只顯示或接收資料去作動。
> * 缺點封包較大，要傳完整的訊息，開發時長兩倍，同時要處理server端邏輯與client端邏輯。

## 實例(開4個實例展示，能中途加入與中斷連線)
![image]()

##server端程式碼
```js
    setInterval(() => {
  const message = {
    type: "SendBuffer",
    sendBuffer
  }
  broadcast(message)
  sendBuffer = []
}, 16);
 ```
> * server端接收訊號後會更新狀態。已更新的狀態會先存在緩衝區(sendBuffer)裡。
> * 設定sendBuffer每16ms廣播給各client端。
##
```js
class Player {
 Update() {
 }
}
setInterval(() => {
  players.forEach((value, key) => {

    value.Update()
    
  });
}, 16);
```
> * 有了緩衝區server端的邏輯tick可以跟廣播tick分開。
##





