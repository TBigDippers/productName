import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchConfig } from './api';
import Header from './components/Header';
import NamingForm from './components/NamingForm';
import ResultsPanel from './components/ResultsPanel';
import CompareDrawer from './components/CompareDrawer';
import HistoryDialog from './components/HistoryDialog';
import Toast from './components/Toast';

export default function App() {
  const [currentTask, setCurrentTask] = useState(null);
  const [compareSelection, setCompareSelection] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [toast, setToast] = useState(null);

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['config'],
    queryFn: fetchConfig,
  });

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  };

  const handleTaskGenerated = (task) => {
    setCurrentTask(task);
    setCompareSelection([]);
    showToast('Generated 10 naming candidates successfully!', 'success');
  };

  const toggleCompare = (candidateId) => {
    setCompareSelection((prev) => {
      if (prev.includes(candidateId)) {
        return prev.filter((id) => id !== candidateId);
      }
      if (prev.length >= 4) {
        showToast('You can compare up to 4 candidates at a time', 'warning');
        return prev;
      }
      return [...prev, candidateId];
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50">
      <Header
        onHistoryClick={() => setShowHistory(true)}
        onCompareClick={() => setShowCompare(true)}
        hasCompareSelection={compareSelection.length >= 2}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form Panel */}
          <div className="lg:col-span-4">
            <NamingForm
              config={config}
              isLoading={configLoading}
              onTaskGenerated={handleTaskGenerated}
              showToast={showToast}
            />
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-8">
            <ResultsPanel
              task={currentTask}
              compareSelection={compareSelection}
              onToggleCompare={toggleCompare}
              showToast={showToast}
            />
          </div>
        </div>
      </main>

      {/* Compare Drawer */}
      <CompareDrawer
        isOpen={showCompare}
        onClose={() => setShowCompare(false)}
        task={currentTask}
        selection={compareSelection}
        onRemove={(id) => toggleCompare(id)}
        showToast={showToast}
      />

      {/* History Dialog */}
      <HistoryDialog
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onLoadTask={(task) => {
          setCurrentTask(task);
          setCompareSelection([]);
          setShowHistory(false);
          showToast('Loaded historical task', 'success');
        }}
      />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
