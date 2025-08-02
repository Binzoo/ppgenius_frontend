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
    
    // DC component check (finger should create higher baseline)
    const dcLevel = mean;
    
    // Quality scoring with multiple factors
    let quality = 0;
    
    // Factor 1: Signal amplitude (should have variation)
    if (amplitude > 5) quality += 30;
    else if (amplitude > 2) quality += 15;
    
    // Factor 2: SNR
    if (snr > 3) quality += 25;
    else if (snr > 1.5) quality += 15;
    else if (snr > 0.5) quality += 5;
    
    // Factor 3: DC level (finger present creates higher baseline)
    if (dcLevel > 50) quality += 20;
    else if (dcLevel > 30) quality += 10;
    
    // Factor 4: Signal consistency
    if (stdDev > 2 && stdDev < 20) quality += 15;
    else if (stdDev > 1) quality += 5;
    
    // Factor 5: Frequency content (basic check for heart rate frequencies)
    const hasHeartRatePattern = this.checkHeartRateFrequency(signal);
    if (hasHeartRatePattern) quality += 10;
    
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

  /**
   * Improved peak detection with adaptive thresholding
   * @param {number[]} signal - Filtered PPG signal
   * @param {number} threshold - Base threshold (0-1)
   * @returns {number[]} - Array of peak indices
   */
  findPeaks(signal, threshold = 0.4) {
    if (signal.length < 10) return [];
    
    const peaks = [];
    const maxValue = Math.max(...signal);
    const minValue = Math.min(...signal);
    const range = maxValue - minValue;
    
    if (range < 1) return []; // Not enough variation
    
    // Adaptive threshold based on signal characteristics
    const adaptiveThreshold = minValue + (range * threshold);
    const minPeakDistance = Math.floor(this.sampleRate * 0.4); // Minimum 0.4s between peaks (150 BPM max)
    
    for (let i = 2; i < signal.length - 2; i++) {
      // Check if current point is a local maximum
      if (signal[i] > signal[i - 1] && 
          signal[i] > signal[i + 1] &&
          signal[i] > signal[i - 2] && 
          signal[i] > signal[i + 2] &&
          signal[i] > adaptiveThreshold) {
        
        // Ensure minimum distance from last peak
        if (peaks.length === 0 || i - peaks[peaks.length - 1] >= minPeakDistance) {
          peaks.push(i);
        }
      }
    }
    
    return peaks;
  }

  /**
   * Enhanced confidence calculation
   * @param {number[]} peaks - Array of peak indices
   * @param {number} signalQuality - Signal quality score
   * @returns {number} - Confidence score (0-100)
   */
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

  /**
   * Calculate heart rate from detected peaks
   * @param {number[]} peaks - Array of peak indices
   * @param {number} sampleRate - Sampling rate (FPS)
   * @returns {number|null} - Heart rate in BPM
   */
  calculateHeartRate(peaks, sampleRate = 30) {
    if (peaks.length < 2) {
      console.log('❌ Not enough peaks for heart rate calculation:', peaks.length);
      return null;
    }
    
    // Calculate intervals between peaks (in samples)
    const intervals = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i] - peaks[i - 1]);
    }
    
    console.log('📏 Peak intervals (samples):', intervals);
    
    // Remove outliers (intervals that are too short or too long)
    const filteredIntervals = intervals.filter(interval => {
      const bpm = (sampleRate * 60) / interval;
      return bpm >= 40 && bpm <= 200;
    });
    
    if (filteredIntervals.length === 0) {
      console.log('❌ No valid intervals after filtering');
      return null;
    }
    
    console.log('✅ Valid intervals:', filteredIntervals.length, 'out of', intervals.length);
    
    // Calculate average interval
    const avgInterval = filteredIntervals.reduce((a, b) => a + b) / filteredIntervals.length;
    
    // Convert to BPM
    const heartRate = (sampleRate * 60) / avgInterval;
    
    console.log('💗 Heart rate calculation: avgInterval =', avgInterval.toFixed(2), 'samples, BPM =', heartRate.toFixed(1));
    
    return Math.round(heartRate);
  }

  /**
   * Enhanced confidence calculation
   * @param {number[]} peaks - Array of peak indices
   * @param {number} signalQuality - Signal quality score
   * @returns {number} - Confidence score (0-100)
   */
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
}