import { useState } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import BottomNav from './components/BottomNav';
import PlayersScreen from './components/PlayersScreen';
import SessionScreen from './components/SessionScreen';
import RoundScreen from './components/RoundScreen';

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
        {tab === 'session' && (
          <SessionScreen
            players={players}
            session={session}
            setSession={setSession}
            onNavigate={setTab}
          />
        )}
        {tab === 'round' && (
          <RoundScreen
            players={players}
            session={session}
            setSession={setSession}
            config={config}
            setConfig={setConfig}
            blacklist={blacklist}
          />
        )}
      </div>
      <BottomNav active={tab} onChange={setTab} hasSession={!!session} />
    </div>
  );
}
