const levelColors = [
  '',
  'bg-green-100 text-green-700',
  'bg-blue-100 text-blue-700',
  'bg-yellow-100 text-yellow-700',
  'bg-orange-100 text-orange-700',
  'bg-red-100 text-red-700',
];

function PlayerBadge({ player, isSelected, isTarget, onSwapClick, align }) {
  if (!player) return null;

  const baseClass = 'flex items-center gap-1 rounded-lg px-1.5 py-0.5 transition-colors';
  let stateClass = '';
  if (isSelected) {
    stateClass = 'bg-amber-100 ring-2 ring-amber-400';
  } else if (isTarget) {
    stateClass = 'bg-blue-50 cursor-pointer';
  }

  const content = (
    <>
      {align === 'right' && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${levelColors[player.level]}`}>
          {player.level}
        </span>
      )}
      <span className="text-sm font-medium text-gray-800">{player.name}</span>
      {align !== 'right' && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${levelColors[player.level]}`}>
          {player.level}
        </span>
      )}
    </>
  );

  if (!onSwapClick) {
    return (
      <div className={`${baseClass} ${stateClass} ${align === 'right' ? 'justify-end' : ''}`}>
        {content}
      </div>
    );
  }

  return (
    <button
      onClick={() => onSwapClick(player.id)}
      className={`${baseClass} ${stateClass} ${align === 'right' ? 'justify-end' : ''}`}
    >
      {isSelected && <span className="text-[10px] text-amber-600 mr-0.5">↔</span>}
      {!isSelected && isTarget && <span className="text-[10px] text-blue-400 mr-0.5">↔</span>}
      {content}
    </button>
  );
}

export default function CourtCard({ court, players, index, swapPlayerId, onSwapClick, courtIndex }) {
  const team1 = court.team1.map((id) => players.find((p) => p.id === id)).filter(Boolean);
  const team2 = court.team2.map((id) => players.find((p) => p.id === id)).filter(Boolean);

  const allIds = [...court.team1, ...court.team2];
  const hasSelectedPlayer = swapPlayerId && allIds.includes(swapPlayerId);
  const hasTargetAvailable = swapPlayerId && !hasSelectedPlayer;

  return (
    <div className={`bg-white rounded-xl p-3 shadow-sm border transition-colors ${
      hasSelectedPlayer ? 'border-amber-300 bg-amber-50/30' : hasTargetAvailable ? 'border-blue-200' : 'border-gray-100'
    }`}>
      <div className="text-[10px] text-gray-300 mb-2">Корт {index + 1}</div>
      <div className="flex items-center gap-2">
        <div className="flex-1 space-y-0.5">
          {team1.map((p) => (
            <PlayerBadge
              key={p.id}
              player={p}
              isSelected={swapPlayerId === p.id}
              isTarget={hasTargetAvailable}
              onSwapClick={onSwapClick}
              align="left"
            />
          ))}
        </div>
        <span className="text-gray-300 text-xs font-bold">vs</span>
        <div className="flex-1 space-y-0.5 text-right">
          {team2.map((p) => (
            <PlayerBadge
              key={p.id}
              player={p}
              isSelected={swapPlayerId === p.id}
              isTarget={hasTargetAvailable}
              onSwapClick={onSwapClick}
              align="right"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
