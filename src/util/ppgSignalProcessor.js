// utils/ppgSignalProcessor.js - Improved Version
export class PPGSignalProcessor {
  constructor() {
    this.sampleRate = 30; // 30 FPS
    this.windowSize = 150; // 5 seconds of data
    this.baselineValues = []; // For adaptive baseline
    this.lastRedValues = []; // For change detection
  }

  /**
   * Extract red channel intensity from image data with improved sampling
   * @param {ImageData} imageData - Canvas image data
   * @returns {number} - Average red channel intensity
   */
  extractRedChannelIntensity(imageData) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    let totalRed = 0;
    let pixelCount = 0;
    
    // Use full center region for better sampling
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const sampleRadius = Math.floor(Math.min(width, height) / 3); // Larger sampling area
    
    for (let y = Math.max(0, centerY - sampleRadius); y < Math.min(height, centerY + sampleRadius); y++) {
      for (let x = Math.max(0, centerX - sampleRadius); x < Math.min(width, centerX + sampleRadius); x++) {
        const index = (y * width + x) * 4;
        if (index < data.length - 3) {
          totalRed += data[index]; // Red channel
          pixelCount++;
        }
      }
    }
    
    return pixelCount > 0 ? totalRed / pixelCount : 0;
  }

  /**
   * Improved signal quality assessment
   * @param {number[]} signal - PPG signal
   * @returns {number} - Quality score (0-100)
   */
 assessSignalQuality(signal) {
  if (signal.length < 10) return 0;
  
  const mean = signal.reduce((a, b) => a + b) / signal.length;
  const variance = signal.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / signal.length;
  const stdDev = Math.sqrt(variance);
  
  const maxValue = Math.max(...signal);
  const minValue = Math.min(...signal);
  const amplitude = maxValue - minValue;
  
  const snr = amplitude / (stdDev + 0.001);
  
  let quality = 0;
  
  // 🆕 More lenient amplitude scoring
  if (amplitude > 3) quality += 35;        // Lowered from 5
  else if (amplitude > 1.5) quality += 25; // Lowered from 2
  else if (amplitude > 0.5) quality += 15; // New tier
  
  // 🆕 More lenient SNR scoring  
  if (snr > 2) quality += 30;              // Lowered from 3
  else if (snr > 1) quality += 20;         // Lowered from 1.5
  else if (snr > 0.3) quality += 10;       // Lowered from 0.5
  
  // 🆕 More lenient DC level
  if (mean > 40) quality += 25;            // Lowered from 50
  else if (mean > 20) quality += 15;       // Lowered from 30
  
  // 🆕 More lenient consistency
  if (stdDev > 1 && stdDev < 30) quality += 10; // Expanded range
  else if (stdDev > 0.5) quality += 5;
  
  return Math.min(100, Math.max(0, quality));
}

  /**
   * Check if signal contains heart rate frequencies
   * @param {number[]} signal - PPG signal
   * @returns {boolean} - Has heart rate pattern
   */
  checkHeartRateFrequency(signal) {
    if (signal.length < 60) return false; // Need at least 2 seconds
    
    const filtered = this.applyBandpassFilter(signal);
    const peaks = this.findPeaks(filtered, 0.3); // Lower threshold
    
    if (peaks.length < 2) return false;
    
    // Check if peak intervals are in heart rate range
    const intervals = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i] - peaks[i - 1]);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
    const bpm = (this.sampleRate * 60) / avgInterval;
    
    return bpm >= 40 && bpm <= 200;
  }

  /**
   * Improved bandpass filter with better frequency response
   * @param {number[]} signal - Raw PPG signal
   * @returns {number[]} - Filtered signal
   */
  applyBandpassFilter(signal) {
    if (signal.length < 5) return signal;
    
    // First, remove DC component with larger window
    const dcWindowSize = Math.min(30, Math.floor(signal.length / 3));
    const dcFiltered = [];
    
    for (let i = 0; i < signal.length; i++) {
      let sum = 0;
      let count = 0;
      
      const start = Math.max(0, i - dcWindowSize);
      const end = Math.min(signal.length - 1, i + dcWindowSize);
      
      for (let j = start; j <= end; j++) {
        sum += signal[j];
        count++;
      }
      
      dcFiltered.push(signal[i] - (sum / count));
    }
    
    // Apply simple moving average smoothing
    const smoothed = [];
    const smoothWindow = 3;
    
    for (let i = 0; i < dcFiltered.length; i++) {
      let sum = 0;
      let count = 0;
      
      for (let j = Math.max(0, i - smoothWindow); j <= Math.min(dcFiltered.length - 1, i + smoothWindow); j++) {
        sum += dcFiltered[j];
        count++;
      }
      
      smoothed.push(sum / count);
    }
    
    return smoothed;
  }

  calculateRRIntervals(peaks, sampleRate = this.sampleRate) {
    const rr = [];
    for (let i = 1; i < peaks.length; i++) {
      const Δsamples = peaks[i] - peaks[i - 1];
      rr.push((Δsamples / sampleRate) * 1000);   // → ms
    }
    return rr;
  }

 calculateHRV(rr) {
  console.log('📊 HRV input - RR intervals length:', rr.length); // Add this debug
  
  if (rr.length < 3) { // 🆕 Changed from 10 to 3
    console.log('❌ Not enough RR intervals for HRV:', rr.length);
    return null;
  }

  const mean = rr.reduce((a, b) => a + b, 0) / rr.length;
  const sdnn = Math.sqrt(
    rr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / rr.length
  );

  const diff = rr.slice(1).map((v, i) => Math.abs(v - rr[i]));
  const rmssd = Math.sqrt(
    diff.reduce((a, b) => a + b * b, 0) / diff.length
  );

  const pnn50 = (diff.filter((d) => d > 50).length / diff.length) * 100;

  console.log('✅ HRV calculated successfully:', { sdnn, rmssd, pnn50 }); // Add this debug

  return { sdnn, rmssd, pnn50 };
}

