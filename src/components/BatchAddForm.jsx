import { useState } from 'react';

export default function BatchAddForm({ onAdd, onCancel }) {
  const [text, setText] = useState('');
  const [defaultLevel, setDefaultLevel] = useState(3);

  const handleAdd = () => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const players = lines.map((line) => {
      const match = line.match(/^(.+?)\s+(\d)$/);
      if (match) {
        return { name: match[1].trim(), level: Math.min(5, Math.max(1, Number(match[2]))), gender: null };
      }
      return { name: line, level: defaultLevel, gender: null };
    });

    if (players.length > 0) {
      onAdd(players);
    }
  };

  const lineCount = text.split('\n').filter((l) => l.trim()).length;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"Одно имя на строку\nМожно указать уровень через пробел:\nИван 4\nМария 2\nАлексей"}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-primary h-32 resize-none"
        autoFocus
      />
      <div className="flex items-center gap-3">
        <label className="text-xs text-gray-500 shrink-0">Уровень по умолчанию</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setDefaultLevel(l)}
              className={`w-8 py-1 rounded-md text-sm font-medium transition-colors ${
                defaultLevel === l
                  ? 'bg-teal-primary text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleAdd}
          disabled={lineCount === 0}
          className="flex-1 py-2 bg-teal-primary text-white rounded-lg text-sm font-medium disabled:opacity-30"
        >
          Добавить {lineCount > 0 ? `(${lineCount})` : ''}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}
