import { useState } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import BottomNav from './components/BottomNav';
import PlayersScreen from './components/PlayersScreen';
import GameScreen from './components/GameScreen';

const DEFAULT_CONFIG = {
  balanceWeight: 0.7,
  repeatPenalty: 'med',
  levelDiffTolerance: 2,
  mixedPairs: false,
};

export default function App() {
  const [tab, setTab] = useState('players');
  const [players, setPlayers] = useLocalStorage('bp_players', []);
  const [blacklist, setBlacklist] = useLocalStorage('bp_blacklist', []);
  const [config, setConfig] = useLocalStorage('bp_config', DEFAULT_CONFIG);
  const [session, setSession] = useLocalStorage('bp_session', null);
  const [history, setHistory] = useLocalStorage('bp_history', []);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-20">
        {tab === 'players' && (
          <PlayersScreen
            players={players}
            setPlayers={setPlayers}
            blacklist={blacklist}
            setBlacklist={setBlacklist}
          />
        )}
        {tab === 'game' && (
          <GameScreen
            players={players}
            session={session}
            setSession={setSession}
            config={config}
            setConfig={setConfig}
            blacklist={blacklist}
            history={history}
            setHistory={setHistory}
          />
        )}
      </div>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
