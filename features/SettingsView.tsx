
import React, { useState, useEffect } from 'react';
import { GameState, FeatureItem, BaseUpgrade, MusicTrack, MusicContext, DailyTaskConfig, TaskSuggestion } from '../types';
import { FEATURE_LIST, SYSTEM_FEATURES } from '../constants';
import { CheckCircle2, Circle, Clock, Database, Settings as SettingsIcon, ChevronDown, ChevronRight, LayoutList, Edit, Edit3, Trash2, ClipboardList, Home, Users, PenTool, GitGraph, Newspaper, AlertTriangle, CalendarRange, Download, Upload, Music, Plus, BookOpen, Layers, Cpu, Sparkles, Lightbulb, Zap, Shield, Bot, Package, Globe, Code, Key } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface SettingsViewProps {
  gameState: GameState;
  baseUpgrades?: BaseUpgrade[]; // Passed from player if available, for viewing/editing
  onEditItem?: (type: string, item: any) => void;
  onDeleteItem?: (type: string, id: string) => void;
  isEditorMode?: boolean;
  onToggleEditorMode?: () => void;
  onUpdateNewsSettings?: (settings: any) => void;
  onResetGame?: () => void;
  onExportSave?: () => void;
  onImportSave?: (file: File) => void;
  // Music
  onSaveTrack?: (track: MusicTrack) => void;
  onDeleteTrack?: (id: string) => void;
  // AI Config
  onUpdateGenerationModel?: (model: 'gemini-3-flash-preview' | 'gemini-3-pro-preview') => void;
  onUpdateDailyConfig?: (config: Partial<DailyTaskConfig>) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ 
    gameState, 
    baseUpgrades = [], 
    onEditItem, 
    onDeleteItem,
    isEditorMode,
    onToggleEditorMode,
    onUpdateNewsSettings,
    onResetGame,
    onExportSave,
    onImportSave,
    onSaveTrack,
    onDeleteTrack,
    onUpdateGenerationModel,
    onUpdateDailyConfig
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'GENERAL' | 'AUDIO' | 'DOCS' | 'DB' | 'NEWS' | 'STORY'>('GENERAL');
  const [expandedFeatures, setExpandedFeatures] = useState<Record<string, boolean>>({});
  const [confirmReset, setConfirmReset] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  
  // Custom API Key State
  const [customApiKey, setCustomApiKey] = useState(() => localStorage.getItem('sentinel_custom_api_key') || '');
  
  // Track Editing State
  const [editingTrack, setEditingTrack] = useState<Partial<MusicTrack> | null>(null);

  useEffect(() => {
      const checkKey = async () => {
          if ((window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
              const has = await (window as any).aistudio.hasSelectedApiKey();
              setHasApiKey(has);
          } else {
              // Fallback: Assume if we are running not in AI Studio, env var is handled elsewhere
              setHasApiKey(true);
          }
      };
      checkKey();
  }, []);

  const handleSelectKey = async () => {
      if ((window as any).aistudio && (window as any).aistudio.openSelectKey) {
          await (window as any).aistudio.openSelectKey();
          // Optimistically set true to handle race condition where check returns false immediately after
          setHasApiKey(true);
      } else {
          alert("API Key selection is only available in the AI Studio environment. Please use the Manual API Key field below.");
      }
  };

  const handleSaveCustomKey = () => {
      if (customApiKey.trim()) {
          localStorage.setItem('sentinel_custom_api_key', customApiKey.trim());
          alert("Custom API Key saved. It will take precedence over environment keys.");
      }
  };

  const handleClearCustomKey = () => {
      localStorage.removeItem('sentinel_custom_api_key');
      setCustomApiKey('');
      alert("Custom API Key cleared. System will default to environment key.");
  };

  const toggleFeature = (name: string) => {
      setExpandedFeatures(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleNewsSettingChange = (key: string, value: any) => {
      if (onUpdateNewsSettings) {
          onUpdateNewsSettings({
              ...gameState.newsSettings,
              [key]: value
          });
      }
  };

  const handleDailyConfigChange = (key: string, val: number) => {
      if (onUpdateDailyConfig) {
          onUpdateDailyConfig({
              [key]: val
          });
      }
  };

  const handleResetClick = () => {
      if (confirmReset && onResetGame) {
          onResetGame();
      } else {
          setConfirmReset(true);
      }
  };

  const handleSaveTrackInternal = () => {
      if (editingTrack && editingTrack.name && editingTrack.url && onSaveTrack) {
          onSaveTrack({
              id: editingTrack.id || `track-${Date.now()}`,
              name: editingTrack.name,
              author: editingTrack.author || 'Unknown',
              source: editingTrack.source || 'User Added',
              url: editingTrack.url,
              contexts: editingTrack.contexts || ['MENU']
          });
          setEditingTrack(null);
      }
  };

  const renderDbList = (title: string, items: any[], type: string, icon: React.ReactNode) => (
      <div className="bg-slate-900 p-6 rounded-lg border border-slate-800 flex flex-col max-h-[500px]">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              {icon} {title}
              <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400">{items.length} Items</span>
          </h3>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {items.map((item, idx) => (
                  <div key={item.id || idx} className="bg-slate-950 p-3 rounded border border-slate-800 flex justify-between items-center group hover:border-slate-700 transition-colors">
                      <div>
                          <div className="font-bold text-slate-300 text-sm">{item.title || item.name || item.text}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{item.id}</div>
                      </div>
                      <div className="flex gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                          {onEditItem && type !== 'SUGGESTION' && (
                              <button onClick={() => onEditItem(type, item)} className="p-1.5 hover:bg-slate-800 rounded text-blue-400">
                                  <Edit size={14} />
                              </button>
                          )}
                          {onDeleteItem && (
                              <button onClick={() => onDeleteItem(type, item.id)} className="p-1.5 hover:bg-slate-800 rounded text-red-400">
                                  <Trash2 size={14} />
                              </button>
                          )}
                      </div>
                  </div>
              ))}
              {items.length === 0 && <div className="text-center text-slate-600 text-xs italic py-4">No items found.</div>}
          </div>
      </div>
  );

  const toggleContext = (ctx: MusicContext) => {
      if (!editingTrack) return;
      const current = editingTrack.contexts || [];
      if (current.includes(ctx)) {
          setEditingTrack({ ...editingTrack, contexts: current.filter(c => c !== ctx) });
      } else {
          setEditingTrack({ ...editingTrack, contexts: [...current, ctx] });
      }
  };

  const getFeatureIcon = (key: string) => {
      const iconMap: Record<string, React.ReactNode> = {
          Shield: <Shield size={20} className="text-blue-500" />,
          Clock: <Clock size={20} className="text-slate-400" />,
          Bot: <Bot size={20} className="text-purple-500" />,
          Zap: <Zap size={20} className="text-yellow-500" />,
          Home: <Home size={20} className="text-green-500" />,
          Package: <Package size={20} className="text-amber-500" />,
          Newspaper: <Newspaper size={20} className="text-slate-300" />,
          Globe: <Globe size={20} className="text-cyan-500" />,
          BookOpen: <BookOpen size={20} className="text-pink-500" />,
          Sparkles: <Sparkles size={20} className="text-indigo-500" />,
          PenTool: <PenTool size={20} className="text-red-500" />,
      };
      return iconMap[key] || <SettingsIcon size={20} />;
  };

  return (
    <div className="flex-1 bg-slate-950 p-8 overflow-y-auto">
      <header className="mb-8 border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <SettingsIcon className="text-slate-500" /> System Settings
        </h1>
        <div className="flex gap-4 mt-4 overflow-x-auto">
            <button onClick={() => setActiveSubTab('GENERAL')} className={`pb-2 text-sm font-bold uppercase transition-colors whitespace-nowrap ${activeSubTab === 'GENERAL' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-300'}`}>General</button>
            <button onClick={() => setActiveSubTab('STORY')} className={`pb-2 text-sm font-bold uppercase transition-colors whitespace-nowrap ${activeSubTab === 'STORY' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-300'}`}>Story</button>
            <button onClick={() => setActiveSubTab('AUDIO')} className={`pb-2 text-sm font-bold uppercase transition-colors whitespace-nowrap ${activeSubTab === 'AUDIO' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-300'}`}>Audio</button>
            <button onClick={() => setActiveSubTab('NEWS')} className={`pb-2 text-sm font-bold uppercase transition-colors whitespace-nowrap ${activeSubTab === 'NEWS' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-300'}`}>News Config</button>
            <button onClick={() => setActiveSubTab('DB')} className={`pb-2 text-sm font-bold uppercase transition-colors whitespace-nowrap ${activeSubTab === 'DB' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-300'}`}>Database</button>
            <button onClick={() => setActiveSubTab('DOCS')} className={`pb-2 text-sm font-bold uppercase transition-colors whitespace-nowrap ${activeSubTab === 'DOCS' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-300'}`}>Docs</button>
        </div>
      </header>

      {activeSubTab === 'GENERAL' && (
          <div className="max-w-2xl space-y-8 animate-in fade-in">
              {/* API Key Management */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Key size={20}/> API Access</h3>
                  
                  <div className="flex items-center gap-4 mb-6">
                      <div className={`px-3 py-1 rounded text-xs font-bold border ${hasApiKey ? 'bg-green-900/30 text-green-400 border-green-900' : 'bg-red-900/30 text-red-400 border-red-900'}`}>
                          {hasApiKey ? 'ENV KEY DETECTED' : 'NO ENV KEY'}
                      </div>
                      <Button size="sm" onClick={handleSelectKey} variant="secondary">
                          {hasApiKey ? 'Change AI Studio Key' : 'Select AI Studio Key'}
                      </Button>
                  </div>

                  <div className="border-t border-slate-800 pt-4">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Manual API Key Override</label>
                      <div className="flex gap-2">
                          <input 
                              type="password" 
                              className="flex-1 bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              placeholder="Paste Google Gemini API Key..."
                              value={customApiKey}
                              onChange={(e) => setCustomApiKey(e.target.value)}
                          />
                          <Button size="sm" onClick={handleSaveCustomKey}>Save</Button>
                          {customApiKey && <Button size="sm" variant="ghost" onClick={handleClearCustomKey}>Clear</Button>}
                      </div>
                      <p className="text-[10px] text-amber-500/90 mt-3 flex items-start gap-1 bg-amber-950/20 p-2 rounded border border-amber-900/50">
                          <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
                          <span>
                              <strong>Reminder:</strong> If you are using a <strong>Free Tier</strong> key, please verify that the Generation Model below is set to <strong>Gemini 3 Flash</strong>. Pro models may hit strict rate limits on free accounts.
                          </span>
                      </p>
                  </div>
                  
                  <p className="text-[10px] text-slate-500 mt-4 border-t border-slate-800 pt-2">
                      A paid Google Cloud Project key is recommended for higher rate limits. 
                      <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline ml-1">Billing Docs</a>
                  </p>
              </div>

              {/* Save Management */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Database size={20}/> Save Management</h3>
                  <div className="flex gap-4">
                      {onExportSave && (
                          <Button onClick={onExportSave} className="flex-1 flex items-center justify-center gap-2">
                              <Download size={16} /> Export Save File
                          </Button>
                      )}
                      {onImportSave && (
                          <div className="relative flex-1">
                               <input 
                                  type="file" 
                                  accept=".json" 
                                  onChange={(e) => {
                                      if(e.target.files?.[0]) onImportSave(e.target.files[0]);
                                  }}
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                               />
                               <Button variant="secondary" className="w-full flex items-center justify-center gap-2">
                                   <Upload size={16} /> Import Save File
                               </Button>
                          </div>
                      )}
                  </div>
              </div>

              {/* AI Config */}
              {onUpdateGenerationModel && (
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Sparkles size={20}/> AI Configuration</h3>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Generation Model</label>
                      <select 
                          className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                          value={gameState.generationModel || 'gemini-3-flash-preview'}
                          onChange={(e) => onUpdateGenerationModel(e.target.value as any)}
                      >
                          <option value="gemini-3-flash-preview">Gemini 3 Flash (Fast & Efficient)</option>
                          <option value="gemini-3-pro-preview">Gemini 3 Pro (Complex Reasoning)</option>
                      </select>
                      <p className="text-xs text-slate-500 mt-2">Use Pro for better narrative quality at cost of speed. Flash is recommended for general use.</p>
                  </div>
              )}

              {/* Editor Mode */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><PenTool size={20}/> Editor Mode</h3>
                  <p className="text-slate-400 text-sm mb-4">Enable editing tools to modify tasks, items, quests, and game data on the fly. Useful for developers and storytellers.</p>
                  <label className="flex items-center gap-3 cursor-pointer">
                      <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isEditorMode ? 'bg-blue-600' : 'bg-slate-700'}`} onClick={onToggleEditorMode}>
                          <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${isEditorMode ? 'translate-x-6' : ''}`} />
                      </div>
                      <span className="font-bold text-white">{isEditorMode ? 'Enabled' : 'Disabled'}</span>
                  </label>
              </div>

              {/* Day Configuration */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><CalendarRange size={20}/> Daily Loop Config</h3>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Tasks Available / Day</label>
                          <div className="text-sm text-slate-300 mb-2">How many tasks appear on the board each morning.</div>
                          <input 
                              type="number" 
                              className="bg-slate-950 border border-slate-700 rounded p-2 text-white w-full" 
                              value={gameState.dailyConfig?.tasksAvailablePerDay || 4} 
                              onChange={(e) => handleDailyConfigChange('tasksAvailablePerDay', parseInt(e.target.value))}
                          />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Effort Limit</label>
                          <div className="text-sm text-slate-300 mb-2">Max tasks player can perform before forced rest.</div>
                          <input 
                              type="number" 
                              className="bg-slate-950 border border-slate-700 rounded p-2 text-white w-full" 
                              value={gameState.dailyConfig?.taskEffortLimit || 3} 
                              onChange={(e) => handleDailyConfigChange('taskEffortLimit', parseInt(e.target.value))}
                          />
                      </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-4 italic">These settings control the pacing of the game loop.</p>
              </div>

              {onResetGame && (
                  <div className="bg-red-900/10 border border-red-900/30 rounded-lg p-6">
                      <h3 className="text-lg font-bold text-red-500 mb-4 flex items-center gap-2"><AlertTriangle size={20}/> Danger Zone</h3>
                      <p className="text-red-400/70 text-sm mb-4">Resetting the game will wipe all current progress, characters, and generated history. This action cannot be undone.</p>
                      <Button variant="danger" onClick={handleResetClick}>
                          {confirmReset ? 'Click Again to Confirm Wipe' : 'Reset Save Data'}
                      </Button>
                  </div>
              )}
          </div>
      )}

      {activeSubTab === 'STORY' && (
          <div className="max-w-4xl space-y-6 animate-in fade-in">
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                      <BookOpen className="text-amber-500" /> Story Summary
                  </h3>
                  <p className="text-slate-400 mb-6">A chronicle of key events in your hero's journey.</p>
                  
                  <div className="space-y-4 relative border-l-2 border-slate-800 pl-8 ml-4">
                      {gameState.timeline.length === 0 && <p className="text-slate-500 italic">No events recorded yet.</p>}
                      {gameState.timeline.slice().reverse().map((event, idx) => (
                          <div key={idx} className="relative">
                              <span className={`absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 border-slate-900 ${event.type === 'MAJOR' ? 'bg-amber-500' : 'bg-slate-600'}`}></span>
                              <div className="mb-1 text-xs font-bold uppercase text-slate-500">Day {event.day}</div>
                              <p className="text-slate-200">{event.description}</p>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {activeSubTab === 'AUDIO' && (
          <div className="max-w-4xl space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2"><Music size={20} className="text-amber-500" /> Playlist Management</h3>
                  <Button size="sm" onClick={() => setEditingTrack({ name: '', author: '', url: '', contexts: ['MENU'] })}><Plus size={16} className="mr-1"/> Add Track</Button>
              </div>

              {editingTrack && (
                  <div className="bg-slate-900 border border-blue-500/50 p-6 rounded-lg mb-6 animate-in slide-in-from-top-4">
                      <h4 className="text-lg font-bold text-white mb-4">{editingTrack.id ? 'Edit Track' : 'New Track'}</h4>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                          <input className="bg-slate-950 border border-slate-700 rounded p-2 text-white" placeholder="Track Name" value={editingTrack.name} onChange={e => setEditingTrack({...editingTrack, name: e.target.value})} />
                          <input className="bg-slate-950 border border-slate-700 rounded p-2 text-white" placeholder="Author" value={editingTrack.author} onChange={e => setEditingTrack({...editingTrack, author: e.target.value})} />
                          <input className="bg-slate-950 border border-slate-700 rounded p-2 text-white col-span-2" placeholder="Source URL (MP3 or YouTube)" value={editingTrack.url} onChange={e => setEditingTrack({...editingTrack, url: e.target.value})} />
                          <input className="bg-slate-950 border border-slate-700 rounded p-2 text-white col-span-2" placeholder="Credit/Source (e.g. Incompetech)" value={editingTrack.source} onChange={e => setEditingTrack({...editingTrack, source: e.target.value})} />
                      </div>
                      
                      <div className="mb-4">
                          <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Contexts (When to play)</label>
                          <div className="flex flex-wrap gap-2">
                              {['MENU', 'ACTION', 'DOWNTIME', 'VICTORY', 'DEFEAT', 'SAD'].map((ctx) => (
                                  <button 
                                    key={ctx} 
                                    onClick={() => toggleContext(ctx as MusicContext)}
                                    className={`px-3 py-1 rounded text-xs font-bold border transition-colors ${editingTrack.contexts?.includes(ctx as MusicContext) ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                                  >
                                      {ctx}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div className="flex justify-end gap-2">
                          <Button variant="ghost" onClick={() => setEditingTrack(null)}>Cancel</Button>
                          <Button variant="primary" disabled={!editingTrack.name || !editingTrack.url} onClick={handleSaveTrackInternal}>Save Track</Button>
                      </div>
                  </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                  {gameState.music.tracks.map(track => (
                      <div key={track.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex justify-between items-center group hover:border-slate-600 transition-colors">
                          <div className="flex items-center gap-4">
                              <div className="p-2 bg-slate-950 rounded text-slate-500">
                                  <Music size={20} />
                              </div>
                              <div>
                                  <div className="font-bold text-white">{track.name}</div>
                                  <div className="text-xs text-slate-400">{track.author} • {track.source}</div>
                                  <div className="flex gap-1 mt-1">
                                      {track.contexts.map(c => (
                                          <span key={c} className="text-[10px] bg-slate-800 px-1.5 rounded text-slate-300 border border-slate-700">{c}</span>
                                      ))}
                                  </div>
                              </div>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setEditingTrack(track)} className="p-2 rounded hover:bg-slate-800 text-blue-400"><Edit3 size={16}/></button>
                              {onDeleteTrack && (
                                  <button onClick={() => onDeleteTrack(track.id)} className="p-2 rounded hover:bg-slate-800 text-red-400"><Trash2 size={16}/></button>
                              )}
                          </div>
                      </div>
                  ))}
                  {gameState.music.tracks.length === 0 && (
                      <div className="text-center p-8 border-2 border-dashed border-slate-800 rounded-lg text-slate-500">
                          No tracks added. Music system inactive.
                      </div>
                  )}
              </div>
          </div>
      )}

      {activeSubTab === 'NEWS' && (
          <div className="max-w-3xl space-y-6 animate-in fade-in">
              <div className="bg-slate-900 p-6 rounded border border-slate-800">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Newspaper size={20}/> News Generation Settings</h3>
                  
                  <div className="grid grid-cols-2 gap-6 mb-6">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Article Count</label>
                          <input 
                            type="number" 
                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                            value={gameState.newsSettings.articleCount}
                            onChange={(e) => handleNewsSettingChange('articleCount', parseInt(e.target.value))}
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">History Retention (Days)</label>
                          <input 
                            type="number" 
                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                            value={gameState.newsSettings.historyRetention}
                            onChange={(e) => handleNewsSettingChange('historyRetention', parseInt(e.target.value))}
                          />
                      </div>
                  </div>

                  <div className="mb-6">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Frequency Range (Days)</label>
                      <div className="flex gap-4 items-center">
                          <input 
                            type="number" 
                            className="w-24 bg-slate-950 border border-slate-700 rounded p-2 text-white"
                            value={gameState.newsSettings.frequencyMin}
                            onChange={(e) => handleNewsSettingChange('frequencyMin', parseInt(e.target.value))}
                          />
                          <span className="text-slate-500">to</span>
                          <input 
                            type="number" 
                            className="w-24 bg-slate-950 border border-slate-700 rounded p-2 text-white"
                            value={gameState.newsSettings.frequencyMax}
                            onChange={(e) => handleNewsSettingChange('frequencyMax', parseInt(e.target.value))}
                          />
                      </div>
                  </div>

                  <div className="mb-6">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Generation Context</label>
                      <textarea 
                          className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm h-24"
                          placeholder="Optional: Guide the next news generation (e.g. 'Focus on tech crimes')"
                          value={gameState.newsSettings.newsContextPrompt || ''}
                          onChange={(e) => handleNewsSettingChange('newsContextPrompt', e.target.value)}
                      />
                      <p className="text-[10px] text-slate-500 mt-1">This context will be passed to the AI for the next issue only.</p>
                  </div>

                  <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        id="genTasks"
                        className="rounded bg-slate-950 border-slate-700 text-blue-600"
                        checked={gameState.newsSettings.generateRelatedTasks}
                        onChange={(e) => handleNewsSettingChange('generateRelatedTasks', e.target.checked)}
                      />
                      <label htmlFor="genTasks" className="text-sm text-slate-300">Auto-generate Tasks & Quests from News</label>
                  </div>
              </div>
          </div>
      )}

      {activeSubTab === 'DOCS' && (
          <div className="max-w-5xl space-y-8 animate-in fade-in pb-10">
              <div className="text-center mb-10">
                  <h2 className="text-3xl font-black text-white tracking-tighter mb-2">OPERATOR'S MANUAL</h2>
                  <p className="text-slate-400">Comprehensive guide to system capabilities and gameplay loops.</p>
              </div>

              {/* Full Summary */}
              <div className="bg-slate-900 border border-blue-900/50 rounded-xl overflow-hidden p-6 shadow-lg">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Cpu className="text-blue-500" /> System Architecture & Power
                  </h3>
                  <p className="text-slate-300 leading-relaxed text-sm mb-4">
                      Sentinel represents a new breed of AI-native games. Instead of pre-scripted trees, the game state is fluid. The <strong>Game Engine</strong> manages hard math (resources, days, locks, economy), while the <strong>AI Engine</strong> manages soft logic (narrative outcome, creativity, roleplay, world reactivity).
                  </p>
                  <p className="text-slate-300 leading-relaxed text-sm">
                      This hybrid approach allows for infinite replayability. The "Power" of the system lies in its ability to understand context. When you attempt a task, the system doesn't just check a boolean; it reads your character sheet, checks the news, cross-references the Codex for known NPCs, and then simulates a plausible outcome based on your stats and choices.
                  </p>
              </div>

              {/* Hackathon Description */}
              <div className="bg-purple-900/10 border border-purple-500/30 rounded-xl overflow-hidden p-6 shadow-lg">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Code className="text-purple-400" /> Powered by Gemini 3 (Hackathon Overview)
                  </h3>
                  <div className="text-slate-300 text-sm leading-relaxed space-y-3">
                      <p>
                          Sentinel leverages the <strong>Google Gemini 3</strong> model family (<code>gemini-3-pro-preview</code> for complex reasoning, <code>gemini-3-flash-preview</code> for real-time speed) to act as a comprehensive Game Logic Engine. Unlike traditional games where AI is a wrapper, here it is the kernel.
                      </p>
                      <ul className="list-disc pl-5 space-y-2">
                          <li>
                              <strong>Procedural World Generation:</strong> The World Architect uses Gemini 3 Pro to synthesize cohesive lore, factions, and items from a single prompt, populating the <code>Codex</code> with relational data.
                          </li>
                          <li>
                              <strong>The AI Dungeon Master:</strong> A specialized prompt pipeline allows Gemini 3 Flash to arbitrate mechanics—parsing user intent into D20 dice rolls, managing Difficulty Classes (DC), and determining Success/Failure states—while maintaining a consistent narrative tone.
                          </li>
                          <li>
                              <strong>Context-Aware Continuity:</strong> The engine injects structured JSON snapshots of the player's inventory, active quests, and unlocked secrets into the model's context window. This enables the AI to reference specific past events and item interactions, creating a persistent world memory.
                          </li>
                          <li>
                              <strong>Dynamic Narrative Automators:</strong> The <code>News</code> and <code>Task</code> automators use Gemini to drive the plot forward, generating gameplay content that reacts to the player's identity choices (Hero vs. Vigilante).
                          </li>
                      </ul>
                      <p className="mt-2 italic text-purple-300">
                          This project demonstrates how LLMs can bridge the gap between creative storytelling and rigid game mechanics.
                      </p>
                  </div>
              </div>

              {/* Feature Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Group by category */}
                  {Array.from(new Set(SYSTEM_FEATURES.map(f => f.category))).map(category => (
                      <div key={category} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                          <div className="bg-slate-950 px-6 py-3 border-b border-slate-800">
                              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{category}</h3>
                          </div>
                          <div className="divide-y divide-slate-800/50">
                              {SYSTEM_FEATURES.filter(f => f.category === category).map(feature => (
                                  <div key={feature.title} className="p-6 flex gap-4 group hover:bg-slate-800/20 transition-colors">
                                      <div className="flex-shrink-0 p-3 bg-slate-950 rounded-lg h-fit border border-slate-800 group-hover:border-blue-500/30 transition-colors">
                                          {getFeatureIcon(feature.icon)}
                                      </div>
                                      <div>
                                          <h4 className="text-lg font-bold text-white mb-2">
                                              {feature.title}
                                              {feature.beta && <span className="ml-2 text-[10px] bg-amber-500 text-slate-900 px-1.5 py-0.5 rounded font-black align-middle">BETA</span>}
                                          </h4>
                                          <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {activeSubTab === 'DB' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in">
              {renderDbList('Tasks', gameState.taskPool, 'TASK', <ClipboardList className="text-blue-500"/>)}
              {renderDbList('Items', gameState.shopItems, 'ITEM', <LayoutList className="text-green-500"/>)}
              {renderDbList('Power Templates', gameState.powerTemplates, 'POWER', <Zap className="text-yellow-500"/>)}
              {renderDbList('Base Upgrades', baseUpgrades, 'UPGRADE', <Home className="text-purple-500"/>)}
              {renderDbList('NPCs / Factions', gameState.codex, 'CODEX', <Users className="text-pink-500"/>)}
              {renderDbList('Events', gameState.calendarEvents, 'EVENT', <Clock className="text-red-500"/>)}
              {renderDbList('Task Pools', gameState.taskPools, 'POOL', <Layers className="text-cyan-500"/>)}
              {renderDbList('Random Pools', gameState.randomEventPools, 'POOL', <Layers className="text-orange-500"/>)}
              {renderDbList('Automators', gameState.automators, 'AUTOMATOR', <Cpu className="text-lime-500"/>)}
              {renderDbList('Suggestions', gameState.taskSuggestions, 'SUGGESTION', <Lightbulb className="text-yellow-400"/>)}
          </div>
      )}
    </div>
  );
};
