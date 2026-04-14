import { useState } from 'react';

export default function SessionScreen({ players, session, setSession, onNavigate }) {
  const [selected, setSelected] = useState(() => {
    if (session) return new Set(session.playerIds);
    return new Set(players.map((p) => p.id));
  });

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(players.map((p) => p.id)));
  const selectNone = () => setSelected(new Set());

  const startSession = () => {
    const ids = [...selected];
    setSession({
      playerIds: ids,
      activePlayerIds: ids,
      rounds: [],
      startedAt: Date.now(),
    });
    onNavigate('round');
  };

  const endSession = () => {
    setSession(null);
  };

  const levelColors = [
    '',
    'bg-green-100 text-green-700',
    'bg-blue-100 text-blue-700',
    'bg-yellow-100 text-yellow-700',
    'bg-orange-100 text-orange-700',
    'bg-red-100 text-red-700',
  ];

  if (session) {
    const sessionPlayers = players.filter((p) => session.playerIds.includes(p.id));
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-bold text-gray-800">Active Session</h1>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-2">
          <p className="text-sm text-gray-500">
            {session.activePlayerIds.length} active / {session.playerIds.length} total players
          </p>
          <p className="text-sm text-gray-500">{session.rounds.length} rounds played</p>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => onNavigate('round')}
              className="flex-1 py-2.5 bg-teal-primary text-white rounded-lg text-sm font-medium"
            >
              Go to Round
            </button>
            <button
              onClick={endSession}
              className="px-4 py-2.5 bg-red-50 text-red-500 rounded-lg text-sm font-medium"
            >
              End Session
            </button>
          </div>
        </div>
        <div className="space-y-1">
          {sessionPlayers.map((p) => (
            <div
              key={p.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                session.activePlayerIds.includes(p.id)
                  ? 'bg-white text-gray-800'
                  : 'bg-gray-50 text-gray-400 line-through'
              }`}
            >
              <span className="flex-1 text-left">{p.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${levelColors[p.level]}`}>
                Lv{p.level}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const sortedPlayers = [...players].sort((a, b) => a.name.localeCompare(b.name));
  const count = selected.size;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">New Session</h1>
        <div className="flex gap-2">
          <button onClick={selectAll} className="text-xs text-teal-primary">
            All
          </button>
          <button onClick={selectNone} className="text-xs text-gray-400">
            None
          </button>
        </div>
      </div>

      <div className="space-y-1">
        {sortedPlayers.map((p) => (
          <button
            key={p.id}
            onClick={() => toggle(p.id)}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${
              selected.has(p.id)
                ? 'bg-teal-light border border-teal-primary/20'
                : 'bg-white border border-gray-100'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center text-xs shrink-0 ${
                selected.has(p.id)
                  ? 'bg-teal-primary border-teal-primary text-white'
                  : 'border-gray-300'
              }`}
            >
              {selected.has(p.id) && '✓'}
            </span>
            <span className="flex-1 font-medium">{p.name}</span>
            {p.gender && <span className="text-xs text-gray-400">{p.gender}</span>}
            <span className={`text-xs px-2 py-0.5 rounded-full ${levelColors[p.level]}`}>
              Lv{p.level}
            </span>
          </button>
        ))}
      </div>

      {players.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">
          Add players first in the Players tab
        </p>
      )}

      <div className="sticky bottom-16 bg-slate-50/90 backdrop-blur-sm py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">
            {count} selected{count % 2 !== 0 && count > 0 && ' (odd — one will sit out)'}
          </span>
        </div>
        <button
          onClick={startSession}
          disabled={count < 4}
          className="w-full py-3 bg-teal-primary text-white rounded-xl text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Start Session
        </button>
      </div>
    </div>
  );
}
