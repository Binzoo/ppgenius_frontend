// utils/cameraManager.js - Improved Version
export class CameraManager {
  constructor() {
    this.stream = null;
    this.track = null;
    this.isFlashlightOn = false;
    this.lastBrightness = 0;
    this.calibrationValues = [];
  }

  /**
   * Initialize camera with optimal settings for PPG
   * @returns {Promise<MediaStream>} - Camera stream
   */
  async initializeCamera() {
    try {
      // Check if we're on desktop/laptop vs mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Try different constraint combinations for better compatibility
      const constraints = [
        // For mobile devices - try rear camera first
        ...(isMobile ? [{
          video: {
            facingMode: 'environment',
            width: { ideal: 640, min: 320 },
            height: { ideal: 480, min: 240 },
            frameRate: { ideal: 30, min: 15 }
          }
        }] : []),
        
        // For desktop/laptop - use default camera with high quality
        {
          video: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            frameRate: { ideal: 30, min: 15 }
          }
        },
        
        // Fallback for mobile - any camera
        ...(isMobile ? [{
          video: {
            facingMode: { ideal: 'environment', fallback: 'user' },
            frameRate: { ideal: 30 }
          }
        }] : []),
        
        // Basic constraints - any camera
        {
          video: {
            frameRate: { ideal: 30 }
          }
        },
        
        // Last resort
        {
          video: true
        }
      ];

      let stream = null;
      let lastError = null;

      for (const constraint of constraints) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraint);
          break;
        } catch (error) {
          lastError = error;
          console.warn('Camera constraint failed, trying next:', error);
        }
      }

      if (!stream) {
        throw lastError || new Error('Failed to access camera with any constraints');
      }

      this.stream = stream;
      this.track = stream.getVideoTracks()[0];
      
      // Log camera info
      const settings = this.track.getSettings();
      console.log('Camera initialized:', {
        width: settings.width,
        height: settings.height,
        frameRate: settings.frameRate,
        facingMode: settings.facingMode || 'default',
        deviceId: settings.deviceId
      });
      
      // Only try flashlight on mobile devices
      if (isMobile) {
        setTimeout(() => {
          this.toggleFlashlight(true).catch(err => {
            console.warn('Flashlight not available:', err);
          });
        }, 500);
      } else {
        console.log('Desktop/laptop detected - skipping flashlight activation');
      }
      
      return stream;
    } catch (error) {
      this.handleCameraError(error);
      throw error;
    }
  }

  /**
   * Enhanced finger placement assessment
   * @param {ImageData} imageData - Current frame data
   * @returns {Object} - Detailed placement assessment
   */
  assessFingerPlacement(imageData) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // Sample multiple regions for better analysis
    const regions = this.sampleMultipleRegions(data, width, height);
    
    // Calculate overall brightness and color distribution
    const overallStats = this.calculateImageStats(regions);
    
    // Detect finger presence and quality
    const fingerAnalysis = this.analyzeFingerPresence(overallStats);
    
    return {
      isFingerDetected: fingerAnalysis.detected,
      quality: fingerAnalysis.quality,
      message: fingerAnalysis.message,
      brightness: overallStats.brightness,
      redDominance: overallStats.redDominance,
      coverage: fingerAnalysis.coverage,
      stability: this.assessStability(overallStats.brightness),
      recommendations: this.generateRecommendations(fingerAnalysis, overallStats)
    };
  }

  /**
   * Sample multiple regions of the image for comprehensive analysis
   * @param {Uint8ClampedArray} data - Image pixel data
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @returns {Object} - Regional analysis
   */
  sampleMultipleRegions(data, width, height) {
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    
    const regions = {
      center: this.sampleRegion(data, width, height, centerX, centerY, Math.min(width, height) / 6),
      full: this.sampleRegion(data, width, height, centerX, centerY, Math.min(width, height) / 3),
      corners: []
    };
    
    // Sample corner regions to detect if finger covers entire camera
    const cornerSize = Math.min(width, height) / 10;
    regions.corners = [
      this.sampleRegion(data, width, height, cornerSize, cornerSize, cornerSize),
      this.sampleRegion(data, width, height, width - cornerSize, cornerSize, cornerSize),
      this.sampleRegion(data, width, height, cornerSize, height - cornerSize, cornerSize),
      this.sampleRegion(data, width, height, width - cornerSize, height - cornerSize, cornerSize)
    ];
    
    return regions;
  }

  /**
   * Sample a specific region of the image
   * @param {Uint8ClampedArray} data - Image pixel data
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @param {number} centerX - Region center X
   * @param {number} centerY - Region center Y
   * @param {number} radius - Region radius
   * @returns {Object} - Region statistics
   */
  sampleRegion(data, width, height, centerX, centerY, radius) {
    let redSum = 0, greenSum = 0, blueSum = 0;
    let pixelCount = 0;
    let minBrightness = 255, maxBrightness = 0;
    
    const startX = Math.max(0, Math.floor(centerX - radius));
    const endX = Math.min(width - 1, Math.floor(centerX + radius));
    const startY = Math.max(0, Math.floor(centerY - radius));
    const endY = Math.min(height - 1, Math.floor(centerY + radius));
    
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const index = (y * width + x) * 4;
        if (index < data.length - 3) {
          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];
          const brightness = (r + g + b) / 3;
          
          redSum += r;
          greenSum += g;
          blueSum += b;
          pixelCount++;
          
          minBrightness = Math.min(minBrightness, brightness);
          maxBrightness = Math.max(maxBrightness, brightness);
        }
      }
    }
    
    if (pixelCount === 0) {
      return { red: 0, green: 0, blue: 0, brightness: 0, contrast: 0 };
    }
    
    return {
      red: redSum / pixelCount,
      green: greenSum / pixelCount,
      blue: blueSum / pixelCount,
      brightness: (redSum + greenSum + blueSum) / (3 * pixelCount),
      contrast: maxBrightness - minBrightness,
      pixelCount
    };
  }

  /**
   * Calculate overall image statistics
   * @param {Object} regions - Regional analysis data
   * @returns {Object} - Overall statistics
   */
  calculateImageStats(regions) {
    const center = regions.center;
    const full = regions.full;
    
    const brightness = center.brightness;
    const redDominance = center.red / (center.green + center.blue + 1);
    
    // Calculate coverage by comparing center to corners
    const avgCornerBrightness = regions.corners.reduce((sum, corner) => sum + corner.brightness, 0) / regions.corners.length;
    const coverage = Math.min(100, (center.brightness / (avgCornerBrightness + 1)) * 10);
    
    return {
      brightness,
      redDominance,
      coverage,
      contrast: center.contrast,
      red: center.red,
      green: center.green,
      blue: center.blue
    };
  }

  /**
   * Analyze finger presence and quality (optimized for laptop cameras)
   * @param {Object} stats - Image statistics
   * @returns {Object} - Finger analysis results
   */
  analyzeFingerPresence(stats) {
    let detected = false;
    let quality = 0;
    let message = '';
    
    const { brightness, redDominance, coverage, contrast } = stats;
    
    // Laptop cameras typically have different characteristics
    const isLaptopCamera = !(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    
    // Adjust thresholds for laptop cameras
    const minBrightness = isLaptopCamera ? 15 : 20;
    const maxBrightness = isLaptopCamera ? 250 : 240;
    const minRedDominance = isLaptopCamera ? 1.05 : 1.1;
    const minCoverage = isLaptopCamera ? 20 : 30;
    const minContrast = isLaptopCamera ? 3 : 5;
    
    // Check basic finger presence indicators
    const hasSufficientBrightness = brightness > minBrightness;
    const hasRedDominance = redDominance > minRedDominance;
    const hasGoodCoverage = coverage > minCoverage;
    const hasContrast = contrast > minContrast;
    
    console.log('Finger analysis:', {
      brightness,
      redDominance,
      coverage,
      contrast,
      isLaptopCamera,
      hasSufficientBrightness,
      hasRedDominance,
      hasGoodCoverage,
      hasContrast
    });
    
    // Finger detection logic
    if (!hasSufficientBrightness) {
      message = isLaptopCamera 
        ? 'Too dark - improve room lighting or move closer to light source'
        : 'Too dark - turn on flashlight or improve lighting';
      quality = 0;
    } else if (brightness > maxBrightness) {
      message = 'Too bright - reduce pressure or lighting';
      quality = 20;
      detected = true;
    } else if (!hasRedDominance && brightness < 50) {
      message = 'Place finger directly over camera lens';
      quality = 10;
    } else if (brightness > minBrightness * 2) {
      // For laptop cameras, if we have decent brightness, we likely have finger presence
      detected = true;
      
      // Calculate quality based on multiple factors (more lenient for laptops)
      let qualityScore = 0;
      
      // Brightness factor (more lenient range for laptops)
      if (isLaptopCamera) {
        if (brightness >= 30 && brightness <= 220) qualityScore += 25;
        else if (brightness >= 20 && brightness <= 240) qualityScore += 15;
        else qualityScore += 5;
      } else {
        if (brightness >= 60 && brightness <= 200) qualityScore += 25;
        else if (brightness >= 40 && brightness <= 220) qualityScore += 15;
        else qualityScore += 5;
      }
      
      // Red dominance factor (more lenient for laptops)
      if (isLaptopCamera) {
        if (redDominance >= 1.1) qualityScore += 25;
        else if (redDominance >= 1.05) qualityScore += 15;
        else qualityScore += 5;
      } else {
        if (redDominance >= 1.3) qualityScore += 25;
        else if (redDominance >= 1.15) qualityScore += 15;
        else qualityScore += 5;
      }
      
      // Coverage factor (more lenient for laptops)
      if (isLaptopCamera) {
        if (coverage >= 30) qualityScore += 25;
        else if (coverage >= 15) qualityScore += 15;
        else qualityScore += 5;
      } else {
        if (coverage >= 60) qualityScore += 25;
        else if (coverage >= 40) qualityScore += 15;
        else qualityScore += 5;
      }
      
      // Contrast factor (more lenient for laptops)
      if (isLaptopCamera) {
        if (contrast >= 5) qualityScore += 25;
        else if (contrast >= 3) qualityScore += 15;
        else qualityScore += 5;
      } else {
        if (contrast >= 10) qualityScore += 25;
        else if (contrast >= 5) qualityScore += 15;
        else qualityScore += 5;
      }
      
      quality = Math.min(100, qualityScore);
      
      if (quality >= 70) {
        message = 'Excellent finger placement!';
      } else if (quality >= 50) {
        message = 'Good placement - hold steady';
      } else if (quality >= 30) {
        message = 'Fair placement - minor adjustments needed';
      } else {
        message = 'Finger detected - adjust position for better signal';
      }
    } else {
      message = isLaptopCamera 
        ? 'Place finger over camera - ensure good room lighting'
        : 'Cover camera completely with fingertip';
      quality = 15;
    }
    
    return { detected, quality, message, coverage };
  }

  /**
   * Assess signal stability over time
   * @param {number} currentBrightness - Current brightness value
   * @returns {number} - Stability score (0-100)
   */
  assessStability(currentBrightness) {
    // Keep track of recent brightness values
    if (this.calibrationValues.length >= 10) {
      this.calibrationValues.shift();
    }
    this.calibrationValues.push(currentBrightness);
    
    if (this.calibrationValues.length < 5) return 50; // Not enough data
    
    // Calculate stability based on variance
    const mean = this.calibrationValues.reduce((a, b) => a + b) / this.calibrationValues.length;
    const variance = this.calibrationValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / this.calibrationValues.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower variance = higher stability
    const stability = Math.max(0, 100 - (stdDev * 2));
    
    return Math.round(stability);
  }

  /**
   * Generate specific recommendations for improvement
   * @param {Object} fingerAnalysis - Finger analysis results
   * @param {Object} stats - Image statistics
   * @returns {Array} - List of recommendations
   */
  generateRecommendations(fingerAnalysis, stats) {
    const recommendations = [];
    
    if (!fingerAnalysis.detected) {
      recommendations.push('Place your finger directly over the camera lens');
    }
    
    if (stats.brightness < 30) {
      recommendations.push('Increase lighting or ensure flashlight is enabled');
    } else if (stats.brightness > 200) {
      recommendations.push('Reduce finger pressure or lighting intensity');
    }
    
    if (stats.redDominance < 1.2) {
      recommendations.push('Ensure finger fully covers the camera');
    }
    
    if (fingerAnalysis.coverage < 50) {
      recommendations.push('Cover the entire camera lens with your fingertip');
    }
    
    if (stats.contrast < 10) {
      recommendations.push('Adjust finger pressure for better blood flow detection');
    }
    
    return recommendations;
  }

  /**
   * Enhanced flashlight toggle with better error handling
   * @param {boolean} enabled - Flashlight state
   */
  async toggleFlashlight(enabled = true) {
    if (!this.track) {
      console.warn('Camera track not available for flashlight control');
      return false;
    }

    try {
      const capabilities = this.track.getCapabilities();
      
      if (capabilities && capabilities.torch) {
        await this.track.applyConstraints({
          advanced: [{ torch: enabled }]
        });
        this.isFlashlightOn = enabled;
        console.log(`Flashlight ${enabled ? 'enabled' : 'disabled'}`);
        return true;
      } else {
        console.warn('Torch capability not available on this device');
        
        // Try alternative approach for some devices
        try {
          const settings = this.track.getSettings();
          if (settings.torch !== undefined) {
            await this.track.applyConstraints({
              advanced: [{ torch: enabled }]
            });
            this.isFlashlightOn = enabled;
            return true;
          }
        } catch (altError) {
          console.warn('Alternative flashlight method failed:', altError);
        }
        
        return false;
      }
    } catch (error) {
      console.error('Failed to toggle flashlight:', error);
      return false;
    }
  }

  /**
   * Get enhanced camera status
   * @returns {Object} - Detailed camera status
   */
  getCameraStatus() {
    if (!this.track) {
      return {
        isReady: false,
        hasFlashlight: false,
        flashlightOn: false,
        error: 'Camera not initialized'
      };
    }

    const capabilities = this.track.getCapabilities();
    const settings = this.track.getSettings();

    return {
      isReady: this.track.readyState === 'live',
      hasFlashlight: !!(capabilities && capabilities.torch),
      flashlightOn: this.isFlashlightOn,
      resolution: {
        width: settings.width || 'unknown',
        height: settings.height || 'unknown'
      },
      frameRate: settings.frameRate || 'unknown',
      facingMode: settings.facingMode || 'unknown',
      deviceId: settings.deviceId || 'unknown'
    };
  }

  /**
   * Cleanup camera resources
   */
  cleanup() {
    console.log('Cleaning up camera resources...');
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        console.log('Stopping camera track:', track.kind);
        track.stop();
      });
      this.stream = null;
      this.track = null;
      this.isFlashlightOn = false;
    }
    
    // Clear calibration data
    this.calibrationValues = [];
    this.lastBrightness = 0;
    
    console.log('Camera cleanup complete');
  }

  /**
   * Handle camera errors with user-friendly messages
   * @param {Error} error - Camera error
   * @returns {Object} - Error information
   */
  handleCameraError(error) {
    const errorInfo = {
      name: error.name,
      message: error.message,
      userMessage: '',
      canRetry: true
    };

    switch (error.name) {
      case 'NotAllowedError':
        errorInfo.userMessage = 'Camera permission denied. Please allow camera access in your browser settings.';
        errorInfo.canRetry = true;
        break;
      case 'NotFoundError':
        errorInfo.userMessage = 'No camera found on this device.';
        errorInfo.canRetry = false;
        break;
      case 'NotReadableError':
        errorInfo.userMessage = 'Camera is currently being used by another application.';
        errorInfo.canRetry = true;
        break;
      case 'OverconstrainedError':
        errorInfo.userMessage = 'Camera settings not supported on this device.';
        errorInfo.canRetry = true;
        break;
      case 'SecurityError':
        errorInfo.userMessage = 'Camera access blocked by security settings.';
        errorInfo.canRetry = false;
        break;
      default:
        errorInfo.userMessage = 'Failed to access camera. Please check your device settings.';
        errorInfo.canRetry = true;
    }

    return errorInfo;
  }
}