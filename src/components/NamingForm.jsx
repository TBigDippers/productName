import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { generateNames, generateNamesWithLLM } from '../api';

const DIMENSION_LABELS = {
  direct: '直接描述型',
  metaphor: '隐喻比喻型',
  emotional: '情感共鸣型',
  action: '行动导向型'
};

const DEFAULT_CONFIG = {
  industries: ['general', 'ecommerce', 'finance', 'office', 'education', 'local_service', 'content'],
  industryLabels: {
    general: '通用',
    ecommerce: '电商',
    finance: '金融',
    office: '办公',
    education: '教育',
    local_service: '本地生活',
    content: '内容'
  },
  brandToneOptions: ['professional', 'reliable', 'warm', 'young', 'technology', 'minimal', 'premium', 'friendly'],
  brandToneLabels: {
    professional: '专业',
    reliable: '可靠',
    warm: '温暖',
    young: '年轻',
    technology: '科技',
    minimal: '简约',
    premium: '高端',
    friendly: '友好'
  },
  namingPreferenceOptions: ['concise', 'easy_to_remember', 'brand_forward', 'feature_forward', 'young_style', 'professional_style'],
  namingPreferenceLabels: {
    concise: '简洁',
    easy_to_remember: '易记',
    brand_forward: '品牌导向',
    feature_forward: '功能导向',
    young_style: '年轻化',
    professional_style: '专业感'
  },
  llmModels: ['glm-4.5', 'glm-4.5-air', 'glm-4-plus'],
  warningCopy: '商标风险仅为启发式建议，不构成法律意见。'
};

