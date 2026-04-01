const API_BASE = '/api';

export async function fetchConfig() {
  const response = await fetch(`${API_BASE}/naming/config`);
  if (!response.ok) throw new Error('Failed to fetch config');
  const data = await response.json();
  return data.data;
}

export async function generateNames(payload) {
  const response = await fetch(`${API_BASE}/naming/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate names');
  }
  const data = await response.json();
  return data.data;
}

export async function fetchTasks() {
  const response = await fetch(`${API_BASE}/naming/tasks`);
  if (!response.ok) throw new Error('Failed to fetch tasks');
  const data = await response.json();
  return data.data.tasks;
}

export async function fetchTask(taskId) {
  const response = await fetch(`${API_BASE}/naming/tasks/${encodeURIComponent(taskId)}`);
  if (!response.ok) throw new Error('Failed to fetch task');
  const data = await response.json();
  return data.data;
}

export async function compareCandidates(taskId, candidateIds) {
  const response = await fetch(`${API_BASE}/naming/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskId, candidateIds }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to compare candidates');
  }
  const data = await response.json();
  return data.data.comparison;
}

export async function exportTask(taskId, format = 'csv') {
  const response = await fetch(`${API_BASE}/naming/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskId, format }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to export');
  }
  const data = await response.json();
  return data.data.downloadUrl;
}
