
import React, { useState } from 'react';
import { CalendarEvent, GameState } from '../types';
import { Calendar, AlertCircle, Star, Skull, Settings, Layers, Edit3 } from 'lucide-react';
import { DayConfigModal } from './DayConfigModal';

interface CalendarViewProps {
  currentDay: number;
  events: CalendarEvent[];
  gameState: GameState; // Need full state to see configs
  onSaveDayConfig: (day: number, config: any) => void;
  onSaveEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (id: string) => void;
  isEditorMode?: boolean;
  onEditEvent?: (event: CalendarEvent) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ 
    currentDay, 
    events, 
    gameState,
    onSaveDayConfig,
    onSaveEvent,
    onDeleteEvent,
    isEditorMode,
    onEditEvent
}) => {
  const [editingDay, setEditingDay] = useState<number | null>(null);

  // Generate next 28 days
  const days = Array.from({ length: 28 }, (_, i) => currentDay + i);

  const getEventForDay = (day: number) => events.find(e => e.day === day);
  const getDayConfig = (day: number) => gameState.dayConfigs[day];

  const renderEventIcon = (type: CalendarEvent['type']) => {
      switch(type) {
          case 'DEADLINE': return <Skull size={14} className="text-red-500" />;
          case 'EVENT': return <AlertCircle size={14} className="text-blue-500" />;
          case 'HOLIDAY': return <Star size={14} className="text-amber-500" />;
      }
  };

  return (
    <div className="flex-1 bg-slate-950 p-8 overflow-y-auto">
       <header className="mb-8 flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
               <Calendar className="text-slate-500" /> Schedule
           </h1>
           <p className="text-slate-400 mt-1">Click a day to edit pools and events.</p>
        </div>
        <div className="text-right">
            <span className="text-4xl font-mono font-bold text-white block">Day {currentDay}</span>
            <span className="text-xs text-slate-500 uppercase tracking-widest">Current Date</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {days.map(day => {
            const event = getEventForDay(day);
            const config = getDayConfig(day);
            const isToday = day === currentDay;
            const hasConfig = config && (config.taskPoolId || config.randomEventPoolId);
            
            return (
                <button 
                  key={day} 
                  onClick={() => setEditingDay(day)}
                  className={`min-h-[120px] p-4 rounded-lg border flex flex-col transition-all hover:border-slate-500 text-left relative group
                    ${isToday ? 'bg-slate-800 border-blue-500 ring-1 ring-blue-500/50' : 'bg-slate-900 border-slate-800'}
                  `}
                >
                    <div className="flex justify-between items-start mb-2 w-full">
                        <span className={`text-sm font-mono font-bold ${isToday ? 'text-blue-400' : 'text-slate-600'}`}>
                            Day {day}
                        </span>
                        {isToday && <span className="text-[10px] bg-blue-900 text-blue-200 px-1.5 py-0.5 rounded">TODAY</span>}
                        {hasConfig && <span className="text-[10px] bg-purple-900/50 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800 flex items-center gap-1"><Layers size={8}/> CONFIG</span>}
                    </div>
                    
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Settings size={14} className="text-slate-500 hover:text-white" />
                    </div>

                    {event ? (
                        <div 
                            className="mt-auto bg-slate-950 p-2 rounded border border-slate-700 w-full relative group/event"
                            onClick={(e) => {
                                if (isEditorMode && onEditEvent) {
                                    e.stopPropagation();
                                    onEditEvent(event);
                                }
                            }}
                        >
                            {isEditorMode && (
                                <div className="absolute -top-1 -right-1 bg-red-600 text-white p-0.5 rounded-full shadow z-20">
                                    <Edit3 size={8} />
                                </div>
                            )}
                            <div className="flex items-center gap-2 mb-1">
                                {renderEventIcon(event.type)}
                                <span className="text-xs font-bold text-slate-200 truncate">{event.title}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-tight">{event.description}</p>
                        </div>
                    ) : (
                        <div className="mt-auto text-xs text-slate-700 italic">No events</div>
                    )}
                </button>
            );
        })}
      </div>

      {editingDay && (
          <DayConfigModal 
              day={editingDay} 
              gameState={gameState} 
              onClose={() => setEditingDay(null)}
              onSaveConfig={onSaveDayConfig}
              onSaveEvent={onSaveEvent}
              onDeleteEvent={onDeleteEvent}
          />
      )}
    </div>
  );
};
