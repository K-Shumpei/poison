function decideCard(){
    let select = document.getElementById("selectPot")
    select.innerHTML = ""

    const check = document.getElementById("myInfo").handButton.value
    const card = document.getElementById("handCard" + check).textContent

    let pot_color = ""
    let not_color = []
    for (let i = 0; i < 3; i++){
        if (document.getElementById("pot_" + i + "_color").textContent != ""){
            pot_color = document.getElementById("pot_" + i + "_color").textContent
        } else {
            not_color.push(i)
        }
    }

    if (card.slice(0, 1) == "緑" || not_color.length == 3){
        for (let i = 0; i < 3; i++){
            let cell = select.insertCell(-1)
            cell.innerHTML = "<input = type='radio' name='potButton' value="+i+"><span>壺" + (i+1) + "</span>"
        }
    } else if (not_color.length == 2 && card.slice(0, 1) != pot_color){
        for (let i = 0; i < not_color.length; i++){
            let cell = select.insertCell(-1)
            cell.innerHTML = "<input = type='radio' name='potButton' value="+not_color[i]+"><span>壺" + (not_color[i]+1) + "</span>"
        }
    }

    let cell = select.insertCell(-1)
    cell.innerHTML = "<button>決定</button>"
}

function splitCards(text){
    const num = text.length/2
    let result = []
    for (let i = 0; i < num; i++){
        result.push(text.slice(i*2, (i+1)*2))
    }
    return result
}