//var cloneDeep = require('lodash.clonedeep');

var PriorityQueue = require('js-priority-queue');

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const width = 1020
const height = 500
const colWidth = rowHeight = 20
const cols = width / colWidth;
const rows = height / rowHeight
let mouseClicked = false;
let path = []
var timeStamp = null;

let searchType = {DFS: false, BFS: false, DJIKSTRA: false, ASTAR: false};
let mazeType={FREE_HAND: false, DIVISION: false, RANDOM: false, BACKTRACK: false}
let runningSearch = false;
let runningMazeGeneration=false;
let randomMazeIteration = 0

let dfsStack = [];
let bfsQueue = [];
let djikPQ = new PriorityQueue({ comparator: function(nodeA, nodeB) { return nodeA.g - nodeB.g; }});
let aStartPQ = new PriorityQueue({ comparator: function(nodeA, nodeB) { return nodeA.f - nodeB.f; }});

let numTimesStartAndEndPlaced = 0; //var needed to place end and start blocks after recursive division algo runs and ensure it places it once only

const Node = function(row, col, nodeType) {

    this.row = row;
    this.col=col;
    this.g=99999999;
    this.h=99999999;
    this.f=99999999;
    this.nodeType=nodeType;
    this.prevNode=undefined;
}

//the addition of half the col width and row height are to get into the middle of the grid spot
getXandYFromRowAndCol = ({row, col}) => {
    return {x: col*colWidth+colWidth/2, y: row*rowHeight+rowHeight/2}
}

//sets node A's euclidean heuristic using nodeB
setNodeHeuristic = (nodeA, nodeB) => {
    let nodeACords = getXandYFromRowAndCol({row: nodeA.row, col: nodeA.col});
    let nodeBCords = getXandYFromRowAndCol({row: nodeB.row, col: nodeB.col})
    nodeA.h=Math.hypot(nodeBCords.x-nodeACords.x, nodeBCords.y-nodeACords.y);
    //let dx = Math.abs(nodeACords.x-nodeBCords.x)
    //let dy = Math.abs(nodeACords.y-nodeBCords.y);
    //nodeA.h=1*(dx+dy);
}

setAllNodeHeuristics = (map, endNode) => {
    map.forEach(row=>{
        row.forEach(node=>{
            setNodeHeuristic(node, endNode)
        })
    })
}

/*
White - unvisted 
Black - wall
Green/Light green - start pos
Red/light red - end pos
Blue - saerching animation color
*/
let NODETYPES = {START_UNSELECTED: 'START_UNSELECTED', 
                 START_SELECTED: 'START_SELECTED', 
                 WALL: 'WALL', 
                 END_UNSELECTED: 'END_UNSELECTED', 
                 END_SELECTED:'END_SELECTED', 
                 UNVISITED: 'UNVISITED',
                VISITED: 'VISITED',
                TO_BE_EXPLORED: 'TO_BE_EXPLORED',
                DOT: "DOT"}

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

let endNode = new Node(1, 1, NODETYPES.END_UNSELECTED)
let endSelected=false;
let startNode = new Node(0, 0, NODETYPES.START_UNSELECTED)
startNode.f=startNode.h;
startNode.g=0;
let startSelected = false;

generateArrayGrid = () => {
    let map = [];
    for (let i =0; i<rows; i++){
        map.push([]);
        for (let j =0; j<cols; j++){
            let a = new Node(i, j, NODETYPES.UNVISITED)
            map[i].push(a);
        }
    }
    return map;
}

let map = generateArrayGrid();
let mapCopy = generateArrayGrid();

map[startNode.row][startNode.col] = startNode;
map[endNode.row][endNode.col] = endNode;
setAllNodeHeuristics(map, endNode);

mapCopy=JSON.parse(JSON.stringify(map));
mapCopy.forEach(row=>{
    row.forEach(node=>{
        Object.setPrototypeOf(node, Node.prototype)
    })
})
mapCopy[startNode.row][startNode.col]=startNode;
mapCopy[endNode.row][endNode.col]=endNode;


