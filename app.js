// モジュール
const http = require("http")
const express = require("express")
const socketIO = require("socket.io")

// オブジェクト
const app = express()
const server = http.Server(app)
const io = socketIO(server)

// 定数
const PORT = process.env.PORT || 7000

// 公開フォルダの指定
app.use(express.static(__dirname))

// サーバーの起動
server.listen(PORT, () => {
    console.log("server starts on port: %d", PORT)
})

let namelist = []
let idlist = []
let order = []
let hand = []
let poison = []

// 接続時の処理
io.on("connection", function(socket){
    // 名前受信
    socket.on("name", (name) => {
        idlist.push(socket.id)
        namelist.push(name)
        io.emit("enter", namelist)
    })

    // 切断時の処理
    socket.on("disconnect", () => {
        if (idlist.includes(socket.id)){
            let num = idlist.indexOf(socket.id)
            idlist.splice(num, 1)
            namelist.splice(num, 1)
        }
        io.emit("enter", namelist)
    })

    // ゲーム開始
    socket.on("start game", () => {
        poison = []
        order = shuffle(namelist)
        hand = decideHand(namelist.length)
        for (let i = 0; i < order.length; i++){
            poison.push(false)
        }
        io.emit("first turn", order, hand)
    })

    // カード選択
    socket.on("select card", (num, card, val, myname) => {
        io.emit("someone selected", num, card, val, myname)
    })

    // 結果
    socket.on("result", (name, result) => {
        for (let i = 0; i < order.length; i++){
            if (order[i] == name){
                poison[i] = result
            }
        }
        if (!poison.includes(false)){
            io.emit("all result", poison)
        }
    })

    // もう一度
    socket.on("one more", () => {
        io.emit("one more game", {})
    })
})

function shuffle(array){
    for(var i = array.length - 1; i > 0; i--){
        var r = Math.floor(Math.random() * (i + 1))
        var tmp = array[i]
        array[i] = array[r]
        array[r] = tmp
    }
    return array
}

function decideHand(len){
    let result = []
    for (let i = 0; i < len; i++){
        result.push([])
    }
    let rand = shuffle(cardList)
    for (let i = 0; i < rand.length; i++){
        result[i%len].push(rand[i])
    }
    for (let i = 0; i < result.length; i++){
        result[i].sort(function(a, b){
            const a_col = a.slice(0, 1)
            const a_num = a.slice(1, 2)
            const b_col = b.slice(0, 1)
            const b_num = b.slice(1, 2)

            const col_order = ["赤", "青", "紫", "緑"]

            if (col_order.indexOf(a_col) < col_order.indexOf(b_col)) return -1
            if (col_order.indexOf(a_col) > col_order.indexOf(b_col)) return 1
            if (Number(a_num) < Number(b_num)) return -1
            if (Number(a_num) > Number(b_num)) return 1
            return 0
        })
    }
    
    return result
}


var acardList = [
    "青1", "青1", "青1", "青2", "青2", "青2", "青4", "青4", "青5", "青5", "青5", "青7", "青7", "青7", 
    "赤1", "赤1", "赤1", "赤2", "赤2", "赤2", "赤4", "赤4", "赤5", "赤5", "赤5", "赤7", "赤7", "赤7", 
    "紫1", "紫1", "紫1", "紫2", "紫2", "紫2", "紫4", "紫4", "紫5", "紫5", "紫5", "紫7", "紫7", "紫7", 
    "緑4", "緑4", "緑4", "緑4", "緑4", "緑4", "緑4", "緑4"
]

var cardList = [
    "青5", "青5", "青5", "青7", "青7", "青7"
]
