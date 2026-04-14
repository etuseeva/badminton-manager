function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pairKey(id1, id2) {
  return [id1, id2].sort().join(':');
}

function buildBlacklistSet(allPlayers) {
  const set = new Set();
  for (const p of allPlayers) {
    for (const blockedId of p.blacklist || []) {
      set.add(pairKey(p.id, blockedId));
    }
  }
  return set;
}

function chooseSitOut(activePlayerIds, previousRounds, count) {
  const sitOutCounts = {};
  for (const id of activePlayerIds) {
    sitOutCounts[id] = 0;
  }
  for (const round of previousRounds) {
    if (round.sittingOut) {
      for (const id of round.sittingOut) {
        if (sitOutCounts[id] !== undefined) {
          sitOutCounts[id]++;
        }
      }
    }
  }
  const sorted = [...activePlayerIds].sort((a, b) => sitOutCounts[a] - sitOutCounts[b]);
  return sorted.slice(0, count);
}

function sortByLevelWithShuffle(playerIds, playerMap) {
  const byLevel = {};
  for (const id of playerIds) {
    const level = playerMap[id]?.level || 0;
    if (!byLevel[level]) byLevel[level] = [];
    byLevel[level].push(id);
  }
  for (const level of Object.keys(byLevel)) {
    byLevel[level] = shuffle(byLevel[level]);
  }
  const levels = Object.keys(byLevel).map(Number).sort((a, b) => b - a);
  const result = [];
  for (const level of levels) {
    result.push(...byLevel[level]);
  }
  return result;
}

function scoreSplit(split, playerMap, config, blacklistSet) {
  let score = 0;
  let hard = false;

  for (const team of [split.team1, split.team2]) {
    if (team.length !== 2) continue;
    const [id1, id2] = team;
    const p1 = playerMap[id1];
    const p2 = playerMap[id2];
    if (!p1 || !p2) continue;

    const levelDiff = Math.abs(p1.level - p2.level);
    if (levelDiff > config.pairLevelTolerance) {
      hard = true;
      score += 10000;
    } else {
      score += levelDiff * 5;
    }

    if (blacklistSet.has(pairKey(id1, id2))) {
      hard = true;
      score += 10000;
    }

    if (config.mixedPairs === 'only') {
      if (p1.gender && p2.gender && p1.gender === p2.gender) {
        hard = true;
        score += 10000;
      }
    } else if (config.mixedPairs === 'prefer') {
      if (p1.gender && p2.gender && p1.gender !== p2.gender) {
        score -= 5;
      }
    }
  }

  const lvl1 = split.team1.reduce((s, id) => s + (playerMap[id]?.level || 0), 0);
  const lvl2 = split.team2.reduce((s, id) => s + (playerMap[id]?.level || 0), 0);
  const courtDiff = Math.abs(lvl1 - lvl2);
  if (courtDiff > config.courtLevelTolerance) {
    hard = true;
    score += 10000;
  } else {
    score += courtDiff * 2;
  }

  return { score, hard };
}

function bestSplitForGroup(group, playerMap, config, blacklistSet) {
  const [a, b, c, d] = group;
  const splits = [
    { team1: [a, b], team2: [c, d] },
    { team1: [a, c], team2: [b, d] },
    { team1: [a, d], team2: [b, c] },
  ];

  let best = splits[0];
  let bestScore = Infinity;

  for (const split of splits) {
    const { score } = scoreSplit(split, playerMap, config, blacklistSet);
    if (score < bestScore) {
      bestScore = score;
      best = split;
    }
  }

  return { court: best, score: bestScore };
}

function hasHardViolationsDoubles(courts, playerMap, config, blacklistSet) {
  for (const court of courts) {
    const { hard } = scoreSplit(court, playerMap, config, blacklistSet);
    if (hard) return true;
  }
  return false;
}

function hasHardViolationsSingles(courts, playerMap, config, blacklistSet) {
  for (const court of courts) {
    const id1 = court.team1[0];
    const id2 = court.team2[0];
    const p1 = playerMap[id1];
    const p2 = playerMap[id2];
    if (!p1 || !p2) continue;

    if (Math.abs(p1.level - p2.level) > config.courtLevelTolerance) return true;
    if (blacklistSet.has(pairKey(id1, id2))) return true;
  }
  return false;
}

