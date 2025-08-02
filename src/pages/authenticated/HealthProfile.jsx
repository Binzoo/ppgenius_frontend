import React, { useEffect, useState } from 'react';
import { getProfile, updateProfile } from '../../services/auth';

// Logo component to match existing design
const Logo = ({ className = "w-12 h-12" }) => (
  <div className={`${className} relative`}>
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <path
        d="M20 35 C15 25, 35 15, 50 20 C65 15, 85 25, 80 35 C85 45, 85 55, 80 65 C75 75, 65 80, 50 75 C35 80, 25 75, 20 65 C15 55, 15 45, 20 35 Z"
        fill="none"
        stroke="#4FC3F7"
        strokeWidth="4"
      />
      <path
        d="M30 40 C35 35, 45 40, 50 35 C55 40, 65 35, 70 40"
        fill="none"
        stroke="#4FC3F7"
        strokeWidth="2"
      />
      <path
        d="M25 50 C30 45, 40 50, 50 45 C60 50, 70 45, 75 50"
        fill="none"
        stroke="#4FC3F7"
        strokeWidth="2"
      />
      <rect x="42" y="35" width="16" height="6" fill="#FF5252" rx="1" />
      <rect x="47" y="30" width="6" height="16" fill="#FF5252" rx="1" />
      <rect x="47" y="70" width="6" height="15" fill="#4FC3F7" rx="3" />
    </svg>
  </div>
);

export default function HealthProfile() {
  const [formData, setFormData] = useState({
    age: '',
    weightKg: '',
    heightCm: '',
    gender: '',
    ethnicity: '',
    allergies: '',
    vaccinationStatus: '',
    chronicConditions: '',
    pastSurgeries: '',
    currentMedications: '',
    alcoholUse: '',
    tobaccoUse: '',
    recreationalDrugUse: '',
    caffeineConsumption: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  /* ---------- pull data on mount ---------- */
  useEffect(() => {
    (async () => {
      const result = await getProfile();
      if (result.success && result.data.healthProfile) {
        // Convert numbers to strings so they render in <input type="number" />
        const hp = result.data.healthProfile;
        setFormData({
          ...hp,
          age:        hp.age?.toString()        ?? '',
          weightKg:   hp.weightKg?.toString()   ?? '',
          heightCm:   hp.heightCm?.toString()   ?? ''
        });
      } else if (!result.success) {
        setError(result.message);
      }
      setLoading(false);
    })();
  }, []);

  /* ---------- handlers ---------- */
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSuccess(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    const cleaned = {
      ...formData,
      age:      formData.age      ? Number(formData.age)      : undefined,
      weightKg: formData.weightKg ? Number(formData.weightKg) : undefined,
      heightCm: formData.heightCm ? Number(formData.heightCm): undefined
    };

    const result = await updateProfile(cleaned);
    setSaving(false);
    if (result.success) setSuccess(true);
    else                setError(result.message);
  };

  const pretty = (k) => k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());

  const InfoCard = ({ title, children, icon }) => (
    <div className="bg-slate-800/60 backdrop-blur-lg border border-blue-500/20 rounded-2xl p-6">
      <div className="flex items-center mb-4">
        <span className="text-2xl mr-3">{icon}</span>
        <h3 className="text-xl font-semibold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );

  /* ---------- render ---------- */
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 min-h-screen flex items-center justify-center">
        <div className="bg-slate-800/60 backdrop-blur-lg border border-blue-500/20 rounded-2xl p-8">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white text-lg">Loading profile…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 min-h-screen text-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Status Messages */}
        {success && (
          <div className="bg-green-500/20 border border-green-400/50 rounded-xl p-4 mb-6 text-green-200 text-sm">
            <div className="flex items-center">
              <span className="text-green-400 mr-2">✅</span>
              Profile updated successfully!
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-400/50 rounded-xl p-4 mb-6 text-red-200 text-sm">
            <div className="flex items-center">
              <span className="text-red-400 mr-2">❌</span>
              {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <InfoCard title="Basic Information" icon="📋">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {['age', 'weightKg', 'heightCm', 'gender', 'ethnicity'].map((field) => (
                <div key={field} className="space-y-2">
                  <label htmlFor={field} className="block text-blue-200 text-sm font-medium">
                    {pretty(field)}
                  </label>
                  <input
                    id={field}
                    name={field}
                    value={formData[field]}
                    onChange={handleChange}
                    type={['age','weightKg','heightCm'].includes(field) ? 'number' : 'text'}
                    className="w-full bg-slate-700/50 border border-blue-500/30 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 transition-all"
                    placeholder={`Enter your ${pretty(field).toLowerCase()}`}
                    min={['age','weightKg','heightCm'].includes(field) ? 0 : undefined}
                  />
                </div>
              ))}
            </div>
          </InfoCard>

          {/* Medical Information */}
          <InfoCard title="Medical Information" icon="🏥">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {['allergies', 'vaccinationStatus', 'chronicConditions', 'currentMedications'].map((field) => (
                <div key={field} className="space-y-2">
                  <label htmlFor={field} className="block text-blue-200 text-sm font-medium">
                    {pretty(field)}
                  </label>
                  <textarea
                    id={field}
                    name={field}
                    value={formData[field]}
                    onChange={handleChange}
                    className="w-full bg-slate-700/50 border border-blue-500/30 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 transition-all resize-none"
                    placeholder={`Enter your ${pretty(field).toLowerCase()}`}
                    rows="3"
                  />
                </div>
              ))}
            </div>
          </InfoCard>

          {/* Medical History */}
          <InfoCard title="Medical History" icon="📋">
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="pastSurgeries" className="block text-blue-200 text-sm font-medium">
                  Past Surgeries
                </label>
                <textarea
                  id="pastSurgeries"
                  name="pastSurgeries"
                  value={formData.pastSurgeries}
                  onChange={handleChange}
                  className="w-full bg-slate-700/50 border border-blue-500/30 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 transition-all resize-none"
                  placeholder="List any past surgeries"
                  rows="3"
                />
              </div>
            </div>
          </InfoCard>

          {/* Lifestyle Factors */}
          <InfoCard title="Lifestyle Factors" icon="🏃">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {['alcoholUse', 'tobaccoUse', 'recreationalDrugUse', 'caffeineConsumption'].map((field) => (
                <div key={field} className="space-y-2">
                  <label htmlFor={field} className="block text-blue-200 text-sm font-medium">
                    {pretty(field)}
                  </label>
                  <input
                    id={field}
                    name={field}
                    value={formData[field]}
                    onChange={handleChange}
                    type="text"
                    className="w-full bg-slate-700/50 border border-blue-500/30 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 transition-all"
                    placeholder={`Enter your ${pretty(field).toLowerCase()}`}
                  />
                </div>
              ))}
            </div>
          </InfoCard>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className={`bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg flex items-center space-x-2 ${
                saving ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Saving…</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}