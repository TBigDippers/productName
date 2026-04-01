const state = {
  config: null,
  currentTask: null,
  compareSelection: [],
  history: []
};

const elements = {
  form: document.getElementById('namingForm'),
  formMessage: document.getElementById('formMessage'),
  generateButton: document.getElementById('generateButton'),
  resetButton: document.getElementById('resetButton'),
  summaryBlock: document.getElementById('summaryBlock'),
  toolbar: document.getElementById('toolbar'),
  candidateList: document.getElementById('candidateList'),
  exportButton: document.getElementById('exportButton'),
  historyButton: document.getElementById('historyButton'),
  historyDialog: document.getElementById('historyDialog'),
  closeHistoryButton: document.getElementById('closeHistoryButton'),
  historyList: document.getElementById('historyList'),
  compareDrawer: document.getElementById('compareDrawer'),
  compareContent: document.getElementById('compareContent'),
  closeCompareButton: document.getElementById('closeCompareButton'),
  dimensionFilter: document.getElementById('dimensionFilter'),
  sortBy: document.getElementById('sortBy'),
  industry: document.getElementById('industry'),
  brandToneGroup: document.getElementById('brandToneGroup'),
  preferenceGroup: document.getElementById('preferenceGroup'),
  dimensionTotal: document.getElementById('dimensionTotal')
};

init();

async function init() {
  await Promise.all([loadConfig(), loadHistory()]);
  bindEvents();
  updateDimensionLabels();
  renderCompareDrawer();
}

function bindEvents() {
  elements.form.addEventListener('submit', handleGenerate);
  elements.resetButton.addEventListener('click', resetForm);
  elements.dimensionFilter.addEventListener('change', renderCandidates);
  elements.sortBy.addEventListener('change', renderCandidates);
  elements.exportButton.addEventListener('click', exportCurrentTask);
  elements.historyButton.addEventListener('click', () => elements.historyDialog.showModal());
  elements.closeHistoryButton.addEventListener('click', () => elements.historyDialog.close());
  elements.closeCompareButton.addEventListener('click', () => elements.compareDrawer.classList.add('hidden'));

  document.querySelectorAll('input[type="range"][data-dimension]').forEach((slider) => {
    slider.addEventListener('input', updateDimensionLabels);
  });
}

async function loadConfig() {
  const response = await fetch('/api/naming/config');
  const payload = await response.json();
  state.config = payload.data;
  renderConfigOptions();
}

async function loadHistory() {
  const response = await fetch('/api/naming/tasks');
  const payload = await response.json();
  state.history = payload.data.tasks || [];
  renderHistory();
}

function renderConfigOptions() {
  elements.industry.innerHTML = state.config.industries
    .map((industry) => `<option value="${industry}">${labelize(industry)}</option>`)
    .join('');

  renderChipGroup(elements.brandToneGroup, 'brandTone', state.config.brandToneOptions);
  renderChipGroup(elements.preferenceGroup, 'namingPreference', state.config.namingPreferenceOptions);
}

function renderChipGroup(container, name, items) {
  container.innerHTML = items
    .map(
      (item) => `
        <label class="chip">
          <input type="checkbox" name="${name}" value="${item}" />
          <span>${labelize(item)}</span>
        </label>
      `
    )
    .join('');

  container.querySelectorAll('.chip').forEach((chip) => {
    const input = chip.querySelector('input');
    chip.addEventListener('click', (event) => {
      if (event.target !== input) {
        input.checked = !input.checked;
      }
      chip.classList.toggle('active', input.checked);
    });
    input.addEventListener('change', () => {
      chip.classList.toggle('active', input.checked);
    });
  });
}

