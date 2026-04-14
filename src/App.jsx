import { useState, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { runMigration } from './utils/migration';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import PlayersScreen from './components/PlayersScreen';
import GameScreen from './components/GameScreen';
import HistoryScreen from './components/HistoryScreen';
import SettingsScreen from './components/SettingsScreen';

const DEFAULT_CONFIG = {
  gameFormat: 'doubles',
  pairLevelTolerance: 2,
  courtLevelTolerance: 3,
  repeatFrequency: 'sometimes',
  randomness: 'medium',
  mixedPairs: false,
};

export default function App() {
  const [tab, setTab] = useState('players');
  const [showSettings, setShowSettings] = useState(false);
  const [players, setPlayers] = useLocalStorage('bp_players', []);
  const [config, setConfig] = useLocalStorage('bp_config', DEFAULT_CONFIG);
  const [session, setSession] = useLocalStorage('bp_session', null);
  const [history, setHistory] = useLocalStorage('bp_history', []);

  useEffect(() => {
    runMigration();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header onSettingsClick={() => setShowSettings(true)} />
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-20">
        {tab === 'players' && (
          <PlayersScreen
            players={players}
            setPlayers={setPlayers}
          />
        )}
        {tab === 'game' && (
          <GameScreen
            players={players}
            session={session}
            setSession={setSession}
            config={config}
            history={history}
            setHistory={setHistory}
          />
        )}
        {tab === 'history' && (
          <HistoryScreen
            history={history}
            setHistory={setHistory}
            players={players}
          />
        )}
      </div>
      <BottomNav active={tab} onChange={setTab} />
      {showSettings && (
        <SettingsScreen
          config={config}
          setConfig={setConfig}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
