import React, { useEffect, useRef } from "react";

const PoseDetection = ({ videoUrl }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const loadScripts = async () => {
      const scriptUrls = [
        "https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js",
        "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js",
        "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js",
      ];

      for (const url of scriptUrls) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = url;
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      if (!window.Pose) {
        console.error("MediaPipe Pose not loaded correctly");
        return;
      }

      const { Pose } = window;
      const { drawConnectors, drawLandmarks } = window;
      const pose = new Pose({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`,
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose.onResults(onResults);

      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          await pose.send({ image: videoRef.current });
        },
        width: 640,
        height: 480,
      });
      camera.start();

      function onResults(results) {
        const canvasElement = canvasRef.current;
        const canvasCtx = canvasElement.getContext("2d");
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.drawImage(
          results.image,
          0,
          0,
          canvasElement.width,
          canvasElement.height
        );
        if (results.poseLandmarks) {
          drawConnectors(canvasCtx, results.poseLandmarks, Pose.POSE_CONNECTIONS, {
            color: "#00FF00",
            lineWidth: 4,
          });
          drawLandmarks(canvasCtx, results.poseLandmarks, {
            color: "#FF0000",
            lineWidth: 2,
          });
        }
        canvasCtx.restore();
      }
    };

    loadScripts();
  }, []);

  return (
    <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
      <div>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          width="640"
          height="480"
          style={{ borderRadius: "10px", backgroundColor: "#000" }}
        />
        <canvas
          ref={canvasRef}
          width="640"
          height="480"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            zIndex: 1,
          }}
        />
      </div>
      <div>
        <video
          src={videoUrl}
          autoPlay
          loop
          muted
          width="640"
          height="480"
          controls
          style={{ borderRadius: "10px" }}
        />
      </div>
    </div>
  );
};

export default PoseDetection;
