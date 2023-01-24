import React, { useRef, useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import * as handpose from "@tensorflow-models/handpose";
import Webcam from "react-webcam";
import { nextFrame } from "@tensorflow/tfjs";
import { drawHand } from "./utilities";
import * as fp from "fingerpose";
import thumbsup from "./images/thumbsup.png";
import peace from "./images/peace.png";
import Square from "./Square.jsx";
function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState(null);
  const images = { thumbs_up: thumbsup, victory: peace };
  const squareRef = useRef(null);
  const [xPos, setXPos] = useState(0);
  const [yPos, setYPos] = useState(0);
  let previousHand;

  const runHandpose = async () => {
    const net = await handpose.load();
    console.log("Handpose loaded successfully");

    setInterval(() => {
      detect(net);
    }, 10);
  };

  const detect = async (net) => {
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      const hand = await net.estimateHands(video);
      // console.log(hand);

      if (hand.length > 0) {
        // Check if the hand array has any elements in it.
        // If there are no elements, the code within the if block will not execute.
        const GE = new fp.GestureEstimator([
          fp.Gestures.VictoryGesture,
          fp.Gestures.ThumbsUpGesture,
        ]);
        // Create a new instance of the GestureEstimator class from the fingerpose library (fp)
        // and pass in an array of possible gestures to estimate. VictoryGesture and ThumbsUpGesture are the two possible gestures
        const gesture = await GE.estimate(hand[0].landmarks, 4);
        // Use the estimate() method on the GE instance and pass in the hand landmarks and a sensitivity level of 4.
        // This returns a gesture object which contains information about the estimated gesture.
        if (gesture.gestures != undefined && gesture.gestures.length > 0) {
          // Check if the gesture object has a property called "gestures" and this property's length is greater than 0
          const score = gesture.gestures.map((p) => p.score);
          // map over the gestures array and get the score of each gesture
          const maxScore = score.indexOf(Math.max.apply(null, score));
          // find the index of the maximum score
          await setStatus(gesture.gestures[maxScore].name);
          // set the status to the name of the gesture with the maximum score
          if (status) {
            // console.log(status);
          }
        }

        if (previousHand) {
          const xDiff =
            hand[0].landmarks[0][0] - previousHand[0].landmarks[0][0];
          const yDiff =
            hand[0].landmarks[0][1] - previousHand[0].landmarks[0][1];
          setXPos(xPos + xDiff);
          setYPos(yPos + yDiff);
          console.log(hand[0]);
        }
        previousHand = hand;
      }

      const ctx = canvasRef.current.getContext("2d");
      drawHand(hand, ctx);
    }
  };

  useEffect(() => {
    runHandpose();
  }, []);

  useEffect(() => {
    const animate = () => {
      squareRef.current.style.transform = `translate(${xPos}px, ${yPos}px)`;
      // console.log(xPos, yPos);
      requestAnimationFrame(animate);
    };
    animate();
  }, [xPos, yPos]);

  return (
    <div className="App">
      <header className="App-header">
        <Webcam
          ref={webcamRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zIndex: 9,
            width: 640,
            height: 480,
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zIndex: 9,
            width: 640,
            height: 480,
          }}
        />
        {status != null ? (
          <img
            src={images[status]}
            style={{
              position: "absolute",
              marginLeft: "auto",
              marginRight: "auto",
              left: 800,
              bottom: 500,
              right: 0,
              textAlign: "center",
              height: 100,
            }}
          />
        ) : (
          ""
        )}
      </header>
      <div ref={squareRef} className="square">
        <Square />
      </div>
    </div>
  );
}

export default App;
