import React, { useState, useRef, useEffect } from 'react';
import { Camera, Play, Square } from 'lucide-react';

const DebugPPGTest = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [debugInfo, setDebugInfo] = useState({});
  const animationRef = useRef(null);

  // Initialize camera
  const initCamera = async () => {
    try {
      console.log('🎥 Initializing camera...');
      
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
    } catch (error) {
      console.error('❌ Camera error:', error);
    }
  };

  // Process frame
  const processFrame = () => {
    if (!isRecording || !cameraReady || !videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw frame
    ctx.drawImage(video, 0, 0);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Calculate average red intensity
    const data = imageData.data;
    let totalRed = 0;
    let pixelCount = 0;
    
    // Sample center region
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const sampleRadius = Math.min(canvas.width, canvas.height) / 4;
    
    for (let y = centerY - sampleRadius; y < centerY + sampleRadius; y++) {
      for (let x = centerX - sampleRadius; x < centerX + sampleRadius; x++) {
        if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
          const index = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
          totalRed += data[index]; // Red channel
          pixelCount++;
        }
      }
    }
    
    const avgRed = pixelCount > 0 ? totalRed / pixelCount : 0;
    
    // Update debug info
    setFrameCount(prev => prev + 1);
    setDebugInfo({
      canvasSize: `${canvas.width}x${canvas.height}`,
      videoSize: `${video.videoWidth}x${video.videoHeight}`,
      avgRed: avgRed.toFixed(2),
      pixelCount,
      sampleRadius: sampleRadius.toFixed(1)
    });

    console.log(`Frame ${frameCount}: Red=${avgRed.toFixed(2)}, Pixels=${pixelCount}`);
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
      console.log('🎬 Starting animation loop');
      animationRef.current = requestAnimationFrame(animate);
    } else {
      console.log('⏹️ Stopping animation loop');
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording, frameCount]);

  // Initialize camera on mount
  useEffect(() => {
    initCamera();
  }, []);

  const startRecording = () => {
    console.log('🔴 START CLICKED');
    console.log('Camera ready:', cameraReady);
    console.log('Video element:', !!videoRef.current);
    console.log('Canvas element:', !!canvasRef.current);
    
    if (cameraReady) {
      setIsRecording(true);
      setFrameCount(0);
      console.log('✅ Recording started');
    } else {
      console.log('❌ Camera not ready');
    }
  };

  const stopRecording = () => {
    console.log('🛑 STOP CLICKED');
    setIsRecording(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">PPG Debug Test</h1>
        
        {/* Video and Canvas */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="font-semibold mb-2">Camera Feed</h3>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full border rounded"
              style={{ maxHeight: '300px' }}
            />
          </div>
          <div>
            <h3 className="font-semibold mb-2">Canvas Output</h3>
            <canvas
              ref={canvasRef}
              className="w-full border rounded bg-gray-100"
              style={{ maxHeight: '300px' }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-4 mb-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={!cameraReady}
              className={`flex items-center gap-2 px-4 py-2 rounded font-semibold ${
                cameraReady
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Play className="w-4 h-4" />
              Start Test
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-semibold"
            >
              <Square className="w-4 h-4" />
              Stop Test
            </button>
          )}
        </div>

        {/* Status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-gray-100 p-3 rounded">
            <div className="font-semibold">Camera Status</div>
            <div className={cameraReady ? 'text-green-600' : 'text-red-600'}>
              {cameraReady ? 'Ready' : 'Not Ready'}
            </div>
          </div>
          <div className="bg-gray-100 p-3 rounded">
            <div className="font-semibold">Recording</div>
            <div className={isRecording ? 'text-green-600' : 'text-gray-600'}>
              {isRecording ? 'Active' : 'Stopped'}
            </div>
          </div>
          <div className="bg-gray-100 p-3 rounded">
            <div className="font-semibold">Frame Count</div>
            <div>{frameCount}</div>
          </div>
          <div className="bg-gray-100 p-3 rounded">
            <div className="font-semibold">Red Intensity</div>
            <div>{debugInfo.avgRed || '0'}</div>
          </div>
        </div>

        {/* Debug Info */}
        {Object.keys(debugInfo).length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <h3 className="font-semibold mb-2">Debug Information</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Canvas Size: {debugInfo.canvasSize}</div>
              <div>Video Size: {debugInfo.videoSize}</div>
              <div>Average Red: {debugInfo.avgRed}</div>
              <div>Pixel Count: {debugInfo.pixelCount}</div>
              <div>Sample Radius: {debugInfo.sampleRadius}</div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 rounded">
          <h3 className="font-semibold text-blue-900 mb-2">Test Instructions</h3>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Wait for camera to be ready</li>
            <li>2. Click "Start Test" button</li>
            <li>3. Place finger over camera (MacBook: top of screen)</li>
            <li>4. Watch the red intensity value change</li>
            <li>5. Check console for detailed logs</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default DebugPPGTest;