function labelize(value) {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function updateDimensionLabels() {
  const sliders = [...document.querySelectorAll('input[type="range"][data-dimension]')];
  const values = sliders.map((slider) => Number(slider.value));
  const total = values.reduce((sum, current) => sum + current, 0);
  elements.dimensionTotal.textContent = `${total}%`;

  sliders.forEach((slider) => {
    document.getElementById(`${slider.dataset.dimension}Value`).textContent = `${slider.value}%`;
  });

  if (total === 100) {
    elements.formMessage.textContent = state.config ? state.config.warningCopy : '';
    elements.formMessage.className = 'status-text';
  } else {
    elements.formMessage.textContent = 'Dimension weight must add up to 100%.';
    elements.formMessage.className = 'status-text error';
  }
}

async function handleGenerate(event) {
  event.preventDefault();

  const dimensionWeight = getDimensionWeight();
  const totalWeight = Object.values(dimensionWeight).reduce((sum, value) => sum + value, 0);
  if (Math.abs(totalWeight - 1) > 0.0001) {
    setFormMessage('Dimension weight must add up to 100% before generation.', 'error');
    return;
  }

  const payload = {
    featureDescription: document.getElementById('featureDescription').value.trim(),
    targetUsers: splitInput(document.getElementById('targetUsers').value),
    industry: elements.industry.value,
    brandTone: getCheckedValues('brandTone'),
    namingPreference: getCheckedValues('namingPreference'),
    forbiddenWords: splitInput(document.getElementById('forbiddenWords').value),
    language: document.getElementById('language').value,
    dimensionWeight
  };

  setGeneratingState(true, 'Understanding your feature brief...');

  try {
    const response = await fetch('/api/naming/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok || result.code !== 0) {
      throw new Error(result.message || 'Generation failed.');
    }

    state.currentTask = result.data;
    state.compareSelection = [];
    elements.exportButton.disabled = false;
    setFormMessage('Generated 10 naming options successfully.', 'success');
    renderSummary();
    renderCandidates();
    renderCompareDrawer();
    elements.compareDrawer.classList.add('hidden');
    await loadHistory();
  } catch (error) {
    setFormMessage(error.message || 'Generation failed.', 'error');
  } finally {
    setGeneratingState(false);
  }
}

function setGeneratingState(isGenerating, message) {
  elements.generateButton.disabled = isGenerating;
  elements.generateButton.textContent = isGenerating ? 'Generating...' : 'Generate naming options';
  if (isGenerating && message) {
    setFormMessage(message, '');
  }
}

function setFormMessage(message, type) {
  elements.formMessage.textContent = message;
  elements.formMessage.className = `status-text${type ? ` ${type}` : ''}`;
}

function getCheckedValues(name) {
  return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map((input) => input.value);
}

function splitInput(value) {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getDimensionWeight() {
  const sliders = [...document.querySelectorAll('input[type="range"][data-dimension]')];
  const total = sliders.reduce((sum, slider) => sum + Number(slider.value), 0) || 1;
  return sliders.reduce((accumulator, slider) => {
    accumulator[slider.dataset.dimension] = Number(slider.value) / total;
    return accumulator;
  }, {});
}

function renderSummary() {
  if (!state.currentTask) return;
  const candidates = state.currentTask.candidates;
  const dimensionCount = candidates.reduce((accumulator, candidate) => {
    accumulator[candidate.dimension] = (accumulator[candidate.dimension] || 0) + 1;
    return accumulator;
  }, {});
  const topTier = candidates.filter((candidate) => ['A', 'B'].includes(candidate.score.recommendationLevel)).length;

  elements.summaryBlock.classList.remove('empty-state');
  elements.summaryBlock.innerHTML = `
    <div class="summary-grid">
      <div>
        <p class="eyebrow">Brief summary</p>
        <h3>${escapeHtml(state.currentTask.inputSummary.featureDescription)}</h3>
        <p>Target users: ${escapeHtml(state.currentTask.inputSummary.targetUsers.join(', '))}</p>
        <p>Brand tone: ${escapeHtml((state.currentTask.inputSummary.brandTone || []).join(', ') || 'Not specified')}</p>
      </div>
      <div>
        <p class="eyebrow">Normalized input</p>
        <p>Capability: ${escapeHtml(state.currentTask.normalizedInput.coreCapability)}</p>
        <p>Benefit: ${escapeHtml(state.currentTask.normalizedInput.userBenefit)}</p>
        <p>Hint tokens: ${escapeHtml((state.currentTask.normalizedInput.tokens || []).join(', ') || 'Generic')}</p>
      </div>
    </div>
    <div class="summary-metrics">
      <div class="metric"><span>Total candidates</span><strong>${candidates.length}</strong></div>
      <div class="metric"><span>A/B recommendations</span><strong>${topTier}</strong></div>
      <div class="metric"><span>Best score</span><strong>${candidates[0].score.totalScore}</strong></div>
    </div>
    <div class="summary-metrics">
      <div class="metric"><span>Direct</span><strong>${dimensionCount.direct || 0}</strong></div>
      <div class="metric"><span>Metaphor</span><strong>${dimensionCount.metaphor || 0}</strong></div>
      <div class="metric"><span>Emotional</span><strong>${dimensionCount.emotional || 0}</strong></div>
    </div>
  `;

  elements.toolbar.classList.remove('hidden');
}

function renderCandidates() {
  if (!state.currentTask) {
    elements.candidateList.innerHTML = '';
    return;
  }

  const filter = elements.dimensionFilter.value;
  const sortKey = elements.sortBy.value;
  const candidates = [...state.currentTask.candidates]
    .filter((candidate) => filter === 'all' || candidate.dimension === filter)
    .sort((left, right) => getSortScore(right, sortKey) - getSortScore(left, sortKey));

  elements.candidateList.innerHTML = candidates
    .map((candidate) => {
      const checked = state.compareSelection.includes(candidate.id) ? 'checked' : '';
      return `
        <article class="candidate-card">
          <div class="card-head">
            <div>
              <h3>${escapeHtml(candidate.name)}</h3>
              <div class="card-tags">
                <span class="tag">${labelize(candidate.dimension)}</span>
                <span class="tag score-${candidate.score.recommendationLevel.toLowerCase()}">Level ${candidate.score.recommendationLevel}</span>
              </div>
            </div>
            <div>
              <strong>${candidate.score.totalScore}</strong>
              <p>Total score</p>
            </div>
          </div>

          <div class="card-grid">
            <section class="card-section">
              <h4>Why this name works</h4>
              <p>${escapeHtml(candidate.reason)}</p>
              <ul>
                <li><strong>Tone fit:</strong> ${escapeHtml(candidate.toneFit)}</li>
                <li><strong>Audience fit:</strong> ${escapeHtml(candidate.audienceFit)}</li>
                <li><strong>Usage:</strong> ${escapeHtml(candidate.usageSuggestion)}</li>
                <li><strong>Risk:</strong> ${escapeHtml(candidate.riskNote)}</li>
              </ul>
            </section>

            <section class="card-section">
              <h4>Feasibility review</h4>
              <ul>
                <li><strong>Pronunciation:</strong> ${escapeHtml(candidate.feasibility.pronunciation.level)} — ${escapeHtml(candidate.feasibility.pronunciation.reason)}</li>
                <li><strong>Memorability:</strong> ${escapeHtml(candidate.feasibility.memorability.level)} — ${escapeHtml(candidate.feasibility.memorability.reason)}</li>
                <li><strong>Trademark:</strong> ${escapeHtml(candidate.feasibility.trademarkRisk.level)} — ${escapeHtml(candidate.feasibility.trademarkRisk.reason)}</li>
              </ul>
            </section>
          </div>

          <section class="card-section">
            <h4>Weighted scoring</h4>
            <div class="score-grid">
              ${renderScoreItem('Clarity', candidate.score.clarity)}
              ${renderScoreItem('Brand fit', candidate.score.brandFit)}
              ${renderScoreItem('Memorability', candidate.score.memorability)}
              ${renderScoreItem('Spreadability', candidate.score.spreadability)}
              ${renderScoreItem('Uniqueness', candidate.score.uniqueness)}
              ${renderScoreItem('Registrability', candidate.score.registrability)}
            </div>
            <p>${escapeHtml(candidate.score.summary)}</p>
          </section>

          <div class="card-footer">
            <label class="compare-toggle">
              <input type="checkbox" data-compare-id="${candidate.id}" ${checked} />
              <span>Add to compare</span>
            </label>
            <span>Length: ${candidate.nameLength} characters</span>
          </div>
        </article>
      `;
    })
    .join('');

  elements.candidateList.querySelectorAll('input[data-compare-id]').forEach((input) => {
    input.addEventListener('change', () => toggleCompare(input.dataset.compareId, input.checked));
  });
}

function renderScoreItem(label, value) {
  return `<div class="score-item"><span>${label}</span><strong>${value}</strong></div>`;
}

function getSortScore(candidate, key) {
  if (key === 'totalScore') return candidate.score.totalScore;
  return candidate.score[key] || 0;
}

function toggleCompare(candidateId, checked) {
  if (checked) {
    if (state.compareSelection.length >= 4) {
      setFormMessage('You can compare up to 4 names at a time.', 'error');
      renderCandidates();
      return;
    }
    if (!state.compareSelection.includes(candidateId)) {
      state.compareSelection.push(candidateId);
    }
  } else {
    state.compareSelection = state.compareSelection.filter((id) => id !== candidateId);
  }

  renderCompareDrawer();
}

async function renderCompareDrawer() {
  if (!state.currentTask || state.compareSelection.length < 2) {
    elements.compareContent.className = 'compare-content empty-state';
    elements.compareContent.innerHTML = `
      <h3>${state.compareSelection.length ? 'Add one more candidate' : 'No candidates selected'}</h3>
      <p>${state.compareSelection.length ? 'Choose at least two names to compare.' : 'Add up to four names from the result list to unlock the comparison table.'}</p>
    `;
    return;
  }

  const response = await fetch('/api/naming/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      taskId: state.currentTask.taskId,
      candidateIds: state.compareSelection
    })
  });
  const payload = await response.json();
  const comparison = payload.data.comparison || [];

  elements.compareDrawer.classList.remove('hidden');
  elements.compareContent.className = 'compare-content';
  elements.compareContent.innerHTML = `
    <table class="compare-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Dimension</th>
          <th>Total</th>
          <th>Recommendation</th>
          <th>Strength</th>
          <th>Weakness</th>
        </tr>
      </thead>
      <tbody>
        ${comparison
          .map(
            (item) => `
              <tr>
                <td>${escapeHtml(item.name)}</td>
                <td>${labelize(item.dimension)}</td>
                <td>${item.totalScore}</td>
                <td>${item.recommendationLevel}</td>
                <td>${escapeHtml(item.strength)}</td>
                <td>${escapeHtml(item.weakness)}</td>
              </tr>
            `
          )
          .join('')}
      </tbody>
    </table>
  `;
}