drawGrid = () => {
    ctx.strokeStyle =  "rgba(0, 0, 255, 0.5)";
    for (let i =0; i<rows; i++){
        for (let j =0; j<cols; j++){
            let curNodeType = map[i][j].nodeType;
            if(curNodeType!==NODETYPES.UNVISITED && curNodeType!==NODETYPES.DOT) {
                if (curNodeType===NODETYPES.WALL) //normal wall
                    ctx.fillStyle="rgb(0,0,0)"
                else if(curNodeType===NODETYPES.START_UNSELECTED) //start spot normal
                    ctx.fillStyle="rgb(0, 255, 0)"
                else if(curNodeType===NODETYPES.END_UNSELECTED) //end spot normal
                    ctx.fillStyle="rgb(255, 0, 0)"
                else if(curNodeType===NODETYPES.START_SELECTED) //start spot highlighted
                    ctx.fillStyle="rgb(130, 255, 130)"
                else if(curNodeType===NODETYPES.END_SELECTED) //end spot highlighted
                    ctx.fillStyle="rgb(255, 120, 131)"
                else if(curNodeType===NODETYPES.VISITED)
                    ctx.fillStyle="rgba(0, 153, 255, 0.7)"
                else if(curNodeType===NODETYPES.TO_BE_EXPLORED)
                    ctx.fillStyle="rgba(0, 255, 255, 0.6)"
                ctx.fillRect(j*colWidth, i*rowHeight, colWidth, rowHeight)
                ctx.strokeRect(j*colWidth, i*rowHeight, colWidth, rowHeight)
            } else if (curNodeType===NODETYPES.UNVISITED) { //grid line
                ctx.strokeRect(j*colWidth, i*rowHeight, colWidth, rowHeight)
            } else {
                ctx.strokeRect(j*colWidth, i*rowHeight, colWidth, rowHeight)
                let {x, y} = getXandYFromRowAndCol({row: i, col: j})
                ctx.beginPath();
                ctx.arc(j*colWidth, i*rowHeight, 2, 0, 2*Math.PI, false);
                ctx.fillStyle="green";
                ctx.fill();

                
            }
        }
    }
}

drawPath = (path) =>{

    if (path.length===0)
        return

    ctx.strokeStyle="rgb(0,0,0)"
    ctx.beginPath();
    let start = getXandYFromRowAndCol(path[0])
    ctx.moveTo(start.x, start.y)
    path.forEach(node=>{
        let posCoords = getXandYFromRowAndCol({row: node.row, col: node.col});
        ctx.lineTo(posCoords.x, posCoords.y)
    })
    ctx.stroke();
}

getColAndRowFromXAndY = (x, y) => {
    return {col: Math.ceil(x/colWidth)-1, row: Math.ceil(y/rowHeight)-1}
}

changeEndNode = (newRow, newCol) => {
    endNode.row=newRow;
    endNode.col=newCol;
    endNode.nodeType=NODETYPES.END_UNSELECTED

    map[endNode.row][endNode.col] = endNode;
    mapCopy[endNode.row][endNode.col] = endNode;

    setAllNodeHeuristics(map, endNode);
    setAllNodeHeuristics(mapCopy, endNode);
}

changeStartNode = (newRow, newCol) => {
    startNode.row=newRow;
    startNode.col=newCol;
    startNode.nodeType=NODETYPES.START_UNSELECTED

    map[startNode.row][startNode.col] = startNode;
    mapCopy[startNode.row][startNode.col] = startNode;

    setNodeHeuristic(startNode, endNode);

}

document.addEventListener('mousemove', (event)=>setPosClicked(event, "dragged"))

document.addEventListener("mousedown", (event)=>setPosClicked(event, "clicked"))

