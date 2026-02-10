
import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { LockConditionBuilder } from '../components/ui/LockConditionBuilder';
import { TransferList } from '../components/ui/TransferList';
import { generateTaskContent, generateItemContent, generateDowntimeContent, generateUpgradeContent, generateEventContent, generatePoolContent, generatePowerContent } from '../services/gemini/generators';
import { Task, TaskType, Item, DowntimeActivity, BaseUpgrade, Identity, LockCondition, ScenarioMode, CalendarEvent, TaskPool, Power, Automator, CodexEntry } from '../types';
import { Save, Package, ClipboardList, Coffee, Home, Zap, Bot, AlertTriangle, Layers, Cpu, Users, PenTool } from 'lucide-react';
import { ManualTaskForm } from './editor/forms/ManualTaskForm';
import { ManualPowerForm } from './editor/forms/ManualPowerForm';
import { ManualAutomatorForm } from './editor/forms/ManualAutomatorForm';
import { ManualCodexForm } from './editor/forms/ManualCodexForm';
import { ManualDowntimeForm } from './editor/forms/ManualDowntimeForm';
import { ManualUpgradeForm } from './editor/forms/ManualUpgradeForm';

interface EditorProps {
  initialData?: {
      type: 'TASK' | 'ITEM' | 'DOWNTIME' | 'UPGRADE' | 'EVENT' | 'POOL' | 'POWER' | 'AUTOMATOR' | 'CODEX';
      data: any;
  };
  allTasks?: Task[];
  allItems?: Item[];
  allUpgrades?: BaseUpgrade[];
  allPools?: TaskPool[]; // Added for Automator
  
  onSaveTask: (task: Task) => void;
  onSaveItem: (item: Item) => void;
  onSaveDowntime: (activity: DowntimeActivity) => void;
  onSaveUpgrade: (upgrade: BaseUpgrade) => void;
  onSaveEvent: (event: CalendarEvent) => void;
  onSavePool: (pool: TaskPool, type: 'TASK' | 'RANDOM') => void;
  onSavePower?: (power: Power) => void;
  onSaveAutomator?: (auto: Automator) => void;
  onSaveCodex?: (entry: CodexEntry) => void;
  onClose: () => void;
}

type Mode = 'TASK' | 'ITEM' | 'DOWNTIME' | 'UPGRADE' | 'EVENT' | 'POOL' | 'POWER' | 'AUTOMATOR' | 'CODEX';
type Method = 'AI' | 'MANUAL';

