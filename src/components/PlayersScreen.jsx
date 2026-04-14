import { useState } from 'react';
import PlayerForm from './PlayerForm';
import BatchAddForm from './BatchAddForm';
import SearchInput from './SearchInput';

const levelColors = [
  '',
  'bg-green-100 text-green-700',
  'bg-blue-100 text-blue-700',
  'bg-yellow-100 text-yellow-700',
  'bg-orange-100 text-orange-700',
  'bg-red-100 text-red-700',
];

export default function PlayersScreen({ players, setPlayers }) {
  const [showForm, setShowForm] = useState(false);
  const [showBatch, setShowBatch] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState(null);

  const addPlayer = (data) => {
    setPlayers((prev) => [...prev, { ...data, id: crypto.randomUUID() }]);
    setShowForm(false);
  };

  const batchAdd = (list) => {
    const newPlayers = list.map((p) => ({
      ...p,
      id: crypto.randomUUID(),
      notes: '',
      blacklist: [],
    }));
    setPlayers((prev) => [...prev, ...newPlayers]);
    setShowBatch(false);
  };

  const updatePlayer = (data) => {
    setPlayers((prev) => {
      const updated = prev.map((p) => (p.id === editingId ? { ...p, ...data } : p));
      if (data.blacklist) {
        return syncBlacklist(updated, editingId, data.blacklist);
      }
      return updated;
    });
    setEditingId(null);
  };

  const deletePlayer = (id) => {
    setPlayers((prev) =>
      prev
        .filter((p) => p.id !== id)
        .map((p) => ({
          ...p,
          blacklist: (p.blacklist || []).filter((bid) => bid !== id),
        }))
    );
  };

  const filtered = players
    .filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (levelFilter !== null && p.level !== levelFilter) return false;
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

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
        <PlayerForm
          onSave={addPlayer}
          onCancel={() => setShowForm(false)}
          allPlayers={players}
        />
      )}

      {showBatch && (
        <BatchAddForm onAdd={batchAdd} onCancel={() => setShowBatch(false)} />
      )}

      {players.length > 5 && (
        <SearchInput value={search} onChange={setSearch} placeholder="Поиск по имени..." />
      )}

      {players.length > 5 && (
        <div className="flex gap-1">
          <button
            onClick={() => setLevelFilter(null)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              levelFilter === null ? 'bg-teal-primary text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >
            Все
          </button>
          {[1, 2, 3, 4, 5].map((l) => (
            <button
              key={l}
              onClick={() => setLevelFilter(levelFilter === l ? null : l)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                levelFilter === l ? 'bg-teal-primary text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              Ур. {l}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-1.5">
        {filtered.map((p) =>
          editingId === p.id ? (
            <PlayerForm
              key={p.id}
              player={p}
              onSave={updatePlayer}
              onCancel={() => setEditingId(null)}
              allPlayers={players}
            />
          ) : (
            <div
              key={p.id}
              className="flex items-center gap-2 bg-white rounded-lg px-3 py-2.5 shadow-sm border border-gray-100"
            >
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-gray-800 truncate">
                    {p.name}
                  </span>
                  {(p.notes || '').length > 0 && (
                    <span className="text-[10px] text-gray-300" title={p.notes}>📝</span>
                  )}
                  {(p.blacklist || []).length > 0 && (
                    <span className="text-[10px] text-gray-300" title="Есть запреты">🚫</span>
                  )}
                </div>
                {(p.notes || '').length > 0 && (
                  <div className="text-[10px] text-gray-400 truncate mt-0.5">{p.notes}</div>
                )}
              </div>
              {p.gender && (
                <span className="text-xs text-gray-400">
                  {p.gender === 'M' ? 'М' : 'Ж'}
                </span>
              )}
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${levelColors[p.level]}`}
              >
                Ур. {p.level}
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

      {filtered.length === 0 && players.length > 0 && (
        <p className="text-sm text-gray-400 text-center py-4">Ничего не найдено</p>
      )}
    </div>
  );
}

function syncBlacklist(players, editedId, newBlacklist) {
  return players.map((p) => {
    if (p.id === editedId) return p;
    const wasBlocked = (p.blacklist || []).includes(editedId);
    const shouldBeBlocked = newBlacklist.includes(p.id);

    if (shouldBeBlocked && !wasBlocked) {
      return { ...p, blacklist: [...(p.blacklist || []), editedId] };
    }
    if (!shouldBeBlocked && wasBlocked) {
      return { ...p, blacklist: (p.blacklist || []).filter((id) => id !== editedId) };
    }
    return p;
  });
}
