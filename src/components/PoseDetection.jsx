import React, { useRef, useEffect } from "react";

function PoseDetection({ onPoseResults }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // ✅ MediaPipeのスクリプトを安全に読み込む関数
  const loadMediaPipe = async () => {
    const scriptUrls = [
      "https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js",
      "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js",
      "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"
    ];

    for (const url of scriptUrls) {
      if (!document.querySelector(`script[src=\"${url}\"]`)) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = url;
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadMediaPipe();

      if (!window.Pose) {
        console.error("MediaPipe Pose not loaded correctly.");
        return;
      }

      const videoElement = videoRef.current;
      const canvasElement = canvasRef.current;
      const canvasCtx = canvasElement.getContext("2d");

      const pose = new window.Pose.Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose.onResults((results) => {
        if (!results.poseLandmarks) return;

        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

        window.drawConnectors(
          canvasCtx,
          results.poseLandmarks,
          window.POSE_CONNECTIONS.filter(([a, b]) =>
            [11, 13, 15, 23, 25, 27].includes(a) && [11, 13, 15, 23, 25, 27].includes(b)
          ),
          { color: "white", lineWidth: 3 }
        );
        window.drawLandmarks(canvasCtx, results.poseLandmarks, {
          color: "white",
          radius: 4,
        });

        canvasCtx.restore();

        if (onPoseResults) onPoseResults(results);
      });

      const camera = new window.Camera(videoElement, {
        onFrame: async () => {
          await pose.send({ image: videoElement });
        },
        width: 640,
        height: 480,
      });
      camera.start();
    };

    init();
  }, [onPoseResults]);

  return (
    <div className="flex justify-center">
      <video ref={videoRef} className="rounded-lg" autoPlay muted playsInline></video>
      <canvas ref={canvasRef} className="absolute top-0 left-0"></canvas>
    </div>
  );
}

export default PoseDetection;
