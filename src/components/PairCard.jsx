const levelColors = [
  '',
  'bg-green-100 text-green-700',
  'bg-blue-100 text-blue-700',
  'bg-yellow-100 text-yellow-700',
  'bg-orange-100 text-orange-700',
  'bg-red-100 text-red-700',
];

function PlayerBadge({ player }) {
  if (!player) return null;
  return (
    <div className="flex items-center gap-1">
      <span className="text-sm font-medium text-gray-800">{player.name}</span>
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${levelColors[player.level]}`}>
        {player.level}
      </span>
    </div>
  );
}

export default function CourtCard({ court, players, index }) {
  const team1 = court.team1.map((id) => players.find((p) => p.id === id)).filter(Boolean);
  const team2 = court.team2.map((id) => players.find((p) => p.id === id)).filter(Boolean);

  return (
    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
      <div className="text-[10px] text-gray-300 mb-2">Корт {index + 1}</div>
      <div className="flex items-center gap-2">
        <div className="flex-1 space-y-0.5">
          {team1.map((p) => (
            <PlayerBadge key={p.id} player={p} />
          ))}
        </div>
        <span className="text-gray-300 text-xs font-bold">vs</span>
        <div className="flex-1 space-y-0.5 text-right">
          {team2.map((p) => (
            <div key={p.id} className="flex items-center gap-1 justify-end">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${levelColors[p.level]}`}>
                {p.level}
              </span>
              <span className="text-sm font-medium text-gray-800">{p.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
