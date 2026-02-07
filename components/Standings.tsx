
import React, { useMemo, useState } from 'react';
import { Player, Score, Category, Stage, Title } from '../types';
import { TrophyIcon } from './icons';

interface StandingsProps {
  players: Player[];
  scores: Score[];
  categories: Category[];
  stages: Stage[];
  titles: Title[];
}

const Standings: React.FC<StandingsProps> = ({ players, scores, categories, stages, titles }) => {
  const [selectedStageView, setSelectedStageView] = useState<string>('all');

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'N/A';
  }
  
  const getTitleName = (titleId?: string) => {
    return titles.find(t => t.id === titleId)?.name || '';
  }

  const rankedPlayers = useMemo(() => {
    if (players.length === 0) return [];

    const scoresByPlayer = new Map<string, Score[]>();
    scores.forEach(score => {
      if (!scoresByPlayer.has(score.playerId)) {
        scoresByPlayer.set(score.playerId, []);
      }
      scoresByPlayer.get(score.playerId)!.push(score);
    });

    const processedPlayers = players.map(player => {
      const playerScoresList = scoresByPlayer.get(player.id) || [];
      const scoresByStage = new Map<string, number>();
      playerScoresList.forEach(s => {
        scoresByStage.set(s.stageId, s.points);
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
        // Visão de Etapa Específica
        displayTotal = scoresByStage.get(selectedStageView) || 0;
      }

      return {
        player,
        totalPoints: displayTotal,
        scoresByStage,
        lowestScore: lowestScoreValue,
      };
    });

    // Ordenação dinâmica baseada no total calculado (Geral ou Etapa)
    const sorted = processedPlayers.sort((a, b) => b.totalPoints - a.totalPoints);

    // Determine category leaders (primeira aparição na lista ordenada)
    // Isso faz sentido apenas na visão geral, mas manteremos para consistência visual
    const categoryLeaders = new Set<string>();
    const playersWithLeaderFlag = sorted.map(item => {
      let isCategoryLeader = false;
      const catId = item.player.categoryId;
      if (catId && !categoryLeaders.has(catId)) {
        categoryLeaders.add(catId);
        isCategoryLeader = true;
      }
      return { ...item, isCategoryLeader };
    });

    return playersWithLeaderFlag;
  }, [players, scores, stages, selectedStageView]);

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-amber-400 text-amber-900';
      case 2:
        return 'bg-slate-400 text-slate-900';
      case 3:
        return 'bg-yellow-600 text-yellow-100';
      default:
        return 'bg-slate-600 text-slate-100';
    }
  };
  
  if (rankedPlayers.length === 0) {
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

  return (
    <div className="bg-slate-800 p-6 md:p-8 rounded-lg shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center">
          <TrophyIcon className="h-8 w-8 text-indigo-400" />
          <h2 className="text-3xl font-bold ml-3">
            {selectedStageView === 'all' ? 'Classificação Geral' : 'Classificação da Etapa'}
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <label className="text-sm font-medium text-slate-400 whitespace-nowrap">Filtrar Visão:</label>
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

      <div className="overflow-x-auto">
        <table className="w-full text-left table-auto">
          <thead className="border-b-2 border-slate-600">
            <tr>
              <th className="p-4 text-sm font-semibold tracking-wider text-slate-400">Rank</th>
              <th className="p-4 text-sm font-semibold tracking-wider text-slate-400">Jogador</th>
              <th className="p-4 text-sm font-semibold tracking-wider text-slate-400">Categoria</th>
              {stages.map(stage => {
                const isSelected = selectedStageView === stage.id;
                return (
                  <th 
                    key={stage.id} 
                    className={`p-4 text-sm font-semibold tracking-wider text-center whitespace-nowrap transition-colors duration-300 ${
                      isSelected ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400'
                    }`}
                  >
                    {stage.url ? (
                      <a 
                        href={stage.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="hover:text-indigo-300 underline underline-offset-4 decoration-indigo-500/30 hover:decoration-indigo-400 transition-all"
                        title="Ver resultados desta etapa"
                      >
                        {stage.name}
                      </a>
                    ) : (
                      stage.name
                    )}
                  </th>
                )
              })}
              <th className={`p-4 text-sm font-semibold tracking-wider text-right whitespace-nowrap ${selectedStageView === 'all' ? 'text-indigo-400' : 'text-slate-400'}`}>
                {selectedStageView === 'all' ? 'Total (c/ Descarte)' : 'Pts na Etapa'}
              </th>
            </tr>
          </thead>
          <tbody>
            {rankedPlayers.map(({ player, totalPoints, scoresByStage, lowestScore, isCategoryLeader }, index) => {
              let lowestScoreStruck = false;
              const tName = getTitleName(player.titleId);
              return (
                <tr key={player.id} className="border-b border-slate-700 last:border-b-0 hover:bg-slate-700/50 transition-colors">
                  <td className="p-4">
                    <span className={`w-8 h-8 flex items-center justify-center font-bold rounded-full ${getRankColor(index + 1)}`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="p-4 font-medium whitespace-nowrap">
                    {tName && <span className="text-amber-400 font-bold mr-1">{tName}</span>}
                    {player.name}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-300">{getCategoryName(player.categoryId)}</span>
                      {isCategoryLeader && player.categoryId && (
                        <span title="Melhor da Categoria" className="text-amber-400 drop-shadow-sm filter brightness-110">
                          🏆
                        </span>
                      )}
                    </div>
                  </td>
                  {stages.map(stage => {
                    const stageScore = scoresByStage.get(stage.id);
                    const isSelected = selectedStageView === stage.id;
                    
                    // Lógica de descarte: só mostra riscado se estiver na visão GERAL
                    const isLowestAndNotStruck = selectedStageView === 'all' && lowestScore !== null && stageScore === lowestScore && !lowestScoreStruck;
                    if (isLowestAndNotStruck) {
                        lowestScoreStruck = true;
                    }
                    
                    return (
                      <td 
                        key={stage.id} 
                        className={`p-4 text-center font-mono transition-colors duration-300 ${
                          isSelected ? 'bg-indigo-500/5 font-bold text-indigo-300' : ''
                        } ${isLowestAndNotStruck ? 'text-slate-500 line-through' : ''}`}
                      >
                        {stageScore ?? '—'}
                      </td>
                    )
                  })}
                  <td className={`p-4 text-xl font-bold text-right transition-colors duration-300 ${
                    selectedStageView === 'all' ? 'text-indigo-400' : 'text-indigo-300'
                  }`}>
                    {totalPoints}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      
      {selectedStageView === 'all' && (
        <div className="mt-6 p-4 bg-slate-900/40 rounded-lg border border-slate-700/50">
          <p className="text-sm text-slate-500 italic">
            * A <strong>Classificação Geral</strong> utiliza a regra de descarte: soma-se os pontos de todas as etapas e subtrai-se o pior resultado individual (caso o jogador tenha participado de 2 ou mais etapas).
          </p>
        </div>
      )}
    </div>
  );
};

export default Standings;
