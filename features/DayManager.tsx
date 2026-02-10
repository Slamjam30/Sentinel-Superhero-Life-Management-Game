
import React, { useState } from 'react';
import { GameState, Task, Identity, Player, TaskType, DowntimeActivity, ProcessingState, StatType } from '../types';
import { Button } from '../components/ui/Button';
import { Clock, MapPin, Coffee, AlertTriangle, Briefcase, Lock, Zap, Brain, AlertOctagon, Users, Sparkles, Edit3, Loader2, Terminal, PlusCircle, Repeat, Dice5, CheckCircle2, XCircle, ArrowRight, DollarSign } from 'lucide-react';
import { checkAllConditions, calculateTrainingXp, calculateWorkIncome } from '../utils/mechanics';

interface DayManagerProps {
  player: Player;
  gameState: GameState;
  onSelectTask: (task: Task) => void;
  onNextDay: () => void;
  onDowntimeAction: (activity: DowntimeActivity, mode: 'AUTO' | 'ROLEPLAY', trainingTarget?: { type: 'STAT' | 'POWER', id: string }) => void;
  isEditorMode?: boolean;
  onEditTask?: (task: Task) => void;
  onCreateTask?: () => void; // New prop for creating tasks
  onEditDowntime?: (activity: DowntimeActivity) => void;
  processingState?: ProcessingState | null;
  onQuickResolve?: (task: Task, stat: StatType, description: string) => { success: boolean, roll: number, total: number, dc: number, summary: string };
  onCancelProcessing?: () => void;
}

