const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const width = 1000
const height = 500
const colWidth = rowHeight = 20
const cols = 1000 / colWidth;
const rows = 500 / rowHeight
let mouseClicked = false;

let runningDFS = false;
let dfsStack = [];

/*
White - unvisted 
Black - wall
Green/Light green - start pos
Red/light red - end pos
Blue - saerching animation color
*/
let NODETYPES = {START_UNSELECTED: 2, START_SELECTED: 3, WALL:1, END_UNSELECTED: 4, END_SELECTED:5, UNVISITED: -1, VISITED: 999}

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

map[startCoord.row][startCoord.col] = NODETYPES.START_UNSELECTED;
map[endCord.row][endCord.col] = NODETYPES.END_UNSELECTED;

drawGrid = () => {
    ctx.strokeStyle =  "rgba(0, 0, 255, 0.5)";
    for (let i =0; i<rows; i++){
        for (let j =0; j<cols; j++){
            if(map[i][j]!==NODETYPES.UNVISITED) {
                if (map[i][j]===NODETYPES.WALL) //normal wall
                    ctx.fillStyle="rgb(0,0,0)"
                else if(map[i][j]===NODETYPES.START_UNSELECTED) //start spot normal
                    ctx.fillStyle="rgb(0, 255, 0)"
                else if(map[i][j]===NODETYPES.END_UNSELECTED) //end spot normal
                    ctx.fillStyle="rgb(255, 0, 0)"
                else if(map[i][j]===NODETYPES.START_SELECTED) //start spot highlighted
                    ctx.fillStyle="rgb(130, 255, 130)"
                else if(map[i][j]===NODETYPES.END_SELECTED) //end spot highlighted
                    ctx.fillStyle="rgb(255, 120, 131)"
                else if(map[i][j]===NODETYPES.VISITED)
                    ctx.fillStyle="rgba(206, 252, 241, 0.5)"
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

    if (runningDFS)
        return

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
            map[row][col]=NODETYPES.START_SELECTED
            return
        }
    }

    //placing start block on second click
    if (startSelected && action==="clicked" && (col!=startCoord.col 
        || row!=startCoord.row) && (col!=endCord.col || row!=endCord.row)){
        map[row][col]=NODETYPES.START_UNSELECTED;
        startSelected=false;
        map[startCoord.row][startCoord.col]=NODETYPES.UNVISITED;
        startCoord={row, col}
        return
    }

    //selecting end block
    if(col===endCord.col && row===endCord.row && action==="clicked"){
        if (!endSelected){
            endSelected=true
            map[row][col]=NODETYPES.END_SELECTED;
            return
        }
    }

    //placing end block on second click
    if (endSelected && action==="clicked" && (col!=startCoord.col 
        || row!=startCoord.row) && (col!=endCord.col || row!=endCord.row)){
        map[row][col]=NODETYPES.END_UNSELECTED;
        endSelected=false;
        map[endCord.row][endCord.col]=NODETYPES.UNVISITED;
        endCord={row, col}
        return
    }

    //placing wall if start or end block were not clicked
    if(col>=0 && col<cols && row>=0 && row<rows && (col!=startCoord.col 
        || row!=startCoord.row) && (col!=endCord.col || row!=endCord.row)){
        if (action==="dragged" && mouseClicked)
            map[row][col]=NODETYPES.WALL; 
        else if (action==="clicked") 
            map[row][col]*=-1
    }
}

resetMap = () => {
    for (let i =0; i<rows; i++){
        for (let j =0; j<cols; j++){
            if (map[i][j]===NODETYPES.VISITED)
                map[i][j]===NODETYPES.UNVISITED
            else if (map[i][j]===NODETYPES.END_SELECTED)
                map[i][j]=NODETYPES.END_UNSELECTED
            else if (map[i][j]===NODETYPES.START_SELECTED)
                map[i][j]=NODETYPES.START_UNSELECTED
            
        }
    }
}

runDFS = () => {
    runningDFS = true;
    dfsStack = [];
    resetMap(map)

    dfsStack.push(startCoord)
    map[startCoord.row][startCoord.col]=NODETYPES.VISITED 

}

isSameSpot = (pos1, pos2) => {
    return pos1.col===pos2.col && pos1.row===pos2.row
}

getFreeAdjacentNode = (visitedMap, pos) => {
    //check top
    if (pos.row>0){
        if (visitedMap[pos.row-1][pos.col]===NODETYPES.UNVISITED ||
            visitedMap[pos.row-1][pos.col]===NODETYPES.END_UNSELECTED)
            return {row: pos.row-1, col: pos.col}
    }
    //check right
    if (pos.col<cols-1){ //-1 because cols acc start at 0
        if (visitedMap[pos.row][pos.col+1]===NODETYPES.UNVISITED ||
            visitedMap[pos.row][pos.col+1]===NODETYPES.END_UNSELECTED)
            return {row: pos.row, col: pos.col+1}
    }
    //check bottom
    if (pos.row<rows-1){ //-1 because rows acc start at 0
        if (visitedMap[pos.row+1][pos.col]===NODETYPES.UNVISITED ||
            visitedMap[pos.row+1][pos.col]===NODETYPES.END_UNSELECTED)
            return {row: pos.row+1, col: pos.col}
    }
    //check left
    if (pos.col>0){ 
        if (visitedMap[pos.row][pos.col-1]===NODETYPES.UNVISITED ||
            visitedMap[pos.row][pos.col-1]===NODETYPES.END_UNSELECTED)
            return {row: pos.row, col: pos.col-1}
    }

    return null //means no adjacent unvisited nodes
}

depthFirstSearch = (stack, visitedMap) => {

    if (stack.length===0)
        return "NOT FOUND"

    let curNode = stack[stack.length-1]
    if (isSameSpot(curNode, endCord)){
        return "FOUND"
    }

    let adjacentNode = getFreeAdjacentNode(visitedMap, curNode)
    if (adjacentNode!=null){
        stack.push(adjacentNode)
        visitedMap[adjacentNode.row][adjacentNode.col]=NODETYPES.VISITED
    } else {
        stack.pop()
    }

    return "SEARCHING"

}

function main(){

    if (runningDFS){

        let status = depthFirstSearch(dfsStack, map)
        if (status === "SEARCHING")
            runningDFS = true
        else if(status==="FOUND"){
            runningDFS = false;
            alert("FOUND")
        }
        else if(status==="NOT FOUND"){
            runningDFS=false;
            alert("NOT FOUND")
        }

    }

    ctx.clearRect(0, 0, width, height);
    drawGrid()
}

setInterval(main, 1000/500)
