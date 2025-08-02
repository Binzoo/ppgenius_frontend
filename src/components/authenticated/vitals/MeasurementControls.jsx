// components/vitals/MeasurementControls.jsx - 30-Second Timer Version
import React, { useState, useEffect } from 'react';
import { Play, Square, RotateCcw, Save, CheckCircle, Clock } from 'lucide-react';

const MeasurementControls = ({
  isRecording,
  cameraReady,
  signalQuality,
  onStart,
  onStop,
  onRetake,
  onSave,
  measurementResults,
  targetDuration = 30
}) => {
  const [duration, setDuration] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Handle automatic 30-second measurement timer
  useEffect(() => {
    let intervalId;
    
    if (isRecording) {
      console.log('⏰ Starting 30-second countdown timer...');
      setDuration(0); // Reset duration when starting
      
      intervalId = setInterval(() => {
        setDuration(prevDuration => {
          const newDuration = prevDuration + 1;
          const remaining = targetDuration - newDuration;
          
          // Log countdown every 5 seconds
          if (newDuration % 5 === 0 || remaining <= 5) {
            console.log(`⏱️ Countdown: ${remaining} seconds remaining (${newDuration}/${targetDuration})`);
          }
          
          // Auto-stop when we reach target duration
          if (newDuration >= targetDuration) {
            console.log('🎯 30 seconds completed! Auto-stopping measurement...');
            setIsComplete(true);
            // Don't call onStop here to avoid infinite loop
            return targetDuration; // Cap at target duration
          }
          
          return newDuration;
        });
      }, 1000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRecording, targetDuration]); // Removed onStop to avoid dependency loop

  // Handle auto-stop when duration reaches target
  useEffect(() => {
    if (duration >= targetDuration && isRecording) {
      console.log('⏹️ Auto-stopping measurement after 30 seconds...');
      onStop();
    }
  }, [duration, targetDuration, isRecording, onStop]);

  // Reset when starting new measurement
  const handleStart = () => {
    console.log('🔴 Starting fresh 30-second measurement...');
    setDuration(0);
    setIsComplete(false);
    onStart();
  };

  const handleStop = () => {
    console.log('🛑 Stopping measurement early...');
    setIsComplete(true);
    onStop();
  };

  const handleRetake = () => {
    console.log('🔄 Retaking measurement...');
    setDuration(0);
    setIsComplete(false);
    onRetake();
  };

  const handleSave = async () => {
    console.log('💾 Saving measurement results...');
    setIsSaving(true);
    try {
      await onSave(measurementResults);
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save measurement. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const canStart = cameraReady && !isRecording && !isComplete;
  const progress = Math.min((duration / targetDuration) * 100, 100);
  const timeRemaining = Math.max(0, targetDuration - duration);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* 30-Second Timer Display */}
      {(isRecording || isComplete) && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {isComplete ? '30-Second Measurement Complete!' : '30-Second Measurement in Progress'}
            </h3>
            {isComplete && <CheckCircle className="w-5 h-5 text-green-600" />}
          </div>
          
          {/* Large Countdown Timer Display */}
          <div className="text-center mb-4">
            {isRecording ? (
              // Show countdown during recording
              <>
                <div className="text-8xl font-bold text-red-600 mb-2 font-mono">
                  {String(timeRemaining).padStart(2, '0')}
                </div>
                <div className="text-xl text-gray-600">
                  seconds remaining
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Hold finger steady over camera
                </div>
              </>
            ) : isComplete ? (
              // Show completion
              <>
                <div className="text-8xl font-bold text-green-600 mb-2">
                  ✓
                </div>
                <div className="text-xl text-gray-600">
                  Analyzing {duration} seconds of data...
                </div>
              </>
            ) : null}
          </div>
          
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{duration}s / {targetDuration}s ({Math.round(progress)}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className={`h-4 rounded-full transition-all duration-1000 ${
                  isComplete ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Live feedback during measurement */}
          {isRecording && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm text-blue-800 text-center">
                {signalQuality >= 50 ? (
                  <span className="text-green-700">✅ Excellent signal - keep holding steady!</span>
                ) : signalQuality >= 30 ? (
                  <span className="text-yellow-700">⚠️ Good signal - maintain finger position</span>
                ) : (
                  <span className="text-red-700">📍 Place finger completely over camera</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Control buttons */}
      <div className="space-y-3">
        {/* Start Button */}
        {!isRecording && !isComplete && (
          <button
            onClick={handleStart}
            disabled={!canStart}
            className={`w-full py-4 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all text-lg ${
              canStart
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Play className="w-6 h-6" />
            Start 30-Second Heart Rate Measurement
          </button>
        )}

        {/* Stop Early Button */}
        {isRecording && (
          <button
            onClick={handleStop}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            <Square className="w-5 h-5" />
            Stop Early (Minimum 10s recommended)
          </button>
        )}

        {/* Retake and Save Buttons */}
        {isComplete && (
          <div className="flex gap-3">
            <button
              onClick={handleRetake}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Measure Again
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !measurementResults?.success}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                isSaving || !measurementResults?.success
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Results'}
            </button>
          </div>
        )}
      </div>

      {/* Status messages */}
      <div className="mt-4">
        {!cameraReady && (
          <div className="text-center text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            ❌ Camera not ready. Please allow camera access.
          </div>
        )}
        
        {cameraReady && !isRecording && !isComplete && (
          <div className="text-center text-sm text-green-600 bg-green-50 p-3 rounded-lg">
            ✅ Camera ready! Click "Start" to begin 30-second measurement.
          </div>
        )}
        
        {isComplete && measurementResults?.success && (
          <div className="text-center text-sm text-green-600 bg-green-50 p-3 rounded-lg">
            🎉 Heart rate detected: <strong>{measurementResults.heartRate} BPM</strong> 
            <br />Confidence: {measurementResults.confidence}% | Quality: {measurementResults.signalQuality}%
          </div>
        )}
        
        {isComplete && measurementResults && !measurementResults.success && (
          <div className="text-center text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            ❌ {measurementResults.error}
            <br />Try again with better finger placement and lighting.
          </div>
        )}
      </div>
    </div>
  );
};

export default MeasurementControls;