setPosClicked = (event, action) => {

    if (runningSearch || runningMazeGeneration)
        return

    let rect = canvas.getBoundingClientRect();
    let x = event.clientX -rect.left;
    let y = event.clientY - rect.top;
    let gridCoord = getColAndRowFromXAndY(x, y);
    let col = gridCoord.col;
    let row = gridCoord.row;
    let selMapNode;
    let selCopyNode;
    if (row>=0 && row<=rows-1 && col>=0 && col<=cols-1){
        selMapNode = map[row][col];
        selCopyNode = mapCopy[row][col];
    }
   

    //selecting start block
    if(col===startNode.col && row===startNode.row && action==="clicked"){
        if (!startSelected){
            startSelected=true
            selMapNode.nodeType=NODETYPES.START_SELECTED
            selCopyNode.nodeType=NODETYPES.START_SELECTED
            return
        }
    }

    //placing start block on second click
    if (startSelected && action==="clicked" && (col!=startNode.col 
        || row!=startNode.row) && (col!=endNode.col || row!=endNode.row)){

        let newUnvisitedNode = new Node(startNode.row, startNode.col, NODETYPES.UNVISITED)
        setNodeHeuristic(newUnvisitedNode, endNode)

        startSelected=false;
        map[newUnvisitedNode.row][newUnvisitedNode.col] = newUnvisitedNode;
        mapCopy[newUnvisitedNode.row][newUnvisitedNode.col] = newUnvisitedNode;

        changeStartNode(row, col);

        return
    }

    //selecting end block
    if(col===endNode.col && row===endNode.row && action==="clicked"){
        if (!endSelected){
            endSelected=true
            selMapNode.nodeType=NODETYPES.END_SELECTED;
            selCopyNode.nodeType=NODETYPES.END_SELECTED;
            return
        }
    }

    //placing end block on second click
    if (endSelected && action==="clicked" && (col!=startNode.col 
        || row!=startNode.row) && (col!=endNode.col || row!=endNode.row)){

        let newUnvisitedNode = new Node(endNode.row, endNode.col, NODETYPES.UNVISITED)
        setNodeHeuristic(newUnvisitedNode, endNode)

        endSelected=false;
        map[newUnvisitedNode.row][newUnvisitedNode.col] = newUnvisitedNode;
        mapCopy[newUnvisitedNode.row][newUnvisitedNode.col] = newUnvisitedNode;

        changeEndNode(row, col);

        return
    }

    //placing wall if start or end block were not clicked
    if(col>=0 && col<cols && row>=0 && row<rows && (col!=startNode.col 
        || row!=startNode.row) && (col!=endNode.col || row!=endNode.row)){
        if (action==="dragged" && mouseClicked){
            selMapNode.nodeType=NODETYPES.WALL; 
            selCopyNode.nodeType=NODETYPES.WALL; 
        }
        else if (action==="clicked"){
            if (selMapNode.nodeType===NODETYPES.WALL){
                selMapNode.nodeType=NODETYPES.UNVISITED
                selCopyNode.nodeType=NODETYPES.UNVISITED
            } else {
                selMapNode.nodeType=NODETYPES.WALL
                selCopyNode.nodeType=NODETYPES.WALL
            }
        }
    }
}

setMazeType = (type)=> {
    //resetting ooptions
    Object.keys(mazeType).forEach(key=>{
        mazeType[key]=false;
    })

    if (type==="FREE_HAND"){
        mazeType.FREE_HAND=true;
    } else if (type==="BACKTRACK"){
        mazeType.BACKTRACK=true;
        resetMap();
        map.forEach(row=>{
            row.forEach(node=>{
                if (node!==startNode && node!== endNode)
                    node.nodeType=NODETYPES.WALL;
            })
        })

        dfsStack = [];

        let randCol = (Math.round(Math.random() * cols))
        let randRow = (Math.round(Math.random() * rows))
        while( map[randRow][randCol]===endNode
            || map[randRow][randCol]===startNode){
            randCol = (Math.round(Math.random() * cols))
            randRow = (Math.round(Math.random() * rows))
        }
        dfsStack.push(map[randRow][randCol])
        map[randRow][randCol].nodeType=NODETYPES.UNVISITED;
        runningMazeGeneration=true;

        map[startNode.row][startNode.col]=new Node(startNode.row, startNode.col, NODETYPES.WALL)
        map[endNode.row][endNode.col]=new Node(endNode.row, endNode.col, NODETYPES.WALL)
        mapCopy[startNode.row][startNode.col]=new Node(startNode.row, startNode.col, NODETYPES.WALL)
        mapCopy[endNode.row][endNode.col]=new Node(endNode.row, endNode.col, NODETYPES.WALL)

        numTimesStartAndEndPlaced=0;


    } else if (type==="RANDOM"){
        randomMazeIteration = 0;
        runningMazeGeneration=true;
        resetMap();
        mazeType.RANDOM=true;
    } else if (type==="DIVISION"){
        runningMazeGeneration=true;
        clearMap();
        mazeType.DIVISION=true;

        map[startNode.row][startNode.col]=new Node(startNode.row, startNode.col, NODETYPES.UNVISITED)
        map[endNode.row][endNode.col]=new Node(endNode.row, endNode.col, NODETYPES.UNVISITED)
        mapCopy[startNode.row][startNode.col]=new Node(startNode.row, startNode.col, NODETYPES.UNVISITED)
        mapCopy[endNode.row][endNode.col]=new Node(endNode.row, endNode.col, NODETYPES.UNVISITED)

        numTimesStartAndEndPlaced = 0;

        recursiveDivision(map, 0, cols-1, 0, rows-1);
    }

    document.querySelector("#mazeGeneratorDropdown button").textContent=type;

}

