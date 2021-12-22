$(function () {
    var socketio = io()
    var order = []
    var hand = []
    var myHand = []
    var turnPlayer = 0
    var color_index = [
        {jp: "赤", js: "red", code: "#FF367F"}, 
        {jp: "青", js: "blue", code: "#2C7CFF"}, 
        {jp: "紫", js: "purple", code: "#7B3CFF"}, 
        {jp: "緑", js: "green", code: "#2DFF57"}
    ]

    // 名前送信
    $("#emitName").submit(function() {
        const myname = document.getElementById("name").value
        document.getElementById("myname").textContent = myname
        document.getElementById("typename").style.display = "none"
        document.getElementById("party").style.display = "block"
        socketio.emit("name", myname)
        
        return false
    })

    // 再接続
    $("#reconnect").submit(function() {
        const myname = document.getElementById("name").value
        if (document.getElementById("member").textContent.includes(myname)){
            return false
        }
        socketio.emit("name", myname)
        return false
    })

    // 誰かが入室
    socketio.on("enter", function(namelist){
        if (document.getElementById("myname").textContent != ""){
            document.getElementById("member").textContent = namelist.join("、")
            if (namelist[0] == document.getElementById("myname").textContent){
                document.getElementById("host").textContent = "(ホスト)"
                document.getElementById("hostButton").style.display = "block"
            } else {
                document.getElementById("host").textContent = ""
            }
        }
    })

    // ゲーム開始
    $("#startGame").submit(function() {
        document.getElementById("hostButton").style.display = "none"
        socketio.emit("start game", {})
        return false
    })

    // 1ターン目
    socketio.on("first turn", function(order_app, hand_app){
        order = order_app
        hand = hand_app

        // ターンプレイヤーの表を作成
        let table = document.getElementById("turnPlayer")
        table.innerHTML = ""
        
        row = table.insertRow(-1)
        cell = row.insertCell(-1)
        cell.style.textAlign = "center"
        cell.innerHTML = "名前"
        cell = row.insertCell(-1)
        cell.style.textAlign = "center"
        cell.innerHTML = "残り"
        cell = row.insertCell(-1)
        cell.style.textAlign = "center"
        cell.innerHTML = "手番"

        for (let i = 0; i < order_app.length; i++){
            row = table.insertRow(-1)
            cell = row.insertCell(-1)
            cell.style.textAlign = "center"
            cell.innerHTML = "<span id='name"+i+"'>"+order_app[i]+"</span>"
            cell = row.insertCell(-1)
            cell.style.textAlign = "center"
            cell.innerHTML = "<span id='left"+i+"'>"+hand[i].length+"</span>枚"
            cell = row.insertCell(-1)
            cell.style.textAlign = "center"
            cell.innerHTML = "<span id='turn"+i+"'></span>"
        }

        document.getElementById("turn0").textContent = "◯"

        // 手札表示
        let my_hand = document.getElementById("hand")
        for (let i = 0; i < order_app.length; i++){
            if (order_app[i] == document.getElementById("myname").textContent){
                myHand = hand_app[i]
                for (let j = 0; j < hand_app[i].length; j++){
                    let cell = my_hand.insertCell(-1)
                    cell.innerHTML = "<input = type='radio' name='handButton' value="+j+" onclick='decideCard()'><span id='handCard"+j+"'>" + hand[i][j] + "</span>"
                    let word = document.getElementById("handCard" + j)
                    for (const col of color_index){
                        if (word.textContent.slice(0, 1) == col.jp){
                            word.style.color = col.code
                        }
                    }
                }
            }
        }

        // 画面切り替え
        document.getElementById("main").style.display = "block"
    })

    // プレイするカードの決定
    $("#myInfo").submit(function() {
        const myname = document.getElementById("name").value
        // 自分の番でなければ無効
        if (document.getElementById("name" + turnPlayer).textContent != document.getElementById("myname").textContent){
            alert("自分の番ちゃうで")
            return false
        }

        const num = document.getElementById("myInfo").handButton.value
        if (num == ""){
            alert("出すやつ、選んでくれるか？")
            return false
        }
        const card = document.getElementById("handCard" + num).textContent
        const len = document.getElementById("selectPot").cells.length
        let val = ""
        if (len != 1){
            val = document.getElementById("myInfo").potButton.value
            if (val == ""){
                alert("壺、選んでくれるか？")
                return false
            }
        }

        // プレイしたカードを手札から消す
        myHand.splice(num,1)
        let my_hand = document.getElementById("hand")
        my_hand.innerHTML = ""
        for (let i = 0; i < myHand.length; i++){
            let cell = my_hand.insertCell(-1)
            cell.innerHTML = "<input type='radio' name='handButton' value="+i+" onclick='decideCard()'><span id='handCard"+i+"'>" + myHand[i] + "</span>"
            let word = document.getElementById("handCard" + i)
            for (const col of color_index){
                if (word.textContent.slice(0, 1) == col.jp){
                    word.style.color = col.code
                }
            }
        }

        socketio.emit("select card", num, card, val, myname)

        return false
    })

    // 誰かがカードをプレイした
    socketio.on("someone selected", function(num, card, val, somename){
        for (const col of color_index){
            if (card.slice(0, 1) == col.jp){
                document.getElementById("log").innerHTML = somename + " が <font color='"+col.code+"'>" + card + "</font> を出した<br>"
            }
        }
        // 壺の選択肢を消す
        let select = document.getElementById("selectPot")
        select.innerHTML = ""
        // 毒を入れる壺
        let pot_num = 0
        for (let i = 0; i < 3; i++){
            const color = document.getElementById("pot_" + i + "_color").textContent
            if (color == card.slice(0, 1)){
                pot_num = i
            }
        }
        if (val != ""){
            pot_num = val
            if (card.slice(0, 1) != "緑"){
                document.getElementById("pot_" + val + "_color").textContent = card.slice(0, 1)
                const fix_color = []
                for (let i = 0; i < 3; i++){
                    if (document.getElementById("pot_" + i + "_color").textContent != ""){
                        fix_color.push(document.getElementById("pot_" + i + "_color").textContent)
                    }
                }
                if (fix_color.length == 2){
                    for (const check of ["赤", "青", "紫"]){
                        if (!fix_color.includes(check)){
                            for (let i = 0; i < 3; i++){
                                if (document.getElementById("pot_" + i + "_color").textContent == ""){
                                    document.getElementById("pot_" + i + "_color").textContent = check
                                }
                            }
                        }
                    }
                }
            }
        }
        // 表の背景色
        for (let i = 0; i < 3; i++){
            for (const col of color_index){
                if (document.getElementById("pot_" + i + "_color").textContent == col.jp){
                    document.getElementById("pot_" + i + "_tab").style.backgroundColor = col.code
                }
            }
        }
        
        // 残りの数を計算
        const now = Number(document.getElementById("pot_" + pot_num + "_left").textContent)
        const result = now - Number(card.slice(1, 2))

        document.getElementById("miracle").innerHTML = ""

        // 溢れない時
        if (result >= 0){
            document.getElementById("pot_" + pot_num + "_left").textContent = result
            for (const col of color_index){
                if (card.slice(0, 1) == col.jp){
                    document.getElementById("pot_" + pot_num).innerHTML += "<font color='"+col.code+"'>" + card + "</font><br>"
                    document.getElementById("log").innerHTML += "<font color='"+col.code+"'>" + card + "</font> は 壺" + (Number(pot_num)+1) + " に置かれた<br>"
                }
            }
            if (result == 0){
                let pi_check = true
                for (let i = 0; i < 3; i++){
                    if (document.getElementById("pot_" + i + "_left").textContent != 0){
                        pi_check = false
                    }
                }
                if (pi_check){
                    document.getElementById("miracle").innerHTML = "<font size=7>オール パイズリ 盤面！!</font>"
                } else {
                    document.getElementById("miracle").innerHTML = "<font size=7>パイズリ！</font>"
                }
            }
        } else {
            const input = document.getElementById("pot_" + pot_num).textContent
            let getCard = splitCards(input)
            if (document.getElementById("name" + turnPlayer).textContent == document.getElementById("myname").textContent){
                for (let i = 0; i < getCard.length; i++){
                    for (const col of color_index){
                        if (col.jp == getCard[i].slice(0, 1)){
                            document.getElementById("get_" + col.js).textContent += getCard[i] + " "
                        }
                    }
                }
            }
            document.getElementById("pot_" + pot_num + "_left").textContent = 13 - Number(card.slice(1, 2))
            for (const col of color_index){
                if (card.slice(0, 1) == col.jp){
                    document.getElementById("pot_" + pot_num).innerHTML = "<font color='"+col.code+"'>" + card + "</font><br>"
                    document.getElementById("log").innerHTML += "<font color='"+col.code+"'>" + card + "</font> は 壺" + (Number(pot_num)+1) + " に置かれた<br>"
                }
            }
            for (let i = 0; i < getCard.length; i++){
                for (const col of color_index){
                    if (getCard[i].slice(0, 1) == col.jp){
                        document.getElementById("log").innerHTML += somename + " は <font color='"+col.code+"'>" + getCard[i] + "</font> を回収した<br>"
                    }
                }
            }
        }

        // 残り枚数を減らす
        const left = Number(document.getElementById("left" + turnPlayer).textContent)
        document.getElementById("left" + turnPlayer).textContent = left - 1

        // 番を移す
        let next = 0
        if (turnPlayer + 1 < order.length){
            next = turnPlayer + 1
        }
        document.getElementById("turn" + turnPlayer).textContent = ""
        document.getElementById("turn" + next).textContent = "◯"
        turnPlayer = next

        // 全員の手札が0になった時
        let left_check = true
        for (let i = 0; i < order.length; i++){
            if (document.getElementById("left" + i).textContent != "0"){
                left_check = false
            }
        }
        if (left_check == true){
            const poison = {
                red: document.getElementById("get_red").textContent.split(" ").slice(0, -1), 
                blue: document.getElementById("get_blue").textContent.split(" ").slice(0, -1), 
                purple: document.getElementById("get_purple").textContent.split(" ").slice(0, -1), 
                green: document.getElementById("get_green").textContent.split(" ").slice(0, -1)
            }
            const myname = document.getElementById("myname").textContent
            socketio.emit("result", myname, poison)
        }
    })

    socketio.on("all result", (poison) => {
        document.getElementById("result").style.display = "block"
        if (document.getElementById("host").textContent == "(ホスト)"){
            document.getElementById("hostButton2").style.display = "block"
        }

        let point = []
        for (let i = 0; i < order.length; i++){
            let count = 0
            for (const col of color_index){
                if (col.jp == "緑"){
                    count += poison[i][col.js].length * 2
                } else {
                    let my_point = poison[i][col.js].length
                    let isMax = true
                    for (let j = 0; j < order.length; j++){
                        if (i == j) continue
                        if (my_point <= poison[j][col.js].length) isMax = false
                    }
                    if (isMax == false){
                        count += my_point
                    }
                }
            }
            point.push(count)
        }

        let table = document.getElementById("result_table")
        table.innerHTML = ""
        // 名前
        let row_0 = table.insertRow(-1)
        let cell_0 = row_0.insertCell(-1)
        cell_0.innerHTML = ""
        for (let i = 0; i < order.length; i++){
            let cell = row_0.insertCell(-1)
            cell.style.textAlign = "center"
            cell.innerHTML = order[i]
        }
        // 獲得した毒
        for (const col of color_index){
            let row = table.insertRow(-1)
            let cell = row.insertCell(-1)
            cell.style.textAlign = "center"
            cell.innerHTML = col.jp
            cell.style.backgroundColor = col.code
            for (let i = 0; i < order.length; i++){
                let cell = row.insertCell(-1)
                cell.style.verticalAlign = "top"
                cell.innerHTML = poison[i][col.js].join("<br>")
            }
        }
        // 得点
        let row_p = table.insertRow(-1)
        let cell_p = row_p.insertCell(-1)
        cell_p.style.textAlign = "center"
        cell_p.innerHTML = "得点"
        for (let i = 0; i < order.length; i++){
            let cell = row_p.insertCell(-1)
            cell.style.textAlign = "center"
            cell.innerHTML = point[i]
        }
    })

    // もう一度
    $("#onemore").submit(function() {
        socketio.emit("one more", {})
        return false
    })

    socketio.on("one more game", () => {
        // 前回ゲームのデータ削除
        document.getElementById("turnPlayer").innerHTML = ""
        document.getElementById("hand").innerHTML = ""
        document.getElementById("selectPot").innerHTML = ""
        document.getElementById("log").innerHTML = ""
        for (let i = 0; i < 3; i++){
            document.getElementById("pot_" + i + "_color").textContent = ""
            document.getElementById("pot_" + i + "_left").textContent = 13
            document.getElementById("pot_" + i).innerHTML = ""
            document.getElementById("pot_" + i + "_tab").style.backgroundColor = ""
        }
        for (const col of color_index){
            document.getElementById("get_" + col.js).innerHTML = ""
        }
        // 画面の切り替え
        document.getElementById("party").style.display = "block"
        document.getElementById("main").style.display = "none"
        document.getElementById("result").style.display = "none"
        document.getElementById("hostButton2").style.display = "none"
        if (document.getElementById("host").textContent == "(ホスト)"){
            document.getElementById("hostButton").style.display = "block"
        }
    })

})
