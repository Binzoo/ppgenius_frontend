// components/vitals/HeartRateDisplay.jsx
import React, { useState, useEffect } from 'react';
import { Heart, Activity } from 'lucide-react';
import { getHeartRateCategory, formatHeartRate, formatConfidence } from '../../../util/healthCalculations';

const HeartRateDisplay = ({ 
  heartRate, 
  confidence, 
  signalQuality, 
  isRecording 
}) => {
  const [heartBeat, setHeartBeat] = useState(false);
  const [lastHeartRate, setLastHeartRate] = useState(null);

  useEffect(() => {
    if (heartRate && heartRate !== lastHeartRate && isRecording) {
      setHeartBeat(true);
      setLastHeartRate(heartRate);
      
      // Reset animation after beat duration
      const beatDuration = heartRate ? (60 / heartRate) * 1000 : 800;
      const timer = setTimeout(() => setHeartBeat(false), Math.min(beatDuration * 0.3, 300));
      
      return () => clearTimeout(timer);
    }
  }, [heartRate, lastHeartRate, isRecording]);

  const hrCategory = getHeartRateCategory(heartRate);

  const getStatusColor = (status) => {
    switch (status) {
      case 'normal': return 'text-green-600';
      case 'low': return 'text-blue-600';
      case 'high': return 'text-orange-600';
      case 'very_low':
      case 'very_high': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const getBackgroundColor = (status) => {
    switch (status) {
      case 'normal': return 'bg-green-50 border-green-200';
      case 'low': return 'bg-blue-50 border-blue-200';
      case 'high': return 'bg-orange-50 border-orange-200';
      case 'very_low':
      case 'very_high': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border-2 p-6 ${getBackgroundColor(hrCategory.status)}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Heart className={`w-5 h-5 ${getStatusColor(hrCategory.status)}`} />
          <h3 className="font-semibold text-gray-900">Heart Rate</h3>
        </div>
        {isRecording && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-600">Live</span>
          </div>
        )}
      </div>

      {/* Heart rate display */}
      <div className="text-center mb-6">
        <div className="flex flex-col items-center">
          <div className={`text-8xl transition-transform duration-200 ${
            heartBeat ? 'scale-110' : 'scale-100'
          }`}>
            ❤️
          </div>
          <div className="mt-4">
            <div className={`text-5xl font-bold ${getStatusColor(hrCategory.status)}`}>
              {formatHeartRate(heartRate)}
            </div>
            <div className="text-gray-600 text-lg">BPM</div>
          </div>
        </div>
      </div>

      {/* Heart rate category */}
      {heartRate && (
        <div className="text-center mb-4">
          <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
            hrCategory.color === 'green' ? 'bg-green-100 text-green-800' :
            hrCategory.color === 'blue' ? 'bg-blue-100 text-blue-800' :
            hrCategory.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
            hrCategory.color === 'red' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {hrCategory.category}
          </div>
          <p className="text-sm text-gray-600 mt-2">{hrCategory.message}</p>
        </div>
      )}

      {/* Confidence and quality metrics */}
      <div className="space-y-3">
        {/* Confidence */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Confidence</span>
            <span className="font-medium">{formatConfidence(confidence)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                confidence >= 80 ? 'bg-green-500' :
                confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${confidence || 0}%` }}
            />
          </div>
        </div>

        {/* Signal Quality */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Signal Quality</span>
            <span className="font-medium">{Math.round(signalQuality || 0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                signalQuality >= 70 ? 'bg-green-500' :
                signalQuality >= 40 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${signalQuality || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Normal range indicator */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-center text-sm text-gray-600">
          <span className="font-medium">Normal Range:</span> 60-100 BPM
        </div>
      </div>
    </div>
  );
};

export default HeartRateDisplay;