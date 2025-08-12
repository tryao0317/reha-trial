import React, { useRef, useEffect, useState } from 'react';
import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { POSE_CONNECTIONS } from '@mediapipe/pose';

const PoseDetection = ({ onPoseResults, isActive }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [pose, setPose] = useState(null);
  const [camera, setCamera] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 関節角度を計算する関数
  const calculateAngle = (point1, point2, point3) => {
    if (!point1 || !point2 || !point3) return 0;
    
    const vector1 = {
      x: point1.x - point2.x,
      y: point1.y - point2.y,
      z: (point1.z || 0) - (point2.z || 0)
    };
    
    const vector2 = {
      x: point3.x - point2.x,
      y: point3.y - point2.y,
      z: (point3.z || 0) - (point2.z || 0)
    };
    
    const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y + vector1.z * vector2.z;
    const magnitude1 = Math.sqrt(vector1.x ** 2 + vector1.y ** 2 + vector1.z ** 2);
    const magnitude2 = Math.sqrt(vector2.x ** 2 + vector2.y ** 2 + vector2.z ** 2);
    
    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    
    const cosAngle = dotProduct / (magnitude1 * magnitude2);
    const angleRad = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
    const angleDeg = (angleRad * 180) / Math.PI;
    
    return angleDeg;
  };

  // 姿勢結果を処理する関数
  const onResults = (results) => {
    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext('2d');
    
    // キャンバスをクリア
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // 背景画像を描画
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    
    if (results.poseLandmarks) {
      // ポーズの接続線を描画
      drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
        color: '#00FF00',
        lineWidth: 4
      });
      
      // ランドマークを描画
      drawLandmarks(canvasCtx, results.poseLandmarks, {
        color: '#FF0000',
        lineWidth: 2
      });
      
      // 関節角度を計算
      const landmarks = results.poseLandmarks;
      const jointAngles = {
        leftElbow: calculateAngle(landmarks[11], landmarks[13], landmarks[15]), // 左肩-左肘-左手首
        rightElbow: calculateAngle(landmarks[12], landmarks[14], landmarks[16]), // 右肩-右肘-右手首
        leftKnee: calculateAngle(landmarks[23], landmarks[25], landmarks[27]), // 左腰-左膝-左足首
        rightKnee: calculateAngle(landmarks[24], landmarks[26], landmarks[28]), // 右腰-右膝-右足首
        leftShoulder: calculateAngle(landmarks[13], landmarks[11], landmarks[23]), // 左肘-左肩-左腰
        rightShoulder: calculateAngle(landmarks[14], landmarks[12], landmarks[24]), // 右肘-右肩-右腰
      };
      
      // 結果をコールバック関数に渡す
      if (onPoseResults) {
        onPoseResults({
          landmarks: results.poseLandmarks,
          jointAngles,
          timestamp: Date.now()
        });
      }
      
      // 関節角度をキャンバスに表示
      canvasCtx.fillStyle = '#FFFFFF';
      canvasCtx.font = '16px Arial';
      canvasCtx.fillText(`左肘: ${jointAngles.leftElbow.toFixed(1)}°`, 10, 30);
      canvasCtx.fillText(`右肘: ${jointAngles.rightElbow.toFixed(1)}°`, 10, 50);
      canvasCtx.fillText(`左膝: ${jointAngles.leftKnee.toFixed(1)}°`, 10, 70);
      canvasCtx.fillText(`右膝: ${jointAngles.rightKnee.toFixed(1)}°`, 10, 90);
    }
    
    canvasCtx.restore();
  };

  useEffect(() => {
    const initializePose = async () => {
      try {
        setIsLoading(true);
        
        // まずカメラアクセスを確認
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        
        // MediaPipe Poseを初期化（CDNから直接読み込み）
        const poseInstance = new Pose({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`;
          }
        });
        
        poseInstance.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
        
        poseInstance.onResults(onResults);
        setPose(poseInstance);
        
        // カメラを初期化
        if (videoRef.current) {
          const cameraInstance = new Camera(videoRef.current, {
            onFrame: async () => {
              if (isActive && poseInstance) {
                await poseInstance.send({ image: videoRef.current });
              }
            },
            width: 640,
            height: 480
          });
          
          setCamera(cameraInstance);
          await cameraInstance.start();
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Pose detection initialization error:', err);
        setError(`初期化エラー: ${err.message}`);
        setIsLoading(false);
      }
    };

    initializePose();

    // クリーンアップ
    return () => {
      if (camera) {
        camera.stop();
      }
    };
  }, []);

  useEffect(() => {
    // isActiveが変更されたときの処理
    if (camera) {
      if (isActive) {
        camera.start();
      } else {
        camera.stop();
      }
    }
  }, [isActive, camera]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center">
          <p className="text-red-600 mb-2">エラーが発生しました</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">姿勢推定システムを初期化中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <video
        ref={videoRef}
        className="hidden"
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className="w-full h-auto border rounded-lg shadow-lg"
        width={640}
        height={480}
      />
      {!isActive && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
          <p className="text-white text-lg">姿勢推定が一時停止中です</p>
        </div>
      )}
    </div>
  );
};

export default PoseDetection;

