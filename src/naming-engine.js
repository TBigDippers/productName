const crypto = require('node:crypto');

const CONFIG = {
  brandToneOptions: [
    'professional',
    'reliable',
    'warm',
    'young',
    'technology',
    'minimal',
    'premium',
    'friendly'
  ],
  namingPreferenceOptions: [
    'concise',
    'easy_to_remember',
    'brand_forward',
    'feature_forward',
    'young_style',
    'professional_style'
  ],
  industries: ['general', 'ecommerce', 'finance', 'office', 'education', 'local_service', 'content'],
  defaultDimensionWeight: {
    direct: 0.3,
    metaphor: 0.2,
    emotional: 0.2,
    action: 0.3
  },
  warningCopy: 'Trademark risk is an advisory heuristic only and not legal advice.'
};

const HARD_PRONUNCIATION_CHARS = ['攥', '飙', '璨', '巅', '曜', '翎', '翊', '曦'];
const GENERIC_WORDS = ['assistant', 'center', 'service', 'system', 'reminder', 'management', 'record'];
const METAPHOR_WORDS = ['radar', 'beacon', 'engine', 'compass', 'echo', 'harbor', 'signal'];
const EMOTION_WORDS = ['calm', 'easy', 'warm', 'steady', 'care', 'bright'];

const SCENARIOS = [
  {
    key: 'price_alert',
    patterns: [/price/i, /discount/i, /deal/i, /coupon/i, /ecommerce/i, /降价/, /价格/, /商品/, /优惠/, /好价/],
    capability: 'price tracking',
    benefit: 'timely deal discovery',
    direct: ['Price Ping', 'Deal Alert', 'Price Watch'],
    action: ['Track Deal', 'Watch Price', 'Hold Price'],
    metaphor: ['Deal Radar', 'Price Beacon', 'Value Compass'],
    emotional: ['Easy Deal', 'Calm Price', 'Value Care']
  },
  {
    key: 'meeting_notes',
    patterns: [/meeting/i, /notes/i, /minutes/i, /summary/i, /memo/i, /会议/, /纪要/, /待办/, /总结/],
    capability: 'meeting summarization',
    benefit: 'faster alignment',
    direct: ['Meeting Notes', 'Minutes Helper', 'Action Summary'],
    action: ['Capture Notes', 'Wrap Meeting', 'Track Actions'],
    metaphor: ['Insight Echo', 'Focus Engine', 'Agenda Beacon'],
    emotional: ['Easy Minutes', 'Clear Follow-up', 'Calm Recap']
  },
  {
    key: 'savings',
    patterns: [/save/i, /saving/i, /budget/i, /finance/i, /money/i, /攒钱/, /存钱/, /理财/, /预算/],
    capability: 'automatic saving',
    benefit: 'steady money habits',
    direct: ['Auto Save', 'Smart Savings', 'Savings Plan'],
    action: ['Save More', 'Grow Cash', 'Stack Savings'],
    metaphor: ['Money Harbor', 'Future Jar', 'Wealth Ladder'],
    emotional: ['Steady Save', 'Calm Savings', 'Care Fund']
  },
  {
    key: 'analytics',
    patterns: [/report/i, /dashboard/i, /analytics/i, /analysis/i, /insight/i, /数据/, /分析/, /报表/, /洞察/],
    capability: 'data insight',
    benefit: 'faster decisions',
    direct: ['Insight Panel', 'Report Hub', 'Data Brief'],
    action: ['Find Insight', 'Scan Trends', 'Read Signals'],
    metaphor: ['Signal Radar', 'Trend Compass', 'Insight Beacon'],
    emotional: ['Clear Insight', 'Easy Report', 'Calm View']
  },
  {
    key: 'assistant',
    patterns: [/assistant/i, /copilot/i, /agent/i, /help/i, /assist/i, /助手/, /智能/, /问答/, /协助/],
    capability: 'guided assistance',
    benefit: 'lower task effort',
    direct: ['Task Assistant', 'Smart Helper', 'Work Copilot'],
    action: ['Guide Me', 'Do Faster', 'Ask Smart'],
    metaphor: ['Task Compass', 'Guide Beacon', 'Flow Engine'],
    emotional: ['Easy Helper', 'Care Guide', 'Calm Assist']
  },
  {
    key: 'protection',
    patterns: [/secure/i, /protection/i, /safety/i, /risk/i, /guard/i, /安全/, /保护/, /风控/, /守护/],
    capability: 'risk protection',
    benefit: 'greater confidence',
    direct: ['Safety Guard', 'Risk Shield', 'Secure Watch'],
    action: ['Guard Now', 'Watch Risk', 'Protect Flow'],
    metaphor: ['Safety Beacon', 'Shield Harbor', 'Risk Radar'],
    emotional: ['Calm Guard', 'Safe Care', 'Steady Shield']
  }
];

