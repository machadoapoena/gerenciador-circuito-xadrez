
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Player, Stage, Score, View, Category, Title } from './types';
import Header from './components/Header';
import Standings from './components/Standings';
import Login from './components/Login';
import { supabase } from './supabase';
import { PlusIcon, TrashIcon, PencilIcon, ChessKnightIcon, AwardIcon, UploadIcon, UsersIcon } from './components/icons';

const App: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [titles, setTitles] = useState<Title[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [currentView, setCurrentView] = useState<View>('standings');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const playerPhotoInputRef = useRef<HTMLInputElement>(null);

  // System settings
  const [systemName, setSystemName] = useState('Torneio de Xadrez');
  const [systemLogo, setSystemLogo] = useState<string | null>(null);

  // Form states
  const [playerName, setPlayerName] = useState('');
  const [playerCategoryId, setPlayerCategoryId] = useState('');
  const [playerBirthDate, setPlayerBirthDate] = useState('');
  const [playerCbxId, setPlayerCbxId] = useState('');
  const [playerFideId, setPlayerFideId] = useState('');
  const [playerRating, setPlayerRating] = useState('');
  const [playerEmail, setPlayerEmail] = useState('');
  const [playerTitleId, setPlayerTitleId] = useState('');
  const [playerPhoto, setPlayerPhoto] = useState<string | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const [stageName, setStageName] = useState('');
  const [stageUrl, setStageUrl] = useState('');
  const [editingStage, setEditingStage] = useState<Stage | null>(null);

  const [categoryName, setCategoryName] = useState('');
  const [titleName, setTitleName] = useState('');

  const [selectedStageIdForScoring, setSelectedStageIdForScoring] = useState<string>('');
  const [selectedPlayerIdForScoring, setSelectedPlayerIdForScoring] = useState<string>('');
  const [singleScoreValue, setSingleScoreValue] = useState<string>('');
  
  const [settingsName, setSettingsName] = useState(systemName);
  const [settingsLogoPreview, setSettingsLogoPreview] = useState<string | null>(systemLogo);

  // --- Helpers ---
  const getPName = (id: string) => players.find(p => String(p.id) === String(id))?.name || 'Desconhecido';
  const getSName = (id: string) => stages.find(s => String(s.id) === String(id))?.name || 'Desconhecido';
  const getTitleName = (id?: string) => titles.find(t => String(t.id) === String(id))?.name || '';

  // --- Hooks at Top Level ---
  const filteredScoresForView = useMemo(() => {
    let list = [...scores];
    if (selectedStageIdForScoring && selectedPlayerIdForScoring) {
      return list.filter(s => String(s.stageId) === String(selectedStageIdForScoring) && String(s.playerId) === String(selectedPlayerIdForScoring));
    } else if (selectedStageIdForScoring) {
      return list.filter(s => String(s.stageId) === String(selectedStageIdForScoring)).sort((a, b) => b.points - a.points);
    } else if (selectedPlayerIdForScoring) {
      return list.filter(s => String(s.playerId) === String(selectedPlayerIdForScoring));
    } else {
      return [...list].reverse().slice(0, 30);
    }
  }, [scores, selectedStageIdForScoring, selectedPlayerIdForScoring]);

  const scoreListTitle = useMemo(() => {
    if (selectedStageIdForScoring && selectedPlayerIdForScoring) return "Ponto Lançado";
    if (selectedStageIdForScoring) return `Resultados: ${getSName(selectedStageIdForScoring)}`;
    if (selectedPlayerIdForScoring) return `Histórico de ${getPName(selectedPlayerIdForScoring)}`;
    return "Histórico Recente";
  }, [selectedStageIdForScoring, selectedPlayerIdForScoring, players, stages]);

  const existingScoreInForm = useMemo(() => {
    if (!selectedStageIdForScoring || !selectedPlayerIdForScoring) return null;
    return scores.find(s => String(s.stageId) === String(selectedStageIdForScoring) && String(s.playerId) === String(selectedPlayerIdForScoring));
  }, [selectedStageIdForScoring, selectedPlayerIdForScoring, scores]);

  // Fetch all data from Supabase on mount
  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true);
      try {
        const [
          { data: cats }, 
          { data: tits }, 
          { data: plays }, 
          { data: stgs }, 
          { data: scs },
          { data: sets }
        ] = await Promise.all([
          supabase.from('categories').select('*').order('name'),
          supabase.from('titles').select('*').order('name'),
          supabase.from('players').select('*').order('name'),
          supabase.from('stages').select('*').order('name'),
          supabase.from('scores').select('*'),
          supabase.from('settings').select('*')
        ]);

        if (cats) setCategories(cats);
        if (tits) setTitles(tits);
        if (plays) setPlayers(plays);
        if (stgs) setStages(stgs);
        if (scs) setScores(scs);
        
        const nameSet = sets?.find(s => s.key === 'systemName');
        const logoSet = sets?.find(s => s.key === 'systemLogo');
        if (nameSet) {
          setSystemName(nameSet.value);
          setSettingsName(nameSet.value);
        }
        if (logoSet) {
          setSystemLogo(logoSet.value);
          setSettingsLogoPreview(logoSet.value);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do Supabase:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData();
  }, []);

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

  const handlePlayerPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPlayerPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetPlayerForm = () => {
    setPlayerName('');
    setPlayerCategoryId('');
    setPlayerBirthDate('');
    setPlayerCbxId('');
    setPlayerFideId('');
    setPlayerRating('');
    setPlayerEmail('');
    setPlayerTitleId('');
    setPlayerPhoto(null);
    setEditingPlayer(null);
  };

  const handlePlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName) return;

    const playerData: any = { 
      name: playerName, 
      categoryId: playerCategoryId || null, 
      birthDate: playerBirthDate || null, 
      cbxId: playerCbxId || null, 
      fideId: playerFideId || null, 
      rating: playerRating || null,
      email: playerEmail || null, 
      titleId: playerTitleId || null,
      photoUrl: playerPhoto || null
    };

    setIsLoading(true);
    try {
      if (editingPlayer) {
        const { error } = await supabase.from('players').update(playerData).eq('id', editingPlayer.id);
        if (error) throw error;
        setPlayers(prev => prev.map(p => p.id === editingPlayer.id ? { ...p, ...playerData } as Player : p));
        setEditingPlayer(null);
      } else {
        playerData.id = crypto.randomUUID();
        const { data, error } = await supabase.from('players').insert(playerData).select().single();
        if (error) throw error;
        if (data) setPlayers(prev => [...prev, data as Player]);
      }
      resetPlayerForm();
    } catch (err: any) {
      alert('Erro ao salvar jogador: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stageName) return;
    setIsLoading(true);
    try {
      const stageData: any = { name: stageName, url: stageUrl || null };
      if (editingStage) {
        const { error } = await supabase.from('stages').update(stageData).eq('id', editingStage.id);
        if (error) throw error;
        setStages(prev => prev.map(s => s.id === editingStage.id ? { ...s, ...stageData } : s));
        setEditingStage(null);
      } else {
        stageData.id = crypto.randomUUID();
        const { data, error } = await supabase.from('stages').insert(stageData).select().single();
        if (error) throw error;
        if (data) setStages(prev => [...prev, data as Stage]);
      }
      setStageName('');
      setStageUrl('');
    } catch (err: any) {
      alert('Erro ao salvar etapa: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('categories').insert({ id: crypto.randomUUID(), name: categoryName }).select().single();
      if (error) throw error;
      if (data) setCategories(prev => [...prev, data]);
      setCategoryName('');
    } catch (err: any) {
      alert('Erro ao criar categoria: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTitleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleName) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('titles').insert({ id: crypto.randomUUID(), name: titleName }).select().single();
      if (error) throw error;
      if (data) setTitles(prev => [...prev, data]);
      setTitleName('');
    } catch (err: any) {
      alert('Erro ao criar titulação: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const performDeleteScore = async (scoreId: string | number) => {
    if (!scoreId) return false;
    setIsLoading(true);
    try {
      const { error } = await supabase.from('scores').delete().eq('id', scoreId);
      if (error) throw error;
      setScores(prev => prev.filter(s => String(s.id) !== String(scoreId)));
      return true;
    } catch (err: any) {
      console.error('Erro ao excluir do Supabase:', err);
      alert('Erro ao excluir pontuação: ' + err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSingleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStageIdForScoring || !selectedPlayerIdForScoring) return;
    
    const points = parseFloat(singleScoreValue);
    setIsLoading(true);
    try {
      const existing = scores.find(s => String(s.playerId) === String(selectedPlayerIdForScoring) && String(s.stageId) === String(selectedStageIdForScoring));
      
      if (isNaN(points)) {
        if (existing) {
          if (confirm('A pontuação está vazia. Deseja realmente excluir este registro?')) {
            await performDeleteScore(existing.id);
          }
        }
      } else {
        if (existing) {
          const { error } = await supabase.from('scores').update({ points }).eq('id', existing.id);
          if (error) throw error;
          setScores(prev => prev.map(s => String(s.id) === String(existing.id) ? { ...s, points } : s));
        } else {
          const scoreData = { 
            id: crypto.randomUUID(), 
            playerId: selectedPlayerIdForScoring, 
            stageId: selectedStageIdForScoring, 
            points 
          };
          const { data, error } = await supabase.from('scores').insert(scoreData).select().single();
          if (error) throw error;
          if (data) setScores(prev => [...prev, data]);
        }
      }
      setSelectedPlayerIdForScoring('');
      setSingleScoreValue('');
    } catch (err: any) {
      alert('Erro ao salvar pontos: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await Promise.all([
        supabase.from('settings').upsert({ key: 'systemName', value: settingsName }),
        supabase.from('settings').upsert({ key: 'systemLogo', value: settingsLogoPreview })
      ]);
      setSystemName(settingsName);
      setSystemLogo(settingsLogoPreview);
      alert('Configurações atualizadas com sucesso!');
    } catch (err: any) {
      alert('Erro ao salvar configurações: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderLoading = () => (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
        <p className="mt-4 text-slate-300 font-medium">Sincronizando com Supabase...</p>
      </div>
    </div>
  );

  const renderView = () => {
    const isPrivate = !['standings', 'login'].includes(currentView);
    if (isPrivate && !isAuthenticated) return <Login onLogin={handleLogin} />;
      
    const inputClasses = "w-full bg-slate-800 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition placeholder:text-slate-500";
    const buttonClasses = "flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-md transition-transform duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed";
    const dangerButtonClasses = "flex items-center justify-center bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-md transition-transform duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed";
    const cardClasses = "bg-slate-800 p-6 rounded-lg shadow-xl mb-8";

    switch (currentView) {
      case 'login': return <Login onLogin={handleLogin} />;
      case 'players':
        return (
          <div className="grid lg:grid-cols-2 gap-8">
            <form onSubmit={handlePlayerSubmit} className={cardClasses}>
              <h2 className="text-2xl font-bold mb-4">{editingPlayer ? 'Editar Jogador' : 'Cadastrar Jogador'}</h2>
              
              {/* Photo Upload Section */}
              <div className="mb-6 flex flex-col items-center">
                <div 
                  className="w-32 h-32 rounded-full bg-slate-700 border-2 border-dashed border-slate-500 flex items-center justify-center overflow-hidden cursor-pointer hover:border-indigo-400 transition-colors"
                  onClick={() => playerPhotoInputRef.current?.click()}
                >
                  {playerPhoto ? (
                    <img src={playerPhoto} alt="Foto do jogador" className="w-full h-full object-cover" />
                  ) : (
                    <UsersIcon />
                  )}
                </div>
                <button 
                  type="button" 
                  onClick={() => playerPhotoInputRef.current?.click()}
                  className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  {playerPhoto ? 'Alterar Foto' : 'Adicionar Foto'}
                </button>
                <input 
                  type="file" 
                  ref={playerPhotoInputRef} 
                  onChange={handlePlayerPhotoChange} 
                  className="hidden" 
                  accept="image/*" 
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Nome Completo *</label>
                  <input type="text" placeholder="Nome do jogador" value={playerName} onChange={e => setPlayerName(e.target.value)} className={inputClasses} required />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Categoria</label>
                    <select value={playerCategoryId} onChange={e => setPlayerCategoryId(e.target.value)} className={inputClasses}>
                      <option value="">Selecione...</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Titulação</label>
                    <select value={playerTitleId} onChange={e => setPlayerTitleId(e.target.value)} className={inputClasses}>
                      <option value="">Nenhuma</option>
                      {titles.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">ID CBX</label>
                    <input type="text" placeholder="ID Nacional" value={playerCbxId} onChange={e => setPlayerCbxId(e.target.value)} className={inputClasses} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">ID FIDE</label>
                    <input type="text" placeholder="ID Internacional" value={playerFideId} onChange={e => setPlayerFideId(e.target.value)} className={inputClasses} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Data Nascimento</label>
                    <input type="date" value={playerBirthDate} onChange={e => setPlayerBirthDate(e.target.value)} className={inputClasses} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Rating</label>
                    <input type="number" placeholder="Elo" value={playerRating} onChange={e => setPlayerRating(e.target.value)} className={inputClasses} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">E-mail</label>
                  <input type="email" placeholder="email@exemplo.com" value={playerEmail} onChange={e => setPlayerEmail(e.target.value)} className={inputClasses} />
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="submit" disabled={isLoading} className={`${buttonClasses} flex-1`}>{editingPlayer ? 'Salvar Alterações' : 'Cadastrar Jogador'}</button>
                  {editingPlayer && (
                    <button type="button" onClick={resetPlayerForm} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-md transition">Cancelar</button>
                  )}
                </div>
              </div>
            </form>
            <div className={cardClasses}>
              <h2 className="text-2xl font-bold mb-4">Jogadores Cadastrados ({players.length})</h2>
              <div className="overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                <ul className="space-y-2">
                  {players.map(p => (
                    <li key={p.id} className="flex justify-between items-center bg-slate-700 p-3 rounded-md border-l-4 border-slate-500 hover:border-indigo-500 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-600 overflow-hidden flex-shrink-0 border border-slate-500">
                          {p.photoUrl ? (
                            <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <UsersIcon />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">
                            {getTitleName(p.titleId) && <b className="text-amber-400 mr-1">{getTitleName(p.titleId)}</b>}
                            {p.name}
                          </span>
                          <div className="flex gap-3 text-[10px] text-slate-400 mt-0.5">
                            {p.rating && <span>Rating: {p.rating}</span>}
                            {p.cbxId && <span>CBX: {p.cbxId}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { 
                          setEditingPlayer(p); 
                          setPlayerName(p.name); 
                          setPlayerCategoryId(p.categoryId || ''); 
                          setPlayerBirthDate(p.birthDate || ''); 
                          setPlayerCbxId(p.cbxId || '');
                          setPlayerFideId(p.fideId || '');
                          setPlayerRating(p.rating || '');
                          setPlayerEmail(p.email || '');
                          setPlayerTitleId(p.titleId || ''); 
                          setPlayerPhoto(p.photoUrl || null);
                        }} className="text-sky-400 hover:text-sky-300 p-1"><PencilIcon/></button>
                        <button onClick={async () => { 
                          if(confirm('Tem certeza que deseja excluir este jogador? Todas as pontuações dele serão removidas.')) {
                            setIsLoading(true);
                            try {
                              const { error } = await supabase.from('players').delete().eq('id', p.id);
                              if (error) {
                                alert('Erro ao excluir jogador: ' + error.message);
                              } else {
                                setPlayers(prev => prev.filter(x => String(x.id) !== String(p.id)));
                                setScores(prev => prev.filter(s => String(s.playerId) !== String(p.id)));
                              }
                            } catch (err: any) {
                              alert('Erro inesperado: ' + err.message);
                            }
                            setIsLoading(false);
                          }
                        }} className="text-red-400 hover:text-red-300 p-1"><TrashIcon/></button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      case 'categories':
        return (
          <div className="grid md:grid-cols-2 gap-8">
            <form onSubmit={handleCategorySubmit} className={cardClasses}>
              <h2 className="text-2xl font-bold mb-4">Gerenciar Categorias</h2>
              <input type="text" placeholder="Nome da Categoria" value={categoryName} onChange={e => setCategoryName(e.target.value)} className={inputClasses} />
              <button type="submit" disabled={isLoading} className={`${buttonClasses} mt-4 w-full`}>Adicionar</button>
            </form>
            <div className={cardClasses}>
              <ul className="space-y-2">
                {categories.map(c => (
                  <li key={c.id} className="flex justify-between p-3 bg-slate-700 rounded-md">
                    {c.name}
                    <button onClick={async () => {
                      if (confirm('Deseja excluir esta categoria? Jogadores nesta categoria ficarão sem categoria.')) {
                        setIsLoading(true);
                        const { error } = await supabase.from('categories').delete().eq('id', c.id);
                        if (error) {
                          alert('Erro ao excluir categoria: ' + error.message);
                        } else {
                          setCategories(prev => prev.filter(x => String(x.id) !== String(c.id)));
                          setPlayers(prev => prev.map(p => String(p.categoryId) === String(c.id) ? { ...p, categoryId: '' } : p));
                        }
                        setIsLoading(false);
                      }
                    }} className="text-red-400 hover:text-red-300 transition-colors"><TrashIcon/></button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      case 'titles':
        return (
          <div className="grid md:grid-cols-2 gap-8">
            <form onSubmit={handleTitleSubmit} className={cardClasses}>
              <h2 className="text-2xl font-bold mb-4">Gerenciar Titulações</h2>
              <input type="text" placeholder="Ex: GM, WCM, MF" value={titleName} onChange={e => setTitleName(e.target.value)} className={inputClasses} />
              <button type="submit" disabled={isLoading} className={`${buttonClasses} mt-4 w-full`}>Adicionar</button>
            </form>
            <div className={cardClasses}>
              <ul className="space-y-2">
                {titles.map(t => (
                  <li key={t.id} className="flex justify-between p-3 bg-slate-700 rounded-md">
                    <span className="text-amber-400 font-bold">{t.name}</span>
                    <button onClick={async () => {
                      if (confirm('Deseja excluir esta titulação?')) {
                        setIsLoading(true);
                        const { error } = await supabase.from('titles').delete().eq('id', t.id);
                        if (error) {
                          alert('Erro ao excluir titulação: ' + error.message);
                        } else {
                          setTitles(prev => prev.filter(x => String(x.id) !== String(t.id)));
                          setPlayers(prev => prev.map(p => String(p.titleId) === String(t.id) ? { ...p, titleId: '' } : p));
                        }
                        setIsLoading(false);
                      }
                    }} className="text-red-400 hover:text-red-300 transition-colors"><TrashIcon/></button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      case 'stages':
        return (
          <div className="grid md:grid-cols-2 gap-8">
            <form onSubmit={handleStageSubmit} className={cardClasses}>
              <h2 className="text-2xl font-bold mb-4">{editingStage ? 'Editar Etapa' : 'Gerenciar Etapas'}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Nome da Etapa *</label>
                  <input type="text" placeholder="Nome da Etapa (ex: 1ª Rodada)" value={stageName} onChange={e => setStageName(e.target.value)} className={inputClasses} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Link da Etapa (URL)</label>
                  <input type="url" placeholder="https://chess-results.com/..." value={stageUrl} onChange={e => setStageUrl(e.target.value)} className={inputClasses} />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={isLoading} className={`${buttonClasses} flex-1`}>{editingStage ? 'Salvar Alterações' : 'Adicionar'}</button>
                  {editingStage && (
                    <button type="button" onClick={() => { setEditingStage(null); setStageName(''); setStageUrl(''); }} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-md transition">Cancelar</button>
                  )}
                </div>
              </div>
            </form>
            <div className={cardClasses}>
              <ul className="space-y-2">
                {stages.map(s => (
                  <li key={s.id} className="flex justify-between p-3 bg-slate-700 rounded-md border-l-4 border-slate-500 hover:border-indigo-500 transition-colors">
                    <div className="flex flex-col">
                      <span className="font-medium">{s.name}</span>
                      {s.url && <span className="text-xs text-indigo-400 truncate max-w-[200px]">{s.url}</span>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { 
                          setEditingStage(s); 
                          setStageName(s.name); 
                          setStageUrl(s.url || ''); 
                        }} className="text-sky-400 hover:text-sky-300 p-1"><PencilIcon/></button>
                      <button onClick={async () => {
                        if (confirm('Deseja excluir esta etapa? Todas as pontuações lançadas nela serão apagadas.')) {
                          setIsLoading(true);
                          const { error } = await supabase.from('stages').delete().eq('id', s.id);
                          if (error) {
                            alert('Erro ao excluir etapa: ' + error.message);
                          } else {
                            setStages(prev => prev.filter(x => String(x.id) !== String(s.id)));
                            setScores(prev => prev.filter(sc => String(sc.stageId) !== String(s.id)));
                          }
                          setIsLoading(false);
                        }
                      }} className="text-red-400 hover:text-red-300 p-1"><TrashIcon/></button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      case 'scores':
        return (
          <div className="grid md:grid-cols-2 gap-8">
            <form onSubmit={handleSingleScoreSubmit} className={cardClasses}>
              <h2 className="text-2xl font-bold mb-4">Lançar Pontos</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">1. Selecione a Etapa</label>
                  <select 
                    value={selectedStageIdForScoring} 
                    onChange={e => setSelectedStageIdForScoring(e.target.value)} 
                    className={inputClasses}
                  >
                    <option value="">Selecione a Etapa</option>
                    {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">2. Selecione o Jogador</label>
                  <select 
                    value={selectedPlayerIdForScoring} 
                    onChange={e => setSelectedPlayerIdForScoring(e.target.value)} 
                    className={inputClasses}
                  >
                    <option value="">Selecione o Jogador</option>
                    {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                {selectedStageIdForScoring && selectedPlayerIdForScoring && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-sm text-slate-400 mb-1">3. Pontuação (Decimais permitidos)</label>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        step="0.1"
                        placeholder="Ex: 0.5"
                        value={singleScoreValue} 
                        onChange={e => setSingleScoreValue(e.target.value)} 
                        className={`${inputClasses} text-xl font-bold text-indigo-400`} 
                        autoFocus
                      />
                      <button type="submit" disabled={isLoading} className={`${buttonClasses} px-8`}>Salvar</button>
                      {existingScoreInForm && (
                        <button 
                          type="button" 
                          onClick={async () => {
                            if (confirm('Deseja realmente excluir esta pontuação?')) {
                              const success = await performDeleteScore(existingScoreInForm.id);
                              if (success) {
                                setSelectedPlayerIdForScoring('');
                                setSingleScoreValue('');
                              }
                            }
                          }}
                          disabled={isLoading} 
                          className={dangerButtonClasses}
                        >
                          Excluir
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </form>

            <div className={cardClasses}>
              <h2 className="text-2xl font-bold mb-4 flex justify-between items-center">
                <span>{scoreListTitle}</span>
                <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-400 uppercase tracking-tighter">
                  {filteredScoresForView.length} registros
                </span>
              </h2>
              <ul className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                {filteredScoresForView.length === 0 ? (
                  <li className="text-center py-10 text-slate-500 italic">Nenhum registro encontrado para este filtro.</li>
                ) : (
                  filteredScoresForView.map(s => (
                    <li key={s.id} className="flex justify-between items-center bg-slate-700 p-3 rounded-md border-l-4 border-indigo-500 hover:bg-slate-600/50 transition-colors">
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-medium truncate">{getPName(s.playerId)}</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">{getSName(s.stageId)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-indigo-400 text-lg tabular-nums mr-2">{s.points} pts</span>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => {
                              setSelectedStageIdForScoring(s.stageId);
                              setSelectedPlayerIdForScoring(s.playerId);
                              setSingleScoreValue(s.points.toString());
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="text-sky-400 hover:text-sky-300 p-2 bg-slate-800 rounded-md transition-colors"
                            title="Editar pontuação"
                          >
                            <PencilIcon />
                          </button>
                          <button 
                            onClick={async () => {
                              if (confirm('Deseja remover esta pontuação?')) {
                                await performDeleteScore(s.id);
                              }
                            }}
                            className="text-red-400 hover:text-red-300 p-2 bg-slate-800 rounded-md transition-colors"
                            title="Excluir pontuação"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        );
      case 'standings':
        return <Standings players={players} scores={scores} categories={categories} stages={stages} titles={titles} />;
      case 'settings':
        return (
          <div className={cardClasses}>
            <h2 className="text-2xl font-bold mb-6">Configurações do Torneio</h2>
            <form onSubmit={handleSettingsSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Nome do Torneio</label>
                <input type="text" value={settingsName} onChange={e => setSettingsName(e.target.value)} className={inputClasses} placeholder="Ex: Open de Xadrez 2024" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Logotipo do Torneio</label>
                <div className="flex items-center gap-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                  <div className="h-20 w-20 bg-slate-800 rounded-md flex items-center justify-center border border-slate-600 overflow-hidden">
                    {settingsLogoPreview ? (
                      <img src={settingsLogoPreview} alt="Preview" className="h-full w-full object-contain" />
                    ) : (
                      <ChessKnightIcon />
                    )}
                  </div>
                  <div className="flex-1">
                    <button 
                      type="button" 
                      onClick={() => logoInputRef.current?.click()}
                      className="bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold py-2 px-4 rounded-md transition flex items-center gap-2"
                    >
                      <UploadIcon />
                      Selecionar Imagem
                    </button>
                    <p className="text-xs text-slate-500 mt-2">Formatos aceitos: PNG, JPG, SVG. Tamanho recomendado: 128x128px.</p>
                    <input 
                      type="file" 
                      ref={logoInputRef} 
                      onChange={handleLogoChange} 
                      className="hidden" 
                      accept="image/*" 
                    />
                  </div>
                  {settingsLogoPreview && (
                    <button 
                      type="button" 
                      onClick={() => setSettingsLogoPreview(null)}
                      className="text-red-400 hover:text-red-300 text-sm font-medium"
                    >
                      Remover
                    </button>
                  )}
                </div>
              </div>

              <button type="submit" disabled={isLoading} className={`${buttonClasses} w-full py-4 text-lg`}>
                Salvar Configurações
              </button>
            </form>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 pb-10">
      {isLoading && renderLoading()}
      <Header 
        currentView={currentView} setCurrentView={setCurrentView} isAuthenticated={isAuthenticated}
        onLogout={handleLogout} onImport={() => fileInputRef.current?.click()} onExport={() => {}} 
        systemName={systemName} systemLogo={systemLogo}
      />
      <main className="container mx-auto p-4 md:p-8">
        <input type="file" ref={fileInputRef} className="hidden" accept="application/json" />
        {renderView()}
      </main>
    </div>
  );
};

export default App;
