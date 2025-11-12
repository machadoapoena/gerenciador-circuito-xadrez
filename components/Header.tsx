import React from 'react';
import { View } from '../types';
import { UsersIcon, FlagIcon, ClipboardListIcon, TrophyIcon, ChessKnightIcon, TagIcon } from './icons';

interface HeaderProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView }) => {
  // FIX: Replaced JSX.Element with React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
  const navItems: { view: View; label: string; icon: React.ReactElement }[] = [
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
          <ChessKnightIcon />
          <h1 className="text-2xl font-bold text-white ml-3">Torneio de Xadrez</h1>
        </div>
        <nav className="flex flex-wrap justify-center gap-2">
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
        </nav>
      </div>
    </header>
  );
};

export default Header;
