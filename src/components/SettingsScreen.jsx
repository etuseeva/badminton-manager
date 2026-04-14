export default function SettingsScreen({ config, setConfig, onClose }) {
  const update = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const isDoubles = config.gameFormat !== 'singles';

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto">
      <div className="max-w-[480px] mx-auto">
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
          <h1 className="text-lg font-bold text-gray-800">Настройки</h1>
          <button
            onClick={onClose}
            className="text-sm text-teal-primary font-medium"
          >
            Готово
          </button>
        </div>

        <div className="px-4 py-4 space-y-4">
          <SettingCard
            label="Формат игры"
            description="Пары — 2 на 2. Одиночки — 1 на 1"
          >
            <SegmentedControl
              options={[
                { value: 'doubles', label: 'Пары' },
                { value: 'singles', label: 'Одиночки' },
              ]}
              value={config.gameFormat}
              onChange={(v) => update('gameFormat', v)}
            />
          </SettingCard>

          {isDoubles && (
            <SettingCard
              label="Разница уровней в паре"
              description="Максимальная разница уровней между партнёрами в одной паре"
            >
              <NumberButtons
                options={[0, 1, 2, 3, 4]}
                value={config.pairLevelTolerance}
                onChange={(v) => update('pairLevelTolerance', v)}
              />
            </SettingCard>
          )}

          <SettingCard
            label="Разница между командами"
            description={isDoubles
              ? "Максимальная разница суммарного уровня между парами-соперниками"
              : "Максимальная разница уровней между соперниками"
            }
          >
            <NumberButtons
              options={isDoubles ? [0, 1, 2, 3, 4, 5, 6] : [0, 1, 2, 3, 4]}
              value={config.courtLevelTolerance}
              onChange={(v) => update('courtLevelTolerance', v)}
            />
          </SettingCard>

          <SettingCard
            label="Избегать повторов"
            description="Не ставить одних и тех же игроков вместе повторно"
          >
            <Toggle
              value={config.avoidRepeats}
              onChange={(v) => update('avoidRepeats', v)}
            />
          </SettingCard>

          {isDoubles && (
            <SettingCard
              label="Смешанные пары"
              description="Ставить М и Ж вместе в одну пару"
            >
              <SegmentedControl
                options={[
                  { value: 'any', label: 'Не важно' },
                  { value: 'prefer', label: 'Стараться' },
                  { value: 'only', label: 'Только' },
                ]}
                value={config.mixedPairs}
                onChange={(v) => update('mixedPairs', v)}
              />
            </SettingCard>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingCard({ label, description, children }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="mb-2">
        <div className="text-sm font-medium text-gray-800">{label}</div>
        <div className="text-xs text-gray-400 mt-0.5">{description}</div>
      </div>
      {children}
    </div>
  );
}

function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="flex gap-1 mt-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
            value === opt.value
              ? 'bg-teal-primary text-white'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function NumberButtons({ options, value, onChange }) {
  return (
    <div className="flex gap-1 mt-1">
      {options.map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`w-9 py-2 rounded-lg text-xs font-medium transition-colors ${
            value === v
              ? 'bg-teal-primary text-white'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-12 h-6 rounded-full relative transition-colors mt-1 ${
        value ? 'bg-teal-primary' : 'bg-gray-200'
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          value ? 'left-6' : 'left-0.5'
        }`}
      />
    </button>
  );
}