processCompleteMeasurement(redVals = [], timeStamps = []) {
    if (redVals.length < 60) {
      return { success: false, error: 'Not enough data for a valid reading' };
    }

    const filtered = this.applyBandpassFilter(redVals);
    const peaks = this.findPeaks(filtered, 0.4);
    const heartRate = this.calculateHeartRate(peaks);
    const quality = this.assessSignalQuality(redVals);
    const confidence = this.calculateConfidence(peaks, quality);

const rr = this.calculateRRIntervals(peaks);
console.log('📋 Final R-R intervals:', rr);

const hrv = this.calculateHRV(rr);
console.log('📋 Final HRV:', hrv);

const arr = this.detectArrhythmia(rr);
console.log('📋 Final arrhythmia:', arr);

    return {
 success: !!heartRate,
  heartRate,
  confidence,
  signalQuality: quality,
  measurementDuration: redVals.length / this.sampleRate,
  peaksDetected: peaks.length,
  timestamp: Date.now(),
  hrv,
  arrhythmia: arr
    };
  }

  findPeaks(signal, threshold = 0.3) { 
  if (signal.length < 10) return [];
  
  const peaks = [];
  const maxValue = Math.max(...signal);
  const minValue = Math.min(...signal);
  const range = maxValue - minValue;
  
  if (range < 0.5) return []; 
  
  const adaptiveThreshold = minValue + (range * threshold);
  const minPeakDistance = Math.floor(this.sampleRate * 0.3); 
  
  for (let i = 1; i < signal.length - 1; i++) { 
    if (signal[i] > signal[i - 1] && 
        signal[i] > signal[i + 1] &&
        signal[i] > adaptiveThreshold) {
      
      if (peaks.length === 0 || i - peaks[peaks.length - 1] >= minPeakDistance) {
        peaks.push(i);
      }
    }
  }
  
  return peaks;
}

  calculateConfidence(peaks, signalQuality) {
    if (peaks.length < 2) return 0;
    
    // Calculate interval consistency
    const intervals = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i] - peaks[i - 1]);
    }
    
    if (intervals.length === 0) return 0;
    
    const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
    
    // Calculate coefficient of variation
    const variance = intervals.reduce((a, b) => a + Math.pow(b - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / avgInterval;
    
    // Consistency score (lower variation = higher confidence)
    const consistencyScore = Math.max(0, (1 - cv) * 100);
    
    // Number of peaks factor
    const peakCountFactor = Math.min(100, (peaks.length / 5) * 100); // More peaks = higher confidence
    
    // Combine factors
    const confidence = (
      consistencyScore * 0.4 +
      signalQuality * 0.4 +
      peakCountFactor * 0.2
    );
    
    return Math.min(100, Math.max(0, Math.round(confidence)));
  }

  calculateHeartRate(peaks, sampleRate = 30) {
  if (peaks.length < 2) return null;
  
  const intervals = [];
  for (let i = 1; i < peaks.length; i++) {
    intervals.push(peaks[i] - peaks[i - 1]);
  }
  
  // 🆕 More lenient heart rate range
  const filteredIntervals = intervals.filter(interval => {
    const bpm = (sampleRate * 60) / interval;
    return bpm >= 35 && bpm <= 220; // 🆕 Expanded from 40-200
  });
  
  if (filteredIntervals.length === 0) return null;
  
  const avgInterval = filteredIntervals.reduce((a, b) => a + b) / filteredIntervals.length;
  const heartRate = (sampleRate * 60) / avgInterval;
  
  return Math.round(heartRate);
}

  calculateConfidence(peaks, signalQuality) {
    if (peaks.length < 2) {
      console.log('❌ Not enough peaks for confidence calculation');
      return 0;
    }
    
    // Calculate interval consistency
    const intervals = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i] - peaks[i - 1]);
    }
    
    if (intervals.length === 0) return 0;
    
    const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
    
    // Calculate coefficient of variation (lower = more consistent)
    const variance = intervals.reduce((a, b) => a + Math.pow(b - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / avgInterval;
    
    // Consistency score (lower variation = higher confidence)
    const consistencyScore = Math.max(0, (1 - cv) * 100);
    
    // Number of peaks factor (more peaks = higher confidence)
    const peakCountFactor = Math.min(100, (peaks.length / 10) * 100);
    
    // Combine factors
    const confidence = (
      consistencyScore * 0.4 +
      signalQuality * 0.4 +
      peakCountFactor * 0.2
    );
    
    console.log('🎯 Confidence calculation:', {
      consistencyScore: consistencyScore.toFixed(1),
      peakCountFactor: peakCountFactor.toFixed(1),
      signalQuality,
      finalConfidence: confidence.toFixed(1)
    });
    
    return Math.min(100, Math.max(0, Math.round(confidence)));
  }

  /**
   * Improved signal quality assessment
   * @param {number[]} signal - PPG signal
   * @returns {number} - Quality score (0-100)
   */
  assessSignalQuality(signal) {
    if (signal.length < 10) return 0;
    
    // Calculate various signal metrics
    const mean = signal.reduce((a, b) => a + b) / signal.length;
    const variance = signal.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / signal.length;
    const stdDev = Math.sqrt(variance);
    
    // Signal amplitude (peak-to-peak variation)
    const maxValue = Math.max(...signal);
    const minValue = Math.min(...signal);
    const amplitude = maxValue - minValue;
    
    // Signal-to-noise ratio
    const snr = amplitude / (stdDev + 0.001);
    
    // Quality scoring with multiple factors
    let quality = 0;
    
    // Factor 1: Signal amplitude (should have variation)
    if (amplitude > 5) quality += 30;
    else if (amplitude > 2) quality += 15;
    
    // Factor 2: SNR
    if (snr > 3) quality += 25;
    else if (snr > 1.5) quality += 15;
    else if (snr > 0.5) quality += 5;
    
    // Factor 3: DC level (reasonable baseline)
    if (mean > 50 && mean < 200) quality += 20;
    else if (mean > 30 && mean < 220) quality += 10;
    
    // Factor 4: Signal consistency
    if (stdDev > 2 && stdDev < 20) quality += 15;
    else if (stdDev > 1) quality += 5;
    
    // Factor 5: Frequency content check
    const hasHeartRatePattern = this.checkHeartRateFrequency(signal);
    if (hasHeartRatePattern) quality += 10;
    
    console.log('📊 Signal quality assessment:', {
      amplitude: amplitude.toFixed(2),
      snr: snr.toFixed(2),
      mean: mean.toFixed(2),
      stdDev: stdDev.toFixed(2),
      hasPattern: hasHeartRatePattern,
      quality: quality
    });
    
    return Math.min(100, Math.max(0, quality));
  }

  /**
   * Detect potential arrhythmias from R-R intervals
   * @param {number[]} rrIntervals - Array of R-R intervals in milliseconds
   * @returns {Object} - Arrhythmia detection results
   */
  detectArrhythmia(rrIntervals) {
  console.log('⚡ Arrhythmia input - RR intervals:', rrIntervals); // Add this debug
  
  if (rrIntervals.length < 2) { // 🆕 Changed from 5 to 2
    return {
      detected: false,
      type: 'insufficient_data',
      confidence: 0,
      message: 'Need more data for arrhythmia detection'
    };
  }

    const avgInterval = rrIntervals.reduce((a, b) => a + b) / rrIntervals.length;
    const variance = rrIntervals.reduce((a, b) => a + Math.pow(b - avgInterval, 2), 0) / rrIntervals.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / avgInterval; // Coefficient of variation

    // Convert average interval to heart rate
    const avgHeartRate = 60000 / avgInterval;

    // Atrial Fibrillation detection (high variability)
    if (cv > 0.3 && avgHeartRate > 90) {
      return {
        detected: true,
        type: 'possible_atrial_fibrillation',
        confidence: Math.min(95, cv * 100),
        message: 'Irregular heartbeat pattern detected. Consider consulting a healthcare provider.',
        severity: 'high'
      };
    }

    // Bradycardia
    if (avgHeartRate < 50) {
      return {
        detected: true,
        type: 'bradycardia',
        confidence: 90,
        message: 'Slow heart rate detected.',
        severity: 'medium'
      };
    }

    // Tachycardia
    if (avgHeartRate > 120) {
      return {
        detected: true,
        type: 'tachycardia',
        confidence: 90,
        message: 'Fast heart rate detected.',
        severity: 'medium'
      };
    }
  console.log('✅ Arrhythmia analysis complete'); // Add this debug

    // Normal rhythm
    return {
      detected: false,
      type: 'normal',
      confidence: 95,
      message: 'Normal heart rhythm detected.',
      severity: 'none'
    };
  }

  processCompleteMeasurement(redVals = [], timeStamps = []) {
    if (redVals.length < 45) {
      return { success: false, error: 'Not enough data for a valid reading' };
    }

    const filtered = this.applyBandpassFilter(redVals);
    const peaks = this.findPeaks(filtered, 0.4);
    const heartRate = this.calculateHeartRate(peaks);
    const quality = this.assessSignalQuality(redVals);
    const confidence = this.calculateConfidence(peaks, quality);

    // Add HRV and arrhythmia calculations
    const rr = this.calculateRRIntervals(peaks);
    const hrv = this.calculateHRV(rr);
    const arr = this.detectArrhythmia(rr); // 🆕 Now calling as class method

    return {
      success: !!heartRate,
      heartRate,
      confidence,
      signalQuality: quality,
      measurementDuration: redVals.length / this.sampleRate,
      peaksDetected: peaks.length,
      timestamp: Date.now(),
      hrv,
      arrhythmia: arr
    };
  }
}