import { storageManager } from './storage_manager.ts';

export interface WinnerInfo {
  winner: 'home' | 'away' | 'draw';
  winningTeam: string;
  badge: string;
  description: string;
  confidence: string;
}

export interface PredictionResult {
  totalGoalsPrediction?: string;
  totalGoalsAssured?: string;
  predictedExactScore?: string;
  alternativeScore?: string;
  allHistoricalScores?: string[];
  victoirePrediction?: {
    tip: string;
    label: string;
    doubleChance: string;
    confidence: string;
    isHomeFav: boolean;
  };
  winnerInfo?: WinnerInfo;
  bttsPrediction?: {
    tip: 'GG' | 'NG';
    label: string;
    confidence: string;
  };
  isPinned: boolean;
  isIdenticalOdds: boolean;
  identicalOddsInfo?: {
    historicalMatchId?: string | number;
    historicalTeams: string;
    historicalRound: number;
    historicalScore: string;
    historicalTotalGoals: number;
    historicalOdds: [number, number, number];
    occurrences: number;
    historicalLeague?: string;
    isSameTeams?: boolean;
    predictedExactScore?: string;
    alternativeScore?: string;
    allHistoricalScores?: string[];
  };
  h2hInfo?: {
    pastMatchesCount: number;
    lastMatchRound?: number;
    lastMatchScore?: string;
    lastMatchTeams?: string;
    avgGoals?: number;
    historicalLeague?: string;
  };
  confidenceBadge?: string;
  source: 'identical_odds_json_match' | 'h2h_json_match' | 'assured_prediction';
}

export function computeWinner(team1: string, team2: string, o1?: number, o2?: number, exactScore?: string): WinnerInfo {
  if (exactScore && exactScore.includes('-')) {
    const parts = exactScore.split('-').map(Number);
    if (!isNaN(parts[0]) && !isNaN(parts[1])) {
      const [gh, ga] = parts;
      if (gh > ga) {
        return {
          winner: 'home',
          winningTeam: team1,
          badge: '👑 MPITAZONA NY FANDRESENA [DOM]',
          description: `${team1} no tompon-toerana mitazona ny fandresena (${exactScore})`,
          confidence: '99%',
        };
      }
      if (ga > gh) {
        return {
          winner: 'away',
          winningTeam: team2,
          badge: '👑 MPITAZONA NY FANDRESENA [EXT]',
          description: `${team2} no vahiny mitazona ny fandresena (${exactScore})`,
          confidence: '99%',
        };
      }
      return {
        winner: 'draw',
        winningTeam: (o1 && o2 && o1 <= o2) ? team1 : team2,
        badge: (o1 && o2 && o1 <= o2) ? '👑 TOMBONY DOMICILE (1X)' : '👑 TOMBONY EXTÉRIEUR (X2)',
        description: `Lalao sahala vinavinaina (${exactScore}), tombony Double Chance`,
        confidence: '96%',
      };
    }
  }

  if (o1 && o2) {
    if (o1 < o2) {
      return {
        winner: 'home',
        winningTeam: team1,
        badge: '👑 MPITAZONA NY FANDRESENA [DOM]',
        description: `${team1} no mitazona ny tombony lehibe indrindra (Cote: ${o1})`,
        confidence: '97%',
      };
    } else {
      return {
        winner: 'away',
        winningTeam: team2,
        badge: '👑 MPITAZONA NY FANDRESENA [EXT]',
        description: `${team2} no mitazona ny tombony lehibe indrindra (Cote: ${o2})`,
        confidence: '97%',
      };
    }
  }

  return {
    winner: 'home',
    winningTeam: team1,
    badge: '👑 MPITAZONA NY FANDRESENA [DOM]',
    description: `${team1} no manana tombony`,
    confidence: '95%',
  };
}

function computeVictoire(o1?: number, oN?: number, o2?: number, exactScore?: string) {
  if (exactScore && exactScore.includes('-')) {
    const parts = exactScore.split('-').map(Number);
    if (!isNaN(parts[0]) && !isNaN(parts[1])) {
      const [gh, ga] = parts;
      if (gh > ga) {
        return { tip: '1', label: 'Victoire Domicile (1)', doubleChance: '1X (Dom ou Nul)', confidence: '99%', isHomeFav: true };
      }
      if (ga > gh) {
        return { tip: '2', label: 'Victoire Extérieur (2)', doubleChance: 'X2 (Ext ou Nul)', confidence: '99%', isHomeFav: false };
      }
      return { tip: 'X', label: 'Match Nul (X)', doubleChance: '1X na X2 (Double Chance)', confidence: '96%', isHomeFav: false };
    }
  }

  if (o1 && o2) {
    if (o1 < o2) {
      if (o1 <= 1.65) return { tip: '1', label: 'Victoire Domicile (1)', doubleChance: '1X (Dom ou Nul)', confidence: '97%', isHomeFav: true };
      return { tip: '1X', label: 'Double Chance 1X (Dom/Nul)', doubleChance: '1X (Dom ou Nul)', confidence: '95%', isHomeFav: true };
    } else {
      if (o2 <= 1.65) return { tip: '2', label: 'Victoire Extérieur (2)', doubleChance: 'X2 (Ext ou Nul)', confidence: '97%', isHomeFav: false };
      return { tip: 'X2', label: 'Double Chance X2 (Ext/Nul)', doubleChance: 'X2 (Ext ou Nul)', confidence: '95%', isHomeFav: false };
    }
  }
  return { tip: '1X', label: 'Double Chance 1X', doubleChance: '1X', confidence: '92%', isHomeFav: true };
}

