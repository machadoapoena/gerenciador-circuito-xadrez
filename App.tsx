
import React, { useState, useEffect, useRef } from 'react';
import { Player, Stage, Score, View, Category, Title } from './types';
import Header from './components/Header';
import Standings from './components/Standings';
import Login from './components/Login';
import { PlusIcon, TrashIcon, PencilIcon, ChessKnightIcon, AwardIcon } from './components/icons';

const App: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([
    { id: 'c1', name: 'Absoluto' },
    { id: 'c2', name: 'Feminino' },
    { id: 'c3', name: 'U18' },
  ]);
  const [titles, setTitles] = useState<Title[]>([
    { id: 't1', name: 'GM' },
    { id: 't2', name: 'IM' },
    { id: 't3', name: 'FM' },
    { id: 't4', name: 'NM' },
    { id: 't5', name: 'AFM' },
    { id: 't6', name: 'ACM' },
    { id: 't7', name: 'CMN' },
    { id: 't8', name: 'CM' },
  ]);
  const [players, setPlayers] = useState<Player[]>([
      { id: 'p1', name: 'Magnus Carlsen', categoryId: 'c1', birthDate: '1990-11-30', cbxId: '0123', fideId: '1503014', email: 'magnus.carlsen@example.com', titleId: 't1' },
      { id: 'p2', name: 'Hikaru Nakamura', categoryId: 'c1', birthDate: '1987-12-09', cbxId: '0456', fideId: '2016192', email: 'hikaru.nakamura@example.com', titleId: 't1' },
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // System settings
  const [systemName, setSystemName] = useState('Torneio de Xadrez');
  const [systemLogo, setSystemLogo] = useState<string | null>(null);

  // Form states
  const [playerName, setPlayerName] = useState('');
  const [playerCategoryId, setPlayerCategoryId] = useState('');
  const [playerBirthDate, setPlayerBirthDate] = useState('');
  const [playerCbxId, setPlayerCbxId] = useState('');
  const [playerFideId, setPlayerFideId] = useState('');
  const [playerEmail, setPlayerEmail] = useState('');
  const [playerTitleId, setPlayerTitleId] = useState('');
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const [stageName, setStageName] = useState('');
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  
  const [categoryName, setCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [titleName, setTitleName] = useState('');
  const [editingTitle, setEditingTitle] = useState<Title | null>(null);

  // State for the new score entry flow
  const [selectedStageIdForScoring, setSelectedStageIdForScoring] = useState<string>('');
  const [playerPoints, setPlayerPoints] = useState<Record<string, string>>({});
  const [filteredStageId, setFilteredStageId] = useState<string>('');
  const [filteredPlayerId, setFilteredPlayerId] = useState<string>('');
  
  // State for settings form
  const [settingsName, setSettingsName] = useState(systemName);
  const [settingsLogoPreview, setSettingsLogoPreview] = useState<string | null>(systemLogo);

  // Load settings and data from localStorage
  useEffect(() => {
    try {
        const savedName = localStorage.getItem('systemName');
        const savedLogo = localStorage.getItem('systemLogo');
        const savedCategories = localStorage.getItem('categories');
        const savedTitles = localStorage.getItem('titles');
        const savedPlayers = localStorage.getItem('players');
        const savedStages = localStorage.getItem('stages');
        const savedScores = localStorage.getItem('scores');

        if (savedName) setSystemName(JSON.parse(savedName));
        if (savedLogo) setSystemLogo(JSON.parse(savedLogo));
        if (savedCategories) setCategories(JSON.parse(savedCategories));
        if (savedTitles) setTitles(JSON.parse(savedTitles));
        if (savedPlayers) setPlayers(JSON.parse(savedPlayers));
        if (savedStages) setStages(JSON.parse(savedStages));
        if (savedScores) setScores(JSON.parse(savedScores));
    } catch(e) {
        console.error("Failed to parse data from localStorage", e);
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('systemName', JSON.stringify(systemName));
    localStorage.setItem('systemLogo', JSON.stringify(systemLogo));
    localStorage.setItem('categories', JSON.stringify(categories));
    localStorage.setItem('titles', JSON.stringify(titles));
    localStorage.setItem('players', JSON.stringify(players));
    localStorage.setItem('stages', JSON.stringify(stages));
    localStorage.setItem('scores', JSON.stringify(scores));
  }, [systemName, systemLogo, categories, titles, players, stages, scores]);

  useEffect(() => {
    if (currentView === 'settings') {
      setSettingsName(systemName);
      setSettingsLogoPreview(systemLogo);
    }
  }, [currentView, systemName, systemLogo]);


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
    if (editingTitle) {
      setTitleName(editingTitle.name);
    } else {
      setTitleName('');
    }
  }, [editingTitle]);

  useEffect(() => {
    if (editingPlayer) {
      setPlayerName(editingPlayer.name);
      setPlayerCategoryId(editingPlayer.categoryId);
      setPlayerBirthDate(editingPlayer.birthDate);
      setPlayerCbxId(editingPlayer.cbxId);
      setPlayerFideId(editingPlayer.fideId);
      setPlayerEmail(editingPlayer.email);
      setPlayerTitleId(editingPlayer.titleId || '');
    } else {
      setPlayerName('');
      setPlayerCategoryId('');
      setPlayerBirthDate('');
      setPlayerCbxId('');
      setPlayerFideId('');
      setPlayerEmail('');
      setPlayerTitleId('');
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

  const handleLogin = (user: string, pass: string) => {
    if (user === 'admin' && pass === 'a120780') {
      setIsAuthenticated(true);
      setCurrentView('players');
    } else {
      alert('Usuário ou senha inválidos.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentView('standings');
  };

  const handleExportData = () => {
    const dataToExport = {
      players,
      categories,
      titles,
      stages,
      scores,
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(dataToExport, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = "dados-torneio-xadrez.json";
    link.click();
    link.remove();
  };
  
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error("File content is not readable");
        
        const data = JSON.parse(text);

        if (data.players && data.categories && data.stages && data.scores) {
            setPlayers(data.players);
            setCategories(data.categories);
            setTitles(data.titles || []);
            setStages(data.stages);
            setScores(data.scores);
            alert("Dados importados com sucesso!");
        } else {
            throw new Error("Arquivo JSON inválido ou com formato incorreto.");
        }
      } catch (error) {
        console.error("Erro ao importar dados:", error);
        alert(`Não foi possível importar os dados. Verifique o arquivo.\nErro: ${error instanceof Error ? error.message : 'Desconhecido'}`);
      } finally {
        if (event.target) {
            event.target.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  const handlePlayerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName && playerBirthDate) {
      const playerData = { 
        name: playerName, 
        categoryId: playerCategoryId, 
        birthDate: playerBirthDate,
        cbxId: playerCbxId,
        fideId: playerFideId,
        email: playerEmail,
        titleId: playerTitleId || undefined,
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
    setScores(scores.filter(s => s.playerId !== id)); 
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
    setScores(scores.filter(s => s.stageId !== id));
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

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (titleName) {
        if (editingTitle) {
            setTitles(titles.map(t => t.id === editingTitle.id ? { ...t, name: titleName } : t));
        } else {
            const newTitle: Title = { id: crypto.randomUUID(), name: titleName };
            setTitles([...titles, newTitle]);
        }
        setEditingTitle(null);
    }
  };
  
  const handleEditTitleClick = (title: Title) => {
    setEditingTitle(title);
  };
  
  const cancelEditTitle = () => {
    setEditingTitle(null);
  };

  const deleteTitle = (id: string) => {
    const isTitleInUse = players.some(p => p.titleId === id);
    if(isTitleInUse) {
        alert('Não é possível excluir esta titulação, pois ela está sendo usada por um ou mais jogadores.');
        return;
    }
    setTitles(titles.filter(t => t.id !== id));
  };
  
  const handleStageScoresSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStageIdForScoring) return;

    const nextScores = [...scores];
    let changed = false;

    Object.entries(playerPoints).forEach(([playerId, pointsStr]) => {
      const existingScoreIndex = nextScores.findIndex(s => s.playerId === playerId && s.stageId === selectedStageIdForScoring);
      const pointsStrValue = String(pointsStr);
      const points = pointsStrValue.trim() === '' ? null : parseInt(pointsStrValue, 10);

      if (existingScoreIndex !== -1) {
        const existingScore = nextScores[existingScoreIndex];
        if (points === null || isNaN(points)) {
          nextScores.splice(existingScoreIndex, 1);
          changed = true;
        } else if (existingScore.points !== points) {
          nextScores[existingScoreIndex] = { ...existingScore, points: points };
          changed = true;
        }
      } else {
        if (points !== null && !isNaN(points)) {
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
    // Views privadas que exigem login
    const isPrivateView = !['standings', 'login'].includes(currentView);
    
    if (isPrivateView && !isAuthenticated) {
        return <Login onLogin={handleLogin} />;
    }
      
    const inputClasses = "w-full bg-slate-800 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition disabled:opacity-50";
    const buttonClasses = "flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-md transition-transform duration-200 hover:scale-105";
    const cardClasses = "bg-slate-800 p-6 rounded-lg shadow-xl mb-8";
    
    const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'N/A';
    const getTitleName = (id?: string) => titles.find(t => t.id === id)?.name || '';

    switch (currentView) {
      case 'login':
        return <Login onLogin={handleLogin} />;
      case 'players':
        return (
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <form onSubmit={handlePlayerSubmit} className={cardClasses}>
                <h2 className="text-2xl font-bold mb-4">{editingPlayer ? 'Editar Jogador' : 'Cadastrar Jogador'}</h2>
                <div className="space-y-4">
                  <input type="text" placeholder="Nome do Jogador" value={playerName} onChange={e => setPlayerName(e.target.value)} className={inputClasses} required />
                  <div className="grid grid-cols-2 gap-4">
                    <select value={playerCategoryId} onChange={e => setPlayerCategoryId(e.target.value)} className={inputClasses}>
                      <option value="">Categoria (Opcional)</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select value={playerTitleId} onChange={e => setPlayerTitleId(e.target.value)} className={inputClasses}>
                      <option value="">Titulação</option>
                      {titles.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
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
                {players.map(p => {
                    const tName = getTitleName(p.titleId);
                    return (
                      <li key={p.id} className="flex justify-between items-center bg-slate-700 p-3 rounded-md">
                        <div>
                          <p className="font-semibold">
                            {tName && <span className="text-amber-400 font-bold mr-1">{tName}</span>}
                            {p.name}
                          </p>
                          <p className="text-sm text-slate-400">{getCategoryName(p.categoryId)} - Nasc: {new Date(p.birthDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleEditPlayerClick(p)} className="text-sky-400 hover:text-sky-300 p-1 rounded-full hover:bg-sky-500/20"><PencilIcon/></button>
                            <button onClick={() => deletePlayer(p.id)} className="text-red-400 hover:text-red-300 p-1 rounded-full hover:bg-red-500/20"><TrashIcon /></button>
                        </div>
                      </li>
                    );
                })}
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
      case 'titles':
        return (
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <form onSubmit={handleTitleSubmit} className={cardClasses}>
                <h2 className="text-2xl font-bold mb-4">{editingTitle ? 'Editar Titulação' : 'Cadastrar Titulação'}</h2>
                <div className="space-y-4">
                  <input type="text" placeholder="Nome da Titulação (Ex: GM, WCM)" value={titleName} onChange={e => setTitleName(e.target.value)} className={inputClasses} required />
                  <div className="flex items-center gap-4">
                    <button type="submit" className={buttonClasses}>
                        {editingTitle ? 'Salvar Alterações' : <><PlusIcon/> Adicionar Titulação</>}
                    </button>
                    {editingTitle && (
                        <button type="button" onClick={cancelEditTitle} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition">
                            Cancelar
                        </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
            <div className={cardClasses}>
              <h2 className="text-2xl font-bold mb-4">Titulações Cadastradas</h2>
              <ul className="space-y-3 max-h-96 overflow-y-auto">
                {titles.map(t => (
                  <li key={t.id} className="flex justify-between items-center bg-slate-700 p-3 rounded-md">
                    <p className="font-semibold text-amber-400">{t.name}</p>
                    <div className="flex items-center gap-2">
                        <button onClick={() => handleEditTitleClick(t)} className="text-sky-400 hover:text-sky-300 p-1 rounded-full hover:bg-sky-500/20"><PencilIcon/></button>
                        <button onClick={() => deleteTitle(t.id)} className="text-red-400 hover:text-red-300 p-1 rounded-full hover:bg-red-500/20"><TrashIcon /></button>
                    </div>
                  </li>
                ))}
                {titles.length === 0 && <p className="text-slate-400">Nenhuma titulação cadastrada.</p>}
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
        const getPName = (id: string) => players.find(p => p.id === id)?.name || 'Desconhecido';
        const getSName = (id: string) => stages.find(s => s.id === id)?.name || 'Desconhecida';
        
        const filteredScores = scores
            .filter(s => filteredStageId ? s.stageId === filteredStageId : true)
            .filter(s => filteredPlayerId ? s.playerId === filteredPlayerId : true)
            .sort((a,b) => getSName(a.stageId).localeCompare(getSName(b.stageId)) || getPName(a.playerId).localeCompare(getPName(b.playerId)));

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
                                <p className="text-slate-400 text-center pt-4">Cadastre jogadores primeiro.</p>
                             )
                           )}
                        </div>
                    </form>
                 </div>
                 <div className={cardClasses}>
                    <h2 className="text-2xl font-bold mb-4">Pontuações Lançadas</h2>
                    <ul className="space-y-3 max-h-80 overflow-y-auto pr-2">
                        {filteredScores.map(s => (
                        <li key={s.id} className="flex justify-between items-center bg-slate-700 p-3 rounded-md">
                            <div>
                                <p className="font-semibold">{getPName(s.playerId)}</p>
                                <p className="text-sm text-slate-400">{getSName(s.stageId)}</p>
                            </div>
                            <div className="flex items-center gap-4">
                               <span className="font-bold text-lg text-indigo-400">{s.points} pts</span>
                               <button onClick={() => deleteScore(s.id)} className="text-red-400 hover:text-red-300 p-1 rounded-full hover:bg-red-500/20"><TrashIcon /></button>
                            </div>
                        </li>
                        ))}
                    </ul>
                 </div>
            </div>
        );
      case 'standings':
        return <Standings players={players} scores={scores} categories={categories} stages={stages} titles={titles} />;
      case 'settings':
        const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setSettingsLogoPreview(reader.result as string);
                };
                reader.readAsDataURL(file);
            }
        };

        const handleSettingsSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            setSystemName(settingsName);
            setSystemLogo(settingsLogoPreview);
            alert('Configurações salvas!');
        };
        
        return (
            <div className={cardClasses}>
                <h2 className="text-2xl font-bold mb-6">Configurações</h2>
                <form onSubmit={handleSettingsSubmit} className="space-y-6 max-w-lg mx-auto">
                    <div>
                        <label className="block text-sm font-medium text-slate-300">Nome do Torneio</label>
                        <input type="text" value={settingsName} onChange={(e) => setSettingsName(e.target.value)} className={inputClasses} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300">Logo</label>
                        <input type="file" onChange={handleLogoChange} className={inputClasses} accept="image/*" />
                    </div>
                    <button type="submit" className={`${buttonClasses} w-full`}>Salvar</button>
                </form>
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Header 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        onImport={handleImportClick}
        onExport={handleExportData}
        systemName={systemName}
        systemLogo={systemLogo}
      />
      <main className="container mx-auto p-4 md:p-8">
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="application/json" />
        {renderView()}
      </main>
    </div>
  );
};

export default App;
