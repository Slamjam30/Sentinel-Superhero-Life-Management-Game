
import React, { useState, useEffect } from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import { CharacterSheet } from './features/CharacterSheet';
import { DayManager } from './features/DayManager';
import { ScenarioPlayer } from './features/ScenarioPlayer';
import { InventoryShop } from './features/InventoryShop';
import { CalendarView } from './features/CalendarView';
import { SettingsView } from './features/SettingsView';
import { QuestsCodexView } from './features/QuestsCodexView';
import { Editor } from './features/Editor';
import { SkillTreeModal } from './features/SkillTreeModal';
import { CharacterCreator } from './features/CharacterCreator';
import { WorldState } from './features/WorldState';
import { NewsModal } from './features/NewsModal';
import { DailyReportModal } from './features/DailyReportModal';
import { MusicPlayer } from './features/MusicPlayer';
import { WorldGenerator } from './features/WorldGenerator';
import { Button } from './components/ui/Button';
import { PlusCircle, LayoutDashboard, Calendar as CalendarIcon, ShoppingBag, BookOpen, Settings, Globe, PlayCircle, Database, ArrowRight, Save, UserPlus, Key, CheckCircle2, AlertCircle } from 'lucide-react';
import { Power } from './types';
import { PRESET_SAVES } from './preset_saves';
import { INITIAL_PLAYER } from './constants';

type Tab = 'DAY' | 'CALENDAR' | 'INVENTORY' | 'CODEX' | 'WORLD' | 'SETTINGS';
type SetupStage = 'MENU' | 'WORLD_GEN' | 'CHAR_CREATION';

