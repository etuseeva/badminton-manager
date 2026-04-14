import { useState, useEffect } from 'react';

export default function PlayerForm({ player, onSave, onCancel }) {
  const [name, setName] = useState('');
  const [level, setLevel] = useState(3);
  const [gender, setGender] = useState(null);

  useEffect(() => {
    if (player) {
      setName(player.name);
      setLevel(player.level);
      setGender(player.gender);
    } else {
      setName('');
      setLevel(3);
      setGender(null);
    }
  }, [player]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), level, gender });
    if (!player) {
      setName('');
      setLevel(3);
      setGender(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Имя игрока"
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-primary"
        autoFocus
      />
      <div className="flex items-center gap-3">
        <label className="text-xs text-gray-500 shrink-0">Уровень</label>
        <div className="flex gap-1 flex-1">
          {[1, 2, 3, 4, 5].map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLevel(l)}
              className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                level === l
                  ? 'bg-teal-primary text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <label className="text-xs text-gray-500 shrink-0">Пол</label>
        <div className="flex gap-1">
          {[
            { value: null, label: '—' },
            { value: 'M', label: 'М' },
            { value: 'F', label: 'Ж' },
          ].map((g) => (
            <button
              key={g.label}
              type="button"
              onClick={() => setGender(g.value)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                gender === g.value
                  ? 'bg-teal-primary text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 py-2 bg-teal-primary text-white rounded-lg text-sm font-medium"
        >
          {player ? 'Сохранить' : 'Добавить'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm"
          >
            Отмена
          </button>
        )}
      </div>
    </form>
  );
}
