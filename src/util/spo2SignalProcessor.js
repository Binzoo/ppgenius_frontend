export class SpO2SignalProcessor {
  constructor() {
    this.sampleRate = 30; 
    this.windowSize = 150; 
    this.calibrationData = {
      redDC: 0,
      infraredDC: 0,
      redAC: 0,
      infraredAC: 0
    };
    this.baselineValues = [];
    this.redLightCoefficient = 0.85; 
    this.infraredLightCoefficient = 0.45; 
  }


  extractDualChannelIntensity(imageData) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    let totalRed = 0;
    let totalGreen = 0;
    let totalBlue = 0;
    let pixelCount = 0;
    
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const sampleRadius = Math.floor(Math.min(width, height) / 3);
    
    for (let y = Math.max(0, centerY - sampleRadius); y < Math.min(height, centerY + sampleRadius); y++) {
      for (let x = Math.max(0, centerX - sampleRadius); x < Math.min(width, centerX + sampleRadius); x++) {
        const index = (y * width + x) * 4;
        if (index < data.length - 3) {
          totalRed += data[index];     
          totalGreen += data[index + 1];
          totalBlue += data[index + 2]; 
          pixelCount++;
        }
      }
    }
    
    if (pixelCount === 0) {
      return { red: 0, infrared: 0, ratio: 0 };
    }
    
    const avgRed = totalRed / pixelCount;
    const avgGreen = totalGreen / pixelCount;
    const avgBlue = totalBlue / pixelCount;
    
    const estimatedInfrared = (avgBlue * 0.7) + (avgGreen * 0.3);
    
    return {
      red: avgRed,
      infrared: estimatedInfrared,
      green: avgGreen,
      blue: avgBlue,
      ratio: avgRed / (estimatedInfrared + 1) 
    };
  }

  applySpO2Filter(signal) {
    if (signal.length < 5) return signal;
    
    const dcWindowSize = Math.min(30, Math.floor(signal.length / 3));
    const filtered = [];
    
    for (let i = 0; i < signal.length; i++) {
      let sum = 0;
      let count = 0;
      
      const start = Math.max(0, i - dcWindowSize);
      const end = Math.min(signal.length - 1, i + dcWindowSize);
      
      for (let j = start; j <= end; j++) {
        sum += signal[j];
        count++;
      }
      
      filtered.push(signal[i] - (sum / count));
    }
    
    const smoothed = [];
    const smoothWindow = 3;
    
    for (let i = 0; i < filtered.length; i++) {
      let sum = 0;
      let count = 0;
      
      for (let j = Math.max(0, i - smoothWindow); j <= Math.min(filtered.length - 1, i + smoothWindow); j++) {
        sum += filtered[j];
        count++;
      }
      
      smoothed.push(sum / count);
    }
    
    return smoothed;
  }

  calculateACDCComponents(redSignal, infraredSignal) {
    if (redSignal.length < 10 || infraredSignal.length < 10) {
      return null;
    }
    const redDC = redSignal.reduce((a, b) => a + b) / redSignal.length;
    const infraredDC = infraredSignal.reduce((a, b) => a + b) / infraredSignal.length;

    const redVariance = redSignal.reduce((a, b) => a + Math.pow(b - redDC, 2), 0) / redSignal.length;
    const infraredVariance = infraredSignal.reduce((a, b) => a + Math.pow(b - infraredDC, 2), 0) / infraredSignal.length;
    
    const redAC = Math.sqrt(redVariance);
    const infraredAC = Math.sqrt(infraredVariance);

    return {
      redDC,
      infraredDC,
      redAC,
      infraredAC
    };
  }

  calculateSpO2(acdc) {
    if (!acdc || acdc.redDC === 0 || acdc.infraredDC === 0 || 
        acdc.redAC === 0 || acdc.infraredAC === 0) {
      return null;
    }

   
    const redRatio = acdc.redAC / acdc.redDC;
    const infraredRatio = acdc.infraredAC / acdc.infraredDC;
    
    if (infraredRatio === 0) return null;
    
    const R = redRatio / infraredRatio;

    let spo2;
    
    if (R < 0.5) {
      spo2 = 100;
    } else if (R > 3.4) {
      spo2 = 70;
    } else {
      spo2 = 110 - (25 * R);
      const signalStrength = Math.min(acdc.redAC, acdc.infraredAC);
      if (signalStrength < 2) {
        spo2 = spo2 - 2; 
      }
    }
    return Math.max(70, Math.min(100, Math.round(spo2)));
  }

  assessSpO2SignalQuality(redSignal, infraredSignal) {
    if (redSignal.length < 10 || infraredSignal.length < 10) {
      return { quality: 0, message: 'Insufficient data' };
    }

    const acdc = this.calculateACDCComponents(redSignal, infraredSignal);
    if (!acdc) {
      return { quality: 0, message: 'Unable to calculate signal components' };
    }

    let quality = 0;
    let messages = [];

    // Check DC levels (adequate light transmission)
    if (acdc.redDC > 30 && acdc.redDC < 200) quality += 25;
    else messages.push('Adjust finger pressure');

    if (acdc.infraredDC > 20 && acdc.infraredDC < 180) quality += 25;
    else messages.push('Improve light contact');

    // Check AC components (pulsatile signal)
    if (acdc.redAC > 1 && acdc.redAC < 50) quality += 25;
    else messages.push('Weak pulsatile signal');

    if (acdc.infraredAC > 0.5 && acdc.infraredAC < 40) quality += 25;
    else messages.push('Inconsistent signal');

    // Check signal ratio
    const ratio = acdc.redDC / (acdc.infraredDC + 1);
    if (ratio > 0.8 && ratio < 1.5) quality += 0; // No additional points, just validation
    else messages.push('Calibration needed');

    const message = messages.length > 0 ? messages[0] : 'Good signal quality';

    return {
      quality: Math.min(100, quality),
      message,
      components: acdc
    };
  }

  processSpO2Measurement(redValues, infraredValues) {
    if (redValues.length < 60 || infraredValues.length < 60) {
      return {
        success: false,
        error: 'Insufficient data for SpO₂ calculation (need 60+ samples)',
        spo2: null,
        confidence: 0
      };
    }

    try {
      // Filter signals
      const filteredRed = this.applySpO2Filter(redValues);
      const filteredInfrared = this.applySpO2Filter(infraredValues);

      // Calculate AC/DC components
      const acdc = this.calculateACDCComponents(filteredRed, filteredInfrared);
      if (!acdc) {
        return {
          success: false,
          error: 'Unable to extract signal components',
          spo2: null,
          confidence: 0
        };
      }

      // Calculate SpO₂
      const spo2 = this.calculateSpO2(acdc);
      if (!spo2) {
        return {
          success: false,
          error: 'Unable to calculate SpO₂ from signal',
          spo2: null,
          confidence: 0
        };
      }

      // Assess signal quality
      const qualityAssessment = this.assessSpO2SignalQuality(filteredRed, filteredInfrared);

      // Calculate confidence based on signal quality and consistency
      const confidence = this.calculateSpO2Confidence(spo2, qualityAssessment.quality, acdc);

      return {
        success: true,
        spo2,
        confidence,
        signalQuality: qualityAssessment.quality,
        measurementDuration: redValues.length / this.sampleRate,
        timestamp: Date.now(),
        components: acdc,
        message: qualityAssessment.message
      };

    } catch (error) {
      console.error('SpO₂ processing error:', error);
      return {
        success: false,
        error: 'Processing error occurred',
        spo2: null,
        confidence: 0
      };
    }
  }

  /**
   * Calculate confidence score for SpO₂ measurement
   * @param {number} spo2 - Calculated SpO₂ value
   * @param {number} signalQuality - Signal quality score
   * @param {Object} acdc - AC/DC components
   * @returns {number} - Confidence score (0-100)
   */
  calculateSpO2Confidence(spo2, signalQuality, acdc) {
    let confidence = 0;

    // Signal quality factor (40% weight)
    confidence += signalQuality * 0.4;

    // SpO₂ value reasonableness (30% weight)
    if (spo2 >= 95 && spo2 <= 100) {
      confidence += 30; // Normal range
    } else if (spo2 >= 90 && spo2 < 95) {
      confidence += 25; // Slightly low but reasonable
    } else if (spo2 >= 85 && spo2 < 90) {
      confidence += 15; // Low but possible
    } else {
      confidence += 5; // Very low or high, less confident
    }

    // Signal strength factor (30% weight)
    const signalStrength = Math.min(acdc.redAC, acdc.infraredAC);
    if (signalStrength > 5) {
      confidence += 30;
    } else if (signalStrength > 2) {
      confidence += 20;
    } else if (signalStrength > 1) {
      confidence += 10;
    }

    return Math.min(100, Math.max(0, Math.round(confidence)));
  }

  /**
   * Get SpO₂ status and recommendations
   * @param {number} spo2 - SpO₂ value
   * @returns {Object} - Status information
   */
  getSpO2Status(spo2) {
    if (!spo2) {
      return {
        status: 'unknown',
        category: 'Unknown',
        color: 'gray',
        message: 'No SpO₂ data available',
        needsAttention: false
      };
    }

    if (spo2 >= 95) {
      return {
        status: 'normal',
        category: 'Normal',
        color: 'green',
        message: 'Oxygen saturation is within normal range.',
        needsAttention: false
      };
    }

    if (spo2 >= 90) {
      return {
        status: 'mild_low',
        category: 'Mildly Low',
        color: 'yellow',
        message: 'Slightly below normal. Monitor and consider consulting healthcare provider.',
        needsAttention: true
      };
    }

    if (spo2 >= 85) {
      return {
        status: 'low',
        category: 'Low',
        color: 'orange',
        message: 'Low oxygen saturation. Consider seeking medical attention.',
        needsAttention: true
      };
    }

    return {
      status: 'very_low',
      category: 'Very Low',
      color: 'red',
      message: 'Critically low oxygen saturation. Seek immediate medical attention.',
      needsAttention: true
    };
  }

  /**
   * Live SpO₂ analysis during measurement
   * @param {number[]} redValues - Current red channel values
   * @param {number[]} infraredValues - Current infrared channel values
   * @returns {Object} - Live analysis results
   */
  analyzeLiveSpO2(redValues, infraredValues) {
    if (redValues.length < 30 || infraredValues.length < 30) {
      return {
        spo2: null,
        quality: 0,
        message: 'Collecting data...',
        canCalculate: false
      };
    }

    // Use recent data for live calculation
    const recentRed = redValues.slice(-60); // Last 2 seconds
    const recentInfrared = infraredValues.slice(-60);

    const qualityAssessment = this.assessSpO2SignalQuality(recentRed, recentInfrared);
    
    if (qualityAssessment.quality < 30) {
      return {
        spo2: null,
        quality: qualityAssessment.quality,
        message: qualityAssessment.message,
        canCalculate: false
      };
    }

    // Try to calculate live SpO₂
    const acdc = this.calculateACDCComponents(recentRed, recentInfrared);
    if (acdc) {
      const spo2 = this.calculateSpO2(acdc);
      if (spo2) {
        return {
          spo2,
          quality: qualityAssessment.quality,
          message: 'Measuring SpO₂...',
          canCalculate: true
        };
      }
    }

    return {
      spo2: null,
      quality: qualityAssessment.quality,
      message: 'Optimizing signal...',
      canCalculate: false
    };
  }
}