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

function splitIntoTeams(group, playerMap, pairLevelTolerance) {
  const [a, b, c, d] = group;
  const splits = [
    { team1: [a, b], team2: [c, d] },
    { team1: [a, c], team2: [b, d] },
    { team1: [a, d], team2: [b, c] },
  ];

  const teamPairDiff = (team) => {
    if (team.length !== 2) return 0;
    return Math.abs((playerMap[team[0]]?.level || 0) - (playerMap[team[1]]?.level || 0));
  };

  const valid = splits.filter((s) => {
    return teamPairDiff(s.team1) <= pairLevelTolerance &&
           teamPairDiff(s.team2) <= pairLevelTolerance;
  });

  const candidates = valid.length > 0 ? valid : splits;

  let best = candidates[0];
  let bestDiff = Infinity;

  for (const split of candidates) {
    const lvl1 = split.team1.reduce((s, id) => s + (playerMap[id]?.level || 0), 0);
    const lvl2 = split.team2.reduce((s, id) => s + (playerMap[id]?.level || 0), 0);
    const diff = Math.abs(lvl1 - lvl2);
    const maxPairDiff = Math.max(teamPairDiff(split.team1), teamPairDiff(split.team2));
    const score = diff * 2 + maxPairDiff * 5;
    if (score < bestDiff) {
      bestDiff = score;
      best = split;
    }
  }

  return best;
}

function scoreDoublesArrangement(courts, playerMap, config, previousRounds, blacklistSet) {
  const repeatMultiplier = { often: 1, sometimes: 3, rarely: 5 }[config.repeatFrequency] || 3;
  let total = 0;

  for (const court of courts) {
    for (const team of [court.team1, court.team2]) {
      if (team.length === 2) {
        const [id1, id2] = team;
        const p1 = playerMap[id1];
        const p2 = playerMap[id2];
        if (!p1 || !p2) continue;

        const levelDiff = Math.abs(p1.level - p2.level);
        if (levelDiff > config.pairLevelTolerance) {
          total += 10000;
        } else {
          total += levelDiff * 2;
        }

        if (blacklistSet.has(pairKey(id1, id2))) {
          total += 10000;
        }

        if (config.mixedPairs && p1.gender && p2.gender && p1.gender !== p2.gender) {
          total -= 5;
        }
      }
    }

    const teamLevel1 = court.team1.reduce((s, id) => s + (playerMap[id]?.level || 0), 0);
    const teamLevel2 = court.team2.reduce((s, id) => s + (playerMap[id]?.level || 0), 0);
    const courtDiff = Math.abs(teamLevel1 - teamLevel2);
    if (courtDiff > config.courtLevelTolerance) {
      total += 10000;
    } else {
      total += courtDiff * 3;
    }

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
            total += 20 * repeatMultiplier * (1 / (r + 1));
          }
        }
      }
    }
  }

  return total;
}

function scoreSinglesArrangement(courts, playerMap, config, previousRounds, blacklistSet) {
  const repeatMultiplier = { often: 1, sometimes: 3, rarely: 5 }[config.repeatFrequency] || 3;
  let total = 0;

  for (const court of courts) {
    const id1 = court.team1[0];
    const id2 = court.team2[0];
    const p1 = playerMap[id1];
    const p2 = playerMap[id2];
    if (!p1 || !p2) continue;

    const levelDiff = Math.abs(p1.level - p2.level);
    if (levelDiff > config.pairLevelTolerance) {
      total += 10000;
    } else {
      total += levelDiff * 2;
    }

    if (blacklistSet.has(pairKey(id1, id2))) {
      total += 10000;
    }

    for (let r = 0; r < previousRounds.length; r++) {
      const round = previousRounds[previousRounds.length - 1 - r];
      const played = round.courts?.some((c) => {
        const ids = [...c.team1, ...c.team2];
        return ids.includes(id1) && ids.includes(id2);
      });
      if (played) {
        total += 20 * repeatMultiplier * (1 / (r + 1));
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

function getNoise(randomness) {
  const scale = { min: 2, medium: 15, max: 50 }[randomness] || 15;
  return Math.random() * scale;
}

function sortCourtsByStrength(courts, playerMap) {
  return [...courts].sort((a, b) => {
    const totalA = [...a.team1, ...a.team2].reduce((s, id) => s + (playerMap[id]?.level || 0), 0);
    const totalB = [...b.team1, ...b.team2].reduce((s, id) => s + (playerMap[id]?.level || 0), 0);
    return totalB - totalA;
  });
}

export function generateCourts(activePlayerIds, allPlayers, config, previousRounds) {
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

  let bestCourts = null;
  let bestScore = Infinity;

  for (let i = 0; i < 100; i++) {
    const shuffled = shuffle(pool);
    const courts = [];

    if (isDoubles) {
      for (let j = 0; j < shuffled.length; j += 4) {
        courts.push(splitIntoTeams(shuffled.slice(j, j + 4), playerMap, config.pairLevelTolerance));
      }
    } else {
      for (let j = 0; j < shuffled.length; j += 2) {
        courts.push({ team1: [shuffled[j]], team2: [shuffled[j + 1]] });
      }
    }

    const scoreFn = isDoubles ? scoreDoublesArrangement : scoreSinglesArrangement;
    const raw = scoreFn(courts, playerMap, config, previousRounds, blacklistSet);
    const score = raw + getNoise(config.randomness);

    if (score < bestScore) {
      bestScore = score;
      bestCourts = courts;
    }
  }

  bestCourts = sortCourtsByStrength(bestCourts, playerMap);

  return {
    courts: bestCourts,
    sittingOut,
    warning: bestScore >= 10000,
  };
}
