
import React, { useState, useEffect, useRef } from 'react';
import { Task, Player, ScenarioMode, ScenarioNode, ScenarioResult, SuccessLevel, PlayerResources, PlayerStats, Identity, CodexEntry, TimelineEvent, NewsIssue, TaskType, Item } from '../types';
import { Button } from '../components/ui/Button';
import { getDMResponse, generateScenarioSummary, evaluateSuitUp, generateCodexEntryFromHistory } from '../services/gemini/narrator';
import { Send, Dice5, History, User, Shield, CheckCircle2, XCircle, Trophy, AlertTriangle, Skull, Award, Edit3, Users, Zap, Sword, Target, Save, BookPlus, RefreshCw, Trash2, X, Terminal, Map, Lock, Eye, MessageSquare, Package, Lightbulb, PlusCircle } from 'lucide-react';
import { getPlayerAveragePowerLevel } from '../utils/mechanics';

interface ScenarioPlayerProps {
  task: Task;
  player: Player;
  timeline?: TimelineEvent[];
  activeNews?: NewsIssue;
  codex: CodexEntry[]; // New prop for world context
  allItems?: Item[]; // New prop for item lookup
  onComplete: (success: boolean, rewards?: any, summary?: string, reputationChanges?: Record<string, number>) => void;
  onExit: () => void;
  onIdentitySwitch: (newIdentity: Identity, maskPenalty: number) => void;
  onAddCodexEntry: (entry: Partial<CodexEntry>, initialRep: number) => void;
  onUnlockSecret?: (entityTitle: string, secretText: string) => void;
}

const LoreLink: React.FC<{ text: string, entry?: CodexEntry, identity: Identity }> = ({ text, entry, identity }) => {
    const [showTooltip, setShowTooltip] = useState(false);

    if (!entry) return <span className="text-yellow-400 font-bold">{text}</span>;

    const rep = entry.relationship ? (
        identity === Identity.SUPER ? entry.relationship.superRep : entry.relationship.civilianRep
    ) : 0;

    return (
        <span 
            className="relative inline-block z-10"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <span className="text-yellow-400 font-bold border-b border-dashed border-yellow-400/50 cursor-help">{text}</span>
            
            {showTooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-slate-900 border border-amber-500/30 rounded-lg shadow-[0_0_25px_rgba(0,0,0,0.8)] p-4 z-50 animate-in fade-in zoom-in-95 pointer-events-none">
                    <div className="flex justify-between items-start mb-2 border-b border-slate-800 pb-2">
                        <span className="font-bold text-white text-sm">{entry.title}</span>
                        <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 uppercase tracking-wider">{entry.category}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-6 mb-3">
                        {entry.content}
                    </p>
                    {(entry.category === 'NPC' || entry.category === 'FACTION') && (
                         <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[10px]">
                             <span className="text-slate-500 uppercase">Standing ({identity === Identity.SUPER ? 'Hero' : 'Civilian'})</span>
                             <span className={`font-mono font-bold ${rep > 0 ? 'text-green-400' : rep < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                {rep > 0 ? '+' : ''}{rep}
                             </span>
                         </div>
                    )}
                    {/* Secrets Hint */}
                    {entry.secrets && entry.secrets.some(s => s.unlocked) && (
                        <div className="mt-2 text-[10px] text-purple-400 flex items-center gap-1 border-t border-slate-800 pt-2">
                            <Eye size={10} /> {entry.secrets.filter(s => s.unlocked).length} Secrets Known
                        </div>
                    )}
                </div>
            )}
        </span>
    );
};

export const ScenarioPlayer: React.FC<ScenarioPlayerProps> = ({ 
    task, 
    player, 
    timeline,
    activeNews,
    codex,
    allItems = [],
    onComplete, 
    onExit, 
    onIdentitySwitch, 
    onAddCodexEntry,
    onUnlockSecret
}) => {
  const [view, setView] = useState<'PLAY' | 'RESULTS'>('PLAY');
  const [currentNodeId, setCurrentNodeId] = useState<string | undefined>(task.initialNodeId);
  const [structuredLog, setStructuredLog] = useState<{text: string, choice?: string}[]>([]);
  
  // Results State
  const [resultData, setResultData] = useState<ScenarioResult | null>(null);
  const [isEditingRewards, setIsEditingRewards] = useState(false);
  const [manualRewards, setManualRewards] = useState<any>({});
  const [manualReputations, setManualReputations] = useState<Record<string, number>>({});
  
  // Codex & Gen State
  const [newCodexTarget, setNewCodexTarget] = useState('');
  const [newCodexCategory, setNewCodexCategory] = useState<'NPC' | 'FACTION' | 'LORE' | 'LOCATION'>('NPC');
  const [isGeneratingCodex, setIsGeneratingCodex] = useState(false);
  
  // Suggestions
  const [suggestionInput, setSuggestionInput] = useState('');
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);

  // Freeform state
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'model', text: string, contextSnapshot?: string}[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Message Editing State
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  
  // Suit Up Modal
  const [showSuitUp, setShowSuitUp] = useState(false);
  const [suitUpMethod, setSuitUpMethod] = useState("");
  const [isEvaluatingSuitUp, setIsEvaluatingSuitUp] = useState(false);
  const [suitUpEvaluation, setSuitUpEvaluation] = useState<{maskPenalty: number, reasoning: string} | null>(null);

  // Finish Confirmation
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);

  // Context View
  const [showContext, setShowContext] = useState(false);
  const [activeContextSnapshot, setActiveContextSnapshot] = useState<string>(''); // For modal
  const [showTranscript, setShowTranscript] = useState(false);

  // Difficulty Calc
  const avgPowerLevel = getPlayerAveragePowerLevel(player);
  const diffGap = task.difficulty - avgPowerLevel;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (task.mode === ScenarioMode.FREEFORM && chatHistory.length === 0) {
      const initialPrompt = `SCENARIO START: ${task.title}. \nCONTEXT: ${task.context || task.description}`;
      setChatHistory([{ role: 'model', text: task.context || task.description, contextSnapshot: "Initial Context" }]);
    } else if (task.mode === ScenarioMode.STRUCTURED && currentNodeId) {
       if (structuredLog.length === 0 && task.nodes && task.nodes[currentNodeId]) {
         setStructuredLog([{ text: task.nodes[currentNodeId].text }]);
       }
    }
  }, [task, currentNodeId]);

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, structuredLog]);

  // Handle parsing secrets from AI response
  useEffect(() => {
      const lastMsg = chatHistory[chatHistory.length - 1];
      if (lastMsg && lastMsg.role === 'model' && onUnlockSecret) {
          const secretRegex = /\[SECRET:\s*([^|]+)\s*\|\s*([^\]]+)\]/g;
          let match;
          while ((match = secretRegex.exec(lastMsg.text)) !== null) {
              const entityName = match[1].trim();
              const secretText = match[2].trim();
              onUnlockSecret(entityName, secretText);
          }
      }
  }, [chatHistory, onUnlockSecret]);

  const finishScenario = async (success: boolean, rewards?: any, finalSummary?: string) => {
      let summaryText = finalSummary;
      let level = success ? SuccessLevel.COMPLETE_SUCCESS : SuccessLevel.FAILURE;
      let aiRewards = {};
      let reputationChanges = {};

      if (!summaryText && task.mode === ScenarioMode.FREEFORM) {
          setIsLoading(true);
          const aiResult = await generateScenarioSummary(chatHistory, task.reputationTargets);
          summaryText = aiResult.summary;
          level = aiResult.successLevel;
          aiRewards = aiResult.suggestedRewards || {};
          reputationChanges = aiResult.reputationChanges || {};
          setIsLoading(false);
      } else if (!summaryText) {
          summaryText = success ? "Mission accomplished successfully." : "Mission failed.";
      }

      const finalRewards = Object.keys(aiRewards).length > 0 ? aiRewards : rewards || task.rewards || {};
      
      // Preserve original item rewards if AI didn't suggest any (AI usually doesn't know item IDs)
      if (task.rewards && task.rewards.itemIds && (!finalRewards.itemIds)) {
          finalRewards.itemIds = task.rewards.itemIds;
      }

      // Preserve targetXp (Training logic) which is calculated by engine before scenario
      if (task.rewards && task.rewards.targetXp) {
          finalRewards.targetXp = task.rewards.targetXp;
      }

      setResultData({
          success: [SuccessLevel.COMPLETE_SUCCESS, SuccessLevel.PARTIAL_SUCCESS, SuccessLevel.BARELY_SUCCESS].includes(level),
          successLevel: level,
          rewards: finalRewards,
          reputationChanges: reputationChanges,
          summary: summaryText || "Scenario Concluded."
      });
      setManualRewards(finalRewards);
      setManualReputations(reputationChanges);
      setView('RESULTS');
  };

  const handleFinalExit = () => {
      // Append suggestions to rewards if any
      const finalRewardsWithSuggestions = {
          ...manualRewards,
          newSuggestions: currentSuggestions.length > 0 ? currentSuggestions : undefined
      };

      if (resultData) {
          onComplete(resultData.success, finalRewardsWithSuggestions, resultData.summary, manualReputations);
      } else {
          onExit();
      }
  };

  const handleAddSuggestion = () => {
      if (suggestionInput.trim()) {
          setCurrentSuggestions([...currentSuggestions, suggestionInput.trim()]);
          setSuggestionInput('');
      }
  };

  const handleRemoveSuggestion = (index: number) => {
      setCurrentSuggestions(currentSuggestions.filter((_, i) => i !== index));
  };

  const handleGenerateCodex = async () => {
      if (!newCodexTarget.trim()) return;
      setIsGeneratingCodex(true);
      const result = await generateCodexEntryFromHistory(chatHistory, newCodexTarget, newCodexCategory);
      if (result.entry) {
          onAddCodexEntry(result.entry, result.initialReputation);
          setNewCodexTarget('');
      }
      setIsGeneratingCodex(false);
  };

  const handleOptionClick = (option: ScenarioNode['options'][0]) => {
    setStructuredLog(prev => [
      ...prev.map(p => ({ ...p })), // copy
      { text: `> ${option.text}`, choice: 'user' },
      { text: option.outcome || "..." }
    ]);

    if (option.nextNodeId) {
      const nextNode = task.nodes?.[option.nextNodeId];
      if (nextNode) {
        setCurrentNodeId(option.nextNodeId);
        setStructuredLog(prev => [...prev, { text: nextNode.text }]);
      }
    } else {
      setTimeout(() => finishScenario(true, option.rewards), 1000);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input;
    setInput('');
    const newHistory = [...chatHistory, { role: 'user' as const, text: userMsg }];
    setChatHistory(newHistory);
    setIsLoading(true);

    const { text, contextSnapshot } = await getDMResponse(
        newHistory, 
        task.context || '', 
        player, 
        task.difficulty,
        codex,
        task.type,
        task.reputationTargets,
        timeline,
        activeNews,
        task.listensToNews
    );
    setChatHistory([...newHistory, { role: 'model', text: text, contextSnapshot: contextSnapshot }]);
    setIsLoading(false);
  };

  const openContext = (snapshot: string) => {
      setActiveContextSnapshot(snapshot);
      setShowContext(true);
  };

  // --- Message Editing & Management ---

  const handleEditStart = (index: number, text: string) => {
    setEditingIndex(index);
    setEditValue(text);
  };

  const handleEditSave = () => {
    if (editingIndex === null) return;
    const newHistory = [...chatHistory];
    newHistory[editingIndex].text = editValue;
    setChatHistory(newHistory);
    setEditingIndex(null);
    setEditValue('');
  };

  const handleRewind = (index: number) => {
      if (window.confirm("Rewind to this point? All subsequent messages will be lost.")) {
          const newHistory = chatHistory.slice(0, index);
          setChatHistory(newHistory);
      }
  };

  const handleRegenerate = async () => {
      if (isLoading) return;
      let targetHistory = [...chatHistory];
      if (targetHistory.length > 0 && targetHistory[targetHistory.length - 1].role === 'model') {
          targetHistory.pop();
      }
      if (targetHistory.length === 0) return;

      setIsLoading(true);
      setChatHistory(targetHistory);

      const { text, contextSnapshot } = await getDMResponse(
          targetHistory,
          task.context || '', 
          player, 
          task.difficulty,
          codex,
          task.type,
          task.reputationTargets,
          timeline,
          activeNews,
          task.listensToNews
      );
      setChatHistory([...targetHistory, { role: 'model', text: text, contextSnapshot: contextSnapshot }]);
      setIsLoading(false);
  };

  const handleSuitUpAnalyze = async () => {
      if (!suitUpMethod) return;
      setIsEvaluatingSuitUp(true);
      const context = `Location: ${task.type === TaskType.PATROL ? 'Public Street' : 'Mission Site'}. Current Situation: ${task.description}.`;
      const result = await evaluateSuitUp(suitUpMethod, context);
      setSuitUpEvaluation(result);
      setIsEvaluatingSuitUp(false);
  };

  const handleSuitUpConfirm = () => {
      if (suitUpEvaluation) {
          const newIdentity = player.identity === Identity.CIVILIAN ? Identity.SUPER : Identity.CIVILIAN;
          onIdentitySwitch(newIdentity, suitUpEvaluation.maskPenalty);
          setShowSuitUp(false);
          setSuitUpEvaluation(null);
          setSuitUpMethod("");
      }
  };

  const getSuccessLevelConfig = (level: SuccessLevel): { label: string, color: string, icon: React.ReactNode } => {
      switch(level) {
          case SuccessLevel.COMPLETE_SUCCESS: return { label: 'Complete Success', color: 'text-green-400', icon: <Trophy size={48} className="text-green-500" /> };
          case SuccessLevel.PARTIAL_SUCCESS: return { label: 'Partial Success', color: 'text-blue-400', icon: <CheckCircle2 size={48} className="text-blue-500" /> };
          case SuccessLevel.BARELY_SUCCESS: return { label: 'Barely Succeeded', color: 'text-amber-400', icon: <Award size={48} className="text-amber-500" /> };
          case SuccessLevel.FAILURE: return { label: 'Failure', color: 'text-orange-400', icon: <XCircle size={48} className="text-orange-500" /> };
          case SuccessLevel.MAJOR_FAILURE: return { label: 'Major Failure', color: 'text-red-500', icon: <AlertTriangle size={48} className="text-red-600" /> };
          case SuccessLevel.CRITICAL_FAILURE: return { label: 'Critical Failure', color: 'text-red-700', icon: <Skull size={48} className="text-red-800" /> };
          default: return { label: 'Unknown', color: 'text-slate-400', icon: <History size={48} /> };
      }
  }

  const getThreatLevel = () => {
      if (diffGap <= -2) return { text: 'Trivial', color: 'bg-green-500' };
      if (diffGap <= 0) return { text: 'Balanced', color: 'bg-blue-500' };
      if (diffGap <= 2) return { text: 'Risky', color: 'bg-orange-500' };
      if (diffGap <= 4) return { text: 'Dangerous', color: 'bg-red-500' };
      return { text: 'Suicidal', color: 'bg-red-700 animate-pulse' };
  };

  const renderFormattedText = (text: string) => {
    // 1. Highlight Codex Entries
    // Sort codex by length desc to handle overlapping names (e.g. "The Mayor" inside "The Mayor's Office")
    const sortedCodex = [...codex].sort((a, b) => b.title.length - a.title.length);

    let formattedText = text;
    sortedCodex.forEach(entry => {
        if (entry.title.length > 3) {
            const regex = new RegExp(`\\b${entry.title}\\b`, 'gi');
            formattedText = formattedText.replace(regex, (match) => `@@HIGHLIGHT:${match}@@`);
        }
    });

    // 2. Parse Blocks ([ROLL: ...], [SECRET: ...], [ENEMY ACTION...])
    const blockRegex = /\[(CHECK|ENEMY ACTION|ROLL|SECRET)(?::\s*|:\s*|:)([^\]]+)\]/gi;
    const parts: string[] = formattedText.split(blockRegex); 

    const elements: React.ReactNode[] = [];
    for (let i = 0; i < parts.length; i += 3) {
        // Text Content
        if (parts[i]) {
            const segments = parts[i].split('@@HIGHLIGHT:');
            const processedSegments = segments.map((seg, idx) => {
                if (idx === 0) return <span key={idx}>{seg}</span>;
                const splitEnd = seg.split('@@');
                const matchedText = splitEnd[0];
                const rest = splitEnd[1];
                
                // Find entry
                const entry = codex.find(c => c.title.toLowerCase() === matchedText.toLowerCase());

                return (
                    <React.Fragment key={idx}>
                        <LoreLink text={matchedText} entry={entry} identity={player.identity} />
                        <span>{rest}</span>
                    </React.Fragment>
                );
            });
            elements.push(<p key={`t-${i}`} className="whitespace-pre-wrap inline">{processedSegments}</p>);
        }
        
        // Block Content
        if (i + 1 < parts.length) {
            const type = parts[i+1].toUpperCase();
            const content = parts[i+2];
            
            if (type === 'ROLL') {
                // Expected: [ROLL: Punch | 15 + 10 (25) vs DC 15 | SUCCESS]
                const splitContent = (content || '').split('|').map(s => s.trim());
                const action = splitContent[0];
                const rollData = splitContent[1];
                const result = splitContent[2];
                
                const isSuccess = result?.toLowerCase().includes('success') || result?.toLowerCase().includes('hit');
                
                elements.push(
                    <div key={`roll-${i}`} className="my-2 p-3 bg-slate-950 border border-slate-700 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between shadow-md max-w-md">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full flex-shrink-0 ${isSuccess ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                                <Dice5 size={20} />
                            </div>
                            <div className="min-w-0">
                                <div className="font-bold text-sm text-white truncate">{action || 'Action'}</div>
                                <div className="text-xs text-slate-400 font-mono break-words">{rollData}</div>
                            </div>
                        </div>
                        <div className={`text-xs font-bold px-2 py-1 rounded uppercase mt-2 sm:mt-0 self-start sm:self-center ${isSuccess ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                            {result || 'RESULT'}
                        </div>
                    </div>
                );
            } else if (type === 'SECRET') {
                // Expected: [SECRET: Entity Name | Secret Text]
                const secretParts = (content || '').split('|').map(s => s.trim());
                const entity = secretParts[0] || 'Unknown';
                const secret = secretParts[1] || '...';
                
                elements.push(
                    <div key={`sec-${i}`} className="my-2 p-3 bg-purple-900/20 border border-purple-500/50 rounded-lg flex gap-3 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                        <Eye size={20} className="text-purple-400 flex-shrink-0 mt-1" />
                        <div>
                            <div className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">Intel Unlocked: {entity}</div>
                            <div className="text-sm text-purple-200 italic">"{secret}"</div>
                        </div>
                    </div>
                );
            } else {
                // Fallback for older ENEMY ACTION blocks or generic CHECKs
                const isEnemy = type === 'ENEMY ACTION';
                const safeContent = content || '';
                const isSuccess = safeContent.toLowerCase().includes('success') || safeContent.toLowerCase().includes('hit') || safeContent.toLowerCase().includes('pass');
                const details: string[] = safeContent.split('|').map(s => s.trim());

                elements.push(
                    <div key={`b-${i}`} className={`my-3 p-3 rounded-lg border-l-4 text-xs font-mono shadow-md ${
                        isEnemy 
                            ? (isSuccess ? 'bg-red-900/30 border-red-500 text-red-100' : 'bg-green-900/30 border-green-500 text-green-100') 
                            : (isSuccess ? 'bg-green-900/30 border-green-500 text-green-100' : 'bg-red-900/30 border-red-500 text-red-100')
                    }`}>
                        <div className="flex items-center gap-2 mb-1 border-b border-white/10 pb-1">
                            {isEnemy ? <Sword size={14} /> : <Dice5 size={14} />}
                            <span className="font-bold">{type}</span>
                        </div>
                        {details.map((d: string, idx: number) => (
                            <div key={idx} className="mb-0.5 opacity-90">{d}</div>
                        ))}
                    </div>
                );
            }
        }
    }
    return <div>{elements}</div>;
  };

  const canAffordStructuredOption = (opt: ScenarioNode['options'][0]) => {
      // (Same logic as before)
      if (opt.requiredStat) {
          const statVal = player.stats[opt.requiredStat.toLowerCase() as keyof typeof player.stats] || 0;
          if (statVal < (opt.requiredVal || 0)) return false;
      }
      if (opt.requiredPower) {
          const matchingPower = player.powers.find(p => 
              p.name.toLowerCase() === opt.requiredPower?.toLowerCase() || 
              p.abilities.some(a => a.toLowerCase() === opt.requiredPower?.toLowerCase())
          );
          if (!matchingPower) return false;
          if (opt.requiredVal && matchingPower.level < opt.requiredVal) return false;
      }
      return true;
  };

  const getAIContextPreview = () => {
    // Replicate logic from narrator to show user - Fallback if no specific snapshot
    const textToScan = (task.context || task.description || "").toLowerCase();
    const relevantCodex = codex.filter(entry => {
        if (task.reputationTargets?.some(t => t.toLowerCase() === entry.title.toLowerCase())) return true;
        if (entry.title.length > 3 && textToScan.includes(entry.title.toLowerCase())) return true;
        return false;
    });

    return `ACTIVE CONTEXT DATA (Injected into AI):
----------------------------------------
[PLAYER STATE]
Identity: ${player.identity}
Power Level: ${avgPowerLevel}
Mask Integrity: ${player.resources.mask}%

[TASK CONTEXT]
Title: ${task.title}
Type: ${task.type}
Diff: ${task.difficulty}
Targets: ${task.reputationTargets?.join(', ') || 'None'}

[WORLD DATABASE HITS (${relevantCodex.length})]
${relevantCodex.map(c => `> ${c.title} (${c.category})`).join('\n')}
${relevantCodex.length === 0 ? "(No specific Codex entries referenced in task description)" : ""}

[LIVE NEWS]
${activeNews && task.listensToNews ? activeNews.articles.map(a => `> ${a.headline}`).join('\n') : "News Context Inactive"}`;
  };

  if (view === 'RESULTS' && resultData) {
      const levelConfig = getSuccessLevelConfig(resultData.successLevel);
      return (
          <div className="flex flex-col h-full bg-slate-950 items-center justify-center p-4 sm:p-8 overflow-hidden relative">
              
              {/* Transcript Overlay */}
              {showTranscript && (
                  <div className="absolute inset-0 bg-slate-950/95 z-50 p-6 flex flex-col animate-in slide-in-from-bottom-10">
                      <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xl font-bold text-white flex items-center gap-2"><MessageSquare size={20}/> Mission Transcript</h3>
                          <button onClick={() => setShowTranscript(false)}><X size={24} className="text-slate-400 hover:text-white"/></button>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                          {chatHistory.map((msg, idx) => (
                              <div key={idx} className={`p-3 rounded-lg text-sm border ${msg.role === 'user' ? 'bg-blue-900/20 border-blue-800 ml-8' : 'bg-slate-900 border-slate-800 mr-8'}`}>
                                  <div className="text-xs font-bold opacity-50 mb-1 uppercase">{msg.role === 'user' ? 'You' : 'DM'}</div>
                                  {renderFormattedText(msg.text)}
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              <div className="max-w-xl w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                  {/* Fixed Header */}
                  <div className={`p-8 flex flex-col items-center border-b border-slate-800 shrink-0 ${resultData.success ? 'bg-gradient-to-b from-green-900/20 to-slate-900' : 'bg-gradient-to-b from-red-900/20 to-slate-900'}`}>
                      <div className="mb-4 drop-shadow-2xl scale-125">{levelConfig.icon}</div>
                      <h2 className={`text-3xl font-black uppercase tracking-wider text-center ${levelConfig.color}`}>{levelConfig.label}</h2>
                  </div>
                  
                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
                      <div className="p-6 border-b border-slate-800 bg-slate-900/50">
                          <div className="flex justify-between items-center mb-2">
                              <h3 className="text-xs font-bold text-slate-500 uppercase">Debrief</h3>
                              <button 
                                onClick={() => setShowTranscript(true)}
                                className="text-xs bg-slate-800 hover:bg-slate-700 text-blue-400 px-2 py-1 rounded flex items-center gap-1 transition-colors"
                              >
                                  <MessageSquare size={12}/> View Log
                              </button>
                          </div>
                          <p className="text-slate-300 italic text-sm leading-relaxed border-l-2 border-slate-700 pl-4 py-1">"{resultData.summary}"</p>
                      </div>
                      
                      <div className="p-6 border-b border-slate-800">
                          <div className="flex justify-between items-center mb-4">
                              <h3 className="text-xs font-bold text-slate-500 uppercase">Outcome Rewards</h3>
                              <button onClick={() => setIsEditingRewards(!isEditingRewards)} className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors">{isEditingRewards ? 'Cancel' : <><Edit3 size={12}/> Adjust</>}</button>
                          </div>
                          {isEditingRewards ? (
                              <div className="space-y-3 bg-slate-950 p-4 rounded border border-slate-800 mb-4 animate-in slide-in-from-top-2">
                                   {['money', 'fame', 'publicOpinion', 'mask'].map((key) => {
                                       const val = manualRewards[key as keyof PlayerResources] || 0;
                                       return (
                                           <div key={key} className="flex justify-between items-center">
                                               <label className="text-xs text-slate-400 uppercase w-24">{key}</label>
                                               <input type="number" value={val} onChange={(e) => setManualRewards({...manualRewards, [key]: parseInt(e.target.value) || 0})} className="bg-slate-900 border border-slate-700 rounded w-24 px-2 py-1 text-right font-mono text-sm" />
                                           </div>
                                       )
                                   })}
                              </div>
                          ) : (
                              <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-3">
                                      {Object.entries(manualRewards).map(([key, val]) => {
                                          if (key === 'itemIds' || key === 'newSuggestions' || key === 'targetXp') return null; // Handle items/suggestions/targetXp separately
                                          // Explicitly cast val to string or number for display to avoid object rendering errors
                                          const displayVal = (typeof val === 'object' && val !== null) ? JSON.stringify(val) : val as string | number;
                                          return (
                                            <div key={key} className="bg-slate-950 p-3 rounded border border-slate-800 flex justify-between items-center"><span className="text-slate-400 text-sm capitalize">{key}</span><span className={`font-mono font-bold ${Number(val) > 0 ? 'text-green-400' : Number(val) < 0 ? 'text-red-400' : 'text-slate-600'}`}>{Number(val) > 0 ? '+' : ''}{displayVal}</span></div>
                                          );
                                      })}
                                  </div>
                                  
                                  {/* Target XP (Training) */}
                                  {manualRewards.targetXp && (
                                      <div className="bg-slate-950 p-3 rounded border border-slate-800 flex items-center gap-3">
                                          <div className={`p-2 rounded-full bg-yellow-900/20 text-yellow-400`}>
                                              <Zap size={16} />
                                          </div>
                                          <div className="flex-1">
                                              <div className="text-xs font-bold text-slate-500 uppercase">Training Focus</div>
                                              <div className="text-sm font-bold text-white capitalize">{manualRewards.targetXp.type}: {manualRewards.targetXp.targetId}</div>
                                          </div>
                                          <div className="text-green-400 font-mono font-bold">+{manualRewards.targetXp.amount} XP</div>
                                      </div>
                                  )}

                                  {/* Item Rewards */}
                                  {manualRewards.itemIds && manualRewards.itemIds.length > 0 && (
                                      <div>
                                          <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Items Received</h4>
                                          <div className="space-y-2">
                                              {manualRewards.itemIds.map((id: string, idx: number) => {
                                                  const item = allItems.find(i => i.id === id);
                                                  return (
                                                      <div key={idx} className="flex items-center gap-2 bg-slate-950 p-3 rounded border border-slate-800">
                                                          <Package size={14} className="text-amber-500" />
                                                          <span className="text-sm font-bold text-white">{item ? item.name : 'Unknown Item'}</span>
                                                      </div>
                                                  )
                                              })}
                                          </div>
                                      </div>
                                  )}

                                  {Object.keys(manualReputations).length > 0 && (
                                      <div>
                                          <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Reputation</h4>
                                          <div className="space-y-2">{Object.entries(manualReputations).map(([target, val]) => (<div key={target} className="flex justify-between items-center bg-slate-800/50 p-2 rounded border border-slate-800"><div className="flex items-center gap-2"><Users size={14} className="text-blue-400" /><span className="text-sm text-slate-200">{target}</span></div><span className={`font-bold text-sm ${Number(val) > 0 ? 'text-green-400' : 'text-red-400'}`}>{Number(val) > 0 ? '+' : ''}{val}</span></div>))}</div>
                                      </div>
                                  )}
                              </div>
                          )}
                      </div>

                      {/* Task Suggestions UI */}
                      <div className="p-6 border-b border-slate-800 bg-slate-900/30">
                          <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2"><Lightbulb size={14}/> Task Suggestions</h3>
                          <p className="text-[10px] text-slate-400 mb-3">Add ideas for future tasks based on this outcome. These will be fed into the Automator.</p>
                          
                          <div className="space-y-2 mb-3">
                              {currentSuggestions.map((sug, idx) => (
                                  <div key={idx} className="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-700 text-sm text-white">
                                      <span>{sug}</span>
                                      <button onClick={() => handleRemoveSuggestion(idx)} className="text-slate-500 hover:text-red-400"><X size={12}/></button>
                                  </div>
                              ))}
                          </div>
                          
                          <div className="flex gap-2">
                              <input 
                                  className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-white" 
                                  placeholder="e.g. The villain escaped to the sewers..."
                                  value={suggestionInput}
                                  onChange={e => setSuggestionInput(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && handleAddSuggestion()}
                              />
                              <Button size="sm" onClick={handleAddSuggestion} disabled={!suggestionInput.trim()}><PlusCircle size={14}/></Button>
                          </div>
                      </div>

                      {task.mode === ScenarioMode.FREEFORM && (
                          <div className="p-6 bg-slate-900/50 space-y-4">
                              {/* Codex Gen */}
                              <div>
                                  <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2"><BookPlus size={14}/> Database Entry</h3>
                                  <div className="flex gap-2">
                                      <select 
                                        className="bg-slate-950 border border-slate-700 rounded px-2 text-sm text-white"
                                        value={newCodexCategory}
                                        onChange={(e) => setNewCodexCategory(e.target.value as any)}
                                      >
                                          <option value="NPC">NPC</option>
                                          <option value="FACTION">Faction</option>
                                          <option value="LOCATION">Location</option>
                                          <option value="LORE">Lore</option>
                                      </select>
                                      <input 
                                          className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white" 
                                          placeholder="New Entity Name"
                                          value={newCodexTarget}
                                          onChange={e => setNewCodexTarget(e.target.value)}
                                      />
                                      <Button size="sm" onClick={handleGenerateCodex} isLoading={isGeneratingCodex} disabled={!newCodexTarget}>
                                          Create
                                      </Button>
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>

                  {/* Fixed Footer */}
                  <div className="p-6 bg-slate-950 border-t border-slate-800 shrink-0">
                      <Button onClick={handleFinalExit} className="w-full h-14 text-lg">Confirm & Continue</Button>
                  </div>
              </div>
          </div>
      );
  }

  const threat = getThreatLevel();

  // Structured Mode
  if (task.mode === ScenarioMode.STRUCTURED) {
    // (Unchanged)
    const currentNode = task.nodes?.[currentNodeId || ''];
    return (
      <div className="flex flex-col h-full bg-slate-900 text-slate-200">
        <div className="p-4 border-b border-slate-700 bg-slate-800 flex justify-between items-center shadow-lg z-10">
          <div>
              <h2 className="font-bold text-xl">{task.title}</h2>
              <div className="flex items-center gap-3 text-xs mt-1">
                  <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-700">Level {task.difficulty}</span>
                  <div className="flex items-center gap-1 text-slate-400">
                      <span>vs</span>
                      <span className="text-amber-400 font-bold flex items-center gap-1"><Zap size={10}/> Pwr {avgPowerLevel}</span>
                  </div>
              </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onExit}>Abort</Button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-900">
           {structuredLog.map((log, idx) => (
             <div key={idx} className={`p-4 rounded-lg max-w-3xl ${log.choice === 'user' ? 'bg-slate-800 ml-auto border border-slate-700 text-slate-300' : 'bg-slate-800/50 border-l-4 border-blue-500'}`}>{log.text}</div>
           ))}
           <div ref={messagesEndRef} />
        </div>
        <div className="p-6 bg-slate-800 border-t border-slate-700">
          <h3 className="text-sm font-mono text-slate-500 uppercase mb-3">Available Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentNode?.options.map((opt, idx) => {
               const canAfford = canAffordStructuredOption(opt);
               return (
                <button key={idx} disabled={!canAfford} onClick={() => handleOptionClick(opt)} className={`text-left p-4 rounded border transition-all ${canAfford ? 'bg-slate-700 hover:bg-slate-600 border-slate-600 hover:border-blue-500' : 'bg-slate-800 border-slate-800 opacity-50 cursor-not-allowed'}`}>
                  <div className="font-bold text-lg mb-1">{opt.text}</div>
                  <div className="flex gap-2 mt-1">
                      {opt.requiredStat && (
                          <span className={`text-xs px-2 py-0.5 rounded ${canAfford ? 'bg-blue-900/30 text-blue-300' : 'bg-red-900/30 text-red-400'}`}>
                              {opt.requiredStat} {opt.requiredVal} (Threshold)
                          </span>
                      )}
                      {opt.requiredPower && (
                          <span className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${canAfford ? 'bg-amber-900/30 text-amber-400' : 'bg-red-900/30 text-red-400'}`}>
                              <Zap size={10} /> {opt.requiredPower} {opt.requiredVal ? `(Lvl ${opt.requiredVal})` : ''}
                          </span>
                      )}
                  </div>
                </button>
               )
            })}
          </div>
        </div>
      </div>
    );
  }

  // Freeform Mode - Render view (Only main change is `renderFormattedText` usage)
  return (
    <div className="flex flex-col h-full bg-slate-900 relative">
      {/* ... (Modals remain unchanged: FinishConfirm, ContextView, SuitUp) ... */}
      {/* Finish Confirmation Modal */}
      {showFinishConfirm && (
          <div className="absolute inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4">
               <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-sm">
                   <h3 className="text-lg font-bold text-white mb-2">End Scenario?</h3>
                   <p className="text-slate-400 text-sm mb-4">
                       The AI Dungeon Master will analyze the conversation log to determine success and rewards. 
                       <br/><br/>
                       <strong className="text-amber-500">RESUME if you did not mean to exit yet.</strong> 
                       <br/>
                       If you have not completed the main objective, this may result in failure in the summary.
                   </p>
                   <div className="flex justify-end gap-2">
                       <Button variant="ghost" onClick={() => setShowFinishConfirm(false)}>Resume</Button>
                       <Button variant="hero" onClick={() => { setShowFinishConfirm(false); finishScenario(true, task.rewards); }}>Conclude</Button>
                   </div>
               </div>
          </div>
      )}

      {/* Context View Modal */}
      {showContext && (
          <div className="absolute inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4">
               <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95">
                   <div className="flex justify-between items-center mb-4">
                       <h3 className="text-lg font-bold text-white flex items-center gap-2"><Terminal size={18} /> Context Snapshot</h3>
                       <button onClick={() => setShowContext(false)}><X size={20} className="text-slate-400 hover:text-white"/></button>
                   </div>
                   <div className="flex-1 overflow-y-auto bg-slate-950 p-4 rounded border border-slate-800 shadow-inner">
                       <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap">
                           {activeContextSnapshot || getAIContextPreview()}
                       </pre>
                   </div>
                   <p className="text-[10px] text-slate-500 mt-2">This is the exact system instruction and data state injected into the AI for the selected message.</p>
               </div>
          </div>
      )}

      {/* Suit Up Modal */}
      {showSuitUp && (
          <div className="absolute inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-md">
                  <h3 className="text-xl font-bold text-white mb-4">Switch to {player.identity === Identity.CIVILIAN ? 'Super' : 'Civilian'}</h3>
                  <p className="text-slate-400 text-sm mb-4">Describe how you change your outfit/appearance. Be careful—cameras or witnesses will increase your Mask Exposure.</p>
                  
                  {!suitUpEvaluation ? (
                      <>
                        <textarea className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white mb-4" placeholder="I duck into a phone booth..." value={suitUpMethod} onChange={e => setSuitUpMethod(e.target.value)} />
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setShowSuitUp(false)}>Cancel</Button>
                            <Button variant="primary" isLoading={isEvaluatingSuitUp} onClick={handleSuitUpAnalyze} disabled={!suitUpMethod}>Analyze Risk</Button>
                        </div>
                      </>
                  ) : (
                      <div className="space-y-4 animate-in fade-in">
                          <div className={`p-4 rounded border ${suitUpEvaluation.maskPenalty > 50 ? 'bg-red-900/20 border-red-500' : 'bg-green-900/20 border-green-500'}`}>
                              <div className="text-xs font-bold uppercase mb-1 text-slate-400">Analysis Result</div>
                              <div className="text-lg font-bold text-white mb-2">Mask Penalty: {suitUpEvaluation.maskPenalty}%</div>
                              <p className="text-sm text-slate-300">{suitUpEvaluation.reasoning}</p>
                          </div>
                          <div className="flex justify-end gap-2">
                              <Button variant="ghost" onClick={() => setSuitUpEvaluation(null)}>Back</Button>
                              <Button variant="primary" onClick={handleSuitUpConfirm}>Confirm Change</Button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}

      <div className="p-4 border-b border-slate-700 bg-slate-800 flex justify-between items-center shadow-md z-10">
          <div>
             <h2 className="font-bold text-xl flex items-center gap-2"><Target className="text-amber-500" /> {task.title}</h2>
             <div className="flex items-center gap-2 text-xs mt-1">
                 <span className={`px-1 rounded text-white ${player.identity === Identity.SUPER ? 'bg-amber-600' : 'bg-blue-600'}`}>{player.identity}</span>
                 <span className="bg-slate-900 px-2 py-0.5 rounded text-slate-300 border border-slate-700">Diff {task.difficulty}</span>
                 <div className={`flex items-center gap-2 px-2 py-0.5 rounded border ${threat.color === 'bg-green-500' ? 'border-green-700 bg-green-900/30 text-green-300' : threat.color === 'bg-red-500' ? 'border-red-700 bg-red-900/30 text-red-300' : 'border-slate-600 bg-slate-800'}`}>
                     <span className="font-bold uppercase">{threat.text}</span>
                     <span className="w-px h-3 bg-white/20 mx-1"></span>
                     <span className="flex items-center gap-1 font-mono"><Zap size={10}/> Pwr {avgPowerLevel}</span>
                 </div>
                 {task.listensToNews && activeNews && (
                     <span className="bg-purple-900/50 border border-purple-500 px-2 py-0.5 rounded text-purple-200 font-bold tracking-wide uppercase animate-pulse">
                         Live Event
                     </span>
                 )}
                 <button onClick={() => { setActiveContextSnapshot(''); setShowContext(true); }} className="ml-2 text-slate-500 hover:text-white flex items-center gap-1 px-2 py-0.5 hover:bg-slate-700 rounded" title="View Current Context">
                     <Terminal size={12} /> <span className="hidden sm:inline">Active Context</span>
                 </button>
             </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setShowSuitUp(true)}><Shield size={16} className="mr-1"/> Switch ID</Button>
            <Button variant="hero" size="sm" onClick={() => setShowFinishConfirm(true)}>Finish Scenario</Button>
            <Button variant="ghost" size="sm" onClick={onExit}>Abort</Button>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900">
        {chatHistory.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group relative`}>
            {/* Editing Logic */}
            {editingIndex === idx ? (
                <div className="max-w-[80%] w-full">
                     <textarea 
                        className="w-full bg-slate-950 border border-slate-600 rounded p-3 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        rows={3}
                     />
                     <div className="flex gap-2 justify-end mt-2">
                        <Button size="sm" variant="ghost" onClick={() => setEditingIndex(null)}>Cancel</Button>
                        <Button size="sm" onClick={handleEditSave}><Save size={14} className="mr-1"/> Save</Button>
                     </div>
                </div>
            ) : (
                <div className={`max-w-[80%] p-4 rounded-lg text-sm leading-relaxed relative ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'}`}>
                    {msg.role === 'model' && (
                        <div className="flex justify-between items-center mb-2 border-b border-slate-700/50 pb-1">
                            <div className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1"><Dice5 size={12}/> Dungeon Master</div>
                            {msg.contextSnapshot && (
                                <button onClick={() => openContext(msg.contextSnapshot || '')} className="text-slate-500 hover:text-white" title="View Generation Context">
                                    <Terminal size={12} />
                                </button>
                            )}
                        </div>
                    )}
                    {renderFormattedText(msg.text)}

                    {/* Message Controls */}
                    <div className={`absolute -bottom-6 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${msg.role === 'user' ? 'right-0' : 'left-0'}`}>
                        <button onClick={() => handleEditStart(idx, msg.text)} className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-white" title="Edit Message"><Edit3 size={12} /></button>
                        <button onClick={() => handleRewind(idx)} className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-red-400" title="Rewind to here (Delete subsequent)"><Trash2 size={12} /></button>
                        {msg.role === 'model' && idx === chatHistory.length - 1 && (
                            <button onClick={handleRegenerate} className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-blue-400" title="Regenerate Response"><RefreshCw size={12} /></button>
                        )}
                    </div>
                </div>
            )}
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start"><div className="bg-slate-800 p-4 rounded-lg rounded-bl-none border border-slate-700"><div className="flex space-x-2"><div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-75"></div><div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-150"></div></div></div></div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-slate-800 border-t border-slate-700">
        <div className="relative">
            <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder={`Describe what ${player.identity === 'SUPER' ? player.superName : player.civilianName} does...`} className="w-full bg-slate-900 text-white rounded-lg pl-4 pr-12 py-3 border border-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-20" />
            <button onClick={handleSend} disabled={isLoading || !input.trim()} className="absolute right-3 bottom-3 p-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"><Send size={18} /></button>
        </div>
        <div className="mt-2 text-xs text-slate-500 flex justify-between px-1"><span>Press Enter to send</span><span className="flex items-center gap-1"><History size={10} /> AI remembers recent context</span></div>
      </div>
    </div>
  );
};
