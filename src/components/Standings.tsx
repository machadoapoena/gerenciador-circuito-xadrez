
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

  // Identifica a última etapa e o Top 5 dela para os cards de destaque
  const lastStageHighlights = useMemo(() => {
    if (stages.length === 0 || scores.length === 0) return null;

    // Encontra a última etapa baseada na data (decrescente)
    const sortedStages = [...stages].sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return b.date.localeCompare(a.date);
    });
    
    const lastStage = sortedStages[0];
    const stageScores = scores.filter(s => String(s.stageId) === String(lastStage.id));

    const top5 = stageScores
      .sort((a, b) => {
        if (a.rank && b.rank) return a.rank - b.rank;
        if (a.rank) return -1;
        if (b.rank) return 1;
        return b.points - a.points;
      })
      .slice(0, 5)
      .map(score => {
        const player = players.find(p => String(p.id) === String(score.playerId));
        return { player, score };
      })
      .filter(item => item.player !== undefined);

    return { stage: lastStage, top5 };
  }, [stages, scores, players]);

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

  // Carrega fotos para o Top 5, líderes de categoria e destaques automaticamente
  useEffect(() => {
    if (!onFetchPhoto) return;
    
    const targets = new Set<string>();
    
    // Alvos da classificação atual
    allRankedPlayers.filter(it => it.rank <= 5 || it.isCategoryLeader).forEach(it => targets.add(it.player.id));
    
    // Alvos dos destaques da última etapa
    if (lastStageHighlights) {
      lastStageHighlights.top5.forEach(it => { if(it.player) targets.add(it.player.id); });
    }

    targets.forEach(async (playerId) => {
      if (!photoCache[playerId]) {
        const photo = await onFetchPhoto(playerId);
        if (photo) setPhotoCache(prev => ({ ...prev, [playerId]: photo }));
      }
    });
  }, [allRankedPlayers, lastStageHighlights, onFetchPhoto]);

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
    <div className="space-y-6">
      {/* Cards de Destaque: Top 5 da Última Etapa */}
      {lastStageHighlights && lastStageHighlights.top5.length > 0 && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-indigo-500/20 rounded text-indigo-400">
              <FlagIcon />
            </div>
            <h3 className="text-lg font-bold text-white">
              Destaques da etapa: <span className="text-indigo-400">{lastStageHighlights.stage.name}</span>
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {lastStageHighlights.top5.map((item, index) => {
              const rank = item.score.rank || (index + 1);
              const isFirst = rank === 1;
              const playerTitle = item.player ? getTitleName(item.player.titleId) : '';
              
              return (
                <div 
                  key={item.player?.id} 
                  className={`relative p-5 rounded-2xl border transition-all duration-300 bg-slate-800/40 backdrop-blur-sm ${
                    isFirst ? 'border-amber-500/50 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/10' : 'border-slate-700/50 hover:border-slate-600'
                  }`}
                >
                  <div className={`absolute -top-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center font-black shadow-xl border-2 border-slate-900 z-10 text-xs ${getRankColor(rank)}`}>
                    {rank}º
                  </div>

                  <div className="flex items-center gap-5">
                    <div className={`w-20 h-20 rounded-full flex-shrink-0 overflow-hidden border-2 ${isFirst ? 'border-amber-400 shadow-amber-400/20 shadow-md' : 'border-slate-700'}`}>
                      {item.player?.id && photoCache[item.player.id] ? (
                        <img src={photoCache[item.player.id]} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-700/50 text-slate-500">
                          <UsersIcon />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 text-left">
                      <h4 className="text-sm font-bold text-white truncate leading-tight mb-1">
                        {playerTitle && <span className="text-amber-400 mr-0.5">{playerTitle}</span>}
                        {item.player?.name}
                      </h4>
                      
                      <div className="flex flex-col gap-0.5">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate">
                          {item.player && getCategoryName(item.player.categoryId)}
                        </p>
                        {item.player?.rating && (
                          <p className="text-[10px] text-amber-500/80 font-mono">
                            Elo: {item.player.rating}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-baseline gap-1 mt-1.5">
                        <span className="text-indigo-400 font-black text-xl leading-none">{item.score.points}</span>
                        <span className="text-[10px] font-bold text-slate-600 uppercase">pts</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Container Principal da Classificação */}
      <div className="bg-slate-800 p-4 md:p-8 rounded-lg shadow-xl overflow-hidden relative border border-slate-700/50">
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
    </div>
  );
};

export default Standings;
