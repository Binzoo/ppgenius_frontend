import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePPG } from "../../util/hooks/usePPG";
import CameraCapture from "../../components/authenticated/camera/CameraCapture";
import MeasurementInstructions from "../../components/authenticated/vitals/MeasurementInstructions";
import PPGSignalChart from "../../components/authenticated/charts/PPGSignalChart";
import MeasurementControls from "../../components/authenticated/vitals/MeasurementControls";

// 🆕 Create readable health summary for AI analysis
// 🆕 CORRECTED: Updated createReadableHealthSummary function with specific JSON format request
const createReadableHealthSummary = (measurementData) => {
  const {
    heartRate,
    confidence,
    signalQuality,
    measurementDuration,
    peaksDetected,
    hrv,
    arrhythmia,
    deviceInfo,
    measurementContext
  } = measurementData;

  // Create a specific prompt that requests the exact JSON structure your dashboard expects
  const summary = `
📋 HEART RATE MEASUREMENT ANALYSIS REQUEST

🫀 PRIMARY MEASUREMENTS:
- Heart Rate: ${heartRate} BPM
- Measurement Confidence: ${confidence}%
- Signal Quality: ${signalQuality}%
- Measurement Duration: ${Math.round(measurementDuration)} seconds
- Peaks Detected: ${peaksDetected}

💓 HEART RATE VARIABILITY (HRV):
${hrv ? `
- RMSSD: ${Math.round(hrv.rmssd)} ms (Root Mean Square of Successive Differences)
- SDNN: ${Math.round(hrv.sdnn)} ms (Standard Deviation of NN intervals)
- pNN50: ${Math.round(hrv.pnn50)}% (Percentage of successive RR intervals that differ by more than 50ms)
` : '- HRV data not available for this measurement'}

⚠️ ARRHYTHMIA ANALYSIS:
${arrhythmia ? `
- Arrhythmia Detected: ${arrhythmia.detected ? 'YES' : 'NO'}
- Rhythm Type: ${arrhythmia.type}
- Detection Confidence: ${arrhythmia.confidence}%
- Severity Level: ${arrhythmia.severity}
- Clinical Message: ${arrhythmia.message}
` : '- Arrhythmia analysis not available'}

📱 MEASUREMENT CONTEXT:
- Device Platform: ${deviceInfo.platform}
- Camera Type: ${measurementContext.cameraType}
- Data Points Collected: ${measurementContext.dataPoints}
- Sample Rate: ${measurementContext.sampleRate} FPS
- Average Signal Quality: ${measurementContext.signalQualityAverage}%

🤖 AI ANALYSIS REQUEST:
Please analyze this heart rate measurement data and provide your response in EXACTLY this JSON format:

\`\`\`json
{
  "heart_rate_assessment": {
    "is_65_bpm_normal": true,
    "factors_influencing_reading": [
      "physical fitness level",
      "stress levels", 
      "consumption of caffeine or medication",
      "time of day",
      "hydration status"
    ]
  },
  "hrv_interpretation": {
    "rmssd_analysis": "Detailed interpretation of RMSSD value and what it indicates about stress/recovery",
    "sdnn_analysis": "Detailed interpretation of SDNN value and cardiovascular health implications", 
    "pnn50_analysis": "Detailed interpretation of pNN50 value and autonomic function"
  },
  "arrhythmia_evaluation": {
    "comments": "Assessment of rhythm normality and any arrhythmia findings"
  },
  "measurement_quality": {
    "reliability": "Assessment of measurement reliability based on confidence and signal quality",
    "limitations": [
      "List of measurement limitations",
      "Factors affecting accuracy"
    ]
  },
  "health_recommendations": {
    "lifestyle_tips": [
      "Specific lifestyle recommendations",
      "Health maintenance advice"
    ],
    "follow_up_measurements": "When and how to take follow-up measurements",
    "red_flags": [
      "Warning signs that require medical attention"
    ]
  },
  "disclaimer": {
    "medical_diagnosis_warning": "This analysis is not a medical diagnosis",
    "consult_healthcare_advice": "Advice on when to consult healthcare providers"
  }
}
\`\`\`

IMPORTANT: 
1. Replace "is_65_bpm_normal" with "is_${heartRate}_bpm_normal" and set true/false based on whether ${heartRate} BPM is normal
2. Provide detailed analysis for each HRV metric based on the actual values
3. Assess arrhythmia status based on the provided data
4. Evaluate measurement quality using the ${confidence}% confidence and ${signalQuality}% signal quality
5. Give specific recommendations based on the actual measurement results
6. Respond ONLY with the JSON format above, no additional text

MEASUREMENT TIMESTAMP: ${deviceInfo.timestamp}
  `.trim();

  return summary;
};

