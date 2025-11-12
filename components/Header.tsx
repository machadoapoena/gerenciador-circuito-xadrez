import React from 'react';
import { View } from '../types';
import { UsersIcon, FlagIcon, ClipboardListIcon, TrophyIcon, ChessKnightIcon, TagIcon, LogoutIcon, LoginIcon, UploadIcon, DownloadIcon, SettingsIcon } from './icons';

interface HeaderProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  isAuthenticated: boolean;
  onLogout: () => void;
  onImport: () => void;
  onExport: () => void;
  systemName: string;
  systemLogo: string | null;
}

const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView, isAuthenticated, onLogout, onImport, onExport, systemName, systemLogo }) => {
  const navItems: { view: Exclude<View, 'login' | 'settings'>; label: string; icon: React.ReactElement }[] = [
    { view: 'players', label: 'Jogadores', icon: <UsersIcon /> },
    { view: 'categories', label: 'Categorias', icon: <TagIcon /> },
    { view: 'stages', label: 'Etapas', icon: <FlagIcon /> },
    { view: 'scores', label: 'Pontuações', icon: <ClipboardListIcon /> },
    { view: 'standings', label: 'Classificação', icon: <TrophyIcon className="w-5 h-5 mr-2" /> },
  ];

  return (
    <header className="bg-slate-800/50 backdrop-blur-sm p-4 sticky top-0 z-10 shadow-lg shadow-slate-900/50">
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
        <div className="flex items-center mb-4 sm:mb-0">
          {systemLogo ? (
            <img src={systemLogo} alt="Logo" className="h-10 w-10 object-contain" />
          ) : (
            <ChessKnightIcon />
          )}
          <h1 className="text-2xl font-bold text-white ml-3">{systemName}</h1>
        </div>
        <nav className="flex flex-wrap justify-center items-center gap-2">
          {isAuthenticated ? (
            <>
              {navItems.map(({ view, label, icon }) => (
                <button
                  key={view}
                  onClick={() => setCurrentView(view)}
                  className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    currentView === view
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {icon}
                  {label}
                </button>
              ))}
              <button
                key="settings"
                onClick={() => setCurrentView('settings')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  currentView === 'settings'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <SettingsIcon />
                Configurações
              </button>
              <button
                onClick={onImport}
                className="flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 bg-teal-600/80 text-white hover:bg-teal-500"
              >
                <UploadIcon />
                Importar
              </button>
              <button
                onClick={onExport}
                className="flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 bg-sky-600/80 text-white hover:bg-sky-500"
              >
                <DownloadIcon />
                Exportar
              </button>
              <button
                onClick={onLogout}
                className="flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 bg-red-600/80 text-white hover:bg-red-500"
              >
                <LogoutIcon />
                Sair
              </button>
            </>
          ) : (
            <>
               <button
                  key="standings"
                  onClick={() => setCurrentView('standings')}
                  className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    currentView === 'standings'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <TrophyIcon className="w-5 h-5 mr-2" />
                  Classificação
                </button>
                <button
                  key="login"
                  onClick={() => setCurrentView('login')}
                  className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    currentView === 'login'
                      ? 'bg-sky-600 text-white shadow-md'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <LoginIcon />
                  Login
                </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;