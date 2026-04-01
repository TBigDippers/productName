const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { createTask, compareCandidates, getConfig } = require('./src/naming-engine');

const PORT = Number(process.env.PORT || 3000);
const ROOT_DIR = __dirname;
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const EXPORT_DIR = path.join(ROOT_DIR, 'exports');
const STORE_PATH = path.join(DATA_DIR, 'tasks.json');

ensureDirectory(DATA_DIR);
ensureDirectory(EXPORT_DIR);
ensureStore();

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname.startsWith('/api/')) {
      await handleApi(req, res, url);
      return;
    }

    if (url.pathname.startsWith('/exports/')) {
      serveFile(res, path.join(EXPORT_DIR, url.pathname.replace('/exports/', '')));
      return;
    }

    if (req.method === 'GET') {
      const target = url.pathname === '/' ? path.join(PUBLIC_DIR, 'index.html') : path.join(PUBLIC_DIR, url.pathname);
      serveFile(res, target, path.join(PUBLIC_DIR, 'index.html'));
      return;
    }

    sendJson(res, 404, { code: 404, message: 'Not found', data: null });
  } catch (error) {
    sendJson(res, 500, { code: 5000, message: error.message || 'Internal server error', data: null });
  }
});

server.listen(PORT, () => {
  console.log(`Naming generator is running at http://localhost:${PORT}`);
});

async function handleApi(req, res, url) {
  if (req.method === 'GET' && url.pathname === '/api/naming/config') {
    sendJson(res, 200, { code: 0, message: 'success', data: getConfig() });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/naming/tasks') {
    const store = readStore();
    const tasks = store.tasks
      .slice()
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .map((task) => ({
        taskId: task.taskId,
        createdAt: task.createdAt,
        featureDescription: task.inputSummary.featureDescription,
        targetUsers: task.inputSummary.targetUsers,
        topCandidates: task.candidates.slice(0, 3).map((candidate) => ({
          id: candidate.id,
          name: candidate.name,
          score: candidate.score.totalScore,
          level: candidate.score.recommendationLevel
        }))
      }));
    sendJson(res, 200, { code: 0, message: 'success', data: { tasks } });
    return;
  }

  if (req.method === 'GET' && url.pathname.startsWith('/api/naming/tasks/')) {
    const taskId = decodeURIComponent(url.pathname.split('/').pop());
    const task = findTask(taskId);
    if (!task) {
      sendJson(res, 404, { code: 4040, message: 'Task not found', data: null });
      return;
    }
    sendJson(res, 200, { code: 0, message: 'success', data: task });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/naming/generate') {
    const body = await readBody(req);
    const result = createTask(body);
    if (!result.ok) {
      sendJson(res, 400, { code: 1002, message: result.errors.join(' '), data: null });
      return;
    }

    const store = readStore();
    store.tasks.push(result.data);
    writeStore(store);

    sendJson(res, 200, { code: 0, message: 'success', data: result.data });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/naming/compare') {
    const body = await readBody(req);
    const task = findTask(body.taskId);
    if (!task) {
      sendJson(res, 404, { code: 4040, message: 'Task not found', data: null });
      return;
    }

    const candidateIds = Array.isArray(body.candidateIds) ? body.candidateIds : [];
    if (candidateIds.length < 2 || candidateIds.length > 4) {
      sendJson(res, 400, { code: 1002, message: 'candidateIds must contain 2 to 4 ids.', data: null });
      return;
    }

    const comparison = compareCandidates(task, candidateIds);
    sendJson(res, 200, { code: 0, message: 'success', data: { comparison } });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/naming/export') {
    const body = await readBody(req);
    if (body.format !== 'csv') {
      sendJson(res, 400, { code: 3001, message: 'Only csv export is available in this MVP build.', data: null });
      return;
    }

    const task = findTask(body.taskId);
    if (!task) {
      sendJson(res, 404, { code: 4040, message: 'Task not found', data: null });
      return;
    }

    const fileName = `${task.taskId}.csv`;
    const filePath = path.join(EXPORT_DIR, fileName);
    fs.writeFileSync(filePath, buildCsv(task), 'utf8');

    sendJson(res, 200, {
      code: 0,
      message: 'success',
      data: { downloadUrl: `/exports/${fileName}` }
    });
    return;
  }

  sendJson(res, 404, { code: 404, message: 'Not found', data: null });
}

function buildCsv(task) {
  const lines = [
    ['Feature Description', task.inputSummary.featureDescription],
    ['Brand Tone', task.inputSummary.brandTone.join(' | ')],
    ['Target Users', task.inputSummary.targetUsers.join(' | ')],
    ['Created At', task.createdAt],
    [],
    [
      'Name',
      'Dimension',
      'Reason',
      'Tone Fit',
      'Audience Fit',
      'Usage Suggestion',
      'Pronunciation',
      'Memorability',
      'Trademark Risk',
      'Clarity',
      'Brand Fit',
      'Memorability Score',
      'Spreadability',
      'Uniqueness',
      'Registrability',
      'Total Score',
      'Recommendation Level'
    ]
  ];

  task.candidates.forEach((candidate) => {
    lines.push([
      candidate.name,
      candidate.dimension,
      candidate.reason,
      candidate.toneFit,
      candidate.audienceFit,
      candidate.usageSuggestion,
      `${candidate.feasibility.pronunciation.level}: ${candidate.feasibility.pronunciation.reason}`,
      `${candidate.feasibility.memorability.level}: ${candidate.feasibility.memorability.reason}`,
      `${candidate.feasibility.trademarkRisk.level}: ${candidate.feasibility.trademarkRisk.reason}`,
      candidate.score.clarity,
      candidate.score.brandFit,
      candidate.score.memorability,
      candidate.score.spreadability,
      candidate.score.uniqueness,
      candidate.score.registrability,
      candidate.score.totalScore,
      candidate.score.recommendationLevel
    ]);
  });

  return lines.map((row) => row.map(escapeCsv).join(',')).join('\n');
}

function escapeCsv(value) {
  const text = value == null ? '' : String(value);
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function ensureDirectory(target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
}

function ensureStore() {
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify({ tasks: [] }, null, 2), 'utf8');
  }
}

function readStore() {
  return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
}

function writeStore(store) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

function findTask(taskId) {
  const store = readStore();
  return store.tasks.find((task) => task.taskId === taskId);
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(payload));
}

function serveFile(res, targetPath, fallbackPath) {
  let filePath = targetPath;
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    if (!fallbackPath) {
      sendJson(res, 404, { code: 404, message: 'File not found', data: null });
      return;
    }
    filePath = fallbackPath;
  }

  const extension = path.extname(filePath);
  const contentType = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.csv': 'text/csv; charset=utf-8'
  }[extension] || 'application/octet-stream';

  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      if (!chunks.length) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (error) {
        reject(new Error('Invalid JSON body.'));
      }
    });
    req.on('error', reject);
  });
}
