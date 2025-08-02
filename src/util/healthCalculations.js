
export const getHeartRateStatus = (heartRate) => {
  if (!heartRate) return 'unknown';
  if (heartRate < 60) return 'low'; 
  if (heartRate > 100) return 'high'; 
  return 'normal';
};

export const getHeartRateCategory = (heartRate) => {
  if (!heartRate) {
    return {
      status: 'unknown',
      category: 'Unknown',
      color: 'gray',
      message: 'No heart rate data available',
      needsAttention: false
    };
  }

  if (heartRate < 50) {
    return {
      status: 'very_low',
      category: 'Severe Bradycardia',
      color: 'red',
      message: 'Very low heart rate detected. Consider consulting a healthcare provider.',
      needsAttention: true
    };
  }

  if (heartRate < 60) {
    return {
      status: 'low',
      category: 'Bradycardia',
      color: 'blue',
      message: 'Below normal heart rate. May be normal for athletes.',
      needsAttention: false
    };
  }

  if (heartRate <= 100) {
    return {
      status: 'normal',
      category: 'Normal',
      color: 'green',
      message: 'Heart rate is within normal range.',
      needsAttention: false
    };
  }

  if (heartRate <= 120) {
    return {
      status: 'high',
      category: 'Mild Tachycardia',
      color: 'yellow',
      message: 'Elevated heart rate. May be due to activity or stress.',
      needsAttention: false
    };
  }

  return {
    status: 'very_high',
    category: 'Severe Tachycardia',
    color: 'red',
    message: 'Very high heart rate detected. Consider consulting a healthcare provider.',
    needsAttention: true
  };
};

export const calculateTargetHeartRateZones = (age) => {
  const maxHeartRate = 220 - age;
  
  return {
    maxHeartRate,
    restingZone: {
      min: Math.round(maxHeartRate * 0.5),
      max: Math.round(maxHeartRate * 0.6),
      name: 'Resting/Recovery'
    },
    fatBurnZone: {
      min: Math.round(maxHeartRate * 0.6),
      max: Math.round(maxHeartRate * 0.7),
      name: 'Fat Burn'
    },
    aerobicZone: {
      min: Math.round(maxHeartRate * 0.7),
      max: Math.round(maxHeartRate * 0.8),
      name: 'Aerobic'
    },
    anaerobicZone: {
      min: Math.round(maxHeartRate * 0.8),
      max: Math.round(maxHeartRate * 0.9),
      name: 'Anaerobic'
    },
    maxZone: {
      min: Math.round(maxHeartRate * 0.9),
      max: maxHeartRate,
      name: 'Maximum Effort'
    }
  };
};

export const validateMeasurement = (measurement) => {
  const validation = {
    isValid: true,
    warnings: [],
    errors: [],
    qualityScore: 100
  };

  // Check heart rate validity
  if (!measurement.heartRate) {
    validation.errors.push('No heart rate detected');
    validation.isValid = false;
  } else if (measurement.heartRate < 30 || measurement.heartRate > 250) {
    validation.errors.push('Heart rate outside measurable range');
    validation.isValid = false;
  }

  // Check signal quality
  if (measurement.signalQuality < 30) {
    validation.warnings.push('Low signal quality - results may be inaccurate');
    validation.qualityScore -= 30;
  }

  // Check confidence level
  if (measurement.confidence < 50) {
    validation.warnings.push('Low confidence measurement - consider retaking');
    validation.qualityScore -= 20;
  }

  // Check measurement duration
  if (measurement.measurementDuration < 15) {
    validation.warnings.push('Short measurement duration - longer measurements are more accurate');
    validation.qualityScore -= 15;
  }

  validation.qualityScore = Math.max(0, validation.qualityScore);

  return validation;
};

export const formatHeartRate = (heartRate) => {
  if (!heartRate) return '--';
  return Math.round(heartRate).toString();
};


export const formatConfidence = (confidence) => {
  if (confidence === null || confidence === undefined) return '0%';
  return `${Math.round(confidence)}%`;
};


export const calculateHealthScore = (measurements) => {
  let score = 100;
  let factors = 0;

  // Heart rate factor
  if (measurements.heartRate) {
    const hrCategory = getHeartRateCategory(measurements.heartRate);
    if (hrCategory.status === 'normal') {
      score += 0; // No penalty for normal
    } else if (hrCategory.status === 'low' || hrCategory.status === 'high') {
      score -= 10; // Minor penalty
    } else {
      score -= 25; // Major penalty for very high/low
    }
    factors++;
  }

  // Signal quality factor
  if (measurements.signalQuality) {
    score += (measurements.signalQuality - 50) / 2; // -25 to +25 points
    factors++;
  }

  // Confidence factor
  if (measurements.confidence) {
    score += (measurements.confidence - 50) / 5; // -10 to +10 points
    factors++;
  }

  // Ensure score is within 0-100 range
  return Math.max(0, Math.min(100, Math.round(score)));
};

/**
 * Generate health recommendations based on measurements
 * @param {Object} measurements - Measurement data
 * @returns {Array} - Array of recommendations
 */
export const generateHealthRecommendations = (measurements) => {
  const recommendations = [];

  if (!measurements.heartRate) {
    recommendations.push({
      type: 'measurement',
      priority: 'high',
      message: 'Unable to detect heart rate. Ensure finger is placed correctly over camera.'
    });
    return recommendations;
  }

  const hrCategory = getHeartRateCategory(measurements.heartRate);

  // Heart rate specific recommendations
  if (hrCategory.status === 'very_low') {
    recommendations.push({
      type: 'medical',
      priority: 'high',
      message: 'Very low heart rate detected. Consider consulting with a healthcare provider.'
    });
  } else if (hrCategory.status === 'very_high') {
    recommendations.push({
      type: 'medical',
      priority: 'high',
      message: 'Very high heart rate detected. Try to relax and consider medical consultation if persistent.'
    });
  } else if (hrCategory.status === 'high') {
    recommendations.push({
      type: 'lifestyle',
      priority: 'medium',
      message: 'Elevated heart rate. Consider relaxation techniques and avoid stimulants.'
    });
  }

  // Signal quality recommendations
  if (measurements.signalQuality < 50) {
    recommendations.push({
      type: 'measurement',
      priority: 'medium',
      message: 'Low signal quality detected. For better results, ensure good lighting and steady finger placement.'
    });
  }

  // Confidence recommendations
  if (measurements.confidence < 60) {
    recommendations.push({
      type: 'measurement',
      priority: 'medium',
      message: 'Low measurement confidence. Consider taking another measurement for more reliable results.'
    });
  }

  // General health recommendations
  if (hrCategory.status === 'normal' && measurements.confidence > 80) {
    recommendations.push({
      type: 'wellness',
      priority: 'low',
      message: 'Great measurement! Continue monitoring your heart health regularly.'
    });
  }

  return recommendations;
};

/**
 * Detect potential arrhythmias from R-R intervals
 * @param {number[]} rrIntervals - Array of R-R intervals in milliseconds
 * @returns {Object} - Arrhythmia detection results
 */
export const detectArrhythmia = (rrIntervals) => {
  if (rrIntervals.length < 5) {
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

  // Normal rhythm
  return {
    detected: false,
    type: 'normal',
    confidence: 95,
    message: 'Normal heart rhythm detected.',
    severity: 'none'
  };
};