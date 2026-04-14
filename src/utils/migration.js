const CURRENT_VERSION = 3;

export function runMigration() {
  const version = JSON.parse(localStorage.getItem('bp_version') || '0');
  if (version >= CURRENT_VERSION) return;

  if (version < 2) {
    migratePlayersModel();
    migrateBlacklistToPlayers();
    migrateConfig();
  }

  if (version < 3) {
    migrateConfigV3();
  }

  localStorage.setItem('bp_version', JSON.stringify(CURRENT_VERSION));
}

function migratePlayersModel() {
  const raw = localStorage.getItem('bp_players');
  if (!raw) return;

  const players = JSON.parse(raw);
  const migrated = players.map((p) => ({
    ...p,
    notes: p.notes || '',
    blacklist: p.blacklist || [],
  }));
  localStorage.setItem('bp_players', JSON.stringify(migrated));
}

function migrateBlacklistToPlayers() {
  const raw = localStorage.getItem('bp_blacklist');
  if (!raw) return;

  const blacklist = JSON.parse(raw);
  if (blacklist.length === 0) {
    localStorage.removeItem('bp_blacklist');
    return;
  }

  const playersRaw = localStorage.getItem('bp_players');
  if (!playersRaw) return;

  const players = JSON.parse(playersRaw);
  const playerMap = new Map(players.map((p) => [p.id, p]));

  for (const [id1, id2] of blacklist) {
    const p1 = playerMap.get(id1);
    const p2 = playerMap.get(id2);
    if (p1 && !p1.blacklist.includes(id2)) {
      p1.blacklist.push(id2);
    }
    if (p2 && !p2.blacklist.includes(id1)) {
      p2.blacklist.push(id1);
    }
  }

  localStorage.setItem('bp_players', JSON.stringify(players));
  localStorage.removeItem('bp_blacklist');
}

function migrateConfig() {
  const raw = localStorage.getItem('bp_config');
  if (!raw) return;

  const config = JSON.parse(raw);
  if (config.randomness !== undefined) return;

  const bw = config.balanceWeight ?? 0.7;
  let randomness = 'medium';
  if (bw >= 0.67) randomness = 'min';
  else if (bw <= 0.33) randomness = 'max';

  const repeatMap = { low: 'often', med: 'sometimes', high: 'rarely' };
  const repeatFrequency = repeatMap[config.repeatPenalty] || 'sometimes';

  const migrated = {
    gameFormat: config.gameFormat || 'doubles',
    pairLevelTolerance: config.levelDiffTolerance ?? config.pairLevelTolerance ?? 2,
    courtLevelTolerance: config.courtLevelTolerance ?? 3,
    repeatFrequency,
    randomness,
    mixedPairs: config.mixedPairs ?? false,
  };

  localStorage.setItem('bp_config', JSON.stringify(migrated));
}

function migrateConfigV3() {
  const raw = localStorage.getItem('bp_config');
  if (!raw) return;

  const config = JSON.parse(raw);
  if (config.avoidRepeats !== undefined) return;

  const migrated = {
    gameFormat: config.gameFormat || 'doubles',
    pairLevelTolerance: config.pairLevelTolerance ?? 2,
    courtLevelTolerance: config.courtLevelTolerance ?? 3,
    avoidRepeats: config.repeatFrequency !== 'often',
    mixedPairs: config.mixedPairs === true ? 'prefer' : (typeof config.mixedPairs === 'string' ? config.mixedPairs : 'any'),
    reshuffleMode: 'rebuild',
  };

  localStorage.setItem('bp_config', JSON.stringify(migrated));
}