function tryFixDoublesViolations(courts, playerMap, config, blacklistSet) {
  let result = courts.map((c) => ({ team1: [...c.team1], team2: [...c.team2] }));

  for (let pass = 0; pass < 3; pass++) {
    let improved = false;
    for (let ci = 0; ci < result.length - 1; ci++) {
      const ids1 = [...result[ci].team1, ...result[ci].team2];
      const ids2 = [...result[ci + 1].team1, ...result[ci + 1].team2];
      const oldScore =
        scoreSplit(result[ci], playerMap, config, blacklistSet).score +
        scoreSplit(result[ci + 1], playerMap, config, blacklistSet).score;

      if (oldScore < 10000) continue;

      for (let i = 0; i < ids1.length; i++) {
        for (let j = 0; j < ids2.length; j++) {
          const tempIds1 = [...ids1];
          const tempIds2 = [...ids2];
          [tempIds1[i], tempIds2[j]] = [tempIds2[j], tempIds1[i]];

          const nc1 = bestSplitForGroup(tempIds1, playerMap, config, blacklistSet);
          const nc2 = bestSplitForGroup(tempIds2, playerMap, config, blacklistSet);

          if (nc1.score + nc2.score < oldScore) {
            result[ci] = nc1.court;
            result[ci + 1] = nc2.court;
            improved = true;
            break;
          }
        }
        if (improved) break;
      }
    }
    if (!improved) break;
  }

  return result;
}

function getRepeatScore(courts, previousRounds) {
  let score = 0;
  for (const court of courts) {
    const allIds = [...court.team1, ...court.team2];
    for (let i = 0; i < allIds.length; i++) {
      for (let j = i + 1; j < allIds.length; j++) {
        for (let r = 0; r < previousRounds.length; r++) {
          const round = previousRounds[previousRounds.length - 1 - r];
          const wasOnSameCourt = round.courts?.some((c) => {
            const ids = [...c.team1, ...c.team2];
            return ids.includes(allIds[i]) && ids.includes(allIds[j]);
          });
          if (wasOnSameCourt) {
            score += 20 * (1 / (r + 1));
          }
        }
      }
    }
  }
  return score;
}

function tryFixDoublesRepeats(courts, playerMap, config, previousRounds, blacklistSet) {
  if (!config.avoidRepeats || previousRounds.length === 0) return courts;

  let result = courts.map((c) => ({ team1: [...c.team1], team2: [...c.team2] }));
  let bestRepeat = getRepeatScore(result, previousRounds);

  for (let pass = 0; pass < 3; pass++) {
    let improved = false;
    for (let ci = 0; ci < result.length - 1; ci++) {
      const ids1 = [...result[ci].team1, ...result[ci].team2];
      const ids2 = [...result[ci + 1].team1, ...result[ci + 1].team2];

      for (let i = 0; i < ids1.length; i++) {
        for (let j = 0; j < ids2.length; j++) {
          const tempIds1 = [...ids1];
          const tempIds2 = [...ids2];
          [tempIds1[i], tempIds2[j]] = [tempIds2[j], tempIds1[i]];

          const nc1 = bestSplitForGroup(tempIds1, playerMap, config, blacklistSet);
          const nc2 = bestSplitForGroup(tempIds2, playerMap, config, blacklistSet);

          if (nc1.score >= 10000 || nc2.score >= 10000) continue;

          const test = [...result];
          test[ci] = nc1.court;
          test[ci + 1] = nc2.court;

          const newRepeat = getRepeatScore(test, previousRounds);
          if (newRepeat < bestRepeat) {
            result[ci] = nc1.court;
            result[ci + 1] = nc2.court;
            bestRepeat = newRepeat;
            improved = true;
          }
        }
      }
    }
    if (!improved) break;
  }

  return result;
}

function scoreSinglesArr(courts, playerMap, config, blacklistSet, previousRounds) {
  let total = 0;
  for (const court of courts) {
    const id1 = court.team1[0];
    const id2 = court.team2[0];
    const p1 = playerMap[id1];
    const p2 = playerMap[id2];
    if (!p1 || !p2) continue;

    const levelDiff = Math.abs(p1.level - p2.level);
    if (levelDiff > config.courtLevelTolerance) total += 10000;
    else total += levelDiff * 2;

    if (blacklistSet.has(pairKey(id1, id2))) total += 10000;

    if (config.avoidRepeats) {
      for (let r = 0; r < previousRounds.length; r++) {
        const round = previousRounds[previousRounds.length - 1 - r];
        const played = round.courts?.some((c) => {
          const ids = [...c.team1, ...c.team2];
          return ids.includes(id1) && ids.includes(id2);
        });
        if (played) total += 20 * (1 / (r + 1));
      }
    }
  }
  return total;
}

