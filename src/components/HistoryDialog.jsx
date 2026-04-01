import { useQuery } from '@tanstack/react-query';
import { fetchTasks } from '../api';

export default function HistoryDialog({ isOpen, onClose, onLoadTask }) {
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
    enabled: isOpen,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={onClose} />

        <div className="relative inline-block w-full max-w-2xl bg-white rounded-2xl shadow-2xl transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-primary-600">历史</p>
              <h2 className="text-xl font-bold text-gray-900">历史命名任务</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse card p-4">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            ) : tasks && tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.taskId} className="card p-4 hover:border-primary-200 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 line-clamp-1">{task.featureDescription}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(task.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1 ml-4">
                        {task.topCandidates?.slice(0, 2).map((candidate) => (
                          <span
                            key={candidate.id}
                            className={`badge text-xs ${
                              candidate.level === 'A' ? 'bg-emerald-50 text-emerald-700' :
                              candidate.level === 'B' ? 'bg-primary-50 text-primary-700' :
                              'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {candidate.name} · {candidate.score}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">
                      目标用户: {task.targetUsers?.join(', ') || '无'}
                    </p>
                    <button
                      onClick={() => onLoadTask(task.taskId)}
                      className="btn-ghost text-sm py-2"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    >
                      查看结果
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无历史记录</h3>
                <p className="text-gray-500">完成的命名任务将在此处显示。</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
