// PoseDetection.jsx
import React, { useRef, useEffect, useState } from "react";
import * as posedetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs";

const PoseDetection = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [detector, setDetector] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [keypointColor, setKeypointColor] = useState("red");
  const [lineColor, setLineColor] = useState("green");
  const [lineWidth, setLineWidth] = useState(2);
  const [keypointSize, setKeypointSize] = useState(5);

  // カメラ初期化
  const setupCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("カメラにアクセスできません。");
      return;
    }

    const video = videoRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 },
      audio: false,
    });
    video.srcObject = stream;

    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        video.play();
        resolve(video);
      };
    });
  };

  // 検出器作成
  const createDetector = async () => {
    const detectorConfig = {
      modelType: posedetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
    };
    const det = await posedetection.createDetector(
      posedetection.SupportedModels.MoveNet,
      detectorConfig
    );
    setDetector(det);
  };

  useEffect(() => {
    setupCamera();
    createDetector();
  }, []);

  // ポーズ描画
  const drawPose = (keypoints, ctx) => {
    keypoints.forEach((kp) => {
      if (kp.score > 0.4) {
        ctx.beginPath();
        ctx.arc(kp.x, kp.y, keypointSize, 0, 2 * Math.PI);
        ctx.fillStyle = keypointColor;
        ctx.fill();
      }
    });

    const connections = [
      [5, 7],
      [7, 9],
      [6, 8],
      [8, 10],
      [5, 6],
      [11, 12],
      [5, 11],
      [6, 12],
    ];

    connections.forEach(([i, j]) => {
      const kp1 = keypoints[i];
      const kp2 = keypoints[j];
      if (kp1.score > 0.4 && kp2.score > 0.4) {
        ctx.beginPath();
        ctx.moveTo(kp1.x, kp1.y);
        ctx.lineTo(kp2.x, kp2.y);
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }
    });
  };

  // ポーズ検出ループ
  useEffect(() => {
    if (!detector || !isPlaying) return;
    let animationId;

    const detectPose = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        animationId = requestAnimationFrame(detectPose);
        return;
      }

      const poses = await detector.estimatePoses(videoRef.current);
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.drawImage(videoRef.current, 0, 0, 640, 480);

      if (poses && poses.length > 0) {
        drawPose(poses[0].keypoints, ctx);
      }

      animationId = requestAnimationFrame(detectPose);
    };

    detectPose();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [detector, isPlaying, keypointColor, lineColor, lineWidth, keypointSize]);

  // 再生・停止切替
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div>
      <button onClick={togglePlay}>
        {isPlaying ? "停止" : "開始"}
      </button>

      <div style={{ marginTop: 10 }}>
        <label>
          キーポイント色:
          <input
            type="color"
            value={keypointColor}
            onChange={(e) => setKeypointColor(e.target.value)}
          />
        </label>
        <label style={{ marginLeft: 10 }}>
          骨格色:
          <input
            type="color"
            value={lineColor}
            onChange={(e) => setLineColor(e.target.value)}
          />
        </label>
        <label style={{ marginLeft: 10 }}>
          線の太さ:
          <input
            type="number"
            value={lineWidth}
            min="1"
            max="10"
            onChange={(e) => setLineWidth(Number(e.target.value))}
          />
        </label>
        <label style={{ marginLeft: 10 }}>
          キーポイントサイズ:
          <input
            type="number"
            value={keypointSize}
            min="1"
            max="20"
            onChange={(e) => setKeypointSize(Number(e.target.value))}
          />
        </label>
      </div>

      <video
        ref={videoRef}
        width="640"
        height="480"
        style={{ display: "none" }}
      />
      <canvas ref={canvasRef} width="640" height="480" />
    </div>
  );
};

export default PoseDetection;
