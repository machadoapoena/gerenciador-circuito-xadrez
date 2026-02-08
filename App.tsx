
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Player, Stage, Score, View, Category, Title } from './types';
import Header from './components/Header';
import Standings from './components/Standings';
import Login from './components/Login';
import { supabase } from './supabase';
import { PlusIcon, TrashIcon, PencilIcon, ChessKnightIcon, AwardIcon, UploadIcon, UsersIcon, FlagIcon, TagIcon, SettingsIcon } from './components/icons';

type FormMode = 'list' | 'create' | 'edit';

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
  const [formMode, setFormMode] = useState<FormMode>('list');
  
  // Cache Tracking
  const [loadedModules, setLoadedModules] = useState<Set<string>>(new Set());

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; name: string; type: 'category' | 'title' | 'stage' | 'player' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const playerPhotoInputRef = useRef<HTMLInputElement>(null);
  const settingsLogoInputRef = useRef<HTMLInputElement>(null);

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
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [titleName, setTitleName] = useState('');
  const [editingTitle, setEditingTitle] = useState<Title | null>(null);
  
  const [selectedStageIdForScoring, setSelectedStageIdForScoring] = useState<string>('');
  const [selectedPlayerIdForScoring, setSelectedPlayerIdForScoring] = useState<string>('');
  const [singleScoreValue, setSingleScoreValue] = useState<string>('');
  const [editingScore, setEditingScore] = useState<Score | null>(null);

  // Filtering scores state
  const [scoreFilterStageId, setScoreFilterStageId] = useState<string>('');
  const [scoreFilterPlayerId, setScoreFilterPlayerId] = useState<string>('');

  // Settings Temp State
  const [tempSystemName, setTempSystemName] = useState('');
  const [tempSystemLogo, setTempSystemLogo] = useState<string | null>(null);

  // --- Core Data Loaders ---
  
  const loadInitialSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('settings').select('key, value');
      if (error) throw error;
      if (data) {
        const nameSet = data.find(s => s.key === 'systemName');
        const logoSet = data.find(s => s.key === 'systemLogo');
        if (nameSet) {
            setSystemName(nameSet.value);
            setTempSystemName(nameSet.value);
        }
        if (logoSet) {
            setSystemLogo(logoSet.value);
            setTempSystemLogo(logoSet.value);
        }
      }
    } catch (err) { console.warn("Settings não encontradas."); }
  }, []);

  const fetchData = useCallback(async (tables: string[]) => {
    const toLoad = tables.filter(t => !loadedModules.has(t));
    if (toLoad.length === 0) return;
    setIsLoading(true);
    setFetchError(null);
    try {
      const newLoaded = new Set(loadedModules);
      for (const table of toLoad) {
        let query = supabase.from(table).select('*');
        if (table === 'players') query = supabase.from('players').select('id, name, categoryId, birthDate, cbxId, fideId, email, rating, titleId').order('name');
        else if (table === 'scores') query = supabase.from('scores').select('*');
        else query = supabase.from(table).select('*').order('name');
        const { data, error } = await query;
        if (error && error.code !== '42P01') throw new Error(`Erro ao acessar ${table}: ${error.message}`);
        if (data) {
          switch (table) {
            case 'categories': setCategories(data as Category[]); break;
            case 'titles': setTitles(data as Title[]); break;
            case 'players': setPlayers(data as Player[]); break;
            case 'stages': setStages(data as Stage[]); break;
            case 'scores': setScores(data as Score[]); break;
          }
        }
        newLoaded.add(table);
      }
      setLoadedModules(newLoaded);
    } catch (err: any) { setFetchError(err.message); } finally { setIsLoading(false); }
  }, [loadedModules]);

  const fetchPlayerPhoto = async (playerId: string) => {
    try {
      const { data, error } = await supabase.from('players').select('photoUrl').eq('id', playerId).single();
      if (error) throw error;
      return data?.photoUrl || null;
    } catch (err) { return null; }
  };

  useEffect(() => { loadInitialSettings(); }, [loadInitialSettings]);

  useEffect(() => {
    fetchData(['categories', 'titles', 'players', 'stages', 'scores']);
  }, [fetchData]);

  // Reset page state on view change
  useEffect(() => {
    setFormMode('list');
    setEditingCategory(null);
    setEditingTitle(null);
    setEditingStage(null);
    setEditingPlayer(null);
    setEditingScore(null);
    setScoreFilterStageId('');
    setScoreFilterPlayerId('');
    if (currentView === 'settings') {
        setTempSystemName(systemName);
        setTempSystemLogo(systemLogo);
    }
  }, [currentView, systemName, systemLogo]);

  // --- Actions ---

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

  const confirmDelete = async () => {
    if (!deleteModal) return;
    setIsLoading(true);
    try {
      const tableMap = { category: 'categories', title: 'titles', stage: 'stages', player: 'players' };
      const table = tableMap[deleteModal.type];
      const { error } = await supabase.from(table).delete().eq('id', deleteModal.id);
      if (error) throw error;

      // Update local state
      if (deleteModal.type === 'category') setCategories(prev => prev.filter(c => c.id !== deleteModal.id));
      if (deleteModal.type === 'title') setTitles(prev => prev.filter(t => t.id !== deleteModal.id));
      if (deleteModal.type === 'stage') setStages(prev => prev.filter(s => s.id !== deleteModal.id));
      if (deleteModal.type === 'player') setPlayers(prev => prev.filter(p => p.id !== deleteModal.id));
      
      setDeleteModal(null);
    } catch (err: any) {
      alert("Erro ao excluir: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPlayerForm = () => {
    setEditingPlayer(null);
    setPlayerName('');
    setPlayerCategoryId('');
    setPlayerBirthDate('');
    setPlayerCbxId('');
    setPlayerFideId('');
    setPlayerRating('');
    setPlayerEmail('');
    setPlayerTitleId('');
    setPlayerPhoto(null);
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

  const handleSettingsLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempSystemLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const playerData = {
        name: playerName,
        categoryId: playerCategoryId || null,
        birthDate: playerBirthDate || null,
        cbxId: playerCbxId || null,
        fideId: playerFideId || null,
        email: playerEmail || null,
        rating: playerRating || null,
        titleId: playerTitleId || null,
        photoUrl: playerPhoto || null,
      };

      if (editingPlayer) {
        const { error } = await supabase.from('players').update(playerData).eq('id', editingPlayer.id);
        if (error) throw error;
        setPlayers(prev => prev.map(p => p.id === editingPlayer.id ? { ...p, ...playerData } : p));
      } else {
        const newId = crypto.randomUUID();
        const { error } = await supabase.from('players').insert({ ...playerData, id: newId });
        if (error) throw error;
        setPlayers(prev => [...prev, { ...playerData, id: newId } as Player]);
      }
      resetPlayerForm();
    } catch (err: any) {
      alert("Erro ao salvar jogador: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSingleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStageIdForScoring || !selectedPlayerIdForScoring || !singleScoreValue) {
      alert("Preencha todos os campos de pontuação.");
      return;
    }
    setIsLoading(true);
    try {
      const scoreData = {
        stageId: selectedStageIdForScoring,
        playerId: selectedPlayerIdForScoring,
        points: parseFloat(singleScoreValue)
      };

      if (editingScore) {
        const { error } = await supabase.from('scores').update(scoreData).eq('id', editingScore.id);
        if (error) throw error;
        setScores(prev => prev.map(s => s.id === editingScore.id ? { ...s, ...scoreData } : s));
        setEditingScore(null);
      } else {
        const newId = crypto.randomUUID();
        const { error } = await supabase.from('scores').insert({ ...scoreData, id: newId });
        if (error) throw error;
        setScores(prev => [...prev, { ...scoreData, id: newId } as Score]);
      }
      setSingleScoreValue('');
      setSelectedPlayerIdForScoring('');
    } catch (err: any) {
      alert("Erro ao salvar pontuação: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const updates = [
        { key: 'systemName', value: tempSystemName },
        { key: 'systemLogo', value: tempSystemLogo }
      ];
      
      const { error } = await supabase.from('settings').upsert(updates, { onConflict: 'key' });
      if (error) throw error;

      setSystemName(tempSystemName);
      setSystemLogo(tempSystemLogo);
      alert("Configurações salvas com sucesso!");
    } catch (err: any) {
      alert("Erro ao salvar configurações: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const performDeleteScore = async (scoreId: string | number) => {
    if (!confirm("Excluir esta pontuação?")) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.from('scores').delete().eq('id', scoreId);
      if (error) throw error;
      setScores(prev => prev.filter(s => s.id !== scoreId));
    } catch (err: any) {
      alert("Erro ao excluir pontuação: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditScore = (score: Score) => {
    setEditingScore(score);
    setSelectedStageIdForScoring(String(score.stageId));
    setSelectedPlayerIdForScoring(String(score.playerId));
    setSingleScoreValue(String(score.points));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditScore = () => {
    setEditingScore(null);
    setSelectedStageIdForScoring('');
    setSelectedPlayerIdForScoring('');
    setSingleScoreValue('');
  };

  // --- Sub-View Renderers ---

  const renderSectionHeader = (title: string, icon: React.ReactNode) => (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">{icon}</div>
        <h2 className="text-2xl font-bold text-white">{title}</h2>
      </div>
      {formMode === 'list' && (
        <button 
          onClick={() => setFormMode('create')}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-lg shadow-indigo-500/20"
        >
          <PlusIcon /> Novo
        </button>
      )}
    </div>
  );

  const renderTable = (headers: string[], rows: any[], onEdit: (item: any) => void, onDelete: (item: any) => void) => (
    <div className="bg-slate-800 rounded-xl shadow-xl overflow-hidden border border-slate-700">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-900/50 border-b border-slate-700">
            <tr>
              {headers.map(h => <th key={h} className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">{h}</th>)}
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {rows.length === 0 ? (
              <tr><td colSpan={headers.length + 1} className="p-10 text-center text-slate-500 italic">Nenhum registro encontrado.</td></tr>
            ) : (
              rows.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-700/30 transition-colors">
                  {Object.keys(item).filter(k => k !== 'id' && k !== 'url').map(key => (
                    <td key={key} className="p-4 text-slate-300 font-medium">
                      {key === 'name' && item.url ? (
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">{item[key]}</a>
                      ) : (item[key] || '—')}
                    </td>
                  ))}
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => onEdit(item)} className="p-2 text-sky-400 hover:bg-sky-400/10 rounded-lg transition-colors" title="Alterar">
                        <PencilIcon />
                      </button>
                      <button onClick={() => onDelete(item)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Excluir">
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDeleteModal = () => {
    if (!deleteModal) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setDeleteModal(null)}></div>
        <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-md w-full relative animate-in zoom-in-95 duration-200">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrashIcon />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Confirmar Exclusão</h3>
            <p className="text-slate-400 text-sm mb-6">
              Você está prestes a excluir <strong>{deleteModal.name}</strong>.<br/>
              Esta ação não pode ser desfeita.
            </p>
            
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 mb-6 text-left">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter block mb-1">ID Supabase</span>
              <code className="text-xs text-indigo-300 break-all">{deleteModal.id}</code>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteModal(null)} 
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-500/20 transition"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderError = () => (
    <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-xl text-center max-w-lg mx-auto">
      <h3 className="text-red-400 font-bold mb-2">Ops! Algo deu errado.</h3>
      <p className="text-red-300 text-sm">{fetchError}</p>
      <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-colors">Tentar Novamente</button>
    </div>
  );

  const renderView = () => {
    const isPrivate = !['standings', 'login'].includes(currentView);
    if (isPrivate && !isAuthenticated) return <Login onLogin={handleLogin} />;
    
    const cardClasses = "bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700 animate-in fade-in duration-500";
    const inputClasses = "w-full bg-slate-900 border border-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-slate-100 placeholder:text-slate-600 outline-none";
    const labelClasses = "block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2";
    const buttonClasses = "bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50";

    switch (currentView) {
      case 'standings': return <Standings players={players} scores={scores} categories={categories} stages={stages} titles={titles} onFetchPhoto={fetchPlayerPhoto} />;
      case 'login': return <Login onLogin={handleLogin} />;
      
      case 'categories':
        if (formMode === 'list') return (
          <div className="max-w-4xl mx-auto">
            {renderSectionHeader('Categorias', <TagIcon />)}
            {renderTable(['Nome'], categories.map(c => ({ id: c.id, name: c.name })), 
              (item) => { setEditingCategory(item); setCategoryName(item.name); setFormMode('edit'); },
              (item) => setDeleteModal({ isOpen: true, id: item.id, name: item.name, type: 'category' })
            )}
          </div>
        );
        return (
          <div className="max-w-lg mx-auto">
            <div className={cardClasses}>
              <h2 className="text-2xl font-bold mb-6 text-white">{editingCategory ? 'Editar' : 'Nova'} Categoria</h2>
              <form onSubmit={async (e) => {
                e.preventDefault();
                setIsLoading(true);
                try {
                  if (editingCategory) {
                    await supabase.from('categories').update({ name: categoryName }).eq('id', editingCategory.id);
                    setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, name: categoryName } : c));
                  } else {
                    const newId = crypto.randomUUID();
                    const { data } = await supabase.from('categories').insert({ id: newId, name: categoryName }).select().single();
                    if (data) setCategories(prev => [...prev, data]);
                  }
                  setFormMode('list'); setCategoryName(''); setEditingCategory(null);
                } catch (err: any) { alert(err.message); } finally { setIsLoading(false); }
              }}>
                <div className="mb-6">
                  <label className={labelClasses}>Nome da Categoria</label>
                  <input type="text" placeholder="Ex: Sub-12, Aberto, Master" value={categoryName} onChange={e => setCategoryName(e.target.value)} className={inputClasses} required />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setFormMode('list')} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl">Cancelar</button>
                  <button type="submit" disabled={isLoading} className={`flex-1 ${buttonClasses}`}>Salvar</button>
                </div>
              </form>
            </div>
          </div>
        );

      case 'titles':
        if (formMode === 'list') return (
          <div className="max-w-4xl mx-auto">
            {renderSectionHeader('Titulações', <AwardIcon />)}
            {renderTable(['Título'], titles.map(t => ({ id: t.id, name: t.name })), 
              (item) => { setEditingTitle(item); setTitleName(item.name); setFormMode('edit'); },
              (item) => setDeleteModal({ isOpen: true, id: item.id, name: item.name, type: 'title' })
            )}
          </div>
        );
        return (
          <div className="max-w-lg mx-auto">
            <div className={cardClasses}>
              <h2 className="text-2xl font-bold mb-6 text-white">{editingTitle ? 'Editar' : 'Nova'} Titulação</h2>
              <form onSubmit={async (e) => {
                e.preventDefault();
                setIsLoading(true);
                try {
                  if (editingTitle) {
                    await supabase.from('titles').update({ name: titleName }).eq('id', editingTitle.id);
                    setTitles(prev => prev.map(t => t.id === editingTitle.id ? { ...t, name: titleName } : t));
                  } else {
                    const newId = crypto.randomUUID();
                    const { data } = await supabase.from('titles').insert({ id: newId, name: titleName }).select().single();
                    if (data) setTitles(prev => [...prev, data]);
                  }
                  setFormMode('list'); setTitleName(''); setEditingTitle(null);
                } catch (err: any) { alert(err.message); } finally { setIsLoading(false); }
              }}>
                <div className="mb-6">
                  <label className={labelClasses}>Abreviatura</label>
                  <input type="text" placeholder="Ex: GM, WCM, MF" value={titleName} onChange={e => setTitleName(e.target.value)} className={inputClasses} required />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setFormMode('list')} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl">Cancelar</button>
                  <button type="submit" disabled={isLoading} className={`flex-1 ${buttonClasses}`}>Salvar</button>
                </div>
              </form>
            </div>
          </div>
        );

      case 'stages':
        if (formMode === 'list') return (
          <div className="max-w-5xl mx-auto">
            {renderSectionHeader('Etapas do Torneio', <FlagIcon />)}
            {renderTable(['Nome', 'URL'], stages.map(s => ({ id: s.id, name: s.name, url: s.url })), 
              (item) => { setEditingStage(item); setStageName(item.name); setStageUrl(item.url || ''); setFormMode('edit'); },
              (item) => setDeleteModal({ isOpen: true, id: item.id, name: item.name, type: 'stage' })
            )}
          </div>
        );
        return (
          <div className="max-w-2xl mx-auto">
            <div className={cardClasses}>
              <h2 className="text-2xl font-bold mb-6 text-white">{editingStage ? 'Editar' : 'Nova'} Etapa</h2>
              <form onSubmit={async (e) => {
                e.preventDefault();
                setIsLoading(true);
                try {
                  const dataObj = { name: stageName, url: stageUrl || null };
                  if (editingStage) {
                    await supabase.from('stages').update(dataObj).eq('id', editingStage.id);
                    setStages(prev => prev.map(s => s.id === editingStage.id ? { ...s, ...dataObj } : s));
                  } else {
                    const newId = crypto.randomUUID();
                    const { data } = await supabase.from('stages').insert({ ...dataObj, id: newId }).select().single();
                    if (data) setStages(prev => [...prev, data]);
                  }
                  setFormMode('list'); setStageName(''); setStageUrl(''); setEditingStage(null);
                } catch (err: any) { alert(err.message); } finally { setIsLoading(false); }
              }}>
                <div className="space-y-4 mb-8">
                  <div>
                    <label className={labelClasses}>Nome da Etapa *</label>
                    <input type="text" placeholder="Ex: 1ª Etapa - Maringá" value={stageName} onChange={e => setStageName(e.target.value)} className={inputClasses} required />
                  </div>
                  <div>
                    <label className={labelClasses}>Link da Etapa (Chess-Results / Outros)</label>
                    <input type="url" placeholder="https://..." value={stageUrl} onChange={e => setStageUrl(e.target.value)} className={inputClasses} />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setFormMode('list')} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl">Cancelar</button>
                  <button type="submit" disabled={isLoading} className={`flex-1 ${buttonClasses}`}>Salvar Etapa</button>
                </div>
              </form>
            </div>
          </div>
        );

      case 'players':
        return (
          <div className="grid lg:grid-cols-2 gap-8">
            <form onSubmit={handlePlayerSubmit} className={cardClasses}>
              <h2 className="text-2xl font-bold mb-6 text-white">{editingPlayer ? 'Editar' : 'Cadastrar'} Atleta</h2>
              <div className="flex flex-col items-center mb-6">
                <div 
                  className="w-24 h-24 rounded-full bg-slate-900 border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden cursor-pointer hover:border-indigo-500 transition-colors" 
                  onClick={() => playerPhotoInputRef.current?.click()}
                >
                  {playerPhoto ? <img src={playerPhoto} className="w-full h-full object-cover" /> : <UsersIcon />}
                </div>
                <button type="button" onClick={() => playerPhotoInputRef.current?.click()} className="mt-2 text-xs text-indigo-400 font-medium hover:underline">
                  {playerPhoto ? 'Alterar Foto' : 'Adicionar Foto'}
                </button>
                <input type="file" ref={playerPhotoInputRef} onChange={handlePlayerPhotoChange} className="hidden" accept="image/*" />
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelClasses}>Nome Completo *</label>
                  <input type="text" placeholder="Magnus Carlsen" value={playerName} onChange={e => setPlayerName(e.target.value)} className={inputClasses} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClasses}>Categoria</label>
                    <select value={playerCategoryId} onChange={e => setPlayerCategoryId(e.target.value)} className={inputClasses}>
                      <option value="">Nenhuma</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClasses}>Titulação</label>
                    <select value={playerTitleId} onChange={e => setPlayerTitleId(e.target.value)} className={inputClasses}>
                      <option value="">Nenhuma</option>
                      {titles.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={labelClasses}>ID CBX</label><input type="text" value={playerCbxId} onChange={e => setPlayerCbxId(e.target.value)} className={inputClasses} /></div>
                  <div><label className={labelClasses}>ID FIDE</label><input type="text" value={playerFideId} onChange={e => setPlayerFideId(e.target.value)} className={inputClasses} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={labelClasses}>Nascimento</label><input type="date" value={playerBirthDate} onChange={e => setPlayerBirthDate(e.target.value)} className={inputClasses} /></div>
                  <div><label className={labelClasses}>Rating Elo</label><input type="number" value={playerRating} onChange={e => setPlayerRating(e.target.value)} className={inputClasses} /></div>
                </div>
                <div><label className={labelClasses}>E-mail</label><input type="email" value={playerEmail} onChange={e => setPlayerEmail(e.target.value)} className={inputClasses} /></div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" disabled={isLoading} className={`flex-1 ${buttonClasses}`}>{editingPlayer ? 'Salvar' : 'Cadastrar'}</button>
                  {editingPlayer && <button type="button" onClick={resetPlayerForm} className="bg-slate-700 text-white font-bold py-3 px-6 rounded-xl transition">Cancelar</button>}
                </div>
              </div>
            </form>

            <div className={cardClasses}>
              <h2 className="text-2xl font-bold mb-6 text-white flex items-center justify-between">
                Atletas ({players.length})
                <UsersIcon />
              </h2>
              <div className="max-h-[650px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {players.map(p => (
                  <div key={p.id} className="flex justify-between items-center p-4 bg-slate-900/50 rounded-xl border border-slate-700 hover:border-indigo-500 transition-all group">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-100">{getTitleName(p.titleId) && <span className="text-amber-400 mr-1">{getTitleName(p.titleId)}</span>}{p.name}</span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={async () => { setIsLoading(true); const photo = await fetchPlayerPhoto(p.id); setEditingPlayer(p); setPlayerName(p.name); setPlayerCategoryId(p.categoryId || ''); setPlayerBirthDate(p.birthDate || ''); setPlayerCbxId(p.cbxId || ''); setPlayerFideId(p.fideId || ''); setPlayerRating(p.rating || ''); setPlayerEmail(p.email || ''); setPlayerTitleId(p.titleId || ''); setPlayerPhoto(photo); setIsLoading(false); }} className="p-2 text-sky-400 hover:bg-sky-400/10 rounded-lg"><PencilIcon /></button>
                      <button onClick={() => setDeleteModal({ isOpen: true, id: p.id, name: p.name, type: 'player' })} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg"><TrashIcon /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'scores':
        const filteredScoresForList = scores.filter(s => {
          const matchesStage = scoreFilterStageId ? String(s.stageId) === scoreFilterStageId : true;
          const matchesPlayer = scoreFilterPlayerId ? String(s.playerId) === scoreFilterPlayerId : true;
          return matchesStage && matchesPlayer;
        });

        // Ordenação por pontos decrescente solicitada pelo usuário
        const sortedScoresForList = [...filteredScoresForList].sort((a, b) => b.points - a.points);

        return (
          <div className="grid md:grid-cols-2 gap-8">
            <form onSubmit={handleSingleScoreSubmit} className={cardClasses}>
              <h2 className="text-2xl font-bold mb-6 text-white">{editingScore ? 'Editar Pontos' : 'Lançar Pontos'}</h2>
              <div className="space-y-4">
                <div><label className={labelClasses}>Etapa</label><select value={selectedStageIdForScoring} onChange={e => setSelectedStageIdForScoring(e.target.value)} className={inputClasses}><option value="">Selecione Etapa</option>{stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                <div><label className={labelClasses}>Jogador</label><select value={selectedPlayerIdForScoring} onChange={e => setSelectedPlayerIdForScoring(e.target.value)} className={inputClasses}><option value="">Selecione Jogador</option>{players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                <div><label className={labelClasses}>Pontuação</label><input type="number" step="0.5" placeholder="0.0" value={singleScoreValue} onChange={e => setSingleScoreValue(e.target.value)} className={inputClasses} /></div>
                <div className="flex gap-2">
                    <button type="submit" disabled={isLoading} className={`flex-1 ${buttonClasses}`}>{editingScore ? 'Atualizar Pontuação' : 'Salvar Pontuação'}</button>
                    {editingScore && (
                        <button type="button" onClick={cancelEditScore} className="bg-slate-700 text-white font-bold py-3 px-6 rounded-xl transition">Cancelar</button>
                    )}
                </div>
              </div>
            </form>
            <div className={cardClasses}>
                <h2 className="text-2xl font-bold mb-4 text-white">Listagem de Pontuações</h2>
                
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-2 mb-6">
                  <select 
                    value={scoreFilterStageId} 
                    onChange={e => setScoreFilterStageId(e.target.value)} 
                    className={`${inputClasses} text-xs py-2`}
                  >
                    <option value="">Todas as Etapas</option>
                    {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <select 
                    value={scoreFilterPlayerId} 
                    onChange={e => setScoreFilterPlayerId(e.target.value)} 
                    className={`${inputClasses} text-xs py-2`}
                  >
                    <option value="">Todos os Jogadores</option>
                    {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                  {sortedScoresForList.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 italic">Nenhuma pontuação encontrada com esses filtros.</div>
                  ) : (
                    sortedScoresForList.slice(0, 50).map(s => {
                      const p = players.find(player => String(player.id) === String(s.playerId));
                      const title = p ? getTitleName(p.titleId) : '';
                      return (
                        <div key={s.id} className="flex justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-700 hover:border-indigo-500/50 transition-all group">
                          <div>
                            <div className="font-bold text-slate-100">
                              {title && <span className="text-amber-400 mr-1">{title}</span>}
                              {p ? p.name : '...'}
                            </div>
                            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{getSName(s.stageId)}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-indigo-400 font-bold text-xl mr-2">{s.points}</span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => startEditScore(s as Score)} className="p-2 text-sky-400 hover:bg-sky-400/10 rounded-lg" title="Alterar">
                                <PencilIcon />
                              </button>
                              <button onClick={() => performDeleteScore(s.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg" title="Excluir">
                                <TrashIcon />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
            </div>
          </div>
        );

      case 'settings':
        return (
            <div className="max-w-2xl mx-auto">
                <div className={cardClasses}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400"><SettingsIcon /></div>
                        <h2 className="text-2xl font-bold text-white">Configurações do Sistema</h2>
                    </div>

                    <form onSubmit={handleSettingsSave} className="space-y-6">
                        <div>
                            <label className={labelClasses}>Nome do Torneio / Organização</label>
                            <input 
                                type="text" 
                                value={tempSystemName} 
                                onChange={e => setTempSystemName(e.target.value)} 
                                className={inputClasses} 
                                placeholder="Ex: IV Circuito Regional de Xadrez"
                                required 
                            />
                        </div>

                        <div>
                            <label className={labelClasses}>Logotipo do Torneio</label>
                            <div className="flex items-center gap-6">
                                <div className="w-24 h-24 bg-slate-900 rounded-xl border-2 border-slate-700 border-dashed flex items-center justify-center overflow-hidden">
                                    {tempSystemLogo ? (
                                        <img src={tempSystemLogo} className="w-full h-full object-contain" alt="Preview Logo" />
                                    ) : (
                                        <ChessKnightIcon />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <button 
                                        type="button" 
                                        onClick={() => settingsLogoInputRef.current?.click()}
                                        className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all"
                                    >
                                        <UploadIcon /> Carregar Nova Imagem
                                    </button>
                                    <p className="mt-2 text-xs text-slate-500">Recomendado: PNG ou SVG transparente.</p>
                                    <input 
                                        type="file" 
                                        ref={settingsLogoInputRef} 
                                        onChange={handleSettingsLogoChange} 
                                        className="hidden" 
                                        accept="image/*" 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-700">
                            <button 
                                type="submit" 
                                disabled={isLoading} 
                                className={`w-full ${buttonClasses}`}
                            >
                                Salvar Alterações
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );

      default: return <Standings players={players} scores={scores} categories={categories} stages={stages} titles={titles} onFetchPhoto={fetchPlayerPhoto} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 pb-20 text-slate-200">
      {isLoading && (
        <div className="fixed top-0 left-0 w-full h-1.5 bg-indigo-500/10 overflow-hidden z-[200]">
          <div className="w-1/3 h-full bg-indigo-500 animate-[loading_1.5s_infinite_linear] shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
        </div>
      )}
      <Header currentView={currentView} setCurrentView={setCurrentView} isAuthenticated={isAuthenticated} onLogout={handleLogout} onImport={() => {}} onExport={() => {}} systemName={systemName} systemLogo={systemLogo} />
      <main className="container mx-auto p-4 md:p-8">
        {fetchError ? renderError() : renderView()}
      </main>
      {renderDeleteModal()}
      <style>{`
        @keyframes loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
        select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23475569'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 1rem center; background-size: 1.25rem; }
      `}</style>
    </div>
  );
};

export default App;
