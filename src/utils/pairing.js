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

function scorePairing(pairs, players, config, previousRounds, blacklistSet) {
  const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));
  const penaltyMultiplier = { low: 1, med: 3, high: 5 }[config.repeatPenalty] || 3;
  let total = 0;

  for (const [id1, id2] of pairs) {
    const p1 = playerMap[id1];
    const p2 = playerMap[id2];
    if (!p1 || !p2) continue;

    const levelDiff = Math.abs(p1.level - p2.level);
    if (levelDiff > config.levelDiffTolerance) {
      total += (levelDiff - config.levelDiffTolerance) * 10;
    } else {
      total += levelDiff * 2;
    }

    const key = pairKey(id1, id2);
    for (let r = 0; r < previousRounds.length; r++) {
      const round = previousRounds[previousRounds.length - 1 - r];
      const wasPaired = round.pairs.some(([a, b]) => pairKey(a, b) === key);
      if (wasPaired) {
        const recency = 1 / (r + 1);
        total += 20 * penaltyMultiplier * recency;
      }
    }

    if (blacklistSet.has(key)) {
      total += 1000;
    }

    if (config.mixedPairs && p1.gender && p2.gender && p1.gender !== p2.gender) {
      total -= 5;
    }
  }

  return total;
}

function chooseSitOut(activePlayerIds, previousRounds) {
  const sitOutCounts = {};
  for (const id of activePlayerIds) {
    sitOutCounts[id] = 0;
  }
  for (const round of previousRounds) {
    if (round.sittingOut && sitOutCounts[round.sittingOut] !== undefined) {
      sitOutCounts[round.sittingOut]++;
    }
  }
  let minCount = Infinity;
  let candidates = [];
  for (const id of activePlayerIds) {
    if (sitOutCounts[id] < minCount) {
      minCount = sitOutCounts[id];
      candidates = [id];
    } else if (sitOutCounts[id] === minCount) {
      candidates.push(id);
    }
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function generatePairs(activePlayerIds, allPlayers, config, previousRounds, blacklist) {
  const blacklistSet = new Set(blacklist.map(([a, b]) => pairKey(a, b)));

  let pool = [...activePlayerIds];
  let sittingOut = null;

  if (pool.length < 2) {
    return { pairs: [], sittingOut: null };
  }

  if (pool.length % 2 !== 0) {
    sittingOut = chooseSitOut(pool, previousRounds);
    pool = pool.filter((id) => id !== sittingOut);
  }

  let bestPairs = null;
  let bestScore = Infinity;
  const iterations = 100;

  for (let i = 0; i < iterations; i++) {
    const shuffled = shuffle(pool);
    const pairs = [];
    for (let j = 0; j < shuffled.length; j += 2) {
      pairs.push([shuffled[j], shuffled[j + 1]]);
    }

    const raw = scorePairing(pairs, allPlayers, config, previousRounds, blacklistSet);
    const noise = Math.random() * 10;
    const score = raw * config.balanceWeight + noise * (1 - config.balanceWeight);

    if (score < bestScore) {
      bestScore = score;
      bestPairs = pairs;
    }
  }

  return { pairs: bestPairs, sittingOut };
}
