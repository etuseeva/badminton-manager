import { useState } from 'react';
import { generateCourts } from '../utils/pairing';
import CourtCard from './PairCard';
import ConfigPanel from './ConfigPanel';

const levelColors = [
  '',
  'bg-green-100 text-green-700',
  'bg-blue-100 text-blue-700',
  'bg-yellow-100 text-yellow-700',
  'bg-orange-100 text-orange-700',
  'bg-red-100 text-red-700',
];

export default function GameScreen({
  players,
  session,
  setSession,
  config,
  setConfig,
  blacklist,
  history,
  setHistory,
}) {
  const [selected, setSelected] = useState(() => new Set(players.map((p) => p.id)));
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSessionHistory, setShowSessionHistory] = useState(false);

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
  };

  const endSession = () => {
    if (session && session.rounds.length > 0) {
      setHistory((prev) => [
        {
          ...session,
          endedAt: Date.now(),
          id: crypto.randomUUID(),
        },
        ...prev,
      ]);
    }
    setSession(null);
  };

  const toggleActive = (id) => {
    setSession((prev) => {
      const active = prev.activePlayerIds.includes(id)
        ? prev.activePlayerIds.filter((pid) => pid !== id)
        : [...prev.activePlayerIds, id];
      return { ...prev, activePlayerIds: active };
    });
  };

  const doGenerate = () => {
    const result = generateCourts(
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
    const result = generateCourts(
      session.activePlayerIds,
      players,
      config,
      session.rounds.map((r) => ({ ...r, confirmed: true })),
      blacklist
    );
    setSession((prev) => ({
      ...prev,
      rounds: [
        ...prev.rounds.map((r) => ({ ...r, confirmed: true })),
        { ...result, timestamp: Date.now(), confirmed: false },
      ],
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

  const playerName = (id) => players.find((p) => p.id === id)?.name || '?';

  if (!session) {
    const sortedPlayers = [...players].sort((a, b) => a.name.localeCompare(b.name));
    const count = selected.size;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-800">Новая игра</h1>
          <div className="flex gap-2">
            <button onClick={selectAll} className="text-xs text-teal-primary">Все</button>
            <button onClick={selectNone} className="text-xs text-gray-400">Никто</button>
          </div>
        </div>

        {sortedPlayers.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            Сначала добавьте игроков во вкладке Игроки
          </p>
        ) : (
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
                {p.gender && (
                  <span className="text-xs text-gray-400">{p.gender === 'M' ? 'М' : 'Ж'}</span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full ${levelColors[p.level]}`}>
                  Ур.{p.level}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="sticky bottom-16 bg-slate-50/90 backdrop-blur-sm py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">
              {count} выбрано
              {count > 0 && count < 4 && ' (нужно минимум 4)'}
              {count >= 4 && count % 4 !== 0 && ` (${count % 4} будут отдыхать)`}
            </span>
          </div>
          <button
            onClick={startSession}
            disabled={count < 4}
            className="w-full py-3 bg-teal-primary text-white rounded-xl text-sm font-semibold disabled:opacity-30"
          >
            Начать игру
          </button>
        </div>

        {history.length > 0 && (
          <div className="pt-2">
            <button
              onClick={() => setShowSessionHistory(!showSessionHistory)}
              className="text-xs text-gray-400 underline"
            >
              {showSessionHistory ? 'Скрыть' : 'Показать'} историю сессий ({history.length})
            </button>
            {showSessionHistory && (
              <div className="mt-2 space-y-2">
                {history.map((s) => (
                  <div key={s.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-gray-600">
                        {new Date(s.startedAt).toLocaleDateString('ru-RU')}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {s.rounds.length} раундов
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {s.playerIds.map((id) => playerName(id)).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  const currentRound = session.rounds[session.rounds.length - 1] || null;
  const availableToAdd = players.filter((p) => !session.playerIds.includes(p.id));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">
          Раунд {session.rounds.length || '—'}
        </h1>
        <button
          onClick={endSession}
          className="text-xs text-red-400 underline"
        >
          Завершить
        </button>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{session.activePlayerIds.length} активных</span>
        <ConfigPanel config={config} setConfig={setConfig} />
      </div>

      {currentRound && currentRound.courts && currentRound.courts.length > 0 ? (
        <div className="space-y-2">
          {currentRound.courts.map((court, i) => (
            <CourtCard key={i} court={court} players={players} index={i} />
          ))}
          {currentRound.sittingOut && currentRound.sittingOut.length > 0 && (
            <div className="text-center text-xs text-gray-400 py-2 bg-gray-50 rounded-lg">
              Отдыхают: <span className="font-medium text-gray-600">
                {currentRound.sittingOut.map((id) => playerName(id)).join(', ')}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-sm text-gray-400">
          Нажмите Составить для генерации пар
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={doGenerate}
          disabled={session.activePlayerIds.length < 2}
          className="flex-1 py-2.5 bg-teal-primary text-white rounded-lg text-sm font-medium disabled:opacity-30"
        >
          {currentRound && !currentRound.confirmed ? 'Пересоставить' : 'Составить'}
        </button>
        {currentRound && (
          <button
            onClick={nextRound}
            disabled={session.activePlayerIds.length < 2}
            className="flex-1 py-2.5 bg-gray-800 text-white rounded-lg text-sm font-medium disabled:opacity-30"
          >
            Следующий раунд
          </button>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-xs text-gray-400 mb-1">Игроки</div>
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
                {session.activePlayerIds.includes(p.id) ? 'в игре' : 'ушёл'}
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
            + Добавить игрока в сессию
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
            {showHistory ? 'Скрыть' : 'Показать'} историю ({session.rounds.length - 1} раундов)
          </button>
          {showHistory && (
            <div className="mt-2 space-y-2">
              {session.rounds
                .slice(0, -1)
                .reverse()
                .map((round, ri) => (
                  <div key={ri} className="bg-gray-50 rounded-lg p-2 space-y-1">
                    <div className="text-[10px] text-gray-400">
                      Раунд {session.rounds.length - 1 - ri}
                    </div>
                    {round.courts?.map((court, ci) => (
                      <div key={ci} className="text-xs text-gray-600">
                        Корт {ci + 1}: {court.team1.map((id) => playerName(id)).join(', ')}{' '}
                        vs {court.team2.map((id) => playerName(id)).join(', ')}
                      </div>
                    ))}
                    {round.sittingOut && round.sittingOut.length > 0 && (
                      <div className="text-[10px] text-gray-400">
                        Отдыхали: {round.sittingOut.map((id) => playerName(id)).join(', ')}
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
