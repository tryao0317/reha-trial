import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Activity } from 'lucide-react';

const FeedbackPanel = ({ poseData, targetPose }) => {
  const [feedback, setFeedback] = useState([]);
  const [accuracy, setAccuracy] = useState(0);
  const [status, setStatus] = useState('waiting'); // waiting, good, warning, error

  // 理想的な関節角度の範囲（太極拳の基本姿勢）
  const idealAngles = {
    leftElbow: { min: 110, max: 140, ideal: 125 },
    rightElbow: { min: 110, max: 140, ideal: 125 },
    leftKnee: { min: 150, max: 180, ideal: 165 },
    rightKnee: { min: 150, max: 180, ideal: 165 },
    leftShoulder: { min: 80, max: 120, ideal: 100 },
    rightShoulder: { min: 80, max: 120, ideal: 100 },
  };

  // 関節名の日本語マッピング
  const jointNames = {
    leftElbow: '左肘',
    rightElbow: '右肘',
    leftKnee: '左膝',
    rightKnee: '右膝',
    leftShoulder: '左肩',
    rightShoulder: '右肩',
  };

  // 姿勢を評価してフィードバックを生成
  const evaluatePose = (jointAngles) => {
    const newFeedback = [];
    let correctJoints = 0;
    const totalJoints = Object.keys(idealAngles).length;

    Object.entries(jointAngles).forEach(([joint, angle]) => {
      const ideal = idealAngles[joint];
      const jointName = jointNames[joint];
      
      if (!ideal || !jointName) return;

      if (angle >= ideal.min && angle <= ideal.max) {
        correctJoints++;
        newFeedback.push({
          type: 'success',
          message: `${jointName}の角度が適切です (${angle.toFixed(1)}°)`,
          joint
        });
      } else if (angle < ideal.min) {
        newFeedback.push({
          type: 'warning',
          message: `${jointName}をもう少し伸ばしてください (現在: ${angle.toFixed(1)}°, 目標: ${ideal.min}-${ideal.max}°)`,
          joint
        });
      } else {
        newFeedback.push({
          type: 'warning',
          message: `${jointName}をもう少し曲げてください (現在: ${angle.toFixed(1)}°, 目標: ${ideal.min}-${ideal.max}°)`,
          joint
        });
      }
    });

    const accuracyScore = (correctJoints / totalJoints) * 100;
    setAccuracy(accuracyScore);
    setFeedback(newFeedback);

    // ステータスを更新
    if (accuracyScore >= 80) {
      setStatus('good');
    } else if (accuracyScore >= 60) {
      setStatus('warning');
    } else {
      setStatus('error');
    }
  };

  useEffect(() => {
    if (poseData && poseData.jointAngles) {
      evaluatePose(poseData.jointAngles);
    } else {
      setStatus('waiting');
      setFeedback([]);
      setAccuracy(0);
    }
  }, [poseData]);

  const getStatusIcon = () => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'good':
        return '素晴らしい姿勢です！';
      case 'warning':
        return '姿勢を調整してください';
      case 'error':
        return '姿勢の改善が必要です';
      default:
        return '姿勢を検出中...';
    }
  };

  return (
    <div className="space-y-4">
      {/* 全体的なステータス */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {getStatusIcon()}
            姿勢評価
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className={`p-3 rounded-lg ${getStatusColor()}`}>
              <p className="font-medium">{getStatusMessage()}</p>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">正確性スコア</span>
              <Badge variant={accuracy >= 80 ? 'default' : accuracy >= 60 ? 'secondary' : 'destructive'}>
                {accuracy.toFixed(1)}%
              </Badge>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  accuracy >= 80 ? 'bg-green-600' : 
                  accuracy >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                }`}
                style={{ width: `${accuracy}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 詳細なフィードバック */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">詳細フィードバック</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {feedback.length > 0 ? (
              feedback.map((item, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg text-sm ${
                    item.type === 'success' 
                      ? 'bg-green-50 text-green-800 border border-green-200' 
                      : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {item.type === 'success' ? (
                      <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    )}
                    <p>{item.message}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>姿勢データを待機中...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 関節角度の詳細表示 */}
      {poseData && poseData.jointAngles && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">関節角度詳細</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {Object.entries(poseData.jointAngles).map(([joint, angle]) => {
                const jointName = jointNames[joint];
                const ideal = idealAngles[joint];
                
                if (!jointName || !ideal) return null;
                
                const isInRange = angle >= ideal.min && angle <= ideal.max;
                
                return (
                  <div key={joint} className="flex justify-between items-center p-2 rounded bg-gray-50">
                    <span className="font-medium">{jointName}</span>
                    <span className={`font-mono ${isInRange ? 'text-green-600' : 'text-red-600'}`}>
                      {angle.toFixed(1)}°
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FeedbackPanel;

