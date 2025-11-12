import React, { useMemo } from 'react';
import { Player, Score, Category, Stage } from '../types';
import { TrophyIcon } from './icons';

interface StandingsProps {
  players: Player[];
  scores: Score[];
  categories: Category[];
  stages: Stage[];
}

const Standings: React.FC<StandingsProps> = ({ players, scores, categories, stages }) => {
  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'N/A';
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
      const scorePoints = playerScoresList.map(s => s.points);

      let totalPoints = 0;
      let lowestScoreValue: number | null = null;
      
      const sum = scorePoints.reduce((acc, p) => acc + p, 0);

      if (scorePoints.length > 1) {
        lowestScoreValue = Math.min(...scorePoints);
        totalPoints = sum - lowestScoreValue;
      } else {
        totalPoints = sum;
      }

      const scoresByStage = new Map<string, number>();
      playerScoresList.forEach(s => {
        scoresByStage.set(s.stageId, s.points);
      });

      return {
        player,
        totalPoints,
        scoresByStage,
        lowestScore: lowestScoreValue,
      };
    });

    return processedPlayers.sort((a, b) => b.totalPoints - a.totalPoints);
  }, [players, scores, stages]);

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
        <h2 className="text-3xl font-bold mb-2">Classificação Final</h2>
        <p className="text-slate-400">Nenhum jogador cadastrado para exibir a classificação.</p>
        <p className="text-slate-500 mt-2">Cadastre jogadores e lance suas pontuações para começar.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 p-6 md:p-8 rounded-lg shadow-xl">
      <div className="flex items-center mb-6">
        <TrophyIcon className="h-8 w-8 text-indigo-400" />
        <h2 className="text-3xl font-bold ml-3">Classificação Final</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left table-auto">
          <thead className="border-b-2 border-slate-600">
            <tr>
              <th className="p-4 text-sm font-semibold tracking-wider text-slate-400">Rank</th>
              <th className="p-4 text-sm font-semibold tracking-wider text-slate-400">Jogador</th>
              <th className="p-4 text-sm font-semibold tracking-wider text-slate-400">Categoria</th>
              {stages.map(stage => (
                <th key={stage.id} className="p-4 text-sm font-semibold tracking-wider text-slate-400 text-center whitespace-nowrap">{stage.name}</th>
              ))}
              <th className="p-4 text-sm font-semibold tracking-wider text-slate-400 text-right whitespace-nowrap">Total (c/ Descarte)</th>
            </tr>
          </thead>
          <tbody>
            {rankedPlayers.map(({ player, totalPoints, scoresByStage, lowestScore }, index) => {
              let lowestScoreStruck = false;
              return (
                <tr key={player.id} className="border-b border-slate-700 last:border-b-0 hover:bg-slate-700/50 transition-colors">
                  <td className="p-4">
                    <span className={`w-8 h-8 flex items-center justify-center font-bold rounded-full ${getRankColor(index + 1)}`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="p-4 font-medium whitespace-nowrap">{player.name}</td>
                  <td className="p-4 text-slate-300">{getCategoryName(player.categoryId)}</td>
                  {stages.map(stage => {
                    const stageScore = scoresByStage.get(stage.id);
                    const isLowestAndNotStruck = lowestScore !== null && stageScore === lowestScore && !lowestScoreStruck;
                    if (isLowestAndNotStruck) {
                        lowestScoreStruck = true;
                    }
                    
                    return (
                      <td key={stage.id} className={`p-4 text-center font-mono ${isLowestAndNotStruck ? 'text-slate-500 line-through' : ''}`}>
                        {stageScore ?? '—'}
                      </td>
                    )
                  })}
                  <td className="p-4 text-xl font-bold text-right text-indigo-400">{totalPoints}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Standings;