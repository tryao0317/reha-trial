import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Square, RotateCcw, Clock, Target } from 'lucide-react';

const SessionControl = ({ 
  isActive, 
  onStart, 
  onPause, 
  onStop, 
  onReset,
  sessionData,
  currentExercise = "24式太極拳 - 基礎段階"
}) => {
  const [sessionTime, setSessionTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval = null;
    
    if (isActive && isRunning) {
      interval = setInterval(() => {
        setSessionTime(prevTime => prevTime + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    
    return () => clearInterval(interval);
  }, [isActive, isRunning]);

  useEffect(() => {
    setIsRunning(isActive);
  }, [isActive]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsRunning(true);
    if (onStart) onStart();
  };

  const handlePause = () => {
    setIsRunning(false);
    if (onPause) onPause();
  };

  const handleStop = () => {
    setIsRunning(false);
    if (onStop) onStop();
  };

  const handleReset = () => {
    setSessionTime(0);
    setIsRunning(false);
    if (onReset) onReset();
  };

  const getSessionStatus = () => {
    if (isActive && isRunning) {
      return { text: '実行中', color: 'bg-green-600' };
    } else if (!isActive && sessionTime > 0) {
      return { text: '一時停止', color: 'bg-yellow-600' };
    } else {
      return { text: '待機中', color: 'bg-gray-600' };
    }
  };

  const status = getSessionStatus();

  return (
    <div className="space-y-4">
      {/* セッション情報 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              セッション情報
            </span>
            <Badge className={status.color}>
              {status.text}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">現在のエクササイズ</span>
              <span className="text-sm text-gray-600">{currentExercise}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-1">
                <Clock className="h-4 w-4" />
                セッション時間
              </span>
              <span className="text-lg font-mono font-bold text-blue-600">
                {formatTime(sessionTime)}
              </span>
            </div>

            {sessionData && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">平均正確性</span>
                  <Badge variant={sessionData.averageAccuracy >= 80 ? 'default' : 'secondary'}>
                    {sessionData.averageAccuracy?.toFixed(1) || 0}%
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">記録されたポーズ</span>
                  <span className="text-sm text-gray-600">
                    {sessionData.poseCount || 0} フレーム
                  </span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 制御ボタン */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>セッション制御</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {!isActive ? (
              <Button 
                onClick={handleStart}
                className="flex items-center gap-2"
                size="lg"
              >
                <Play className="h-4 w-4" />
                開始
              </Button>
            ) : (
              <Button 
                onClick={handlePause}
                variant="outline"
                className="flex items-center gap-2"
                size="lg"
              >
                <Pause className="h-4 w-4" />
                一時停止
              </Button>
            )}
            
            <Button 
              onClick={handleStop}
              variant="destructive"
              className="flex items-center gap-2"
              size="lg"
              disabled={sessionTime === 0}
            >
              <Square className="h-4 w-4" />
              停止
            </Button>
            
            <Button 
              onClick={handleReset}
              variant="outline"
              className="flex items-center gap-2 col-span-2"
              size="lg"
              disabled={sessionTime === 0 && !isActive}
            >
              <RotateCcw className="h-4 w-4" />
              リセット
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 目標設定 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>今日の目標</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">セッション時間</span>
              <span className="text-sm font-medium">20分</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((sessionTime / (20 * 60)) * 100, 100)}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">正確性目標</span>
              <span className="text-sm font-medium">80%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min(((sessionData?.averageAccuracy || 0) / 80) * 100, 100)}%` 
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionControl;

