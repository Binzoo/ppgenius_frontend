import React, { useState, useRef, useEffect } from 'react';
import { Camera, Heart, Play, Square } from 'lucide-react';

const SimpleHeartRateTest = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  
  const [cameraReady, setCameraReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [redValues, setRedValues] = useState([]);
  const [heartRate, setHeartRate] = useState(null);
  const [analysisLog, setAnalysisLog] = useState([]);
  const [frameCount, setFrameCount] = useState(0);

  // Add log message
  const addLog = (message) => {
    setAnalysisLog(prev => [...prev.slice(-10), `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  // Initialize camera
  const initializeCamera = async () => {
    try {
      addLog('🎥 Initializing camera...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          addLog('✅ Camera ready');
          setCameraReady(true);
        };
      }
    } catch (err) {
      addLog('❌ Camera failed, trying front camera...');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            addLog('✅ Front camera ready');
            setCameraReady(true);
          };
        }
      } catch (err2) {
        addLog('❌ No camera available');
      }
    }
  };

  // Simple frame processing
  const processFrame = () => {
    if (!isRecording || !videoRef.current || !canvasRef.current) return;

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Get red values from center
      let totalRed = 0;
      let pixelCount = 0;
      
      const centerX = Math.floor(canvas.width / 2);
      const centerY = Math.floor(canvas.height / 2);
      const radius = 50;
      
      for (let y = centerY - radius; y < centerY + radius; y++) {
        for (let x = centerX - radius; x < centerX + radius; x++) {
          if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
            const index = (y * canvas.width + x) * 4;
            totalRed += data[index];
            pixelCount++;
          }
        }
      }
      
      const avgRed = totalRed / pixelCount;
      setFrameCount(prev => prev + 1);
      
      // Collect data
      if (avgRed > 100) { // Finger detected
        setRedValues(prev => {
          const newValues = [...prev, avgRed];
          
          // Log every 30 frames
          if (newValues.length % 30 === 0) {
            addLog(`📊 Collected ${newValues.length} samples, last value: ${avgRed.toFixed(1)}`);
          }
          
          // Try to calculate heart rate every 60 samples
          if (newValues.length >= 60 && newValues.length % 30 === 0) {
            const hr = calculateHeartRateSimple(newValues);
            if (hr) {
              setHeartRate(hr);
              addLog(`💗 Heart rate detected: ${hr} BPM`);
            } else {
              addLog(`⏳ Analyzing... ${newValues.length} samples collected`);
            }
          }
          
          return newValues.slice(-150); // Keep last 150
        });
      }
    } catch (error) {
      addLog(`❌ Frame error: ${error.message}`);
    }
  };

  // Very simple heart rate calculation
  const calculateHeartRateSimple = (signal) => {
    if (signal.length < 60) return null;
    
    addLog(`🔬 Analyzing ${signal.length} samples...`);
    
    // Remove average (DC component)
    const avg = signal.reduce((a, b) => a + b) / signal.length;
    const centered = signal.map(val => val - avg);
    
    addLog(`📈 Signal range: ${Math.min(...centered).toFixed(1)} to ${Math.max(...centered).toFixed(1)}`);
    
    // Find simple peaks
    const peaks = [];
    const threshold = Math.max(...centered) * 0.3;
    
    for (let i = 10; i < centered.length - 10; i++) {
      if (centered[i] > centered[i-1] && 
          centered[i] > centered[i+1] && 
          centered[i] > threshold) {
        
        // Minimum 15 samples between peaks (0.5 seconds at 30fps)
        if (peaks.length === 0 || i - peaks[peaks.length - 1] > 15) {
          peaks.push(i);
        }
      }
    }
    
    addLog(`📍 Found ${peaks.length} peaks with threshold ${threshold.toFixed(1)}`);
    
    if (peaks.length >= 3) {
      // Calculate intervals
      const intervals = [];
      for (let i = 1; i < peaks.length; i++) {
        intervals.push(peaks[i] - peaks[i - 1]);
      }
      
      const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
      const bpm = Math.round((30 * 60) / avgInterval); // 30fps
      
      addLog(`💓 Calculated: ${bpm} BPM (avg interval: ${avgInterval.toFixed(1)})`);
      
      if (bpm >= 40 && bpm <= 200) {
        return bpm;
      } else {
        addLog(`❌ Invalid heart rate: ${bpm}`);
      }
    }
    
    return null;
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
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording]);

  // Controls
  const startMeasurement = () => {
    addLog('🔴 Starting measurement...');
    setRedValues([]);
    setHeartRate(null);
    setFrameCount(0);
    setAnalysisLog([]);
    setIsRecording(true);
  };

  const stopMeasurement = () => {
    addLog('🛑 Stopping measurement...');
    setIsRecording(false);
    
    // Force final calculation
    setTimeout(() => {
      if (redValues.length >= 60) {
        addLog('🔍 Final analysis...');
        const finalHR = calculateHeartRateSimple(redValues);
        if (finalHR) {
          setHeartRate(finalHR);
          addLog(`✅ Final result: ${finalHR} BPM`);
        } else {
          addLog('❌ Could not detect heart rate');
        }
      } else {
        addLog(`❌ Not enough data: ${redValues.length} samples`);
      }
    }, 100);
  };

  const forceCalculation = () => {
    if (redValues.length >= 30) {
      addLog('⚡ Forcing calculation...');
      const hr = calculateHeartRateSimple(redValues);
      if (hr) {
        setHeartRate(hr);
      }
    } else {
      addLog(`❌ Need more data: ${redValues.length}/30 samples`);
    }
  };

  // Initialize on mount
  useEffect(() => {
    initializeCamera();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Simple Heart Rate Test</h1>
          <p className="text-gray-600">Debug version with detailed logging</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: Camera and Controls */}
          <div className="space-y-6">
            {/* Camera */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-4">Camera</h3>
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
                  <div className="w-20 h-20 border-4 border-white rounded-full animate-pulse" />
                </div>
                
                {isRecording && (
                  <div className="absolute top-3 left-3 bg-red-600 text-white px-2 py-1 rounded text-xs">
                    RECORDING
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-4">Controls</h3>
              
              <div className="space-y-3">
                {!isRecording ? (
                  <button
                    onClick={startMeasurement}
                    disabled={!cameraReady}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    Start Test
                  </button>
                ) : (
                  <button
                    onClick={stopMeasurement}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2"
                  >
                    <Square className="w-5 h-5" />
                    Stop & Analyze
                  </button>
                )}

                <button
                  onClick={forceCalculation}
                  disabled={redValues.length < 30}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold disabled:bg-gray-300"
                >
                  Force Calculate Now
                </button>
              </div>

              {/* Stats */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div>Camera: {cameraReady ? '✅' : '❌'}</div>
                <div>Recording: {isRecording ? '🔴' : '⏹️'}</div>
                <div>Data: {redValues.length}</div>
                <div>Frames: {frameCount}</div>
              </div>
            </div>
          </div>

          {/* Right: Results */}
          <div className="space-y-6">
            {/* Heart Rate */}
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <h3 className="font-semibold mb-4 flex items-center justify-center gap-2">
                <Heart className="w-5 h-5 text-red-600" />
                Heart Rate
              </h3>
              
              <div className="text-8xl mb-4">❤️</div>
              
              <div className="text-5xl font-bold text-red-600 mb-2">
                {heartRate || '--'}
              </div>
              <div className="text-gray-600">BPM</div>
              
              {heartRate && (
                <div className="mt-4 text-sm text-green-600">
                  ✅ Heart rate detected!
                </div>
              )}
            </div>

            {/* Live Analysis Log */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-4">Live Analysis Log</h3>
              <div className="h-64 overflow-y-auto bg-gray-50 p-3 rounded text-xs font-mono">
                {analysisLog.length === 0 ? (
                  <div className="text-gray-500">Start recording to see analysis...</div>
                ) : (
                  analysisLog.map((log, index) => (
                    <div key={index} className="mb-1">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Signal Visualization */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-4">Signal Data</h3>
              <div className="h-24 bg-gray-50 rounded border relative">
                {redValues.length > 0 ? (
                  <svg className="w-full h-full">
                    <polyline
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2"
                      points={redValues.slice(-60).map((value, index) => {
                        const x = (index / 59) * 100;
                        const normalizedValue = ((value - Math.min(...redValues.slice(-60))) / 
                          (Math.max(...redValues.slice(-60)) - Math.min(...redValues.slice(-60)) || 1)) * 60 + 20;
                        return `${x},${100 - normalizedValue}`;
                      }).join(' ')}
                    />
                  </svg>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No signal data
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Last 60 samples ({redValues.length} total)
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-3">🔍 Test Instructions</h3>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. <strong>Turn on flashlight</strong> (very important!)</li>
            <li>2. <strong>Click "Start Test"</strong></li>
            <li>3. <strong>Place finger over camera</strong> and hold steady</li>
            <li>4. <strong>Watch the analysis log</strong> for real-time feedback</li>
            <li>5. <strong>Wait 10-15 seconds</strong> or click "Force Calculate"</li>
            <li>6. <strong>Check console</strong> (F12) for detailed debugging</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default SimpleHeartRateTest;