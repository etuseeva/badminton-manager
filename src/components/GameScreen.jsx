import { useState } from 'react';
import { generateCourts } from '../utils/pairing';
import CourtCard from './PairCard';
import SearchInput from './SearchInput';
import SettingsScreen from './SettingsScreen';

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
  history,
  setHistory,
}) {
  const [selected, setSelected] = useState(() => new Set(players.map((p) => p.id)));
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [search, setSearch] = useState('');
  const [sessionSearch, setSessionSearch] = useState('');
  const [swapPlayerId, setSwapPlayerId] = useState(null);

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

  const getCurrentCourts = () => {
    if (!session || session.rounds.length === 0) return null;
    const last = session.rounds[session.rounds.length - 1];
    if (last.confirmed) return null;
    return last.courts || null;
  };

  const doGenerate = () => {
    const currentCourts = getCurrentCourts();
    const result = generateCourts(
      session.activePlayerIds,
      players,
      config,
      session.rounds,
      currentCourts,
    );
    setSwapPlayerId(null);
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
    const confirmedRounds = session.rounds.map((r) => ({ ...r, confirmed: true }));
    const result = generateCourts(
      session.activePlayerIds,
      players,
      config,
      confirmedRounds,
      null,
    );
    setSwapPlayerId(null);
    setSession((prev) => ({
      ...prev,
      rounds: [
        ...confirmedRounds,
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

  const handleSwapClick = (playerId) => {
    if (!swapPlayerId) {
      setSwapPlayerId(playerId);
      return;
    }
    if (swapPlayerId === playerId) {
      setSwapPlayerId(null);
      return;
    }

    const currentRound = session.rounds[session.rounds.length - 1];
    if (!currentRound || !currentRound.courts) return;

    const findCourt = (id) => currentRound.courts.findIndex((c) =>
      c.team1.includes(id) || c.team2.includes(id),
    );

    const courtIdx1 = findCourt(swapPlayerId);
    const courtIdx2 = findCourt(playerId);

    if (courtIdx1 === -1 || courtIdx2 === -1 || courtIdx1 === courtIdx2) {
      setSwapPlayerId(playerId);
      return;
    }

    setSession((prev) => {
      const rounds = [...prev.rounds];
      const round = { ...rounds[rounds.length - 1] };
      const courts = round.courts.map((c) => ({ team1: [...c.team1], team2: [...c.team2] }));

      const replaceInCourt = (court, oldId, newId) => ({
        team1: court.team1.map((id) => (id === oldId ? newId : id)),
        team2: court.team2.map((id) => (id === oldId ? newId : id)),
      });

      courts[courtIdx1] = replaceInCourt(courts[courtIdx1], swapPlayerId, playerId);
      courts[courtIdx2] = replaceInCourt(courts[courtIdx2], playerId, swapPlayerId);

      round.courts = courts;
      rounds[rounds.length - 1] = round;
      return { ...prev, rounds };
    });

    setSwapPlayerId(null);
  };

  const playerName = (id) => players.find((p) => p.id === id)?.name || '?';

  // ── Pre-session: player selection ──
  if (!session) {
    const sortedPlayers = [...players].sort((a, b) => a.name.localeCompare(b.name));
    const filteredPlayers = search
      ? sortedPlayers.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
      : sortedPlayers;
    const count = selected.size;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-800">Новая игра</h1>
          <div className="flex gap-3">
            <button onClick={selectAll} className="text-xs text-teal-primary">
              Выбрать всех
            </button>
            <button onClick={selectNone} className="text-xs text-gray-400">
              Сбросить
            </button>
          </div>
        </div>

        {players.length > 5 && (
          <SearchInput value={search} onChange={setSearch} placeholder="Поиск по имени..." />
        )}

        {sortedPlayers.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            Сначала добавьте игроков во вкладке Игроки
          </p>
        ) : (
          <div className="space-y-1 pb-24">
            {filteredPlayers.map((p) => (
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
                  Ур. {p.level}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="fixed bottom-14 left-0 right-0 z-10 bg-slate-50/95 backdrop-blur-sm px-4 py-3 pb-6 border-t border-gray-100">
          <div className="max-w-[480px] mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">
                {count} выбрано
                {count > 0 && count < 4 && config.gameFormat === 'doubles' && ' (нужно минимум 4)'}
                {count > 0 && count < 2 && config.gameFormat === 'singles' && ' (нужно минимум 2)'}
                {config.gameFormat === 'doubles' && count >= 4 && count % 4 !== 0 &&
                  ` (${count % 4} будут отдыхать)`}
                {config.gameFormat === 'singles' && count >= 2 && count % 2 !== 0 &&
                  ' (1 будет отдыхать)'}
              </span>
            </div>
            <button
              onClick={startSession}
              disabled={config.gameFormat === 'doubles' ? count < 4 : count < 2}
              className="w-full py-3 bg-teal-primary text-white rounded-xl text-sm font-semibold disabled:opacity-30"
            >
              Начать игру
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Active session: round view ──
  const currentRound = session.rounds[session.rounds.length - 1] || null;
  const availableToAdd = players.filter((p) => !session.playerIds.includes(p.id));
  const sessionPlayers = players.filter((p) => session.playerIds.includes(p.id));
  const filteredSessionPlayers = sessionSearch
    ? sessionPlayers.filter((p) => p.name.toLowerCase().includes(sessionSearch.toLowerCase()))
    : sessionPlayers;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">
          Раунд {session.rounds.length || '—'}
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettings(true)}
            className="text-base text-gray-400"
            title="Настройки"
          >
            ⚙️
          </button>
          <button
            onClick={endSession}
            className="text-xs text-red-400 underline"
          >
            Завершить игру
          </button>
        </div>
      </div>

      <div className="text-xs text-gray-400">
        {session.activePlayerIds.length} активных из {session.playerIds.length}
        {config.gameFormat === 'singles' && ' · одиночки'}
      </div>

      {currentRound && currentRound.warning && (
        <div className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
          Не удалось идеально подобрать пары с текущими настройками
        </div>
      )}

      {swapPlayerId && (
        <div className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2 flex items-center justify-between">
          <span>Выберите игрока на другом корте для обмена</span>
          <button onClick={() => setSwapPlayerId(null)} className="text-blue-400 ml-2">✕</button>
        </div>
      )}

      {currentRound && currentRound.courts && currentRound.courts.length > 0 ? (
        <div className="space-y-2">
          {currentRound.courts.map((court, i) => (
            <CourtCard
              key={i}
              court={court}
              players={players}
              index={i}
              swapPlayerId={swapPlayerId}
              onSwapClick={currentRound && !currentRound.confirmed ? handleSwapClick : undefined}
              courtIndex={i}
            />
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
          Нажмите «Составить пары» для генерации
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={doGenerate}
          disabled={session.activePlayerIds.length < 2}
          className="flex-1 py-2.5 bg-teal-primary text-white rounded-lg text-sm font-medium disabled:opacity-30"
        >
          {currentRound && !currentRound.confirmed ? 'Перемешать' : 'Составить пары'}
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
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400">Игроки</span>
        </div>
        {sessionPlayers.length > 6 && (
          <SearchInput value={sessionSearch} onChange={setSessionSearch} placeholder="Поиск..." />
        )}
        {filteredSessionPlayers.map((p) => (
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
            {showHistory ? 'Скрыть' : 'Показать'} историю раундов ({session.rounds.length - 1})
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

      {showSettings && (
        <SettingsScreen
          config={config}
          setConfig={setConfig}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
