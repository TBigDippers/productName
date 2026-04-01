import { useState } from 'react';

const DIMENSION_COLORS = {
  direct: 'bg-blue-50 text-blue-700',
  metaphor: 'bg-purple-50 text-purple-700',
  emotional: 'bg-pink-50 text-pink-700',
  action: 'bg-emerald-50 text-emerald-700',
};

const DIMENSION_LABELS = {
  direct: '直接描述型',
  metaphor: '隐喻比喻型',
  emotional: '情感共鸣型',
  action: '行动导向型',
};

const LEVEL_COLORS = {
  A: 'bg-emerald-50 text-emerald-700',
  B: 'bg-primary-50 text-primary-700',
  C: 'bg-amber-50 text-amber-700',
  D: 'bg-red-50 text-red-700',
  E: 'bg-red-100 text-red-800',
};

export default function CandidateCard({ candidate, isSelected, onToggleCompare }) {
  const [expanded, setExpanded] = useState(false);

  const dimensionLabel = DIMENSION_LABELS[candidate.dimension] || candidate.dimension;

  return (
    <div className={`card p-5 transition-all duration-200 ${isSelected ? 'ring-2 ring-primary-500 ring-offset-2' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{candidate.name}</h3>
          <div className="flex flex-wrap gap-2">
            <span className={`badge ${DIMENSION_COLORS[candidate.dimension]}`}>
              {dimensionLabel}
            </span>
            <span className={`badge ${LEVEL_COLORS[candidate.score.recommendationLevel]}`}>
              {candidate.score.recommendationLevel} 级
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">{candidate.score.totalScore}</div>
          <p className="text-xs text-gray-500">综合得分</p>
        </div>
      </div>

      {/* Quick Info */}
      <p className="text-sm text-gray-600 mb-4">{candidate.reason}</p>

      {/* Score Grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: '清晰度', value: candidate.score.clarity },
          { label: '品牌契合', value: candidate.score.brandFit },
          { label: '记忆度', value: candidate.score.memorability },
          { label: '传播力', value: candidate.score.spreadability },
          { label: '独特性', value: candidate.score.uniqueness },
          { label: '可注册性', value: candidate.score.registrability },
        ].map((item) => (
          <div key={item.label} className="bg-gray-50 rounded-lg p-2 text-center">
            <div className="text-lg font-semibold text-gray-900">{item.value}</div>
            <div className="text-xs text-gray-500">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Expand Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-primary-600 hover:text-primary-700 font-medium mb-4"
      >
        {expanded ? '收起详情' : '查看详情'}
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="space-y-4 border-t border-gray-100 pt-4 animate-fade-in">
          {/* Why this name works */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">命名解析</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li><strong>调性契合:</strong> {candidate.toneFit}</li>
              <li><strong>受众契合:</strong> {candidate.audienceFit}</li>
              <li><strong>使用建议:</strong> {candidate.usageSuggestion}</li>
              <li><strong>风险提示:</strong> {candidate.riskNote}</li>
            </ul>
          </div>

          {/* Feasibility */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">可行性评估</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className={`badge ${
                  candidate.feasibility.pronunciation.level === 'low' ? 'bg-emerald-50 text-emerald-700' :
                  candidate.feasibility.pronunciation.level === 'medium' ? 'bg-amber-50 text-amber-700' :
                  'bg-red-50 text-red-700'
                }`}>
                  {candidate.feasibility.pronunciation.level}
                </span>
                <span className="text-gray-600">{candidate.feasibility.pronunciation.reason}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className={`badge ${
                  candidate.feasibility.memorability.level === 'strong' ? 'bg-emerald-50 text-emerald-700' :
                  candidate.feasibility.memorability.level === 'medium' ? 'bg-amber-50 text-amber-700' :
                  'bg-red-50 text-red-700'
                }`}>
                  {candidate.feasibility.memorability.level}
                </span>
                <span className="text-gray-600">{candidate.feasibility.memorability.reason}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className={`badge ${
                  candidate.feasibility.trademarkRisk.level === 'low' ? 'bg-emerald-50 text-emerald-700' :
                  candidate.feasibility.trademarkRisk.level === 'medium' ? 'bg-amber-50 text-amber-700' :
                  'bg-red-50 text-red-700'
                }`}>
                  {candidate.feasibility.trademarkRisk.level}
                </span>
                <span className="text-gray-600">{candidate.feasibility.trademarkRisk.reason}</span>
              </div>
            </div>
          </div>

          {/* Score Summary */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">评分说明</h4>
            <p className="text-sm text-gray-600">{candidate.score.summary}</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleCompare}
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <span className="text-sm text-gray-600">加入对比</span>
        </label>
        <span className="text-xs text-gray-400">
          {candidate.nameLength} 个字符
        </span>
      </div>
    </div>
  );
}