function tryFixSingles(courts, playerMap, config, blacklistSet, previousRounds) {
  let result = courts.map((c) => ({ team1: [...c.team1], team2: [...c.team2] }));
  let bestScore = scoreSinglesArr(result, playerMap, config, blacklistSet, previousRounds);

  for (let pass = 0; pass < 3; pass++) {
    let improved = false;
    for (let ci = 0; ci < result.length; ci++) {
      for (let cj = ci + 1; cj < result.length; cj++) {
        for (const [s1, s2] of [['team1', 'team1'], ['team1', 'team2'], ['team2', 'team1'], ['team2', 'team2']]) {
          const temp = result.map((c) => ({ team1: [...c.team1], team2: [...c.team2] }));
          [temp[ci][s1][0], temp[cj][s2][0]] = [temp[cj][s2][0], temp[ci][s1][0]];
          const newScore = scoreSinglesArr(temp, playerMap, config, blacklistSet, previousRounds);
          if (newScore < bestScore) {
            result = temp;
            bestScore = newScore;
            improved = true;
          }
        }
      }
    }
    if (!improved) break;
  }

  return result;
}

function sortCourtsByStrength(courts, playerMap) {
  return [...courts].sort((a, b) => {
    const totalA = [...a.team1, ...a.team2].reduce((s, id) => s + (playerMap[id]?.level || 0), 0);
    const totalB = [...b.team1, ...b.team2].reduce((s, id) => s + (playerMap[id]?.level || 0), 0);
    return totalB - totalA;
  });
}

// ── REBUILD ──
function buildCourts(pool, playerMap, config, blacklistSet, previousRounds) {
  const sorted = sortByLevelWithShuffle(pool, playerMap);
  const isDoubles = config.gameFormat !== 'singles';
  let courts = [];

  if (isDoubles) {
    for (let i = 0; i < sorted.length; i += 4) {
      const group = sorted.slice(i, i + 4);
      if (group.length === 4) {
        courts.push(bestSplitForGroup(group, playerMap, config, blacklistSet).court);
      }
    }
    courts = tryFixDoublesViolations(courts, playerMap, config, blacklistSet);
    courts = tryFixDoublesRepeats(courts, playerMap, config, previousRounds, blacklistSet);
  } else {
    for (let i = 0; i < sorted.length; i += 2) {
      courts.push({ team1: [sorted[i]], team2: [sorted[i + 1]] });
    }
    courts = tryFixSingles(courts, playerMap, config, blacklistSet, previousRounds);
  }

  return sortCourtsByStrength(courts, playerMap);
}

// ── SWAP: small random swaps between courts ──
function swapCourts(currentCourts, playerMap, config, blacklistSet) {
  const isDoubles = config.gameFormat !== 'singles';
  let courts = currentCourts.map((c) => ({ team1: [...c.team1], team2: [...c.team2] }));
  let swapped = false;

  for (let attempt = 0; attempt < 30 && !swapped; attempt++) {
    const ci1 = Math.floor(Math.random() * courts.length);
    const ci2 = Math.floor(Math.random() * courts.length);
    if (ci1 === ci2) continue;

    const ids1 = [...courts[ci1].team1, ...courts[ci1].team2];
    const ids2 = [...courts[ci2].team1, ...courts[ci2].team2];
    const i = Math.floor(Math.random() * ids1.length);
    const j = Math.floor(Math.random() * ids2.length);

    const p1 = playerMap[ids1[i]];
    const p2 = playerMap[ids2[j]];
    if (!p1 || !p2 || Math.abs(p1.level - p2.level) > 1) continue;

    const newIds1 = [...ids1];
    const newIds2 = [...ids2];
    [newIds1[i], newIds2[j]] = [newIds2[j], newIds1[i]];

    if (isDoubles && newIds1.length === 4 && newIds2.length === 4) {
      const nc1 = bestSplitForGroup(newIds1, playerMap, config, blacklistSet);
      const nc2 = bestSplitForGroup(newIds2, playerMap, config, blacklistSet);
      if (nc1.score < 10000 && nc2.score < 10000) {
        courts[ci1] = nc1.court;
        courts[ci2] = nc2.court;
        swapped = true;
      }
    } else if (!isDoubles) {
      courts[ci1] = { team1: [newIds1[0]], team2: [newIds1[1]] };
      courts[ci2] = { team1: [newIds2[0]], team2: [newIds2[1]] };
      swapped = true;
    }
  }

  if (!swapped) return null;
  return sortCourtsByStrength(courts, playerMap);
}

