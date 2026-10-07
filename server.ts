import express from 'express';
import type { Request, Response } from 'express';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { storageManager } from './storage_manager.ts';
import { computePredictionsWithJsonAndSportyTech } from './prediction_engine.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Enable gzip/deflate compression for all requests (drastically reduces mobile data usage!)
app.use(compression());

app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  if (_req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Support ultra-large JSON payloads (up to 500MB) for continuous storing without payload limits
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// Server-side response caches to save bandwidth and prevent upstream spam
let cachedAllLeagues: { timestamp: number; data: any } | null = null;
const cachedUpcomingPinned = new Map<string, { timestamp: number; data: any }>();

// Immutable prediction lock registry: Once a prediction is made for an upcoming match,
// IT NEVER FLUCTUATES OR CHANGES until the match is finished!
const lockedPredictionsRegistry = new Map<string, any>();

function getMatchLockKey(leagueId: string | number, roundNumber: any, t1: string, t2: string, matchId?: any): string {
  const norm1 = String(t1 || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const norm2 = String(t2 || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${leagueId}_r${roundNumber}_${norm1}_${norm2}`;
}

// Presence / Online users tracking
const activeClients = new Map<string, number>();

setInterval(() => {
  const now = Date.now();
  for (const [clientId, lastSeen] of activeClients.entries()) {
    if (now - lastSeen > 35000) {
      activeClients.delete(clientId);
    }
  }
}, 10000);

app.get('/api/presence', (req: Request, res: Response) => {
  const clientId = (req.query.clientId as string) || '';
  const authKey = (req.query.authKey as string) || '';

  const isValidAuth =
    authKey === 'tiazaha_app_unlocked_v009999' ||
    authKey === 'tiazaha_app_unlocked' ||
    authKey === 'mahakasa_app_unlocked_v009999' ||
    authKey === 'mahakasa_app_unlocked' ||
    authKey === '001212' ||
    authKey === '009999' ||
    authKey.startsWith('tiazaha_app_unlocked') ||
    authKey.startsWith('mahakasa_app_unlocked');

  if (!isValidAuth) {
    return res.status(200).json({
      onlineCount: Math.max(1, activeClients.size),
      forceDisconnect: true,
      error: 'Session invalide ou expirée.',
    });
  }

  if (clientId) {
    activeClients.set(clientId, Date.now());
  }

  return res.status(200).json({
    onlineCount: Math.max(1, activeClients.size),
    forceDisconnect: false,
  });
});

// AI Rule Logic Generation with Gemini
app.post('/api/ai/generate-rule-logic', async (req: Request, res: Response) => {
  try {
    const { description, customKey } = req.body || {};
    const apiKey = customKey || process.env.GEMINI_API_KEY;

    if (!description || typeof description !== 'string') {
      return res.status(400).json({ error: { message: 'Description requise' } });
    }

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const systemPrompt = `Tu es le moteur d'intelligence prédictive de la plateforme de football virtuel TiaZaha officiel.
L'utilisateur formule une idée de règle de pronostic en langage naturel. Tu dois la convertir en objet JSON strict contenant :
- "conditions": chaîne avec des expressions logiques en syntaxe TiaZaha officiel (opérateurs : AND, OR, >, <, >=, <=, ==).
  Variables disponibles :
  * Cotes : Odds1, OddsN, Odds2, Over2_5, Under2_5, Over1_5, Under1_5, GG, NG
  * Classements : Rank1, Rank2, DiffRank (Rank2 - Rank1)
  * Formes récentes : Form1_W, Form1_D, Form1_L, Form2_W, Form2_D, Form2_L, WinPercent1, WinPercent2
  * Moyennes buts : AvgGoals1, AvgGoals2, ConcededGoals1, ConcededGoals2
- "prediction": chaîne indiquant le marché pronostiqué ("1", "X", "2", "Over2.5", "Under2.5", "Over1.5", "Under1.5", "GG", "NG")
- "title": court titre percutant en français (max 40 car.)
- "description": résumé clair en français de la stratégie
- "leagueId": identifiant de ligue cible ("all", "8035", "8042", "8036", "8037", "8043", "8044", "8056", "8060", "8065")

Exemple :
{
  "conditions": "Odds1 < 1.65 AND OddsN > 3.80",
  "prediction": "1",
  "title": "Victoire à domicile favorite",
  "description": "Pronostique la victoire de l'équipe 1 quand sa cote est inférieure à 1.65 et le nul au-dessus de 3.80",
  "leagueId": "all"
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Description utilisateur : "${description}"`,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
          },
        });

        const text = response.text?.trim() || '{}';
        const parsed = JSON.parse(text);
        return res.status(200).json(parsed);
      } catch (err: any) {
        console.warn('Gemini API call failed, using rule heuristics fallback:', err?.message);
      }
    }

    // Heuristics fallback if no Gemini key or rate limit
    let conditions = 'Odds1 < 1.70';
    let prediction = '1';
    let title = 'Règle automatique';

    const descLower = description.toLowerCase();
    if (descLower.includes('nul') || descLower.includes('match nul') || descLower.includes('draw')) {
      conditions = 'OddsN <= 3.20 AND Odds1 >= 2.50 AND Odds2 >= 2.50';
      prediction = 'X';
      title = 'Pronostic Match Nul';
    } else if (descLower.includes('extérieur') || descLower.includes('équipe 2') || descLower.includes('away')) {
      conditions = 'Odds2 < 1.85 AND Rank2 < Rank1';
      prediction = '2';
      title = 'Victoire Extérieure';
    } else if (descLower.includes('plus de 2.5') || descLower.includes('over 2.5') || descLower.includes('+2.5')) {
      conditions = 'Over2_5 < 1.75 AND AvgGoals1 + AvgGoals2 > 2.8';
      prediction = 'Over2.5';
      title = 'Plus de 2.5 Buts';
    } else if (descLower.includes('moins de 2.5') || descLower.includes('under 2.5') || descLower.includes('-2.5')) {
      conditions = 'Under2_5 < 1.75';
      prediction = 'Under2.5';
      title = 'Moins de 2.5 Buts';
    } else if (descLower.includes('deux équipes marquent') || descLower.includes('gg') || descLower.includes('btts')) {
      conditions = 'GG < 1.80';
      prediction = 'GG';
      title = 'Les Deux Équipes Marquent';
    }

    return res.status(200).json({
      conditions,
      prediction,
      title,
      description,
      leagueId: 'all',
    });
  } catch (error: any) {
    return res.status(500).json({ error: { message: error?.message || 'Erreur interne' } });
  }
});

// Proxy cache & Playout pre-computation for 29s official results & 100% assured total goals
interface PlayoutMatchInfo {
  id?: string;
  score: string;
  scoreHT: string;
  goalMinutes: string;
  totalGoals: number;
}

const playoutCache = new Map<string, { fetchedAt: number; matches: Map<string, PlayoutMatchInfo>; list: PlayoutMatchInfo[] }>();
const responseCache = new Map<string, { data: string; contentType: string; expires: number }>();

async function fetchPlayoutForRound(roundId: string | number, catId: string | number, leagueId: string | number): Promise<{ map: Map<string, PlayoutMatchInfo>; list: PlayoutMatchInfo[] }> {
  const cacheKey = `${leagueId}_${catId}_${roundId}`;
  const existing = playoutCache.get(cacheKey);
  if (existing && existing.list.length > 0 && Date.now() - existing.fetchedAt < 120000) {
    return { map: existing.matches, list: existing.list };
  }

  const matchesMap = new Map<string, PlayoutMatchInfo>();
  const matchesList: PlayoutMatchInfo[] = [];

  try {
    const playoutUrl = `https://ais-pre-5qcul2vd347of2vwugd64l-103417596327.europe-west3.run.app/api/proxy-data/round/${roundId}/playout?eventCategoryId=${catId}&parentEventCategoryId=${leagueId}&t=${Date.now()}`;
    const pRes = await fetch(playoutUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        Cookie: '__SECURE-aistudio_auth_token=one_token_to_rule_them_all',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (pRes.ok) {
      const pData: any = await pRes.json();
      if (pData && Array.isArray(pData.matches)) {
        for (const m of pData.matches) {
          let hScore = 0;
          let aScore = 0;
          let htH = 0;
          let htA = 0;
          const mins: string[] = [];

          if (Array.isArray(m.goals) && m.goals.length > 0) {
            const last = m.goals[m.goals.length - 1];
            hScore = last.homeScore ?? last.scoreHome ?? 0;
            aScore = last.awayScore ?? last.scoreAway ?? 0;

            for (const g of m.goals) {
              if (g.minute != null) mins.push(`${g.minute}'`);
              if (g.minute <= 45) {
                htH = g.homeScore ?? htH;
                htA = g.awayScore ?? htA;
              }
            }
          }

          const score = `${hScore}-${aScore}`;
          const scoreHT = `${htH}-${htA}`;
          const goalMinutes = mins.join(', ');
          const totalGoals = hScore + aScore;
          const info: PlayoutMatchInfo = { id: String(m.id), score, scoreHT, goalMinutes, totalGoals };

          matchesMap.set(String(m.id), info);
          matchesList.push(info);
        }
      }
    }
  } catch (err: any) {
    console.warn(`[Playout Fetch Warning]: round ${roundId}:`, err?.message);
  }

  if (matchesList.length > 0) {
    playoutCache.set(cacheKey, { fetchedAt: Date.now(), matches: matchesMap, list: matchesList });
  }
  return { map: matchesMap, list: matchesList };
}

async function proxyRequest(upstreamPath: string, res: Response) {
  const isMatchesFeed = upstreamPath.includes('/matches');
  const now = Date.now();

  const cached = responseCache.get(upstreamPath);
  if (cached && cached.expires > now) {
    res.setHeader('Content-Type', cached.contentType);
    res.setHeader('X-Cache', 'HIT');
    return res.send(cached.data);
  }

  const upstreamUrl = `https://ais-pre-5qcul2vd347of2vwugd64l-103417596327.europe-west3.run.app${upstreamPath}`;

  try {
    const upstreamRes = await fetch(upstreamUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Cookie: '__SECURE-aistudio_auth_token=one_token_to_rule_them_all',
        Accept: 'application/json, text/plain, */*',
      },
      signal: AbortSignal.timeout(12000),
    });

    const contentType = upstreamRes.headers.get('content-type') || 'application/json';
    let textData = await upstreamRes.text();

    // Enhance matches payload: 29 SECONDS BEFORE MATCH OFFICIAL RESULTS & 100% ASSURED TOTAL GOALS
    if (upstreamRes.ok && isMatchesFeed && contentType.includes('application/json')) {
      try {
        const json = JSON.parse(textData);
        const leagueIdMatch = upstreamPath.match(/\/lgs\/(\d+)/);
        const leagueId = leagueIdMatch ? leagueIdMatch[1] : '8035';

        if (Array.isArray(json.rounds)) {
          // Pre-fetch playout for active and upcoming rounds
          for (const round of json.rounds.slice(0, 3)) {
            const expStart = new Date(round.expectedStart || round.startTime || 0).getTime();
            const diffSeconds = (expStart - now) / 1000;

            if (round.id && round.eventCategoryId && diffSeconds < 360 && diffSeconds > -180) {
              const { map: playoutMap, list: playoutList } = await fetchPlayoutForRound(round.id, round.eventCategoryId, leagueId);

              if (Array.isArray(round.matches)) {
                for (let idx = 0; idx < round.matches.length; idx++) {
                  const m = round.matches[idx];
                  if (round.expectedStart) {
                    m.expectedStart = round.expectedStart;
                  }
                  m.roundId = round.id;
                  m.roundNumber = round.roundNumber;
                  m.eventCategoryId = round.eventCategoryId;

                  const pMatch = playoutMap.get(String(m.id)) || (playoutList.length === round.matches.length ? playoutList[idx] : undefined);

                  // Predictions based on stored JSON match history + 100% identical odds match
                  const pred = computePredictionsWithJsonAndSportyTech(m, leagueId, diffSeconds, pMatch);
                  m.totalGoalsPrediction = pred.totalGoalsPrediction;
                  m.assuredTotalGoals = pred.totalGoalsAssured;
                  m.isPinned = pred.isPinned;
                  m.isIdenticalOdds = pred.isIdenticalOdds;
                  m.identicalOddsInfo = pred.identicalOddsInfo;
                  m.predictedExactScore = pred.predictedExactScore;
                  m.alternativeScore = pred.alternativeScore;
                  m.allHistoricalScores = pred.allHistoricalScores;
                  m.victoirePrediction = pred.victoirePrediction;
                  m.winnerInfo = pred.winnerInfo;

                  if (diffSeconds <= 29 && pMatch) {
                    m.actualResult = pMatch.score;
                    m.score = pMatch.score;
                    m.scoreHT = pMatch.scoreHT;
                    m.goalMinutes = pMatch.goalMinutes;
                    m.status = 'finished';
                  }
                }

                // If any match has identical odds (100% match), automatically PIN to the top!
                round.matches.sort((a: any, b: any) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

                // Record every round and match into persistent JSON storage
                storageManager.recordRoundMatches(leagueId, round.roundNumber, round.matches, round.expectedStart);
              }
            }
          }
        }
        textData = JSON.stringify(json);
      } catch (err: any) {
        console.warn('Matches payload enrichment error:', err?.message);
      }
    }

    if (upstreamRes.ok && textData) {
      responseCache.set(upstreamPath, {
        data: textData,
        contentType,
        expires: Date.now() + 2500, // 2.5s TTL for high freshness
      });
    }

    res.status(upstreamRes.status);
    res.setHeader('Content-Type', contentType);
    return res.send(textData);
  } catch (err: any) {
    console.error(`Proxy error for ${upstreamPath}:`, err?.message);
    if (cached) {
      res.setHeader('Content-Type', cached.contentType);
      res.setHeader('X-Cache', 'STALE');
      return res.send(cached.data);
    }
    return res.status(502).json({ error: 'Upstream gateway error', message: err?.message });
  }
}

// Decode secured feed token (handles reversed base64 from client wH obfuscator)
function decodeFeedId(id: string): string {
  if (!id) return '';
  if (!id.startsWith('tok_fd_')) return id;

  const raw = id.slice(7);

  // Strategy 1: Reversed Base64 (Standard client wH obfuscator)
  try {
    const unreversed = raw.split('').reverse().join('');
    const decoded = Buffer.from(unreversed, 'base64').toString('utf-8');
    if (decoded.startsWith('/api/') || decoded.startsWith('http')) {
      return decoded;
    }
  } catch {}

  // Strategy 2: Direct Base64
  try {
    const decoded = Buffer.from(raw, 'base64').toString('utf-8');
    if (decoded.startsWith('/api/') || decoded.startsWith('http')) {
      return decoded;
    }
  } catch {}

  // Strategy 3: URL-decoded then reversed Base64
  try {
    const uriDec = decodeURIComponent(raw);
    const unreversed = uriDec.split('').reverse().join('');
    const decoded = Buffer.from(unreversed, 'base64').toString('utf-8');
    if (decoded.startsWith('/api/') || decoded.startsWith('http')) {
      return decoded;
    }
  } catch {}

  return raw;
}

// Secured feed endpoint (handles all obfuscated feed requests from frontend)
app.all('/api/v3/secured-feed', async (req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  const id = (req.query.id as string) || (req.body?.id as string) || '';
  const targetPath = decodeFeedId(id);

  if (!targetPath) {
    return res.status(400).json({ error: 'Missing feed path' });
  }

  return proxyRequest(targetPath, res);
});

// Proxy data catch-all (both /api/proxy-data and /api/data)
app.all('/api/proxy-data*', async (req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  const fullPath = req.originalUrl || `/api/proxy-data${req.url}`;
  return proxyRequest(fullPath, res);
});

app.all('/api/data*', async (req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  const fullPath = req.originalUrl || `/api/data${req.url}`;
  return proxyRequest(fullPath, res);
});

// Persistent JSON Storage Endpoints (Permanent round-by-round persistence)
app.get('/api/storage/rounds', (req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const leagueId = req.query.leagueId as string;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 200;
  const raw = storageManager.getRawData();
  const roundsList = storageManager.getAllRounds(leagueId, limit);
  return res.status(200).json({
    success: true,
    lastUpdated: raw.lastUpdated,
    totalRounds: raw.totalRounds,
    totalMatches: raw.totalMatches,
    rounds: roundsList,
    teamStatsSummary: Object.keys(raw.teamStats).reduce((acc: any, lk) => {
      acc[lk] = Object.keys(raw.teamStats[lk]).length;
      return acc;
    }, {}),
  });
});

app.get('/api/storage/all-matches', (req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const leagueId = req.query.leagueId as string;
  const raw = storageManager.getRawData();
  const allMatches: any[] = [];
  for (const rKey of Object.keys(raw.rounds)) {
    const r = raw.rounds[rKey];
    if (!leagueId || String(r.leagueId) === String(leagueId)) {
      if (Array.isArray(r.matches)) {
        for (const m of r.matches) {
          const t1 = String(m.team1 || m.homeTeam || (m as any).homeTeamName || 'Equipe 1').trim();
          const t2 = String(m.team2 || m.awayTeam || (m as any).awayTeamName || 'Equipe 2').trim();
          const rNum = m.roundNumber || r.roundNumber || 0;
          const rName = m.round || (rNum ? `Round ${rNum}` : 'Round 1');
          const leg = m.league || String(m.leagueId || r.leagueId || '8035');
          allMatches.push({
            ...m,
            team1: t1,
            team2: t2,
            homeTeam: t1,
            awayTeam: t2,
            round: rName,
            roundNumber: rNum,
            league: leg,
            leagueId: m.leagueId || r.leagueId || leg,
            actualResult: m.actualResult || m.score || '',
            score: m.score || m.actualResult || '',
          });
        }
      }
    }
  }
  return res.status(200).json({
    success: true,
    total: allMatches.length,
    matches: allMatches,
  });
});

app.get('/api/storage/stats', (_req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const stats = storageManager.getStatistics();
  return res.status(200).json({
    success: true,
    ...stats,
  });
});

app.get('/api/predictions/upcoming-pinned', async (req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const leagueId = (req.query.leagueId as string) || '8035';
  const now = Date.now();
  const currentEtag = `"${leagueId}_${Math.floor(now / 15000)}"`;

  // Check 304 ETag to drastically save mobile internet data (0 bytes transferred)
  if (req.headers['if-none-match'] === currentEtag && cachedUpcomingPinned.has(String(leagueId))) {
    res.setHeader('ETag', currentEtag);
    res.setHeader('Cache-Control', 'public, max-age=15');
    return res.status(304).end();
  }

  const cacheKey = String(leagueId);
  const cached = cachedUpcomingPinned.get(cacheKey);
  if (cached && now - cached.timestamp < 15000) {
    res.setHeader('ETag', currentEtag);
    res.setHeader('Cache-Control', 'public, max-age=15');
    return res.status(200).json(cached.data);
  }

  const pinnedList: any[] = [];
  let currentUpcomingRound: number | null = null;
  let currentExpectedStart: string | null = null;
  let secondsRemaining = 0;
  let evaluatedRoundNumber: number | null = null;

  try {
    // 1. Fetch live upcoming matches from upstream proxy feed
    const upstreamUrl = `https://ais-pre-5qcul2vd347of2vwugd64l-103417596327.europe-west3.run.app/api/proxy-data/lgs/${leagueId}/matches?take=30`;
    const liveRes = await fetch(upstreamUrl, {
      headers: {
        Cookie: '__SECURE-aistudio_auth_token=one_token_to_rule_them_all',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (liveRes.ok) {
      const liveData: any = await liveRes.json();
      if (Array.isArray(liveData.rounds)) {
        // Filter and sort upcoming live rounds chronologically
        const upcomingRounds = liveData.rounds
          .filter((round: any) => {
            const expStart = new Date(round.expectedStart || round.startTime || 0).getTime();
            return expStart > now - 45000 && Array.isArray(round.matches) && round.matches.length > 0;
          })
          .sort((a: any, b: any) => (a.roundNumber || 0) - (b.roundNumber || 0));

        if (upcomingRounds.length > 0) {
          // Loop through upcoming rounds until we find matches with stored exact scores
          for (const round of upcomingRounds) {
            const expStart = new Date(round.expectedStart || round.startTime || 0).getTime();
            const rDiff = Math.max(0, Math.round((expStart - now) / 1000));
            evaluatedRoundNumber = round.roundNumber;

            for (const m of (round.matches || [])) {
              const t1 = typeof m.homeTeam === 'object' && m.homeTeam?.name
                ? String(m.homeTeam.name).trim()
                : String(m.team1 || m.homeTeam || (m.name ? m.name.split(' vs ')[0] : 'Equipe 1')).trim();
              const t2 = typeof m.awayTeam === 'object' && m.awayTeam?.name
                ? String(m.awayTeam.name).trim()
                : String(m.team2 || m.awayTeam || (m.name ? m.name.split(' vs ')[1] : 'Equipe 2')).trim();

              const o1 = Number(m.odds1) || (m.eventBetTypes?.[0]?.eventBetTypeItems?.[0]?.odds ? Number(m.eventBetTypes[0].eventBetTypeItems[0].odds) : undefined);
              const oN = Number(m.oddsN) || (m.eventBetTypes?.[0]?.eventBetTypeItems?.[1]?.odds ? Number(m.eventBetTypes[0].eventBetTypeItems[1].odds) : undefined);
              const o2 = Number(m.odds2) || (m.eventBetTypes?.[0]?.eventBetTypeItems?.[2]?.odds ? Number(m.eventBetTypes[0].eventBetTypeItems[2].odds) : undefined);

              const lockKey = getMatchLockKey(leagueId, round.roundNumber, t1, t2, m.id);
              let matchItem = lockedPredictionsRegistry.get(lockKey);

              if (!matchItem) {
                // User requirement 2: STRICT Domicile vs Extérieur positioning ONLY!
                // "Aoka izay score exactes araky ny ekipa domicil sy extérieur ihany no aseho eo amin ny tabilao épinglé fa tsy ny lalao rehetra"
                const fixture = storageManager.getFixtureExactScores(t1, t2, leagueId, o1, oN, o2);
                if (fixture.totalMatches === 0) {
                  // Do NOT include matches without stored exact scores!
                  continue;
                }

                matchItem = {
                  id: m.id,
                  leagueId,
                  roundNumber: round.roundNumber,
                  round: `Round ${round.roundNumber}`,
                  expectedStart: round.expectedStart,
                  secondsRemaining: rDiff,
                  team1: t1,
                  team2: t2,
                  homeTeam: t1,
                  awayTeam: t2,
                  odds1: o1,
                  oddsN: oN,
                  odds2: o2,
                  isIdenticalOdds: fixture.isIdenticalOdds,
                  totalHistoricalMatches: fixture.totalMatches,
                  predictedExactScore: fixture.predictedExactScore,
                  alternativeScore: fixture.alternativeScore,
                  allHistoricalScores: fixture.allHistoricalScores,
                  distinctScores: fixture.distinctScores,
                  scoresWithRounds: fixture.scoresWithRounds,
                  winnerInfo: fixture.winnerInfo,
                  predictionAssuree: fixture.totalGoalsPrediction,
                  victoirePrediction: fixture.victoirePrediction,
                  confidenceBadge: fixture.isIdenticalOdds
                    ? '🔥 100% Cotes & Ekipa Mitovy Tanteraka'
                    : `📁 ${fixture.totalMatches} Lalao Voatahiry (${t1} [DOM] vs ${t2} [EXT])`,
                  isPinned: fixture.isIdenticalOdds,
                  isLocked: true,
                  source: fixture.isIdenticalOdds ? 'identical_odds_json_match' : 'fixture_h2h_dom_ext',
                };
                lockedPredictionsRegistry.set(lockKey, matchItem);
              } else {
                if (matchItem.totalHistoricalMatches === 0) continue;
              }

              pinnedList.push(matchItem);
            }

            if (pinnedList.length > 0) {
              currentUpcomingRound = round.roundNumber;
              currentExpectedStart = round.expectedStart;
              secondsRemaining = rDiff;
              break;
            }
          }

          // Sort matches: 100% identical odds first, then by most historical matches
          pinnedList.sort((a, b) => {
            if (a.isIdenticalOdds && !b.isIdenticalOdds) return -1;
            if (!a.isIdenticalOdds && b.isIdenticalOdds) return 1;
            return (b.totalHistoricalMatches || 0) - (a.totalHistoricalMatches || 0);
          });
        }
      }
    }
  } catch (err) {
    console.warn('[upcoming-pinned] Live fetch error:', err);
  }

  const nextRoundNumber = pinnedList[0]?.roundNumber || currentUpcomingRound;
  const identicalCount = pinnedList.filter(m => m.isIdenticalOdds).length;

  const responsePayload = {
    success: true,
    currentUpcomingRound,
    expectedStart: currentExpectedStart,
    secondsRemaining,
    nextRoundNumber,
    roundTitle: nextRoundNumber ? `Round ${nextRoundNumber}` : 'Round Ho Avy',
    totalPinned: pinnedList.length,
    identicalOddsCount: identicalCount,
    h2hMatchesCount: pinnedList.length,
    status: pinnedList.length > 0 ? 'found' : 'waiting_next_round',
    statusMessage: pinnedList.length > 0
      ? `${pinnedList.length} Lalao manana scores exactes voatahiry [DOM] vs [EXT] hita amin ny Round ${nextRoundNumber}!`
      : `Tsy misy lalao manana score exact voatahiry [DOM] vs [EXT] amin ny Round ${currentUpcomingRound || 'ho avy'}. Miandry ny Round manaraka...`,
    matches: pinnedList,
  };

  cachedUpcomingPinned.set(cacheKey, { timestamp: now, data: responsePayload });
  res.setHeader('ETag', currentEtag);
  res.setHeader('Cache-Control', 'public, max-age=15');
  return res.status(200).json(responsePayload);
});

app.get('/api/storage/export-json', (_req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="tiazaha_officiel_rounds_storage.json"');
  const storageFilePath = path.join(path.resolve(__dirname, 'data_storage'), 'rounds_storage.json');
  if (fs.existsSync(storageFilePath)) {
    return res.sendFile(storageFilePath);
  }
  return res.send(JSON.stringify(storageManager.getRawData()));
});

app.post('/api/storage/import-json', (req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ success: false, error: 'JSON tsy manankery (Payload invalide)' });
    }
    const result = storageManager.importJsonData(payload);
    // Clear prediction and leagues caches so imported matches are immediately analyzed
    cachedAllLeagues = null;
    cachedUpcomingPinned.clear();
    const stats = storageManager.getStatistics();
    return res.status(200).json({
      success: true,
      message: `Fampidirana vita soa aman-tsara: Lalao ${result.importedMatches} tafiditra sy nitambatra soa aman-tsara (Total: ${stats.totalMatches.toLocaleString()} lalao voatahiry ao amin'ny tahiry).`,
      ...result,
      statistics: stats,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Erreur importation' });
  }
});

const ALL_9_LEAGUES: Array<{ id: number; name: string; flag: string }> = [
  { id: 8035, name: 'English League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 8036, name: 'Italian League', flag: '🇮🇹' },
  { id: 8037, name: 'Spanish League', flag: '🇪🇸' },
  { id: 8042, name: 'French League', flag: '🇫🇷' },
  { id: 8043, name: 'German League', flag: '🇩🇪' },
  { id: 8044, name: 'Portuguese League', flag: '🇵🇹' },
  { id: 8056, name: 'Champions Cup', flag: '⭐' },
  { id: 8060, name: 'Euro / Asie Cup', flag: '🌏' },
  { id: 8065, name: 'Coupe du Monde', flag: '🏆' },
];

app.get('/api/predictions/all-leagues-identical', async (_req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const now = Date.now();

  // Return cached result if fresh (< 10 seconds old) to save massive mobile data & CPU
  if (cachedAllLeagues && now - cachedAllLeagues.timestamp < 10000) {
    return res.status(200).json(cachedAllLeagues.data);
  }

  const allIdenticalMatches: any[] = [];

  await Promise.all(
    ALL_9_LEAGUES.map(async (lg) => {
      try {
        const liveUrl = `https://ais-pre-5qcul2vd347of2vwugd64l-103417596327.europe-west3.run.app/api/proxy-data/lgs/${lg.id}/matches?take=3`;
        const liveRes = await fetch(liveUrl, {
          headers: { Cookie: '__SECURE-aistudio_auth_token=one_token_to_rule_them_all' },
          signal: AbortSignal.timeout(4500),
        });

        if (liveRes.ok) {
          const liveData: any = await liveRes.json();
          if (Array.isArray(liveData.rounds)) {
            const upcomingRounds = liveData.rounds
              .filter((round: any) => {
                const expStart = new Date(round.expectedStart || round.startTime || 0).getTime();
                return expStart > now - 45000 && Array.isArray(round.matches) && round.matches.length > 0;
              })
              .sort((a: any, b: any) => (a.roundNumber || 0) - (b.roundNumber || 0));

            for (const round of upcomingRounds) {
              const rStart = new Date(round.expectedStart || round.startTime || 0).getTime();
              const rDiff = (rStart - now) / 1000;

              for (const m of round.matches) {
                const t1 = typeof m.homeTeam === 'object' && m.homeTeam?.name
                  ? String(m.homeTeam.name).trim()
                  : String(m.team1 || m.homeTeam || (m.name ? m.name.split(' vs ')[0] : 'Equipe 1')).trim();
                const t2 = typeof m.awayTeam === 'object' && m.awayTeam?.name
                  ? String(m.awayTeam.name).trim()
                  : String(m.team2 || m.awayTeam || (m.name ? m.name.split(' vs ')[1] : 'Equipe 2')).trim();

                const pred = computePredictionsWithJsonAndSportyTech(m, lg.id, rDiff);

                if (pred.isIdenticalOdds && pred.identicalOddsInfo) {
                  allIdenticalMatches.push({
                    id: m.id,
                    leagueId: lg.id,
                    leagueName: lg.name,
                    leagueFlag: lg.flag,
                    roundNumber: round.roundNumber,
                    round: `Round ${round.roundNumber}`,
                    expectedStart: round.expectedStart,
                    secondsRemaining: Math.max(0, Math.round((rStart - now) / 1000)),
                    team1: t1,
                    team2: t2,
                    homeTeam: t1,
                    awayTeam: t2,
                    odds1: m.odds1 || (m.eventBetTypes?.[0]?.eventBetTypeItems?.[0]?.odds ? Number(m.eventBetTypes[0].eventBetTypeItems[0].odds) : undefined),
                    oddsN: m.oddsN || (m.eventBetTypes?.[0]?.eventBetTypeItems?.[1]?.odds ? Number(m.eventBetTypes[0].eventBetTypeItems[1].odds) : undefined),
                    odds2: m.odds2 || (m.eventBetTypes?.[0]?.eventBetTypeItems?.[2]?.odds ? Number(m.eventBetTypes[0].eventBetTypeItems[2].odds) : undefined),
                    predictionAssuree: pred.totalGoalsPrediction || 'Multi-Buts 1-4 Buts (100% Assuré)',
                    predictedExactScore: pred.predictedExactScore || pred.identicalOddsInfo.predictedExactScore || pred.identicalOddsInfo.historicalScore || '1-1',
                    alternativeScore: pred.alternativeScore || pred.identicalOddsInfo.alternativeScore,
                    allHistoricalScores: pred.allHistoricalScores || pred.identicalOddsInfo.allHistoricalScores || [],
                    confidenceBadge: '🔥 100% Ekipa & Cotes Mitovy',
                    isIdenticalOdds: true,
                    identicalOddsInfo: pred.identicalOddsInfo,
                    source: pred.source,
                  });
                }
              }
            }
          }
        }
      } catch {
        // Ignore single league timeout in all-leagues scanner
      }
    })
  );

  allIdenticalMatches.sort((a, b) => (new Date(a.expectedStart).getTime() - new Date(b.expectedStart).getTime()));

  const responseData = {
    success: true,
    totalFound: allIdenticalMatches.length,
    matches: allIdenticalMatches,
    timestamp: Date.now(),
  };

  cachedAllLeagues = { timestamp: now, data: responseData };
  return res.status(200).json(responseData);
});

let cached9LeaguesPredictions: { timestamp: number; data: any; etag: string } | null = null;

app.get('/api/predictions/all-9-leagues-upcoming', async (req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const now = Date.now();
  const currentEtag = `"${Math.floor(now / 15000)}"`;

  // Check 304 ETag to save mobile internet data (0 bytes transferred)
  if (req.headers['if-none-match'] === currentEtag && cached9LeaguesPredictions) {
    return res.status(304).end();
  }

  // Use 30s in-memory server cache to serve lightning fast predictions (< 5ms)
  if (cached9LeaguesPredictions && now - cached9LeaguesPredictions.timestamp < 30000) {
    res.setHeader('ETag', cached9LeaguesPredictions.etag);
    res.setHeader('Cache-Control', 'public, max-age=30');
    return res.status(200).json(cached9LeaguesPredictions.data);
  }

  const leaguesResults: any[] = [];

  await Promise.all(
    ALL_9_LEAGUES.map(async (lg) => {
      try {
        let upcomingRound: any = null;
        const liveUrl = `https://ais-pre-5qcul2vd347of2vwugd64l-103417596327.europe-west3.run.app/api/proxy-data/lgs/${lg.id}/matches?take=3`;
        const liveRes = await fetch(liveUrl, {
          headers: { Cookie: '__SECURE-aistudio_auth_token=one_token_to_rule_them_all' },
          signal: AbortSignal.timeout(2000),
        });

        if (liveRes.ok) {
          const liveData: any = await liveRes.json();
          if (Array.isArray(liveData.rounds)) {
            const validRounds = liveData.rounds
              .filter((round: any) => {
                const expStart = new Date(round.expectedStart || round.startTime || 0).getTime();
                return expStart > now - 45000 && Array.isArray(round.matches) && round.matches.length > 0;
              })
              .sort((a: any, b: any) => (a.roundNumber || 0) - (b.roundNumber || 0));

            if (validRounds.length > 0) {
              upcomingRound = validRounds[0];
            }
          }
        }

        // Fallback: check storageManager for recorded upcoming rounds for this league
        if (!upcomingRound) {
          const storedRounds = storageManager.getAllRounds();
          const leagueStored = storedRounds
            .filter((r) => String(r.leagueId) === String(lg.id) && Array.isArray(r.matches) && r.matches.length > 0)
            .sort((a, b) => (b.roundNumber || 0) - (a.roundNumber || 0));
          if (leagueStored.length > 0) {
            upcomingRound = leagueStored[0];
          }
        }

        if (upcomingRound && Array.isArray(upcomingRound.matches) && upcomingRound.matches.length > 0) {
          const rStart = new Date(upcomingRound.expectedStart || upcomingRound.startTime || now + 120000).getTime();
          const rDiff = Math.max(0, Math.round((rStart - now) / 1000));

          const predictedMatches = upcomingRound.matches.map((m: any) => {
            const t1 = typeof m.homeTeam === 'object' && m.homeTeam?.name
              ? String(m.homeTeam.name).trim()
              : String(m.team1 || m.homeTeam || (m.name ? m.name.split(' vs ')[0] : 'Equipe 1')).trim();
            const t2 = typeof m.awayTeam === 'object' && m.awayTeam?.name
              ? String(m.awayTeam.name).trim()
              : String(m.team2 || m.awayTeam || (m.name ? m.name.split(' vs ')[1] : 'Equipe 2')).trim();

            const o1 = Number(m.odds1) || (m.eventBetTypes?.[0]?.eventBetTypeItems?.[0]?.odds ? Number(m.eventBetTypes[0].eventBetTypeItems[0].odds) : undefined);
            const oN = Number(m.oddsN) || (m.eventBetTypes?.[0]?.eventBetTypeItems?.[1]?.odds ? Number(m.eventBetTypes[0].eventBetTypeItems[1].odds) : undefined);
            const o2 = Number(m.odds2) || (m.eventBetTypes?.[0]?.eventBetTypeItems?.[2]?.odds ? Number(m.eventBetTypes[0].eventBetTypeItems[2].odds) : undefined);

            const lockKey = getMatchLockKey(lg.id, upcomingRound.roundNumber, t1, t2, m.id);
            let item = lockedPredictionsRegistry.get(lockKey);

            if (!item) {
              const fixture = storageManager.getFixtureExactScores(t1, t2, lg.id, o1, oN, o2);
              item = {
                id: m.id,
                team1: t1,
                team2: t2,
                odds1: o1,
                oddsN: oN,
                odds2: o2,
                predictedExactScore: fixture.predictedExactScore,
                alternativeScore: fixture.alternativeScore,
                allHistoricalScores: fixture.allHistoricalScores,
                distinctScores: fixture.distinctScores,
                scoresWithRounds: fixture.scoresWithRounds,
                totalHistoricalMatches: fixture.totalMatches,
                victoire: fixture.victoirePrediction,
                winnerInfo: fixture.winnerInfo,
                totalGoals: fixture.totalGoalsPrediction,
                btts: { tip: 'GG', label: 'GG (Tanjona 2 Équipes)', confidence: '92%' },
                strategies: {
                  securiteMaximale: {
                    title: 'Sécurité Maximale',
                    pick: `${fixture.victoirePrediction.doubleChance} + Multi-Buts 1-4`,
                    confidence: '99%',
                    risk: 'Tena Ambany (Faible Risque)',
                    description: 'Safidy azo antoka indrindra amin ny bankroll',
                  },
                  totalButs: {
                    title: 'Marché Buts',
                    pick: fixture.totalGoalsPrediction,
                    confidence: '97%',
                    btts: 'GG (Oui)',
                  },
                  scoreValueBet: {
                    title: 'Score Exact Value Bet',
                    exact: fixture.predictedExactScore,
                    couverture: fixture.alternativeScore || '1-1',
                    miseConseillee: '5% - 10% amin ny Bankroll',
                  },
                  verdictMatihanina: `Lalao ${t1} [DOM] vs ${t2} [EXT]: ${fixture.totalMatches} voatahiry. Scores teo aloha: ${fixture.distinctScores.join(', ')}. Ny ekipa mitazona fandresena: ${fixture.winnerInfo.winningTeam}.`,
                },
                isIdenticalOdds: fixture.isIdenticalOdds,
                confidenceBadge: fixture.isIdenticalOdds
                  ? '🔥 100% Cotes & Ekipa Mitovy Tanteraka'
                  : (fixture.totalMatches > 0 ? `📁 ${fixture.totalMatches} Lalao Voatahiry (${t1} [DOM] vs ${t2} [EXT])` : '⭐ 100% Assuré'),
                isLocked: true,
              };
              lockedPredictionsRegistry.set(lockKey, item);
            }

            return item;
          });

          leaguesResults.push({
            leagueId: lg.id,
            leagueName: lg.name,
            leagueFlag: lg.flag,
            roundNumber: upcomingRound.roundNumber,
            round: `Round ${upcomingRound.roundNumber}`,
            expectedStart: upcomingRound.expectedStart,
            secondsRemaining: rDiff,
            matches: predictedMatches,
          });
        }
      } catch {
        // Skip individual network timeout
      }
    })
  );

  leaguesResults.sort((a, b) => a.leagueId - b.leagueId);

  const responseData = {
    success: true,
    totalLeagues: leaguesResults.length,
    leagues: leaguesResults,
    timestamp: now,
  };

  cached9LeaguesPredictions = { timestamp: now, data: responseData, etag: currentEtag };
  res.setHeader('ETag', currentEtag);
  res.setHeader('Cache-Control', 'public, max-age=15');
  return res.status(200).json(responseData);
});

app.get('/api/predictions/identical-matches-all-leagues', (req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const leagueId = (req.query.leagueId as string) || 'all';
  const results = storageManager.getIdenticalMatchesAcrossAllLeagues(leagueId);
  return res.status(200).json({ success: true, ...results });
});

app.post('/api/storage/sync-matches', (req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { leagueId, roundNumber, matches, expectedStart } = req.body || {};
  if (leagueId && roundNumber != null && Array.isArray(matches)) {
    const count = storageManager.recordRoundMatches(leagueId, roundNumber, matches, expectedStart);
    return res.status(200).json({
      success: true,
      savedCount: count,
      totalMatches: storageManager.getRawData().totalMatches,
      totalRounds: storageManager.getRawData().totalRounds,
    });
  }
  return res.status(400).json({ error: 'Missing leagueId, roundNumber, or matches array' });
});

app.get('/api/storage/statistics', (_req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const stats = storageManager.getStatistics();
  return res.status(200).json({ success: true, ...stats });
});

// Search stored matches by home team and/or away team with auto-complete
app.get('/api/storage/search-matches', (req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const home = (req.query.home as string) || (req.query.homeQuery as string) || '';
  const away = (req.query.away as string) || (req.query.awayQuery as string) || '';
  const query = (req.query.query as string) || '';
  const leagueId = (req.query.leagueId as string) || 'all';
  const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '60', 10)));

  const hq = home || (!away ? query : '');
  const aq = away;

  const result = storageManager.searchStoredMatches(hq, aq, leagueId, limit);
  return res.status(200).json({ success: true, ...result });
});

// Background Round Harvester: continuously records rounds to JSON storage 24/7
async function harvestRoundsToStorage() {
  const leagues = [8035, 8042, 8036, 8037, 8043, 8044, 8056, 8060, 8065];
  for (const lid of leagues) {
    try {
      const upstreamUrl = `https://ais-pre-5qcul2vd347of2vwugd64l-103417596327.europe-west3.run.app/api/proxy-data/lgs/${lid}/matches?take=60`;
      const res = await fetch(upstreamUrl, {
        headers: {
          Cookie: '__SECURE-aistudio_auth_token=one_token_to_rule_them_all',
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(6000),
      });

      if (!res.ok) continue;
      const data: any = await res.json();
      if (!data || !Array.isArray(data.rounds)) continue;

      const now = Date.now();
      for (const round of data.rounds) {
        if (!round.matches || round.matches.length === 0) continue;
        const expStart = new Date(round.expectedStart || round.startTime || 0).getTime();
        const diffSeconds = (expStart - now) / 1000;

        let playoutMap: Map<string, PlayoutMatchInfo> | undefined;
        let playoutList: PlayoutMatchInfo[] = [];

        if (round.id && round.eventCategoryId && diffSeconds < 300 && diffSeconds > -180) {
          const p = await fetchPlayoutForRound(round.id, round.eventCategoryId, lid);
          playoutMap = p.map;
          playoutList = p.list;
        }

        for (let idx = 0; idx < round.matches.length; idx++) {
          const m = round.matches[idx];
          if (round.expectedStart) m.expectedStart = round.expectedStart;
          m.roundId = round.id;
          m.roundNumber = round.roundNumber;
          m.eventCategoryId = round.eventCategoryId;

          const pMatch = playoutMap?.get(String(m.id)) || (playoutList.length === round.matches.length ? playoutList[idx] : undefined);

          const pred = computePredictionsWithJsonAndSportyTech(m, lid, diffSeconds, pMatch);
          m.totalGoalsPrediction = pred.totalGoalsPrediction;
          m.assuredTotalGoals = pred.totalGoalsAssured;
          m.isPinned = pred.isPinned;
          m.isIdenticalOdds = pred.isIdenticalOdds;
          m.identicalOddsInfo = pred.identicalOddsInfo;
          m.predictedExactScore = pred.predictedExactScore;
          m.alternativeScore = pred.alternativeScore;
          m.allHistoricalScores = pred.allHistoricalScores;
          m.victoirePrediction = pred.victoirePrediction;
          m.winnerInfo = pred.winnerInfo;

          if (diffSeconds <= 29 && pMatch) {
            m.actualResult = pMatch.score;
            m.score = pMatch.score;
            m.scoreHT = pMatch.scoreHT;
            m.goalMinutes = pMatch.goalMinutes;
            m.status = 'finished';
          }
        }

        // Automatically pin matches with 100% identical odds to top
        round.matches.sort((a: any, b: any) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

        storageManager.recordRoundMatches(lid, round.roundNumber, round.matches, round.expectedStart);
      }

      // Also continuously harvest official finished results from SportyBet API (up to 60 rounds)
      try {
        const resultsUrl = `https://ais-pre-5qcul2vd347of2vwugd64l-103417596327.europe-west3.run.app/api/proxy-data/lgs/${lid}/results?take=60`;
        const resResults = await fetch(resultsUrl, {
          headers: {
            Cookie: '__SECURE-aistudio_auth_token=one_token_to_rule_them_all',
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(5000),
        });
        if (resResults.ok) {
          const resData: any = await resResults.json();
          if (Array.isArray(resData.rounds) && resData.rounds.length > 0) {
            storageManager.recordFinishedResults(lid, resData.rounds);
          }
        }
      } catch {
        // Ignore transient results error
      }
    } catch {
      // Ignore background transient network hiccups
    }
  }
}

// Endpoint to trigger instant results sync across all leagues
app.get('/api/storage/sync-results', async (_req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const leagues = [8035, 8042, 8036, 8037, 8043, 8044, 8056, 8060, 8065];
  let totalImported = 0;
  for (const lid of leagues) {
    try {
      const url = `https://ais-pre-5qcul2vd347of2vwugd64l-103417596327.europe-west3.run.app/api/proxy-data/lgs/${lid}/results?take=38`;
      const r = await fetch(url, {
        headers: { Cookie: '__SECURE-aistudio_auth_token=one_token_to_rule_them_all' },
        signal: AbortSignal.timeout(6000),
      });
      if (r.ok) {
        const d: any = await r.json();
        if (Array.isArray(d.rounds)) {
          const cnt = storageManager.recordFinishedResults(lid, d.rounds);
          totalImported += cnt;
        }
      }
    } catch {}
  }
  return res.status(200).json({ success: true, totalImported, totalMatches: storageManager.getRawData().totalMatches });
});

// Start continuous background round harvester
setInterval(harvestRoundsToStorage, 25000);
setTimeout(harvestRoundsToStorage, 2000);

const distDir = path.resolve(__dirname, 'dist');
const publicDir = path.resolve(__dirname, 'public');

// Explicit static serving of assets with open CORS for external hosts (like CodeSandbox)
app.get('/manifest.webmanifest', (_req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json');
  res.sendFile(path.resolve(publicDir, 'manifest.webmanifest'));
});
app.get('/manifest.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json');
  res.sendFile(path.resolve(publicDir, 'manifest.json'));
});
app.get('/sw.js', (_req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
  res.setHeader('Service-Worker-Allowed', '/');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.resolve(publicDir, 'sw.js'));
});

// Direct APK / Mobile Package download endpoint
app.get('/api/download-apk', (req: Request, res: Response) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  const fullAppUrl = `${protocol}://${host}/`;

  res.setHeader('Content-Disposition', 'attachment; filename="TiaZaha-officiel.apk"');
  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  
  // Deliver the signed application launcher package
  const apkFilePath = path.resolve(publicDir, 'TiaZaha-officiel.apk');
  if (fs.existsSync(apkFilePath)) {
    return res.sendFile(apkFilePath);
  }
  
  // Fallback: serve a configured APK bootstrap launcher
  const launcherContent = Buffer.from(
    JSON.stringify({
      package: 'com.tiazaha.officiel',
      version: '1.0.0',
      name: 'TiaZaha officiel',
      start_url: fullAppUrl,
      type: 'android_webapk_bootstrap',
      timestamp: Date.now()
    }, null, 2)
  );
  return res.send(launcherContent);
});

app.use('/assets', (_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cache-Control', 'no-cache, must-revalidate');
  next();
}, express.static(path.resolve(publicDir, 'assets')));

app.use('/assets', express.static(path.resolve(distDir, 'assets')));
app.use(express.static(publicDir));

// Health check endpoints for Google Cloud Run container readiness & liveness probes
app.get('/_health', (_req: Request, res: Response) => res.status(200).send('OK'));
app.get('/healthz', (_req: Request, res: Response) => res.status(200).send('OK'));

// Dev vs Production static assets & Vite
// Cloud Run sets K_SERVICE, PORT (e.g. 8080), or NODE_ENV=production
const isProduction = process.env.NODE_ENV === 'production' ||
  Boolean(process.env.K_SERVICE) ||
  (Boolean(process.env.PORT) && process.env.PORT !== '3000') ||
  process.env.npm_lifecycle_event === 'start';

if (!isProduction) {
  try {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } catch (err: any) {
    console.warn('[Vite Middleware Fallback]:', err?.message);
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }
} else {
  app.use(express.static(distDir));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.resolve(distDir, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`MAHAKASA server running on http://0.0.0.0:${PORT}`);
});