export default function NamingForm({ config, isLoading, onTaskGenerated, showToast }) {
  const resolvedConfig = useMemo(
    () => ({
      ...DEFAULT_CONFIG,
      ...(config || {}),
      industryLabels: { ...DEFAULT_CONFIG.industryLabels, ...(config?.industryLabels || {}) },
      brandToneLabels: { ...DEFAULT_CONFIG.brandToneLabels, ...(config?.brandToneLabels || {}) },
      namingPreferenceLabels: { ...DEFAULT_CONFIG.namingPreferenceLabels, ...(config?.namingPreferenceLabels || {}) }
    }),
    [config]
  );

  const [formData, setFormData] = useState({
    featureDescription: '',
    targetUsers: '',
    industry: 'general',
    brandTone: [],
    namingPreference: [],
    forbiddenWords: '',
    language: 'en-US',
    mode: 'heuristic',
    model: 'glm-4.5',
    apiKey: '',
    dimensionWeight: { direct: 30, metaphor: 20, emotional: 20, action: 30 }
  });

  const dimensionTotal = useMemo(
    () => Object.values(formData.dimensionWeight).reduce((sum, val) => sum + val, 0),
    [formData.dimensionWeight]
  );

  const isLLMMode = formData.mode === 'llm';

  useEffect(() => {
    if (!resolvedConfig.llmModels.length) return;
    setFormData((prev) => {
      const nextModel = resolvedConfig.llmModels.includes(prev.model) ? prev.model : resolvedConfig.llmModels[0];
      return nextModel === prev.model ? prev : { ...prev, model: nextModel };
    });
  }, [resolvedConfig]);

  const generateMutation = useMutation({
    mutationFn: (payload) => (payload.mode === 'llm' ? generateNamesWithLLM(payload) : generateNames(payload)),
    onSuccess: onTaskGenerated,
    onError: (error) => showToast(error.message || '生成命名失败', 'error')
  });

  const handleSubmit = (event) => {
    event.preventDefault();

    if (formData.featureDescription.length < 10) {
      showToast('功能描述至少需要 10 个字符', 'error');
      return;
    }

    if (!formData.targetUsers.trim()) {
      showToast('请填写目标用户', 'error');
      return;
    }

    if (dimensionTotal !== 100) {
      showToast('维度权重之和必须为 100%', 'error');
      return;
    }

    if (isLLMMode && !formData.apiKey.trim()) {
      showToast('LLM 模式需要智谱 API Key', 'error');
      return;
    }

    const total = Object.values(formData.dimensionWeight).reduce((sum, value) => sum + value, 0);
    const normalizedWeight = Object.fromEntries(
      Object.entries(formData.dimensionWeight).map(([key, value]) => [key, value / total])
    );

    generateMutation.mutate({
      featureDescription: formData.featureDescription,
      targetUsers: formData.targetUsers.split(/[,\n]/).map((item) => item.trim()).filter(Boolean),
      industry: formData.industry,
      brandTone: formData.brandTone,
      namingPreference: formData.namingPreference,
      forbiddenWords: formData.forbiddenWords.split(/[,\n]/).map((item) => item.trim()).filter(Boolean),
      language: formData.language,
      dimensionWeight: normalizedWeight,
      mode: formData.mode,
      model: formData.model,
      apiKey: formData.apiKey.trim()
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
      mode: 'heuristic',
      model: resolvedConfig.llmModels[0] || 'glm-4.5',
      apiKey: '',
      dimensionWeight: { direct: 30, metaphor: 20, emotional: 20, action: 30 }
    });
  };

  const toggleChip = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value]
    }));
  };

  const updateDimension = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      dimensionWeight: {
        ...prev.dimensionWeight,
        [key]: Number(value)
      }
    }));
  };

  if (isLoading) {
    return (
      <div className="card p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4" />
        <div className="space-y-4">
          <div className="h-24 bg-gray-200 rounded" />
          <div className="h-12 bg-gray-200 rounded" />
          <div className="h-12 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">命名工作台</h2>
          <p className="text-sm text-gray-500 mt-1">填写需求简报，选择生成模式</p>
        </div>
        <button onClick={handleReset} className="btn-ghost text-sm" type="button">
          重置
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">生成模式</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, mode: 'heuristic' }))}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                formData.mode === 'heuristic'
                  ? 'bg-white text-primary-700 ring-2 ring-primary-400/40'
                  : 'bg-transparent text-gray-600 hover:bg-white'
              }`}
            >
              规则引擎
            </button>
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, mode: 'llm' }))}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                formData.mode === 'llm'
                  ? 'bg-white text-primary-700 ring-2 ring-primary-400/40'
                  : 'bg-transparent text-gray-600 hover:bg-white'
              }`}
            >
              大模型 (智谱)
            </button>
          </div>

          {isLLMMode && (
            <div className="space-y-3 pt-2 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">模型</label>
                <select
                  value={formData.model}
                  onChange={(e) => setFormData((prev) => ({ ...prev, model: e.target.value }))}
                  className="input"
                >
                  {resolvedConfig.llmModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">智谱 API Key</label>
                <input
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData((prev) => ({ ...prev, apiKey: e.target.value }))}
                  className="input"
                  placeholder="{APIKeyID}.{secret}"
                  autoComplete="off"
                />
                <p className="mt-1 text-xs text-gray-400">
                  密钥仅用于当前请求。生产环境建议在服务端配置 ZHIPU_API_KEY 环境变量。
                </p>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            功能描述 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.featureDescription}
            onChange={(e) => setFormData((prev) => ({ ...prev, featureDescription: e.target.value }))}
            rows={4}
            className="input resize-none"
            placeholder="描述功能的作用、使用者以及解决的问题"
          />
          <p className="mt-1 text-xs text-gray-400">{formData.featureDescription.length}/300 字符（至少 10 个）</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            目标用户 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.targetUsers}
            onChange={(e) => setFormData((prev) => ({ ...prev, targetUsers: e.target.value }))}
            className="input"
            placeholder="例如：电商购物者、办公室管理员"
          />
          <p className="mt-1 text-xs text-gray-400">多个用户群体请用逗号分隔</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">行业</label>
          <select
            value={formData.industry}
            onChange={(e) => setFormData((prev) => ({ ...prev, industry: e.target.value }))}
            className="input"
          >
            {resolvedConfig.industries.map((industry) => (
              <option key={industry} value={industry}>
                {resolvedConfig.industryLabels[industry] || industry}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">品牌调性（可选）</label>
          <div className="flex flex-wrap gap-2">
            {resolvedConfig.brandToneOptions.map((tone) => (
              <button
                key={tone}
                type="button"
                onClick={() => toggleChip('brandTone', tone)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  formData.brandTone.includes(tone)
                    ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-500/30'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {resolvedConfig.brandToneLabels[tone] || tone}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">命名偏好</label>
          <div className="flex flex-wrap gap-2">
            {resolvedConfig.namingPreferenceOptions.map((pref) => (
              <button
                key={pref}
                type="button"
                onClick={() => toggleChip('namingPreference', pref)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  formData.namingPreference.includes(pref)
                    ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-500/30'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {resolvedConfig.namingPreferenceLabels[pref] || pref}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">禁用词</label>
          <input
            type="text"
            value={formData.forbiddenWords}
            onChange={(e) => setFormData((prev) => ({ ...prev, forbiddenWords: e.target.value }))}
            className="input"
            placeholder="例如：智能、助手"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">维度权重</label>
            <span className={`text-sm font-semibold ${dimensionTotal === 100 ? 'text-green-600' : 'text-red-500'}`}>
              {dimensionTotal}%
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(DIMENSION_LABELS).map(([key, label]) => (
              <div key={key} className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">{label}</span>
                  <span className="text-sm font-semibold text-gray-900">{formData.dimensionWeight[key]}%</span>
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
        </div>

        {resolvedConfig.warningCopy && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
            <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-sm text-amber-700">{resolvedConfig.warningCopy}</p>
          </div>
        )}

        <button type="submit" disabled={generateMutation.isPending} className="w-full btn-primary py-4 text-base">
          {generateMutation.isPending ? '生成中...' : isLLMMode ? '使用大模型生成' : '生成命名方案'}
        </button>
      </form>
    </div>
  );
}