function normalizeList(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))];
  }
  return [...new Set(String(value).split(/[,\n]/).map((item) => item.trim()).filter(Boolean))];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function scoreTextMatch(description, patterns) {
  return patterns.reduce((score, pattern) => score + (pattern.test(description) ? 1 : 0), 0);
}

function pickScenario(description, industry) {
  const lowered = `${description} ${industry}`;
  const scenario = SCENARIOS
    .map((item) => ({ item, score: scoreTextMatch(lowered, item.patterns) }))
    .sort((left, right) => right.score - left.score)[0];

  if (!scenario || scenario.score === 0) {
    return {
      key: 'generic',
      capability: inferCapability(description),
      benefit: inferBenefit(description),
      direct: [],
      action: [],
      metaphor: [],
      emotional: []
    };
  }

  return scenario.item;
}

function inferCapability(description) {
  const rules = [
    { pattern: /提醒|通知|notify|alert/i, value: 'timely reminders' },
    { pattern: /分析|洞察|report|insight|analysis/i, value: 'faster insight' },
    { pattern: /记录|纪要|summary|notes|record/i, value: 'structured records' },
    { pattern: /管理|整理|organize|manage/i, value: 'simpler management' },
    { pattern: /推荐|发现|recommend|discover/i, value: 'better discovery' },
    { pattern: /安全|保护|secure|protect/i, value: 'safer workflows' }
  ];

  const matched = rules.find((rule) => rule.pattern.test(description));
  return matched ? matched.value : 'clear product value';
}

function inferBenefit(description) {
  const rules = [
    { pattern: /快速|高效|fast|efficient/i, value: 'greater efficiency' },
    { pattern: /安心|稳|safe|confidence/i, value: 'greater confidence' },
    { pattern: /省钱|省|save/i, value: 'better value' },
    { pattern: /自动|智能|auto|smart/i, value: 'less manual effort' },
    { pattern: /发现|增长|discover|growth/i, value: 'more opportunity' }
  ];

  const matched = rules.find((rule) => rule.pattern.test(description));
  return matched ? matched.value : 'clearer outcomes';
}

function extractHintTokens(description) {
  const tokenRules = [
    { pattern: /price|deal|discount|降价|价格|好价|优惠/i, token: 'price' },
    { pattern: /meeting|minutes|summary|纪要|会议|待办/i, token: 'meeting' },
    { pattern: /save|saving|money|攒钱|存钱|理财/i, token: 'save' },
    { pattern: /report|analysis|insight|数据|分析|报表/i, token: 'insight' },
    { pattern: /assistant|copilot|help|助手|协助/i, token: 'assist' },
    { pattern: /protect|secure|安全|保护/i, token: 'guard' },
    { pattern: /track|monitor|追踪|监测/i, token: 'track' },
    { pattern: /plan|arrange|schedule|规划|安排/i, token: 'plan' }
  ];

  return tokenRules.filter((rule) => rule.pattern.test(description)).map((rule) => rule.token);
}

