import { useQuery } from '@tanstack/react-query';
import { compareCandidates } from '../api';

const DIMENSION_LABELS = {
  direct: '直接描述型',
  metaphor: '隐喻比喻型',
  emotional: '情感共鸣型',
  action: '行动导向型'
};

export default function CompareDrawer({ isOpen, onClose, task, selection, onRemove, showToast }) {
  const { data: comparison, isLoading } = useQuery({
    queryKey: ['compare', task?.taskId, selection],
    queryFn: () => compareCandidates(task.taskId, selection),
    enabled: isOpen && task && selection.length >= 2,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl animate-slide-up">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-primary-600">对比</p>
              <h2 className="text-xl font-bold text-gray-900">候选名称对比</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {selection.length < 2 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {selection.length ? '再选择一个候选名称' : '未选择候选名称'}
                </h3>
                <p className="text-gray-500">
                  {selection.length ? '至少需要选择两个名称才能对比。' : '从结果列表中选择最多四个名称进行对比。'}
                </p>
              </div>
            ) : isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : comparison && comparison.length > 0 ? (
              <div className="space-y-6">
                <p className="text-sm text-gray-500">
                  对比 {comparison.length} 个已选候选名称的优劣势。
                </p>

                {comparison.map((item) => (
                  <div key={item.candidateId} className="card p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">{item.name}</h4>
                        <span className="badge badge-primary">{DIMENSION_LABELS[item.dimension] || item.dimension}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">{item.totalScore}</div>
                        <span className={`badge ${item.recommendationLevel === 'A' ? 'badge-success' : item.recommendationLevel === 'B' ? 'badge-primary' : 'badge-warning'}`}>
                          {item.recommendationLevel} 级
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-gray-600">{item.strength}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-gray-600">{item.weakness}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onRemove(item.candidateId)}
                      className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      从对比中移除
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
