import React from 'react';
import { Camera, CameraOff, Zap, ZapOff } from 'lucide-react';

const CameraCapture = ({ 
  videoRef, 
  canvasRef, 
  cameraReady, 
  error, 
  fingerPlacement,
  onRetryCamera,
  flashlightOn = false 
}) => {
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-center">
          <CameraOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Camera Access Required</h3>
          <p className="text-gray-600 mb-4">{error.userMessage}</p>
          {error.canRetry && (
            <button
              onClick={onRetryCamera}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-64 object-cover rounded-lg bg-black"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Finger placement guide overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className={`w-20 h-20 border-4 rounded-full mb-2 transition-all duration-300 ${
              fingerPlacement?.isFingerDetected 
                ? 'border-green-400 animate-pulse' 
                : 'border-white animate-pulse'
            }`} />
            <p className={`text-sm px-3 py-1 rounded-full transition-all duration-300 ${
              fingerPlacement?.isFingerDetected 
                ? 'text-green-900 bg-green-100 bg-opacity-90' 
                : 'text-white bg-black bg-opacity-60'
            }`}>
              {fingerPlacement?.message || 'Place finger here'}
            </p>
          </div>
        </div>
        
        {/* Status indicators */}
        <div className="absolute top-3 right-3 flex gap-2">
          {flashlightOn && (
            <div className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Flash On
            </div>
          )}
          {cameraReady && (
            <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
              <Camera className="w-3 h-3" />
              Ready
            </div>
          )}
        </div>

        {/* Signal quality indicator */}
        {fingerPlacement && (
          <div className="absolute bottom-3 left-3 right-3">
            <div className="bg-black bg-opacity-60 text-white px-3 py-2 rounded-lg text-sm">
              <div className="flex items-center justify-between mb-1">
                <span>Signal Quality</span>
                <span>{Math.round(fingerPlacement.quality)}%</span>
              </div>
              <div className="w-full bg-gray-300 rounded-full h-1">
                <div 
                  className={`h-1 rounded-full transition-all duration-300 ${
                    fingerPlacement.quality >= 70 ? 'bg-green-400' :
                    fingerPlacement.quality >= 40 ? 'bg-yellow-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${fingerPlacement.quality}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraCapture;