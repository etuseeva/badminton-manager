import { useState } from 'react';

export default function HistoryScreen({ history, setHistory, players }) {
  const [expandedId, setExpandedId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const playerName = (id) => players.find((p) => p.id === id)?.name || '?';

  const deleteSession = (id) => {
    setHistory((prev) => prev.filter((s) => s.id !== id));
    setConfirmDeleteId(null);
  };

  const toggleInvalid = (id) => {
    setHistory((prev) =>
      prev.map((s) => (s.id === id ? { ...s, invalid: !s.invalid } : s))
    );
  };

  if (history.length === 0) {
    return (
      <div className="space-y-3">
        <h1 className="text-lg font-bold text-gray-800">История</h1>
        <p className="text-sm text-gray-400 text-center py-12">
          Пока нет завершённых игр
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h1 className="text-lg font-bold text-gray-800">История</h1>

      {history.map((s) => {
        const isExpanded = expandedId === s.id;

        return (
          <div
            key={s.id}
            className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
              s.invalid ? 'border-red-200 opacity-60' : 'border-gray-100'
            }`}
          >
            <button
              onClick={() => setExpandedId(isExpanded ? null : s.id)}
              className="w-full text-left px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-800">
                    {new Date(s.startedAt).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                    {s.invalid && (
                      <span className="ml-2 text-[10px] text-red-400 font-normal">
                        отменена
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {s.playerIds.length} игроков · {s.rounds.length} раундов
                  </div>
                </div>
                <span className="text-gray-300 text-xs">{isExpanded ? '▲' : '▼'}</span>
              </div>
            </button>

            {isExpanded && (
              <div className="px-4 pb-3 space-y-2">
                <div className="text-xs text-gray-400">
                  {s.playerIds.map((id) => playerName(id)).join(', ')}
                </div>

                {s.rounds.map((round, ri) => (
                  <div key={ri} className="bg-gray-50 rounded-lg p-2 space-y-1">
                    <div className="text-[10px] font-medium text-gray-500">
                      Раунд {ri + 1}
                    </div>
                    {round.courts?.map((court, ci) => (
                      <div key={ci} className="text-xs text-gray-600">
                        <span className="text-gray-400">Корт {ci + 1}:</span>{' '}
                        {court.team1.map((id) => playerName(id)).join(', ')}{' '}
                        <span className="text-gray-300">vs</span>{' '}
                        {court.team2.map((id) => playerName(id)).join(', ')}
                      </div>
                    ))}
                    {round.sittingOut && round.sittingOut.length > 0 && (
                      <div className="text-[10px] text-gray-400">
                        Отдыхали: {round.sittingOut.map((id) => playerName(id)).join(', ')}
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex gap-2 pt-1 border-t border-gray-100">
                  <button
                    onClick={() => toggleInvalid(s.id)}
                    className="text-xs text-gray-400 underline"
                  >
                    {s.invalid ? 'Восстановить' : 'Отметить как некорректную'}
                  </button>
                  {confirmDeleteId === s.id ? (
                    <div className="flex gap-1 ml-auto">
                      <button
                        onClick={() => deleteSession(s.id)}
                        className="text-xs text-red-500 font-medium"
                      >
                        Удалить
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-xs text-gray-400"
                      >
                        Отмена
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(s.id)}
                      className="text-xs text-red-400 underline ml-auto"
                    >
                      Удалить
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
