import { useEffect, useRef, useState } from "react";
import "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
function getUserMediaSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}
interface BoxProps extends cocoSsd.DetectedObject {
  videoOffset: number[];
  isMobile: boolean;
}
function Box({ bbox, class: objName, score, videoOffset, isMobile }: BoxProps) {
  return (
    <>
      <p
        style={{
          marginLeft: `${bbox[0] + videoOffset[0]}px`,
          marginTop: `${bbox[1]}px`,
          width: isMobile ? `${bbox[2]}px` : `${bbox[2]}px`,
          top: 0,
          left: 0,
        }}
      >
        {`${objName} - with ${Math.round(Number(score) * 100)}% confidence`}
      </p>
      <div
        className="highlighter"
        style={{
          left: `${bbox[0] + videoOffset[0]}px`,
          top: `${bbox[1]}px`,
          width: isMobile ? `${bbox[2]}px` : `${bbox[2]}px`,
          height: isMobile ? `${bbox[3]}px` : `${bbox[3]}px`,
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
  const [videoOffset, setVideoOffset] = useState([0, 0]);
  const [isMobile, setIsMobile] = useState(false);
  function enableCam(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.preventDefault();
    if (!getUserMediaSupported()) {
      alert("getUserMedia() not supported.");
      return;
    }
    if (!model) return;

    const constraints = {
      video: {
        facingMode: "environment",
        // width: isMobile ? 320 : 640,
        // height: isMobile ? 240 : 480,
      },
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
      //   videoRef.current.play();
      setIsStreaming(true);
    };

    activateStream();
  }
  useEffect(() => {
    function isMobile() {
      if (window.innerWidth < 768) {
        setIsMobile(true);
      } else {
        setIsMobile(false);
      }
    }

    window.addEventListener("resize", () => {
      isMobile();
    });
    isMobile();
    return () => removeEventListener("resize", isMobile);
  }, []);

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
      const rect = video.getBoundingClientRect();
      setVideoOffset([rect.left, rect.top]);
      const predictions = await model.detect(video);
      setPredictions(predictions);
      animationFrameId = requestAnimationFrame(getPredictions);
    };
    getPredictions();
    return () => cancelAnimationFrame(animationFrameId);
  }, [model, isStreaming]);

  //   console.log("predictions", predictions);

  return (
    <div className="container">
      <h1>
        Multiple object detection using TensorFlow.js and coco-ssd pre trained
        model.
      </h1>

      <section className={model ? "" : "invisible "}>
        <div className="camView">
          <button className="webcamButton" onClick={enableCam}>
            Enable Webcam
          </button>
          <video
            className="video"
            style={{
              width: isMobile ? "640px" : "640px",
              height: isMobile ? "480px" : "480px",
            }}
            ref={videoRef}
            id="webcam"
            playsInline={true}
            muted={true}
            autoPlay={true}
            // autoPlay
            // width={isMobile ? 320 : 640}
            // height={isMobile ? 240 : 480}
            // width="640"
            // height="480"
          ></video>
          {predictions.length > 0 &&
            predictions.map((prediction) => {
              if (prediction.score > 0.66) {
                return (
                  <Box
                    key={prediction.score}
                    {...prediction}
                    videoOffset={videoOffset}
                    isMobile={isMobile}
                  />
                );
              }
            })}
        </div>
      </section>
    </div>
  );
}

export default Home;
