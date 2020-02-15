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
let startCoord={row: 0, col: 0};
let startSelected = false;
let endCord={row:10, col:10};
let endSelected=false;

map[startCoord.row][startCoord.col] = -10;
map[endCord.row][endCord.col] = 10;

drawGrid = () => {
    ctx.strokeStyle =  "rgba(0, 0, 255, 0.5)";
    for (let i =0; i<rows; i++){
        for (let j =0; j<cols; j++){
            if(map[i][j]!==-1) {
                if (map[i][j]===1) //normal wall
                    ctx.fillStyle="rgb(0,0,0)"
                else if(map[i][j]===-10) //start spot normal
                    ctx.fillStyle="rgb(0, 255, 0)"
                else if(map[i][j]===10) //end spot normal
                    ctx.fillStyle="rgb(255, 0, 0)"
                else if(map[i][j]===-9) //start spot highlighted
                    ctx.fillStyle="rgb(130, 255, 130)"
                else if(map[i][j]===9) //end spot highlighted
                    ctx.fillStyle="rgb(255, 120, 131)"
                ctx.fillRect(j*colWidth, i*rowHeight, colWidth, rowHeight)
            } else { //grid line
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

    //selecting start block
    if(col===startCoord.col && row===startCoord.row && action==="clicked"){
        if (!startSelected){
            startSelected=true
            map[row][col]=-9
            return
        }
    }

    //placing start block on second click
    if (startSelected && action==="clicked" && (col!=startCoord.col 
        || row!=startCoord.row) && (col!=endCord.col || row!=endCord.row)){
        map[row][col]=-10;
        startSelected=false;
        map[startCoord.row][startCoord.col]=-1;
        startCoord={row, col}
        return
    }

    //selecting end block
    if(col===endCord.col && row===endCord.row && action==="clicked"){
        if (!endSelected){
            endSelected=true
            map[row][col]=9
            return
        }
    }

    //placing end block on second click
    if (endSelected && action==="clicked" && (col!=startCoord.col 
        || row!=startCoord.row) && (col!=endCord.col || row!=endCord.row)){
        map[row][col]=10;
        endSelected=false;
        map[endCord.row][endCord.col]=-1;
        endCord={row, col}
        return
    }

    //placing wall if start or end block were not clicked
    if(col>=0 && col<cols && row>=0 && row<rows && (col!=startCoord.col 
        || row!=startCoord.row) && (col!=endCord.col || row!=endCord.row)){
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
