const tabs = [
  { id: 'players', label: 'Players', icon: '👥' },
  { id: 'session', label: 'Session', icon: '🏸' },
  { id: 'round', label: 'Round', icon: '🔄' },
];

export default function BottomNav({ active, onChange, hasSession }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
      <div className="flex max-w-[480px] mx-auto">
        {tabs.map((tab) => {
          if (tab.id === 'round' && !hasSession) return null;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex-1 py-3 flex flex-col items-center gap-0.5 text-xs transition-colors ${
                active === tab.id
                  ? 'text-teal-primary font-semibold'
                  : 'text-gray-400'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
