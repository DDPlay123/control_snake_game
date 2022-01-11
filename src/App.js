import React, { useState, useRef, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import Webcam from "react-webcam";
import './App.css';

//Import Snake Object
import Blank from './blank.png'
import Snake from './snake.png'
import Food  from './food.png'

//Snake Game main function..............
var result;
// Define Snake Board Object
const SnakeBoard = () => {
  const width = 10;
  const height = 10;
  // Initial Background
  let initalRows = [];
  for(let i=0; i<height; i++){
    initalRows.push([]);
    for(let  j=0; j<width; j++){
      initalRows[i].push('blank');
    }
  }
  // Define Random Position function for food
  const randomPosition = () => {
    const position = {
      x: Math.floor(Math.random()*width),
      y: Math.floor(Math.random()*height)
    };
    return position
  }
  // Use useState Hook to display Background and Food
  const [rows, setRows] = useState(initalRows);
  const [food, setFood] = useState(randomPosition);
  // Use useState Hook to define snake inital direction and length
  const [snake, setSnake] = useState([{x:0, y:0,}, {x:0, y:0}]);
  const [direction, setDirection] = useState('init');
  // Display Snake function
  const displaySnake = () => {
    const newRows = initalRows;
    snake.forEach(cell => {
      newRows[cell.x][cell.y] = 'snake';
    })
    newRows[food.x][food.y] = 'food';
    setRows(newRows);
  }
  // Define Snake move direction function
  const changeDirectionWithHand = () => {
    switch(result){
      case 'up':
        setDirection('up');
        break;
      case 'down':
        setDirection('down');
        break;
      case 'left':
        setDirection('left');
        break;
      case 'right':
        setDirection('right');
        break;
      default:
        break;
    }
  }
  // Tracking Hand Direction to control Snake direction
  setTimeout(changeDirectionWithHand, 0);
  // According Snake dirction to control Snake move
  const moveSnake = () => {
    const newSnake = [];
    switch(direction){
      case 'init':
        newSnake.push({x: snake[0].x, y: snake[0].y});
        break;
      case 'up':
        newSnake.push({x: (snake[0].x - 1 + height)%height, y: snake[0].y});
        break;
      case 'down':
        newSnake.push({x: (snake[0].x + 1)%height, y: snake[0].y});
        break;
      case 'left':
        newSnake.push({x: snake[0].x, y: (snake[0].y - 1 + width)%width});
        break;
      case 'right':
        newSnake.push({x: snake[0].x, y: (snake[0].y + 1)%width});
        break;
      default:
        break;
    }
    snake.forEach(cell => {
      newSnake.push(cell);
    })
    if(snake[0].x === food.x && snake[0].y === food.y){
      setFood(randomPosition);
    }else{
      newSnake.pop();
    }
    setSnake(newSnake);
    displaySnake();
  }
  // Define Snake move rate
  useInterval(moveSnake, 300)
  function useInterval(callback, delay){
    const savedCallback = useRef();
    // Remember the latest callback.
    useEffect(() => {
      savedCallback.current = callback;
    }, [callback]);
    // Set up the interval.
    useEffect(() => {
      function tick(){
        savedCallback.current();
      }
      if(delay !== null){
        let id = setInterval(tick, delay);
        return() => clearInterval(id);
      }
    }, [delay]);
  }
  // Display Object to HTML
  const displayRows = rows.map(row =>
    <li>
      {row.map(e => {
        switch(e){
          case 'blank':
            return <img src={Blank} alt=""/>
          case 'snake':
            return <img src={Snake} alt=""/>
          case 'food':
            return <img src={Food} alt=""/>
          default:
            return null;
        }
      })}
    </li>  
  );
  return(
    <div>
      <ul style={{width:'500px', padding:'0px'}} className="img500">
        {displayRows}
        <h1 id="id" style={{color:"white"}}>{result}</h1>
      </ul>
    </div>
  )
}
// Define our labelmap
const labelMap = {
  1:{name:'down', color:'red'},
  2:{name:'left', color:'yellow'},
  3:{name:'right', color:'lime'},
  4:{name:'up', color:'blue'},
} 
// Define a drawing function
const drawRect = function(boxes, classes, scores, threshold, imgWidth, imgHeight, ctx){
  for(let i=0; i<=boxes.length; i++){
    if(boxes[i] && classes[i] && scores[i]>threshold){
      // Extract variables
      const [y, x, height, width] = boxes[i]
      const text = classes[i]
      // Set styling
      ctx.strokeStyle = labelMap[text]['color']
      ctx.lineWidth = 5
      ctx.fillStyle = 'red'
      ctx.font = '30px Arial'
      // DRAW!!
      ctx.beginPath()
      ctx.fillText(labelMap[text]['name'] + ' - ' + Math.round(scores[i]*100)/100, x*imgWidth, y*imgHeight-10)
      ctx.rect(x*imgWidth, y*imgHeight, width*imgWidth/2, height*imgHeight/2);
      ctx.stroke()
      switch(text){
        case(1):
          result = 'down';
          break;
        case(2):
          result = 'right';
          break;
        case(3):
          result = 'left';
          break;
        case(4):
          result = 'up';
          break;
        default:
          break;
      }
      //console.log(result);
    }
  }
}

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  // Main function
  const runObjectDetection = async() => {
    // load model
    const model = await tf.loadGraphModel('https://raw.githubusercontent.com/DDPlay123/TFJS_model/main/All_model/tensorflow_JS/Original_Dataset_x13/model.json');
    // loop and detect hands
    setInterval(() => {detect(model);}, 0);
  }
  const detect = async(model) => {
    // Check data is available
    if(
      typeof webcamRef.current !== "undefined" &&
       webcamRef.current !== null &&
       webcamRef.current.video.readyState === 4
    ){
      // Get Video Properties
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;
      // Set video width
      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;
      // Set canvas height and width
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;
      // Make Detections
      const img = tf.browser.fromPixels(video)
      const resized = tf.image.resizeBilinear(img, [320,320])
      const casted = resized.cast('int32')
      const expanded = casted.expandDims(0)
      const obj = await model.executeAsync(expanded)

      //console.log(await obj[7].array())

      const boxes = await obj[3].array()
      const classes = await obj[6].array()
      const scores = await obj[7].array()
      // Draw mesh
      const ctx = canvasRef.current.getContext("2d");
      // Update drawing utility
      // drawSomething(obj, ctx)  
      requestAnimationFrame(()=>{drawRect(boxes[0], classes[0], scores[0], 0.8, videoWidth, videoHeight, ctx)});
    
      tf.dispose(img)
      tf.dispose(resized)
      tf.dispose(casted)
      tf.dispose(expanded)
      tf.dispose(obj)
    }
  }
  useEffect(() => {runObjectDetection()});
  return (
    <div className="App">
      <div style={{background:"green", float:"left", marginLeft:10, marginRight:10}}>
        <SnakeBoard/>
      </div>
      <div>
      <Webcam
          ref={webcamRef}
          muted={true} 
          style={{
            position: "absolute",
            left: 520,
            textAlign: "center",
            zindex: 9,
            width: 320,
            height: 320,
            background: "gray"
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            left: 520,
            textAlign: "center",
            zindex: 8,
            width: 320,
            height: 320
          }}
        />
      </div>
    </div>
  );
}

export default App;