function buildGenericNames(parsed) {
  const primary = parsed.tokens[0] || 'value';
  const secondary = parsed.tokens[1] || 'flow';
  const benefitWord = parsed.brandTone.includes('warm') ? 'care' : parsed.brandTone.includes('technology') ? 'engine' : 'plus';

  return {
    direct: [`${capitalize(primary)} Helper`, `${capitalize(primary)} Guide`, `${capitalize(primary)} Center`],
    action: [`Track ${capitalize(primary)}`, `Boost ${capitalize(secondary)}`, `Shape ${capitalize(primary)}`],
    metaphor: [`${capitalize(primary)} Beacon`, `${capitalize(secondary)} Compass`, `${capitalize(primary)} Harbor`],
    emotional: [`Easy ${capitalize(primary)}`, `Calm ${capitalize(primary)}`, `${capitalize(primary)} Care`]
  };
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getDimensionQuota(weight = CONFIG.defaultDimensionWeight) {
  const safeWeight = { ...CONFIG.defaultDimensionWeight, ...weight };
  const total = Object.values(safeWeight).reduce((sum, current) => sum + current, 0) || 1;
  const normalized = Object.fromEntries(
    Object.entries(safeWeight).map(([key, value]) => [key, value / total])
  );

  const raw = Object.fromEntries(
    Object.entries(normalized).map(([key, value]) => [key, Math.floor(value * 10)])
  );

  let assigned = Object.values(raw).reduce((sum, value) => sum + value, 0);
  const order = Object.entries(normalized).sort((left, right) => right[1] - left[1]);
  let cursor = 0;
  while (assigned < 10) {
    raw[order[cursor % order.length][0]] += 1;
    assigned += 1;
    cursor += 1;
  }

  return raw;
}

function buildCandidatePools(parsed) {
  const scenario = pickScenario(parsed.featureDescription, parsed.industry);
  const generic = buildGenericNames(parsed);
  const toneBias = buildToneBias(parsed.brandTone);

  return {
    direct: [...scenario.direct, ...toneBias.direct, ...generic.direct],
    metaphor: [...scenario.metaphor, ...toneBias.metaphor, ...generic.metaphor],
    emotional: [...scenario.emotional, ...toneBias.emotional, ...generic.emotional],
    action: [...scenario.action, ...toneBias.action, ...generic.action]
  };
}

function buildToneBias(brandTone) {
  const toneSet = new Set(brandTone);
  return {
    direct: [
      toneSet.has('professional') ? 'Pro Guide' : null,
      toneSet.has('reliable') ? 'Trust Guide' : null,
      toneSet.has('minimal') ? 'Clear Flow' : null
    ].filter(Boolean),
    metaphor: [
      toneSet.has('technology') ? 'Signal Engine' : null,
      toneSet.has('premium') ? 'Prime Beacon' : null,
      toneSet.has('reliable') ? 'Trust Compass' : null
    ].filter(Boolean),
    emotional: [
      toneSet.has('warm') ? 'Warm Care' : null,
      toneSet.has('friendly') ? 'Easy Buddy' : null,
      toneSet.has('young') ? 'Bright Move' : null
    ].filter(Boolean),
    action: [
      toneSet.has('young') ? 'Move Fast' : null,
      toneSet.has('technology') ? 'Run Smart' : null,
      toneSet.has('professional') ? 'Lead Clear' : null
    ].filter(Boolean)
  };
}

function sanitizeCandidates(items, forbiddenWords) {
  const forbiddenSet = new Set(forbiddenWords.map((item) => item.toLowerCase()));
  const seen = new Set();
  const results = [];

  for (const item of items) {
    if (!item || !item.name) continue;
    const name = item.name.trim();
    const lowered = name.toLowerCase();
    if (name.length < 3 || name.length > 24) continue;
    if (forbiddenWords.some((word) => lowered.includes(word.toLowerCase()))) continue;
    if (seen.has(lowered)) continue;
    if ([...forbiddenSet].some((word) => lowered.includes(word))) continue;
    seen.add(lowered);
    results.push({ ...item, name });
  }

  return results;
}

function takeByDimension(pools, quota, forbiddenWords) {
  const picked = [];
  const seen = new Set();

  for (const dimension of ['direct', 'metaphor', 'emotional', 'action']) {
    let count = 0;
    for (const name of pools[dimension] || []) {
      const normalized = name.toLowerCase();
      if (seen.has(normalized)) continue;
      if (forbiddenWords.some((word) => normalized.includes(word.toLowerCase()))) continue;
      seen.add(normalized);
      picked.push({ name, dimension });
      count += 1;
      if (count >= (quota[dimension] || 0)) break;
    }
  }

  if (picked.length < 10) {
    const merged = ['direct', 'metaphor', 'emotional', 'action'].flatMap((dimension) =>
      (pools[dimension] || []).map((name) => ({ name, dimension }))
    );
    for (const item of merged) {
      const normalized = item.name.toLowerCase();
      if (seen.has(normalized)) continue;
      if (forbiddenWords.some((word) => normalized.includes(word.toLowerCase()))) continue;
      seen.add(normalized);
      picked.push(item);
      if (picked.length >= 10) break;
    }
  }

  return sanitizeCandidates(picked, forbiddenWords).slice(0, 10);
}

function evaluatePronunciation(name) {
  const hasHardChar = HARD_PRONUNCIATION_CHARS.some((char) => name.includes(char));
  if (!hasHardChar && name.length <= 11) {
    return {
      level: 'low',
      reason: 'Short and easy to say with no unusual pronunciation burden.'
    };
  }
  if (name.length <= 16) {
    return {
      level: 'medium',
      reason: 'Readable overall, but the rhythm or length may slow verbal recall.'
    };
  }
  return {
    level: 'high',
    reason: 'Long or complex wording will be harder to speak and repeat quickly.'
  };
}

function evaluateMemorability(name, dimension) {
  const shortLength = name.length >= 4 && name.length <= 12;
  const expressive = dimension === 'action' || dimension === 'metaphor';
  if (shortLength && expressive) {
    return {
      level: 'strong',
      reason: 'Compact wording with either action or imagery makes it easier to remember.'
    };
  }
  if (shortLength) {
    return {
      level: 'medium',
      reason: 'Length is manageable, but the wording is more descriptive than distinctive.'
    };
  }
  return {
    level: 'weak',
    reason: 'Long or generic wording weakens memory retention.'
  };
}

function evaluateTrademarkRisk(name, dimension) {
  const lowered = name.toLowerCase();
  const genericHit = GENERIC_WORDS.some((word) => lowered.includes(word));
  const metaphorHit = METAPHOR_WORDS.some((word) => lowered.includes(word));
  if (dimension === 'direct' && genericHit) {
    return {
      level: 'high',
      reason: 'Directly descriptive wording tends to have weaker distinctiveness for trademark purposes.'
    };
  }
  if (metaphorHit || dimension === 'metaphor' || dimension === 'emotional') {
    return {
      level: 'medium',
      reason: 'The combination is more distinctive than a pure function label, but still needs formal clearance.'
    };
  }
  return {
    level: 'medium',
    reason: 'Distinctiveness looks workable at a glance, but formal search is still required.'
  };
}

function scoreCandidate(candidate, parsed, feasibility) {
  const lowered = candidate.name.toLowerCase();
  const tokenMatch = parsed.tokens.some((token) => lowered.includes(token));
  const shortLength = candidate.name.length <= 12;
  const directness = candidate.dimension === 'direct';
  const vividness = candidate.dimension === 'action' || candidate.dimension === 'metaphor';
  const emotionalFit = candidate.dimension === 'emotional';
  const genericHit = GENERIC_WORDS.some((word) => lowered.includes(word));

  let clarity = 5 + (directness ? 2 : 0) + (tokenMatch ? 2 : 0) + (shortLength ? 1 : -1);
  if (candidate.dimension === 'metaphor') clarity -= 1;

  let brandFit = 6;
  if (parsed.brandTone.includes('professional') && (directness || lowered.includes('pro'))) brandFit += 2;
  if (parsed.brandTone.includes('reliable') && lowered.includes('trust')) brandFit += 2;
  if (parsed.brandTone.includes('technology') && (lowered.includes('engine') || lowered.includes('signal'))) brandFit += 2;
  if (parsed.brandTone.includes('warm') && emotionalFit) brandFit += 2;
  if (parsed.brandTone.includes('young') && candidate.dimension === 'action') brandFit += 1;
  if (parsed.brandTone.includes('minimal') && shortLength) brandFit += 1;

  let memorability = 4 + (shortLength ? 3 : 0) + (vividness ? 2 : 0) + (genericHit ? -2 : 1);
  let spreadability = 4 + (shortLength ? 2 : 0) + (candidate.dimension === 'action' ? 2 : 0) + (feasibility.pronunciation.level === 'low' ? 2 : 0);
  let uniqueness = 5 + (candidate.dimension === 'metaphor' ? 2 : 0) + (candidate.dimension === 'emotional' ? 1 : 0) + (genericHit ? -3 : 1);
  let registrability = 5 + (feasibility.trademarkRisk.level === 'high' ? -2 : 1) + (genericHit ? -2 : 1) + (candidate.dimension === 'metaphor' ? 1 : 0);

  clarity = clamp(clarity, 0, 10);
  brandFit = clamp(brandFit, 0, 10);
  memorability = clamp(memorability, 0, 10);
  spreadability = clamp(spreadability, 0, 10);
  uniqueness = clamp(uniqueness, 0, 10);
  registrability = clamp(registrability, 0, 10);

  const totalScore = Math.round(
    clarity * 2.5 +
      brandFit * 2.0 +
      memorability * 2.0 +
      spreadability * 1.5 +
      uniqueness * 1.0 +
      registrability * 1.0
  );

  return {
    clarity,
    brandFit,
    memorability,
    spreadability,
    uniqueness,
    registrability,
    totalScore,
    recommendationLevel: mapRecommendationLevel(totalScore),
    summary: buildScoreSummary({ clarity, brandFit, memorability, spreadability, uniqueness, registrability, totalScore })
  };
}

function buildScoreSummary(score) {
  const strengths = [];
  const risks = [];
  if (score.clarity >= 8) strengths.push('clear meaning');
  if (score.memorability >= 8) strengths.push('strong recall');
  if (score.spreadability >= 8) strengths.push('good verbal spread');
  if (score.uniqueness <= 5) risks.push('limited differentiation');
  if (score.registrability <= 5) risks.push('needs careful trademark screening');

  const positive = strengths.length ? strengths.join(', ') : 'balanced naming profile';
  const caution = risks.length ? `; watch for ${risks.join(', ')}` : '';
  return `${positive}${caution}.`;
}

function mapRecommendationLevel(score) {
  if (score >= 85) return 'A';
  if (score >= 75) return 'B';
  if (score >= 65) return 'C';
  if (score >= 50) return 'D';
  return 'E';
}

function buildToneFit(parsed, candidate) {
  if (!parsed.brandTone.length) {
    return 'Designed to stay neutral enough for broad product naming use.';
  }

  const toneDescriptions = {
    professional: 'structured and business-ready',
    reliable: 'steady and trustworthy',
    warm: 'supportive and approachable',
    young: 'light and energetic',
    technology: 'smart and future-facing',
    minimal: 'clean and concise',
    premium: 'elevated and polished',
    friendly: 'easy and welcoming'
  };

  const resolved = parsed.brandTone.map((tone) => toneDescriptions[tone] || tone).join(', ');
  return `Aligned with a ${resolved} tone, while staying suitable for ${candidate.dimension} naming.`;
}

function buildAudienceFit(parsed) {
  if (!parsed.targetUsers.length) {
    return 'Broad enough for general product users.';
  }
  return `Easy to understand for ${parsed.targetUsers.join(', ')} with a low interpretation burden.`;
}

function buildUsageSuggestion(candidate) {
  const mapping = {
    direct: 'Best for settings, feature pages, and labels that need immediate understanding.',
    metaphor: 'Best for branded modules, campaign surfaces, and naming that needs more distinction.',
    emotional: 'Best for service-oriented journeys, memberships, and reassurance-focused touchpoints.',
    action: 'Best for buttons, entry points, and high-frequency user actions.'
  };
  return mapping[candidate.dimension] || 'Suitable for general feature naming.';
}

function buildReason(parsed, candidate, scenario) {
  const benefit = scenario.benefit || parsed.userBenefit;
  if (candidate.dimension === 'direct') {
    return `States the core capability directly, so users can quickly connect the name with ${scenario.capability || parsed.coreCapability}.`;
  }
  if (candidate.dimension === 'metaphor') {
    return `Uses imagery to express ${benefit}, giving the feature more identity than a plain function label.`;
  }
  if (candidate.dimension === 'emotional') {
    return `Highlights the feeling of ${benefit}, which works well when the experience should feel supportive or reassuring.`;
  }
  return `Leans on an action-oriented phrase, making the feature feel immediate and easy to activate.`;
}

function buildRiskNote(score, feasibility) {
  const notes = [];
  if (score.clarity <= 6) notes.push('meaning may need added context');
  if (score.registrability <= 5) notes.push('run a trademark search before shipping');
  if (feasibility.pronunciation.level !== 'low') notes.push('spoken recall may be weaker');
  return notes.length ? `${notes.join('; ')}.` : 'No major risk beyond standard brand review.';
}

function normalizeDimensionWeight(weight) {
  const base = { ...CONFIG.defaultDimensionWeight };
  if (!weight || typeof weight !== 'object') return base;
  const next = {};
  for (const key of Object.keys(base)) {
    const numeric = Number(weight[key]);
    next[key] = Number.isFinite(numeric) && numeric >= 0 ? numeric : base[key];
  }
  const total = Object.values(next).reduce((sum, value) => sum + value, 0);
  if (!total) return base;
  return Object.fromEntries(Object.entries(next).map(([key, value]) => [key, value / total]));
}

function parseInput(input) {
  const featureDescription = String(input.featureDescription || '').trim();
  const brandTone = normalizeList(input.brandTone).map((item) => item.toLowerCase());
  const targetUsers = normalizeList(input.targetUsers);
  const namingPreference = normalizeList(input.namingPreference).map((item) => item.toLowerCase());
  const forbiddenWords = normalizeList(input.forbiddenWords);
  const industry = String(input.industry || 'general').trim().toLowerCase();
  const language = String(input.language || 'en-US').trim();
  const dimensionWeight = normalizeDimensionWeight(input.dimensionWeight);
  const tokens = extractHintTokens(featureDescription);
  const scenario = pickScenario(featureDescription, industry);

  return {
    featureDescription,
    brandTone,
    targetUsers,
    namingPreference,
    forbiddenWords,
    industry,
    language,
    dimensionWeight,
    tokens,
    coreCapability: scenario.capability || inferCapability(featureDescription),
    userBenefit: scenario.benefit || inferBenefit(featureDescription)
  };
}

function validateInput(parsed) {
  const errors = [];
  if (!parsed.featureDescription || parsed.featureDescription.length < 10) {
    errors.push('featureDescription must be at least 10 characters long.');
  }
  if (!parsed.targetUsers.length) {
    errors.push('targetUsers is required.');
  }
  return errors;
}

function createTask(input) {
  const parsed = parseInput(input);
  const errors = validateInput(parsed);
  if (errors.length) {
    return {
      ok: false,
      errors
    };
  }

  const scenario = pickScenario(parsed.featureDescription, parsed.industry);
  const pools = buildCandidatePools(parsed);
  const quota = getDimensionQuota(parsed.dimensionWeight);
  const baseCandidates = takeByDimension(pools, quota, parsed.forbiddenWords).map((candidate, index) => {
    const feasibility = {
      pronunciation: evaluatePronunciation(candidate.name),
      memorability: evaluateMemorability(candidate.name, candidate.dimension),
      trademarkRisk: evaluateTrademarkRisk(candidate.name, candidate.dimension)
    };
    const score = scoreCandidate(candidate, parsed, feasibility);

    return {
      id: `cand_${index + 1}_${crypto.randomBytes(3).toString('hex')}`,
      name: candidate.name,
      dimension: candidate.dimension,
      nameLength: candidate.name.length,
      keywordSource: parsed.tokens,
      reason: buildReason(parsed, candidate, scenario),
      toneFit: buildToneFit(parsed, candidate),
      audienceFit: buildAudienceFit(parsed),
      usageSuggestion: buildUsageSuggestion(candidate),
      riskNote: buildRiskNote(score, feasibility),
      feasibility,
      score
    };
  });

  const candidates = baseCandidates.sort((left, right) => right.score.totalScore - left.score.totalScore);
  const taskId = `task_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

  return {
    ok: true,
    data: {
      taskId,
      status: 'completed',
      createdAt: new Date().toISOString(),
      inputSummary: {
        featureDescription: parsed.featureDescription,
        brandTone: parsed.brandTone,
        targetUsers: parsed.targetUsers,
        namingPreference: parsed.namingPreference,
        industry: parsed.industry,
        language: parsed.language
      },
      normalizedInput: {
        coreCapability: parsed.coreCapability,
        userBenefit: parsed.userBenefit,
        toneTags: parsed.brandTone,
        audienceTags: parsed.targetUsers,
        styleTags: parsed.namingPreference,
        tokens: parsed.tokens
      },
      candidates
    }
  };
}

function compareCandidates(task, candidateIds) {
  const selected = task.candidates.filter((candidate) => candidateIds.includes(candidate.id)).slice(0, 4);
  return selected.map((candidate) => {
    const scores = candidate.score;
    const ordered = [
      ['clarity', scores.clarity],
      ['brand fit', scores.brandFit],
      ['memorability', scores.memorability],
      ['spreadability', scores.spreadability],
      ['uniqueness', scores.uniqueness],
      ['registrability', scores.registrability]
    ].sort((left, right) => right[1] - left[1]);

    return {
      candidateId: candidate.id,
      name: candidate.name,
      dimension: candidate.dimension,
      totalScore: candidate.score.totalScore,
      recommendationLevel: candidate.score.recommendationLevel,
      strength: `Strongest on ${ordered[0][0]} and ${ordered[1][0]}.`,
      weakness: `Relatively weaker on ${ordered[ordered.length - 1][0]}.`,
      detail: candidate
    };
  });
}

function getConfig() {
  return CONFIG;
}

module.exports = {
  createTask,
  compareCandidates,
  getConfig
};
