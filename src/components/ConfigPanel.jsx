import { useState } from 'react';

export default function ConfigPanel({ config, setConfig }) {
  const [open, setOpen] = useState(false);

  const update = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-gray-400 underline"
      >
        {open ? 'Скрыть' : 'Показать'} настройки
      </button>

      {open && (
        <div className="mt-2 bg-white rounded-xl p-3 shadow-sm border border-gray-100 space-y-3">
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Баланс / Случайность</span>
              <span>{Math.round(config.balanceWeight * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={config.balanceWeight * 100}
              onChange={(e) => update('balanceWeight', Number(e.target.value) / 100)}
              className="w-full accent-teal-primary"
            />
            <div className="flex justify-between text-[10px] text-gray-300">
              <span>Случайно</span>
              <span>По уровню</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Штраф за повтор</span>
            <div className="flex gap-1">
              {[
                { v: 'low', label: 'Низк' },
                { v: 'med', label: 'Сред' },
                { v: 'high', label: 'Выс' },
              ].map(({ v, label }) => (
                <button
                  key={v}
                  onClick={() => update('repeatPenalty', v)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    config.repeatPenalty === v
                      ? 'bg-teal-primary text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Допуск разницы уровней</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((v) => (
                <button
                  key={v}
                  onClick={() => update('levelDiffTolerance', v)}
                  className={`w-8 py-1 rounded-md text-xs font-medium transition-colors ${
                    config.levelDiffTolerance === v
                      ? 'bg-teal-primary text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Смешанные пары</span>
            <button
              onClick={() => update('mixedPairs', !config.mixedPairs)}
              className={`w-12 h-6 rounded-full relative transition-colors ${
                config.mixedPairs ? 'bg-teal-primary' : 'bg-gray-200'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  config.mixedPairs ? 'left-6' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
