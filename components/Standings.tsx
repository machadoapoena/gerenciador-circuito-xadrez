
import React, { useMemo, useState, useRef } from 'react';
import { Player, Score, Category, Stage, Title } from '../types';
import { TrophyIcon, UsersIcon, AwardIcon, TagIcon, FlagIcon } from './icons';

interface StandingsProps {
  players: Player[];
  scores: Score[];
  categories: Category[];
  stages: Stage[];
  titles: Title[];
}

const Standings: React.FC<StandingsProps> = ({ players, scores, categories, stages, titles }) => {
  const [selectedStageView, setSelectedStageView] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hoveredPlayerId, setHoveredPlayerId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => String(c.id) === String(categoryId))?.name || 'N/A';
  }
  
  const getTitleName = (titleId?: string) => {
    return titles.find(t => String(t.id) === String(titleId))?.name || '';
  }

  const allRankedPlayers = useMemo(() => {
    if (players.length === 0) return [];

    const scoresByPlayer = new Map<string, Score[]>();
    scores.forEach(score => {
      const pid = String(score.playerId);
      if (!scoresByPlayer.has(pid)) {
        scoresByPlayer.set(pid, []);
      }
      scoresByPlayer.get(pid)!.push(score);
    });

    const processedPlayers = players.map(player => {
      const playerScoresList = scoresByPlayer.get(String(player.id)) || [];
      const scoresByStage = new Map<string, number>();
      playerScoresList.forEach(s => {
        scoresByStage.set(String(s.stageId), s.points);
      });

      let displayTotal = 0;
      let lowestScoreValue: number | null = null;

      if (selectedStageView === 'all') {
        const scorePoints = playerScoresList.map(s => s.points);
        const sum = scorePoints.reduce((acc, p) => acc + p, 0);

        if (scorePoints.length > 1) {
          lowestScoreValue = Math.min(...scorePoints);
          displayTotal = sum - lowestScoreValue;
        } else {
          displayTotal = sum;
        }
      } else {
        displayTotal = scoresByStage.get(selectedStageView) || 0;
      }

      return {
        player,
        totalPoints: displayTotal,
        scoresByStage,
        lowestScore: lowestScoreValue,
      };
    });

    // Ordenação principal
    const sorted = processedPlayers.sort((a, b) => b.totalPoints - a.totalPoints);

    const categoryLeaders = new Set<string>();
    
    // Adiciona Rank e flag de líder de categoria
    return sorted.map((item, index) => {
      let isCategoryLeader = false;
      const catId = item.player.categoryId;
      if (catId && !categoryLeaders.has(catId)) {
        categoryLeaders.add(catId);
        isCategoryLeader = true;
      }
      return { ...item, isCategoryLeader, rank: index + 1 };
    });
  }, [players, scores, stages, selectedStageView]);

  // Filtro de busca aplicado sobre a classificação já rankeada
  const filteredRankedPlayers = useMemo(() => {
    if (!searchQuery.trim()) return allRankedPlayers;
    const query = searchQuery.toLowerCase();
    return allRankedPlayers.filter(item => 
      item.player.name.toLowerCase().includes(query)
    );
  }, [allRankedPlayers, searchQuery]);

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-amber-400 text-amber-900 ring-2 ring-amber-300 shadow-amber-500/20';
      case 2:
        return 'bg-slate-400 text-slate-900 ring-2 ring-slate-300 shadow-slate-500/20';
      case 3:
        return 'bg-yellow-600 text-yellow-100 ring-2 ring-yellow-500 shadow-yellow-700/20';
      default:
        return 'bg-slate-600 text-slate-100';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setTooltipPos({ x: e.clientX + 15, y: e.clientY + 15 });
  };
  
  if (allRankedPlayers.length === 0) {
    return (
      <div className="bg-slate-800 p-8 rounded-lg shadow-xl text-center">
        <TrophyIcon className="mx-auto h-16 w-16 text-indigo-400 mb-4" />
        <h2 className="text-3xl font-bold mb-2">Classificação</h2>
        <p className="text-slate-400">Nenhum jogador cadastrado para exibir a classificação.</p>
        <p className="text-slate-500 mt-2">Cadastre jogadores e lance suas pontuações para começar.</p>
      </div>
    );
  }

  const inputClasses = "bg-slate-700 border border-slate-600 text-slate-100 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 transition-colors";

  const hoveredPlayer = players.find(p => p.id === hoveredPlayerId);

  return (
    <div className="bg-slate-800 p-4 md:p-8 rounded-lg shadow-xl overflow-hidden relative">
      {/* Tooltip Modal */}
      {hoveredPlayer && (
        <div 
          className="fixed z-[9999] pointer-events-none animate-in fade-in zoom-in-95 duration-200"
          style={{ 
            left: `${tooltipPos.x}px`, 
            top: `${tooltipPos.y}px`,
            maxWidth: '300px'
          }}
        >
          <div className="bg-slate-900 border border-indigo-500/30 rounded-xl shadow-2xl p-5 backdrop-blur-md bg-opacity-95">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full border-2 border-indigo-500 mb-3 overflow-hidden shadow-indigo-500/20 shadow-lg">
                {hoveredPlayer.photoUrl ? (
                  <img src={hoveredPlayer.photoUrl} alt={hoveredPlayer.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                    <UsersIcon />
                  </div>
                )}
              </div>
              <h3 className="font-bold text-white text-lg leading-tight">
                {getTitleName(hoveredPlayer.titleId) && <span className="text-amber-400 mr-1">{getTitleName(hoveredPlayer.titleId)}</span>}
                {hoveredPlayer.name}
              </h3>
              <p className="text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4">
                {getCategoryName(hoveredPlayer.categoryId)}
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2 border-t border-slate-700 pt-3">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Rating Elo</span>
                  <span className="text-white font-mono">{hoveredPlayer.rating || 'N/A'}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Nascimento</span>
                  <span className="text-white text-xs">{hoveredPlayer.birthDate ? new Date(hoveredPlayer.birthDate).toLocaleDateString('pt-BR') : 'N/A'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">ID CBX</span>
                  <span className="text-white font-mono text-xs">{hoveredPlayer.cbxId || 'N/A'}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">ID FIDE</span>
                  <span className="text-white font-mono text-xs">{hoveredPlayer.fideId || 'N/A'}</span>
                </div>
              </div>

              {hoveredPlayer.email && (
                <div className="pt-2 border-t border-slate-700">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Contato</span>
                  <span className="text-indigo-300 text-xs break-all">{hoveredPlayer.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-8 gap-4">
        <div className="flex items-center">
          <TrophyIcon className="h-8 w-8 text-indigo-400" />
          <h2 className="text-2xl md:text-3xl font-bold ml-3">
            {selectedStageView === 'all' ? 'Classificação Geral' : 'Classificação da Etapa'}
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-full sm:w-64">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Buscar Jogador:</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Nome do atleta..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${inputClasses} pl-10`}
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <UsersIcon />
              </div>
            </div>
          </div>

          <div className="w-full sm:w-64">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Filtrar Visão:</label>
            <select 
              value={selectedStageView} 
              onChange={(e) => setSelectedStageView(e.target.value)}
              className={inputClasses}
            >
              <option value="all">🏆 Classificação Geral (com descarte)</option>
              <hr className="my-1 border-slate-600" />
              <optgroup label="Etapas Individuais">
                {stages.map(s => (
                  <option key={s.id} value={s.id}>📍 {s.name}</option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left table-auto">
          <thead className="border-b-2 border-slate-600">
            <tr>
              <th className="p-4 text-xs md:text-sm font-semibold tracking-wider text-slate-400">Rank</th>
              <th className="p-4 text-xs md:text-sm font-semibold tracking-wider text-slate-400">Jogador</th>
              <th className="p-4 text-xs md:text-sm font-semibold tracking-wider text-slate-400 hidden sm:table-cell">Categoria</th>
              {stages.map(stage => {
                const isSelected = selectedStageView === stage.id;
                return (
                  <th 
                    key={stage.id} 
                    className={`p-4 text-xs md:text-sm font-semibold tracking-wider text-center whitespace-nowrap transition-colors duration-300 ${
                      isSelected ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400'
                    }`}
                  >
                    {stage.name}
                  </th>
                )
              })}
              <th className={`p-4 text-xs md:text-sm font-semibold tracking-wider text-right whitespace-nowrap ${selectedStageView === 'all' ? 'text-indigo-400' : 'text-slate-400'}`}>
                Pts
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRankedPlayers.length === 0 ? (
              <tr>
                <td colSpan={stages.length + 4} className="p-12 text-center text-slate-500 italic">
                  Nenhum jogador encontrado com o nome "{searchQuery}".
                </td>
              </tr>
            ) : (
              filteredRankedPlayers.map(({ player, totalPoints, scoresByStage, lowestScore, isCategoryLeader, rank }) => {
                let lowestScoreStruck = false;
                const tName = getTitleName(player.titleId);
                const showAvatar = rank <= 10 || isCategoryLeader;
                
                return (
                  <tr key={player.id} className="border-b border-slate-700 last:border-b-0 hover:bg-slate-700/50 transition-colors">
                    <td className="p-4">
                      <span className={`w-7 h-7 md:w-8 md:h-8 flex items-center justify-center text-xs md:text-sm font-bold rounded-full shadow-inner ${getRankColor(rank)}`}>
                        {rank}
                      </span>
                    </td>
                    <td className="p-4 font-medium whitespace-nowrap">
                      <div 
                        className="flex items-center gap-3 cursor-help group/player"
                        onMouseEnter={(e) => { setHoveredPlayerId(player.id); handleMouseMove(e); }}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={() => setHoveredPlayerId(null)}
                      >
                        {showAvatar ? (
                          <div className={`w-8 h-8 rounded-full bg-slate-600 overflow-hidden flex-shrink-0 border transition-all duration-300 ${
                            rank <= 3 ? 'border-indigo-400 scale-110 shadow-lg shadow-indigo-500/10' : 
                            isCategoryLeader ? 'border-amber-400/50' : 'border-slate-500'
                          } group-hover/player:border-white`}>
                            { player.photoUrl ? (
                              <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px]">
                                  <UsersIcon />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-8 flex-shrink-0" />
                        )}
                        <div className="flex flex-col">
                          <span className={`text-sm md:text-base transition-colors ${rank <= 3 ? 'font-bold' : ''} group-hover/player:text-indigo-300`}>
                            {tName && <span className="text-amber-400 font-bold mr-1">{tName}</span>}
                            {player.name}
                          </span>
                          <span className="text-[10px] text-slate-400 sm:hidden">{getCategoryName(player.categoryId)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-300 text-sm">{getCategoryName(player.categoryId)}</span>
                        {isCategoryLeader && player.categoryId && (
                          <span title="Melhor da Categoria" className="text-amber-400 drop-shadow-sm filter brightness-110">
                            🏆
                          </span>
                        )}
                      </div>
                    </td>
                    {stages.map(stage => {
                      const stageScore = scoresByStage.get(String(stage.id));
                      const isSelected = selectedStageView === stage.id;
                      const isLowestAndNotStruck = selectedStageView === 'all' && lowestScore !== null && stageScore === lowestScore && !lowestScoreStruck;
                      if (isLowestAndNotStruck) {
                          lowestScoreStruck = true;
                      }
                      
                      return (
                        <td 
                          key={stage.id} 
                          className={`p-4 text-center font-mono text-xs md:text-sm transition-colors duration-300 ${
                            isSelected ? 'bg-indigo-500/5 font-bold text-indigo-300' : ''
                          } ${isLowestAndNotStruck ? 'text-slate-500 line-through opacity-50' : ''}`}
                        >
                          {stageScore ?? '—'}
                        </td>
                      )
                    })}
                    <td className={`p-4 text-lg md:text-xl font-bold text-right transition-colors duration-300 ${
                      selectedStageView === 'all' ? 'text-indigo-400' : 'text-indigo-300'
                    }`}>
                      {totalPoints}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 p-4 bg-slate-900/40 rounded-lg border border-slate-700/50">
        <p className="text-xs text-slate-500 italic">
          {selectedStageView === 'all' && (
            <>* A <strong>Classificação Geral</strong> utiliza a regra de descarte: soma-se os pontos de todas as etapas e subtrai-se o pior resultado individual (para jogadores com 2 ou mais participações).<br/></>
          )}
          Utilize o campo de busca para encontrar atletas pelo nome. Fotos são exibidas para o Top 10 e líderes de categoria.
        </p>
      </div>
    </div>
  );
};

export default Standings;
