import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Activity, Heart, Users, Monitor } from 'lucide-react';
import PoseDetection from './components/PoseDetection';
import DemoMode from './components/DemoMode';
import FeedbackPanel from './components/FeedbackPanel';
import SessionControl from './components/SessionControl';
import './App.css';

function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [currentPoseData, setCurrentPoseData] = useState(null);
  const [sessionData, setSessionData] = useState({
    poseHistory: [],
    averageAccuracy: 0,
    poseCount: 0,
    startTime: null,
    endTime: null
  });
  const [hasPermission, setHasPermission] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isCheckingCamera, setIsCheckingCamera] = useState(true);

  // カメラ権限をチェック
  useEffect(() => {
    const checkCameraPermission = async () => {
      try {
        setIsCheckingCamera(true);
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        setHasPermission(true);
      } catch (error) {
        console.error('Camera permission denied:', error);
        setHasPermission(false);
      } finally {
        setIsCheckingCamera(false);
      }
    };

    checkCameraPermission();
  }, []);

  // 姿勢データを受信したときの処理
  const handlePoseResults = (poseData) => {
    setCurrentPoseData(poseData);
    
    if (isSessionActive) {
      setSessionData(prev => {
        const newHistory = [...prev.poseHistory, poseData];
        const totalAccuracy = newHistory.reduce((sum, data) => {
          // 簡単な正確性計算（実際にはより複雑なロジックが必要）
          const angles = Object.values(data.jointAngles);
          const avgAngle = angles.reduce((a, b) => a + b, 0) / angles.length;
          return sum + Math.max(0, 100 - Math.abs(avgAngle - 120)); // 120度を理想とした簡単な計算
        }, 0);
        
        return {
          ...prev,
          poseHistory: newHistory,
          poseCount: newHistory.length,
          averageAccuracy: totalAccuracy / newHistory.length
        };
      });
    }
  };

  // セッション開始
  const handleSessionStart = () => {
    setIsSessionActive(true);
    setSessionData(prev => ({
      ...prev,
      startTime: Date.now(),
      endTime: null
    }));
  };

  // セッション一時停止
  const handleSessionPause = () => {
    setIsSessionActive(false);
  };

  // セッション停止
  const handleSessionStop = () => {
    setIsSessionActive(false);
    setSessionData(prev => ({
      ...prev,
      endTime: Date.now()
    }));
  };

  // セッションリセット
  const handleSessionReset = () => {
    setIsSessionActive(false);
    setSessionData({
      poseHistory: [],
      averageAccuracy: 0,
      poseCount: 0,
      startTime: null,
      endTime: null
    });
    setCurrentPoseData(null);
  };

  if (isCheckingCamera) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Camera className="h-12 w-12 mx-auto mb-4 text-gray-400 animate-pulse" />
            <CardTitle>システムを初期化中...</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600">
              カメラアクセスを確認しています...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasPermission && !isDemoMode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Camera className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <CardTitle>カメラアクセスが必要です</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              姿勢推定機能を使用するには、カメラへのアクセス許可が必要です。
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => window.location.reload()}
                className="w-full"
              >
                カメラアクセスを再試行
              </Button>
              <Button 
                onClick={() => setIsDemoMode(true)}
                variant="outline"
                className="w-full flex items-center gap-2"
              >
                <Monitor className="h-4 w-4" />
                デモモードで続行
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">
                遠隔リハビリテーション システム
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                AI姿勢推定
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                太極拳プログラム
              </Badge>
              {isDemoMode && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Monitor className="h-4 w-4" />
                  デモモード
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左側: 姿勢推定ビデオまたはデモモード */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {isDemoMode ? (
                    <>
                      <Monitor className="h-5 w-5" />
                      デモモード - 模擬姿勢推定
                    </>
                  ) : (
                    <>
                      <Camera className="h-5 w-5" />
                      リアルタイム姿勢推定
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isDemoMode ? (
                  <DemoMode 
                    onPoseResults={handlePoseResults}
                    isActive={isSessionActive}
                  />
                ) : (
                  <PoseDetection 
                    onPoseResults={handlePoseResults}
                    isActive={isSessionActive}
                  />
                )}
              </CardContent>
            </Card>

            {/* 手本動画エリア（将来の拡張用） */}
            <Card>
              <CardHeader>
                <CardTitle>太極拳手本動画</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  <iframe
                    width="100%"
                    height="100%"
                    src="https://www.youtube.com/embed/KAnsQuTyYiQ?autoplay=0&modestbranding=1&rel=0"
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右側: コントロールパネルとフィードバック */}
          <div className="space-y-6">
            {/* セッション制御 */}
            <SessionControl
              isActive={isSessionActive}
              onStart={handleSessionStart}
              onPause={handleSessionPause}
              onStop={handleSessionStop}
              onReset={handleSessionReset}
              sessionData={sessionData}
            />

            {/* フィードバックパネル */}
            <FeedbackPanel 
              poseData={currentPoseData}
              targetPose={null} // 将来的に目標姿勢を設定
            />
          </div>
        </div>

        {/* 下部: 統計情報 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">検出フレーム数</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {sessionData.poseCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Heart className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">平均正確性</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {sessionData.averageAccuracy.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">エクササイズ</p>
                  <p className="text-lg font-bold text-gray-900">24式太極拳</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                {isDemoMode ? (
                  <Monitor className="h-8 w-8 text-orange-600" />
                ) : (
                  <Camera className="h-8 w-8 text-orange-600" />
                )}
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">システム状態</p>
                  <p className="text-lg font-bold text-gray-900">
                    {isSessionActive ? '実行中' : '待機中'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default App;
