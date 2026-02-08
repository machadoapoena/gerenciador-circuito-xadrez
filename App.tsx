
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Player, Stage, Score, View, Category, Title } from './types';
import Header from './components/Header';
import Standings from './components/Standings';
import Login from './components/Login';
import { supabase } from './supabase';
import { PlusIcon, TrashIcon, PencilIcon, ChessKnightIcon, AwardIcon, UploadIcon, UsersIcon } from './components/icons';

const App: React.FC = () => {
  // Data States
  const [categories, setCategories] = useState<Category[]>([]);
  const [titles, setTitles] = useState<Title[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [systemName, setSystemName] = useState('Torneio de Xadrez');
  const [systemLogo, setSystemLogo] = useState<string | null>(null);

  // Status States
  const [currentView, setCurrentView] = useState<View>('standings');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // Cache Tracking
  const [loadedModules, setLoadedModules] = useState<Set<string>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const playerPhotoInputRef = useRef<HTMLInputElement>(null);

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

  // --- Core Data Loaders ---
  
  const loadInitialSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('settings').select('key, value');
      if (error) throw error;
      if (data) {
        const nameSet = data.find(s => s.key === 'systemName');
        const logoSet = data.find(s => s.key === 'systemLogo');
        if (nameSet) { setSystemName(nameSet.value); setSettingsName(nameSet.value); }
        if (logoSet) { setSystemLogo(logoSet.value); setSettingsLogoPreview(logoSet.value); }
      }
    } catch (err) {
      console.warn("Settings não carregadas.");
    }
  }, []);

  const fetchData = useCallback(async (tables: string[]) => {
    const toLoad = tables.filter(t => !loadedModules.has(t));
    if (toLoad.length === 0) return;

    setIsLoading(true);
    setFetchError(null);

    try {
      const promises = toLoad.map(table => {
        let query = supabase.from(table).select('*');
        
        // OTIMIZAÇÃO CRÍTICA: Excluir a coluna pesada de foto no carregamento em massa
        if (table === 'players') {
          query = supabase.from('players').select('id, name, categoryId, birthDate, cbxId, fideId, email, rating, titleId').limit(1000);
        } else if (table === 'scores') {
          query = supabase.from('scores').select('*').limit(5000);
        }

        return query.then(res => ({ table, ...res }));
      });

      const results = await Promise.all(promises);
      const newLoaded = new Set(loadedModules);
      
      results.forEach(res => {
        if (res.error) throw new Error(`Erro na tabela ${res.table}: ${res.error.message}`);
        
        switch (res.table) {
          case 'categories': setCategories(res.data as Category[]); break;
          case 'titles': setTitles(res.data as Title[]); break;
          case 'players': setPlayers(res.data as Player[]); break;
          case 'stages': setStages(res.data as Stage[]); break;
          case 'scores': setScores(res.data as Score[]); break;
        }
        newLoaded.add(res.table);
      });

      setLoadedModules(newLoaded);
    } catch (err: any) {
      console.error("Supabase Fetch Error:", err);
      setFetchError(err.message || "Erro inesperado ao conectar ao banco.");
    } finally {
      setIsLoading(false);
    }
  }, [loadedModules]);

  // Busca a foto de um jogador específico apenas quando necessário (ex: Edição ou Top 10)
  const fetchPlayerPhoto = async (playerId: string) => {
    try {
      const { data, error } = await supabase.from('players').select('photoUrl').eq('id', playerId).single();
      if (error) throw error;
      return data?.photoUrl || null;
    } catch (err) {
      console.error("Erro ao buscar foto individual:", err);
      return null;
    }
  };

  useEffect(() => { loadInitialSettings(); }, [loadInitialSettings]);

  useEffect(() => {
    switch (currentView) {
      case 'standings': fetchData(['players', 'scores', 'stages', 'categories', 'titles']); break;
      case 'players': fetchData(['players', 'categories', 'titles']); break;
      case 'categories': fetchData(['categories']); break;
      case 'titles': fetchData(['titles']); break;
      case 'stages': fetchData(['stages']); break;
      case 'scores': fetchData(['scores', 'players', 'stages']); break;
    }
  }, [currentView, fetchData]);

  // --- Handlers ---
  const handleLogin = (user: string, pass: string) => {
    if (user === 'admin' && pass === 'a120780') {
      setIsAuthenticated(true);
      setCurrentView('players');
    } else { alert('Usuário ou senha inválidos.'); }
  };

  const handleLogout = () => { setIsAuthenticated(false); setCurrentView('standings'); };
  
  const getPName = (id: string) => players.find(p => String(p.id) === String(id))?.name || '...';
  const getSName = (id: string) => stages.find(s => String(s.id) === String(id))?.name || '...';
  const getTitleName = (id?: string) => titles.find(t => String(t.id) === String(id))?.name || '';

  const handlePlayerPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPlayerPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName) return;
    setIsLoading(true);
    try {
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
      if (editingPlayer) {
        const { error } = await supabase.from('players').update(playerData).eq('id', editingPlayer.id);
        if (error) throw error;
        setPlayers(prev => prev.map(p => p.id === editingPlayer.id ? { ...p, ...playerData } : p));
        setEditingPlayer(null);
      } else {
        playerData.id = crypto.randomUUID();
        const { data, error } = await supabase.from('players').insert(playerData).select('id, name, categoryId, rating, titleId').single();
        if (error) throw error;
        if (data) setPlayers(prev => [...prev, data as Player]);
      }
      resetPlayerForm();
    } catch (err: any) { alert('Erro: ' + err.message); } finally { setIsLoading(false); }
  };

  const resetPlayerForm = () => {
    setPlayerName(''); setPlayerCategoryId(''); setPlayerBirthDate('');
    setPlayerCbxId(''); setPlayerFideId(''); setPlayerRating('');
    setPlayerEmail(''); setPlayerTitleId(''); setPlayerPhoto(null); setEditingPlayer(null);
  };

  const performDeleteScore = async (scoreId: string | number) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from('scores').delete().eq('id', scoreId);
      if (error) throw error;
      setScores(prev => prev.filter(s => String(s.id) !== String(scoreId)));
      return true;
    } catch (err: any) { alert('Erro: ' + err.message); return false; } finally { setIsLoading(false); }
  };

  const handleSingleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStageIdForScoring || !selectedPlayerIdForScoring) return;
    const points = parseFloat(singleScoreValue);
    setIsLoading(true);
    try {
      const existing = scores.find(s => String(s.playerId) === String(selectedPlayerIdForScoring) && String(s.stageId) === String(selectedStageIdForScoring));
      if (isNaN(points)) {
        if (existing && confirm('Excluir pontuação?')) await performDeleteScore(existing.id);
      } else if (existing) {
        const { error } = await supabase.from('scores').update({ points }).eq('id', existing.id);
        if (error) throw error;
        setScores(prev => prev.map(s => String(s.id) === String(existing.id) ? { ...s, points } : s));
      } else {
        const scoreData = { id: crypto.randomUUID(), playerId: selectedPlayerIdForScoring, stageId: selectedStageIdForScoring, points };
        const { data, error } = await supabase.from('scores').insert(scoreData).select().single();
        if (error) throw error;
        if (data) setScores(prev => [...prev, data]);
      }
      setSelectedPlayerIdForScoring(''); setSingleScoreValue('');
    } catch (err: any) { alert('Erro: ' + err.message); } finally { setIsLoading(false); }
  };

  const renderError = () => (
    <div className="container mx-auto p-8 flex items-center justify-center min-h-[60vh]">
      <div className="bg-slate-800 p-10 rounded-2xl shadow-2xl border border-red-500/20 max-w-lg w-full text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6"><TrashIcon /></div>
        <h2 className="text-3xl font-bold text-white mb-4">Timeout de Carregamento</h2>
        <p className="text-slate-400 mb-2">As fotos dos jogadores são pesadas e causaram um atraso no banco de dados.</p>
        <div className="bg-slate-900/50 p-3 rounded text-red-400 font-mono text-xs mb-8 text-left break-words">{fetchError}</div>
        <button onClick={() => window.location.reload()} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg transition-all">Tentar com Otimização</button>
      </div>
    </div>
  );

  const renderView = () => {
    const isPrivate = !['standings', 'login'].includes(currentView);
    if (isPrivate && !isAuthenticated) return <Login onLogin={handleLogin} />;
    
    const cardClasses = "bg-slate-800 p-6 rounded-lg shadow-xl mb-8";
    const inputClasses = "w-full bg-slate-800 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 transition text-slate-100";
    const buttonClasses = "bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-md transition disabled:opacity-50";

    switch (currentView) {
      case 'standings': return <Standings players={players} scores={scores} categories={categories} stages={stages} titles={titles} onFetchPhoto={fetchPlayerPhoto} />;
      case 'login': return <Login onLogin={handleLogin} />;
      case 'players':
        return (
          <div className="grid lg:grid-cols-2 gap-8">
            <form onSubmit={handlePlayerSubmit} className={cardClasses}>
              <h2 className="text-2xl font-bold mb-6">{editingPlayer ? 'Editar' : 'Cadastrar'} Jogador</h2>
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 rounded-full bg-slate-700 border-2 border-dashed border-slate-500 flex items-center justify-center overflow-hidden cursor-pointer" onClick={() => playerPhotoInputRef.current?.click()}>
                  {playerPhoto ? <img src={playerPhoto} className="w-full h-full object-cover" /> : <UsersIcon />}
                </div>
                <input type="file" ref={playerPhotoInputRef} onChange={handlePlayerPhotoChange} className="hidden" accept="image/*" />
              </div>
              <div className="space-y-4">
                <input type="text" placeholder="Nome Completo" value={playerName} onChange={e => setPlayerName(e.target.value)} className={inputClasses} required />
                <div className="grid grid-cols-2 gap-4">
                  <select value={playerCategoryId} onChange={e => setPlayerCategoryId(e.target.value)} className={inputClasses}>
                    <option value="">Categoria...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <select value={playerTitleId} onChange={e => setPlayerTitleId(e.target.value)} className={inputClasses}>
                    <option value="">Título...</option>
                    {titles.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <button type="submit" disabled={isLoading} className={`${buttonClasses} w-full`}>{editingPlayer ? 'Salvar' : 'Cadastrar'}</button>
              </div>
            </form>
            <div className={cardClasses}>
              <h2 className="text-2xl font-bold mb-4">Jogadores ({players.length})</h2>
              <div className="max-h-[500px] overflow-y-auto pr-2">
                {players.map(p => (
                  <div key={p.id} className="flex justify-between items-center p-3 bg-slate-700/50 rounded-md mb-2 border-l-2 border-indigo-500 group">
                    <span className="text-sm font-medium">{p.name}</span>
                    <div className="flex gap-2">
                      <button onClick={async () => { 
                        setIsLoading(true);
                        const photo = await fetchPlayerPhoto(p.id);
                        setEditingPlayer(p); 
                        setPlayerName(p.name); 
                        setPlayerCategoryId(p.categoryId || ''); 
                        setPlayerPhoto(photo); 
                        setIsLoading(false);
                      }} className="text-indigo-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"><PencilIcon /></button>
                      <button onClick={async () => { if(confirm('Excluir?')) { await supabase.from('players').delete().eq('id', p.id); setPlayers(prev => prev.filter(x => x.id !== p.id)); }}} className="text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"><TrashIcon /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'scores':
        return (
          <div className="grid md:grid-cols-2 gap-8">
            <form onSubmit={handleSingleScoreSubmit} className={cardClasses}>
              <h2 className="text-2xl font-bold mb-4">Lançar Pontos</h2>
              <div className="space-y-4">
                <select value={selectedStageIdForScoring} onChange={e => setSelectedStageIdForScoring(e.target.value)} className={inputClasses}>
                  <option value="">Selecione Etapa</option>
                  {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select value={selectedPlayerIdForScoring} onChange={e => setSelectedPlayerIdForScoring(e.target.value)} className={inputClasses}>
                  <option value="">Selecione Jogador</option>
                  {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input type="number" step="0.5" placeholder="Pontos" value={singleScoreValue} onChange={e => setSingleScoreValue(e.target.value)} className={inputClasses} />
                <button type="submit" disabled={isLoading} className={`${buttonClasses} w-full`}>Salvar</button>
              </div>
            </form>
            <div className={cardClasses}>
                <h2 className="text-2xl font-bold mb-4">Últimos Lançamentos</h2>
                <div className="max-h-[500px] overflow-y-auto pr-2">
                    {scores.slice().reverse().slice(0, 20).map(s => (
                        <div key={s.id} className="flex justify-between p-3 bg-slate-700/50 rounded mb-2 text-xs">
                            <div className="flex flex-col">
                                <span className="font-bold">{getPName(s.playerId)}</span>
                                <span className="text-slate-400">{getSName(s.stageId)}</span>
                            </div>
                            <span className="text-indigo-400 font-bold">{s.points} pts</span>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        );
      default: return <div className="p-8 text-center text-slate-500 italic">Módulo em desenvolvimento.</div>
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 pb-10">
      {isLoading && <div className="fixed top-0 left-0 w-full h-1 bg-indigo-500/20 overflow-hidden z-[100]"><div className="w-1/3 h-full bg-indigo-500 animate-[loading_1.5s_infinite_linear]"></div></div>}
      <Header currentView={currentView} setCurrentView={setCurrentView} isAuthenticated={isAuthenticated} onLogout={handleLogout} onImport={() => {}} onExport={() => {}} systemName={systemName} systemLogo={systemLogo} />
      <main className="container mx-auto p-4 md:p-8">{fetchError ? renderError() : renderView()}</main>
      <style>{`@keyframes loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }`}</style>
    </div>
  );
};

export default App;
