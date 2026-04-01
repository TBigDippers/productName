import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTask, createTaskWithLLM, compareCandidates, getConfig } from './src/naming-engine.js';

const PORT = Number(process.env.PORT || 3000);
const __filename = fileURLToPath(import.meta.url);
const ROOT_DIR = path.dirname(__filename);
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

    sendJson(res, 404, { code: 404, message: 'Not found', data: null });
  } catch (error) {
    sendJson(res, 500, { code: 5000, message: error.message || 'Internal server error', data: null });
  }
});

server.listen(PORT, () => {
  console.log(`Naming API server is running at http://localhost:${PORT}`);
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
        generationMode: task.generationMode || 'heuristic',
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
    const mode = String(body.mode || 'heuristic');
    const result = mode === 'llm' ? await createTaskWithLLM(body) : createTask(body);
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
      sendJson(res, 400, { code: 3001, message: 'Only csv export is available in this build.', data: null });
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
    ['功能描述', task.inputSummary.featureDescription],
    ['品牌调性', task.inputSummary.brandTone.join(' | ')],
    ['目标用户', task.inputSummary.targetUsers.join(' | ')],
    ['生成模式', task.generationMode || 'heuristic'],
    ['模型', task.model || 'rule-engine'],
    ['创建时间', task.createdAt],
    [],
    [
      '名称',
      '维度',
      '命名理由',
      '调性契合',
      '受众契合',
      '使用建议',
      '发音难度',
      '记忆度',
      '商标风险',
      '清晰度',
      '品牌契合',
      '记忆得分',
      '传播力',
      '独特性',
      '可注册性',
      '综合得分',
      '推荐等级'
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

function serveFile(res, targetPath) {
  if (!fs.existsSync(targetPath) || fs.statSync(targetPath).isDirectory()) {
    sendJson(res, 404, { code: 404, message: 'File not found', data: null });
    return;
  }

  const extension = path.extname(targetPath);
  const contentType = {
    '.csv': 'text/csv; charset=utf-8'
  }[extension] || 'application/octet-stream';

  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(targetPath).pipe(res);
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