const App: React.FC = () => {
  const engine = useGameEngine();
  const [activeTab, setActiveTab] = useState<Tab>('DAY');
  const [showEditor, setShowEditor] = useState(false);
  const [showSkillTree, setShowSkillTree] = useState(false);
  const [editingItem, setEditingItem] = useState<{type: any, data: any} | undefined>(undefined);
  const [isEditorMode, setIsEditorMode] = useState(false);
  
  // Setup Flow State
  const [setupStage, setSetupStage] = useState<SetupStage>('MENU');

  // Startup API Key State
  const [hasStartupKey, setHasStartupKey] = useState(false);
  const [startupKeyInput, setStartupKeyInput] = useState('');

  useEffect(() => {
      const checkKey = async () => {
          const local = localStorage.getItem('sentinel_custom_api_key');
          const env = process.env.API_KEY; // This might be injected by bundler or empty
          
          let hasEnv = false;
          // Check if env key is actually populated (not just undefined)
          if (env && env.length > 0 && !env.includes('your_api_key')) {
              hasEnv = true;
          }

          if (local || hasEnv) {
              setHasStartupKey(true);
          } else if ((window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
              const studioHas = await (window as any).aistudio.hasSelectedApiKey();
              setHasStartupKey(studioHas);
          }
      };
      checkKey();
  }, []);

  const handleSaveStartupKey = () => {
      if (startupKeyInput.trim()) {
          localStorage.setItem('sentinel_custom_api_key', startupKeyInput.trim());
          setHasStartupKey(true);
          setStartupKeyInput('');
      }
  };

  const handleEditItem = (type: string, item: any) => {
      setEditingItem({ type, data: item });
      setShowEditor(true);
  };

  const handleOpenEditor = () => {
      setEditingItem(undefined);
      setShowEditor(true);
  };

  const handleSavePowerWrapper = (power: Power) => {
      // Check if this power belongs to the player
      const isPlayerPower = engine.player.powers.some(p => p.id === power.id);
      if (isPlayerPower) {
          engine.handleSavePlayerPower(power);
      } else {
          engine.handleSavePower(power);
      }
  };

  const handleLoadCustom = (presetData: any) => {
      // Load the world state from preset, but reset player to initial (forcing creation)
      const customData = {
          ...presetData,
          player: INITIAL_PLAYER
      };
      const success = engine.handleLoadSaveData(customData);
      if (success) {
          setSetupStage('CHAR_CREATION');
      }
  };

  // --- Initial Setup Flow ---
  if (!engine.player.hasCreatedCharacter) {
      if (setupStage === 'MENU') {
          return (
              <div className="flex h-screen bg-slate-950 items-center justify-center p-4">
                  <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl text-center space-y-8 animate-in fade-in zoom-in-95">
                      <div>
                          <h1 className="text-4xl font-black text-white tracking-tight mb-2">SENTINEL</h1>
                          <p className="text-slate-400">Superhero Management & RPG Simulator</p>
                      </div>

                      {/* API Key Check / Input */}
                      <div className={`p-4 rounded-lg border text-left transition-all ${hasStartupKey ? 'bg-green-900/10 border-green-900/30' : 'bg-amber-900/10 border-amber-900/30'}`}>
                          <div className="flex items-center gap-2 mb-2">
                              <Key size={16} className={hasStartupKey ? 'text-green-500' : 'text-amber-500'} />
                              <span className={`text-sm font-bold uppercase ${hasStartupKey ? 'text-green-400' : 'text-amber-400'}`}>
                                  {hasStartupKey ? 'System Online' : 'API Key Required'}
                              </span>
                          </div>
                          
                          {!hasStartupKey ? (
                              <div className="space-y-3">
                                  <p className="text-xs text-slate-400">
                                      A Google Gemini API key is required to run the AI Game Master.
                                  </p>
                                  <div className="flex gap-2">
                                      <input 
                                          type="password" 
                                          className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                          placeholder="Enter API Key..."
                                          value={startupKeyInput}
                                          onChange={(e) => setStartupKeyInput(e.target.value)}
                                      />
                                      <Button size="sm" onClick={handleSaveStartupKey} disabled={!startupKeyInput.trim()}>
                                          Connect
                                      </Button>
                                  </div>
                                  <p className="text-[10px] text-slate-500">
                                      Get a key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Google AI Studio</a>.
                                  </p>
                              </div>
                          ) : (
                              <div className="flex justify-between items-center">
                                  <span className="text-xs text-slate-400 flex items-center gap-1">
                                      <CheckCircle2 size={12} className="text-green-500"/> Credentials Verified
                                  </span>
                                  <button 
                                      onClick={() => { localStorage.removeItem('sentinel_custom_api_key'); setHasStartupKey(false); }}
                                      className="text-[10px] text-slate-500 hover:text-red-400 underline"
                                  >
                                      Reset Key
                                  </button>
                              </div>
                          )}
                      </div>
                      
                      <div className={`space-y-4 transition-opacity duration-500 ${!hasStartupKey ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
                          {PRESET_SAVES.length > 0 && (
                              <div className="mb-6 space-y-3">
                                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2 mb-2">
                                      Load Scenario
                                  </div>
                                  {PRESET_SAVES.map((preset, idx) => (
                                      <div key={idx} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 text-left transition-colors hover:border-slate-600">
                                          <div className="mb-3">
                                              <div className="text-white font-bold text-lg flex items-center gap-2">
                                                  <Globe size={18} className="text-blue-500" /> {preset.label}
                                              </div>
                                              <div className="text-slate-400 text-xs">{preset.description}</div>
                                          </div>
                                          <div className="flex gap-2">
                                              <Button 
                                                  size="sm" 
                                                  variant="secondary" 
                                                  onClick={() => engine.handleLoadSaveData(preset.data)} 
                                                  className="flex-1 flex items-center justify-center gap-1"
                                              >
                                                  <PlayCircle size={14} /> Quick Start
                                              </Button>
                                              <Button 
                                                  size="sm" 
                                                  variant="primary" 
                                                  onClick={() => handleLoadCustom(preset.data)} 
                                                  className="flex-1 flex items-center justify-center gap-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-600/50"
                                              >
                                                  <UserPlus size={14} /> Custom Hero
                                              </Button>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          )}

                          <button 
                              onClick={() => setSetupStage('CHAR_CREATION')}
                              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 p-4 rounded-lg font-bold text-lg transition-colors flex items-center justify-center gap-3 border border-slate-700 group"
                          >
                              <PlayCircle size={24} className="text-slate-500 group-hover:text-white transition-colors" /> New Game (Empty World)
                          </button>
                          
                          <button 
                              onClick={() => setSetupStage('WORLD_GEN')}
                              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 p-4 rounded-lg font-bold text-lg transition-colors flex items-center justify-center gap-3 border border-slate-700 group"
                          >
                              <Database size={24} className="text-purple-500 group-hover:scale-110 transition-transform" /> Generate Custom World
                          </button>
                      </div>
                      
                      <div className="text-xs text-slate-600">
                          v1.2.2 • Powered by Gemini AI
                      </div>
                  </div>
              </div>
          );
      }

      if (setupStage === 'WORLD_GEN') {
          return (
              <div className="h-screen bg-slate-950 p-8 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                      <h1 className="text-2xl font-bold text-white">World Setup</h1>
                      <Button variant="ghost" onClick={() => setSetupStage('MENU')}>Back to Menu</Button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                      <WorldGenerator 
                          onComplete={(data) => {
                              engine.handleImportWorldData(data);
                              setSetupStage('CHAR_CREATION');
                          }}
                          currentModel={engine.gameState.generationModel || 'gemini-3-flash-preview'}
                      />
                  </div>
              </div>
          );
      }

      return (
          <CharacterCreator 
              onComplete={engine.handleUpdatePlayer} 
              availablePowers={engine.gameState.powerTemplates} 
          />
      );
  }

  // --- Main App ---
  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Critical Error Modal */}
      {engine.error && (
          <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-6 animate-in fade-in zoom-in-95">
              <div className="bg-slate-900 border border-red-500 rounded-xl p-6 max-w-md w-full text-center shadow-2xl">
                  <h2 className="text-2xl font-black text-red-500 mb-4 uppercase tracking-wider">System Critical Error</h2>
                  <div className="bg-red-950/30 border border-red-900/50 p-4 rounded mb-6 text-left">
                      <p className="text-slate-300 font-mono text-xs break-words">{engine.error}</p>
                  </div>
                  <Button onClick={engine.dismissError} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold">
                      Acknowledge & Resume
                  </Button>
              </div>
          </div>
      )}

      {/* Navigation Rail */}
      <nav className="w-16 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-6 gap-6 z-20 relative">
        <div className="p-2 bg-blue-600 rounded-lg mb-4 shadow-[0_0_15px_rgba(37,99,235,0.5)]">
            <LayoutDashboard size={24} className="text-white" />
        </div>
        <button onClick={() => setActiveTab('DAY')} title="Day" className={`p-3 rounded-lg transition-all ${activeTab === 'DAY' ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}><LayoutDashboard size={20} /></button>
        <button onClick={() => setActiveTab('CALENDAR')} title="Calendar" className={`p-3 rounded-lg transition-all ${activeTab === 'CALENDAR' ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}><CalendarIcon size={20} /></button>
        <button onClick={() => setActiveTab('INVENTORY')} title="Inventory & Shop" className={`p-3 rounded-lg transition-all ${activeTab === 'INVENTORY' ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}><ShoppingBag size={20} /></button>
        <button onClick={() => setActiveTab('CODEX')} title="Codex" className={`p-3 rounded-lg transition-all ${activeTab === 'CODEX' ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}><BookOpen size={20} /></button>
        <button onClick={() => setActiveTab('WORLD')} title="World State" className={`p-3 rounded-lg transition-all ${activeTab === 'WORLD' ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}><Globe size={20} /></button>
        
        <div className="mt-auto flex flex-col items-center gap-4">
             {isEditorMode && (
                 <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" title="Editor Mode Active" />
             )}
             <button onClick={() => setActiveTab('SETTINGS')} title="Settings" className={`p-3 rounded-lg transition-all ${activeTab === 'SETTINGS' ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}><Settings size={20} /></button>
        </div>
      </nav>

      <div className={`flex-1 flex flex-col overflow-hidden ${isEditorMode ? 'ring-2 ring-inset ring-red-500/30' : ''}`}>
         {/* Music Player Bar (Global) */}
         <MusicPlayer 
            gameState={engine.gameState} 
            onToggle={engine.toggleMusic} 
            onVolumeChange={engine.setMusicVolume} 
         />

         <div className="flex-1 flex overflow-hidden">
            {/* Overlays */}
            {showEditor && (
                <Editor 
                    initialData={editingItem}
                    allTasks={engine.gameState.taskPool}
                    allItems={engine.gameState.shopItems}
                    allUpgrades={engine.player.baseUpgrades}
                    allPools={[...engine.gameState.taskPools, ...engine.gameState.randomEventPools]}
                    onSaveTask={engine.handleSaveTask} 
                    onSaveItem={engine.handleSaveItem} 
                    onSaveDowntime={engine.handleSaveDowntime}
                    onSaveUpgrade={engine.handleSaveUpgrade}
                    onSaveEvent={engine.handleSaveEvent}
                    onSavePool={engine.handleSavePool}
                    onSavePower={handleSavePowerWrapper} // Modified wrapper
                    onSaveAutomator={engine.handleSaveAutomator}
                    onSaveCodex={engine.handleSaveCodex}
                    onClose={() => { setShowEditor(false); setEditingItem(undefined); }} 
                />
            )}
            
            {engine.pendingNews && (
                <NewsModal 
                    issue={engine.pendingNews} 
                    onClose={engine.handleApplyNewsImpact} 
                />
            )}

            {engine.dailyReport && (
                <DailyReportModal 
                    report={engine.dailyReport} 
                    onAcknowledge={() => engine.setDailyReport(null)} 
                />
            )}

            {showSkillTree && (
                <SkillTreeModal 
                    player={engine.player} 
                    onClose={() => setShowSkillTree(false)} 
                    onPurchaseUpgrade={engine.handlePurchaseUpgrade}
                    isEditorMode={isEditorMode}
                    onEditPower={(p) => handleEditItem('POWER', p)}
                />
            )}

            <main className="flex-1 flex flex-col relative bg-slate-950 overflow-hidden">
                {isEditorMode && !engine.currentScenario && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 z-50 pointer-events-none opacity-50" />
                )}
                
                {engine.currentScenario ? (
                    <ScenarioPlayer 
                        task={engine.currentScenario} 
                        player={engine.player} 
                        timeline={engine.gameState.timeline}
                        activeNews={engine.gameState.activeNews}
                        codex={engine.gameState.codex}
                        allItems={engine.gameState.shopItems}
                        onComplete={engine.handleScenarioComplete} 
                        onExit={() => { 
                            engine.setCurrentScenario(null);
                            engine.setMusicMood('MENU'); 
                        }}
                        onIdentitySwitch={engine.handleIdentitySwitch}
                        onAddCodexEntry={engine.handleAddCodexEntry}
                        onUnlockSecret={engine.handleUnlockSecret}
                    />
                ) : (
                    <>
                        {activeTab === 'DAY' && (
                            <DayManager 
                                player={engine.player}
                                gameState={engine.gameState}
                                onSelectTask={engine.handleTaskSelect}
                                onNextDay={engine.handleNextDay}
                                onDowntimeAction={engine.handleDowntime}
                                isEditorMode={isEditorMode}
                                onEditTask={(t) => handleEditItem('TASK', t)}
                                onEditDowntime={(d) => handleEditItem('DOWNTIME', d)}
                                onCreateTask={handleOpenEditor} // Pass editor opener for new tasks
                                processingState={engine.processingState}
                                onQuickResolve={engine.handleAutoResolveTask}
                                onCancelProcessing={engine.handleCancelProcessing}
                            />
                        )}
                        {activeTab === 'CALENDAR' && (
                            <CalendarView 
                                currentDay={engine.gameState.day} 
                                events={engine.gameState.calendarEvents} 
                                gameState={engine.gameState}
                                onSaveDayConfig={engine.handleSaveDayConfig}
                                onSaveEvent={engine.handleSaveEvent}
                                onDeleteEvent={(id) => engine.handleDeleteItem('EVENT', id)}
                                isEditorMode={isEditorMode}
                                onEditEvent={(e) => handleEditItem('EVENT', e)}
                            />
                        )}
                        {activeTab === 'INVENTORY' && (
                            <InventoryShop 
                                player={engine.player}
                                gameState={engine.gameState}
                                shopItems={engine.gameState.shopItems}
                                onBuyItem={engine.handleBuyItem}
                                onUpgradeBase={engine.handleUpgradeBase}
                                onUseItem={engine.handleUseItem}
                                onEquipItem={engine.handleEquipItem}
                                onUnequipItem={engine.handleUnequipItem}
                                isEditorMode={isEditorMode}
                                onEditItem={(i) => handleEditItem('ITEM', i)}
                                onEditUpgrade={(u) => handleEditItem('UPGRADE', u)}
                                onAddLock={engine.handleAddLockToEntity}
                            />
                        )}
                        {activeTab === 'CODEX' && (
                            <QuestsCodexView 
                                gameState={engine.gameState} 
                                player={engine.player}
                                isEditorMode={isEditorMode}
                                onEditCodex={(c) => handleEditItem('CODEX', c)}
                            />
                        )}
                        {activeTab === 'WORLD' && (
                            <WorldState 
                                gameState={engine.gameState}
                                baseUpgrades={engine.player.baseUpgrades}
                                isEditorMode={isEditorMode}
                                onEditAutomator={(a) => handleEditItem('AUTOMATOR', a)}
                                onDeleteAutomator={(id) => engine.handleDeleteItem('AUTOMATOR', id)}
                                onSaveAutomator={engine.handleSaveAutomator}
                                onSaveWeekThemes={engine.handleSaveWeekThemes}
                                onImportWorldData={(data) => engine.handleImportWorldData({ ...data, wipeFirst: false })} // In-app generator usually doesn't wipe
                            />
                        )}
                        {activeTab === 'SETTINGS' && (
                            <SettingsView 
                                gameState={engine.gameState} 
                                baseUpgrades={engine.player.baseUpgrades}
                                onEditItem={handleEditItem}
                                onDeleteItem={engine.handleDeleteItem}
                                isEditorMode={isEditorMode}
                                onToggleEditorMode={() => setIsEditorMode(!isEditorMode)}
                                onUpdateNewsSettings={engine.handleUpdateNewsSettings}
                                onResetGame={engine.handleResetGame}
                                onExportSave={engine.handleExportSave}
                                onImportSave={engine.handleImportSave}
                                onSaveTrack={engine.handleSaveTrack}
                                onDeleteTrack={engine.handleDeleteTrack}
                                onUpdateGenerationModel={engine.handleUpdateGenerationModel}
                                onUpdateDailyConfig={engine.handleUpdateDailyConfig}
                            />
                        )}

                        {isEditorMode && (
                            <div className="absolute bottom-8 right-8 z-10 animate-in fade-in zoom-in">
                                <Button onClick={handleOpenEditor} className="rounded-full h-14 w-14 shadow-2xl bg-red-600 hover:bg-red-500 flex items-center justify-center border-2 border-slate-900" title="Create New Content">
                                    <PlusCircle size={28} />
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </main>

            <aside className="w-80 border-l border-slate-800 bg-slate-900 shadow-2xl z-10 flex flex-col">
                <CharacterSheet 
                    player={engine.player} 
                    onToggleIdentity={engine.toggleIdentity} 
                    onOpenSkillTree={() => setShowSkillTree(true)} 
                    isEditorMode={isEditorMode}
                    onUpdatePlayer={engine.handleUpdatePlayer}
                    onEditPower={(p) => handleEditItem('POWER', p)}
                    onAddPower={engine.handleAddPlayerPower}
                    onDeletePower={engine.handleDeletePlayerPower}
                    availablePowers={engine.gameState.powerTemplates}
                />
            </aside>
         </div>
      </div>
    </div>
  );
};

export default App;
