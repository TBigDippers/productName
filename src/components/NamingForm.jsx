import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { generateNames } from '../api';

const DIMENSION_LABELS = {
  direct: 'Direct',
  metaphor: 'Metaphor',
  emotional: 'Emotional',
  action: 'Action',
};

export default function NamingForm({ config, isLoading, onTaskGenerated, showToast }) {
  const [formData, setFormData] = useState({
    featureDescription: '',
    targetUsers: '',
    industry: 'general',
    brandTone: [],
    namingPreference: [],
    forbiddenWords: '',
    language: 'en-US',
    dimensionWeight: { direct: 30, metaphor: 20, emotional: 20, action: 30 },
  });

  const [dimensionTotal, setDimensionTotal] = useState(100);

  useEffect(() => {
    const total = Object.values(formData.dimensionWeight).reduce((sum, val) => sum + val, 0);
    setDimensionTotal(total);
  }, [formData.dimensionWeight]);

  const generateMutation = useMutation({
    mutationFn: generateNames,
    onSuccess: onTaskGenerated,
    onError: (error) => {
      showToast(error.message || 'Failed to generate names', 'error');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.featureDescription.length < 10) {
      showToast('Feature description must be at least 10 characters', 'error');
      return;
    }

    if (!formData.targetUsers.trim()) {
      showToast('Target users is required', 'error');
      return;
    }

    if (dimensionTotal !== 100) {
      showToast('Dimension weights must add up to 100%', 'error');
      return;
    }

    const total = Object.values(formData.dimensionWeight).reduce((sum, val) => sum + val, 0);
    const normalizedWeight = Object.fromEntries(
      Object.entries(formData.dimensionWeight).map(([key, val]) => [key, val / total])
    );

    generateMutation.mutate({
      featureDescription: formData.featureDescription,
      targetUsers: formData.targetUsers.split(/[,\n]/).map((s) => s.trim()).filter(Boolean),
      industry: formData.industry,
      brandTone: formData.brandTone,
      namingPreference: formData.namingPreference,
      forbiddenWords: formData.forbiddenWords.split(/[,\n]/).map((s) => s.trim()).filter(Boolean),
      language: formData.language,
      dimensionWeight: normalizedWeight,
    });
  };

  const handleReset = () => {
    setFormData({
      featureDescription: '',
      targetUsers: '',
      industry: 'general',
      brandTone: [],
      namingPreference: [],
      forbiddenWords: '',
      language: 'en-US',
      dimensionWeight: { direct: 30, metaphor: 20, emotional: 20, action: 30 },
    });
  };

  const toggleChip = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  };

  const updateDimension = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      dimensionWeight: {
        ...prev.dimensionWeight,
        [key]: Number(value),
      },
    }));
  };

  if (isLoading) {
    return (
      <div className="card p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="space-y-4">
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Create Naming Brief</h2>
          <p className="text-sm text-gray-500 mt-1">Define your feature and brand context</p>
        </div>
        <button onClick={handleReset} className="btn-ghost text-sm">
          Reset
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Feature Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Feature description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.featureDescription}
            onChange={(e) => setFormData({ ...formData, featureDescription: e.target.value })}
            rows={4}
            className="input resize-none"
            placeholder="Describe what the feature does, who uses it, and what problem it solves..."
          />
          <p className="mt-1 text-xs text-gray-400">
            {formData.featureDescription.length}/300 characters (min 10)
          </p>
        </div>

        {/* Target Users */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target users <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.targetUsers}
            onChange={(e) => setFormData({ ...formData, targetUsers: e.target.value })}
            className="input"
            placeholder="e.g. ecommerce shoppers, office managers"
          />
          <p className="mt-1 text-xs text-gray-400">Use commas to separate multiple audiences</p>
        </div>

        {/* Industry */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
          <select
            value={formData.industry}
            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            className="input"
          >
            {config?.industries?.map((industry) => (
              <option key={industry} value={industry}>
                {industry.charAt(0).toUpperCase() + industry.slice(1).replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Brand Tone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Brand tone</label>
          <div className="flex flex-wrap gap-2">
            {config?.brandToneOptions?.map((tone) => (
              <button
                key={tone}
                type="button"
                onClick={() => toggleChip('brandTone', tone)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  formData.brandTone.includes(tone)
                    ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-500/30'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tone.charAt(0).toUpperCase() + tone.slice(1).replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Naming Preference */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Naming preference</label>
          <div className="flex flex-wrap gap-2">
            {config?.namingPreferenceOptions?.map((pref) => (
              <button
                key={pref}
                type="button"
                onClick={() => toggleChip('namingPreference', pref)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  formData.namingPreference.includes(pref)
                    ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-500/30'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {pref.charAt(0).toUpperCase() + pref.slice(1).replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Forbidden Words */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Forbidden words</label>
          <input
            type="text"
            value={formData.forbiddenWords}
            onChange={(e) => setFormData({ ...formData, forbiddenWords: e.target.value })}
            className="input"
            placeholder="e.g. smart, assistant"
          />
          <p className="mt-1 text-xs text-gray-400">Names containing these words will be filtered out</p>
        </div>

        {/* Dimension Weights */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Dimension weight</label>
            <span
              className={`text-sm font-semibold ${
                dimensionTotal === 100 ? 'text-green-600' : 'text-red-500'
              }`}
            >
              {dimensionTotal}%
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(DIMENSION_LABELS).map(([key, label]) => (
              <div key={key} className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">{label}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formData.dimensionWeight[key]}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={formData.dimensionWeight[key]}
                  onChange={(e) => updateDimension(key, e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
              </div>
            ))}
          </div>
          {dimensionTotal !== 100 && (
            <p className="mt-2 text-sm text-red-500">Weights must add up to 100%</p>
          )}
        </div>

        {/* Warning */}
        {config?.warningCopy && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
            <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-amber-700">{config.warningCopy}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={generateMutation.isPending}
          className="w-full btn-primary py-4 text-base"
        >
          {generateMutation.isPending ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            'Generate Naming Options'
          )}
        </button>
      </form>
    </div>
  );
}
