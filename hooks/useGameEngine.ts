
import { useState, useEffect, useCallback } from 'react';
import { 
    Player, GameState, Task, Item, DowntimeActivity, 
    CalendarEvent, BaseUpgrade, TaskPool, Power, Automator, 
    CodexEntry, NewsIssue, NewsSettings, MusicTrack, WeekTheme,
    Identity, PlayerResources, PlayerStats, ScenarioMode, TaskType,
    LockCondition, DailyReportData, MusicContext, ProcessingState,
    StatType, DailyTaskConfig, TaskSuggestion
} from '../types';
import { 
    INITIAL_PLAYER, INITIAL_GAME_STATE, FLASHBACK_TASK
} from '../constants';
import { 
    generateNewsContent, generateNewsBasedTasks, generateTaskContent, 
    generateItemContent, generateUpgradeContent, generateEventContent, 
    generateBatchTasks, generateBatchItems, 
    generateBatchUpgrades, generateBatchEvents
} from '../services/gemini/generators';
import { generateWeeklySummary } from '../services/gemini/narrator';
import { checkAllConditions, getEffectiveStats, calculateTaskDifficulty, calculateTrainingXp, calculateWorkIncome } from '../utils/mechanics';

export const useGameEngine = () => {
  const [error, setError] = useState<string | null>(null);

  const [player, setPlayer] = useState<Player>(() => {
      const saved = localStorage.getItem('sentinel_player');
      return saved ? JSON.parse(saved) : INITIAL_PLAYER;
  });

  const [gameState, setGameState] = useState<GameState>(() => {
      const saved = localStorage.getItem('sentinel_gamestate');
      if (saved) {
          try {
              const parsed = JSON.parse(saved);
              // Safe Merge: Start with Initial State, overwrite with Saved, then ensure arrays exist
              return {
                  ...INITIAL_GAME_STATE,
                  ...parsed,
                  // Explicitly ensure new array fields exist for old saves
                  taskSuggestions: parsed.taskSuggestions || [],
                  archivedSuggestions: parsed.archivedSuggestions || [],
                  automators: parsed.automators || [],
                  newsHistory: parsed.newsHistory || [],
                  timeline: parsed.timeline || [],
                  codex: parsed.codex || [],
                  taskPool: parsed.taskPool || [],
                  shopItems: parsed.shopItems || []
              };
          } catch (e) {
              console.error("Failed to parse save file", e);
              return INITIAL_GAME_STATE;
          }
      }
      return INITIAL_GAME_STATE;
  });

  const [currentScenario, setCurrentScenario] = useState<Task | null>(null);
  const [pendingNews, setPendingNews] = useState<NewsIssue | null>(null);
  const [dailyReport, setDailyReport] = useState<DailyReportData | null>(null);
  
  // New: Processing State for Loading Screen
  const [processingState, setProcessingState] = useState<ProcessingState | null>(null);

  // Persistence
  useEffect(() => {
      localStorage.setItem('sentinel_player', JSON.stringify(player));
  }, [player]);

  useEffect(() => {
      localStorage.setItem('sentinel_gamestate', JSON.stringify(gameState));
  }, [gameState]);

  // --- Day 1 Flashback Injection ---
  useEffect(() => {
      if (player.hasCreatedCharacter && gameState.day === 1 && !player.hasPlayedFlashback) {
          // Check if Flashback is already present to prevent duplicates
          const hasFlashback = gameState.activeTasks.some(t => t.id === FLASHBACK_TASK.id);
          if (!hasFlashback) {
              setGameState(prev => ({
                  ...prev,
                  activeTasks: [FLASHBACK_TASK, ...prev.activeTasks]
              }));
          }
      }
  }, [player.hasCreatedCharacter, gameState.day, player.hasPlayedFlashback]);

  // --- Core Game Loop ---

  const handleNextDay = async () => {
      try {
        setGameState(prev => ({ ...prev, isProcessing: true }));
        
        const nextDay = gameState.day + 1;
        const isRentDay = nextDay % 7 === 0;
        const rentAmount = isRentDay ? 350 : 0; // Weekly rent

        const report: DailyReportData = {
            day: nextDay,
            financials: { rent: rentAmount },
            automatorResults: { tasksGenerated: 0, itemsGenerated: 0, upgradesGenerated: 0, newTasks: [] },
            newsPublished: false,
            eventsTriggered: 0
        };

        // Identify active automators
        const activeAutomators = (gameState.automators || []).filter(auto => {
            if (!auto.active) return false;
            if (auto.startDay && nextDay < auto.startDay) return false;
            if (auto.endDay !== -1 && auto.endDay !== undefined && nextDay > auto.endDay) return false;
            return nextDay >= auto.nextRunDay;
        });

        // Initialization for Processing Screen
        setProcessingState({
            step: 'Initializing daily sequence...',
            itemsProcessed: 0,
            totalItems: 4, // Automators + News + Events + Weekly
            logs: ['Starting day transition...']
        });

        // 1. Process Automators Parallel
        let newTasks: Task[] = [];
        let newItems: Item[] = [];
        let newUpgrades: BaseUpgrade[] = [];
        let newEvents: CalendarEvent[] = [];
        let updatedAutomators = [...(gameState.automators || [])];
        let usedSuggestionIds: string[] = [];

        if (activeAutomators.length > 0) {
            setProcessingState(prev => ({
                ...prev!,
                step: `Running ${activeAutomators.length} Automators...`,
                itemsProcessed: 1,
                logs: [`Executing ${activeAutomators.length} automators concurrently...`, ...prev!.logs]
            }));

            const automatorPromises = activeAutomators.map(async (auto) => {
                const result = {
                    autoId: auto.id,
                    type: auto.type,
                    tasks: [] as Task[],
                    items: [] as Item[],
                    upgrades: [] as BaseUpgrade[],
                    events: [] as CalendarEvent[],
                    success: true,
                    interval: auto.intervalDays,
                    usedSuggestions: [] as string[]
                };

                try {
                    const amount = auto.config.amount || 1;
                    
                    if (auto.type === 'TASK') {
                        // Pass existing titles to avoid duplication
                        const existingTitles = gameState.taskPool.map(t => t.title);
                        // Pass active suggestions - Safeguard against undefined
                        const activeSuggestions = gameState.taskSuggestions || [];
                        
                        const tasks = await generateBatchTasks(amount, auto.config.context || `Day ${nextDay} Task`, existingTitles, gameState.generationModel, activeSuggestions);
                        
                        tasks.forEach((t, i) => {
                            // Clamp difficulty
                            const minDiff = auto.config.difficultyMin || 1;
                            const maxDiff = auto.config.difficultyMax || 10;
                            const aiDiff = t.difficulty || 1;
                            const finalDiff = Math.max(minDiff, Math.min(maxDiff, aiDiff));

                            if (t.sourceSuggestionId) {
                                result.usedSuggestions.push(t.sourceSuggestionId);
                            }

                            result.tasks.push({ 
                                ...t, 
                                id: `auto-task-${Date.now()}-${auto.id}-${i}`,
                                // Use AI provided type if available (WORK/EVENT/PATROL), default to MISSION if not.
                                // If identity is Civilian, but AI didn't give type, default to WORK or EVENT randomly.
                                type: t.type || (t.requiredIdentity === Identity.CIVILIAN ? (Math.random() > 0.5 ? TaskType.WORK : TaskType.EVENT) : TaskType.MISSION),
                                difficulty: finalDiff,
                                // Trust AI identity, or fallback to random 70/30 Super/Civilian split
                                requiredIdentity: t.requiredIdentity || (Math.random() > 0.3 ? Identity.SUPER : Identity.CIVILIAN),
                                mode: ScenarioMode.FREEFORM,
                                locked: false,
                                scaling: auto.config.scalable ? { startDay: nextDay, intervalDays: 7, levelIncrease: 1, maxLevel: 10 } : undefined
                            } as Task);
                        });
                    } else if (auto.type === 'ITEM') {
                        const items = await generateBatchItems(amount, auto.config.context || 'New Item', gameState.generationModel);
                        items.forEach((t, i) => {
                            result.items.push({ ...t, id: `auto-item-${Date.now()}-${auto.id}-${i}` } as Item);
                        });
                    } else if (auto.type === 'UPGRADE') {
                        const upgrades = await generateBatchUpgrades(amount, auto.config.context || 'New Upgrade', gameState.generationModel);
                        upgrades.forEach((u, i) => {
                            result.upgrades.push({ ...u, id: `auto-upg-${Date.now()}-${auto.id}-${i}` } as BaseUpgrade);
                        });
                    } else if (auto.type === 'EVENT') {
                        const events = await generateBatchEvents(amount, auto.config.context || 'Event', gameState.generationModel);
                        const range = auto.config.dateRange || 0;
                        events.forEach((e, i) => {
                            const offset = range > 0 ? Math.floor(Math.random() * range) + 1 : 0;
                            result.events.push({ 
                                ...e, 
                                id: `auto-evt-${Date.now()}-${auto.id}-${i}`, 
                                day: nextDay + offset 
                            } as CalendarEvent);
                        });
                    }
                } catch (e) {
                    console.error(`Automator ${auto.id} failed`, e);
                    result.success = false;
                }
                return result;
            });

            const results = await Promise.all(automatorPromises);

            // Aggregate Results
            results.forEach(res => {
                if (res.success) {
                    newTasks.push(...res.tasks);
                    newItems.push(...res.items);
                    newUpgrades.push(...res.upgrades);
                    newEvents.push(...res.events);
                    
                    if (res.usedSuggestions && res.usedSuggestions.length > 0) {
                        usedSuggestionIds.push(...res.usedSuggestions);
                    }
                    
                    if (res.type === 'TASK') report.automatorResults.tasksGenerated += res.tasks.length;
                    if (res.type === 'ITEM') report.automatorResults.itemsGenerated += res.items.length;
                    if (res.type === 'UPGRADE') report.automatorResults.upgradesGenerated += res.upgrades.length;

                    // Update Next Run Day
                    const idx = updatedAutomators.findIndex(a => a.id === res.autoId);
                    if (idx >= 0) {
                        updatedAutomators[idx] = { ...updatedAutomators[idx], nextRunDay: nextDay + res.interval };
                    }
                }
            });
            
            setProcessingState(prev => ({ ...prev!, logs: [`Processed ${results.length} automators.`, ...prev!.logs] }));
            if (usedSuggestionIds.length > 0) {
                setProcessingState(prev => ({ ...prev!, logs: [`Used ${usedSuggestionIds.length} Task Suggestions.`, ...prev!.logs] }));
            }
        } else {
            setProcessingState(prev => ({ ...prev!, logs: ['No automators scheduled for today.', ...prev!.logs], itemsProcessed: 1 }));
        }

        // 2. Check News Generation
        setProcessingState(prev => ({
            ...prev!,
            step: 'Checking News Feeds...',
            itemsProcessed: 2,
            logs: ['Analyzing world events for news...', ...prev!.logs]
        }));

        let newsIssue: NewsIssue | null = null;
        
        // Wrap News Generation in a dedicated try/catch to avoid breaking the day loop
        try {
            // Simple logic: check frequency settings
            const daysSinceNews = gameState.newsHistory.length > 0 ? nextDay - gameState.newsHistory[0].day : nextDay;
            const newsChance = (daysSinceNews - gameState.newsSettings.frequencyMin) / (gameState.newsSettings.frequencyMax - gameState.newsSettings.frequencyMin);
            
            if (daysSinceNews >= gameState.newsSettings.frequencyMin && Math.random() < Math.max(0.1, newsChance)) {
                // Generate News
                setProcessingState(prev => ({ ...prev!, logs: ['BREAKING NEWS DETECTED! Drafting issue...', ...prev!.logs] }));
                
                newsIssue = await generateNewsContent(nextDay, gameState.newsSettings.newsContextPrompt || `Events of days ${gameState.day - 5} to ${gameState.day}`, undefined, gameState.generationModel);
                
                if (newsIssue) {
                    report.newsPublished = true;
                    setProcessingState(prev => ({ ...prev!, logs: [`Published: The Sentinel Day ${nextDay}`, ...prev!.logs] }));
                    
                    // Generate Linked Tasks
                    if (gameState.newsSettings.generateRelatedTasks) {
                        setProcessingState(prev => ({ ...prev!, logs: ['Generating related missions...', ...prev!.logs] }));
                        const linked = await generateNewsBasedTasks(newsIssue, gameState.generationModel);
                        newTasks.push(...linked.tasks);
                        report.automatorResults.tasksGenerated += linked.tasks.length;
                        setProcessingState(prev => ({ ...prev!, logs: [`+ ${linked.tasks.length} News-related Incidents`, ...prev!.logs] }));
                    }
                } else {
                    setProcessingState(prev => ({ ...prev!, logs: ['News generation returned empty. Skipping.', ...prev!.logs] }));
                }
            } else {
                setProcessingState(prev => ({ ...prev!, logs: ['No major news today.', ...prev!.logs] }));
            }
        } catch (newsError) {
            console.error("News Generation Logic Failed", newsError);
            setProcessingState(prev => ({ ...prev!, logs: ['ERROR: News generation failed. Skipping.', ...prev!.logs] }));
            // Continue processing without news
        }

        // 3. Process Events & Populate Active Tasks
        setProcessingState(prev => ({
            ...prev!,
            step: 'Finalizing Schedule...',
            itemsProcessed: 3,
            logs: ['Triggering calendar events...', ...prev!.logs]
        }));
        
        const todayEvents = [...gameState.calendarEvents, ...newEvents].filter(e => e.day === nextDay || (e.active && e.triggerCondition && checkAllConditions(player, gameState, [e.triggerCondition])));
        report.eventsTriggered = todayEvents.length;
        if (todayEvents.length > 0) {
            setProcessingState(prev => ({ ...prev!, logs: [`! ${todayEvents.length} Events Triggered`, ...prev!.logs] }));
        }

        // Convert Events to Tasks (With Linking Logic)
        const eventTasks: Task[] = todayEvents.map(e => {
            // Check if this event is linked to a specific Task Template
            if (e.linkedTaskId) {
                const template = gameState.taskPool.find(t => t.id === e.linkedTaskId);
                if (template) {
                    return {
                        ...template,
                        id: `evt-task-${e.id}-${nextDay}`, // Unique instance ID
                        isMandatory: true, // Events are mandatory
                        locked: false, // Force unlock
                        completedDay: undefined, // Reset state
                        completionCount: 0 
                    };
                }
            }

            // Fallback: Generate generic event task
            return {
                id: `evt-task-${e.id}-${nextDay}`,
                title: e.title,
                description: e.description,
                type: e.type === 'DEADLINE' || e.type === 'HOLIDAY' ? TaskType.EVENT : TaskType.EVENT,
                difficulty: 1, 
                requiredIdentity: e.type === 'EVENT' ? Identity.SUPER : Identity.CIVILIAN, // Basic heuristic
                rewards: { fame: 5, publicOpinion: 2 },
                mode: ScenarioMode.FREEFORM,
                context: `EVENT: ${e.title}. ${e.description}`,
                isMandatory: true,
                locked: false
            };
        });

        // Select Daily Tasks from Pool
        // Combine existing pool + new generated tasks
        const allPotentialTasks = [...gameState.taskPool, ...newTasks];
        // Filter available: Not completed OR completed on a previous day (re-rollable)
        // AND not previously mandatory (mandatory ones stay until done, but we re-inject if not done)
        const availableTasks = allPotentialTasks.filter(t => 
            (!t.completedDay || t.completedDay < nextDay) && !t.isMandatory
        );
        
        // Shuffle and pick
        const dailyLimit = gameState.dailyConfig?.tasksAvailablePerDay || 4;
        const shuffledTasks = availableTasks.sort(() => 0.5 - Math.random());
        const selectedDailyTasks = shuffledTasks.slice(0, dailyLimit);

        // Apply Scaling to Selected Tasks
        const scaledTasks = selectedDailyTasks.map(t => ({
            ...t,
            difficulty: calculateTaskDifficulty(t, nextDay)
        }));

        // Combine with events (mandatory/scheduled)
        const nextActiveTasks = [...eventTasks, ...scaledTasks];

        // 4. WEEKLY SUMMARY CHECK
        let weeklySummaryEntry: Partial<CodexEntry> | null = null;
        if (nextDay % 7 === 0) {
            setProcessingState(prev => ({ ...prev!, step: 'Generating Weekly Report...', logs: ['End of Week Detected. Compiling Codex Entry...', ...prev!.logs] }));
            const weekNum = nextDay / 7;
            // Get events from last 7 days
            const recentEvents = gameState.timeline.filter(e => e.day > (nextDay - 7));
            weeklySummaryEntry = await generateWeeklySummary(weekNum, recentEvents, gameState.generationModel);
        }

        // Finalize
        await new Promise(resolve => setTimeout(resolve, 800)); // Let user see "Done"

        // Add task list to report
        report.automatorResults.newTasks = newTasks;

        // Update State
        setPlayer(p => ({
            ...p,
            resources: { ...p.resources, money: Math.max(0, p.resources.money - report.financials.rent) },
            baseUpgrades: [...p.baseUpgrades, ...newUpgrades], // Add generated upgrades to potential buy list
            downtimeTokens: 2 // Reset tokens
        }));

        setGameState(prev => {
            let updatedPool = [...prev.taskPool, ...newTasks];
            let updatedShop = [...prev.shopItems, ...newItems];
            let updatedCodex = [...prev.codex];
            let updatedEvents = [...prev.calendarEvents, ...newEvents];

            // Handle Suggestions Archival with Safety Check
            const currentSuggestions = prev.taskSuggestions || [];
            const remainingSuggestions = currentSuggestions.filter(s => !usedSuggestionIds.includes(s.id));
            const justUsedSuggestions = currentSuggestions.filter(s => usedSuggestionIds.includes(s.id));
            const updatedArchivedSuggestions = [...(prev.archivedSuggestions || []), ...justUsedSuggestions];

            if (weeklySummaryEntry) {
                const newEntry: CodexEntry = {
                    id: `week-sum-${Date.now()}`,
                    title: weeklySummaryEntry.title || 'Weekly Summary',
                    category: 'LORE',
                    content: weeklySummaryEntry.content || '',
                    unlocked: true,
                    relationship: { civilianRep: 0, superRep: 0, knowsIdentity: false }
                };
                updatedCodex.push(newEntry);
            }
            
            let updatedNewsHistory = prev.newsHistory;
            if (newsIssue) {
                updatedNewsHistory = [newsIssue, ...prev.newsHistory].slice(0, prev.newsSettings.historyRetention);
            }

            return {
                ...prev,
                day: nextDay,
                taskPool: updatedPool,
                activeTasks: nextActiveTasks,
                shopItems: updatedShop,
                codex: updatedCodex,
                calendarEvents: updatedEvents,
                automators: updatedAutomators,
                newsHistory: updatedNewsHistory,
                activeNews: newsIssue || prev.activeNews, // Keep old if no new one, or replace? Usually replace current active
                logs: [...prev.logs, `Day ${nextDay} started. Rent paid: $${report.financials.rent}.`],
                isProcessing: false,
                taskSuggestions: remainingSuggestions,
                archivedSuggestions: updatedArchivedSuggestions
            };
        });

        setDailyReport(report);
        if (newsIssue) setPendingNews(newsIssue);
        setProcessingState(null);
      } catch (e: any) {
          console.error("Critical Error in handleNextDay", e);
          setProcessingState(null);
          setGameState(prev => ({ ...prev, isProcessing: false }));
          setError(e.message || "An unexpected error occurred while processing the next day. Please try again or check settings.");
      }
  };

  const handleTaskSelect = (task: Task) => {
      // Logic to check lock status again just in case
      if (task.locked && !checkAllConditions(player, gameState, task.lockConditions)) {
          alert("Task is locked.");
          return;
      }
      setCurrentScenario(task);
      setMusicMood('ACTION');
  };

  const handleAutoResolveTask = (task: Task, stat: StatType, description: string) => {
      // Calculate
      const effectiveStats = getEffectiveStats(player);
      const roll = Math.floor(Math.random() * 20) + 1;
      const statBonus = effectiveStats[stat.toLowerCase() as keyof PlayerStats];
      const total = roll + statBonus;
      const dc = 12 + (task.difficulty * 2);
      const isSuccess = total >= dc;

      // Apply Rewards
      const newPlayer = { ...player };
      let summary = "";
      if (isSuccess) {
          summary = `Auto-Resolved "${task.title}". ${description} Success!`;
          if (task.rewards.money) newPlayer.resources.money += task.rewards.money;
          
          // Identity-restricted rewards
          if (player.identity === Identity.SUPER) {
              if (task.rewards.fame) newPlayer.resources.fame = Math.min(100, Math.max(0, newPlayer.resources.fame + task.rewards.fame));
              if (task.rewards.publicOpinion) newPlayer.resources.publicOpinion = Math.min(100, Math.max(-100, newPlayer.resources.publicOpinion + task.rewards.publicOpinion));
          }
          
          if (task.rewards.itemIds && task.rewards.itemIds.length > 0) {
              task.rewards.itemIds.forEach((id: string) => {
                  const item = gameState.shopItems.find(i => i.id === id);
                  if (item) {
                      newPlayer.inventory.push(item);
                      summary += ` Acquired: ${item.name}`;
                  }
              });
          }
      } else {
          summary = `Auto-Resolved "${task.title}". ${description} Failed.`;
          // Penalty? Maybe mild fame loss
          if (player.identity === Identity.SUPER) {
              newPlayer.resources.fame = Math.max(0, newPlayer.resources.fame - 1);
          }
      }

      setPlayer(newPlayer);

      // Update State
      setGameState(prev => ({
          ...prev,
          activeTasks: prev.activeTasks.map(t => t.id === task.id ? { ...t, completedDay: prev.day, completionCount: (t.completionCount || 0) + (isSuccess ? 1 : 0) } : t),
          taskPool: prev.taskPool.map(t => t.id === task.id ? { ...t, completedDay: prev.day, completionCount: (t.completionCount || 0) + (isSuccess ? 1 : 0) } : t),
          logs: [...prev.logs, summary]
      }));

      return { success: isSuccess, roll, total, dc, summary };
  };

  const handleScenarioComplete = async (success: boolean, rewards: any, summary: string, reputationChanges?: Record<string, number>) => {
      // 1. Apply Rewards
      const newPlayer = { ...player };
      if (rewards) {
          if (rewards.money) newPlayer.resources.money += rewards.money;
          
          // Identity Check for Fame/Opinion
          if (player.identity === Identity.SUPER) {
              if (rewards.fame) newPlayer.resources.fame = Math.min(100, Math.max(0, newPlayer.resources.fame + rewards.fame));
              if (rewards.publicOpinion) newPlayer.resources.publicOpinion = Math.min(100, Math.max(-100, newPlayer.resources.publicOpinion + rewards.publicOpinion));
          }

          if (rewards.mask) newPlayer.resources.mask = Math.min(100, Math.max(0, newPlayer.resources.mask + rewards.mask));
          
          // Stats XP/Gain logic could be more complex, simpler here
          if (rewards.smarts) newPlayer.stats.smarts += rewards.smarts;
          if (rewards.charm) newPlayer.stats.charm += rewards.charm;
          if (rewards.coordination) newPlayer.stats.coordination += rewards.coordination;
          if (rewards.will) newPlayer.stats.will += rewards.will;

          // Item Rewards
          if (rewards.itemIds && Array.isArray(rewards.itemIds)) {
              rewards.itemIds.forEach((id: string) => {
                  const item = gameState.shopItems.find(i => i.id === id);
                  if (item) {
                      newPlayer.inventory.push(item);
                  }
              });
          }

          // Special Targeted XP (From Training in RP mode)
          if (rewards.targetXp) {
              const { targetId, amount, type } = rewards.targetXp;
              if (type === 'STAT') {
                  const key = targetId as keyof PlayerStats;
                  if (newPlayer.stats[key] !== undefined) {
                      newPlayer.stats[key] += amount;
                  }
              } else if (type === 'POWER') {
                  const powerIndex = newPlayer.powers.findIndex(p => p.id === targetId);
                  if (powerIndex >= 0) {
                      const power = { ...newPlayer.powers[powerIndex] };
                      power.xp += amount;
                      // Level Up Check
                      if (power.xp >= power.maxXp) {
                          power.xp -= power.maxXp;
                          power.level += 1;
                          newPlayer.skillPoints += 1;
                      }
                      newPlayer.powers[powerIndex] = power;
                  }
              }
          }
      }

      // Check Flashback Completion
      if (currentScenario?.id === FLASHBACK_TASK.id) {
          newPlayer.hasPlayedFlashback = true;
      }

      // 2. Apply Reputations (Legacy Flat)
      if (reputationChanges) {
          Object.entries(reputationChanges).forEach(([target, change]) => {
              newPlayer.reputations[target] = (newPlayer.reputations[target] || 0) + change;
          });
      }

      setPlayer(newPlayer);

      // 4. Update Game State (Logs, Task completion, Timeline, Suggestions, Codex Reputations)
      setGameState(prev => {
          let newSuggestions = prev.taskSuggestions || []; 
          if (rewards && rewards.newSuggestions && Array.isArray(rewards.newSuggestions)) {
              const toAdd: TaskSuggestion[] = rewards.newSuggestions.map((text: string) => ({
                  id: `sugg-${Date.now()}-${Math.random().toString(36).substr(2,5)}`,
                  text: text,
                  createdDay: prev.day
              }));
              newSuggestions = [...newSuggestions, ...toAdd];
          }

          // Apply Reputation Changes to Codex (Dual Identity Logic)
          let updatedCodex = [...prev.codex];
          if (reputationChanges) {
             Object.entries(reputationChanges).forEach(([target, change]) => {
                 const idx = updatedCodex.findIndex(c => c.title === target);
                 if (idx >= 0) {
                     const entry = { ...updatedCodex[idx] };
                     // Ensure relationship object exists
                     if (!entry.relationship) {
                         entry.relationship = { civilianRep: 0, superRep: 0, knowsIdentity: false };
                     }
                     
                     const rel = { ...entry.relationship };
                     if (rel.knowsIdentity) {
                         rel.civilianRep += change;
                         rel.superRep += change;
                     } else {
                         // Apply to current identity's reputation score
                         if (newPlayer.identity === Identity.SUPER) {
                             rel.superRep += change;
                         } else {
                             rel.civilianRep += change;
                         }
                     }
                     entry.relationship = rel;
                     updatedCodex[idx] = entry;
                 }
             });
          }

          return {
              ...prev,
              codex: updatedCodex,
              activeTasks: prev.activeTasks.map(t => t.id === currentScenario?.id ? { ...t, completedDay: prev.day, completionCount: (t.completionCount || 0) + 1 } : t),
              taskPool: prev.taskPool.map(t => t.id === currentScenario?.id ? { ...t, completedDay: prev.day, completionCount: (t.completionCount || 0) + 1 } : t), // Mark global pool too
              logs: [...prev.logs, `Completed ${currentScenario?.title}: ${success ? 'Success' : 'Failure'}.`, `Summary: ${summary}`],
              // Add to Timeline for Weekly Summaries
              timeline: [...prev.timeline, {
                  day: prev.day,
                  type: success ? 'MINOR' : 'MINOR',
                  description: `Completed "${currentScenario?.title}": ${summary}`
              }],
              taskSuggestions: newSuggestions
          };
      });

      setCurrentScenario(null);
      setMusicMood('MENU');
  };

  const handleUnlockSecret = useCallback((entityTitle: string, secretText: string) => {
      setGameState(prev => {
          let secretAdded = false;
          const newCodex = prev.codex.map(entry => {
              if (entry.title.toLowerCase() === entityTitle.toLowerCase() || entry.title.toLowerCase().includes(entityTitle.toLowerCase())) {
                  const existingSecrets = entry.secrets || [];
                  // Avoid duplicates
                  if (existingSecrets.some(s => s.text === secretText)) return entry;
                  
                  secretAdded = true;
                  return {
                      ...entry,
                      secrets: [...existingSecrets, { text: secretText, unlocked: true }]
                  };
              }
              return entry;
          });
          
          if (!secretAdded) return prev;

          return { ...prev, codex: newCodex, logs: [...prev.logs, `Secret Unlocked for ${entityTitle}!`] };
      });
  }, []);

  // --- Handlers ---

  const handleUpdatePlayer = (updates: Partial<Player>) => setPlayer(p => ({ ...p, ...updates }));
  const handleIdentitySwitch = (newId: Identity, penalty: number) => {
      setPlayer(p => ({
          ...p,
          identity: newId,
          resources: { ...p.resources, mask: Math.max(0, p.resources.mask - penalty) }
      }));
  };
  const toggleIdentity = () => handleIdentitySwitch(player.identity === Identity.CIVILIAN ? Identity.SUPER : Identity.CIVILIAN, 0);

  const handleDowntime = async (activity: DowntimeActivity, mode: 'AUTO' | 'ROLEPLAY', trainingTarget?: { type: 'STAT' | 'POWER', id: string }) => {
      if (player.downtimeTokens <= 0) return;
      
      // Calculate specific training XP if relevant
      let calculatedXp = 0;
      if (activity.type === 'TRAINING' && trainingTarget) {
          calculatedXp = calculateTrainingXp(player, activity, trainingTarget.type, trainingTarget.id).total;
      }

      if (mode === 'ROLEPLAY') {
          // Pay cost immediately before switching to scenario mode
          setPlayer(p => ({ ...p, downtimeTokens: p.downtimeTokens - 1 }));

          // Construct Context
          let context = activity.roleplayPrompt || activity.description;
          const rewards: any = { ...(activity.autoRewards || {}) };

          if (trainingTarget) {
              const targetName = trainingTarget.type === 'STAT' ? trainingTarget.id : player.powers.find(p => p.id === trainingTarget.id)?.name || 'Power';
              context = `You are focusing your training on your ${targetName}. Describe your regimen.`;
              // Inject the calculated XP as a guaranteed reward upon success
              rewards.targetXp = {
                  targetId: trainingTarget.id,
                  type: trainingTarget.type,
                  amount: calculatedXp
              };
          } else if (activity.type === 'WORK') {
              // Apply work bonus modifiers if in Roleplay mode
              const calculatedIncome = calculateWorkIncome(player, activity).total;
              rewards.money = calculatedIncome;
          }

          // Generate a temporary task
          const task: Task = {
              id: `dt-rp-${Date.now()}`,
              title: activity.title,
              description: activity.description,
              type: TaskType.DOWNTIME,
              difficulty: 1,
              requiredIdentity: player.identity,
              mode: ScenarioMode.FREEFORM,
              context: context,
              rewards: rewards,
              locked: false
          };
          setCurrentScenario(task);
      } else {
          // Auto resolve
          setPlayer(prev => {
              const newState = { ...prev, downtimeTokens: prev.downtimeTokens - 1 };
              let logDetails = "";

              if (activity.type === 'TRAINING' && trainingTarget) {
                  if (trainingTarget.type === 'STAT') {
                      const key = trainingTarget.id as keyof PlayerStats;
                      if (newState.stats[key] !== undefined) {
                          newState.stats[key] += calculatedXp;
                          logDetails = ` Trained ${key} (+${calculatedXp} XP).`;
                      }
                  } else if (trainingTarget.type === 'POWER') {
                      const powerIndex = newState.powers.findIndex(p => p.id === trainingTarget.id);
                      if (powerIndex >= 0) {
                          const power = { ...newState.powers[powerIndex] };
                          power.xp += calculatedXp;
                          if (power.xp >= power.maxXp) {
                              power.xp -= power.maxXp;
                              power.level += 1;
                              newState.skillPoints += 1;
                              logDetails += ` ${power.name} Level Up!`;
                          } else {
                              logDetails += ` Trained ${power.name} (+${calculatedXp} XP).`;
                          }
                          newState.powers[powerIndex] = power;
                      }
                  }
              }

              // Apply auto rewards immediately (except for training which is handled above if targeted)
              if (activity.autoRewards) {
                  // Resources
                  const res = { ...newState.resources };
                  
                  // MONEY CALCULATION
                  if (activity.type === 'WORK') {
                      const income = calculateWorkIncome(prev, activity).total;
                      res.money += income;
                  } else if (activity.autoRewards.money) {
                      res.money += activity.autoRewards.money;
                  }

                  // Identity Check for Fame/Opinion in Downtime
                  if (player.identity === Identity.SUPER) {
                      if (activity.autoRewards.fame) res.fame += activity.autoRewards.fame;
                      if (activity.autoRewards.publicOpinion) res.publicOpinion += activity.autoRewards.publicOpinion;
                  }

                  if (activity.autoRewards.mask) res.mask = Math.min(100, res.mask + activity.autoRewards.mask);
                  newState.resources = res;

                  // Apply generic stat rewards if NOT training specific target (fallback logic)
                  if (!trainingTarget) {
                      const stats = { ...newState.stats };
                      if (activity.autoRewards.smarts) stats.smarts += activity.autoRewards.smarts;
                      if (activity.autoRewards.charm) stats.charm += activity.autoRewards.charm;
                      if (activity.autoRewards.coordination) stats.coordination += activity.autoRewards.coordination;
                      if (activity.autoRewards.will) stats.will += activity.autoRewards.will;
                      newState.stats = stats;
                  }

                  // Items (Auto)
                  if (activity.autoRewards.itemIds) {
                      activity.autoRewards.itemIds.forEach(id => {
                          const item = gameState.shopItems.find(i => i.id === id);
                          if(item) newState.inventory.push(item);
                      });
                  }
              }

              // Add log message
              setGameState(p => ({ 
                  ...p, 
                  logs: [...p.logs, (activity.autoLog || `Did ${activity.title}.`) + logDetails] 
              }));

              return newState;
          });
      }
  };

  const handleBuyItem = (item: Item) => {
      if (player.resources.money >= item.cost) {
          setPlayer(p => ({
              ...p,
              resources: { ...p.resources, money: p.resources.money - item.cost },
              inventory: [...p.inventory, item]
          }));
      }
  };

  const handleEquipItem = (item: Item) => {
      if (!item.slotType) return;
      const current = player.equipment[item.slotType];
      setPlayer(p => ({
          ...p,
          equipment: { ...p.equipment, [item.slotType!]: item },
          inventory: current ? [...p.inventory.filter(i => i.id !== item.id), current] : p.inventory.filter(i => i.id !== item.id)
      }));
  };

  const handleUnequipItem = (item: Item) => {
      if (!item.slotType) return;
      setPlayer(p => ({
          ...p,
          equipment: { ...p.equipment, [item.slotType!]: null },
          inventory: [...p.inventory, item]
      }));
  };

  const handleUseItem = (item: Item) => {
      // Apply effects
      if (item.effects) {
          setPlayer(p => {
              const res = { ...p.resources };
              const stats = { ...p.stats };
              if (item.effects?.money) res.money += item.effects.money;
              // ... map other effects
              return { ...p, resources: res, stats, inventory: item.singleUse ? p.inventory.filter(i => i.id !== item.id) : p.inventory };
          });
      }
  };

  const handleUpgradeBase = (upgrade: BaseUpgrade) => {
      if (player.resources.money >= upgrade.cost) {
          setPlayer(p => ({
              ...p,
              resources: { ...p.resources, money: p.resources.money - upgrade.cost },
              baseUpgrades: p.baseUpgrades.map(u => u.id === upgrade.id ? { ...u, owned: true } : u)
          }));
      }
  };

  const handlePurchaseUpgrade = (powerId: string, upgradeId: string) => {
      const power = player.powers.find(p => p.id === powerId);
      if (!power) return;
      const upgrade = power.upgrades.find(u => u.id === upgradeId);
      if (!upgrade || upgrade.unlocked || player.skillPoints < upgrade.cost) return;

      const newPower = {
          ...power,
          upgrades: power.upgrades.map(u => u.id === upgradeId ? { ...u, unlocked: true } : u),
          abilities: upgrade.type === 'ABILITY' ? [...power.abilities, upgrade.name] : power.abilities
      };

      setPlayer(p => ({
          ...p,
          skillPoints: p.skillPoints - upgrade.cost,
          powers: p.powers.map(pow => pow.id === powerId ? newPower : pow)
      }));
  };

  const handleAddPlayerPower = (powerTemplate: Power) => {
      const newPower: Power = {
          ...powerTemplate,
          id: `p-${Date.now()}-${Math.random().toString(36).substr(2,5)}`,
          level: 1,
          xp: 0,
          maxXp: 100,
          // Reset upgrades to unlocked: false
          upgrades: powerTemplate.upgrades.map(u => ({...u, unlocked: false})),
          abilities: [] // Reset abilities (must be unlocked via tree usually, or keep base if any)
      };
      // Keep basic abilities if they come pre-unlocked in template logic (simplification: assume empty start or basic)
      // Actually, let's keep the template's abilities list as "Starting Abilities" if any are defined as implicitly unlocked?
      // For now, reset to empty to force progression, unless template has them.
      // Revert: Copy template abilities as base set.
      newPower.abilities = [...powerTemplate.abilities];

      setPlayer(p => ({
          ...p,
          powers: [...p.powers, newPower]
      }));
  };

  const handleDeletePlayerPower = (powerId: string) => {
      setPlayer(p => ({
          ...p,
          powers: p.powers.filter(pow => pow.id !== powerId)
      }));
  };

  // --- CRUD & Settings Handlers ---

  const handleSaveTask = (task: Task) => setGameState(p => ({ ...p, taskPool: p.taskPool.some(t => t.id === task.id) ? p.taskPool.map(t => t.id === task.id ? task : t) : [...p.taskPool, task] }));
  const handleSaveItem = (item: Item) => setGameState(p => ({ ...p, shopItems: p.shopItems.some(i => i.id === item.id) ? p.shopItems.map(i => i.id === item.id ? item : i) : [...p.shopItems, item] }));
  const handleSaveDowntime = (act: DowntimeActivity) => setGameState(p => ({ ...p, downtimeActivities: p.downtimeActivities.some(a => a.id === act.id) ? p.downtimeActivities.map(a => a.id === act.id ? act : a) : [...p.downtimeActivities, act] }));
  const handleSaveUpgrade = (upg: BaseUpgrade) => setPlayer(p => ({ ...p, baseUpgrades: p.baseUpgrades.some(u => u.id === upg.id) ? p.baseUpgrades.map(u => u.id === upg.id ? upg : u) : [...p.baseUpgrades, upg] }));
  const handleSaveEvent = (evt: CalendarEvent) => setGameState(p => ({ ...p, calendarEvents: p.calendarEvents.some(e => e.id === evt.id) ? p.calendarEvents.map(e => e.id === evt.id ? evt : e) : [...p.calendarEvents, evt] }));
  
  const handleSavePool = (pool: TaskPool, type: 'TASK' | 'RANDOM') => {
      setGameState(p => {
          if (type === 'TASK') {
              return { ...p, taskPools: p.taskPools.some(tp => tp.id === pool.id) ? p.taskPools.map(tp => tp.id === pool.id ? pool : tp) : [...p.taskPools, pool] };
          } else {
              return { ...p, randomEventPools: p.randomEventPools.some(rp => rp.id === pool.id) ? p.randomEventPools.map(rp => rp.id === pool.id ? pool : rp) : [...p.randomEventPools, pool] };
          }
      });
  };

  const handleSaveDayConfig = (day: number, config: any) => setGameState(p => ({ ...p, dayConfigs: { ...p.dayConfigs, [day]: config } }));
  const handleUpdateDailyConfig = (config: Partial<DailyTaskConfig>) => setGameState(p => ({ ...p, dailyConfig: { ...p.dailyConfig, ...config } }));

  const handleAddCodexEntry = (entry: Partial<CodexEntry>, initialRep: number) => {
      const newEntry: CodexEntry = {
          id: `codex-${Date.now()}`,
          title: entry.title || 'Unknown',
          category: entry.category || 'NPC',
          content: entry.content || '',
          unlocked: true,
          relationship: { civilianRep: initialRep, superRep: initialRep, knowsIdentity: false },
          ...entry
      };
      setGameState(p => ({ ...p, codex: [...p.codex, newEntry] }));
      // Optionally add to player reputation map for legacy support
      if (initialRep !== 0) {
          setPlayer(prev => ({
              ...prev,
              reputations: { ...prev.reputations, [newEntry.title]: initialRep }
          }));
      }
  };

  const handleAddSuggestion = (text: string) => {
      setGameState(p => ({
          ...p,
          taskSuggestions: [...(p.taskSuggestions || []), { id: `sug-${Date.now()}`, text, createdDay: p.day }]
      }));
  };

  const handleDeleteSuggestion = (id: string) => {
      setGameState(p => ({
          ...p,
          taskSuggestions: (p.taskSuggestions || []).filter(s => s.id !== id)
      }));
  };

  const handleAddLockToEntity = (type: 'TASK', id: string, condition: LockCondition) => {
      if (type === 'TASK') {
          setGameState(p => ({
              ...p,
              taskPool: p.taskPool.map(t => t.id === id ? { ...t, lockConditions: [...(t.lockConditions || []), condition], locked: true } : t)
          }));
      }
  };

  // Music Handling
  const setMusicMood = (mood: MusicContext) => setGameState(p => ({ ...p, music: { ...p.music, currentMood: mood } }));
  const setMusicVolume = (vol: number) => setGameState(p => ({ ...p, music: { ...p.music, volume: vol } }));
  const toggleMusic = () => setGameState(p => ({ ...p, music: { ...p.music, isPlaying: !p.music.isPlaying } }));
  const handleSaveTrack = (track: MusicTrack) => setGameState(p => ({ ...p, music: { ...p.music, tracks: p.music.tracks.some(t => t.id === track.id) ? p.music.tracks.map(t => t.id === track.id ? track : t) : [...p.music.tracks, track] } }));
  const handleDeleteTrack = (id: string) => setGameState(p => ({ ...p, music: { ...p.music, tracks: p.music.tracks.filter(t => t.id !== id) } }));

  // World State & Meta
  const handleUpdateNewsSettings = (settings: NewsSettings) => setGameState(p => ({ ...p, newsSettings: settings }));
  const handleApplyNewsImpact = (impact: { resources: Partial<PlayerResources>, codex: Partial<CodexEntry>[], modifiers?: string }) => {
      // Apply immediate impacts
      const newPlayer = { ...player };
      Object.entries(impact.resources).forEach(([k, v]) => {
          (newPlayer.resources as any)[k] = Math.max(0, (newPlayer.resources as any)[k] + v);
      });
      setPlayer(newPlayer);
      
      impact.codex.forEach(c => handleAddCodexEntry(c, 0));
      
      if (impact.modifiers) {
          // Update current news modifier
          if (pendingNews) {
              const updatedNews = { ...pendingNews, modifiers: impact.modifiers };
              setGameState(p => ({
                  ...p,
                  activeNews: updatedNews,
                  newsHistory: p.newsHistory.map(n => n.day === updatedNews.day ? updatedNews : n)
              }));
          }
      }
      setPendingNews(null);
  };

  const handleResetGame = () => {
      localStorage.removeItem('sentinel_player');
      localStorage.removeItem('sentinel_gamestate');
      window.location.reload();
  };

  const handleExportSave = () => {
      const data = { player, gameState };
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sentinel-save-day${gameState.day}.json`;
      a.click();
  };

  const handleLoadSaveData = (data: any) => {
      if (data.player && data.gameState) {
          setPlayer(data.player);
          setGameState({
              ...INITIAL_GAME_STATE,
              ...data.gameState,
              taskSuggestions: data.gameState.taskSuggestions || [],
              archivedSuggestions: data.gameState.archivedSuggestions || [],
              automators: data.gameState.automators || [],
          });
          return true;
      }
      return false;
  };

  const handleImportSave = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const data = JSON.parse(e.target?.result as string);
              if (!handleLoadSaveData(data)) {
                  throw new Error("Invalid save structure");
              }
          } catch (err) {
              console.error("Save load failed", err);
              setError("Failed to load save file. It may be corrupted.");
          }
      };
      reader.readAsText(file);
  };

  const handleSaveWeekThemes = (themes: WeekTheme[]) => setGameState(p => ({ ...p, weekThemes: themes }));
  const handleUpdateGenerationModel = (model: 'gemini-3-flash-preview' | 'gemini-3-pro-preview') => setGameState(p => ({ ...p, generationModel: model }));
  
  const handleImportWorldData = (data: any) => {
      const { wipeFirst, codex, items, upgrades, tasks, events, weekThemes, automators, taskPools, dayConfigs } = data;
      
      if (wipeFirst) {
          setGameState(p => ({
              ...INITIAL_GAME_STATE,
              codex, shopItems: items, taskPool: tasks, calendarEvents: events,
              weekThemes: weekThemes || [], automators: automators || [],
              taskPools: taskPools || [], dayConfigs: dayConfigs || {},
              generationModel: p.generationModel
          }));
          setPlayer(p => ({ ...p, baseUpgrades: upgrades }));
      } else {
          setGameState(p => ({
              ...p,
              codex: [...p.codex, ...codex],
              shopItems: [...p.shopItems, ...items],
              taskPool: [...p.taskPool, ...tasks],
              calendarEvents: [...p.calendarEvents, ...events],
              weekThemes: weekThemes ? [...p.weekThemes, ...weekThemes] : p.weekThemes,
              automators: automators ? [...p.automators, ...automators] : p.automators,
              taskPools: taskPools ? [...p.taskPools, ...taskPools] : p.taskPools,
              dayConfigs: { ...p.dayConfigs, ...(dayConfigs || {}) }
          }));
          setPlayer(p => ({ ...p, baseUpgrades: [...p.baseUpgrades, ...upgrades] }));
      }
  };

  const handleSavePower = (power: Power) => setGameState(p => ({ ...p, powerTemplates: p.powerTemplates.some(po => po.id === power.id) ? p.powerTemplates.map(po => po.id === power.id ? power : po) : [...p.powerTemplates, power] }));
  const handleSaveAutomator = (auto: Automator) => setGameState(p => ({ ...p, automators: p.automators.some(a => a.id === auto.id) ? p.automators.map(a => a.id === auto.id ? auto : a) : [...p.automators, auto] }));
  const handleSaveCodex = (entry: CodexEntry) => setGameState(p => ({ ...p, codex: p.codex.some(c => c.id === entry.id) ? p.codex.map(c => c.id === entry.id ? entry : c) : [...p.codex, entry] }));
  const handleDeleteItem = (type: string, id: string) => { setGameState(p => { switch(type) { 
      case 'TASK': return { ...p, taskPool: p.taskPool.filter(t => t.id !== id) }; 
      case 'ITEM': return { ...p, shopItems: p.shopItems.filter(i => i.id !== id) }; 
      case 'EVENT': return { ...p, calendarEvents: p.calendarEvents.filter(e => e.id !== id) }; 
      case 'DOWNTIME': return { ...p, downtimeActivities: p.downtimeActivities.filter(a => a.id !== id) }; 
      case 'POOL': return { ...p, taskPools: p.taskPools.filter(l => l.id !== id), randomEventPools: p.randomEventPools.filter(l => l.id !== id) }; 
      case 'CODEX': return { ...p, codex: p.codex.filter(c => c.id !== id) }; 
      case 'POWER': return { ...p, powerTemplates: p.powerTemplates.filter(po => po.id !== id) }; 
      case 'AUTOMATOR': return { ...p, automators: p.automators.filter(a => a.id !== id) };
      default: return p; } }); if (type === 'UPGRADE') setPlayer(prev => ({ ...prev, baseUpgrades: prev.baseUpgrades.filter(u => u.id !== id) })); };

  const handleSavePlayerPower = (power: Power) => {
      setPlayer(prev => ({
          ...prev,
          powers: prev.powers.map(p => p.id === power.id ? power : p)
      }));
  };

  const handleCancelProcessing = () => {
      setProcessingState(null);
      setGameState(prev => ({ ...prev, isProcessing: false }));
      setError("Processing manually stopped. Some daily events may not have triggered.");
  };

  const dismissError = () => setError(null);

  return {
      player,
      gameState,
      currentScenario,
      pendingNews, 
      dailyReport, 
      processingState, 
      error,
      setPlayer,
      setGameState,
      setCurrentScenario,
      setDailyReport, 
      toggleIdentity,
      handleIdentitySwitch,
      handleUpdatePlayer,
      handleNextDay,
      handleTaskSelect,
      handleScenarioComplete,
      handleAutoResolveTask,
      handleDowntime,
      handleBuyItem,
      handleEquipItem,
      handleUnequipItem,
      handleUpgradeBase,
      handleUseItem,
      handlePurchaseUpgrade,
      handleAddPlayerPower,
      handleDeletePlayerPower,
      handleAddCodexEntry,
      handleAddLockToEntity,
      handleSaveTask,
      handleSaveItem,
      handleSaveDowntime,
      handleSaveUpgrade,
      handleSaveEvent,
      handleSavePool,
      handleSaveDayConfig,
      handleUpdateDailyConfig,
      handleSavePower,
      handleSavePlayerPower,
      handleSaveAutomator,
      handleSaveCodex,
      handleDeleteItem,
      handleApplyNewsImpact, 
      handleUpdateNewsSettings, 
      handleResetGame, 
      handleExportSave, 
      handleImportSave, 
      handleSaveWeekThemes, 
      handleImportWorldData, 
      handleUpdateGenerationModel, 
      handleUnlockSecret,
      handleAddSuggestion,
      handleDeleteSuggestion,
      setMusicMood,
      setMusicVolume,
      toggleMusic,
      handleSaveTrack,
      handleDeleteTrack,
      dismissError,
      handleCancelProcessing,
      handleLoadSaveData
  };
};