export const Editor: React.FC<EditorProps> = ({ 
    initialData,
    allTasks = [],
    allItems = [],
    allUpgrades = [],
    allPools = [],
    onSaveTask, onSaveItem, onSaveDowntime, onSaveUpgrade, onSaveEvent, onSavePool, onSavePower, onSaveAutomator, onSaveCodex, onClose 
}) => {
  const [mode, setMode] = useState<Mode>('TASK');
  const [method, setMethod] = useState<Method>('AI');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // AI Results
  const [generatedTask, setGeneratedTask] = useState<Partial<Task> | null>(null);
  const [generatedItem, setGeneratedItem] = useState<Partial<Item> | null>(null);
  const [generatedDowntime, setGeneratedDowntime] = useState<Partial<DowntimeActivity> | null>(null);
  const [generatedUpgrade, setGeneratedUpgrade] = useState<Partial<BaseUpgrade> | null>(null);
  const [generatedEvent, setGeneratedEvent] = useState<Partial<CalendarEvent> | null>(null);
  const [generatedPool, setGeneratedPool] = useState<Partial<TaskPool> | null>(null);
  const [generatedPower, setGeneratedPower] = useState<Partial<Power> | null>(null);
  
  // Manual Data Containers
  const [manualTask, setManualTask] = useState<Partial<Task>>({ type: TaskType.MISSION, difficulty: 1, requiredIdentity: Identity.SUPER, mode: ScenarioMode.FREEFORM, rewards: {} });
  const [manualItem, setManualItem] = useState<Partial<Item>>({ type: 'GEAR', cost: 100 });
  const [manualDowntime, setManualDowntime] = useState<Partial<DowntimeActivity>>({ type: 'CUSTOM' });
  const [manualUpgrade, setManualUpgrade] = useState<Partial<BaseUpgrade>>({ cost: 500, owned: false });
  const [manualEvent, setManualEvent] = useState<Partial<CalendarEvent>>({ type: 'EVENT', day: 1, isRandom: false });
  const [manualPool, setManualPool] = useState<Partial<TaskPool>>({ name: '', tasks: [] });
  const [manualPower, setManualPower] = useState<Partial<Power>>({ name: '', upgrades: [], tier: 'STREET' });
  const [manualAutomator, setManualAutomator] = useState<Partial<Automator>>({ name: '', active: true, intervalDays: 5, type: 'TASK', config: { amount: 1 } });
  const [manualCodex, setManualCodex] = useState<Partial<CodexEntry>>({ title: '', category: 'NPC', unlocked: true, relationship: { civilianRep: 0, superRep: 0, knowsIdentity: false } });
  const [poolType, setPoolType] = useState<'TASK' | 'RANDOM'>('TASK');

  const [reputationTargetsInput, setReputationTargetsInput] = useState("");
  const [lockConditions, setLockConditions] = useState<LockCondition[]>([]);

  // Advanced Manual Edit States
  const [nodesJson, setNodesJson] = useState("{}");
  const [contextInput, setContextInput] = useState("");

  // Event Triggers
  const [triggerCondition, setTriggerCondition] = useState<LockCondition | undefined>();
  const [resetCondition, setResetCondition] = useState<LockCondition | undefined>();

  useEffect(() => {
      if (initialData) {
          setMethod('MANUAL');
          setMode(initialData.type);
          setLockConditions(initialData.data.conditions || initialData.data.lockConditions || []);
          
          switch(initialData.type) {
              case 'TASK':
                  setManualTask(initialData.data);
                  setReputationTargetsInput(initialData.data.reputationTargets?.join(', ') || "");
                  setNodesJson(JSON.stringify(initialData.data.nodes || {}, null, 2));
                  setContextInput(initialData.data.context || "");
                  break;
              case 'ITEM': setManualItem(initialData.data); break;
              case 'DOWNTIME': setManualDowntime(initialData.data); break;
              case 'UPGRADE': setManualUpgrade(initialData.data); break;
              case 'EVENT': 
                setManualEvent(initialData.data); 
                setTriggerCondition(initialData.data.triggerCondition);
                setResetCondition(initialData.data.resetCondition);
                break;
              case 'POOL': setManualPool(initialData.data); break;
              case 'POWER': setManualPower(initialData.data); break;
              case 'AUTOMATOR': setManualAutomator(initialData.data); break;
              case 'CODEX': setManualCodex(initialData.data); break;
          }
      }
  }, [initialData]);

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsLoading(true);
    setGeneratedTask(null);
    setGeneratedItem(null);
    setGeneratedDowntime(null);
    setGeneratedUpgrade(null);
    setGeneratedEvent(null);
    setGeneratedPool(null);
    setGeneratedPower(null);

    // AI Generation not fully implemented for all types yet (CODEX, AUTOMATOR)
    if (mode === 'TASK') {
        const result = await generateTaskContent(prompt);
        if (result) setGeneratedTask({ ...result, id: `ai-task-${Date.now()}` });
    } else if (mode === 'ITEM') {
        const result = await generateItemContent(prompt);
        if (result) setGeneratedItem({ ...result, id: `ai-item-${Date.now()}` });
    } else if (mode === 'DOWNTIME') {
        const result = await generateDowntimeContent(prompt);
        if (result) setGeneratedDowntime({ ...result, id: `ai-dt-${Date.now()}` });
    } else if (mode === 'UPGRADE') {
        const result = await generateUpgradeContent(prompt);
        if (result) setGeneratedUpgrade({ ...result, id: `ai-upg-${Date.now()}` });
    } else if (mode === 'EVENT') {
        const result = await generateEventContent(prompt);
        if (result) setGeneratedEvent({ ...result, id: `ai-evt-${Date.now()}` });
    } else if (mode === 'POOL') {
        const result = await generatePoolContent(prompt);
        if (result) setGeneratedPool({ ...result, id: `ai-pool-${Date.now()}` });
    } else if (mode === 'POWER') {
        const result = await generatePowerContent(prompt);
        if (result) setGeneratedPower({ ...result, id: `ai-power-${Date.now()}` });
    }
    setIsLoading(false);
  };

  const handleSave = () => {
    const isManual = method === 'MANUAL';
    const getId = (prefix: string, currentId?: string) => currentId || `${prefix}-${Date.now()}`;

    if (mode === 'TASK') {
        const taskBase = isManual ? manualTask : generatedTask;
        if (taskBase && taskBase.title) {
            const targets = reputationTargetsInput.split(',').map(s => s.trim()).filter(s => s);
            
            let finalNodes = taskBase.nodes;
            let finalContext = taskBase.context;

            if (isManual) {
                try {
                    finalNodes = taskBase.mode === ScenarioMode.STRUCTURED ? JSON.parse(nodesJson) : undefined;
                    finalContext = taskBase.mode === ScenarioMode.FREEFORM ? contextInput : undefined;
                } catch (e) {
                    alert("Invalid JSON in Nodes");
                    return;
                }
            }

            onSaveTask({ 
                ...taskBase as Task, 
                id: getId('man-task', taskBase.id),
                reputationTargets: targets,
                lockConditions, 
                locked: lockConditions.length > 0,
                rewards: taskBase.rewards || {},
                nodes: finalNodes,
                context: finalContext
            });
            onClose();
        }
    } else if (mode === 'ITEM') {
        const itemBase = isManual ? manualItem : generatedItem;
        if (itemBase && itemBase.name) {
            onSaveItem({ ...itemBase as Item, id: getId('man-item', itemBase.id), conditions: lockConditions });
            onClose();
        }
    } else if (mode === 'DOWNTIME') {
        const dt = isManual ? manualDowntime : generatedDowntime;
        if (dt && dt.title) {
            onSaveDowntime({ ...dt as DowntimeActivity, id: getId('man-dt', dt.id), conditions: lockConditions });
            onClose();
        }
    } else if (mode === 'UPGRADE') {
        const upg = isManual ? manualUpgrade : generatedUpgrade;
        if (upg && upg.name) {
            onSaveUpgrade({ ...upg as BaseUpgrade, id: getId('man-upg', upg.id), conditions: lockConditions });
            onClose();
        }
    } else if (mode === 'EVENT') {
        const evt = isManual ? manualEvent : generatedEvent;
        if (evt && evt.title) {
            onSaveEvent({ ...evt as CalendarEvent, id: getId('man-evt', evt.id), conditions: lockConditions, triggerCondition, resetCondition });
            onClose();
        }
    } else if (mode === 'POOL') {
        const pool = isManual ? manualPool : generatedPool;
        if (pool && pool.name) {
            onSavePool({ ...pool as TaskPool, id: getId('man-pool', pool.id) }, poolType);
            onClose();
        }
    } else if (mode === 'POWER') {
        const power = isManual ? manualPower : generatedPower;
        if (power && power.name && onSavePower) {
            onSavePower({ ...power as Power, id: getId('man-power', power.id) });
            onClose();
        }
    } else if (mode === 'AUTOMATOR') {
        const auto = manualAutomator;
        if (auto && auto.name && onSaveAutomator) {
            onSaveAutomator({ ...auto as Automator, id: getId('man-auto', auto.id), nextRunDay: 1 }); // Default to running asap or next interval
            onClose();
        }
    } else if (mode === 'CODEX') {
        const entry = manualCodex;
        if (entry && entry.title && onSaveCodex) {
            onSaveCodex({ ...entry as CodexEntry, id: getId('man-codex', entry.id) });
            onClose();
        }
    }
  };

  const renderManualForm = () => {
      switch(mode) {
          case 'TASK': return (
              <ManualTaskForm 
                task={manualTask} 
                onChange={setManualTask}
                reputationTargetsInput={reputationTargetsInput}
                onChangeReputationTargets={setReputationTargetsInput}
                nodesJson={nodesJson}
                onChangeNodesJson={setNodesJson}
                contextInput={contextInput}
                onChangeContextInput={setContextInput}
                availableItems={allItems.map(i => ({ id: i.id, name: i.name }))}
              />
          );
          case 'POWER': return (
              <ManualPowerForm power={manualPower} onChange={setManualPower} />
          );
          case 'AUTOMATOR': return (
              <ManualAutomatorForm automator={manualAutomator} onChange={setManualAutomator} availablePools={allPools} />
          );
          case 'CODEX': return (
              <ManualCodexForm entry={manualCodex} onChange={setManualCodex} />
          );
          case 'DOWNTIME': return (
              <ManualDowntimeForm activity={manualDowntime} onChange={setManualDowntime} />
          );
          case 'UPGRADE': return (
              <ManualUpgradeForm upgrade={manualUpgrade} onChange={setManualUpgrade} />
          );
          case 'ITEM': return (
              <div className="space-y-4 animate-in fade-in">
                   <input className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" placeholder="Item Name" value={manualItem.name || ''} onChange={e => setManualItem({...manualItem, name: e.target.value})} />
                   <div className="grid grid-cols-2 gap-4">
                       <input type="number" className="bg-slate-900 border border-slate-700 rounded p-2 text-white" placeholder="Cost" value={manualItem.cost} onChange={e => setManualItem({...manualItem, cost: parseInt(e.target.value)})} />
                       <select className="bg-slate-900 border border-slate-700 rounded p-2 text-white" value={manualItem.type} onChange={e => setManualItem({...manualItem, type: e.target.value as any})}>
                          <option value="GEAR">Gear</option>
                          <option value="CONSUMABLE">Consumable</option>
                       </select>
                   </div>
                   <input className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" placeholder="Description" value={manualItem.description || ''} onChange={e => setManualItem({...manualItem, description: e.target.value})} />
              </div>
          );
          case 'EVENT': return (
              <div className="space-y-4 animate-in fade-in">
                  <input className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" placeholder="Event Title" value={manualEvent.title || ''} onChange={e => setManualEvent({...manualEvent, title: e.target.value})} />
                  <textarea className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white h-24" placeholder="Description" value={manualEvent.description || ''} onChange={e => setManualEvent({...manualEvent, description: e.target.value})} />
                  <div className="grid grid-cols-2 gap-4">
                      <select className="bg-slate-900 border border-slate-700 rounded p-2 text-white" value={manualEvent.type} onChange={e => setManualEvent({...manualEvent, type: e.target.value as any})}>
                          <option value="EVENT">General Event</option>
                          <option value="DEADLINE">Deadline</option>
                          <option value="HOLIDAY">Holiday</option>
                      </select>
                      <input type="number" className="bg-slate-900 border border-slate-700 rounded p-2 text-white" placeholder="Day (e.g. 5)" value={manualEvent.day} onChange={e => setManualEvent({...manualEvent, day: parseInt(e.target.value)})} />
                  </div>
                  
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Linked Task (Optional)</label>
                      <select 
                          className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm"
                          value={manualEvent.linkedTaskId || ''}
                          onChange={e => setManualEvent({...manualEvent, linkedTaskId: e.target.value || undefined})}
                      >
                          <option value="">(None - Generate Generic Task)</option>
                          {allTasks.map(t => (
                              <option key={t.id} value={t.id}>{t.title} ({t.type})</option>
                          ))}
                      </select>
                      <p className="text-[10px] text-slate-500 mt-1">Select a task to be spawned when this event triggers. It will be marked as Mandatory.</p>
                  </div>

                  <label className="flex items-center gap-2 bg-slate-900 p-2 rounded border border-slate-700 cursor-pointer">
                      <input type="checkbox" checked={manualEvent.isRandom || false} onChange={e => setManualEvent({...manualEvent, isRandom: e.target.checked})} className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-slate-300">Is Random Event</span>
                  </label>
                  
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg">
                      <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Triggers</h4>
                      <p className="text-[10px] text-slate-400 mb-2">Optional: Define conditions to auto-start this event.</p>
                      
                      <div className="mb-2">
                          <span className="text-xs text-green-400">Trigger Condition (Starts Event)</span>
                          <LockConditionBuilder 
                            conditions={triggerCondition ? [triggerCondition] : []}
                            onChange={(conds) => setTriggerCondition(conds[0])}
                          />
                      </div>
                      <div>
                          <span className="text-xs text-red-400">Reset Condition (Ends/Resets Event)</span>
                          <LockConditionBuilder 
                            conditions={resetCondition ? [resetCondition] : []}
                            onChange={(conds) => setResetCondition(conds[0])}
                          />
                      </div>
                  </div>
              </div>
          );
          case 'POOL': return (
              <div className="space-y-4 animate-in fade-in h-full flex flex-col">
                  <div className="grid grid-cols-2 gap-4">
                      <input className="bg-slate-900 border border-slate-700 rounded p-2 text-white" placeholder="Pool Name" value={manualPool.name || ''} onChange={e => setManualPool({...manualPool, name: e.target.value})} />
                      <select className="bg-slate-900 border border-slate-700 rounded p-2 text-white" value={poolType} onChange={e => setPoolType(e.target.value as any)}>
                          <option value="TASK">Task Pool</option>
                          <option value="RANDOM">Random Event Pool</option>
                      </select>
                  </div>
                  <input className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" placeholder="Description" value={manualPool.description || ''} onChange={e => setManualPool({...manualPool, description: e.target.value})} />
                  
                  <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Assign Tasks</label>
                      <TransferList 
                          available={allTasks.map(t => ({ id: t.id, label: t.title, description: t.description, level: t.difficulty, tags: [t.type, t.requiredIdentity] }))}
                          selected={allTasks.filter(t => manualPool.tasks?.includes(t.id)).map(t => ({ id: t.id, label: t.title, description: t.description, level: t.difficulty, tags: [t.type, t.requiredIdentity] }))}
                          onChange={(ids) => setManualPool({...manualPool, tasks: ids})}
                      />
                  </div>
              </div>
          );
      }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl flex flex-col h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <PenTool className="text-blue-500" /> {initialData ? 'Edit Content' : 'Game Editor'}
              </h2>
              {/* Method Switcher */}
              <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex">
                  {/* Automator/Codex is Manual only for now */}
                  {mode !== 'AUTOMATOR' && mode !== 'CODEX' && (
                      <button onClick={() => setMethod('AI')} className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-2 transition-all ${method === 'AI' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                          <Bot size={14} /> AI
                          <span className="ml-1 text-[8px] bg-amber-500 text-slate-900 px-1 rounded font-black">BETA</span>
                      </button>
                  )}
                  <button onClick={() => setMethod('MANUAL')} className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-2 transition-all ${method === 'MANUAL' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}><PenTool size={14} /> Manual</button>
              </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
        </div>

        {/* Tabs */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex gap-2 justify-center overflow-x-auto flex-shrink-0">
             {[
                 { id: 'TASK', icon: ClipboardList, label: 'Task' },
                 { id: 'POWER', icon: Zap, label: 'Power' },
                 { id: 'ITEM', icon: Package, label: 'Item' },
                 { id: 'CODEX', icon: Users, label: 'Codex' },
                 { id: 'AUTOMATOR', icon: Cpu, label: 'Automator' },
                 { id: 'DOWNTIME', icon: Coffee, label: 'Downtime' },
                 { id: 'EVENT', icon: AlertTriangle, label: 'Event' },
                 { id: 'POOL', icon: Layers, label: 'Pools' },
                 { id: 'UPGRADE', icon: Home, label: 'Upgrade' }
             ].map(tab => (
                 <button 
                    key={tab.id}
                    onClick={() => { setMode(tab.id as Mode); setLockConditions([]); if(tab.id === 'AUTOMATOR' || tab.id === 'CODEX') setMethod('MANUAL'); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${mode === tab.id ? 'bg-slate-800 text-white ring-1 ring-slate-600' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                     <tab.icon size={16} /> {tab.label}
                 </button>
             ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
            {/* Left Column: Input */}
            <div className="w-1/2 p-6 border-r border-slate-800 overflow-y-auto">
                {method === 'AI' ? (
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-slate-400 mb-2">AI Prompt</label>
                            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={`Describe the ${mode.toLowerCase()}...`} className="w-full bg-slate-950 border border-slate-700 rounded-md px-4 py-2 text-white h-32 resize-none" />
                            <Button onClick={handleGenerate} isLoading={isLoading} disabled={!prompt} variant="primary" className="w-full bg-purple-600 hover:bg-purple-500">Generate</Button>
                        </div>
                ) : (
                    <div className="space-y-6 h-full flex flex-col">
                        <div className="flex-1 overflow-y-auto">{renderManualForm()}</div>
                    </div>
                )}
            </div>

            {/* Right Column: Preview & Locking */}
            <div className="w-1/2 p-6 flex flex-col bg-slate-900/50">
                 <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">Preview & Logic</h3>
                 <div className="flex-1 overflow-y-auto space-y-6">
                     <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
                         {method === 'AI' && !generatedTask && !generatedItem && !generatedDowntime && !generatedUpgrade && !generatedEvent && !generatedPool && !generatedPower && <p className="text-slate-600 italic text-center">Preview Area</p>}
                         {mode === 'AUTOMATOR' && <div className="text-xs text-slate-400">Automators generate content on End Day. Ensure intervals and pools are correct.</div>}
                         {mode === 'CODEX' && <div className="text-xs text-slate-400">Codex entries store relationships and unlocked secrets.</div>}
                         {/* Simple Preview render logic would go here, omitting for brevity in diff */}
                     </div>
                     {mode !== 'POOL' && mode !== 'POWER' && mode !== 'AUTOMATOR' && mode !== 'CODEX' && (
                         <LockConditionBuilder 
                            conditions={lockConditions} 
                            onChange={setLockConditions}
                            availableTasks={allTasks.map(t => ({ id: t.id, title: t.title }))}
                            availableItems={allItems.map(i => ({ id: i.id, name: i.name }))}
                            availableUpgrades={allUpgrades.map(u => ({ id: u.id, name: u.name }))}
                         />
                     )}
                 </div>
                 <div className="pt-6 mt-auto border-t border-slate-800 flex justify-end">
                     <Button onClick={handleSave} disabled={method === 'AI' && !generatedTask && !generatedItem && !generatedDowntime && !generatedUpgrade && !generatedEvent && !generatedPool && !generatedPower} className="flex items-center gap-2"><Save size={16} /> {initialData ? 'Update' : 'Save'}</Button>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};