function renderHistory() {
  if (!state.history.length) {
    elements.historyList.className = 'history-list empty-state';
    elements.historyList.innerHTML = '<h3>No history yet</h3><p>Completed naming tasks will appear here.</p>';
    return;
  }

  elements.historyList.className = 'history-list';
  elements.historyList.innerHTML = state.history
    .map(
      (task) => `
        <article class="history-item">
          <div class="history-item-top">
            <div>
              <h3>${escapeHtml(task.featureDescription)}</h3>
              <p>${new Date(task.createdAt).toLocaleString()}</p>
            </div>
            <div>
              ${task.topCandidates
                .map((candidate) => `<span class="tag score-${candidate.level.toLowerCase()}">${escapeHtml(candidate.name)} · ${candidate.score}</span>`)
                .join('')}
            </div>
          </div>
          <p>Target users: ${escapeHtml((task.targetUsers || []).join(', ') || 'N/A')}</p>
          <div class="history-actions">
            <button class="ghost-button" type="button" data-history-open="${task.taskId}">Open result</button>
          </div>
        </article>
      `
    )
    .join('');

  elements.historyList.querySelectorAll('[data-history-open]').forEach((button) => {
    button.addEventListener('click', async () => {
      await openHistoryTask(button.dataset.historyOpen);
      elements.historyDialog.close();
    });
  });
}

