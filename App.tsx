import React, { useState, useEffect } from 'react';
import { Player, Stage, Score, View, Category } from './types';
import Header from './components/Header';
import Standings from './components/Standings';
import { PlusIcon, TrashIcon, PencilIcon } from './components/icons';

const App: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([
    { id: 'c1', name: 'GM' },
    { id: 'c2', name: 'IM' },
    { id: 'c3', name: 'U18' },
  ]);
  const [players, setPlayers] = useState<Player[]>([
      { id: 'p1', name: 'Magnus Carlsen', categoryId: 'c1', birthDate: '1990-11-30', cbxId: '0123', fideId: '1503014', email: 'magnus.carlsen@example.com' },
      { id: 'p2', name: 'Hikaru Nakamura', categoryId: 'c1', birthDate: '1987-12-09', cbxId: '0456', fideId: '2016192', email: 'hikaru.nakamura@example.com' },
  ]);
  const [stages, setStages] = useState<Stage[]>([
      { id: 's1', name: 'Etapa 1 - Rápidas' },
      { id: 's2', name: 'Etapa 2 - Blitz' },
  ]);
  const [scores, setScores] = useState<Score[]>([
      { id: 'sc1', playerId: 'p1', stageId: 's1', points: 10 },
      { id: 'sc2', playerId: 'p2', stageId: 's1', points: 8 },
      { id: 'sc3', playerId: 'p1', stageId: 's2', points: 9 },
      { id: 'sc4', playerId: 'p2', stageId: 's2', points: 12 },
  ]);
  const [currentView, setCurrentView] = useState<View>('standings');

  // Form states
  const [playerName, setPlayerName] = useState('');
  const [playerCategoryId, setPlayerCategoryId] = useState('');
  const [playerBirthDate, setPlayerBirthDate] = useState('');
  const [playerCbxId, setPlayerCbxId] = useState('');
  const [playerFideId, setPlayerFideId] = useState('');
  const [playerEmail, setPlayerEmail] = useState('');
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const [stageName, setStageName] = useState('');
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  
  const [categoryName, setCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // State for the new score entry flow
  const [selectedStageIdForScoring, setSelectedStageIdForScoring] = useState<string>('');
  const [playerPoints, setPlayerPoints] = useState<Record<string, string>>({});
  const [filteredStageId, setFilteredStageId] = useState<string>('');


  useEffect(() => {
    if (editingStage) {
      setStageName(editingStage.name);
    } else {
      setStageName('');
    }
  }, [editingStage]);

  useEffect(() => {
    if (editingCategory) {
      setCategoryName(editingCategory.name);
    } else {
      setCategoryName('');
    }
  }, [editingCategory]);

  useEffect(() => {
    if (editingPlayer) {
      setPlayerName(editingPlayer.name);
      setPlayerCategoryId(editingPlayer.categoryId);
      setPlayerBirthDate(editingPlayer.birthDate);
      setPlayerCbxId(editingPlayer.cbxId);
      setPlayerFideId(editingPlayer.fideId);
      setPlayerEmail(editingPlayer.email);
    } else {
      setPlayerName('');
      setPlayerCategoryId('');
      setPlayerBirthDate('');
      setPlayerCbxId('');
      setPlayerFideId('');
      setPlayerEmail('');
    }
  }, [editingPlayer]);

  // Load scores for the selected stage
  useEffect(() => {
    if (selectedStageIdForScoring) {
      const pointsForStage = scores.filter(s => s.stageId === selectedStageIdForScoring);
      const initialPoints: Record<string, string> = {};
      players.forEach(player => {
        const score = pointsForStage.find(s => s.playerId === player.id);
        initialPoints[player.id] = score ? score.points.toString() : '';
      });
      setPlayerPoints(initialPoints);
    } else {
      setPlayerPoints({});
    }
  }, [selectedStageIdForScoring]);

  const handlePlayerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName && playerCategoryId && playerBirthDate) {
      const playerData = { 
        name: playerName, 
        categoryId: playerCategoryId, 
        birthDate: playerBirthDate,
        cbxId: playerCbxId,
        fideId: playerFideId,
        email: playerEmail,
      };
      if (editingPlayer) {
        setPlayers(players.map(p => p.id === editingPlayer.id ? { ...p, ...playerData } : p));
      } else {
        const newPlayer: Player = { id: crypto.randomUUID(), ...playerData };
        setPlayers([...players, newPlayer]);
      }
      setEditingPlayer(null);
    }
  };

  const handleEditPlayerClick = (player: Player) => {
    setEditingPlayer(player);
  };
  
  const cancelEditPlayer = () => {
    setEditingPlayer(null);
  }

  const deletePlayer = (id: string) => {
    setPlayers(players.filter(p => p.id !== id));
    setScores(scores.filter(s => s.playerId !== id)); // Also delete scores of deleted player
  };
  
  const handleStageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (stageName) {
        if (editingStage) {
            setStages(stages.map(s => s.id === editingStage.id ? { ...s, name: stageName } : s));
        } else {
            const newStage: Stage = { id: crypto.randomUUID(), name: stageName };
            setStages([...stages, newStage]);
        }
        setEditingStage(null);
    }
  };
  
  const handleEditStageClick = (stage: Stage) => {
    setEditingStage(stage);
  };
  
  const cancelEditStage = () => {
    setEditingStage(null);
  };

  const deleteStage = (id: string) => {
    setStages(stages.filter(s => s.id !== id));
    setScores(scores.filter(s => s.stageId !== id)); // Also delete scores of deleted stage
  };

    const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (categoryName) {
        if (editingCategory) {
            setCategories(categories.map(c => c.id === editingCategory.id ? { ...c, name: categoryName } : c));
        } else {
            const newCategory: Category = { id: crypto.randomUUID(), name: categoryName };
            setCategories([...categories, newCategory]);
        }
        setEditingCategory(null);
    }
  };
  
  const handleEditCategoryClick = (category: Category) => {
    setEditingCategory(category);
  };
  
  const cancelEditCategory = () => {
    setEditingCategory(null);
  };

  const deleteCategory = (id: string) => {
    const isCategoryInUse = players.some(p => p.categoryId === id);
    if(isCategoryInUse) {
        alert('Não é possível excluir esta categoria, pois ela está sendo usada por um ou mais jogadores.');
        return;
    }
    setCategories(categories.filter(c => c.id !== id));
  };
  
  const handleStageScoresSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStageIdForScoring) return;

    const nextScores = [...scores];
    let changed = false;

    Object.entries(playerPoints).forEach(([playerId, pointsStr]) => {
      const existingScoreIndex = nextScores.findIndex(s => s.playerId === playerId && s.stageId === selectedStageIdForScoring);
      // FIX: Explicitly convert pointsStr to a string. `Object.entries` on a
      // record type can infer the value as `unknown`, causing type errors.
      const pointsStrValue = String(pointsStr);
      const points = pointsStrValue.trim() === '' ? null : parseInt(pointsStrValue, 10);

      if (existingScoreIndex !== -1) { // Score exists
        const existingScore = nextScores[existingScoreIndex];
        if (points === null || isNaN(points)) {
          // Delete score if input is cleared
          nextScores.splice(existingScoreIndex, 1);
          changed = true;
        } else if (existingScore.points !== points) {
          // Update score if points changed
          nextScores[existingScoreIndex] = { ...existingScore, points: points };
          changed = true;
        }
      } else { // Score doesn't exist
        if (points !== null && !isNaN(points)) {
          // Add new score
          const newScore: Score = {
            id: crypto.randomUUID(),
            playerId,
            stageId: selectedStageIdForScoring,
            points,
          };
          nextScores.push(newScore);
          changed = true;
        }
      }
    });

    if (changed) {
      setScores(nextScores);
    }
    alert('Pontuações salvas com sucesso!');
  };

  const deleteScore = (id: string) => {
    setScores(scores.filter(s => s.id !== id));
  };
  
  const renderView = () => {
    const inputClasses = "w-full bg-slate-800 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition disabled:opacity-50";
    const buttonClasses = "flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-md transition-transform duration-200 hover:scale-105";
    const cardClasses = "bg-slate-800 p-6 rounded-lg shadow-xl mb-8";
    const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'N/A';

    switch (currentView) {
      case 'players':
        return (
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <form onSubmit={handlePlayerSubmit} className={cardClasses}>
                <h2 className="text-2xl font-bold mb-4">{editingPlayer ? 'Editar Jogador' : 'Cadastrar Jogador'}</h2>
                <div className="space-y-4">
                  <input type="text" placeholder="Nome do Jogador" value={playerName} onChange={e => setPlayerName(e.target.value)} className={inputClasses} required />
                  <select value={playerCategoryId} onChange={e => setPlayerCategoryId(e.target.value)} className={inputClasses} required>
                    <option value="">Selecione uma Categoria</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <input type="date" value={playerBirthDate} onChange={e => setPlayerBirthDate(e.target.value)} className={`${inputClasses} text-slate-400`} required />
                  <input type="email" placeholder="Email" value={playerEmail} onChange={e => setPlayerEmail(e.target.value)} className={inputClasses} />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="ID CBX" value={playerCbxId} onChange={e => setPlayerCbxId(e.target.value.replace(/\D/g, ''))} className={inputClasses} />
                    <input type="text" placeholder="ID FIDE" value={playerFideId} onChange={e => setPlayerFideId(e.target.value.replace(/\D/g, ''))} className={inputClasses} />
                  </div>
                  <div className="flex items-center gap-4">
                    <button type="submit" className={buttonClasses}>{editingPlayer ? 'Salvar Alterações' : <><PlusIcon/> Adicionar Jogador</>}</button>
                    {editingPlayer && (
                        <button type="button" onClick={cancelEditPlayer} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition">
                            Cancelar
                        </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
            <div className={cardClasses}>
              <h2 className="text-2xl font-bold mb-4">Jogadores Cadastrados</h2>
              <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {players.map(p => (
                  <li key={p.id} className="flex justify-between items-center bg-slate-700 p-3 rounded-md">
                    <div>
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-sm text-slate-400">{getCategoryName(p.categoryId)} - Nasc: {new Date(p.birthDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                          {p.email && <span className="flex items-center">📧 <span className="ml-1">{p.email}</span></span>}
                          {p.cbxId && <span>CBX: {p.cbxId}</span>}
                          {p.fideId && <span>FIDE: {p.fideId}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => handleEditPlayerClick(p)} className="text-sky-400 hover:text-sky-300 p-1 rounded-full hover:bg-sky-500/20"><PencilIcon/></button>
                        <button onClick={() => deletePlayer(p.id)} className="text-red-400 hover:text-red-300 p-1 rounded-full hover:bg-red-500/20"><TrashIcon /></button>
                    </div>
                  </li>
                ))}
                {players.length === 0 && <p className="text-slate-400">Nenhum jogador cadastrado.</p>}
              </ul>
            </div>
          </div>
        );
      case 'categories':
        return (
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <form onSubmit={handleCategorySubmit} className={cardClasses}>
                <h2 className="text-2xl font-bold mb-4">{editingCategory ? 'Editar Categoria' : 'Cadastrar Categoria'}</h2>
                <div className="space-y-4">
                  <input type="text" placeholder="Nome da Categoria" value={categoryName} onChange={e => setCategoryName(e.target.value)} className={inputClasses} required />
                  <div className="flex items-center gap-4">
                    <button type="submit" className={buttonClasses}>
                        {editingCategory ? 'Salvar Alterações' : <><PlusIcon/> Adicionar Categoria</>}
                    </button>
                    {editingCategory && (
                        <button type="button" onClick={cancelEditCategory} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition">
                            Cancelar
                        </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
            <div className={cardClasses}>
              <h2 className="text-2xl font-bold mb-4">Categorias Cadastradas</h2>
              <ul className="space-y-3 max-h-96 overflow-y-auto">
                {categories.map(c => (
                  <li key={c.id} className="flex justify-between items-center bg-slate-700 p-3 rounded-md">
                    <p className="font-semibold">{c.name}</p>
                    <div className="flex items-center gap-2">
                        <button onClick={() => handleEditCategoryClick(c)} className="text-sky-400 hover:text-sky-300 p-1 rounded-full hover:bg-sky-500/20"><PencilIcon/></button>
                        <button onClick={() => deleteCategory(c.id)} className="text-red-400 hover:text-red-300 p-1 rounded-full hover:bg-red-500/20"><TrashIcon /></button>
                    </div>
                  </li>
                ))}
                {categories.length === 0 && <p className="text-slate-400">Nenhuma categoria cadastrada.</p>}
              </ul>
            </div>
          </div>
        );
      case 'stages':
        return (
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <form onSubmit={handleStageSubmit} className={cardClasses}>
                <h2 className="text-2xl font-bold mb-4">{editingStage ? 'Editar Etapa' : 'Cadastrar Etapa'}</h2>
                <div className="space-y-4">
                  <input type="text" placeholder="Nome da Etapa" value={stageName} onChange={e => setStageName(e.target.value)} className={inputClasses} required />
                  <div className="flex items-center gap-4">
                    <button type="submit" className={buttonClasses}>
                        {editingStage ? 'Salvar Alterações' : <><PlusIcon/> Adicionar Etapa</>}
                    </button>
                    {editingStage && (
                        <button type="button" onClick={cancelEditStage} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition">
                            Cancelar
                        </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
            <div className={cardClasses}>
              <h2 className="text-2xl font-bold mb-4">Etapas Cadastradas</h2>
              <ul className="space-y-3 max-h-96 overflow-y-auto">
                {stages.map(s => (
                  <li key={s.id} className="flex justify-between items-center bg-slate-700 p-3 rounded-md">
                    <p className="font-semibold">{s.name}</p>
                    <div className="flex items-center gap-2">
                        <button onClick={() => handleEditStageClick(s)} className="text-sky-400 hover:text-sky-300 p-1 rounded-full hover:bg-sky-500/20"><PencilIcon/></button>
                        <button onClick={() => deleteStage(s.id)} className="text-red-400 hover:text-red-300 p-1 rounded-full hover:bg-red-500/20"><TrashIcon /></button>
                    </div>
                  </li>
                ))}
                {stages.length === 0 && <p className="text-slate-400">Nenhuma etapa cadastrada.</p>}
              </ul>
            </div>
          </div>
        );
      case 'scores':
        const getPlayerName = (id: string) => players.find(p => p.id === id)?.name || 'Desconhecido';
        const getStageName = (id: string) => stages.find(s => s.id === id)?.name || 'Desconhecida';
        
        const filteredScores = scores
            .filter(s => filteredStageId ? s.stageId === filteredStageId : true)
            .sort((a,b) => getStageName(a.stageId).localeCompare(getStageName(b.stageId)) || getPlayerName(a.playerId).localeCompare(getPlayerName(b.playerId)));

        return (
            <div className="grid md:grid-cols-2 gap-8">
                 <div>
                    <form onSubmit={handleStageScoresSubmit} className={cardClasses}>
                        <h2 className="text-2xl font-bold mb-4">Lançar Pontuações por Etapa</h2>
                        <div className="space-y-4">
                           <select value={selectedStageIdForScoring} onChange={e => setSelectedStageIdForScoring(e.target.value)} className={inputClasses} required>
                                <option value="">Selecione uma Etapa</option>
                                {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                           </select>

                           {selectedStageIdForScoring && (
                             players.length > 0 ? (
                                <>
                                  <div className="space-y-3 pt-4 max-h-80 overflow-y-auto pr-2">
                                    {players.map(player => (
                                      <div key={player.id} className="flex items-center justify-between bg-slate-900/50 p-2 rounded-md">
                                        <label htmlFor={`score-${player.id}`} className="font-medium">{player.name}</label>
                                        <input
                                          id={`score-${player.id}`}
                                          type="number"
                                          placeholder="Pts"
                                          value={playerPoints[player.id] || ''}
                                          onChange={e => setPlayerPoints({ ...playerPoints, [player.id]: e.target.value })}
                                          className={`${inputClasses} w-24 text-center`}
                                          min="0"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                  <button type="submit" className={`${buttonClasses} w-full`}>
                                      <PlusIcon/> Salvar Pontuações da Etapa
                                  </button>
                                </>
                             ) : (
                                <p className="text-slate-400 text-center pt-4">Primeiro, cadastre jogadores na aba 'Jogadores' para poder lançar suas pontuações.</p>
                             )
                           )}
                        </div>
                    </form>
                 </div>
                 <div className={cardClasses}>
                    <h2 className="text-2xl font-bold mb-4">Pontuações Lançadas</h2>
                    <div className="mb-4">
                        <label htmlFor="stage-filter" className="block text-sm font-medium text-slate-400 mb-1">Filtrar por Etapa:</label>
                        <select
                            id="stage-filter"
                            value={filteredStageId}
                            onChange={e => setFilteredStageId(e.target.value)}
                            className={inputClasses}
                        >
                            <option value="">Todas as Etapas</option>
                            {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <ul className="space-y-3 max-h-80 overflow-y-auto pr-2">
                        {filteredScores.map(s => (
                        <li key={s.id} className="flex justify-between items-center bg-slate-700 p-3 rounded-md">
                            <div>
                                <p className="font-semibold">{getPlayerName(s.playerId)}</p>
                                <p className="text-sm text-slate-400">{getStageName(s.stageId)}</p>
                            </div>
                            <div className="flex items-center gap-4">
                               <span className="font-bold text-lg text-indigo-400">{s.points} pts</span>
                               <button onClick={() => deleteScore(s.id)} className="text-red-400 hover:text-red-300 p-1 rounded-full hover:bg-red-500/20"><TrashIcon /></button>
                            </div>
                        </li>
                        ))}
                        {scores.length > 0 && filteredScores.length === 0 && <p className="text-slate-400">Nenhuma pontuação encontrada para esta etapa.</p>}
                        {scores.length === 0 && <p className="text-slate-400">Nenhuma pontuação lançada.</p>}
                    </ul>
                 </div>
            </div>
        );
      case 'standings':
        return <Standings players={players} scores={scores} categories={categories} stages={stages} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Header currentView={currentView} setCurrentView={setCurrentView} />
      <main className="container mx-auto p-4 md:p-8">
        {renderView()}
      </main>
    </div>
  );
};

export default App;