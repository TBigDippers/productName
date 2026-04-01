import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { exportTask } from '../api';
import CandidateCard from './CandidateCard';

export default function ResultsPanel({ task, compareSelection, onToggleCompare, showToast }) {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('totalScore');

  const exportMutation = useMutation({
    mutationFn: () => exportTask(task?.taskId, 'csv'),
    onSuccess: (url) => {
      window.open(url, '_blank');
      showToast('CSV 导出成功', 'success');
    },
    onError: (error) => {
      showToast(error.message || '导出失败', 'error');
    },
  });

  if (!task) {
    return (
      <div className="card p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无结果</h3>
        <p className="text-gray-500">请先填写左侧表单并生成命名方案</p>
      </div>
    );
  }

  const candidates = [...task.candidates]
    .filter((c) => filter === 'all' || c.dimension === filter)
    .sort((a, b) => {
      if (sortBy === 'totalScore') return b.score.totalScore - a.score.totalScore;
      return (b.score[sortBy] || 0) - (a.score[sortBy] || 0);
    });

  const dimensionCount = task.candidates.reduce((acc, c) => {
    acc[c.dimension] = (acc[c.dimension] || 0) + 1;
    return acc;
  }, {});

  const topTier = task.candidates.filter((c) => ['A', 'B'].includes(c.score.recommendationLevel)).length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="card p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-primary-600 mb-1">需求摘要</p>
            <h3 className="text-lg font-semibold text-gray-900">{task.inputSummary.featureDescription}</h3>
          </div>
          <button
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
            className="btn-secondary text-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {exportMutation.isPending ? '导出中...' : '导出 CSV'}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">候选名称总数</p>
            <p className="text-2xl font-bold text-gray-900">{task.candidates.length}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">A/B 级推荐</p>
            <p className="text-2xl font-bold text-gray-900">{topTier}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">最高得分</p>
            <p className="text-2xl font-bold text-gray-900">{task.candidates[0]?.score.totalScore || 0}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">目标用户</p>
            <p className="text-sm font-medium text-gray-900 truncate">
              {task.inputSummary.targetUsers?.join(', ') || 'N/A'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <span className="text-gray-500">
            直接描述型: <strong className="text-gray-900">{dimensionCount.direct || 0}</strong>
          </span>
          <span className="text-gray-500">
            隐喻比喻型: <strong className="text-gray-900">{dimensionCount.metaphor || 0}</strong>
          </span>
          <span className="text-gray-500">
            情感共鸣型: <strong className="text-gray-900">{dimensionCount.emotional || 0}</strong>
          </span>
          <span className="text-gray-500">
            行动导向型: <strong className="text-gray-900">{dimensionCount.action || 0}</strong>
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">筛选条件:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input w-auto py-2 px-3 text-sm"
          >
            <option value="all">全部维度</option>
            <option value="direct">直接描述型</option>
            <option value="metaphor">隐喻比喻型</option>
            <option value="emotional">情感共鸣型</option>
            <option value="action">行动导向型</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">排序方式:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input w-auto py-2 px-3 text-sm"
          >
            <option value="totalScore">综合得分</option>
            <option value="clarity">清晰度</option>
            <option value="brandFit">品牌契合度</option>
            <option value="memorability">记忆度</option>
          </select>
        </div>
      </div>

      {/* Candidate List */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {candidates.map((candidate) => (
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            isSelected={compareSelection.includes(candidate.id)}
            onToggleCompare={() => onToggleCompare(candidate.id)}
          />
        ))}
      </div>

      {candidates.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-gray-500">没有符合当前筛选条件的候选名称</p>
        </div>
      )}
    </div>
  );
}