setSearchType= (searchAlgo) => {
    
    //resetting ooptions
    Object.keys(searchType).forEach(key=>{
        searchType[key]=false;
    })

    if (searchAlgo==="DFS")
        searchType.DFS = true;
    else if (searchAlgo==="BFS")
        searchType.BFS=true
    else if (searchAlgo === "DJIKSTRA")
        searchType.DJIKSTRA=true
    else if(searchAlgo==="A*")
        searchType.ASTAR=true

    document.querySelector("#algoDropdown button").textContent=searchAlgo;
}

runSearch= () => {
    if (searchType.DFS){
        runDFS();
        runningSearch=true
    } else if (searchType.BFS){
        runBFS();
        runningSearch=true
    } else if (searchType.DJIKSTRA){
        runDjikstra();
        runningSearch=true;
    } else if (searchType.ASTAR){
        runAStar();
        runningSearch=true;
    }
}

clearMap = () => {
    map.forEach(row=>{
        row.forEach(node=>{
            if (node!==startNode && node!==endNode)
                node.nodeType=NODETYPES.UNVISITED
        })
    })
}

//takes away the blue visited nodes
resetMap = () => {

    //clean upp
    mapCopy[startNode.row][startNode.col].nodeType=NODETYPES.START_UNSELECTED
    
    mapCopy[endNode.row][endNode.col].nodeType=NODETYPES.END_UNSELECTED

    map=JSON.parse(JSON.stringify(mapCopy));
    map.forEach(row=>{
        row.forEach(node=>{
            Object.setPrototypeOf(node, Node.prototype)
        })
    })
    map[endNode.row][endNode.col]=endNode;
    map[startNode.row][startNode.col]=startNode;
    path=[]
}

runDFS = () => {
    resetMap();
    dfsStack = [];
    path=[];

    dfsStack.push(startNode)
    map[startNode.row][startNode.col].nodeType=NODETYPES.VISITED 

}

runBFS = () => {
    resetMap();
    bfsQueue=[]
    path=[]

    bfsQueue.push(startNode);
    map[startNode.row][startNode.col].nodeType=NODETYPES.VISITED 
}

runDjikstra = () => {
    resetMap();
    djikPQ.clear();

    djikPQ.queue(startNode);
    map[startNode.row][startNode.col].nodeType=NODETYPES.VISITED 

}

runAStar = ()=> {
    timeStamp=window.performance.now();
    resetMap();
    aStartPQ.clear();

    aStartPQ.queue(startNode);
    map[startNode.row][startNode.col].nodeType=NODETYPES.VISITED
}

isSameSpot = (node1, node2) => {
    return node1.col===node2.col && node1.row===node2.row
}

checkTop = (map, node) => {
    if (node.row>0){
        if (map[node.row-1][node.col].nodeType===NODETYPES.UNVISITED ||
            map[node.row-1][node.col].nodeType===NODETYPES.END_UNSELECTED)
            return map[node.row-1][node.col]
    }
    return null
}

checkRight = (map, node) => {
    if (node.col<cols-1){ //-1 because cols acc start at 0
        if (map[node.row][node.col+1].nodeType===NODETYPES.UNVISITED ||
            map[node.row][node.col+1].nodeType===NODETYPES.END_UNSELECTED)
            return map[node.row][node.col+1]
    }
    return null
}

checkBottom = (map, node) => {
    if (node.row<rows-1){ //-1 because rows acc start at 0
        if (map[node.row+1][node.col].nodeType===NODETYPES.UNVISITED ||
            map[node.row+1][node.col].nodeType===NODETYPES.END_UNSELECTED)
            return map[node.row+1][node.col]
    }
    return null
}

checkLeft = (map, node) => {
    if (node.col>0){ 
        if (map[node.row][node.col-1].nodeType===NODETYPES.UNVISITED ||
            map[node.row][node.col-1].nodeType===NODETYPES.END_UNSELECTED)
            return map[node.row][node.col-1]
    }
    return null
}

getFreeAdjacentNode = (map, node) => {
    if (checkTop(map, node) !== null ) return checkTop(map, node)
    if (checkRight(map, node) !== null ) return checkRight(map, node)
    if (checkBottom(map, node) !== null ) return checkBottom(map, node)
    if (checkLeft(map, node) !== null ) return checkLeft(map, node)

    return null //means no adjacent unvisited nodes
}