async function openHistoryTask(taskId) {
  const response = await fetch(`/api/naming/tasks/${encodeURIComponent(taskId)}`);
  const payload = await response.json();
  if (payload.code !== 0) {
    setFormMessage(payload.message || 'Failed to load task.', 'error');
    return;
  }
  state.currentTask = payload.data;
  state.compareSelection = [];
  elements.exportButton.disabled = false;
  renderSummary();
  renderCandidates();
  renderCompareDrawer();
  setFormMessage('Loaded historical naming task.', 'success');
}

async function exportCurrentTask() {
  if (!state.currentTask) return;

  const response = await fetch('/api/naming/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskId: state.currentTask.taskId, format: 'csv' })
  });
  const payload = await response.json();
  if (payload.code !== 0) {
    setFormMessage(payload.message || 'Export failed.', 'error');
    return;
  }

  window.open(payload.data.downloadUrl, '_blank');
  setFormMessage('CSV export prepared.', 'success');
}

function resetForm() {
  elements.form.reset();
  document.querySelectorAll('.chip.active').forEach((chip) => chip.classList.remove('active'));
  document.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    if (input.name === 'brandTone' || input.name === 'namingPreference') {
      input.checked = false;
    }
  });
  document.querySelectorAll('input[type="range"][data-dimension]').forEach((slider) => {
    const defaults = { direct: 30, metaphor: 20, emotional: 20, action: 30 };
    slider.value = defaults[slider.dataset.dimension];
  });
  updateDimensionLabels();
  setFormMessage(state.config.warningCopy, '');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
