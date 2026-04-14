const levelColors = [
  '',
  'bg-green-100 text-green-700',
  'bg-blue-100 text-blue-700',
  'bg-yellow-100 text-yellow-700',
  'bg-orange-100 text-orange-700',
  'bg-red-100 text-red-700',
];

export default function PairCard({ pair, players, index }) {
  const p1 = players.find((p) => p.id === pair[0]);
  const p2 = players.find((p) => p.id === pair[1]);
  if (!p1 || !p2) return null;

  return (
    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
      <div className="text-[10px] text-gray-300 mb-1.5">Court {index + 1}</div>
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-1.5">
          <span className="text-sm font-medium text-gray-800">{p1.name}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${levelColors[p1.level]}`}>
            {p1.level}
          </span>
        </div>
        <span className="text-gray-300 text-xs">+</span>
        <div className="flex-1 flex items-center gap-1.5 justify-end">
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${levelColors[p2.level]}`}>
            {p2.level}
          </span>
          <span className="text-sm font-medium text-gray-800">{p2.name}</span>
        </div>
      </div>
    </div>
  );
}
