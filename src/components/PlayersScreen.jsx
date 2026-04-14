import { useState } from 'react';
import PlayerForm from './PlayerForm';
import BatchAddForm from './BatchAddForm';

export default function PlayersScreen({ players, setPlayers, blacklist, setBlacklist }) {
  const [showForm, setShowForm] = useState(false);
  const [showBatch, setShowBatch] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showBlacklist, setShowBlacklist] = useState(false);
  const [bl1, setBl1] = useState('');
  const [bl2, setBl2] = useState('');

  const addPlayer = (data) => {
    setPlayers((prev) => [...prev, { ...data, id: crypto.randomUUID() }]);
    setShowForm(false);
  };

  const batchAdd = (list) => {
    const newPlayers = list.map((p) => ({ ...p, id: crypto.randomUUID() }));
    setPlayers((prev) => [...prev, ...newPlayers]);
    setShowBatch(false);
  };

  const updatePlayer = (data) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === editingId ? { ...p, ...data } : p))
    );
    setEditingId(null);
  };

  const deletePlayer = (id) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    setBlacklist((prev) => prev.filter(([a, b]) => a !== id && b !== id));
  };

  const addBlacklistPair = () => {
    if (!bl1 || !bl2 || bl1 === bl2) return;
    const exists = blacklist.some(
      ([a, b]) => (a === bl1 && b === bl2) || (a === bl2 && b === bl1)
    );
    if (!exists) {
      setBlacklist((prev) => [...prev, [bl1, bl2]]);
    }
    setBl1('');
    setBl2('');
  };

  const removeBlacklistPair = (idx) => {
    setBlacklist((prev) => prev.filter((_, i) => i !== idx));
  };

  const playerName = (id) => players.find((p) => p.id === id)?.name || '?';

  const levelColors = [
    '',
    'bg-green-100 text-green-700',
    'bg-blue-100 text-blue-700',
    'bg-yellow-100 text-yellow-700',
    'bg-orange-100 text-orange-700',
    'bg-red-100 text-red-700',
  ];

  const noFormOpen = !showForm && !showBatch && editingId === null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">Игроки</h1>
        <span className="text-xs text-gray-400">{players.length} всего</span>
      </div>

      {noFormOpen && (
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(true)}
            className="flex-1 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-teal-primary hover:text-teal-primary transition-colors"
          >
            + Добавить
          </button>
          <button
            onClick={() => setShowBatch(true)}
            className="flex-1 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-teal-primary hover:text-teal-primary transition-colors"
          >
            + Список
          </button>
        </div>
      )}

      {showForm && (
        <PlayerForm onSave={addPlayer} onCancel={() => setShowForm(false)} />
      )}

      {showBatch && (
        <BatchAddForm onAdd={batchAdd} onCancel={() => setShowBatch(false)} />
      )}

      <div className="space-y-1.5">
        {players
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((p) =>
            editingId === p.id ? (
              <PlayerForm
                key={p.id}
                player={p}
                onSave={updatePlayer}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div
                key={p.id}
                className="flex items-center gap-2 bg-white rounded-lg px-3 py-2.5 shadow-sm border border-gray-100"
              >
                <span className="flex-1 text-sm font-medium text-gray-800 text-left">
                  {p.name}
                </span>
                {p.gender && (
                  <span className="text-xs text-gray-400">
                    {p.gender === 'M' ? 'М' : 'Ж'}
                  </span>
                )}
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${levelColors[p.level]}`}
                >
                  Ур.{p.level}
                </span>
                <button
                  onClick={() => setEditingId(p.id)}
                  className="text-gray-300 hover:text-teal-primary text-sm px-1"
                >
                  ✎
                </button>
                <button
                  onClick={() => deletePlayer(p.id)}
                  className="text-gray-300 hover:text-red-400 text-sm px-1"
                >
                  ✕
                </button>
              </div>
            )
          )}
      </div>

      <button
        onClick={() => setShowBlacklist(!showBlacklist)}
        className="text-xs text-gray-400 underline"
      >
        {showBlacklist ? 'Скрыть' : 'Показать'} запрет пар ({blacklist.length})
      </button>

      {showBlacklist && (
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 space-y-2">
          <div className="flex gap-1">
            <select
              value={bl1}
              onChange={(e) => setBl1(e.target.value)}
              className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1.5"
            >
              <option value="">Игрок 1</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              value={bl2}
              onChange={(e) => setBl2(e.target.value)}
              className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1.5"
            >
              <option value="">Игрок 2</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              onClick={addBlacklistPair}
              className="px-3 py-1.5 bg-teal-primary text-white rounded-lg text-sm"
            >
              +
            </button>
          </div>
          {blacklist.map(([a, b], i) => (
            <div
              key={i}
              className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-1.5"
            >
              <span>
                {playerName(a)} ✕ {playerName(b)}
              </span>
              <button
                onClick={() => removeBlacklistPair(i)}
                className="text-gray-300 hover:text-red-400"
              >
                ✕
              </button>
            </div>
          ))}
          {blacklist.length === 0 && (
            <p className="text-xs text-gray-400 text-center">Нет запретов</p>
          )}
        </div>
      )}
    </div>
  );
}