export const DayManager: React.FC<DayManagerProps> = ({ 
  player, 
  gameState, 
  onSelectTask, 
  onNextDay, 
  onDowntimeAction,
  isEditorMode,
  onEditTask,
  onCreateTask,
  onEditDowntime,
  processingState,
  onQuickResolve,
  onCancelProcessing
}) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedDowntime, setSelectedDowntime] = useState<DowntimeActivity | null>(null);
  
  // Resolve Logic
  const [resolvingTask, setResolvingTask] = useState<Task | null>(null);
  const [resolveDescription, setResolveDescription] = useState('');
  const [resolveStat, setResolveStat] = useState<StatType>(StatType.COORDINATION);
  const [resolveResult, setResolveResult] = useState<{ success: boolean, roll: number, total: number, dc: number, summary: string } | null>(null);

  // Social Selector
  const [showSocialSelector, setShowSocialSelector] = useState(false);
  
  // Training Selector
  const [showTrainingSelector, setShowTrainingSelector] = useState(false);
  const [trainingTarget, setTrainingTarget] = useState<{ type: 'STAT' | 'POWER', id: string }>({ type: 'STAT', id: 'smarts' });

  // Calculate Effort
  const tasksCompletedToday = gameState.activeTasks.filter(t => t.completedDay === gameState.day).length;
  const effortLimit = gameState.dailyConfig?.taskEffortLimit || 3;
  const isEffortExhausted = tasksCompletedToday >= effortLimit;

  // Check for mandatory tasks that haven't been completed today
  const hasMandatoryTasks = gameState.activeTasks.some(t => t.isMandatory && t.completedDay !== gameState.day);
  
  // Filter out tasks completed today for board display
  const visibleTasks = gameState.activeTasks.filter(t => t.completedDay !== gameState.day);
  const remainingTasks = visibleTasks.length;

  // Calculate stats for header (Excluding Mandatory Events from the "Tasks Available" count)
  // This represents the "Optional/Generated" task pool capacity.
  const visibleStandardTasksCount = visibleTasks.filter(t => !t.isMandatory && t.type !== TaskType.EVENT).length;
  const dailyTaskLimit = gameState.dailyConfig?.tasksAvailablePerDay || 4;

  const handleEndDayClick = () => {
    if (remainingTasks > 0) {
        setShowConfirmation(true);
    } else {
        onNextDay();
    }
  };

  const confirmEndDay = () => {
      setShowConfirmation(false);
      onNextDay();
  };

  const handleTaskClick = (task: Task) => {
      // Logic to check lock status again just in case
      if (task.locked && !checkAllConditions(player, gameState, task.lockConditions) && !isEditorMode) {
          return;
      }

      // Check Effort Limit
      if (isEffortExhausted && !task.isMandatory && !isEditorMode) {
          return;
      }

      if ((task.completionCount || 0) > 0 && onQuickResolve) {
          // Show Resolve Dialog
          setResolvingTask(task);
          setResolveDescription('');
          setResolveResult(null);
      } else {
          onSelectTask(task);
      }
  };

  const handleResolveSubmit = () => {
      if (!resolvingTask || !onQuickResolve) return;
      const result = onQuickResolve(resolvingTask, resolveStat, resolveDescription || 'Standard approach');
      setResolveResult(result);
  };

  const handleResolveClose = () => {
      setResolvingTask(null);
      setResolveResult(null);
  };

  const handleDowntimeClick = (activity: DowntimeActivity) => {
      setSelectedDowntime(activity);
      
      if (activity.type === 'SOCIAL') {
          // Show all unlocked NPCs from Codex
          setShowSocialSelector(true);
          setShowTrainingSelector(false);
      } else if (activity.type === 'TRAINING') {
          setShowTrainingSelector(true);
          setShowSocialSelector(false);
      } else {
          setShowSocialSelector(false);
          setShowTrainingSelector(false);
      }
  };

  const handleSocialSelect = (name: string, mode: 'AUTO' | 'ROLEPLAY') => {
      if (selectedDowntime) {
          const modActivity = {
              ...selectedDowntime,
              title: `Meet ${name}`,
              description: `Spending time with ${name}.`,
              roleplayPrompt: `You arrange a meeting with ${name} to catch up and discuss current events.`
          };
          onDowntimeAction(modActivity, mode);
          setSelectedDowntime(null);
          setShowSocialSelector(false);
      }
  };

  const handleAction = (mode: 'AUTO' | 'ROLEPLAY') => {
      if (selectedDowntime) {
          if (selectedDowntime.type === 'TRAINING') {
              onDowntimeAction(selectedDowntime, mode, trainingTarget);
          } else {
              onDowntimeAction(selectedDowntime, mode);
          }
          setSelectedDowntime(null);
          setShowTrainingSelector(false);
      }
  }

  const getTaskIcon = (type: TaskType) => {
    switch (type) {
      case 'Patrol': return <MapPin className="text-blue-400" />;
      case 'Work': return <Briefcase className="text-green-400" />;
      case 'Event': return <AlertTriangle className="text-amber-400" />;
      default: return <Coffee className="text-slate-400" />;
    }
  };

  // Filter available downtimes based on conditions
  const availableDowntimes = gameState.downtimeActivities.filter(activity => 
    checkAllConditions(player, gameState, activity.conditions)
  );

  const availableNPCs = gameState.codex.filter(c => c.category === 'NPC' && c.unlocked);

  return (
    <div className="flex-1 bg-slate-950 p-8 overflow-y-auto relative">
      
      {/* Processing Overlay */}
      {gameState.isProcessing && (
          <div className="absolute inset-0 bg-slate-950/95 z-[100] flex flex-col items-center justify-center animate-in fade-in">
              <div className="w-full max-w-lg space-y-6 text-center">
                  <div className="flex justify-center">
                      <div className="relative">
                          <Loader2 size={64} className="text-blue-500 animate-spin" />
                          <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs font-bold text-white">{processingState ? Math.round((processingState.itemsProcessed / (processingState.totalItems || 1)) * 100) : 0}%</span>
                          </div>
                      </div>
                  </div>
                  
                  <div>
                      <h2 className="text-2xl font-black text-white tracking-tight">Processing Day {gameState.day}...</h2>
                      <p className="text-blue-400 font-mono text-sm mt-1 animate-pulse">
                          {processingState?.step || 'Initializing System...'}
                      </p>
                  </div>

                  {/* Terminal Log View */}
                  <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 font-mono text-xs text-left h-48 overflow-hidden flex flex-col">
                      <div className="flex items-center gap-2 text-slate-500 border-b border-slate-800 pb-2 mb-2">
                          <Terminal size={12} /> System Pipeline
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-1">
                          {processingState?.logs.map((log, i) => (
                              <div key={i} className="text-slate-300 border-l-2 border-transparent hover:border-slate-600 pl-2">
                                  <span className="text-slate-500 mr-2">{'>'}</span>{log}
                              </div>
                          ))}
                      </div>
                  </div>

                  {onCancelProcessing && (
                      <div className="mt-4 animate-in slide-in-from-bottom-2 fade-in duration-1000 delay-1000 fill-mode-backwards">
                          <Button 
                            variant="danger" 
                            size="sm" 
                            onClick={onCancelProcessing}
                            className="bg-red-900/30 border border-red-500/50 hover:bg-red-800/50 text-red-200"
                          >
                              Force Stop Processing
                          </Button>
                          <p className="text-[10px] text-slate-500 mt-2">Use if the simulation becomes unresponsive.</p>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Quick Resolve Modal */}
      {resolvingTask && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95">
                  {!resolveResult ? (
                      <>
                        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                            <Repeat size={20} className="text-blue-500" />
                            {resolvingTask.title}
                        </h2>
                        <div className="bg-blue-900/20 text-blue-300 p-3 rounded text-sm mb-4 border border-blue-900/50">
                            You have completed this task before. You can attempt to <strong>Quick Resolve</strong> it with a dice roll instead of playing the scenario.
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Approach (Stat)</label>
                                <select 
                                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                                    value={resolveStat}
                                    onChange={(e) => setResolveStat(e.target.value as StatType)}
                                >
                                    {Object.values(StatType).map(s => <option key={s} value={s}>{s} ({Math.floor(player.stats[s.toLowerCase() as keyof typeof player.stats])})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Method Description</label>
                                <textarea 
                                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white h-20 text-sm"
                                    placeholder="How do you solve this problem?"
                                    value={resolveDescription}
                                    onChange={(e) => setResolveDescription(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex justify-between mt-6 pt-4 border-t border-slate-800">
                            <Button variant="ghost" onClick={() => onSelectTask(resolvingTask)}>Play Full Scenario</Button>
                            <div className="flex gap-2">
                                <Button variant="secondary" onClick={() => setResolvingTask(null)}>Cancel</Button>
                                <Button variant="primary" onClick={handleResolveSubmit} className="flex items-center gap-1"><Dice5 size={14}/> Roll</Button>
                            </div>
                        </div>
                      </>
                  ) : (
                      <>
                        <div className={`p-6 text-center border-b-4 ${resolveResult.success ? 'border-green-500 bg-green-900/10' : 'border-red-500 bg-red-900/10'} rounded-t-lg -mt-6 -mx-6 mb-6`}>
                            {resolveResult.success ? <CheckCircle2 size={48} className="text-green-500 mx-auto mb-2" /> : <XCircle size={48} className="text-red-500 mx-auto mb-2" />}
                            <h2 className="text-2xl font-black text-white uppercase">{resolveResult.success ? 'Success' : 'Failure'}</h2>
                        </div>
                        
                        <div className="space-y-4 mb-6">
                            <div className="bg-slate-950 p-4 rounded border border-slate-800 text-center">
                                <div className="text-xs text-slate-500 uppercase font-bold mb-1">Skill Check</div>
                                <div className="text-xl font-mono text-white">
                                    <span className="text-slate-400">d20</span>({resolveResult.roll}) + <span className="text-blue-400">{resolveStat}</span> = <span className={`font-bold ${resolveResult.success ? 'text-green-400' : 'text-red-400'}`}>{resolveResult.total}</span>
                                </div>
                                <div className="text-xs text-slate-500 mt-1">vs Difficulty Class {resolveResult.dc}</div>
                            </div>
                            <p className="text-sm text-slate-300 italic text-center">"{resolveResult.summary}"</p>
                        </div>

                        <Button className="w-full" onClick={handleResolveClose}>Continue</Button>
                      </>
                  )}
              </div>
          </div>
      )}

      {/* Downtime Modal */}
      {selectedDowntime && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-lg w-full p-6 animate-in zoom-in-95 max-h-[80vh] overflow-y-auto">
                   <h2 className="text-2xl font-bold text-white mb-2">{selectedDowntime.title}</h2>
                   <p className="text-slate-300 mb-6">{selectedDowntime.description}</p>
                   
                   {/* Work Earnings Display */}
                   {selectedDowntime.type === 'WORK' && (
                       <div className="mb-6 bg-green-900/10 border border-green-900/30 p-4 rounded-lg">
                           <div className="text-xs font-bold text-green-500 uppercase flex items-center gap-1 mb-1">
                               <DollarSign size={12} /> Projected Earnings
                           </div>
                           <div className="flex justify-between items-end">
                               <div className="text-2xl font-mono font-bold text-white">
                                   ${calculateWorkIncome(player, selectedDowntime).total}
                               </div>
                               <div className="text-[10px] text-slate-400 text-right">
                                   {calculateWorkIncome(player, selectedDowntime).breakdown}
                               </div>
                           </div>
                       </div>
                   )}

                   {showSocialSelector ? (
                       <div className="space-y-4">
                           <h3 className="text-sm font-bold text-slate-500 uppercase">Select Contact</h3>
                           <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                               {availableNPCs.map(npc => {
                                   let rep = 0;
                                   if (npc.relationship) {
                                       // Determine reputation based on current identity state
                                       if (npc.relationship.knowsIdentity) {
                                           rep = npc.relationship.civilianRep;
                                       } else {
                                           rep = player.identity === Identity.SUPER ? npc.relationship.superRep : npc.relationship.civilianRep;
                                       }
                                   } else {
                                       rep = player.reputations[npc.title] || 0;
                                   }
                                   
                                   const canSocialize = rep >= 20;
                                   return (
                                       <div key={npc.id} className={`flex items-center justify-between bg-slate-950 p-3 rounded border ${canSocialize ? 'border-slate-800' : 'border-slate-800 opacity-60'}`}>
                                           <span className="text-white font-bold">
                                               {npc.title} 
                                               <span className={`text-xs font-normal ml-2 ${rep > 0 ? 'text-green-400' : rep < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                                                   ({rep})
                                               </span>
                                           </span>
                                           <div className="flex gap-2">
                                               {canSocialize ? (
                                                   <Button size="sm" variant="secondary" onClick={() => handleSocialSelect(npc.title, 'ROLEPLAY')}>Meet</Button>
                                               ) : (
                                                   <span className="text-xs text-slate-500 italic py-1 px-2 border border-slate-800 rounded">Req 20 Rep</span>
                                               )}
                                           </div>
                                       </div>
                                   );
                               })}
                               {availableNPCs.length === 0 && (
                                   <div className="text-slate-500 text-sm italic">No known NPCs found in database.</div>
                               )}
                           </div>
                           <div className="mt-4 pt-4 border-t border-slate-800">
                               <Button size="sm" className="w-full" variant="ghost" onClick={() => { setShowSocialSelector(false); }}>Generic Social Event</Button>
                           </div>
                       </div>
                   ) : showTrainingSelector ? (
                       <div className="space-y-4">
                           <h3 className="text-sm font-bold text-slate-500 uppercase">Select Training Focus</h3>
                           
                           {/* Attributes */}
                           <div className="space-y-1">
                               <div className="text-xs text-slate-400 font-bold uppercase mb-1">Attributes</div>
                               <div className="grid grid-cols-2 gap-2">
                                   {['smarts', 'charm', 'coordination', 'will'].map(attr => {
                                       const calc = calculateTrainingXp(player, selectedDowntime, 'STAT', attr);
                                       return (
                                           <button 
                                               key={attr}
                                               onClick={() => setTrainingTarget({ type: 'STAT', id: attr })}
                                               className={`p-3 rounded border text-left transition-colors ${trainingTarget.type === 'STAT' && trainingTarget.id === attr ? 'bg-amber-900/20 border-amber-500 ring-1 ring-amber-500' : 'bg-slate-950 border-slate-800 hover:border-slate-600'}`}
                                           >
                                               <div className="capitalize font-bold text-white text-sm">{attr}</div>
                                               <div className="text-xs text-green-400 flex items-center gap-1">+{calc.total} XP</div>
                                               {calc.total > (selectedDowntime.trainingConfig?.attributeXp || 0.25) && <div className="text-[9px] text-slate-500">Boosted by Upgrades</div>}
                                           </button>
                                       );
                                   })}
                               </div>
                           </div>

                           {/* Powers */}
                           {player.powers.length > 0 && (
                               <div className="space-y-1 pt-2">
                                   <div className="text-xs text-slate-400 font-bold uppercase mb-1">Powers</div>
                                   <div className="space-y-2">
                                       {player.powers.map(p => {
                                           const calc = calculateTrainingXp(player, selectedDowntime, 'POWER', p.id);
                                           return (
                                               <button 
                                                   key={p.id}
                                                   onClick={() => setTrainingTarget({ type: 'POWER', id: p.id })}
                                                   className={`w-full p-3 rounded border text-left transition-colors flex justify-between items-center ${trainingTarget.type === 'POWER' && trainingTarget.id === p.id ? 'bg-amber-900/20 border-amber-500 ring-1 ring-amber-500' : 'bg-slate-950 border-slate-800 hover:border-slate-600'}`}
                                               >
                                                   <div>
                                                       <div className="font-bold text-white text-sm">{p.name}</div>
                                                       <div className="text-[10px] text-slate-500">Lvl {p.level}</div>
                                                   </div>
                                                   <div className="text-right">
                                                       <div className="text-xs text-green-400 font-bold">+{calc.total} XP</div>
                                                       {calc.total > (selectedDowntime.trainingConfig?.powerXp || 20) && <div className="text-[9px] text-slate-500">Boosted</div>}
                                                   </div>
                                               </button>
                                           );
                                       })}
                                   </div>
                               </div>
                           )}

                           <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-800">
                               <button 
                                   className="bg-slate-800 hover:bg-slate-700 p-3 rounded-lg border border-slate-600 text-center transition-colors font-bold text-blue-400 text-sm"
                                   onClick={() => handleAction('AUTO')}
                               >
                                   Automate
                               </button>
                               <button 
                                   className="bg-slate-800 hover:bg-slate-700 p-3 rounded-lg border border-slate-600 text-center transition-colors font-bold text-amber-400 text-sm"
                                   onClick={() => handleAction('ROLEPLAY')}
                               >
                                   Roleplay
                               </button>
                           </div>
                       </div>
                   ) : (
                       <div className="grid grid-cols-2 gap-4">
                           {selectedDowntime.type !== 'SOCIAL' && (
                               <button 
                               className="bg-slate-800 hover:bg-slate-700 p-4 rounded-lg border border-slate-600 text-left transition-colors group"
                               onClick={() => handleAction('AUTO')}
                               >
                                   <div className="flex items-center gap-2 mb-2">
                                       <Zap size={20} className="text-blue-400" />
                                       <span className="font-bold text-white">Automate</span>
                                   </div>
                                   <p className="text-xs text-slate-400">Quickly resolve. Guaranteed minor rewards.</p>
                               </button>
                           )}

                           <button 
                             className={`bg-slate-800 hover:bg-slate-700 p-4 rounded-lg border border-slate-600 text-left transition-colors group ${selectedDowntime.type === 'SOCIAL' ? 'col-span-2' : ''}`}
                             onClick={() => handleAction('ROLEPLAY')}
                           >
                               <div className="flex items-center gap-2 mb-2">
                                   <Sparkles size={20} className="text-amber-400" />
                                   <span className="font-bold text-white">Roleplay</span>
                               </div>
                               <p className="text-xs text-slate-400">Play out a scenario. Higher risk, potential for great rewards.</p>
                           </button>
                       </div>
                   )}
                   
                   <div className="mt-6 flex justify-end">
                       <Button variant="ghost" onClick={() => setSelectedDowntime(null)}>Cancel</Button>
                   </div>
              </div>
          </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95">
                  <div className="flex items-center gap-3 text-amber-500 mb-4">
                      <AlertOctagon size={32} />
                      <h2 className="text-xl font-bold text-white">Unfinished Business</h2>
                  </div>
                  <p className="text-slate-300 mb-6">
                      You have <span className="font-bold text-white">{remainingTasks} active tasks</span> remaining. 
                      Ending the day now will result in penalties to your <span className="text-yellow-400">Fame</span> and <span className="text-red-400">Public Opinion</span>.
                  </p>
                  <div className="flex justify-end gap-3">
                      <Button variant="ghost" onClick={() => setShowConfirmation(false)}>Cancel</Button>
                      <Button variant="danger" onClick={confirmEndDay}>End Day Anyway</Button>
                  </div>
              </div>
          </div>
      )}

      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Day {gameState.day}</h1>
          <p className="text-slate-400 mt-1">Manage your time carefully, hero.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
            <Button 
                onClick={handleEndDayClick} 
                variant="secondary"
                disabled={hasMandatoryTasks || gameState.isProcessing}
                className={hasMandatoryTasks ? "opacity-50 cursor-not-allowed" : ""}
            >
            End Day <Clock size={16} className="ml-2" />
            </Button>
            {hasMandatoryTasks && (
                <span className="text-xs text-red-400 font-bold animate-pulse">
                    Mandatory Events Pending
                </span>
            )}
        </div>
      </header>

      {/* Task Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-start">
              <div>
                  <h2 className={`text-lg font-bold uppercase tracking-wide flex items-center gap-2 ${isEffortExhausted ? 'text-red-400' : 'text-slate-200'}`}>
                    <span className={`w-2 h-2 rounded-full ${isEffortExhausted ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                    Daily Effort: {tasksCompletedToday} / {effortLimit}
                  </h2>
                  <div className="text-xs mt-1 font-mono text-slate-400">
                      Active Missions Available: {visibleStandardTasksCount}
                  </div>
              </div>
              {isEditorMode && onCreateTask && (
                  <Button size="sm" onClick={onCreateTask} className="flex items-center gap-1 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white">
                      <PlusCircle size={14} /> Add Task
                  </Button>
              )}
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {visibleTasks.map(task => {
              const isLocked = task.requiredIdentity !== player.identity || task.locked;
              return (
                <div key={task.id} className={`group relative bg-slate-900 border ${task.isMandatory ? 'border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : isLocked ? 'border-slate-800 opacity-60' : 'border-slate-700 hover:border-blue-500'} rounded-lg p-5 transition-all`}>
                  {task.isMandatory && (
                      <div className="absolute -top-3 -right-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-lg">
                          Mandatory
                      </div>
                  )}
                  {(task.completionCount || 0) > 0 && (
                      <div className="absolute -top-3 -right-3 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1">
                          <CheckCircle2 size={10} /> Completed {task.completionCount}x
                      </div>
                  )}
                  {isEditorMode && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onEditTask && onEditTask(task); }}
                        className="absolute -top-3 -left-3 bg-red-600 text-white p-2 rounded-full shadow-lg z-20 hover:bg-red-500"
                        title="Edit Task"
                      >
                          <Edit3 size={14} />
                      </button>
                  )}
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-slate-800 rounded-md">
                        {getTaskIcon(task.type)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-100 mb-1">{task.title}</h3>
                        <p className="text-slate-400 text-sm mb-3 max-w-lg">{task.description}</p>
                        
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                             Lvl {task.difficulty}
                          </span>
                          <span className={`text-xs font-mono px-2 py-1 rounded border ${task.requiredIdentity === Identity.SUPER ? 'bg-amber-900/30 text-amber-500 border-amber-900' : 'bg-blue-900/30 text-blue-400 border-blue-900'}`}>
                             {task.requiredIdentity} Only
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      disabled={(isLocked && !isEditorMode) || (isEffortExhausted && !task.isMandatory && !isEditorMode)}
                      onClick={() => handleTaskClick(task)}
                      size="sm"
                      variant={task.type === TaskType.EVENT ? 'danger' : 'primary'}
                      className={isEffortExhausted && !task.isMandatory && !isEditorMode ? "opacity-50 grayscale" : ""}
                    >
                      {isLocked ? <Lock size={16} /> : (isEffortExhausted && !task.isMandatory && !isEditorMode ? 'Exhausted' : ((task.completionCount || 0) > 0 ? 'Start / Resolve' : 'Start'))}
                    </Button>
                  </div>
                  
                  {isLocked && task.requiredIdentity !== player.identity && (
                    <div className="absolute inset-0 bg-slate-950/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm rounded-lg pointer-events-none">
                       <span className="bg-black text-white px-3 py-1 rounded text-xs font-bold shadow-xl">
                         Switch Identity to {task.requiredIdentity}
                       </span>
                    </div>
                  )}
                </div>
              );
            })}
            
            {visibleTasks.length === 0 && (
              <div className="text-center p-10 border-2 border-dashed border-slate-800 rounded-lg text-slate-500">
                No active tasks. Use downtime or end the day.
              </div>
            )}
          </div>
        </div>

        {/* Downtime Sidebar */}
        <div className="space-y-6">
           <h2 className="text-lg font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Downtime
            <span className="ml-auto text-xs bg-slate-800 px-2 py-1 rounded text-green-400">
              {player.downtimeTokens} Tokens Left
            </span>
          </h2>
          
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
            {availableDowntimes.map(activity => (
                <div key={activity.id} className="relative group">
                    {isEditorMode && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onEditDowntime && onEditDowntime(activity); }}
                            className="absolute -top-2 -left-2 bg-red-600 text-white p-1.5 rounded-full shadow-lg z-20 hover:bg-red-500"
                            title="Edit Downtime"
                        >
                            <Edit3 size={10} />
                        </button>
                    )}
                    <Button 
                    className="w-full justify-between group" 
                    variant="secondary"
                    disabled={player.downtimeTokens <= 0}
                    onClick={() => handleDowntimeClick(activity)}
                    >
                    <span className="flex items-center gap-2">
                        {activity.type === 'TRAINING' && <Zap size={16} className="text-yellow-500" />}
                        {activity.type === 'WORK' && <Briefcase size={16} className="text-green-500" />}
                        {activity.type === 'SOCIAL' && <Users size={16} className="text-blue-500" />}
                        {activity.type === 'CUSTOM' && <Sparkles size={16} className="text-purple-500" />}
                        {activity.title}
                    </span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-slate-400">
                        &gt;
                    </span>
                    </Button>
                </div>
            ))}
            
            {availableDowntimes.length === 0 && (
                <div className="text-center text-slate-500 text-xs py-4">
                    No available downtime activities.
                </div>
            )}
          </div>

          {/* Daily Log */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 h-64 overflow-y-auto">
             <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Daily Log</h3>
             <div className="space-y-2 text-xs font-mono">
               {gameState.logs.slice().reverse().map((log, i) => (
                 <div key={i} className="text-slate-300 border-l-2 border-slate-700 pl-2 py-1">
                   {log}
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