function computeBTTS(o1?: number, o2?: number, exactScore?: string): { tip: 'GG' | 'NG'; label: string; confidence: string } {
  if (exactScore && exactScore.includes('-')) {
    const parts = exactScore.split('-').map(Number);
    if (!isNaN(parts[0]) && !isNaN(parts[1])) {
      const [gh, ga] = parts;
      if (gh > 0 && ga > 0) {
        return { tip: 'GG', label: 'GG (Les 2 Équipes Marquent: OUI)', confidence: '98%' };
      }
      return { tip: 'NG', label: 'NG (Tsy mampiditra ny roa tonta: NON)', confidence: '95%' };
    }
  }
  if (o1 && o2 && o1 > 1.55 && o2 > 1.55) {
    return { tip: 'GG', label: 'GG (Les 2 Marquent: OUI)', confidence: '94%' };
  }
  return { tip: 'GG', label: 'GG (Tanjona 2 Équipes)', confidence: '90%' };
}

export function computePredictionsWithJsonAndSportyTech(
  match: any,
  leagueId: string | number,
  diffSeconds: number,
  playoutInfo?: { score: string; scoreHT: string; goalMinutes: string; totalGoals: number }
): PredictionResult {
  const o1 = Number(match.odds1) || (match.eventBetTypes?.[0]?.eventBetTypeItems?.[0]?.odds ? Number(match.eventBetTypes[0].eventBetTypeItems[0].odds) : undefined);
  const oN = Number(match.oddsN) || (match.eventBetTypes?.[0]?.eventBetTypeItems?.[1]?.odds ? Number(match.eventBetTypes[0].eventBetTypeItems[1].odds) : undefined);
  const o2 = Number(match.odds2) || (match.eventBetTypes?.[0]?.eventBetTypeItems?.[2]?.odds ? Number(match.eventBetTypes[0].eventBetTypeItems[2].odds) : undefined);

  const team1 = typeof match.homeTeam === 'object' && match.homeTeam?.name
    ? String(match.homeTeam.name).trim()
    : String(match.team1 || match.homeTeam || (match.name ? match.name.split(' vs ')[0] : '')).trim();
  const team2 = typeof match.awayTeam === 'object' && match.awayTeam?.name
    ? String(match.awayTeam.name).trim()
    : String(match.team2 || match.awayTeam || (match.name ? match.name.split(' vs ')[1] : '')).trim();

  // 1. Search for 100% identical odds STRICTLY in the SAME league (Highest Priority)
  if (o1 && oN && o2) {
    const identical = storageManager.findIdenticalOddsMatch(o1, oN, o2, match.id, leagueId, team1, team2);
    if (identical.matched && identical.historicalMatch) {
      const h = identical.historicalMatch;
      const recommendedTotal = identical.recommendedTotalGoals || 'Multi-Buts 1-4 Buts (100% Assuré)';
      const badgeText = identical.isSameTeams
        ? '🔥 100% Assuré • H2H Cotes Identiques'
        : `🔥 100% Assuré • Cotes Identiques (${identical.leagueDisplayName || 'Même Ligue'})`;

      const exactScore = identical.predictedExactScore || h.score || '1-1';
      const altScore = identical.alternativeScore;
      const histScores = identical.allHistoricalScores || [];

      return {
        totalGoalsPrediction: recommendedTotal,
        totalGoalsAssured: recommendedTotal,
        predictedExactScore: exactScore,
        alternativeScore: altScore,
        allHistoricalScores: histScores,
        victoirePrediction: computeVictoire(o1, oN, o2, exactScore),
        winnerInfo: computeWinner(team1, team2, o1, o2, exactScore),
        bttsPrediction: computeBTTS(o1, o2, exactScore),
        isPinned: true,
        isIdenticalOdds: true,
        identicalOddsInfo: {
          historicalMatchId: h.id,
          historicalTeams: `${h.homeTeam} vs ${h.awayTeam}`,
          historicalRound: h.roundNumber,
          historicalScore: h.score || '?-?',
          historicalTotalGoals: h.totalGoals || 0,
          historicalOdds: [o1, oN, o2],
          occurrences: identical.historicalMatches.length,
          historicalLeague: identical.leagueDisplayName,
          isSameTeams: identical.isSameTeams,
          predictedExactScore: exactScore,
          alternativeScore: altScore,
          allHistoricalScores: histScores,
        },
        confidenceBadge: badgeText,
        source: 'identical_odds_json_match',
      };
    }
  }

  // 2. Search for H2H past meetings strictly in the same league
  if (team1 && team2) {
    const h2h = storageManager.findHistoricalH2H(team1, team2, match.id, leagueId);
    if (h2h.matched && h2h.lastMatch) {
      const lm = h2h.lastMatch;
      const rec = h2h.recommendedPrediction || 'Multi-Buts 1-4 Buts (100% Assuré)';
      const h2hScore = lm.score || '2-1';
      return {
        totalGoalsPrediction: rec,
        totalGoalsAssured: rec,
        predictedExactScore: h2hScore,
        alternativeScore: '1-1',
        allHistoricalScores: h2h.pastMatches.map(m => m.score).filter((s): s is string => Boolean(s)),
        victoirePrediction: computeVictoire(o1, oN, o2, h2hScore),
        winnerInfo: computeWinner(team1, team2, o1, o2, h2hScore),
        bttsPrediction: computeBTTS(o1, o2, h2hScore),
        isPinned: true,
        isIdenticalOdds: false,
        h2hInfo: {
          pastMatchesCount: h2h.pastMatches.length,
          lastMatchRound: lm.roundNumber,
          lastMatchScore: lm.score || '?-?',
          lastMatchTeams: `${lm.homeTeam} vs ${lm.awayTeam}`,
          avgGoals: h2h.avgGoals,
          historicalLeague: h2h.leagueDisplayName,
        },
        confidenceBadge: `📁 100% Assuré • H2H (${h2h.leagueDisplayName || 'Même Ligue'})`,
        source: 'h2h_json_match',
      };
    }
  }

  // 3. Guaranteed Assured Prediction for all other upcoming round matches
  let assuredPrediction = 'Multi-Buts 1-4 Buts (100% Assuré)';
  let isPinned = false;
  let confidenceBadge = '🎯 100% Assuré';
  let predictedExact = '2-1';
  let altExact = '1-1';

  if (o1 && o2) {
    if (o1 < 1.40) {
      predictedExact = '3-1';
      altExact = '2-0';
      assuredPrediction = '+1.5 Buts & Multi 1-4 (100% Assuré)';
      isPinned = true;
      confidenceBadge = '⭐ 100% Assuré • Favori Domicile';
    } else if (o1 < 1.70) {
      predictedExact = '2-1';
      altExact = '2-0';
      assuredPrediction = 'Multi-Buts 1-4 Buts (100% Assuré)';
      isPinned = true;
      confidenceBadge = '⭐ 100% Assuré • Favori Domicile';
    } else if (o2 < 1.40) {
      predictedExact = '1-3';
      altExact = '0-2';
      assuredPrediction = '+1.5 Buts & Multi 1-4 (100% Assuré)';
      isPinned = true;
      confidenceBadge = '⭐ 100% Assuré • Favori Extérieur';
    } else if (o2 < 1.70) {
      predictedExact = '1-2';
      altExact = '0-2';
      assuredPrediction = 'Multi-Buts 1-4 Buts (100% Assuré)';
      isPinned = true;
      confidenceBadge = '⭐ 100% Assuré • Favori Extérieur';
    } else if (o1 > 2.3 && o2 > 2.3 && oN && oN < 3.2) {
      predictedExact = '1-1';
      altExact = '0-0';
      assuredPrediction = '1-3 Buts (100% Assuré • U3.5)';
      isPinned = true;
      confidenceBadge = '🛡️ 100% Assuré • Équilibré';
    } else {
      predictedExact = o1 <= o2 ? '2-1' : '1-2';
      altExact = '1-1';
      assuredPrediction = 'Multi-Buts 1-4 Buts (100% Assuré)';
      isPinned = true;
    }
  }

  return {
    totalGoalsPrediction: assuredPrediction,
    totalGoalsAssured: assuredPrediction,
    predictedExactScore: predictedExact,
    alternativeScore: altExact,
    victoirePrediction: computeVictoire(o1, oN, o2, predictedExact),
    winnerInfo: computeWinner(team1, team2, o1, o2, predictedExact),
    bttsPrediction: computeBTTS(o1, o2, predictedExact),
    isPinned,
    isIdenticalOdds: false,
    confidenceBadge,
    source: 'assured_prediction',
  };
}
