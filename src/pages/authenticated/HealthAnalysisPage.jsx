import React, { useState, useEffect } from 'react';

const DynamicHealthAnalysisPage = ({ analysisId }) => {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalysisData();
  }, [analysisId]);

  const fetchAnalysisData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token'); 
      
      // Always require analysisId - no fallback to list
      if (!analysisId) {
        throw new Error('Analysis ID is required');
      }

      console.log('🎯 Fetching SPECIFIC analysis for ID:', analysisId);
      
      const response = await fetch(`https://hackathonteam1-c3aycbddd4geayh8.canadacentral-01.azurewebsites.net/api/HealthAnalysis/${analysisId}`, {
        headers: {
          'accept': '*/*',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch analysis data: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Successfully fetched analysis:', { 
        requestedId: analysisId, 
        actualId: data.id, 
        matches: analysisId === data.id,
        heartRateData: data.healthAnalysisData.substring(0, 100) + '...' 
      });
      setAnalysisData(data);

    } catch (err) {
      setError(err.message);
      console.error('Error fetching health analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 UNIVERSAL JSON PARSER - Handles ANY structure
  const parseHealthData = (rawData) => {
    if (!rawData) return null;

    try {
      // Clean and parse JSON
      let cleanText = rawData.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanText);
    } catch (parseError) {
      console.warn('Could not parse as JSON, treating as text');
      return { isText: true, textContent: rawData };
    }
  };

  // 🎨 SMART ICON MAPPER - Auto-assigns icons based on content
  const getIconForKey = (key, value) => {
    const keyLower = key.toLowerCase();
    
    // Heart rate related
    if (keyLower.includes('heart') || keyLower.includes('bpm') || keyLower.includes('rate')) {
      return '❤️';
    }
    // HRV related
    if (keyLower.includes('hrv') || keyLower.includes('variability') || keyLower.includes('rmssd') || keyLower.includes('sdnn') || keyLower.includes('pnn50')) {
      return '📊';
    }
    // Rhythm/Arrhythmia
    if (keyLower.includes('rhythm') || keyLower.includes('arrhythmia')) {
      return '💓';
    }
    // Quality/Measurement
    if (keyLower.includes('quality') || keyLower.includes('measurement') || keyLower.includes('reliability')) {
      return '🔍';
    }
    // Recommendations
    if (keyLower.includes('recommendation') || keyLower.includes('tip') || keyLower.includes('lifestyle')) {
      return '💡';
    }
    // Warning/Red flags
    if (keyLower.includes('red') || keyLower.includes('flag') || keyLower.includes('warning')) {
      return '🚨';
    }
    // Disclaimer
    if (keyLower.includes('disclaimer') || keyLower.includes('medical')) {
      return '⚠️';
    }
    // Assessment
    if (keyLower.includes('assessment') || keyLower.includes('evaluation')) {
      return '🔬';
    }
    // Default
    return '📋';
  };

  // 🎯 SMART VALUE FORMATTER - Auto-formats different data types
  const formatValue = (value, key) => {
    if (value === null || value === undefined) return 'N/A';
    
    // Boolean values
    if (typeof value === 'boolean') {
      const keyLower = key.toLowerCase();
      if (keyLower.includes('normal') || keyLower.includes('confirm')) {
        return value ? '✅ Yes' : '❌ No';
      }
      return value ? 'True' : 'False';
    }
    
    // Arrays
    if (Array.isArray(value)) {
      if (value.length === 0) return 'None specified';
      return value;
    }
    
    // Strings
    if (typeof value === 'string') {
      // Check if it's a number with BPM
      const bpmMatch = value.match(/(\d+)\s*bpm/i);
      if (bpmMatch) {
        return `${bpmMatch[1]} BPM`;
      }
      return value;
    }
    
    // Numbers
    if (typeof value === 'number') {
      return value.toString();
    }
    
    return value;
  };

  // 🎨 SMART COLOR PICKER - Auto-assigns colors based on content
  const getColorForSection = (key, index) => {
    const keyLower = key.toLowerCase();
    
    if (keyLower.includes('heart') || keyLower.includes('bpm')) return 'text-red-400';
    if (keyLower.includes('hrv') || keyLower.includes('variability')) return 'text-blue-400';
    if (keyLower.includes('rhythm') || keyLower.includes('arrhythmia')) return 'text-green-400';
    if (keyLower.includes('quality') || keyLower.includes('measurement')) return 'text-purple-400';
    if (keyLower.includes('recommendation')) return 'text-emerald-400';
    if (keyLower.includes('disclaimer')) return 'text-amber-400';
    
    // Cycle through colors if no match
    const colors = ['text-cyan-400', 'text-pink-400', 'text-indigo-400', 'text-orange-400'];
    return colors[index % colors.length];
  };

  // 🔧 RECURSIVE COMPONENT - Renders any nested structure
  const RenderValue = ({ value, keyName, depth = 0 }) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-500 italic">N/A</span>;
    }

    // Objects
    if (typeof value === 'object' && !Array.isArray(value)) {
      return (
        <div className={`${depth > 0 ? 'ml-4 mt-2' : ''}`}>
          {Object.entries(value).map(([key, val], index) => (
            <div key={key} className="mb-3">
              <h4 className={`font-semibold mb-1 ${depth === 0 ? 'text-base' : 'text-sm'} capitalize`}>
                {key.replace(/_/g, ' ')}
              </h4>
              <RenderValue value={val} keyName={key} depth={depth + 1} />
            </div>
          ))}
        </div>
      );
    }

    // Arrays
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-gray-500 italic">None specified</span>;
      }
      
      return (
        <ul className="text-gray-300 space-y-1">
          {value.map((item, index) => (
            <li key={index} className="flex items-start">
              <span className="text-blue-400 mr-2 mt-1 text-xs">●</span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      );
    }

    // Primitives (string, number, boolean)
    const formatted = formatValue(value, keyName);
    
    // Special styling for certain values
    if (typeof value === 'boolean') {
      return (
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          value ? 'bg-green-800 text-green-200' : 'bg-red-800 text-red-200'
        }`}>
          {formatted}
        </span>
      );
    }

    // BPM detection for highlighting
    if (typeof formatted === 'string' && formatted.includes('BPM')) {
      return <span className="text-2xl font-bold text-white">{formatted}</span>;
    }

    return <span className="text-gray-300">{formatted}</span>;
  };

  if (loading) {
    return (
      <div className="bg-gray-900 text-white p-8 rounded-lg">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mr-3"></div>
          <span>Loading health analysis...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 text-white p-8 rounded-lg">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2 text-red-400">Error Loading Analysis</h2>
          <p className="text-gray-400">{error}</p>
          <button 
            onClick={fetchAnalysisData}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analysisId) {
    return (
      <div className="bg-gray-900 text-white p-8 rounded-lg text-center">
        <h2 className="text-xl font-semibold mb-2 text-yellow-400">Analysis ID Required</h2>
        <p className="text-gray-400">Please provide a specific analysis ID to view the report.</p>
      </div>
    );
  }

  const healthData = parseHealthData(analysisData.healthAnalysisData);
  
  // 🔍 Debug logging
  console.log('💊 CURRENT ANALYSIS DATA:', {
    recordId: analysisData.id.slice(0, 8),
    passedAnalysisId: analysisId?.slice(0, 8) || 'none (latest)',
    parsedData: healthData?.isText ? 'TEXT' : Object.keys(healthData || {}),
    heartRateFields: healthData ? Object.keys(healthData).filter(key => 
      key.toLowerCase().includes('heart') || 
      JSON.stringify(healthData[key]).toLowerCase().includes('bpm')
    ) : []
  });

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Header */}
      <div className="bg-gray-800 p-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold">Health Analysis Report</h1>
        <div className="flex items-center justify-between mt-1">
          <p className="text-gray-400">
            {new Date(analysisData.createdAt).toLocaleDateString()} - ID: {analysisData.id.slice(0, 8)}...
          </p>
          <div className="text-sm">
            {analysisId ? (
              <span className="bg-blue-800 text-blue-200 px-2 py-1 rounded">Specific ID: {analysisId.slice(0, 8)}...</span>
            ) : (
              <span className="bg-green-800 text-green-200 px-2 py-1 rounded">Latest Record</span>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        
        {healthData?.isText ? (
          // 📄 TEXT FALLBACK - Show raw text if JSON parsing fails
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Health Analysis (Raw Text)</h2>
            <div className="whitespace-pre-wrap text-gray-300 text-sm leading-relaxed font-mono">
              {healthData.textContent}
            </div>
          </div>
        ) : healthData ? (
          // 🔥 DYNAMIC STRUCTURE - Auto-renders any JSON structure
          <>
            {Object.entries(healthData).map(([sectionKey, sectionValue], index) => {
              const icon = getIconForKey(sectionKey, sectionValue);
              const color = getColorForSection(sectionKey, index);
              
              return (
                <div key={sectionKey} className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                  <h2 className={`text-xl font-semibold mb-4 ${color} flex items-center`}>
                    <span className="mr-3 text-2xl">{icon}</span>
                    {sectionKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </h2>
                  
                  <RenderValue value={sectionValue} keyName={sectionKey} />
                </div>
              );
            })}
          </>
        ) : (
          // 🚫 ERROR: Show raw data if all parsing fails
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Raw Health Analysis Data</h2>
            <pre className="whitespace-pre-wrap text-gray-300 text-sm leading-relaxed overflow-auto">
              {analysisData.healthAnalysisData}
            </pre>
          </div>
        )}

        {/* Debug Info */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 text-xs">
          <h3 className="font-semibold mb-2 text-gray-400">Debug Info</h3>
          <p className="text-gray-500">
            Record ID: {analysisData.id} | 
            Created: {analysisData.createdAt} | 
            Data Type: {healthData?.isText ? 'Text' : 'JSON'} |
            Sections: {healthData?.isText ? 0 : Object.keys(healthData || {}).length}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 pt-6">
          <button 
            onClick={() => window.print()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition font-semibold"
          >
            📄 Print Report
          </button>
          <button 
            onClick={fetchAnalysisData}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg transition font-semibold"
          >
            🔄 Refresh
          </button>
          <button 
            onClick={() => console.log('Full Data:', { analysisData, healthData })}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition font-semibold"
          >
            🔍 Debug Log
          </button>
        </div>
      </div>
    </div>
  );
};

export default DynamicHealthAnalysisPage;