// pages/LiveMeasurement.jsx - Fixed Import Paths
import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Update these import paths to match your actual folder structure
import { usePPG } from '../../util/hooks/usePPG';
import CameraCapture from '../../components/authenticated/camera/CameraCapture';
import HeartRateDisplay from '../../components/authenticated/vitals/HeartRateDisplay';
import MeasurementInstructions from '../../components/authenticated/vitals/MeasurementInstructions';
import PPGSignalChart from '../../components/authenticated/charts/PPGSignalChart';
import MeasurementControls from '../../components/authenticated/vitals/MeasurementControls';

const LiveMeasurement = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [measurementResults, setMeasurementResults] = useState(null);

  // Add console log to check if hook is working
  console.log('🔍 LiveMeasurement component rendering...');

  const {
    videoRef,
    canvasRef,
    cameraReady,
    error,
    initializeCamera,
    isRecording,
    startMeasurement,
    stopMeasurement,
    resetMeasurement,
    redValues,
    signalQuality,
    fingerPlacement,
    currentHeartRate,
    confidence,
    getMeasurementResults
  } = usePPG();

  console.log('📊 PPG Hook State:', {
    cameraReady,
    isRecording,
    signalQuality,
    currentHeartRate,
    redValuesLength: redValues.length
  });

  // Initialize camera on component mount
  useEffect(() => {
    console.log('🎥 Initializing camera from LiveMeasurement...');
    initializeCamera();
  }, [initializeCamera]);

  // Update current step based on measurement state
  useEffect(() => {
    if (!cameraReady) {
      setCurrentStep(1);
    } else if (!fingerPlacement?.isFingerDetected) {
      setCurrentStep(2);
    } else if (isRecording) {
      setCurrentStep(3);
    } else if (measurementResults?.success) {
      setCurrentStep(4);
    }
  }, [cameraReady, fingerPlacement, isRecording, measurementResults]);

  const handleStartMeasurement = () => {
    console.log('🔴 START BUTTON CLICKED in LiveMeasurement!');
    console.log('Camera ready:', cameraReady);
    console.log('Signal quality:', signalQuality);
    
    if (startMeasurement()) {
      console.log('✅ Measurement started successfully');
      setMeasurementResults(null);
    } else {
      console.log('❌ Failed to start measurement');
    }
  };

  const handleStopMeasurement = () => {
    console.log('🛑 STOP BUTTON CLICKED');
    stopMeasurement();
    const results = getMeasurementResults();
    setMeasurementResults(results);
  };

  const handleRetakeMeasurement = () => {
    console.log('🔄 RETAKE BUTTON CLICKED');
    resetMeasurement();
    setMeasurementResults(null);
    setCurrentStep(2);
  };

  const handleSaveMeasurement = async (results) => {
    console.log('💾 SAVE BUTTON CLICKED', results);
    try {
      const measurementData = {
        heartRate: results.heartRate,
        confidence: results.confidence,
        signalQuality: results.signalQuality,
        measurementDuration: results.measurementDuration,
        timestamp: results.timestamp,
        ppgData: redValues.map((value, index) => ({
          redValue: value,
          timestamp: Date.now() + (index * 33)
        }))
      };

      console.log('📤 Sending measurement data:', measurementData);

      // For now, just log the data instead of making API call
      console.log('✅ Measurement would be saved:', measurementData);
      alert('Measurement saved successfully! (Demo mode)');
      
      // Reset for another measurement
      handleRetakeMeasurement();
      
    } catch (error) {
      console.error('💥 Save error:', error);
      throw error;
    }
  };

  console.log('🎨 Rendering LiveMeasurement with state:', {
    cameraReady,
    isRecording,
    currentStep,
    hasError: !!error
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Heart Rate Measurement</h1>
              <p className="text-sm text-gray-600">
                Place your finger over the camera and follow the instructions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Debug info */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-yellow-800 mb-2">🔧 Debug Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div>Camera Ready: <span className={cameraReady ? 'text-green-600' : 'text-red-600'}>{cameraReady ? 'Yes' : 'No'}</span></div>
            <div>Recording: <span className={isRecording ? 'text-green-600' : 'text-gray-600'}>{isRecording ? 'Yes' : 'No'}</span></div>
            <div>Signal Quality: {signalQuality}%</div>
            <div>Heart Rate: {currentHeartRate || '--'} BPM</div>
            <div>Red Values: {redValues.length}</div>
            <div>Confidence: {confidence}%</div>
            <div>Current Step: {currentStep}</div>
            <div>Has Error: {error ? 'Yes' : 'No'}</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column - Camera and controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Camera section */}
            <CameraCapture
              videoRef={videoRef}
              canvasRef={canvasRef}
              cameraReady={cameraReady}
              error={error}
              fingerPlacement={fingerPlacement}
              onRetryCamera={initializeCamera}
              flashlightOn={false}
            />

            {/* PPG Signal visualization */}
            <PPGSignalChart
              signalData={redValues}
              signalQuality={signalQuality}
              isRecording={isRecording}
            />

            {/* Measurement controls */}
            <MeasurementControls
              isRecording={isRecording}
              cameraReady={cameraReady}
              signalQuality={signalQuality}
              onStart={handleStartMeasurement}
              onStop={handleStopMeasurement}
              onRetake={handleRetakeMeasurement}
              onSave={handleSaveMeasurement}
              measurementResults={measurementResults}
              targetDuration={30}
            />
          </div>

          {/* Right column - Results and instructions */}
          <div className="space-y-6">
            {/* Heart rate display */}
            <HeartRateDisplay
              heartRate={currentHeartRate}
              confidence={confidence}
              signalQuality={signalQuality}
              isRecording={isRecording}
            />

            {/* Instructions */}
            <MeasurementInstructions
              currentStep={currentStep}
              fingerPlacement={fingerPlacement}
              isRecording={isRecording}
            />

            {/* Measurement summary (when complete) */}
            {measurementResults && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Measurement Summary</h3>
                
                {measurementResults.success ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Heart Rate:</span>
                      <span className="font-semibold">{measurementResults.heartRate} BPM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Confidence:</span>
                      <span className="font-semibold">{measurementResults.confidence}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Signal Quality:</span>
                      <span className="font-semibold">{measurementResults.signalQuality}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-semibold">{Math.round(measurementResults.measurementDuration)}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Peaks Detected:</span>
                      <span className="font-semibold">{measurementResults.peaksDetected}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-red-600">
                    <p>{measurementResults.error}</p>
                    <p className="text-sm mt-2">Please try measuring again with better finger placement.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMeasurement;