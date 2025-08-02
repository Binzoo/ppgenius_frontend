// import React, { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Heart, Calendar, Clock, ChevronRight } from 'lucide-react';

// function cleanAndParse(markdownJsonString) {
//   const cleaned = markdownJsonString
//     .replace(/```json\s*/i, '')
//     .replace(/```$/, '')
//     .trim();
  
//   return JSON.parse(cleaned);
// }

// export default function Dashboard() {
//   const navigate = useNavigate();
//   const [records, setRecords] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const url = import.meta.env.VITE_API_URL + '/api/HealthAnalysis';
//     fetch(url, {
//       headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
//     })
//       .then(r => r.json())
//       .then(list =>
//         list.map(item => ({
//           ...item,
//           parsed: cleanAndParse(item.healthAnalysisData)
//         }))
//       )
//       .then(data => {
//         setRecords(data);
//         setLoading(false);
//       })
//       .catch(err => {
//         console.error(err);
//         setLoading(false);
//       });
//   }, []);

//   const handleCardClick = (recordId) => {
//     navigate(`/healthAnalsyisPage/${recordId}`);
//   };

//   if (loading) {
//     return (
//       <div className="max-w-6xl mx-auto p-4">
//         <div className="text-center py-8">
//           <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//           <p className="mt-2 text-gray-600">Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!records.length) {
//     return (
//       <div className="max-w-6xl mx-auto p-4">
//         <div className="text-center py-8">
//           <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
//           <h2 className="text-xl font-semibold text-gray-900 mb-2">No health measurements found</h2>
//           <p className="text-gray-600">Start your first health analysis to see results here.</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-6xl mx-auto p-4">
//       <div className="text-center mb-8">
//         <h1 className="text-2xl font-bold text-gray-900 mb-2">Health Measurements</h1>
//         <p className="text-gray-600">{records.length} measurement{records.length !== 1 ? 's' : ''} available</p>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//         {records.map((r, index) => {
//           const measurementDate = new Date(r.createdAt);
//           const formattedDate = measurementDate.toLocaleDateString('en-CA'); // YYYY/MM/DD format
//           const formattedTime = measurementDate.toLocaleTimeString('en-GB', { 
//             hour12: false,
//             hour: '2-digit',
//             minute: '2-digit',
//             second: '2-digit'
//           });

//           return (
//             <div
//               key={r.id}
//               onClick={() => handleCardClick(r.id)}
//               className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer group"
//             >
//               <div className="p-6">
//                 <div className="flex items-center justify-between mb-4">
//                   <div className="flex items-center gap-3">
//                     <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
//                       <Heart className="w-6 h-6 text-red-600" />
//                     </div>
//                     <div>
//                       <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
//                         Measurement #{records.length - index}
//                       </h3>
//                     </div>
//                   </div>
//                   <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
//                 </div>

//                 <div className="space-y-2">
//                   <div className="flex items-center gap-2 text-gray-600">
//                     <Calendar className="w-4 h-4" />
//                     <span className="text-sm">{formattedDate}</span>
//                   </div>
//                   <div className="flex items-center gap-2 text-gray-600">
//                     <Clock className="w-4 h-4" />
//                     <span className="text-sm">{formattedTime}</span>
//                   </div>
//                 </div>

//                 <div className="mt-4 pt-4 border-t border-gray-100">
//                   <div className="text-xs text-gray-500 group-hover:text-blue-600 transition-colors">
//                     Click to view detailed analysis
//                   </div>
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

import React, { useEffect, useState } from 'react';
import { Heart, Calendar, Clock, ChevronDown, ChevronUp, Activity, Shield, BookOpen, AlertTriangle } from 'lucide-react';

function cleanAndParse(markdownJsonString) {
  const cleaned = markdownJsonString
    .replace(/```json\s*/i, '')
    .replace(/```$/, '')
    .trim();
  
  return JSON.parse(cleaned);
}

