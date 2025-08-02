// components/vitals/MeasurementInstructions.jsx
import React from 'react';
import { Info, CheckCircle, Circle } from 'lucide-react';

const MeasurementInstructions = ({ 
  currentStep = 1, 
  fingerPlacement = null,
  isRecording = false 
}) => {
  const steps = [
    {
      id: 1,
      title: 'Position your finger',
      description: 'Place your index finger gently over the rear camera',
      active: currentStep === 1
    },
    {
      id: 2,
      title: 'Cover camera completely',
      description: 'Ensure your fingertip covers the entire camera lens',
      active: currentStep === 2
    },
    {
      id: 3,
      title: 'Hold steady',
      description: 'Keep your finger still for 30 seconds',
      active: currentStep === 3
    },
    {
      id: 4,
      title: 'Review results',
      description: 'Check your heart rate and save the measurement',
      active: currentStep === 4
    }
  ];

  const getStepStatus = (step) => {
    if (step.id < currentStep) return 'completed';
    if (step.id === currentStep) return 'active';
    return 'pending';
  };

  const getStepIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'active':
        return <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-white" />
        </div>;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Info className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-blue-900">Measurement Instructions</h3>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step) => {
          const status = getStepStatus(step);
          return (
            <div key={step.id} className="flex items-start gap-3">
              {getStepIcon(status)}
              <div className="flex-1">
                <h4 className={`font-medium ${
                  status === 'completed' ? 'text-green-700' :
                  status === 'active' ? 'text-blue-700' :
                  'text-gray-600'
                }`}>
                  {step.title}
                </h4>
                <p className={`text-sm ${
                  status === 'completed' ? 'text-green-600' :
                  status === 'active' ? 'text-blue-600' :
                  'text-gray-500'
                }`}>
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-time feedback */}
      {fingerPlacement && (
        <div className="mt-6 p-4 bg-white rounded-lg border">
          <h4 className="font-medium text-gray-900 mb-2">Real-time Feedback</h4>
          <div className={`text-sm ${
            fingerPlacement.isFingerDetected ? 'text-green-600' : 'text-yellow-600'
          }`}>
            {fingerPlacement.message}
          </div>
          
          {/* Placement quality indicator */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Placement Quality</span>
              <span>{Math.round(fingerPlacement.quality)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div 
                className={`h-1 rounded-full transition-all duration-300 ${
                  fingerPlacement.quality >= 70 ? 'bg-green-500' :
                  fingerPlacement.quality >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${fingerPlacement.quality}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tips section */}
      <div className="mt-6 p-4 bg-white rounded-lg border">
        <h4 className="font-medium text-gray-900 mb-3">💡 Tips for Best Results</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>Use gentle pressure - don't press too hard</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>Ensure good lighting or flashlight is on</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>Keep your hand and device steady</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>Breathe normally and stay relaxed</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>Avoid talking or moving during measurement</span>
          </li>
        </ul>
      </div>

      {/* Recording status */}
      {isRecording && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-red-700">
              Recording in progress... Hold steady
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeasurementInstructions;