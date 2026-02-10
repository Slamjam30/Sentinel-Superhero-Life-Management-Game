
import React, { useState } from 'react';
import { Player, Identity, PlayerResources, PowerUpgrade, Power } from '../types';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Button } from '../components/ui/Button';
import { User, Shield, Zap, Brain, Smile, Activity, Heart, ArrowUpCircle, Tag, Plus, X, Edit3, Users, Info, Eye, Trash2 } from 'lucide-react';
import { getEffectiveStats } from '../utils/mechanics';
import { PowerSelectorModal } from './PowerSelectorModal';

interface CharacterSheetProps {
  player: Player;
  onToggleIdentity: () => void;
  onOpenSkillTree?: () => void;
  isEditorMode?: boolean;
  onUpdatePlayer?: (updates: Partial<Player>) => void;
  onEditPower?: (power: Power) => void;
  onAddPower?: (power: Power) => void;
  onDeletePower?: (powerId: string) => void;
  availablePowers?: Power[];
}

export const CharacterSheet: React.FC<CharacterSheetProps> = ({ 
    player, 
    onToggleIdentity, 
    onOpenSkillTree,
    isEditorMode,
    onUpdatePlayer,
    onEditPower,
    onAddPower,
    onDeletePower,
    availablePowers = []
}) => {
  const isSuper = player.identity === Identity.SUPER;
  const [newTag, setNewTag] = useState('');
  const [selectedAbility, setSelectedAbility] = useState<{name: string, upgrade?: PowerUpgrade} | null>(null);
  const [showPowerSelector, setShowPowerSelector] = useState(false);

  const effectiveStats = getEffectiveStats(player);

  const handleResourceChange = (key: keyof PlayerResources, val: string) => {
      if (!onUpdatePlayer) return;
      onUpdatePlayer({
          resources: {
              ...player.resources,
              [key]: parseInt(val) || 0
          }
      });
  };

  const handleStatChange = (key: keyof typeof player.stats, val: string) => {
      if (!onUpdatePlayer) return;
      onUpdatePlayer({
          stats: {
              ...player.stats,
              [key]: parseFloat(val) || 0
          }
      });
  };

  const handleAppearanceChange = (text: string) => {
      if (!onUpdatePlayer) return;
      if (isSuper) {
          onUpdatePlayer({ superAppearance: text });
      } else {
          onUpdatePlayer({ civilianAppearance: text });
      }
  };

  const handleAddTag = () => {
      if (newTag && onUpdatePlayer) {
          onUpdatePlayer({ tags: [...player.tags, newTag] });
          setNewTag('');
      }
  };

  const handleRemoveTag = (tag: string) => {
      if (onUpdatePlayer) {
          onUpdatePlayer({ tags: player.tags.filter(t => t !== tag) });
      }
  };

  const findAbilityUpgrade = (powerIndex: number, abilityName: string) => {
      const power = player.powers[powerIndex];
      return power?.upgrades.find(u => u.name === abilityName);
  };

  const topRelations = (Object.entries(player.reputations) as [string, number][])
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 3);

  return (
    <div className="flex flex-col h-full bg-slate-900 relative overflow-hidden">
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
            
            <div className="p-6 border-b border-slate-800 relative">
                {/* Identity Header */}
                <div className={`absolute top-0 left-0 w-full h-1 ${isSuper ? 'bg-amber-500' : 'bg-blue-500'}`} />
                <div className="flex items-center justify-between mb-4 mt-2">
                <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${isSuper ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                    {isSuper ? <Shield size={24} /> : <User size={24} />}
                    </div>
                    <div>
                    <h2 className="text-xl font-bold text-white">{isSuper ? player.superName : player.civilianName}</h2>
                    <p className="text-xs text-slate-400 font-mono uppercase">{player.identity} IDENTITY</p>
                    </div>
                </div>
                </div>

                <div className="mb-6">
                    <div className="text-xs text-slate-500 font-bold uppercase mb-1 flex items-center gap-1"><Eye size={12}/> Current Appearance</div>
                    <textarea 
                        className="w-full bg-transparent border-0 text-sm text-slate-300 italic resize-none focus:bg-slate-800/50 focus:ring-0 rounded" 
                        value={isSuper ? player.superAppearance : player.civilianAppearance}
                        onChange={(e) => handleAppearanceChange(e.target.value)}
                        placeholder={`Describe ${isSuper ? player.superName : player.civilianName}'s look...`}
                        rows={3}
                    />
                </div>

                <Button 
                variant={isSuper ? 'primary' : 'secondary'} 
                className="w-full mb-6"
                onClick={onToggleIdentity}
                >
                {isSuper ? 'Switch to Civilian' : 'Suit Up'}
                </Button>

                {/* Resources */}
                <div className="space-y-4">
                {isEditorMode && onUpdatePlayer ? (
                    <div className="space-y-2 bg-slate-950 p-3 rounded border border-red-900/50">
                        <div className="text-xs font-bold text-red-400 uppercase flex items-center gap-2"><Edit3 size={10}/> Editor Overrides</div>
                        
                        {['mask', 'fame', 'publicOpinion', 'money'].map(res => (
                            <div key={res} className="flex justify-between items-center text-xs">
                                <label className="text-slate-400 uppercase w-20">{res}</label>
                                <input 
                                    type="number" 
                                    className="bg-slate-900 border border-slate-700 rounded w-16 px-1 text-right text-slate-200"
                                    value={player.resources[res as keyof PlayerResources]}
                                    onChange={(e) => handleResourceChange(res as keyof PlayerResources, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        <ProgressBar value={player.resources.mask} max={100} label="Mask Integrity" color="bg-purple-500" />
                        <ProgressBar value={player.resources.fame} max={100} label="Fame" color="bg-yellow-500" />
                        <ProgressBar value={player.resources.publicOpinion + 100} max={200} label="Public Opinion" color={player.resources.publicOpinion > 0 ? "bg-green-500" : "bg-red-500"} showValue={false} />
                        <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded border border-slate-700">
                            <span className="text-sm text-slate-400">Funds</span>
                            <span className="text-lg font-mono font-bold text-green-400">${player.resources.money}</span>
                        </div>
                    </>
                )}
                </div>
            </div>

            {/* Stats (Attributes) */}
            <div className="p-6 border-b border-slate-800">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Attributes</h3>
                <div className="grid grid-cols-2 gap-3">
                {[
                    { label: 'Smarts', key: 'smarts', color: 'text-blue-400', icon: Brain },
                    { label: 'Charm', key: 'charm', color: 'text-pink-400', icon: Smile },
                    { label: 'Coord', key: 'coordination', color: 'text-green-400', icon: Activity },
                    { label: 'Will', key: 'will', color: 'text-red-400', icon: Heart }
                ].map(stat => {
                    const rawBase = player.stats[stat.key as keyof typeof player.stats];
                    const base = Math.floor(rawBase);
                    const total = effectiveStats[stat.key as keyof typeof player.stats];
                    const bonus = total - base;
                    const progress = rawBase % 1; // Decimal part for progress
                    
                    return (
                        <div key={stat.key} className="bg-slate-800/30 p-3 rounded border border-slate-700/50 flex flex-col justify-between">
                            <div className={`flex items-center space-x-2 mb-2 ${stat.color}`}>
                                <stat.icon size={16} />
                                <span className="text-xs font-bold uppercase tracking-tight">{stat.label}</span>
                            </div>
                            {isEditorMode && onUpdatePlayer ? (
                                <input 
                                    type="number" 
                                    step="0.1"
                                    className="bg-slate-900 border border-slate-700 rounded w-full px-1 text-center font-bold text-white"
                                    value={rawBase}
                                    onChange={(e) => handleStatChange(stat.key as keyof typeof player.stats, e.target.value)}
                                />
                            ) : (
                                <div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xl font-bold text-white">{total}</span>
                                        {bonus > 0 && <span className="text-[10px] text-green-400 font-mono">(+{bonus})</span>}
                                        {bonus < 0 && <span className="text-[10px] text-red-400 font-mono">({bonus})</span>}
                                    </div>
                                    {/* Stat XP Progress Bar */}
                                    <div className="w-full bg-slate-900 h-1 rounded-full mt-2 overflow-hidden" title={`${Math.round(progress * 100)}% to next level`}>
                                        <div className="bg-slate-500 h-full transition-all" style={{ width: `${progress * 100}%` }}></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
                </div>
            </div>

            {/* Relations */}
            {topRelations.length > 0 && (
                <div className="p-6 border-b border-slate-800">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Users size={12} /> Key Relationships
                    </h3>
                    <div className="space-y-2">
                        {topRelations.map(([name, val]) => (
                            <div key={name} className="flex justify-between items-center text-xs">
                                <span className="text-slate-300 truncate max-w-[70%]">{name}</span>
                                <span className={`font-mono font-bold ${val > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {val > 0 ? '+' : ''}{val}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tags */}
            <div className="p-6 border-b border-slate-800">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Tag size={12} /> Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                    {player.tags.map(tag => (
                        <span key={tag} className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-300 border border-slate-700 flex items-center gap-1">
                            {tag}
                            {isEditorMode && (
                                <button onClick={() => handleRemoveTag(tag)} className="text-slate-500 hover:text-red-400">
                                    <X size={10} />
                                </button>
                            )}
                        </span>
                    ))}
                    {isEditorMode && (
                        <div className="flex items-center gap-1 w-full mt-2">
                            <input 
                                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white flex-1"
                                placeholder="New Tag"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                            />
                            <button onClick={handleAddTag} className="bg-slate-800 p-1 rounded hover:bg-slate-700 text-green-400">
                                <Plus size={14} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Powers */}
            <div className="p-6 pb-20"> {/* Extra padding bottom for scrolling */}
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Powers</h3>
                    <div className="flex gap-2 items-center">
                        {isEditorMode && onAddPower && (
                            <button onClick={() => setShowPowerSelector(true)} className="text-xs bg-slate-800 hover:bg-slate-700 p-1 rounded text-green-400" title="Add Power">
                                <Plus size={14} />
                            </button>
                        )}
                        {onOpenSkillTree && (
                            <button onClick={onOpenSkillTree} className="text-xs text-amber-500 flex items-center gap-1 hover:underline">
                                {player.skillPoints > 0 && <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>}
                                Tree ({player.skillPoints} SP)
                            </button>
                        )}
                    </div>
                </div>
                <div className="space-y-3">
                {player.powers.map((power, pIdx) => (
                    <div key={power.id} className="bg-slate-800 p-3 rounded-lg border border-slate-700 group relative">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2 text-amber-400">
                            <Zap size={16} />
                            <span className="font-bold">{power.name}</span>
                            <span className="text-xs bg-amber-500/20 px-1.5 rounded text-amber-300">Lvl {power.level}</span>
                        </div>
                        {isEditorMode && (
                             <div className="flex gap-1">
                                 {onEditPower && (
                                     <button onClick={() => onEditPower(power)} className="text-slate-500 hover:text-white p-1 rounded hover:bg-slate-700"><Edit3 size={14} /></button>
                                 )}
                                 {onDeletePower && (
                                     <button onClick={() => onDeletePower(power.id)} className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-slate-700"><Trash2 size={14} /></button>
                                 )}
                             </div>
                        )}
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{power.description}</p>
                    
                    <div className="w-full bg-slate-900 h-1.5 rounded-full mb-3 overflow-hidden">
                        <div className="bg-amber-600 h-full" style={{ width: `${(power.xp / power.maxXp) * 100}%` }}></div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                        {power.abilities.map(ab => (
                        <button 
                            key={ab} 
                            onClick={() => setSelectedAbility({ name: ab, upgrade: findAbilityUpgrade(pIdx, ab) })}
                            className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-300 border border-slate-700 hover:border-amber-500 hover:text-white transition-colors flex items-center gap-1"
                        >
                            {ab} <Info size={8} className="opacity-50"/>
                        </button>
                        ))}
                    </div>
                    </div>
                ))}
                {player.powers.length === 0 && <div className="text-xs text-slate-500 italic text-center">No powers acquired.</div>}
                </div>
                
                {onOpenSkillTree && (
                    <Button variant="ghost" className="w-full mt-4 border border-dashed border-slate-700 text-slate-500 hover:text-white" onClick={onOpenSkillTree}>
                        <ArrowUpCircle size={16} className="mr-2" /> Open Skill Tree
                    </Button>
                )}
            </div>

        </div>

        {/* Ability Detail Popover */}
        {selectedAbility && (
          <div className="absolute inset-0 bg-slate-950/95 z-50 flex flex-col p-6 animate-in fade-in slide-in-from-right-4">
              <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Zap size={20} className="text-amber-500" />
                      {selectedAbility.name}
                  </h3>
                  <button onClick={() => setSelectedAbility(null)} className="text-slate-400 hover:text-white">
                      <X size={24} />
                  </button>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                  {selectedAbility.upgrade ? (
                      <div className="space-y-4">
                          <div className="bg-slate-900 p-4 rounded border border-slate-800">
                              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Description</label>
                              <p className="text-slate-200 text-sm leading-relaxed">{selectedAbility.upgrade.description}</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                              <div className="bg-slate-900 p-3 rounded border border-slate-800">
                                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Type</label>
                                  <span className="text-sm font-mono text-blue-400">{selectedAbility.upgrade.type}</span>
                              </div>
                              <div className="bg-slate-900 p-3 rounded border border-slate-800">
                                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Level Req</label>
                                  <span className="text-sm font-mono text-white">{selectedAbility.upgrade.requiredLevel}</span>
                              </div>
                          </div>

                          <div className="bg-slate-900 p-3 rounded border border-slate-800">
                              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Limits / Notes</label>
                              <p className="text-xs text-slate-400 italic">
                                  {selectedAbility.upgrade.cost > 2 ? 'High energy consumption. Requires focus.' : 'Standard ability. Reliable.'}
                              </p>
                          </div>
                      </div>
                  ) : (
                      <div className="text-slate-500 italic text-sm text-center mt-10">
                          Basic ability. No advanced data available.
                      </div>
                  )}
              </div>
              
              <Button variant="ghost" onClick={() => setSelectedAbility(null)} className="mt-4">Close</Button>
          </div>
      )}

      {showPowerSelector && onAddPower && (
          <PowerSelectorModal 
              availablePowers={availablePowers} 
              onClose={() => setShowPowerSelector(false)} 
              onSelect={(p) => { onAddPower(p); setShowPowerSelector(false); }} 
          />
      )}
    </div>
  );
};