export default function EnhancedDashboard() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState(new Set());

  useEffect(() => {
    const url = import.meta.env.VITE_API_URL + '/api/HealthAnalysis';
    fetch(url, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(r => r.json())
      .then(list =>
        list.map(item => ({
          ...item,
          parsed: cleanAndParse(item.healthAnalysisData)
        }))
      )
      .then(data => {
        setRecords(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const toggleCard = (recordId) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(recordId)) {
      newExpanded.delete(recordId);
    } else {
      newExpanded.add(recordId);
    }
    setExpandedCards(newExpanded);
  };

  // 🎯 SMART HEART RATE EXTRACTOR
  const extractHeartRate = (data) => {
    if (!data || !data.heart_rate_assessment) return 'N/A';
    
    const assessment = data.heart_rate_assessment;
    
    // Look for specific BPM fields (like "is_65_bpm_normal", "is_38_bpm_normal")
    for (const key in assessment) {
      const bpmMatch = key.match(/is_(\d+)_bpm/);
      if (bpmMatch) {
        return `${bpmMatch[1]} BPM`;
      }
    }
    
    // Check if it's just marked as normal range without specific BPM
    if (assessment.is_normal_range === true) {
      return 'Normal Range';
    }
    
    return 'N/A';
  };

  // 🎯 SMART STATUS EXTRACTOR
  const getHeartRateStatus = (data) => {
    if (!data || !data.heart_rate_assessment) return null;
    
    const assessment = data.heart_rate_assessment;
    
    // Look for specific BPM normal status
    for (const key in assessment) {
      if (key.includes('_bpm_normal')) {
        return assessment[key];
      }
    }
    
    // Fallback to general normal status
    return assessment.is_normal_range;
  };

  // 🔧 RESPONSIVE RECURSIVE COMPONENT - Renders any nested structure
  const RenderValue = ({ value, keyName, depth = 0 }) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-500 italic text-xs sm:text-sm">N/A</span>;
    }

    // Objects
    if (typeof value === 'object' && !Array.isArray(value)) {
      return (
        <div className={`${depth > 0 ? 'ml-3 sm:ml-4 mt-2' : ''}`}>
          {Object.entries(value).map(([key, val]) => (
            <div key={key} className="mb-2">
              <h5 className={`font-medium mb-1 ${depth === 0 ? 'text-xs sm:text-sm' : 'text-xs'} text-gray-700 capitalize break-words`}>
                {key.replace(/_/g, ' ')}
              </h5>
              <RenderValue value={val} keyName={key} depth={depth + 1} />
            </div>
          ))}
        </div>
      );
    }

    // Arrays
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-gray-500 italic text-xs sm:text-sm">None specified</span>;
      }
      
      return (
        <ul className="text-gray-600 text-xs sm:text-sm space-y-1">
          {value.map((item, index) => (
            <li key={index} className="flex items-start">
              <span className="text-blue-500 mr-2 mt-1 text-xs flex-shrink-0">●</span>
              <span className="leading-relaxed break-words">{item}</span>
            </li>
          ))}
        </ul>
      );
    }

    // Primitives (string, number, boolean)
    if (typeof value === 'boolean') {
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {value ? '✅ Yes' : '❌ No'}
        </span>
      );
    }

    return <span className="text-gray-600 text-xs sm:text-sm break-words">{value}</span>;
  };

  // 🎨 RESPONSIVE SECTION COMPONENT
  const Section = ({ title, icon: Icon, children, color = 'blue' }) => {
    const colorClasses = {
      blue: 'text-blue-600 bg-blue-50',
      red: 'text-red-600 bg-red-50',
      green: 'text-green-600 bg-green-50',
      purple: 'text-purple-600 bg-purple-50',
      amber: 'text-amber-600 bg-amber-50'
    };

    return (
      <div className="mb-3 sm:mb-4">
        <div className={`flex items-center gap-2 mb-2 p-2 sm:p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
          <h4 className="font-semibold text-xs sm:text-sm truncate">{title}</h4>
        </div>
        <div className="pl-2 sm:pl-3">
          {children}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm sm:text-base text-gray-600">Loading health analyses...</p>
        </div>
      </div>
    );
  }

  if (!records.length) {
    return (
      <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6">
        <div className="text-center py-8">
          <Heart className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No health measurements found</h2>
          <p className="text-sm sm:text-base text-gray-600">Start your first health analysis to see results here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Health Analysis Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600">{records.length} complete health analysis available</p>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {records.map((r, index) => {
          const measurementDate = new Date(r.createdAt);
          const formattedDate = measurementDate.toLocaleDateString('en-CA');
          const formattedTime = measurementDate.toLocaleTimeString('en-GB', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });

          const isExpanded = expandedCards.has(r.id);
          const heartRate = extractHeartRate(r.parsed);
          const isNormal = getHeartRateStatus(r.parsed);

          return (
            <div key={r.id} className="bg-white rounded-lg sm:rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
              {/* Card Header - Always Visible - Responsive */}
              <div 
                onClick={() => toggleCard(r.id)}
                className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 bg-red-100 rounded-lg sm:rounded-xl flex-shrink-0">
                      <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                        Health Analysis #{records.length - index}
                      </h3>
                      <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-4 mt-1">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="text-xs sm:text-sm">{formattedDate}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="text-xs sm:text-sm">{formattedTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                    {/* Quick Heart Rate Display - Responsive */}
                    <div className="text-right">
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{heartRate}</div>
                      {isNormal !== null && (
                        <div className={`text-xs px-2 py-1 rounded-full mt-1 ${
                          isNormal ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {isNormal ? 'Normal' : 'Abnormal'}
                        </div>
                      )}
                    </div>
                    
                    {/* Expand/Collapse Button */}
                    <div className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Content - Responsive Grid */}
              {isExpanded && (
                <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-gray-100">
                  <div className="mt-4 sm:mt-6 grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                    {/* Left Column */}
                    <div className="space-y-3 sm:space-y-4">
                      {/* Heart Rate Assessment */}
                      {r.parsed.heart_rate_assessment && (
                        <Section title="Heart Rate Assessment" icon={Heart} color="red">
                          <RenderValue value={r.parsed.heart_rate_assessment} keyName="heart_rate_assessment" />
                        </Section>
                      )}

                      {/* HRV Interpretation */}
                      {r.parsed.hrv_interpretation && (
                        <Section title="Heart Rate Variability (HRV)" icon={Activity} color="blue">
                          <RenderValue value={r.parsed.hrv_interpretation} keyName="hrv_interpretation" />
                        </Section>
                      )}

                      {/* Arrhythmia Evaluation */}
                      {r.parsed.arrhythmia_evaluation && (
                        <Section title="Heart Rhythm Analysis" icon={Heart} color="green">
                          <RenderValue value={r.parsed.arrhythmia_evaluation} keyName="arrhythmia_evaluation" />
                        </Section>
                      )}
                    </div>

                    {/* Right Column */}
                    <div className="space-y-3 sm:space-y-4">
                      {/* Measurement Quality */}
                      {r.parsed.measurement_quality && (
                        <Section title="Measurement Quality" icon={Shield} color="purple">
                          <RenderValue value={r.parsed.measurement_quality} keyName="measurement_quality" />
                        </Section>
                      )}

                      {/* Health Recommendations */}
                      {r.parsed.health_recommendations && (
                        <Section title="Health Recommendations" icon={BookOpen} color="green">
                          <RenderValue value={r.parsed.health_recommendations} keyName="health_recommendations" />
                        </Section>
                      )}

                      {/* Disclaimer */}
                      {r.parsed.disclaimer && (
                        <Section title="Medical Disclaimer" icon={AlertTriangle} color="amber">
                          <RenderValue value={r.parsed.disclaimer} keyName="disclaimer" />
                        </Section>
                      )}
                    </div>
                  </div>

                  {/* Debug Info - Responsive */}
                  <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-100">
                    <div className="text-xs text-gray-500 break-all sm:break-normal">
                      <span className="block sm:inline">Record ID: {r.id}</span>
                      <span className="hidden sm:inline"> | </span>
                      <span className="block sm:inline">Created: {r.createdAt}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}