getAllNeighbours = (map, node) => {
    let neighbours = []
    if (checkTop(map, node) !== null )  neighbours.push(checkTop(map, node))
    if (checkRight(map, node) !== null ) neighbours.push(checkRight(map, node))
    if (checkBottom(map, node) !== null ) neighbours.push(checkBottom(map, node))
    if (checkLeft(map, node) !== null ) neighbours.push(checkLeft(map, node))

    return neighbours //means no adjacent unvisited nodes
}

getRandomNeighbour = (map, node) => {
    let directionsChecked = []
    while(!(directionsChecked.includes(1) && 
    directionsChecked.includes(2) &&
    directionsChecked.includes(3) &&
    directionsChecked.includes(4))){
        let randDir = (Math.round(Math.random() * 4))+1
        if (randDir === 1 && !directionsChecked.includes(1)){
            if (checkTop(map, node) !== null)
                return checkTop(map, node)
            else    
                directionsChecked.push(1)
        }
        if (randDir === 2 && !directionsChecked.includes(2)){
            if (checkRight(map, node) !== null)
                return checkRight(map, node)
            else    
                directionsChecked.push(2)
        }
        if (randDir === 3 && !directionsChecked.includes(3)){
            if (checkBottom(map, node) !== null)
                return checkBottom(map, node)
            else    
                directionsChecked.push(3)
        }
        if (randDir === 4 && !directionsChecked.includes(4)){
            if (checkLeft(map, node) !== null)
                return checkLeft(map, node)
            else    
                directionsChecked.push(4)
        }
    }
    return null
}

showStartAndEnd = () => {
    startNode.nodeType=NODETYPES.START_UNSELECTED;
    endNode.nodeType=NODETYPES.END_UNSELECTED;
}

depthFirstSearch = (stack, map) => {

    if (stack.length===0)
        return "NOT FOUND"

    let curNode = stack[stack.length-1]
    if (curNode===endNode){
        path=stack;
        return "FOUND"
    }

    let adjacentNode = getFreeAdjacentNode(map, curNode)
    if (adjacentNode!=null){
        stack.push(adjacentNode)
        adjacentNode.nodeType=NODETYPES.VISITED
    } else {
        stack.pop()
    }

    return "SEARCHING"

}

breadthFirstSearch = (queue, map) =>{
    if (queue.length===0)
        return "NOT FOUND"

    let curNode = queue[0]
    if (queue[queue.length-1]===endNode){
        path.unshift(endNode)
        let previous = endNode.prevNode
        path.unshift(previous)
        while(previous.prevNode !== undefined){
            previous = previous.prevNode
            path.unshift(previous)
        }
        return "FOUND"
    }

    let adjacentNode = getFreeAdjacentNode(map, curNode)
    if (adjacentNode!=null){
        queue.push(adjacentNode)
        adjacentNode.prevNode = curNode;
        adjacentNode.nodeType=NODETYPES.VISITED
    } else {
        queue.shift()
    }

    return "SEARCHING"

}

//helper method to see if a pq contains a node
pqContains = (pq, node) => {
    pqNodes = []
    let pqContainsNode = false
    while(pq.length!==0 && pqContainsNode === false){
        let pqNode = pq.dequeue();
        pqNodes.push(pqNode);
        if (pqNode===node){
            pqContainsNode=true;
        }
    }
    pqNodes.forEach(node=>pq.queue(node))

    return pqContainsNode
}

djikstra = (djikPQ, map) => {
    
    if (djikPQ.length===0)
        return "NOT FOUND"
    
    let bestUnexploredNode = djikPQ.dequeue();
    bestUnexploredNode.nodeType=NODETYPES.VISITED;

    //getting all its unvisited neighbours (not cur part of closed set)
    let neighbours = getAllNeighbours(map, bestUnexploredNode)

    //updating all the neighbours weights (if better) and adding them to PQ (not included prev visited neighbours)
    for(let i = 0; i<neighbours.length; i++){
        let node = neighbours[i];
        node.prevNode=bestUnexploredNode;

        if (node===endNode){
            path.unshift(endNode)
            let previous = endNode.prevNode
            path.unshift(previous)
            while(previous.prevNode !== undefined){
                previous = previous.prevNode
                path.unshift(previous)
            }
            return "FOUND"
        }

        let tempG = bestUnexploredNode.g+1;
        if (tempG<node.g)
            node.g=tempG
        if (!pqContains(djikPQ, node)){
            djikPQ.queue(node)
            node.nodeType=NODETYPES.TO_BE_EXPLORED
        }
    }

    return "SEARCHING"
}

