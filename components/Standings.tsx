
import React, { useMemo, useState, useEffect } from 'react';
import { Player, Score, Category, Stage, Title } from '../types';
import { TrophyIcon, UsersIcon, AwardIcon, TagIcon, FlagIcon } from './icons';

interface StandingsProps {
  players: Player[];
  scores: Score[];
  categories: Category[];
  stages: Stage[];
  titles: Title[];
  onFetchPhoto?: (playerId: string) => Promise<string | null>;
}

const Standings: React.FC<StandingsProps> = ({ players, scores, categories, stages, titles, onFetchPhoto }) => {
  const [selectedStageView, setSelectedStageView] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hoveredPlayerId, setHoveredPlayerId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  
  // Estado para armazenar fotos carregadas individualmente (cache local)
  const [photoCache, setPhotoCache] = useState<Record<string, string>>({});

  const getCategoryName = (categoryId: string) => categories.find(c => String(c.id) === String(categoryId))?.name || 'N/A';
  const getTitleName = (titleId?: string) => titles.find(t => String(t.id) === String(titleId))?.name || '';

  const allRankedPlayers = useMemo(() => {
    if (players.length === 0) return [];
    const scoresByPlayer = new Map<string, Score[]>();
    scores.forEach(score => {
      const pid = String(score.playerId);
      if (!scoresByPlayer.has(pid)) scoresByPlayer.set(pid, []);
      scoresByPlayer.get(pid)!.push(score);
    });

    const processed = players.map(player => {
      const playerScoresList = scoresByPlayer.get(String(player.id)) || [];
      const scoresByStage = new Map<string, number>();
      const ranksByStage = new Map<string, number>();

      playerScoresList.forEach(s => {
        scoresByStage.set(String(s.stageId), s.points);
        if (s.rank) ranksByStage.set(String(s.stageId), s.rank);
      });

      let displayTotal = 0, lowestScoreValue: number | null = null;

      if (selectedStageView === 'all') {
        const scorePoints = playerScoresList.map(s => s.points);
        const sum = scorePoints.reduce((acc, p) => acc + p, 0);
        if (scorePoints.length > 1) {
          lowestScoreValue = Math.min(...scorePoints);
          displayTotal = sum - lowestScoreValue;
        } else { displayTotal = sum; }
      } else { 
        displayTotal = scoresByStage.get(selectedStageView) || 0; 
      }

      return { player, totalPoints: displayTotal, scoresByStage, ranksByStage, lowestScore: lowestScoreValue };
    });

    // Lógica de ordenação customizada
    const sorted = processed.sort((a, b) => {
      // Regra: Se tiver apenas uma etapa cadastrada OU se uma etapa específica estiver selecionada
      // Ordena-se pela Colocação (Rank)
      const useRankSorting = (stages.length === 1) || (selectedStageView !== 'all');

      if (useRankSorting) {
        const stageId = selectedStageView === 'all' ? String(stages[0]?.id) : selectedStageView;
        const rankA = a.ranksByStage.get(stageId) || 999999;
        const rankB = b.ranksByStage.get(stageId) || 999999;

        if (rankA !== rankB) return rankA - rankB; // Crescente (1º, 2º, 3º...)
        return b.totalPoints - a.totalPoints; // Desempate por pontos
      }

      // Caso contrário (Múltiplas etapas e Visão Geral): Ordenação padrão por pontos (Geral com descarte)
      return b.totalPoints - a.totalPoints;
    });

    const categoryLeaders = new Set<string>();
    return sorted.map((item, index) => {
      let isCategoryLeader = false;
      const catId = item.player.categoryId;
      if (catId && !categoryLeaders.has(catId)) { categoryLeaders.add(catId); isCategoryLeader = true; }
      return { ...item, isCategoryLeader, rank: index + 1 };
    });
  }, [players, scores, selectedStageView, stages]);

  const filteredRankedPlayers = useMemo(() => {
    if (!searchQuery.trim()) return allRankedPlayers;
    const query = searchQuery.toLowerCase();
    return allRankedPlayers.filter(item => item.player.name.toLowerCase().includes(query));
  }, [allRankedPlayers, searchQuery]);

  // Carrega fotos para o Top 5 e líderes de categoria automaticamente
  useEffect(() => {
    if (!onFetchPhoto) return;
    // Critério: Rank <= 5 ou Líder de Categoria
    const targets = allRankedPlayers.filter(it => it.rank <= 5 || it.isCategoryLeader);
    targets.forEach(async (it) => {
      if (!photoCache[it.player.id]) {
        const photo = await onFetchPhoto(it.player.id);
        if (photo) setPhotoCache(prev => ({ ...prev, [it.player.id]: photo }));
      }
    });
  }, [allRankedPlayers, onFetchPhoto]);

  const handleMouseMove = (e: React.MouseEvent) => setTooltipPos({ x: e.clientX + 15, y: e.clientY + 15 });
  
  const handlePlayerHover = async (playerId: string, canShow: boolean) => {
    if (!canShow) return; // Só permite hover se for elegível para mostrar foto
    setHoveredPlayerId(playerId);
    if (onFetchPhoto && !photoCache[playerId]) {
      const photo = await onFetchPhoto(playerId);
      if (photo) setPhotoCache(prev => ({ ...prev, [playerId]: photo }));
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-amber-400 text-amber-900 ring-2 ring-amber-300 shadow-amber-500/20';
    if (rank === 2) return 'bg-slate-400 text-slate-900 ring-2 ring-slate-300 shadow-slate-500/20';
    if (rank === 3) return 'bg-yellow-600 text-yellow-100 ring-2 ring-yellow-500 shadow-yellow-700/20';
    return 'bg-slate-600 text-slate-100';
  };

  const hoveredPlayer = players.find(p => p.id === hoveredPlayerId);
  const hoveredPhoto = hoveredPlayer ? photoCache[hoveredPlayer.id] : null;

  return (
    <div className="bg-slate-800 p-4 md:p-8 rounded-lg shadow-xl overflow-hidden relative">
      {hoveredPlayer && (
        <div className="fixed z-[9999] pointer-events-none animate-in fade-in zoom-in-95 duration-200" style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px`, width: '380px', maxWidth: '90vw' }}>
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl shadow-2xl p-6 backdrop-blur-md bg-opacity-98">
            <div className="flex flex-col items-center text-center">
              <div className="w-28 h-28 rounded-full border-4 border-indigo-500/50 mb-4 overflow-hidden shadow-indigo-500/30 shadow-2xl">
                {hoveredPhoto ? <img src={hoveredPhoto} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500"><UsersIcon /></div>}
              </div>
              <h3 className="font-bold text-white text-xl leading-tight">
                {getTitleName(hoveredPlayer.titleId) && <span className="text-amber-400 mr-1.5">{getTitleName(hoveredPlayer.titleId)}</span>}
                {hoveredPlayer.name}
              </h3>
              <p className="text-indigo-400 text-sm font-bold uppercase tracking-widest mt-1.5">{getCategoryName(hoveredPlayer.categoryId)}</p>
            </div>
            
            <div className="mt-6 pt-5 border-t border-slate-700/50 grid grid-cols-2 gap-y-4 gap-x-6 text-[13px]">
                <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
                  <span className="text-slate-500 uppercase block font-bold text-[10px] mb-1">Rating Elo</span>
                  <span className="text-white font-bold text-base">{hoveredPlayer.rating || '—'}</span>
                </div>
                <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50 text-right">
                  <span className="text-slate-500 uppercase block font-bold text-[10px] mb-1">Titulação</span>
                  <span className="text-amber-400 font-black text-base">{getTitleName(hoveredPlayer.titleId) || 'N/A'}</span>
                </div>
                <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
                  <span className="text-slate-500 uppercase block font-bold text-[10px] mb-1">CBX ID</span>
                  <span className="text-white font-medium">{hoveredPlayer.cbxId || '—'}</span>
                </div>
                <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50 text-right">
                  <span className="text-slate-500 uppercase block font-bold text-[10px] mb-1">FIDE ID</span>
                  <span className="text-white font-medium">{hoveredPlayer.fideId || '—'}</span>
                </div>
            </div>
            {hoveredPlayer.email && (
              <div className="mt-4 text-center">
                <span className="text-slate-500 uppercase block font-bold text-[10px] mb-1">Contato</span>
                <span className="text-slate-300 text-xs italic">{hoveredPlayer.email}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-8 gap-4">
        <div className="flex items-center"><TrophyIcon className="h-8 w-8 text-indigo-400" /><h2 className="text-2xl md:text-3xl font-bold ml-3">{selectedStageView === 'all' ? 'Classificação Geral' : 'Classificação da Etapa'}</h2></div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <input type="text" placeholder="Buscar Jogador..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-slate-700 border border-slate-600 text-slate-100 text-sm rounded-lg p-2.5 w-full sm:w-64" />
          <select value={selectedStageView} onChange={(e) => setSelectedStageView(e.target.value)} className="bg-slate-700 border border-slate-600 text-slate-100 text-sm rounded-lg p-2.5 w-full sm:w-64">
            <option value="all">🏆 Geral (com descarte)</option>
            {stages.map(s => <option key={s.id} value={s.id}>📍 {s.name}</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left table-auto">
          <thead>
            <tr className="border-b-2 border-slate-600 text-slate-400 text-xs uppercase tracking-wider">
              <th className="p-4">Rank</th>
              <th className="p-4">Jogador</th>
              <th className="p-4 hidden sm:table-cell">Categoria</th>
              {stages.map(s => <th key={s.id} className="p-4 text-center">{s.name}</th>)}
              <th className="p-4 text-right">Pts</th>
            </tr>
          </thead>
          <tbody>
            {filteredRankedPlayers.map(({ player, totalPoints, scoresByStage, lowestScore, isCategoryLeader, rank }) => {
              const shouldShowPhoto = rank <= 5 || isCategoryLeader;
              
              return (
                <tr key={player.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors group">
                  <td className="p-4">
                    <span className={`w-8 h-8 flex items-center justify-center text-xs font-bold rounded-full ${getRankColor(rank)}`}>{rank}</span>
                  </td>
                  <td className="p-4">
                    <div 
                      className={`flex items-center gap-3 ${shouldShowPhoto ? 'cursor-help' : ''}`}
                      onMouseEnter={() => handlePlayerHover(player.id, shouldShowPhoto)} 
                      onMouseMove={handleMouseMove} 
                      onMouseLeave={() => setHoveredPlayerId(null)}
                    >
                      {shouldShowPhoto && (
                        <div className="w-8 h-8 rounded-full bg-slate-600 overflow-hidden flex-shrink-0 border border-slate-500 shadow-sm">
                            {photoCache[player.id] ? (
                              <img src={photoCache[player.id]} className="w-full h-full object-cover" alt={player.name} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-500 text-[10px]">
                                <UsersIcon />
                              </div>
                            )}
                        </div>
                      )}
                      <span className="text-sm md:text-base font-medium">
                        {getTitleName(player.titleId) && <span className="text-amber-400 font-bold mr-1">{getTitleName(player.titleId)}</span>}
                        {player.name}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 hidden sm:table-cell">
                    <span className="text-slate-300 text-sm">
                      {getCategoryName(player.categoryId)} {isCategoryLeader && '🏆'}
                    </span>
                  </td>
                  {stages.map(s => (
                    <td key={s.id} className="p-4 text-center font-mono text-sm">
                      {scoresByStage.get(s.id) ?? '—'}
                    </td>
                  ))}
                  <td className="p-4 text-right font-bold text-indigo-400 text-lg">{totalPoints}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Standings;
