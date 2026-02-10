
import React, { useState } from 'react';
import { GameState, TaskPool, CalendarEvent } from '../types';
import { Button } from '../components/ui/Button';
import { X, Calendar, Settings, Plus, Trash2, Info, MapPin, Briefcase, AlertTriangle, Coffee } from 'lucide-react';

interface DayConfigModalProps {
    day: number;
    gameState: GameState;
    onClose: () => void;
    onSaveConfig: (day: number, config: any) => void;
    onSaveEvent: (event: CalendarEvent) => void;
    onDeleteEvent: (eventId: string) => void;
}

export const DayConfigModal: React.FC<DayConfigModalProps> = ({ 
    day, 
    gameState, 
    onClose, 
    onSaveConfig,
    onSaveEvent,
    onDeleteEvent 
}) => {
    const currentConfig = gameState.dayConfigs[day] || { day };
    const dayEvents = gameState.calendarEvents.filter(e => e.day === day);

    const [selectedTaskPool, setSelectedTaskPool] = useState<string>(currentConfig.taskPoolId || '');
    const [selectedRandomPool, setSelectedRandomPool] = useState<string>(currentConfig.randomEventPoolId || '');
    const [randomChance, setRandomChance] = useState<number>(currentConfig.randomEventChance !== undefined ? currentConfig.randomEventChance * 100 : 30);
    const [newEventTitle, setNewEventTitle] = useState('');

    const handleSave = () => {
        onSaveConfig(day, {
            day,
            taskPoolId: selectedTaskPool || undefined,
            randomEventPoolId: selectedRandomPool || undefined,
            randomEventChance: randomChance / 100
        });
        onClose();
    };

    const handleQuickAddEvent = () => {
        if (!newEventTitle.trim()) return;
        const newEvent: CalendarEvent = {
            id: `evt-${Date.now()}`,
            day,
            title: newEventTitle,
            description: 'Manual entry',
            type: 'EVENT',
            isRandom: false
        };
        onSaveEvent(newEvent);
        setNewEventTitle('');
    };

    const getTaskIcon = (type: string) => {
        switch (type) {
          case 'Patrol': return <MapPin size={10} className="text-blue-400" />;
          case 'Work': return <Briefcase size={10} className="text-green-400" />;
          case 'Event': return <AlertTriangle size={10} className="text-amber-400" />;
          default: return <Coffee size={10} className="text-slate-400" />;
        }
    };

    const renderPoolPreview = (poolId: string) => {
        const pool = gameState.taskPools.find(p => p.id === poolId) || gameState.randomEventPools.find(p => p.id === poolId);
        if (!pool) return null;

        return (
            <div className="mt-2 bg-slate-950 p-3 rounded border border-slate-700 text-xs">
                <div className="font-bold text-slate-400 uppercase mb-2 flex items-center gap-1"><Info size={10} /> Pool Details: {pool.name}</div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                    {pool.tasks.length === 0 && <span className="text-slate-600 italic">No tasks assigned.</span>}
                    {pool.tasks.map(taskId => {
                        const task = gameState.taskPool.find(t => t.id === taskId);
                        return (
                            <div key={taskId} className="group relative flex justify-between items-center border-b border-slate-800 pb-1 last:border-0 hover:bg-slate-900 px-1 rounded cursor-help">
                                <div className="flex items-center gap-2">
                                    {task && getTaskIcon(task.type)}
                                    <span className="text-slate-300">{task ? task.title : taskId}</span>
                                </div>
                                <span className="text-slate-500 font-mono">Lvl {task?.difficulty}</span>
                                
                                {/* Hover Details */}
                                {task && (
                                    <div className="absolute left-0 bottom-6 z-50 w-48 bg-slate-800 border border-slate-600 rounded p-2 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                                        <div className="font-bold text-white mb-1">{task.title}</div>
                                        <div className="text-[10px] text-slate-400 mb-1">{task.description}</div>
                                        <div className="flex gap-1">
                                            <span className="bg-slate-700 text-white px-1 rounded text-[9px]">{task.requiredIdentity}</span>
                                            <span className="bg-slate-700 text-white px-1 rounded text-[9px]">{task.type}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Calendar className="text-blue-500" /> Day {day} Configuration
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Task Pools */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Assigned Task Pool</label>
                        <select 
                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                            value={selectedTaskPool}
                            onChange={(e) => setSelectedTaskPool(e.target.value)}
                        >
                            <option value="">(Default Global Pool)</option>
                            {gameState.taskPools.map(pool => (
                                <option key={pool.id} value={pool.id}>{pool.name} ({pool.tasks.length} tasks)</option>
                            ))}
                        </select>
                        <p className="text-[10px] text-slate-500 mt-1">This pool determines the standard missions available this day.</p>
                        {selectedTaskPool && renderPoolPreview(selectedTaskPool)}
                    </div>

                    {/* Random Events */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Random Event Pool</label>
                             <select 
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                                value={selectedRandomPool}
                                onChange={(e) => setSelectedRandomPool(e.target.value)}
                             >
                                <option value="">(Default Random Pool)</option>
                                {gameState.randomEventPools.map(pool => (
                                    <option key={pool.id} value={pool.id}>{pool.name}</option>
                                ))}
                             </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Random Chance: {randomChance}%</label>
                            <input 
                                type="range" 
                                min="0" max="100" 
                                value={randomChance}
                                onChange={(e) => setRandomChance(parseInt(e.target.value))}
                                className="w-full accent-blue-500"
                            />
                        </div>
                    </div>
                    {selectedRandomPool && renderPoolPreview(selectedRandomPool)}

                    {/* Events List */}
                    <div className="border-t border-slate-800 pt-4">
                         <h3 className="text-sm font-bold text-white mb-3">Day Events</h3>
                         <div className="space-y-2 mb-3">
                             {dayEvents.length === 0 && <p className="text-xs text-slate-500 italic">No specific events scheduled.</p>}
                             {dayEvents.map(evt => (
                                 <div key={evt.id} className="flex justify-between items-center bg-slate-800 p-2 rounded border border-slate-700">
                                     <span className="text-sm text-slate-200">{evt.title}</span>
                                     <button onClick={() => onDeleteEvent(evt.id)} className="text-slate-500 hover:text-red-400">
                                         <Trash2 size={14} />
                                     </button>
                                 </div>
                             ))}
                         </div>
                         <div className="flex gap-2">
                             <input 
                                type="text" 
                                placeholder="New Event Title" 
                                className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 text-sm"
                                value={newEventTitle}
                                onChange={(e) => setNewEventTitle(e.target.value)}
                             />
                             <Button size="sm" onClick={handleQuickAddEvent} disabled={!newEventTitle}>
                                 <Plus size={14} /> Add
                             </Button>
                         </div>
                    </div>
                </div>

                <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button variant="primary" onClick={handleSave}>Save Configuration</Button>
                </div>
             </div>
        </div>
    );
};