astar = (aStarPQ, map) => {
    
    if (aStartPQ.length===0)
        return "NOT FOUND"
    
    let bestUnexploredNode = aStarPQ.dequeue();
    bestUnexploredNode.nodeType=NODETYPES.VISITED;

    //getting all its unvisited neighbours (not cur part of closed set)
    let neighbours = getAllNeighbours(map, bestUnexploredNode)

    //updating all the neighbours weights (if better) and adding them to PQ (not included prev visited neighbours)
    for(let i = 0; i<neighbours.length; i++){
        let node = neighbours[i];
        node.prevNode=bestUnexploredNode;

        if (node===endNode){
            path.unshift(endNode)
            let previous = endNode.prevNode
            path.unshift(previous)
            while(previous.prevNode !== undefined){
                previous = previous.prevNode
                path.unshift(previous)
            }
            return "FOUND"
        }

        let tempGScore = bestUnexploredNode.g+1;
        let tempF = tempGScore+node.h;
        if (tempGScore<node.g)
            node.g=tempGScore;
            node.f=tempF
        if (!pqContains(aStarPQ, node)){
            aStarPQ.queue(node)
            node.nodeType=NODETYPES.TO_BE_EXPLORED
        }
    }

    return "SEARCHING"
}

notAdjacentToPath = (map, node, direction) => {
    //top
    if (node.row>0 && direction!=="bottom"){
        if (map[node.row-1][node.col].nodeType===NODETYPES.UNVISITED)
            return false
    }
    //topright
    if (node.row>0 && node.col<cols-1 && direction!=="bottom" && direction!=="left"){
        if (map[node.row-1][node.col+1].nodeType===NODETYPES.UNVISITED)
            return false
    }
    //top left
    if (node.col>0 && node.row>0 && direction!=="bottom" && direction!=="right"){ 
        if (map[node.row-1][node.col-1].nodeType===NODETYPES.UNVISITED)
            return false
    }
    //right
    if (node.col<cols-1 && direction!=="left"){ //-1 because cols acc start at 0
        if (map[node.row][node.col+1].nodeType===NODETYPES.UNVISITED)
            return false
    }
    //bottom
    if (node.row<rows-1 && direction!=="top"){ //-1 because rows acc start at 0
        if (map[node.row+1][node.col].nodeType===NODETYPES.UNVISITED)
            return false
    }
    //bottomright
    if (node.row<rows-1 && node.col<cols-1 && direction!=="left" && direction!=="top"){ //-1 because rows acc start at 0
        if (map[node.row+1][node.col+1].nodeType===NODETYPES.UNVISITED)
            return false
    }

    //left
    if (node.col>0 && direction!=="right"){ 
        if (map[node.row][node.col-1].nodeType===NODETYPES.UNVISITED)
            return false
    }
    //bottom left
    if (node.col>0 && node.row<rows-1 && direction!=="right" && direction!=="top"){ 
        if (map[node.row+1][node.col-1].nodeType===NODETYPES.UNVISITED)
            return false
    }

    return true;
}

getRandomNeighbourRecursiveBacktrack = (map, node) => {

    let directionsChecked = []
    
    while (!(directionsChecked.includes(1) && directionsChecked.includes(2)
            && directionsChecked.includes(3) && directionsChecked.includes(4))){

                let randDir = (Math.ceil(Math.random() * 4))

                 //top
                if (randDir===1){
                    if (node.row>0 && !directionsChecked.includes(1)) {
                        if (map[node.row-1][node.col].nodeType===NODETYPES.WALL && notAdjacentToPath(map, map[node.row-1][node.col], "top") )
                            return map[node.row-1][node.col]
                        else    
                            directionsChecked.push(1)
                    }else   
                        directionsChecked.push(1)
                }
                //right
                if (randDir===2){ //-1 because cols acc start at 0
                    if (node.col<cols-1 && !directionsChecked.includes(2)) {
                        if (map[node.row][node.col+1].nodeType===NODETYPES.WALL && notAdjacentToPath(map, map[node.row][node.col+1], "right"))
                            return map[node.row][node.col+1]
                        else    
                            directionsChecked.push(2)
                    } else  
                        directionsChecked.push(2)
                }
                //bottom
                if (randDir===3){ //-1 because rows acc start at 0
                    if (node.row<rows-1 && !directionsChecked.includes(3)){
                        if (map[node.row+1][node.col].nodeType===NODETYPES.WALL && notAdjacentToPath(map, map[node.row+1][node.col],"bottom"))
                            return map[node.row+1][node.col]
                        else    
                            directionsChecked.push(3)
                    } else  
                        directionsChecked.push(3)
                }

                //left
                if (randDir===4){ 
                    if (node.col>0 && !directionsChecked.includes(4)){
                        if (map[node.row][node.col-1].nodeType===NODETYPES.WALL && notAdjacentToPath(map, map[node.row][node.col-1], "left"))
                            return map[node.row][node.col-1]
                        else    
                            directionsChecked.push(4)
                    } else 
                        directionsChecked.push(4)
                }
            }
        return null
}

