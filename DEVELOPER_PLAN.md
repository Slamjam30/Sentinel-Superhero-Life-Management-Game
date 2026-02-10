
# DEVELOPER PLAN: Sentinel Superhero Simulator

This document serves as the master checklist for the "Sentinel" project, strictly adhering to the Game Design Document (PDF).

## 1. Data Structure & Mechanics (Foundation)

- [x] **Codex Structure**
    - [x] `secrets` array (Unlockable text).
    - [x] `relationship` object (`civilianRep`, `superRep`, `knowsIdentity`).
    - [x] `appearance` fields.

- [x] **Locking Mechanism**
    - [x] Support locks on Tasks, Quests, Items, Upgrades, Events.
    - [x] Condition Types: Stat, Resource, Item, Tag, Quest State, Day, Reputation, Upgrade, Mask Integrity.

- [x] **Task Mechanics**
    - [x] `listensToNews` boolean.
    - [x] `Play Mode` (Freeform/Structured).
    - [x] **Scalability:** Implement logic in `useGameEngine` to increase difficulty of "Scalable" tasks based on `startDay` and `interval`.
    - [x] **Completion Tracking:** Ensure tasks cannot be repeated on the same day if completed.

- [x] **Economy & Progression**
    - [x] **Weekly Deductions:** Implement strict Rent/Lifestyle cost deduction every 7 days in `handleNextDay`.
    - [x] **Skill Trees:** Verify XP -> Skill Point -> Unlock flow is fully functional in `SkillTreeModal`.

## 2. Core Logic Engines (The Brain)

- [x] **Strict Power Logic (Critical)**
    - [x] **Requirement:** Players can ONLY use unlocked abilities.
    - [x] **Implementation:** Narrative prompt explicitly forbids using abilities not listed in `player.powers`.

- [x] **Weekly Progression**
    - [x] **Requirement:** Weekly Summary generation.
    - [x] **Implementation:** Trigger AI summary on `day % 7 === 0` and append to Codex.

- [x] **Automators**
    - [x] Generation of Tasks, Items, Upgrades.
    - [x] **News Automator:** Ensure news stories actually trigger the creation of related Tasks/Quests.

## 3. Narrative & AI Integration

- [x] **Scenario Context Injection**
    - [x] **Requirement:** Auto-inject relevant Codex entries.
    - [x] **Implementation:** Keyword scanner in `narrator.ts`.

- [x] **Dynamic Difficulty**
    - [x] Compare `Player Power Level` vs `Task Difficulty` in AI prompt.

- [x] **Narrative Polish (GDD Specifics)**
    - [x] **Context Highlighting:** In `ScenarioPlayer`, detect names/terms present in the Codex and highlight them (Tooltip/Link) for QoL.
    - [x] **Visual Rolls:** Ensure AI outputs rolls in a format we can parse and display visually (e.g., `[ROLL: Strength | 15/20]`).
    - [x] **Secret Discovery:** AI outputs `[SECRET: ...]` tags to unlock Codex secrets during gameplay.
    - [x] **AI Safety:** Ensure "Plot Plan Review" step exists for long-form generation (Quests).

## 4. Gameplay Loop & UI

- [x] **Day 1 Experience**
    - [x] **Flashback:** Explicitly inject the "Origin Story" flashback task on Day 1 if character creation was custom.

- [x] **Downtime Activities**
    - [x] Training (Auto/RP).
    - [x] Work (Auto/RP).
    - [x] Socialize (Requires Rep > 20).
    - [x] **Search for Quests:** Implement a specific downtime action that polls the `Quest` pool for potential starters.

- [x] **Identity Management**
    - [x] Switching mechanism.
    - [x] **Mask Calculation:** Allow user to "Confirm/Deny" or at least see the breakdown of the Mask Penalty calculation before committing.

- [x] **UI/UX Polish**
    - [x] **Loading Screens:** Visual feedback during AI processing (News/Day End).
    - [x] **Sidebar:** Vertical scrollbar for overflowing tags/powers.
    - [x] **Music:** Tracks must loop automatically.

## 5. Editor & Tools

- [x] **Editor Mode:** Toggleable global edit mode.
- [x] **Manual Creation:** Forms for all asset types.
- [x] **AI Creation:** Prompt-based generation for all asset types.
- [x] **Node Graph:** Visual graph showing relations (e.g., Task inside Task Pool, Upgrade locking a Quest).

---

## Development Guidelines
1.  **File Size:** Keep files < 600 lines. Split `useGameEngine` or `ScenarioPlayer` if they grow too large.
2.  **Documentation:** Update this plan as features are marked `[x]`.
