import { useState } from 'react';
import { generatePairs } from '../utils/pairing';
import PairCard from './PairCard';
import ConfigPanel from './ConfigPanel';

export default function RoundScreen({ players, session, setSession, config, setConfig, blacklist }) {
  const [showHistory, setShowHistory] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);

  if (!session) return null;

  const activePlayers = players.filter((p) => session.activePlayerIds.includes(p.id));
  const currentRound = session.rounds[session.rounds.length - 1] || null;

  const toggleActive = (id) => {
    setSession((prev) => {
      const active = prev.activePlayerIds.includes(id)
        ? prev.activePlayerIds.filter((pid) => pid !== id)
        : [...prev.activePlayerIds, id];
      return { ...prev, activePlayerIds: active };
    });
  };

  const doGenerate = () => {
    const result = generatePairs(
      session.activePlayerIds,
      players,
      config,
      session.rounds,
      blacklist
    );
    setSession((prev) => {
      const rounds = [...prev.rounds];
      if (rounds.length > 0 && !rounds[rounds.length - 1].confirmed) {
        rounds[rounds.length - 1] = { ...result, timestamp: Date.now(), confirmed: false };
      } else {
        rounds.push({ ...result, timestamp: Date.now(), confirmed: false });
      }
      return { ...prev, rounds };
    });
  };

  const nextRound = () => {
    setSession((prev) => {
      const rounds = prev.rounds.map((r) => ({ ...r, confirmed: true }));
      return { ...prev, rounds };
    });
    const result = generatePairs(
      session.activePlayerIds,
      players,
      config,
      session.rounds,
      blacklist
    );
    setSession((prev) => ({
      ...prev,
      rounds: [...prev.rounds, { ...result, timestamp: Date.now(), confirmed: false }],
    }));
  };

  const addPlayerToSession = (id) => {
    setSession((prev) => ({
      ...prev,
      playerIds: [...prev.playerIds, id],
      activePlayerIds: [...prev.activePlayerIds, id],
    }));
    setShowAddPlayer(false);
  };

  const availableToAdd = players.filter((p) => !session.playerIds.includes(p.id));
  const sittingOutPlayer = currentRound?.sittingOut
    ? players.find((p) => p.id === currentRound.sittingOut)
    : null;

  const playerName = (id) => players.find((p) => p.id === id)?.name || '?';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">
          Round {session.rounds.length || '—'}
        </h1>
        <span className="text-xs text-gray-400">
          {session.activePlayerIds.length} active
        </span>
      </div>

      <ConfigPanel config={config} setConfig={setConfig} />

      {currentRound && currentRound.pairs.length > 0 ? (
        <div className="space-y-2">
          {currentRound.pairs.map((pair, i) => (
            <PairCard key={i} pair={pair} players={players} index={i} />
          ))}
          {sittingOutPlayer && (
            <div className="text-center text-xs text-gray-400 py-2 bg-gray-50 rounded-lg">
              Sitting out: <span className="font-medium text-gray-600">{sittingOutPlayer.name}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-sm text-gray-400">
          Tap Generate to create pairs
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={doGenerate}
          disabled={session.activePlayerIds.length < 2}
          className="flex-1 py-2.5 bg-teal-primary text-white rounded-lg text-sm font-medium disabled:opacity-30"
        >
          {currentRound && !currentRound.confirmed ? 'Regenerate' : 'Generate'}
        </button>
        {currentRound && (
          <button
            onClick={nextRound}
            disabled={session.activePlayerIds.length < 2}
            className="flex-1 py-2.5 bg-gray-800 text-white rounded-lg text-sm font-medium disabled:opacity-30"
          >
            Next Round
          </button>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-xs text-gray-400 mb-1">Players</div>
        {players
          .filter((p) => session.playerIds.includes(p.id))
          .map((p) => (
            <button
              key={p.id}
              onClick={() => toggleActive(p.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                session.activePlayerIds.includes(p.id)
                  ? 'bg-white text-gray-800 border border-gray-100'
                  : 'bg-gray-50 text-gray-400 line-through border border-transparent'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  session.activePlayerIds.includes(p.id) ? 'bg-green-400' : 'bg-gray-300'
                }`}
              />
              <span className="flex-1">{p.name}</span>
              <span className="text-[10px] text-gray-400">
                {session.activePlayerIds.includes(p.id) ? 'active' : 'left'}
              </span>
            </button>
          ))}
      </div>

      {availableToAdd.length > 0 && (
        <div>
          <button
            onClick={() => setShowAddPlayer(!showAddPlayer)}
            className="text-xs text-teal-primary underline"
          >
            + Add player to session
          </button>
          {showAddPlayer && (
            <div className="mt-1 space-y-1">
              {availableToAdd.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addPlayerToSession(p.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-teal-light text-teal-dark text-left"
                >
                  <span>+ {p.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {session.rounds.length > 1 && (
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-xs text-gray-400 underline"
          >
            {showHistory ? 'Hide' : 'Show'} History ({session.rounds.length - 1} rounds)
          </button>
          {showHistory && (
            <div className="mt-2 space-y-2">
              {session.rounds
                .slice(0, -1)
                .reverse()
                .map((round, ri) => (
                  <div key={ri} className="bg-gray-50 rounded-lg p-2 space-y-1">
                    <div className="text-[10px] text-gray-400">
                      Round {session.rounds.length - 1 - ri}
                    </div>
                    {round.pairs.map(([a, b], pi) => (
                      <div key={pi} className="text-xs text-gray-600">
                        {playerName(a)} + {playerName(b)}
                      </div>
                    ))}
                    {round.sittingOut && (
                      <div className="text-[10px] text-gray-400">
                        Sat out: {playerName(round.sittingOut)}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