placeStartAndEnd = () => {

    if (numTimesStartAndEndPlaced > 0)
        return
    
    numTimesStartAndEndPlaced++;

    mapCopy=JSON.parse(JSON.stringify(map));
    mapCopy.forEach(row=>{
        row.forEach(node=>{
            Object.setPrototypeOf(node, Node.prototype)
        })
    })
    

    let randCol1 = (Math.round(Math.random() * cols))
    let randRow1 = (Math.round(Math.random() * rows))
    while( map[randRow1][randCol1].nodeType===NODETYPES.WALL){
        randCol1 = (Math.round(Math.random() * cols))
        randRow1 = (Math.round(Math.random() * rows))
    }

    let randCol2 = (Math.round(Math.random() * cols))
    let randRow2 = (Math.round(Math.random() * rows))
    while( map[randRow2][randCol2].nodeType===NODETYPES.WALL ||
        map[randRow2][randCol2]===startNode){
        randCol2 = (Math.round(Math.random() * cols))
        randRow2 = (Math.round(Math.random() * rows))
    }
    changeStartNode(randRow1, randCol1);
    changeEndNode(randRow2, randCol2);
}

recursiveBacktracking = (stack, map) => {
    if (stack.length===0){
        mapCopy=JSON.parse(JSON.stringify(map));
        mapCopy.forEach(row=>{
            row.forEach(node=>{
                Object.setPrototypeOf(node, Node.prototype)
            })
        })
        return "DONE"
    }
    let curNode = stack[stack.length-1]
    let neighbour = getRandomNeighbourRecursiveBacktrack(map, curNode);
    if (neighbour!==null){
            neighbour.nodeType=NODETYPES.UNVISITED;
            stack.push(neighbour)
    } else {
        stack.pop();
    }
    
}

noSquarePaths = () => {
    let noSquarePaths = true
    map.forEach((row, rowindex)=>{
        row.forEach((node, col)=>{
            if (node.nodeType===NODETYPES.UNVISITED){
                let adjacentPieces=[]

                if(col<cols-1){
                    if(row[col+1].nodeType===NODETYPES.UNVISITED)
                        adjacentPieces.push("right")
                }
                if(rowindex<rows-1){
                    if(map[rowindex+1][col].nodeType===NODETYPES.UNVISITED)
                        adjacentPieces.push("bottom")
                }
                if(col<cols-1 && rowindex<rows-1){
                    if(map[rowindex+1][col+1].nodeType===NODETYPES.UNVISITED)
                        adjacentPieces.push("bottomRight")
                }
                if (adjacentPieces.includes("bottom") && adjacentPieces.includes("right")
                && adjacentPieces.includes("bottomRight")){
                    noSquarePaths=false;
                }
            }
        
        })
    })
    return noSquarePaths 
}

function sleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

