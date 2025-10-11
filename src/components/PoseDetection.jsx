// PoseDetection.jsx
import React, { useEffect, useRef } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl'; // 高速描画用（WebGL利用）

function PoseDetection({ source = 'camera', videoUrl, isActive }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);

  useEffect(() => {
    let animationFrameId;

    async function init() {
      // TensorFlow.jsのWebGLバックエンドをセット
      await poseDetection.util.initializeBackend('webgl');

      // MoveNet Lightning モデルをロード
      detectorRef.current = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        { modelType: 'Lightning' }
      );

      // 映像ソースの設定
      if (source === 'camera') {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      } else if (source === 'video' && videoUrl) {
        videoRef.current.src = videoUrl;
        videoRef.current.loop = true;
        await videoRef.current.play();
      }

      renderPrediction();
    }

    async function renderPrediction() {
      if (!isActive || !detectorRef.current) {
        animationFrameId = requestAnimationFrame(renderPrediction);
        return;
      }

      if (videoRef.current.readyState === 4) {
        const poses = await detectorRef.current.estimatePoses(videoRef.current);
        drawResults(poses);
      }

      animationFrameId = requestAnimationFrame(renderPrediction);
    }

    function drawResults(poses) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      poses.forEach((pose) => {
        pose.keypoints.forEach((kp) => {
          if (kp.score > 0.3) {
            ctx.beginPath();
            ctx.arc(kp.x, kp.y, 4, 0, 2 * Math.PI);
            ctx.fillStyle = 'red';
            ctx.fill();
          }
        });
      });
    }

    init();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (source === 'camera' && videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
      if (detectorRef.current) {
        detectorRef.current.dispose();
      }
    };
  }, [isActive, source, videoUrl]);

  return (
    <div className="relative w-full h-auto">
      <video
        ref={videoRef}
        className="rounded-lg w-full"
        autoPlay
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
      />
    </div>
  );
}

export default PoseDetection;