const LiveMeasurement = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [measurementResults, setMeasurementResults] = useState(null);

  console.log("🔍 LiveMeasurement component rendering...");

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
    hrv,
    arrhythmia,
    getMeasurementResults,
  } = usePPG();

  console.log("📊 PPG Hook State:", {
    cameraReady,
    isRecording,
    signalQuality,
    currentHeartRate,
    redValuesLength: redValues.length,
  });

  // Initialize camera on component mount
  useEffect(() => {
    console.log("🎥 Initializing camera from LiveMeasurement...");
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
    console.log("🔴 START BUTTON CLICKED in LiveMeasurement!");
    console.log("Camera ready:", cameraReady);
    console.log("Signal quality:", signalQuality);

    if (startMeasurement()) {
      console.log("✅ Measurement started successfully");
      setMeasurementResults(null);
    } else {
      console.log("❌ Failed to start measurement");
    }
  };

  const handleStopMeasurement = () => {
    console.log("🛑 STOP BUTTON CLICKED");
    stopMeasurement();
    const results = getMeasurementResults();
    setMeasurementResults(results);
  };

  const handleRetakeMeasurement = () => {
    console.log("🔄 RETAKE BUTTON CLICKED");
    resetMeasurement();
    setMeasurementResults(null);
    setCurrentStep(2);
  };

  // 🆕 FINAL WORKING VERSION: Save measurement with OpenAI API
  const handleSaveMeasurement = async (results) => {
    console.log("💾 Starting OpenAI API save process...", results);
    
    try {
      // Prepare the comprehensive measurement data
      const measurementData = {
        // Basic measurement info
        heartRate: results.heartRate,
        confidence: results.confidence,
        signalQuality: results.signalQuality,
        measurementDuration: results.measurementDuration,
        timestamp: results.timestamp,

        // Additional metrics
        peaksDetected: results.peaksDetected,

        // HRV data (if available)
        hrv: results.hrv ? {
          rmssd: results.hrv.rmssd,
          sdnn: results.hrv.sdnn,
          pnn50: results.hrv.pnn50,
        } : null,

        // Arrhythmia data (if detected)
        arrhythmia: results.arrhythmia ? {
          detected: results.arrhythmia.detected,
          type: results.arrhythmia.type,
          confidence: results.arrhythmia.confidence,
          severity: results.arrhythmia.severity,
          message: results.arrhythmia.message,
        } : null,

        // Metadata
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          timestamp: new Date().toISOString(),
        },

        // Measurement context
        measurementContext: {
          cameraType: "web",
          signalQualityAverage: Math.round(signalQuality),
          dataPoints: redValues.length,
          sampleRate: 30,
        },
      };

      // 🆕 Create readable summary for AI analysis
      const healthSummary = createReadableHealthSummary(measurementData);
      console.log("📤 Health summary for AI analysis:", healthSummary);

      // Get API URL from environment variables
      const url = import.meta.env.VITE_API_URL;
      console.log("🔗 API URL:", url);

      console.log(healthSummary)

      // 🆕 FIXED: Send to OpenAI API with correct format (direct string as JSON)
      const response = await fetch(`${url}api/OpenAi/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(healthSummary), // ✅ Send health summary directly as JSON string
      });

      console.log("📡 API Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ API Error Response:", errorData);
        throw new Error(
          errorData.message || errorData.title || `HTTP error! status: ${response.status}`
        );
      }

      const responseData = await response.json();
      console.log("✅ OpenAI API Response:", responseData);

      // 🆕 Extract AI response from the 'reply' field
      const aiAnalysis = responseData.reply || responseData.response || responseData.message || 'Analysis completed successfully';
      
      // Show comprehensive AI health analysis results
      alert(`🤖 AI Health Analysis Results:\n\n${aiAnalysis}`);

      // Reset for another measurement
      handleRetakeMeasurement();

    } catch (error) {
      console.error("💥 OpenAI API error:", error);

      // 🆕 Enhanced error handling
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        alert(
          "❌ Network error: Unable to connect to AI analysis server. Please check your internet connection."
        );
      } else if (error.message.includes("401") || error.message.includes("unauthorized")) {
        alert("❌ Authentication error: Your session has expired. Please log in again.");
      } else if (error.message.includes("400") || error.message.includes("bad request")) {
        alert("❌ Invalid measurement data: Please try measuring again with better signal quality.");
      } else if (error.message.includes("500") || error.message.includes("internal server error")) {
        alert("❌ Server error: The AI analysis service is temporarily unavailable. Please try again later.");
      } else if (error.message.includes("429") || error.message.includes("too many requests")) {
        alert("❌ Rate limit exceeded: Please wait a moment before requesting another analysis.");
      } else {
        alert(`❌ Failed to get AI analysis: ${error.message}`);
      }

      // Re-throw error to be handled by MeasurementControls component
      throw error;
    }
  };

  console.log("🎨 Rendering LiveMeasurement with state:", {
    cameraReady,
    isRecording,
    currentStep,
    hasError: !!error,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">

            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Heart Rate Measurement
              </h1>
              <p className="text-sm text-gray-600">
                Place your finger over the camera and follow the instructions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Debug info */}
      <div className="max-w-7xl mx-auto p-4">
        

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
              onSave={handleSaveMeasurement} // 🆕 Now includes OpenAI API
              measurementResults={measurementResults}
              targetDuration={30}
            />
          </div>

          {/* Right column - Results and instructions */}
          <div className="space-y-6">
            {/* Arrhythmia alert */}
            {arrhythmia?.detected && (
              <div className="bg-red-50 border border-red-300 text-red-800 p-4 rounded-xl">
                <h4 className="font-semibold mb-1">
                  ⚠️ Possible {arrhythmia.type.replace(/_/g, " ")}
                </h4>
                <p className="text-sm">{arrhythmia.message}</p>
                <p className="text-xs mt-1">
                  Confidence {Math.round(arrhythmia.confidence)}%
                </p>
              </div>
            )}

            {/* HRV display */}
            {hrv && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Heart-Rate Variability
                </h3>
                <p className="text-4xl font-bold text-blue-600">
                  {Math.round(hrv.rmssd)}{" "}
                  <span className="text-lg font-medium">ms RMSSD</span>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {hrv.rmssd < 20
                    ? "Higher stress / fatigue"
                    : hrv.rmssd < 40
                    ? "Moderate"
                    : "Relaxed / recovered"}
                </p>
              </div>
            )}

            {/* Instructions */}
            <MeasurementInstructions
              currentStep={currentStep}
              fingerPlacement={fingerPlacement}
              isRecording={isRecording}
            />

            {/* 🆕 Enhanced measurement summary */}
            {measurementResults && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Measurement Summary
                </h3>

                {measurementResults.hrv && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">RMSSD:</span>
                    <span className="font-semibold">
                      {Math.round(measurementResults.hrv.rmssd)} ms
                    </span>
                  </div>
                )}
                {measurementResults.arrhythmia?.detected && (
                  <div className="text-red-600 text-sm mt-2">
                    ⚠️ {measurementResults.arrhythmia.message}
                  </div>
                )}

                {measurementResults.success ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Heart Rate:</span>
                      <span className="font-semibold">
                        {measurementResults.heartRate} BPM
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Confidence:</span>
                      <span className="font-semibold">
                        {measurementResults.confidence}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Signal Quality:</span>
                      <span className="font-semibold">
                        {measurementResults.signalQuality}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-semibold">
                        {Math.round(measurementResults.measurementDuration)}s
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Peaks Detected:</span>
                      <span className="font-semibold">
                        {measurementResults.peaksDetected}
                      </span>
                    </div>
                    
                    {/* 🆕 AI Analysis button */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600 mb-2">
                        🤖 Get AI-powered health insights by clicking "Save Results"
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-red-600">
                    <p>{measurementResults.error}</p>
                    <p className="text-sm mt-2">
                      Please try measuring again with better finger placement.
                    </p>
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