// ── ROTATE: shift weakest/strongest between adjacent courts ──
function rotateCourts(currentCourts, playerMap, config, blacklistSet) {
  if (currentCourts.length < 2) return null;

  const isDoubles = config.gameFormat !== 'singles';
  const courts = currentCourts.map((c) => ({ team1: [...c.team1], team2: [...c.team2] }));

  for (let ci = 0; ci < courts.length - 1; ci++) {
    const ids1 = [...courts[ci].team1, ...courts[ci].team2];
    const ids2 = [...courts[ci + 1].team1, ...courts[ci + 1].team2];

    ids1.sort((a, b) => (playerMap[a]?.level || 0) - (playerMap[b]?.level || 0));
    ids2.sort((a, b) => (playerMap[b]?.level || 0) - (playerMap[a]?.level || 0));

    const weakest = ids1[0];
    const strongest = ids2[0];
    if (weakest === strongest) continue;

    const newIds1 = [...courts[ci].team1, ...courts[ci].team2].map((id) =>
      id === weakest ? strongest : id,
    );
    const newIds2 = [...courts[ci + 1].team1, ...courts[ci + 1].team2].map((id) =>
      id === strongest ? weakest : id,
    );

    if (isDoubles && newIds1.length === 4 && newIds2.length === 4) {
      courts[ci] = bestSplitForGroup(newIds1, playerMap, config, blacklistSet).court;
      courts[ci + 1] = bestSplitForGroup(newIds2, playerMap, config, blacklistSet).court;
    } else if (!isDoubles && newIds1.length === 2 && newIds2.length === 2) {
      courts[ci] = { team1: [newIds1[0]], team2: [newIds1[1]] };
      courts[ci + 1] = { team1: [newIds2[0]], team2: [newIds2[1]] };
    }
  }

  return sortCourtsByStrength(courts, playerMap);
}

export function generateCourts(activePlayerIds, allPlayers, config, previousRounds, currentCourts) {
  const blacklistSet = buildBlacklistSet(allPlayers);
  const playerMap = Object.fromEntries(allPlayers.map((p) => [p.id, p]));
  const isDoubles = config.gameFormat !== 'singles';
  const groupSize = isDoubles ? 4 : 2;

  let pool = [...activePlayerIds];
  let sittingOut = [];

  if (pool.length < 2) {
    return { courts: [], sittingOut: [], warning: false };
  }

  if (isDoubles && pool.length < 4) {
    if (pool.length === 2) {
      return {
        courts: [{ team1: [pool[0]], team2: [pool[1]] }],
        sittingOut: [],
        warning: false,
      };
    }
    if (pool.length === 3) {
      const shuffled = shuffle(pool);
      return {
        courts: [{ team1: [shuffled[0], shuffled[1]], team2: [shuffled[2]] }],
        sittingOut: [],
        warning: false,
      };
    }
  }

  const remainder = pool.length % groupSize;
  if (remainder > 0) {
    sittingOut = chooseSitOut(pool, previousRounds, remainder);
    pool = pool.filter((id) => !sittingOut.includes(id));
  }

  let courts = null;
  const mode = config.reshuffleMode || 'rebuild';

  if (currentCourts && currentCourts.length > 0) {
    const currentPool = currentCourts.flatMap((c) => [...c.team1, ...c.team2]);
    const poolSet = new Set(pool);
    const valid = currentPool.length === pool.length && currentPool.every((id) => poolSet.has(id));

    if (valid) {
      if (mode === 'swap') {
        courts = swapCourts(currentCourts, playerMap, config, blacklistSet);
      } else if (mode === 'rotate') {
        courts = rotateCourts(currentCourts, playerMap, config, blacklistSet);
      }
    }
  }

  if (!courts) {
    courts = buildCourts(pool, playerMap, config, blacklistSet, previousRounds);
  }

  const warning = isDoubles
    ? hasHardViolationsDoubles(courts, playerMap, config, blacklistSet)
    : hasHardViolationsSingles(courts, playerMap, config, blacklistSet);

  return { courts, sittingOut, warning };
}
