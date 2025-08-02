// components/charts/PPGSignalChart.jsx
import React, { useRef, useEffect } from 'react';
import { Activity } from 'lucide-react';

const PPGSignalChart = ({ 
  signalData = [], 
  signalQuality = 0, 
  isRecording = false,
  className = '' 
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!signalData.length || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set up drawing context
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Choose color based on signal quality
    const getSignalColor = (quality) => {
      if (quality >= 70) return '#10b981'; // Green
      if (quality >= 40) return '#f59e0b'; // Yellow
      return '#ef4444'; // Red
    };

    ctx.strokeStyle = getSignalColor(signalQuality);

    // Normalize signal data to fit canvas
    const maxValue = Math.max(...signalData);
    const minValue = Math.min(...signalData);
    const range = maxValue - minValue || 1;

    // Draw signal line
    ctx.beginPath();
    signalData.forEach((value, index) => {
      const x = (index / (signalData.length - 1)) * width;
      const normalizedValue = (value - minValue) / range;
      const y = height - (normalizedValue * height * 0.8) - (height * 0.1); // Leave 10% padding

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw baseline
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Add grid lines for better readability
    ctx.strokeStyle = '#f3f4f6';
    ctx.lineWidth = 0.5;
    
    // Vertical grid lines
    for (let i = 1; i < 5; i++) {
      const x = (i / 5) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal grid lines
    for (let i = 1; i < 4; i++) {
      const y = (i / 4) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

  }, [signalData, signalQuality]);

  const getQualityStatus = (quality) => {
    if (quality >= 70) return { label: 'Excellent', color: 'text-green-600' };
    if (quality >= 40) return { label: 'Good', color: 'text-yellow-600' };
    return { label: 'Poor', color: 'text-red-600' };
  };

  const qualityStatus = getQualityStatus(signalQuality);

  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Live PPG Signal</h3>
        </div>
        <div className="flex items-center gap-2">
          {isRecording && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs text-gray-600">Recording</span>
            </div>
          )}
          <span className={`text-sm font-medium ${qualityStatus.color}`}>
            {qualityStatus.label}
          </span>
        </div>
      </div>

      {/* Signal chart */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width="600"
          height="120"
          className="w-full h-24 border rounded-lg bg-gray-50"
        />
        
        {/* No signal state */}
        {signalData.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Waiting for signal...</p>
            </div>
          </div>
        )}
      </div>

      {/* Signal statistics */}
      {signalData.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="text-gray-600">Data Points</div>
            <div className="font-semibold">{signalData.length}</div>
          </div>
          <div>
            <div className="text-gray-600">Duration</div>
            <div className="font-semibold">{Math.round(signalData.length / 30)}s</div>
          </div>
          <div>
            <div className="text-gray-600">Quality</div>
            <div className={`font-semibold ${qualityStatus.color}`}>
              {Math.round(signalQuality)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PPGSignalChart;