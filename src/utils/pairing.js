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

function splitIntoTeams(group, players) {
  const [a, b, c, d] = group;
  const splits = [
    { team1: [a, b], team2: [c, d] },
    { team1: [a, c], team2: [b, d] },
    { team1: [a, d], team2: [b, c] },
  ];

  const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));
  let best = splits[0];
  let bestDiff = Infinity;

  for (const split of splits) {
    const lvl1 = split.team1.reduce((s, id) => s + (playerMap[id]?.level || 0), 0);
    const lvl2 = split.team2.reduce((s, id) => s + (playerMap[id]?.level || 0), 0);
    const diff = Math.abs(lvl1 - lvl2);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = split;
    }
  }

  return best;
}

function scoreArrangement(courts, players, config, previousRounds, blacklistSet) {
  const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));
  const penaltyMultiplier = { low: 1, med: 3, high: 5 }[config.repeatPenalty] || 3;
  let total = 0;

  for (const court of courts) {
    const allIds = [...court.team1, ...court.team2];

    for (const team of [court.team1, court.team2]) {
      if (team.length === 2) {
        const [id1, id2] = team;
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
        if (blacklistSet.has(key)) {
          total += 1000;
        }

        if (config.mixedPairs && p1.gender && p2.gender && p1.gender !== p2.gender) {
          total -= 5;
        }
      }
    }

    const teamLevel1 = court.team1.reduce((s, id) => s + (playerMap[id]?.level || 0), 0);
    const teamLevel2 = court.team2.reduce((s, id) => s + (playerMap[id]?.level || 0), 0);
    total += Math.abs(teamLevel1 - teamLevel2) * 3;

    for (let i = 0; i < allIds.length; i++) {
      for (let j = i + 1; j < allIds.length; j++) {
        const key = pairKey(allIds[i], allIds[j]);
        for (let r = 0; r < previousRounds.length; r++) {
          const round = previousRounds[previousRounds.length - 1 - r];
          const wasOnSameCourt = round.courts?.some((c) => {
            const ids = [...c.team1, ...c.team2];
            return ids.includes(allIds[i]) && ids.includes(allIds[j]);
          });
          if (wasOnSameCourt) {
            const recency = 1 / (r + 1);
            total += 20 * penaltyMultiplier * recency;
          }
        }
      }
    }
  }

  return total;
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

export function generateCourts(activePlayerIds, allPlayers, config, previousRounds, blacklist) {
  const blacklistSet = new Set(blacklist.map(([a, b]) => pairKey(a, b)));

  let pool = [...activePlayerIds];
  let sittingOut = [];

  if (pool.length < 4) {
    if (pool.length < 2) return { courts: [], sittingOut: [] };
    const shuffled = shuffle(pool);
    const court = splitIntoTeams(
      pool.length >= 4 ? shuffled.slice(0, 4) : shuffled,
      allPlayers
    );
    if (pool.length === 2) {
      return {
        courts: [{ team1: [shuffled[0]], team2: [shuffled[1]] }],
        sittingOut: [],
      };
    }
    if (pool.length === 3) {
      return {
        courts: [{ team1: [shuffled[0]], team2: [shuffled[1], shuffled[2]] }],
        sittingOut: [],
      };
    }
  }

  const remainder = pool.length % 4;
  if (remainder > 0) {
    sittingOut = chooseSitOut(pool, previousRounds, remainder);
    pool = pool.filter((id) => !sittingOut.includes(id));
  }

  let bestCourts = null;
  let bestScore = Infinity;

  for (let i = 0; i < 100; i++) {
    const shuffled = shuffle(pool);
    const courts = [];
    for (let j = 0; j < shuffled.length; j += 4) {
      const group = shuffled.slice(j, j + 4);
      courts.push(splitIntoTeams(group, allPlayers));
    }

    const raw = scoreArrangement(courts, allPlayers, config, previousRounds, blacklistSet);
    const noise = Math.random() * 10;
    const score = raw * config.balanceWeight + noise * (1 - config.balanceWeight);

    if (score < bestScore) {
      bestScore = score;
      bestCourts = courts;
    }
  }

  return { courts: bestCourts, sittingOut };
}
