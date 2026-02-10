
import React, { useState } from 'react';
import { GameState, CodexEntry, Player, Identity } from '../types';
import { Book, Users, Building2, HelpCircle, Edit3, Eye, EyeOff, PlusCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface QuestsCodexViewProps {
  gameState: GameState;
  player?: Player; // Optional to not break old uses, but needed for dynamic rep
  isEditorMode?: boolean;
  onEditCodex?: (entry: CodexEntry) => void;
  onEditQuest?: any; // kept for compatibility if needed but unused
  onToggleStage?: any;
}

export const QuestsCodexView: React.FC<QuestsCodexViewProps> = ({ 
    gameState, 
    player,
    isEditorMode,
    onEditCodex
}) => {
  const [selectedCodexId, setSelectedCodexId] = useState<string | null>(null);

  const selectedCodex = selectedCodexId ? gameState.codex.find(c => c.id === selectedCodexId) || null : null;

  const renderCodexIcon = (cat: CodexEntry['category']) => {
      switch(cat) {
          case 'NPC': return <Users size={16} className="text-blue-400" />;
          case 'FACTION': return <Building2 size={16} className="text-red-400" />;
          default: return <Book size={16} className="text-amber-400" />;
      }
  };

  const getReputation = (entry: CodexEntry) => {
      if (!entry.relationship) {
          if (player?.reputations) return player.reputations[entry.title] || 0;
          return 0;
      }
      
      if (entry.relationship.knowsIdentity) {
          return entry.relationship.civilianRep; 
      }
      
      return player?.identity === Identity.SUPER ? entry.relationship.superRep : entry.relationship.civilianRep;
  };

  const getReputationLabel = (val: number) => {
      if (val >= 80) return { text: 'Revered', color: 'text-yellow-400' };
      if (val >= 50) return { text: 'Trusted Ally', color: 'text-green-400' };
      if (val >= 20) return { text: 'Friendly', color: 'text-green-300' };
      if (val >= -20) return { text: 'Neutral', color: 'text-slate-400' };
      if (val >= -50) return { text: 'Unfriendly', color: 'text-orange-400' };
      if (val >= -80) return { text: 'Hostile', color: 'text-red-400' };
      return { text: 'Nemesis', color: 'text-red-600 font-bold' };
  };

  const handleAddCodex = () => {
      // Trigger the editor with a new template
      if (onEditCodex) {
          onEditCodex({
              id: '',
              title: 'New Entry',
              category: 'NPC',
              content: '',
              unlocked: true,
              relationship: { civilianRep: 0, superRep: 0, knowsIdentity: false }
          } as CodexEntry);
      }
  };

  // Filter entries based on visibility
  const visibleCodex = gameState.codex.filter(entry => entry.unlocked || isEditorMode);

  return (
    <div className="flex-1 bg-slate-950 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="p-8 pb-0">
            <h1 className="text-3xl font-black text-white tracking-tight mb-6 flex items-center gap-3">
                <Book className="text-slate-500" /> Database & Lore
            </h1>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
            {/* Sidebar List */}
            <div className="w-1/3 border-r border-slate-800 overflow-y-auto p-4 space-y-4">
                <div className="space-y-2">
                    {isEditorMode && (
                        <Button onClick={handleAddCodex} className="w-full mb-4 flex items-center justify-center gap-2 border-dashed border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-400">
                            <PlusCircle size={16} /> Add New Entry
                        </Button>
                    )}
                    {visibleCodex.length === 0 && (
                        <div className="text-center text-slate-500 italic py-10">
                            No entries discovered yet.
                        </div>
                    )}
                    {visibleCodex.map(entry => {
                        const rep = getReputation(entry);
                        const repConfig = getReputationLabel(rep);
                        
                        return (
                            <button 
                                key={entry.id}
                                onClick={() => setSelectedCodexId(entry.id)}
                                className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors relative group ${selectedCodexId === entry.id ? 'bg-slate-800 border-blue-500 border' : 'bg-slate-900 border border-slate-800 hover:border-slate-700'}`}
                            >
                                {isEditorMode && (
                                    <div 
                                        onClick={(e) => { e.stopPropagation(); onEditCodex && onEditCodex(entry); }}
                                        className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full shadow hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Edit3 size={10} />
                                    </div>
                                )}
                                {!entry.unlocked && isEditorMode && (
                                    <div className="absolute top-2 left-2 text-slate-500" title="Hidden from player">
                                        <EyeOff size={10} />
                                    </div>
                                )}
                                <div className="p-2 bg-slate-950 rounded relative">
                                    {renderCodexIcon(entry.category)}
                                </div>
                                <div className={`flex-1 min-w-0 ${!entry.unlocked ? 'opacity-50' : ''}`}>
                                    <div className="font-bold text-slate-200 truncate">{entry.title}</div>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-[10px] text-slate-500 uppercase">{entry.category}</span>
                                        {player && (entry.category === 'NPC' || entry.category === 'FACTION') && (
                                            <span className={`text-[10px] ${repConfig.color}`}>{rep > 0 ? '+' : ''}{rep}</span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Detail View */}
            <div className="w-2/3 p-8 overflow-y-auto bg-slate-900/50">
                {selectedCodex && (visibleCodex.some(c => c.id === selectedCodex.id)) ? (
                    <div className="animate-in fade-in slide-in-from-right-4 max-w-2xl">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                                {renderCodexIcon(selectedCodex.category)}
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-white flex items-center gap-2">
                                    {selectedCodex.title}
                                    {!selectedCodex.unlocked && isEditorMode && (
                                        <span title="Hidden">
                                            <EyeOff size={20} className="text-slate-500" />
                                        </span>
                                    )}
                                </h2>
                                <span className="text-sm font-mono text-slate-500 uppercase tracking-widest">{selectedCodex.category}</span>
                            </div>
                        </div>
                        
                        <div className="space-y-6">
                             <div className="prose prose-invert prose-slate bg-slate-950 p-6 rounded-lg border border-slate-800">
                                <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Description</h3>
                                <p className="text-lg leading-relaxed text-slate-300">{selectedCodex.content}</p>
                             </div>

                             {selectedCodex.appearance && (
                                 <div className="bg-slate-950 p-6 rounded-lg border border-slate-800">
                                     <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Appearance</h3>
                                     <p className="text-sm leading-relaxed text-slate-400">{selectedCodex.appearance}</p>
                                 </div>
                             )}

                             {/* Secrets */}
                             {selectedCodex.secrets && selectedCodex.secrets.length > 0 && (
                                 <div className="bg-slate-950 p-6 rounded-lg border border-slate-800">
                                     <div className="flex justify-between items-center mb-4">
                                         <h3 className="text-xs font-bold text-slate-500 uppercase">Secrets & Intel</h3>
                                         {isEditorMode && <span className="text-[10px] text-red-400 font-bold uppercase">Editor Mode Revealed</span>}
                                     </div>
                                     <div className="space-y-3">
                                         {selectedCodex.secrets.map((secret, i) => (
                                             <div key={i} className={`p-3 rounded border flex gap-3 ${secret.unlocked || isEditorMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-900/50 border-slate-800'}`}>
                                                 {secret.unlocked || isEditorMode ? (
                                                     <>
                                                         <Eye size={16} className={secret.unlocked ? "text-blue-500" : "text-red-500"} />
                                                         <span className={secret.unlocked ? "text-slate-300" : "text-red-300 italic"}>{secret.text}</span>
                                                     </>
                                                 ) : (
                                                     <>
                                                         <EyeOff size={16} className="text-slate-600" />
                                                         <span className="text-slate-600 italic">Undiscovered secret...</span>
                                                     </>
                                                 )}
                                             </div>
                                         ))}
                                     </div>
                                 </div>
                             )}

                            {player && (selectedCodex.category === 'NPC' || selectedCodex.category === 'FACTION') && (
                                <div className="mt-8 bg-slate-950 p-6 rounded-lg border border-slate-800">
                                    <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">Current Standing</h3>
                                    
                                    {/* Active Rep Display */}
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-2xl font-black">
                                            <span className={getReputationLabel(getReputation(selectedCodex)).color}>
                                                {getReputationLabel(getReputation(selectedCodex)).text}
                                            </span>
                                        </div>
                                        <div className="text-3xl font-mono text-white">
                                            {getReputation(selectedCodex)}
                                        </div>
                                    </div>
                                    <div className="w-full bg-slate-900 h-2 rounded-full mt-2 mb-6 overflow-hidden relative">
                                        <div className="absolute left-1/2 top-0 w-0.5 h-full bg-slate-700"></div>
                                        <div 
                                            className={`h-full transition-all duration-1000 ${getReputation(selectedCodex) > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                                            style={{ 
                                                width: `${Math.abs(getReputation(selectedCodex)) / 2}%`, 
                                                left: getReputation(selectedCodex) > 0 ? '50%' : undefined,
                                                right: getReputation(selectedCodex) < 0 ? '50%' : undefined,
                                            }}
                                        ></div>
                                    </div>

                                    {/* Detailed breakdown if available */}
                                    {selectedCodex.relationship && (
                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                                            <div>
                                                <div className="text-xs text-slate-500 uppercase mb-1">Civilian Rep</div>
                                                <div className={`font-mono ${selectedCodex.relationship.civilianRep > 0 ? 'text-green-400' : 'text-slate-400'}`}>
                                                    {selectedCodex.relationship.civilianRep}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-slate-500 uppercase mb-1">Super Rep</div>
                                                <div className={`font-mono ${selectedCodex.relationship.superRep > 0 ? 'text-green-400' : 'text-slate-400'}`}>
                                                    {selectedCodex.relationship.superRep}
                                                </div>
                                            </div>
                                            {selectedCodex.relationship.knowsIdentity && (
                                                <div className="col-span-2 text-xs text-red-400 font-bold bg-red-900/10 p-2 rounded text-center border border-red-900/30">
                                                    ! KNOWS SECRET IDENTITY !
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600">
                        <HelpCircle size={48} className="mb-4 opacity-20" />
                        <p>Select an entry to view details</p>
                    </div>
                )}
            </div>
        </div>
    </div>
    );
};