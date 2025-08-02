import React, { useState, useRef, useEffect } from 'react';
import { Camera, Heart, Play, Square, RotateCcw } from 'lucide-react';

const FixedHeartRateMonitor = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  
  // Camera state
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState(null);
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  
  // PPG data
  const [redValues, setRedValues] = useState([]);
  const [frameCount, setFrameCount] = useState(0);
  
  // Results
  const [heartRate, setHeartRate] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [signalQuality, setSignalQuality] = useState(0);

  // Initialize camera
  const initializeCamera = async () => {
    try {
      console.log('🎥 Initializing camera...');
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          console.log('✅ Camera ready');
          setCameraReady(true);
        };
      }
    } catch (err) {
      setError(err);
      console.error('❌ Camera error:', err);
    }
  };

  // Process video frame - FIXED VERSION
  const processFrame = () => {
    if (!isRecording || !cameraReady || !videoRef.current || !canvasRef.current) {
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Set canvas size to match video
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data from canvas
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Extract red channel intensity from center region
      let totalRed = 0;
      let pixelCount = 0;
      
      const centerX = Math.floor(canvas.width / 2);
      const centerY = Math.floor(canvas.height / 2);
      const sampleRadius = Math.floor(Math.min(canvas.width, canvas.height) / 6);
      
      for (let y = centerY - sampleRadius; y < centerY + sampleRadius; y++) {
        for (let x = centerX - sampleRadius; x < centerX + sampleRadius; x++) {
          if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
            const index = (y * canvas.width + x) * 4;
            totalRed += data[index]; // Red channel
            pixelCount++;
          }
        }
      }
      
      const avgRed = pixelCount > 0 ? totalRed / pixelCount : 0;
      
      // Only collect data if we have reasonable signal (finger likely present)
      if (avgRed > 50) {
        setRedValues(prev => {
          const newValues = [...prev, avgRed];
          // Log progress
          if (newValues.length % 30 === 0) {
            console.log(`💗 PPG Data: ${avgRed.toFixed(2)}, Total Points: ${newValues.length}`);
          }
          return newValues;
        });
        setFrameCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('❌ Frame processing error:', error);
    }
  };

  // Enhanced signal processing functions
  const applyBandpassFilter = (signal) => {
    if (signal.length < 10) return signal;
    
    // Remove DC component (baseline removal)
    const mean = signal.reduce((a, b) => a + b) / signal.length;
    const dcRemoved = signal.map(value => value - mean);
    
    // Simple moving average for smoothing
    const filtered = [];
    const windowSize = 3;
    
    for (let i = 0; i < dcRemoved.length; i++) {
      let sum = 0;
      let count = 0;
      
      for (let j = Math.max(0, i - windowSize); j <= Math.min(dcRemoved.length - 1, i + windowSize); j++) {
        sum += dcRemoved[j];
        count++;
      }
      
      filtered.push(sum / count);
    }
    
    return filtered;
  };

  const findPeaks = (signal, threshold = 0.3) => {
    if (signal.length < 20) return [];
    
    const peaks = [];
    const maxValue = Math.max(...signal);
    const minValue = Math.min(...signal);
    const range = maxValue - minValue;
    
    if (range < 2) return []; // Not enough variation
    
    const adaptiveThreshold = minValue + (range * threshold);
    const minPeakDistance = 12; // Minimum 0.4s between peaks at 30fps (150 BPM max)
    
    for (let i = 3; i < signal.length - 3; i++) {
      // Check if current point is a local maximum
      if (signal[i] > signal[i - 1] && 
          signal[i] > signal[i + 1] &&
          signal[i] > signal[i - 2] && 
          signal[i] > signal[i + 2] &&
          signal[i] > signal[i - 3] && 
          signal[i] > signal[i + 3] &&
          signal[i] > adaptiveThreshold) {
        
        // Ensure minimum distance from last peak
        if (peaks.length === 0 || i - peaks[peaks.length - 1] >= minPeakDistance) {
          peaks.push(i);
        }
      }
    }
    
    console.log(`📍 Found ${peaks.length} peaks in ${signal.length} samples`);
    return peaks;
  };

  const calculateHeartRate = (peaks, sampleRate = 30) => {
    if (peaks.length < 3) {
      console.log('❌ Need at least 3 peaks, found:', peaks.length);
      return null;
    }
    
    // Calculate intervals between peaks
    const intervals = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i] - peaks[i - 1]);
    }
    
    // Filter out unrealistic intervals
    const validIntervals = intervals.filter(interval => {
      const bpm = (sampleRate * 60) / interval;
      return bpm >= 40 && bpm <= 200;
    });
    
    if (validIntervals.length === 0) {
      console.log('❌ No valid intervals found');
      return null;
    }
    
    // Calculate average interval and convert to BPM
    const avgInterval = validIntervals.reduce((a, b) => a + b) / validIntervals.length;
    const bpm = Math.round((sampleRate * 60) / avgInterval);
    
    console.log(`💗 Heart rate calculated: ${bpm} BPM from ${validIntervals.length} intervals`);
    return bpm;
  };

  const calculateConfidence = (peaks, signal) => {
    if (peaks.length < 3) return 0;
    
    // Calculate interval consistency
    const intervals = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i] - peaks[i - 1]);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
    const variance = intervals.reduce((a, b) => a + Math.pow(b - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / avgInterval; // Coefficient of variation
    
    // Lower variation = higher confidence
    const consistencyScore = Math.max(0, (1 - cv) * 100);
    
    // Signal amplitude factor
    const maxValue = Math.max(...signal);
    const minValue = Math.min(...signal);
    const amplitude = maxValue - minValue;
    const amplitudeScore = Math.min(100, amplitude * 2);
    
    // Peak count factor
    const peakCountScore = Math.min(100, (peaks.length / 10) * 100);
    
    const confidence = (consistencyScore * 0.5 + amplitudeScore * 0.3 + peakCountScore * 0.2);
    return Math.round(Math.max(0, Math.min(100, confidence)));
  };

  const assessSignalQuality = (signal) => {
    if (signal.length < 30) return 0;
    
    const mean = signal.reduce((a, b) => a + b) / signal.length;
    const variance = signal.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / signal.length;
    const stdDev = Math.sqrt(variance);
    
    const maxValue = Math.max(...signal);
    const minValue = Math.min(...signal);
    const amplitude = maxValue - minValue;
    
    let quality = 0;
    
    // Signal amplitude (should have variation for heartbeat)
    if (amplitude > 10) quality += 40;
    else if (amplitude > 5) quality += 20;
    else if (amplitude > 2) quality += 10;
    
    // Signal-to-noise ratio
    const snr = amplitude / (stdDev + 0.001);
    if (snr > 2) quality += 30;
    else if (snr > 1) quality += 15;
    
    // DC level (finger should create reasonable baseline)
    if (mean > 80 && mean < 180) quality += 20;
    else if (mean > 60 && mean < 200) quality += 10;
    
    // Consistency
    if (stdDev > 3 && stdDev < 25) quality += 10;
    
    return Math.min(100, quality);
  };

  // Process results after recording - FIXED VERSION
  const processResults = () => {
    console.log('🔬 Processing results...', {
      dataPoints: redValues.length,
      duration: redValues.length / 30
    });

    if (redValues.length < 90) { // Need at least 3 seconds of data
      console.log('❌ Insufficient data:', redValues.length, 'points');
      setHeartRate(null);
      setConfidence(0);
      setSignalQuality(20);
      return;
    }

    try {
      // Apply improved signal processing
      console.log('📊 Applying bandpass filter...');
      const filtered = applyBandpassFilter(redValues);
      
      // Assess signal quality
      const quality = assessSignalQuality(filtered);
      setSignalQuality(quality);
      console.log('📈 Signal quality:', quality);
      
      // Find peaks with improved algorithm
      console.log('🔍 Finding peaks...');
      const peaks = findPeaks(filtered, 0.3);
      
      if (peaks.length >= 3) {
        // Calculate heart rate
        const bpm = calculateHeartRate(peaks, 30);
        const conf = calculateConfidence(peaks, filtered);
        
        if (bpm && bpm >= 40 && bpm <= 200) {
          setHeartRate(bpm);
          setConfidence(conf);
          console.log('✅ Heart rate detected:', bpm, 'BPM, confidence:', conf, '%');
        } else {
          console.log('❌ Invalid heart rate calculated:', bpm);
          setHeartRate(null);
          setConfidence(0);
        }
      } else {
        console.log('❌ Insufficient peaks found:', peaks.length);
        setHeartRate(null);
        setConfidence(0);
      }
    } catch (error) {
      console.error('❌ Processing error:', error);
      setHeartRate(null);
      setConfidence(0);
      setSignalQuality(0);
    }
  };

  // Animation loop
  useEffect(() => {
    const animate = () => {
      processFrame();
      if (isRecording) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    if (isRecording) {
      console.log('🎬 Starting recording...');
      animationRef.current = requestAnimationFrame(animate);
    } else {
      console.log('⏹️ Stopping recording...');
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording]);

  // 30-second timer with auto-processing
  useEffect(() => {
    let intervalId;
    
    if (isRecording) {
      intervalId = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          
          if (newDuration >= 30) {
            console.log('⏰ 30 seconds completed! Processing results...');
            setIsRecording(false);
            setIsComplete(true);
            // Process results after a short delay to ensure all frames are captured
            setTimeout(() => {
              processResults();
            }, 500);
          }
          
          return newDuration;
        });
      }, 1000);
    }
    
    return () => clearInterval(intervalId);
  }, [isRecording, redValues]);

  // Control functions
  const startMeasurement = () => {
    console.log('🔴 Starting measurement...');
    setRedValues([]);
    setFrameCount(0);
    setDuration(0);
    setIsComplete(false);
    setHeartRate(null);
    setConfidence(0);
    setSignalQuality(0);
    setIsRecording(true);
  };

  const stopMeasurement = () => {
    console.log('🛑 Stopping measurement...');
    setIsRecording(false);
    setIsComplete(true);
    setTimeout(() => {
      processResults();
    }, 500);
  };

  const retakeMeasurement = () => {
    console.log('🔄 Retaking measurement...');
    setRedValues([]);
    setFrameCount(0);
    setDuration(0);
    setIsComplete(false);
    setHeartRate(null);
    setConfidence(0);
    setSignalQuality(0);
  };

  // Initialize camera on mount
  useEffect(() => {
    initializeCamera();
  }, []);

  const timeRemaining = Math.max(0, 30 - duration);
  const progress = Math.min((duration / 30) * 100, 100);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Camera Access Required</h2>
          <p className="text-gray-600 mb-4">Please allow camera access to measure heart rate.</p>
          <button
            onClick={initializeCamera}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Fixed Heart Rate Monitor</h1>
          <p className="text-gray-600">Place finger over camera and start 30-second measurement</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Camera and Controls */}
          <div className="space-y-6">
            {/* Camera */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-4">Camera Feed</h3>
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-64 object-cover rounded-lg bg-black"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className="w-20 h-20 border-4 border-white rounded-full animate-pulse mb-2" />
                    <p className="text-white text-sm bg-black bg-opacity-60 px-3 py-1 rounded-full">
                      Place finger here
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              {/* Timer Display */}
              {(isRecording || isComplete) && (
                <div className="text-center mb-6">
                  <div className="text-8xl font-bold font-mono mb-2">
                    {isRecording ? (
                      <span className="text-red-600">{String(timeRemaining).padStart(2, '0')}</span>
                    ) : (
                      <span className="text-green-600">✓</span>
                    )}
                  </div>
                  <div className="text-xl text-gray-600 mb-4">
                    {isRecording ? 'seconds remaining' : 'Analysis complete!'}
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                    <div 
                      className={`h-4 rounded-full transition-all duration-1000 ${
                        isComplete ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="text-sm text-gray-600">
                    {duration}s / 30s ({Math.round(progress)}%)
                  </div>
                </div>
              )}

              {/* Control Buttons */}
              <div className="space-y-3">
                {!isRecording && !isComplete && (
                  <button
                    onClick={startMeasurement}
                    disabled={!cameraReady}
                    className={`w-full py-4 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 text-lg ${
                      cameraReady
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Play className="w-6 h-6" />
                    Start 30-Second Measurement
                  </button>
                )}

                {isRecording && (
                  <button
                    onClick={stopMeasurement}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2"
                  >
                    <Square className="w-5 h-5" />
                    Stop Early
                  </button>
                )}

                {isComplete && (
                  <button
                    onClick={retakeMeasurement}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Measure Again
                  </button>
                )}
              </div>

              {/* Status */}
              <div className="mt-4 text-center text-sm">
                {!cameraReady && (
                  <div className="text-red-600">Camera not ready</div>
                )}
                {cameraReady && !isRecording && !isComplete && (
                  <div className="text-green-600">✅ Ready to measure</div>
                )}
                {isRecording && (
                  <div className="text-blue-600">📹 Recording... hold finger steady</div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Results */}
          <div className="space-y-6">
            {/* Heart Rate Display */}
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Heart className="w-6 h-6 text-red-600" />
                <h3 className="font-semibold text-gray-900">Heart Rate</h3>
              </div>
              
              <div className="text-8xl mb-4">❤️</div>
              
              <div className="mb-4">
                <div className={`text-5xl font-bold ${heartRate ? 'text-red-600' : 'text-gray-400'}`}>
                  {heartRate || '--'}
                </div>
                <div className="text-gray-600 text-lg">BPM</div>
              </div>

              {heartRate && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Confidence:</span>
                    <span className={confidence >= 70 ? 'text-green-600' : confidence >= 50 ? 'text-yellow-600' : 'text-red-600'}>
                      {confidence}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Signal Quality:</span>
                    <span className={signalQuality >= 70 ? 'text-green-600' : signalQuality >= 40 ? 'text-yellow-600' : 'text-red-600'}>
                      {signalQuality}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-4">
                    Normal Range: 60-100 BPM
                  </div>
                  
                  {/* Heart rate category */}
                  <div className="mt-3">
                    {heartRate < 60 && (
                      <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        Below Normal
                      </div>
                    )}
                    {heartRate >= 60 && heartRate <= 100 && (
                      <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                        Normal Range
                      </div>
                    )}
                    {heartRate > 100 && (
                      <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                        Above Normal
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {isComplete && !heartRate && (
                <div className="text-red-600 text-sm">
                  ❌ Unable to detect heart rate
                  <br />
                  <span className="text-xs">Try again with better finger placement</span>
                </div>
              )}
            </div>

            {/* Debug Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-4">Debug Information</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Camera: {cameraReady ? '✅' : '❌'}</div>
                <div>Recording: {isRecording ? '🔴' : '⏹️'}</div>
                <div>Duration: {duration}s</div>
                <div>Data Points: {redValues.length}</div>
                <div>Frame Count: {frameCount}</div>
                <div>Complete: {isComplete ? '✅' : '❌'}</div>
                <div>Heart Rate: {heartRate || 'None'}</div>
                <div>Confidence: {confidence}%</div>
                <div>Signal Quality: {signalQuality}%</div>
                <div>Avg Red: {redValues.length > 0 ? (redValues.reduce((a,b) => a+b) / redValues.length).toFixed(1) : '0'}</div>
              </div>
            </div>
            
            {/* Signal Visualization */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-4">Signal Visualization</h3>
              <div className="h-32 bg-gray-50 rounded border flex items-center justify-center">
                {redValues.length > 0 ? (
                  <div className="w-full h-full relative">
                    <svg className="w-full h-full">
                      <polyline
                        fill="none"
                        stroke={signalQuality >= 70 ? "#10b981" : signalQuality >= 40 ? "#f59e0b" : "#ef4444"}
                        strokeWidth="2"
                        points={redValues.map((value, index) => {
                          const x = (index / (redValues.length - 1)) * 100;
                          const normalizedValue = ((value - Math.min(...redValues)) / (Math.max(...redValues) - Math.min(...redValues))) * 80 + 10;
                          return `${x},${100 - normalizedValue}`;
                        }).join(' ')}
                      />
                    </svg>
                  </div>
                ) : (
                  <span className="text-gray-400">Waiting for signal data...</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FixedHeartRateMonitor;