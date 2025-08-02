// hooks/usePPG.js - Improved Version
import { useState, useRef, useCallback, useEffect } from 'react';
import { PPGSignalProcessor } from '../ppgSignalProcessor';
import { CameraManager } from '../camerManager';


export const usePPG = () => {
  // Initialize processors
  const ppgProcessor = useRef(new PPGSignalProcessor());
  const cameraManager = useRef(new CameraManager());
  
  // State management
  const [cameraReady, setCameraReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  
  // PPG signal data
  const [redValues, setRedValues] = useState([]);
  const [timestamps, setTimestamps] = useState([]);
  const [signalQuality, setSignalQuality] = useState(0);
  
  // Heart rate results
  const [currentHeartRate, setCurrentHeartRate] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [fingerPlacement, setFingerPlacement] = useState(null);
  
  // Animation and timing
  const animationRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const frameCount = useRef(0);

  const [hrv, setHrv]                 = useState(null);      // 🆕 HRV metrics
  const [arrhythmia, setArrhythmia]   = useState(null);      // 🆕 arrhythmia result

  /**
   * Initialize camera and setup
   */
  const initializeCamera = useCallback(async () => {
    try {
      setError(null);
      console.log('Initializing camera...');
      
      const stream = await cameraManager.current.initializeCamera();
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log('Camera ready, video dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
          setCameraReady(true);
        };
        
        // Enable flashlight after camera is ready
        setTimeout(async () => {
          const flashResult = await cameraManager.current.toggleFlashlight(true);
          console.log('Flashlight enabled:', flashResult);
        }, 1000);
      }
    } catch (err) {
      console.error('Camera initialization failed:', err);
      const errorInfo = cameraManager.current.handleCameraError(err);
      setError(errorInfo);
    }
  }, []);

  /**
   * Process single video frame for PPG signal (Fixed version)
   */
  const processFrame = useCallback(() => {
    frameCount.current++;
    
    if (!isRecording || !cameraReady || !videoRef.current || !canvasRef.current) {
      return;
    }

    try {
      // Simple frame capture like debug version
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
      
      // Simple red channel extraction (like debug version)
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
      
      const redIntensity = pixelCount > 0 ? totalRed / pixelCount : 0;

      // Simple finger detection - if red value is reasonable, assume finger is present
      const isFingerPresent = redIntensity > 50; // Much more lenient than before
      
      // Create simple placement feedback
      setFingerPlacement({
        isFingerDetected: isFingerPresent,
        quality: isFingerPresent ? Math.min(100, redIntensity / 2) : 0,
        message: isFingerPresent ? 'Finger detected - measuring...' : 'Place finger over camera',
        brightness: redIntensity
      });

      // Always collect data if we have reasonable signal
    if (redIntensity > 30) {
  const now = performance.now();
  
  setRedValues(prev => {
    const newValues = [...prev, redIntensity];
    if (newValues.length > ppgProcessor.current.windowSize) {
      newValues.shift();
    }
    
    // Log progress every 30 frames (1 second)
    if (frameCount.current % 30 === 0) {
  console.log(`💗 PPG data: ${redIntensity.toFixed(2)}, buffer: ${newValues.length}`);
      
      // 🆕 Force analysis every second during recording
      setTimeout(() => analyzeSignal(), 50);
    }
    
    return newValues;
  });
        
        setTimestamps(prev => {
          const newTimestamps = [...prev, now];
          if (newTimestamps.length > ppgProcessor.current.windowSize) {
            newTimestamps.shift();
          }
          return newTimestamps;
        });
      }
    } catch (error) {
      console.error('❌ Frame processing error:', error);
    }
  }, [isRecording, cameraReady]);

  /**
   * Analyze PPG signal and calculate heart rate with improved algorithms
   */
const analyzeSignal = useCallback(() => {
  console.log('🔬 ANALYZE SIGNAL START - redValues.length:', redValues.length);
  console.log('🔬 Current signal quality:', signalQuality);
  console.log('🔬 Is recording:', isRecording);
  
  if (redValues.length < 30) {
    console.log('❌ Not enough data points, returning early');
    setSignalQuality(0);
    setCurrentHeartRate(null);
    setConfidence(0);
    return;
  }
  
  try {
    console.log('🔬 About to call assessLiveSignalQuality...');
    const liveQuality = ppgProcessor.current.assessLiveSignalQuality(redValues);
    console.log('🔬 Live quality result:', liveQuality);
    
    setSignalQuality(liveQuality.quality);
    
    console.log('🔬 QUALITY CHECK:', {
      dataLength: redValues.length,
      qualityScore: liveQuality.quality,
      meetsDataThreshold: redValues.length >= 45,
      meetsQualityThreshold: liveQuality.quality > 20
    });
    
    // 🆕 Make conditions more lenient
    if (redValues.length >= 45 && liveQuality.quality > 20) {
      console.log('🔬 ENTERING PEAK DETECTION...');
      
      const filtered = ppgProcessor.current.applyBandpassFilter(redValues);
      const peaks = ppgProcessor.current.findPeaks(filtered, 0.3);
      
      console.log('🔬 PEAKS FOUND:', peaks.length, peaks);
      
      const heartRate = ppgProcessor.current.calculateHeartRate(peaks);
      const conf = ppgProcessor.current.calculateConfidence(peaks, liveQuality.quality);
      
      if (heartRate && heartRate >= 40 && heartRate <= 200) {
        console.log('✅ Live heart rate detected:', heartRate);
        setCurrentHeartRate(heartRate);
        setConfidence(conf);
      }

      if (peaks.length > 1) {
        console.log('🔬 CALCULATING LIVE HRV AND ARRHYTHMIA...');
        
        const rr = ppgProcessor.current.calculateRRIntervals(peaks);
        console.log('🫀 LIVE R-R intervals:', rr);
        
        const hrvResult = ppgProcessor.current.calculateHRV(rr);
        console.log('🫀 LIVE HRV calculated:', hrvResult);
        
        const arrhythmiaResult = ppgProcessor.current.detectArrhythmia(rr);
        console.log('⚡ LIVE Arrhythmia check:', arrhythmiaResult);
        
        setHrv(hrvResult);
        setArrhythmia(arrhythmiaResult);
      } else {
        console.log('❌ Not enough peaks for HRV/arrhythmia:', peaks.length);
      }
    } else {
      console.log('❌ Conditions not met for analysis');
    }
  } catch (error) {
    console.error('❌ Signal analysis error:', error);
  }
}, [redValues]);

  /**
   * Start PPG measurement
   */
  const startMeasurement = useCallback(() => {
    console.log('🚀 startMeasurement called');
    console.log('Camera ready state:', cameraReady);
    
    if (!cameraReady) {
      console.warn('❌ Camera not ready for measurement');
      return false;
    }
    
    console.log('✅ Starting PPG measurement...');
    
    // Reset all data
    setRedValues([]);
    setTimestamps([]);
    setCurrentHeartRate(null);
    setConfidence(0);
    setSignalQuality(0);
    setFingerPlacement(null);
    ppgProcessor.current = new PPGSignalProcessor();
    frameCount.current = 0;
    
    setIsRecording(true);
    console.log('📹 Recording state set to true');
    return true;
  }, [cameraReady]);

  /**
   * Stop PPG measurement
   */
  const stopMeasurement = useCallback(() => {
    console.log('Stopping PPG measurement...');
    setIsRecording(false);
  }, []);

  /**
   * Get complete measurement results
   */
  const getMeasurementResults = useCallback(() => {
    console.log('Getting measurement results...', {
      dataPoints: redValues.length,
      heartRate: currentHeartRate,
      confidence: confidence,
      signalQuality: signalQuality
    });
    
    return ppgProcessor.current.processCompleteMeasurement(redValues, timestamps);
  }, [redValues, timestamps, currentHeartRate, confidence, signalQuality]);

  /**
   * Reset measurement data
   */
  const resetMeasurement = useCallback(() => {
    console.log('Resetting measurement data...');
    setRedValues([]);
    setTimestamps([]);
    setCurrentHeartRate(null);
    setConfidence(0);
    setSignalQuality(0);
    setFingerPlacement(null);
    setIsRecording(false);
    frameCount.current = 0;
    ppgProcessor.current = new PPGSignalProcessor();

  }, []);

  /**
   * Cleanup resources
   */
  const cleanup = useCallback(() => {
    console.log('Cleaning up PPG resources...');
    
    // Stop animation frame
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    // Cleanup camera manager safely
    try {
      if (cameraManager.current && typeof cameraManager.current.cleanup === 'function') {
        cameraManager.current.cleanup();
      }
    } catch (error) {
      console.error('Error during camera cleanup:', error);
    }
    
    // Reset state
    setIsRecording(false);
    setCameraReady(false);
    setError(null);
    
    console.log('PPG cleanup complete');
  }, []);

  // Animation loop for frame processing with improved timing
  useEffect(() => {
    console.log('🎬 Animation effect triggered, isRecording:', isRecording);
    
    const animate = () => {
      processFrame();
      if (isRecording) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    if (isRecording) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isRecording, processFrame]);

useEffect(() => {
  if (isRecording && redValues.length > 30) {
    
    const timeoutId = setTimeout(() => {
      analyzeSignalWithData(redValues);
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }
}, [redValues, isRecording]);

  useEffect(() => {
    if (fingerPlacement) {
      console.log('Finger placement update:', {
        detected: fingerPlacement.isFingerDetected,
        quality: fingerPlacement.quality,
        message: fingerPlacement.message,
        brightness: fingerPlacement.brightness
      });
    }
  }, [fingerPlacement?.quality, fingerPlacement?.isFingerDetected]);

  // Log heart rate changes
  useEffect(() => {
    if (currentHeartRate) {
    }
  }, [currentHeartRate, confidence]);

  // 🆕 Create a new function that takes redValues as parameter
const analyzeSignalWithData = useCallback((currentRedValues) => {
  
  if (currentRedValues.length < 30) {
    setSignalQuality(0);
    setCurrentHeartRate(null);
    setConfidence(0);
    return;
  }
  
  try {
    const liveQuality = ppgProcessor.current.assessLiveSignalQuality(currentRedValues);
    
    setSignalQuality(liveQuality.quality);
    if (currentRedValues.length >= 45 && liveQuality.quality > 20) {
      
      const filtered = ppgProcessor.current.applyBandpassFilter(currentRedValues);
      const peaks = ppgProcessor.current.findPeaks(filtered, 0.3);
            
      const heartRate = ppgProcessor.current.calculateHeartRate(peaks);
      const conf = ppgProcessor.current.calculateConfidence(peaks, liveQuality.quality);
      
      if (heartRate && heartRate >= 40 && heartRate <= 200) {
        setCurrentHeartRate(heartRate);
        setConfidence(conf);
      }

      if (peaks.length > 1) {
        const rr = ppgProcessor.current.calculateRRIntervals(peaks);
        const hrvResult = ppgProcessor.current.calculateHRV(rr);
        const arrhythmiaResult = ppgProcessor.current.detectArrhythmia(rr);
        setHrv(hrvResult);
        setArrhythmia(arrhythmiaResult);
      }
    }
  } catch (error) {
    console.error('❌ Signal analysis error:', error);
  }
}, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    // Camera management
    videoRef,
    canvasRef,
    cameraReady,
    error,
    initializeCamera,
    
    // Measurement control
    isRecording,
    startMeasurement,
    stopMeasurement,
    resetMeasurement,
    
    // PPG data
    redValues,
    timestamps,
    signalQuality,
    fingerPlacement,
    
    // Results
    currentHeartRate,
    confidence,
    hrv,
    arrhythmia,
    getMeasurementResults,
    
    // Debug info
    frameCount: frameCount.current,
    
    // Utilities
    cleanup
  };
};