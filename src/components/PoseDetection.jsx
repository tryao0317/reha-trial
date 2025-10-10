import React, { useEffect, useRef } from 'react';

function PoseDetection({ source = 'camera', videoUrl, isActive }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    let detector;
    let animationFrameId;

    async function init() {
      if (!window.poseDetection || !window.tf) {
        console.error('TensorFlowまたはPoseDetectionが読み込まれていません');
        return;
      }

      // MoveNet Lightning モデルを使う
      detector = await window.poseDetection.createDetector(
        window.poseDetection.SupportedModels.MoveNet,
        { modelType: 'Lightning' }
      );

      if (source === 'camera') {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      } else if (source === 'video' && videoUrl) {
        videoRef.current.src = videoUrl;
        videoRef.current.loop = true;
        await videoRef.current.play();
      }

      // 毎フレーム解析
      async function renderPrediction() {
        if (isActive && videoRef.current.readyState === 4) {
          const poses = await detector.estimatePoses(videoRef.current);
          drawResults(poses);
        }
        animationFrameId = requestAnimationFrame(renderPrediction);
      }

      renderPrediction();
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
