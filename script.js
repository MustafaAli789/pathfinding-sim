const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const width = 1000
const height = 500
const colWidth = rowHeight = 20
const cols = 1000 / colWidth;
const rows = 500 / rowHeight
let mouseClicked = false

window.onload = () => {
    document.onmousedown = mouseDown;
    document.onmouseup = mouseUp;
}

mouseDown = () => {
    mouseClicked = true;
}

mouseUp = () => {
    mouseClicked = false;
}

generateArrayGrid = () => {
    let map = [];
    for (let i =0; i<rows; i++){
        map.push([]);
        for (let j =0; j<cols; j++){
            map[i].push(-1);
        }
    }
    return map;
}

let map = generateArrayGrid();

drawGrid = () => {
    ctx.strokeStyle =  "rgba(0, 0, 255, 0.5)";
    for (let i =0; i<rows; i++){
        for (let j =0; j<cols; j++){
            if(map[i][j]===1) {
                ctx.fillRect(j*colWidth, i*rowHeight, colWidth, rowHeight)
            } else {
                ctx.strokeRect(j*colWidth, i*rowHeight, colWidth, rowHeight)
            }
        }
    }
}

getColAndRowFromXAndY = (x, y) => {
    return {col: Math.ceil(x/colWidth)-1, row: Math.ceil(y/rowHeight)-1}
}

document.addEventListener('mousemove', (event)=>setPosClicked(event, "dragged"))

document.addEventListener("mousedown", (event)=>setPosClicked(event, "clicked"))

setPosClicked = (event, action) => {
    let rect = canvas.getBoundingClientRect();
    let x = event.clientX -rect.left;
    let y = event.clientY - rect.top;
    let gridCoord = getColAndRowFromXAndY(x, y);
    let col = gridCoord.col;
    let row = gridCoord.row;
    if(col>=0 && col<=49 && row>=0 && row<=24){
        if (action==="dragged" && mouseClicked)
            map[row][col]=1; 
        else if (action==="clicked") 
            map[row][col]*=-1
    }
}

function main(){

    ctx.clearRect(0, 0, width, height);
    drawGrid()
}

setInterval(main, 1000/30)
