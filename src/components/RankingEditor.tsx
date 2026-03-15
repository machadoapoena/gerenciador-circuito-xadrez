
import React, { useState, useEffect } from 'react';
import { Player, Score, Title } from '../types';
import { TrophyIcon, DragHandleIcon } from './icons';

interface RankingEditorProps {
  players: Player[];
  scores: Score[];
  titles: Title[];
  onSave: (ranking: { player_id: string; position: number }[]) => Promise<void>;
  isLoading: boolean;
}

const RankingEditor: React.FC<RankingEditorProps> = ({ players, scores, titles, onSave, isLoading }) => {
  const [items, setItems] = useState<Player[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const getTitleName = (titleId?: string) => titles.find(t => String(t.id) === String(titleId))?.name || '';

  useEffect(() => {
    // Inicializa a ordem baseada nos pontos (classificação atual)
    const scoresByPlayer = new Map<string, number>();
    scores.forEach(s => {
      const pid = String(s.playerId);
      scoresByPlayer.set(pid, (scoresByPlayer.get(pid) || 0) + s.points);
    });

    const initialOrder = [...players].sort((a, b) => {
        const ptsA = scoresByPlayer.get(String(a.id)) || 0;
        const ptsB = scoresByPlayer.get(String(b.id)) || 0;
        return ptsB - ptsA;
    });

    setItems(initialOrder);
  }, [players, scores]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Opcional: configurar imagem de drag personalizada ou estilo
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newItems = [...items];
    const draggedItem = newItems[draggedIndex];
    newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    setItems(newItems);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSave = () => {
    const rankingPayload = items.map((player, index) => ({
      player_id: player.id,
      position: index + 1
    }));
    onSave(rankingPayload);
  };

  return (
    <div className="bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
            <TrophyIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Ajuste Manual de Ranking</h2>
            <p className="text-slate-400 text-xs">Arraste os nomes para definir a classificação final.</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isLoading || items.length === 0}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? 'Salvando...' : 'Salvar Ranking Final'}
        </button>
      </div>

      <div className="space-y-2">
        {items.map((player, index) => (
          <div
            key={player.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-4 p-4 bg-slate-900/50 border rounded-xl transition-all cursor-move select-none ${
              draggedIndex === index 
                ? 'border-indigo-500 bg-indigo-500/10 opacity-50' 
                : 'border-slate-700 hover:border-slate-500'
            }`}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 text-slate-400 font-bold text-xs border border-slate-700">
              {index + 1}
            </div>
            
            <DragHandleIcon />

            <div className="flex-1">
              <span className="font-bold text-slate-100">
                {getTitleName(player.titleId) && <span className="text-amber-400 mr-1">{getTitleName(player.titleId)}</span>}
                {player.name}
              </span>
            </div>
            
            <div className="text-xs text-slate-500 font-mono hidden sm:block">
              ID: {player.id.substring(0, 8)}...
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RankingEditor;