async function recursiveDivision(map, startCol, endCol, startRow, endRow){

    if (noSquarePaths()){
        runningMazeGeneration=false;
        mazeType.DIVISION=false;
        placeStartAndEnd();
    }

    let w = endCol-startCol;
    let h = endRow-startRow;
    if (w+1===1 || h+1===1)
        return
    
    if(w>=h){ //splitting map vertically
        let randCol = Math.floor(Math.random() * (endCol-startCol+1)) + startCol
        while(randCol%2!==1){ //must be even col to put wall (mod has to be 1 since indices start at 0)
            randCol = Math.floor(Math.random() * (endCol-startCol+1)) + startCol
        }

        //setting wall to split current map in half vertically
        map.forEach((row, rowIndex)=>{
            row.forEach((node, col)=>{
                if(col===randCol && rowIndex>=startRow && rowIndex<=endRow)
                    node.nodeType=NODETYPES.WALL
            })
        })

        let randPathRow = Math.floor(Math.random() * (endRow-startRow+1)) + startRow
        while(randPathRow%2!==0){ //must be odd row to put path (mod has to be 0 since indices start at 0)
            randPathRow = Math.floor(Math.random() * (endRow-startRow+1)) + startRow
        }

        //setting path to keep maze property
        map[randPathRow][randCol].nodeType=NODETYPES.UNVISITED

        ctx.clearRect(0, 0, width, height);
        drawGrid()

        await sleep(100)
        recursiveDivision(map, startCol, randCol-1, startRow, endRow) //repeat on left
        await sleep(100)
        recursiveDivision(map, randCol+1, endCol, startRow, endRow)

    } else { //splitting map horizontally
        let randRow = Math.floor(Math.random() * (endRow-startRow+1)) + startRow
        while(randRow%2!==1){ //must be even row to put wall (mod has to be 1 since indices start at 0)
            randRow = Math.floor(Math.random() * (endRow-startRow+1)) + startRow
        }

        //setting wall to split current map in half
        map[randRow].forEach((node,col)=>{
            if(col>=startCol && col<=endCol){
                node.nodeType=NODETYPES.WALL
            }
        })

        let randPathCol = Math.floor(Math.random() * (endCol-startCol+1)) + startCol
        while(randPathCol%2!==0){ //must be odd row to put path (mod has to be 0 since indices start at 0)
            randPathCol = Math.floor(Math.random() * (endCol-startCol+1)) + startCol
        }

        //setting path to keep maze property
        map[randRow][randPathCol].nodeType=NODETYPES.UNVISITED

        ctx.clearRect(0, 0, width, height);
        drawGrid()

        await sleep(100)
        recursiveDivision(map, startCol, endCol, startRow, randRow-1) //repeat on bottom
        await(100)
        recursiveDivision(map, startCol, endCol, randRow+1, endRow) //repeat on top
    }
}

randomMaze=(map)=>{
    let maxIteration = Math.floor(cols*rows/(100/30)); //30% of board
    if(randomMazeIteration===maxIteration)
        return "DONE"
    let randCol = (Math.round(Math.random() * cols))
    let randRow = (Math.round(Math.random() * rows))
    while(map[randRow][randCol].nodeType===NODETYPES.WALL 
        || map[randRow][randCol]===endNode
        || map[randRow][randCol]===startNode){
        randCol = (Math.round(Math.random() * cols))
        randRow = (Math.round(Math.random() * rows))
    }

    map[randRow][randCol].nodeType=NODETYPES.WALL;
    mapCopy[randRow][randCol].nodeType=NODETYPES.WALL;
    randomMazeIteration++;
}

function main(){

    if (runningSearch && !runningMazeGeneration){
        if (searchType.DFS){
            let status = depthFirstSearch(dfsStack, map)
            if (status === "SEARCHING")
                runningSearch=true
            else if(status==="FOUND"){
                runningSearch=false
                path=dfsStack;
                showStartAndEnd()
            }
            else if(status==="NOT FOUND"){
                runningSearch=false
                alert("NOT FOUND")
            }
    
        } else if (searchType.BFS){
            let status = breadthFirstSearch(bfsQueue, map);
            if (status === "SEARCHING")
                runningSearch=true
            else if(status==="FOUND"){
                runningSearch=false
                showStartAndEnd()
            }
            else if(status==="NOT FOUND"){
                runningSearch=false
                alert("NOT FOUND")
            }
        } else if (searchType.DJIKSTRA) {
            let status = djikstra(djikPQ, map);
            if (status === "SEARCHING")
                runningSearch=true
            else if(status==="FOUND"){
                runningSearch=false
                showStartAndEnd()
            }
            else if(status==="NOT FOUND"){
                runningSearch=false
                alert("NOT FOUND")
            }
        } else if (searchType.ASTAR) {
            let status = astar(aStartPQ, map);
            if (status === "SEARCHING")
                runningSearch=true
            else if(status==="FOUND"){
                timeStamp=(window.performance.now()-timeStamp)/1000000
                console.log("Time of Algo: " + timeStamp)
                runningSearch=false
                showStartAndEnd()
            }
            else if(status==="NOT FOUND"){
                runningSearch=false
                alert("NOT FOUND")
            }
        }
    }

    if (runningMazeGeneration && !runningSearch){
        if (mazeType.BACKTRACK){
            let status = recursiveBacktracking(dfsStack, map);
            if (status==="DONE"){
                runningMazeGeneration=false;
                placeStartAndEnd();
            }
        } else if (mazeType.RANDOM){
            let status = randomMaze(map);
            if (status==="DONE")
                runningMazeGeneration=false;
        }
    }

    ctx.clearRect(0, 0, width, height);
    drawGrid()
    drawPath(path)
}

setInterval(main, 1000/1000)
