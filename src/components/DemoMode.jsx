import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCcw, Activity } from 'lucide-react';

const DemoMode = ({ onPoseResults, isActive }) => {
  const [demoData, setDemoData] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  // デモ用の模擬姿勢データ
  const generateMockPoseData = () => {
    const baseAngles = {
      leftElbow: 125 + (Math.random() - 0.5) * 20,
      rightElbow: 125 + (Math.random() - 0.5) * 20,
      leftKnee: 165 + (Math.random() - 0.5) * 15,
      rightKnee: 165 + (Math.random() - 0.5) * 15,
      leftShoulder: 100 + (Math.random() - 0.5) * 25,
      rightShoulder: 100 + (Math.random() - 0.5) * 25,
    };

    return {
      landmarks: Array(33).fill(null).map((_, i) => ({
        x: Math.random(),
        y: Math.random(),
        z: Math.random() * 0.1,
        visibility: 0.9
      })),
      jointAngles: baseAngles,
      timestamp: Date.now()
    };
  };

  useEffect(() => {
    let interval = null;
    
    if (isActive && isRunning) {
      interval = setInterval(() => {
        const mockData = generateMockPoseData();
        setDemoData(mockData);
        if (onPoseResults) {
          onPoseResults(mockData);
        }
      }, 100); // 10fps
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, isRunning, onPoseResults]);

  const handleStart = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setDemoData(null);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            デモモード
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center relative overflow-hidden">
              <div className="text-center">
                <Activity className={`h-16 w-16 mx-auto mb-4 ${isRunning ? 'animate-pulse text-blue-600' : 'text-gray-400'}`} />
                <p className="text-lg font-medium text-gray-700">
                  {isRunning ? '模擬姿勢データを生成中...' : 'デモモード待機中'}
                </p>
                {isRunning && (
                  <div className="mt-4 space-y-2">
                    <Badge variant="outline">
                      フレームレート: 10fps
                    </Badge>
                    <Badge variant="outline">
                      姿勢推定: アクティブ
                    </Badge>
                  </div>
                )}
              </div>
              
              {/* 装飾的な要素 */}
              <div className="absolute top-4 left-4 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div className="absolute top-4 right-4 w-3 h-3 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
              <div className="absolute bottom-4 left-4 w-3 h-3 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
              <div className="absolute bottom-4 right-4 w-3 h-3 bg-orange-500 rounded-full animate-pulse" style={{animationDelay: '1.5s'}}></div>
            </div>

            <div className="flex gap-2">
              {!isRunning ? (
                <Button onClick={handleStart} className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  デモ開始
                </Button>
              ) : (
                <Button onClick={handlePause} variant="outline" className="flex items-center gap-2">
                  <Pause className="h-4 w-4" />
                  一時停止
                </Button>
              )}
              
              <Button onClick={handleReset} variant="outline" className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                リセット
              </Button>
            </div>

            {demoData && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">現在の関節角度:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(demoData.jointAngles).map(([joint, angle]) => (
                    <div key={joint} className="flex justify-between">
                      <span>{joint}:</span>
                      <span className="font-mono">{angle.toFixed(1)}°</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DemoMode;

