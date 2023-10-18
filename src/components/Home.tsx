import { useEffect, useRef, useState } from "react";
import "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
function getUserMediaSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}
function Box({ bbox, class: objName, score }: cocoSsd.DetectedObject) {
  return (
    <>
      <p
        style={{
          left: bbox[0],
          top: bbox[1],
          width: bbox[2],
        }}
      >
        {`${objName} - with ${Math.round(Number(score) * 100)}% confidence`}
      </p>
      <div
        className="highlighter"
        style={{
          left: bbox[0],
          top: bbox[1],
          width: bbox[2],
          height: bbox[3],
        }}
      ></div>
    </>
  );
}
function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [predictions, setPredictions] = useState<cocoSsd.DetectedObject[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  function enableCam(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.preventDefault();
    if (!getUserMediaSupported()) {
      alert("getUserMedia() not supported.");
      return;
    }
    if (!model) return;

    const constraints = {
      video: { facingMode: { exact: "environment" } },
    };

    const activateStream = async () => {
      if (!videoRef.current) return;

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoRef.current.srcObject = stream;
      const onMetaDataLoaded = (): Promise<void> => {
        return new Promise((resolve) => {
          if (!videoRef.current) return;
          return (videoRef.current.onloadedmetadata = () => resolve());
        });
      };
      await onMetaDataLoaded();
      videoRef.current.play();
      setIsStreaming(true);
    };

    activateStream();
  }

  useEffect(() => {
    const getCocoSsdModel = async () => {
      try {
        const model = await cocoSsd.load();
        setModel(model);
      } catch (error) {
        console.error(error);
      }
    };
    getCocoSsdModel();
  }, []);

  useEffect(() => {
    if (!model || !isStreaming) return;
    let animationFrameId: number;
    const getPredictions = async () => {
      if (!videoRef.current) return;
      const video = videoRef.current;
      const predictions = await model.detect(video);
      setPredictions(predictions);
      animationFrameId = requestAnimationFrame(getPredictions);
    };
    getPredictions();
    return () => cancelAnimationFrame(animationFrameId);
  }, [model, isStreaming]);

  return (
    <>
      <h1>
        Multiple object detection using pre trained model in TensorFlow.js
      </h1>

      <p>
        Wait for the model to load before clicking the button to enable the
        webcam - at which point it will become visible to use.
      </p>

      <section className={model ? "" : "invisible"}>
        <p>
          Hold some objects up close to your webcam to get a real-time
          classification! When ready click "enable webcam" below and accept
          access to the webcam when the browser asks (check the top left of your
          window)
        </p>
        <div className="camView">
          <button id="webcamButton" onClick={enableCam}>
            Enable Webcam
          </button>
          <video
            ref={videoRef}
            id="webcam"
            // autoPlay
            width="640"
            height="480"
          ></video>
          {predictions.length > 0 &&
            predictions.map((prediction) => {
              if (prediction.score > 0.66) {
                return <Box key={prediction.score} {...prediction} />;
              }
            })}
        </div>
      </section>
    </>
  );
}

export default Home;
