import React, { useEffect, useRef } from 'react';

function PoseDetection({ source = 'camera', videoUrl, isActive }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!window.Pose) {
      console.error('MediaPipe Pose not loaded');
      return;
    }

    const pose = new window.Pose.Pose({
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

    const onResults = (results) => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

      if (results.poseLandmarks) {
        window.drawConnectors(ctx, results.poseLandmarks, window.Pose.POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 3 });
        window.drawLandmarks(ctx, results.poseLandmarks, { color: '#FF0000', lineWidth: 2 });
      }
    };

    pose.onResults(onResults);

    if (source === 'camera') {
      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (isActive) await pose.send({ image: videoRef.current });
        },
        width: 640,
        height: 480,
      });
      camera.start();
    } else if (source === 'video' && videoUrl) {
      const video = videoRef.current;
      video.src = videoUrl;
      video.loop = true;
      video.onloadeddata = async () => {
        video.play();
        const sendFrame = async () => {
          if (!video.paused && !video.ended) {
            await pose.send({ image: video });
            requestAnimationFrame(sendFrame);
          }
        };
        sendFrame();
      };
    }

    return () => {
      if (source === 'camera' && videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isActive, source, videoUrl]);

  return (
    <div className="relative w-full h-auto">
      {source === 'camera' ? (
        <video ref={videoRef} className="rounded-lg w-full" autoPlay playsInline muted />
      ) : (
        <video ref={videoRef} className="rounded-lg w-full" controls />
      )}
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
