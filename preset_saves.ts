
export const PRESET_SAVES = [
  {
    label: "Demo Campaign (Day 1)",
    description: "Start with a pre-generated world, characters, and ongoing events.",
    data: {
      "player": {
        "hasCreatedCharacter": true,
        "hasPlayedFlashback": false,
        "name": "Cade Wayman",
        "civilianName": "Cade Wayman",
        "superName": "The Sentinel",
        "civilianAppearance": "Average build, wears thick glasses and a casual button-down.",
        "superAppearance": "Blue and white supersuit with a central emblem on the chest.",
        "identity": "CIVILIAN",
        "stats": { "smarts": 4, "charm": 5, "coordination": 4, "will": 4 },
        "resources": { "money": 500, "mask": 100, "fame": 0, "publicOpinion": 0 },
        "skillPoints": 0,
        "powers": [
          {
            "id": "p-1770679638526",
            "name": "Super Strength",
            "description": "Enhanced physical muscular density allowing for feats of massive lifting and striking.",
            "tier": "HEROIC",
            "level": 1,
            "xp": 0,
            "maxXp": 100,
            "abilities": ["Power Punch", "Leap"],
            "upgrades": [
              { "id": "str-1", "name": "Ground Smash", "description": "AOE knockdown.", "cost": 1, "requiredLevel": 1, "unlocked": false, "type": "ABILITY" },
              { "id": "str-2", "name": "Unbreakable Skin", "description": "Passive defense boost.", "cost": 2, "requiredLevel": 2, "unlocked": false, "type": "PASSIVE", "parentId": "str-1" }
            ]
          }
        ],
        "tags": ["Rookie"],
        "backstory": "Cade got his powers from an unknown science experiment.",
        "job": "Journalist",
        "inventory": [],
        "equipment": { "HEAD": null, "BODY": null, "GADGET": null, "ACCESSORY": null },
        "baseUpgrades": [],
        "downtimeTokens": 2,
        "reputations": {}
      },
      "gameState": {
        "day": 1,
        "activeTasks": [
          {
            "id": "flashback-origin",
            "title": "Origin Story: The Catalyst",
            "description": "Before you became a hero, there was a moment that started it all. Relive your origin.",
            "type": "Event",
            "difficulty": 0,
            "requiredIdentity": "CIVILIAN",
            "rewards": { "fame": 10, "will": 0.5 },
            "mode": "FREEFORM",
            "context": "You are playing through your Origin Story flashback. Describe the specific events that led to you gaining your powers or deciding to become a hero. This defines your character's motivation.",
            "isMandatory": true,
            "locked": false
          }
        ],
        "taskPool": [
          { "type": "Event", "difficulty": 1, "requiredIdentity": "SUPER", "mode": "FREEFORM", "rewards": {}, "title": "Event: The Press Conference", "description": "The city wants to know who you are.", "id": "man-task-1770671850097", "reputationTargets": [], "lockConditions": [], "locked": false, "context": "Microphones are shoved in your face. Mayor Vance is watching from the sidelines. The reporters are shouting questions. \"Are you with the police? Are you a threat? Are you a hero?\"" },
          { "type": "Mission", "difficulty": 4, "requiredIdentity": "SUPER", "mode": "FREEFORM", "rewards": {}, "title": "Event: The Detective", "description": "Detective Silas Graves reaches out.", "id": "man-task-1770671984937", "reputationTargets": [], "lockConditions": [], "locked": false, "context": "You find a note left on your usual rooftop vantage point. It smells of cheap tobacco. \"Meet me at the docks. Come alone. - Graves.\"" },
          { "type": "Mission", "difficulty": 1, "requiredIdentity": "CIVILIAN", "mode": "FREEFORM", "rewards": {}, "title": "Event: Neon Signs", "description": "Get footage of Graffiti for work.", "id": "man-task-1770672147372", "reputationTargets": [], "lockConditions": [], "locked": false, "context": "Your editor at The Sentinel slams a file on your desk. \"Graffiti in The Rust is changing. Go take photos. Don't get mugged.\"" },
          { "type": "Event", "difficulty": 1, "requiredIdentity": "CIVILIAN", "mode": "FREEFORM", "rewards": {}, "title": "Event: Late Again", "description": "Your double life causes you to miss a deadline.", "id": "man-task-1770672272736", "reputationTargets": [], "lockConditions": [], "locked": false, "context": "Your boss is screaming. You missed the morning meeting because you were stopping a bus from crashing. You can't tell him why." },
          { "type": "Event", "difficulty": 2, "requiredIdentity": "SUPER", "mode": "FREEFORM", "rewards": {}, "title": "Event: Quiet Night", "description": "Suspiciously low crime rate tonight.", "id": "man-task-1770672524187", "reputationTargets": [], "lockConditions": [], "locked": false, "context": "You patrol for hours. Nothing. The police scanner is silent. It's unnerving. Is this peace, or is something holding its breath?" },
          { "type": "Event", "difficulty": 1, "requiredIdentity": "CIVILIAN", "mode": "FREEFORM", "rewards": {}, "title": "Event: Mayor's Gala", "description": "High profile event at Monument Plaza.", "id": "man-task-1770672661350", "reputationTargets": ["Mayor Vance", "David Vance"], "lockConditions": [], "locked": false, "context": "Work has given you an opportunity to attend the Gala. The Mayor is there. David Vance is drunk near the fountain. It's a networking goldmine if you want to attend." },
          { "type": "Event", "difficulty": 1, "requiredIdentity": "SUPER", "mode": "FREEFORM", "rewards": {}, "title": "Event: The Warning", "description": "Detective Graves has bad news.", "id": "man-task-1770672852521", "reputationTargets": [], "lockConditions": [], "locked": false, "context": "Graves left you a note to meet up again. He looks older than usual tonight. \"The small gangs are quieting down. That means the big fish are eating them. Watch your back, kid.\"" },
          { "type": "Patrol", "difficulty": 1, "requiredIdentity": "SUPER", "mode": "FREEFORM", "rewards": {}, "title": "Convenience Shop Robbery", "description": "Stop the robbery of a convenience store in The Rust.", "id": "man-task-1770673066922", "reputationTargets": ["Law Enforcement"], "lockConditions": [], "locked": false, "context": "A couple of thugs are breaking into a convenience store." },
          { "type": "Work", "difficulty": 1, "requiredIdentity": "CIVILIAN", "mode": "FREEFORM", "rewards": { "money": 50 }, "title": "The Morning Edition", "description": "Get some kind of content for tomorrow morning's paper.", "id": "man-task-1770673249843", "reputationTargets": [], "lockConditions": [], "locked": false, "context": "The morning rush is intense today. You barely make it through, but your boss orders you to get some kind of substantial content for tomorrow. A high-quality photo of a hero, a quote, or something else. And he needs it before tomorrow morning." },
          { "type": "Mission", "difficulty": 1, "requiredIdentity": "SUPER", "mode": "FREEFORM", "rewards": { "publicOpinion": 1 }, "title": "Cat in a Tree", "description": "A classic low-stakes rescue.", "id": "man-task-1770673312963", "reputationTargets": [], "lockConditions": [], "locked": false, "context": "It’s a cliché, but the distressed person on the sidewalk doesn't care. The cat is stuck on a high branch in Monument Plaza." },
          { "type": "Mission", "difficulty": 2, "requiredIdentity": "SUPER", "mode": "FREEFORM", "rewards": {}, "title": "Graves' Request", "description": "Retrieve a piece of evidence police couldn't get without a warrant.", "id": "man-task-1770673373677", "reputationTargets": ["Detective Silas Graves"], "lockConditions": [], "locked": false, "context": "Graves sighs, lighting a cigarette. \"I know a guy holding a shipment of basic weapons. I can't go in. You can.\"" },
          { "type": "Work", "difficulty": 1, "requiredIdentity": "CIVILIAN", "mode": "FREEFORM", "rewards": { "money": 50 }, "title": "Editorial Mandate", "description": "Write an article about Mayor Vance's infrastructure plan.", "id": "man-task-1770673411622", "reputationTargets": [], "lockConditions": [], "locked": false, "context": "It's a boring puff piece, but it pays the bills. You need to attend a boring city council meeting and take notes." },
          { "type": "Mission", "difficulty": 1, "requiredIdentity": "SUPER", "mode": "FREEFORM", "rewards": {}, "title": "Rooftop Parkour", "description": "Traverse the skyline to test your limits.", "id": "man-task-1770673461880", "reputationTargets": [], "lockConditions": [], "locked": false, "context": "The night is clear. The path from the Financial District to The Rust is a maze of vents and ledges. Time to run." },
          { "type": "Mission", "difficulty": 1, "requiredIdentity": "SUPER", "mode": "FREEFORM", "rewards": { "publicOpinion": 2 }, "title": "Stop the Mugging", "description": "Intervene in a street crime.", "id": "man-task-1770673555866", "reputationTargets": [], "lockConditions": [], "locked": false, "context": "A scream echoes from an nearby alleyway. Two thugs have cornered someone." },
          { "type": "Mission", "difficulty": 2, "requiredIdentity": "SUPER", "mode": "FREEFORM", "rewards": {}, "title": "Car Crash", "description": "You spot two cars about to collide.", "id": "man-task-1770673672793", "reputationTargets": [], "lockConditions": [], "locked": false, "context": "While on patrol, you pass by two cars about to crash, You only have a few seconds to react, if you can." },
          { "type": "Work", "difficulty": 2, "requiredIdentity": "CIVILIAN", "mode": "FREEFORM", "rewards": {}, "title": "Fluff Piece", "description": "Write a boring article to appease your boss.", "id": "man-task-1770673777344", "reputationTargets": [], "lockConditions": [], "locked": false, "context": "Your boss demands 1000 words on the \"Beautification of Monument Plaza.\" It is soul-crushing work when you could be fighting crime." },
          { "type": "Mission", "difficulty": 3, "requiredIdentity": "SUPER", "mode": "FREEFORM", "rewards": {}, "title": "Syndicate Takedown", "description": "Stop a Neon Syndicate operation in The Rust.", "id": "man-task-1770673839326", "reputationTargets": [], "lockConditions": [], "locked": false, "context": "A group of punks with glowing LED implants are breaking into an electronics store. They aren't stealing money; they're stealing specific circuit boards." },
          { "type": "Mission", "difficulty": 3, "requiredIdentity": "SUPER", "mode": "FREEFORM", "rewards": {}, "title": "Syndicate Safehouse", "description": "Raid a warehouse in The Rust.", "id": "man-task-1770674007284", "reputationTargets": ["Neon Syndicate"], "lockConditions": [], "locked": false, "context": "After previously fighting some Neon Syndicate thugs, you have found the location of a Syndicate weapons safehouse." },
          { "type": "Patrol", "difficulty": 2, "requiredIdentity": "CIVILIAN", "mode": "FREEFORM", "rewards": {}, "title": "Vance's Son", "description": "Help David Vance out of a jam without him knowing you're a hero.", "id": "man-task-1770674106911", "reputationTargets": [], "lockConditions": [], "locked": false, "context": "David is too distracted and flashing too much cash in a bad neighborhood. Too much longer, and someone will take advantage of the situation." },
          { "type": "Event", "difficulty": 2, "requiredIdentity": "SUPER", "mode": "FREEFORM", "rewards": {}, "title": "Cinder", "description": "Investigate rumors of a man made of fire.", "id": "man-task-1770674167449", "reputationTargets": [], "lockConditions": [], "locked": false, "context": "There are scorch marks in the alleyways shaped like footprints. Locals are whispering about a \"Fire God\"." },
          { "type": "Mission", "difficulty": 3, "requiredIdentity": "CIVILIAN", "mode": "FREEFORM", "rewards": {}, "title": "Sleep Deprived", "description": "Stay awake for 36 hours to balance work and patrol.", "id": "man-task-1770674239692", "reputationTargets": [], "lockConditions": [], "locked": false, "context": "You are running on caffeine and adrenaline. You need to finish an article and patrol Sector 4 in the same night. How will you manage this?" },
          { "type": "Mission", "difficulty": 1, "requiredIdentity": "SUPER", "mode": "FREEFORM", "rewards": { "publicOpinion": 3 }, "title": "Public Relations", "description": "How do you interact with the public?", "id": "man-task-1770674355174", "reputationTargets": [], "lockConditions": [], "locked": false, "context": "You have a few minutes in between patrols. A crowd of reporters and civilians has gathered nearby. Will you interact with them?" },
          { "type": "Mission", "difficulty": 2, "requiredIdentity": "SUPER", "mode": "FREEFORM", "rewards": {}, "title": "Bank Robbery", "description": "One of the city banks is in danger.", "id": "man-task-1770674410613", "reputationTargets": [], "lockConditions": [], "locked": false, "context": "You arrive at the bank- the alarms are going off. You can see a few thugs inside, along with some civilians. You'll have to be careful." },
          { "type": "Work", "difficulty": 1, "requiredIdentity": "CIVILIAN", "mode": "FREEFORM", "rewards": { "money": -500 }, "title": "Event: Rent Due", "description": "Rent is due today. ($500)", "id": "man-task-1770674909958", "reputationTargets": [], "lockConditions": [], "locked": false, "context": "" }
        ],
        "taskPools": [
          { "name": "Week 1 Tasks", "tasks": ["man-task-1770673066922", "man-task-1770673249843", "man-task-1770673312963", "man-task-1770673373677", "man-task-1770673411622", "man-task-1770673461880", "man-task-1770673555866", "man-task-1770673672793"], "description": "Week 1 Tasks (Level 1-2)", "id": "man-pool-1770675080121" },
          { "name": "Week 2 Tasks", "tasks": ["man-task-1770673777344", "man-task-1770673839326", "man-task-1770674007284", "man-task-1770674106911", "man-task-1770674239692", "man-task-1770674355174", "man-task-1770674410613"], "description": "Week 2 Tasks (Level 1-3)", "id": "man-pool-1770675129108" }
        ],
        "randomEventPools": [
          { "id": "rp1", "name": "City Disasters", "description": "Accidents and emergencies.", "tasks": ["re1"] },
          { "id": "rp2", "name": "Pet Rescues", "description": "Low stakes wholesome moments.", "tasks": ["re2"] }
        ],
        "powerTemplates": [
          {
            "id": "p-strength",
            "name": "Super Strength",
            "description": "Enhanced physical muscular density allowing for feats of massive lifting and striking.",
            "tier": "HEROIC",
            "level": 1,
            "xp": 0,
            "maxXp": 100,
            "abilities": ["Power Punch", "Leap"],
            "upgrades": [
              { "id": "str-1", "name": "Ground Smash", "description": "AOE knockdown.", "cost": 1, "requiredLevel": 1, "unlocked": false, "type": "ABILITY" },
              { "id": "str-2", "name": "Unbreakable Skin", "description": "Passive defense boost.", "cost": 2, "requiredLevel": 2, "unlocked": false, "type": "PASSIVE", "parentId": "str-1" }
            ]
          },
          {
            "id": "p-telepathy",
            "name": "Telepathy",
            "description": "Read minds and project thoughts. Mental manipulation.",
            "tier": "HEROIC",
            "level": 1,
            "xp": 0,
            "maxXp": 100,
            "abilities": ["Mind Read", "Confusion"],
            "upgrades": [
              { "id": "mind-1", "name": "Psionic Blast", "description": "Mental damage attack.", "cost": 1, "requiredLevel": 1, "unlocked": false, "type": "ABILITY" },
              { "id": "mind-2", "name": "Mind Control", "description": "Take control of an enemy.", "cost": 3, "requiredLevel": 3, "unlocked": false, "type": "ABILITY", "parentId": "mind-1" }
            ]
          },
          {
            "id": "p-pyro",
            "name": "Pyrokinesis",
            "description": "Generate and control fire.",
            "tier": "STREET",
            "level": 1,
            "xp": 0,
            "maxXp": 100,
            "abilities": ["Fireball"],
            "upgrades": [
              { "id": "fire-1", "name": "Flame Shield", "description": "Defensive aura.", "cost": 1, "requiredLevel": 1, "unlocked": false, "type": "ABILITY" },
              { "id": "fire-2", "name": "Inferno", "description": "Massive fire damage.", "cost": 2, "requiredLevel": 2, "unlocked": false, "type": "ABILITY", "parentId": "fire-1" }
            ]
          }
        ],
        "dayConfigs": {},
        "shopItems": [
          { "id": "i1", "name": "Energy Drink", "description": "Restores energy.", "type": "CONSUMABLE", "cost": 20, "singleUse": true, "effects": { "coordination": 1 } },
          { "id": "i2", "name": "Tactical Visor", "description": "Helps analyze threats.", "type": "GEAR", "slotType": "HEAD", "cost": 1000, "singleUse": false, "effects": { "smarts": 2 }, "conditions": [] },
          { "id": "i3", "name": "Kevlar Vest", "description": "Basic protection.", "type": "GEAR", "slotType": "BODY", "cost": 1000, "singleUse": false, "effects": { "will": 2 }, "conditions": [] },
          { "id": "i4", "name": "Utility Belt", "description": "Holds gadgets.", "type": "GEAR", "slotType": "ACCESSORY", "cost": 800, "singleUse": false, "effects": { "coordination": 1 }, "conditions": [] }
        ],
        "calendarEvents": [
          { "id": "e_mask_low", "day": 0, "title": "Identity Risk", "description": "Your mask integrity is critically low. Reporters are snooping.", "type": "EVENT", "triggerCondition": { "type": "MASK", "key": "", "operator": "LT", "value": 25 }, "resetCondition": { "type": "MASK", "key": "", "operator": "GT", "value": 75 }, "active": false },
          { "type": "EVENT", "day": 2, "isRandom": false, "linkedTaskId": "man-task-1770671850097", "title": "The Press Conference", "description": "The city wants to know who you are.", "id": "man-evt-1770674474326", "conditions": [] },
          { "type": "EVENT", "day": 3, "isRandom": false, "linkedTaskId": "man-task-1770671984937", "title": "The Detective", "description": "Detective Silas Graves reaches out.", "id": "man-evt-1770674492394", "conditions": [] },
          { "type": "DEADLINE", "day": 5, "isRandom": false, "title": "Rent Due", "description": "Rent is due today. ($500)", "id": "man-evt-1770674565594", "conditions": [], "linkedTaskId": "man-task-1770674909958" },
          { "type": "EVENT", "day": 7, "isRandom": false, "title": "Neon Signs", "description": "Investigating some local Neon Syndicate activity.", "id": "man-evt-1770674631674", "conditions": [] },
          { "type": "EVENT", "day": 8, "isRandom": false, "linkedTaskId": "man-task-1770672272736", "description": "Your double life causes you to miss a deadline.", "title": "Late Again", "id": "man-evt-1770674675236", "conditions": [] },
          { "type": "EVENT", "day": 10, "isRandom": false, "linkedTaskId": "man-task-1770672524187", "description": "Suspiciously low crime rate.", "title": "Quiet Night", "id": "man-evt-1770674715807", "conditions": [] },
          { "type": "EVENT", "day": 11, "isRandom": false, "linkedTaskId": "man-task-1770672661350", "title": "Mayor's Gala", "description": "High profile event at Monument Plaza.", "id": "man-evt-1770674732972", "conditions": [] },
          { "type": "EVENT", "day": 12, "isRandom": false, "title": "Cinder", "description": "Investigate reports of a man on fire.", "linkedTaskId": "man-task-1770674167449", "id": "man-evt-1770674797189", "conditions": [] },
          { "type": "EVENT", "day": 14, "isRandom": false, "title": "The Warning", "description": "Detective Graves has bad news.", "linkedTaskId": "man-task-1770672852521", "id": "man-evt-1770674817563", "conditions": [] }
        ],
        "codex": [
          { "id": "man-codex-1770655876761", "title": "Neon Syndicate", "category": "FACTION", "content": "Originally representing low-level street crime, this group is rapidly evolving alongside the rise of super-individuals. They are the foot soldiers of the city's underbelly who have begun adopting new tech to hold their ground against vigilantes.", "unlocked": false, "relationship": { "civilianRep": 0, "superRep": 0, "knowsIdentity": false }, "appearance": "They favor cyberpunk aesthetics—leather jackets integrated with glowing LED circuitry, neon-dyed hair, and limb braces that suggest low-grade cybernetic or powered enhancements.", "secrets": [{ "text": "They are unknowingly being used as beta-testers for the \"cosmic-level gears\" that appear later in the timeline.", "unlocked": false }, { "text": "They are the first to realize the city is becoming dangerous for non-supers.", "unlocked": false }] },
          { "id": "man-codex-1770655941927", "title": "Aegis Defense Solutions", "category": "FACTION", "content": "A private military corporation presenting themselves as the solution to the city's dangerous escalation. They are the \"shady characters\" looking to make deals, specifically seeking to monetize the superhero trend by offering lucrative contracts to vigilantes who agree to corporate oversight.", "unlocked": true, "relationship": { "civilianRep": 0, "superRep": 0, "knowsIdentity": false }, "appearance": "Clean, sterile, and corporate. Operatives wear matte-black tactical armor with silver \"Aegis\" logos, while their representatives wear high-end suits and project an air of predatory professionalism.", "secrets": [{ "text": "They actively employ \"morally dubious heroes\" to stage incidents that raise their stock value.", "unlocked": false }, { "text": "Aegis serves as a front for the \"supervillain in-play\" who is preparing a long-time scheme.", "unlocked": false }, { "text": "They have a dossier on the player’s civilian identity that they plan to leverage.", "unlocked": false }] },
          { "id": "man-codex-1770656014805", "title": "The Awakened Truth", "category": "FACTION", "content": "As new supervillains show their faces, this cult-like faction has risen to amass a following around them. They believe that super-individuals are the next step in evolution and are gaining significant power in the city by worshipping villains as gods.", "unlocked": false, "relationship": { "civilianRep": -30, "superRep": -30, "knowsIdentity": false }, "appearance": "Members wear hooded robes made of urban fabrics (canvas, denim) dyed deep purple and grey. High-ranking members wear masks mimicking the faces of prominent city supervillains.", "secrets": [{ "text": "The leader is an enemy who has learned of someone the player cares about and is using the cult to get close to them.", "unlocked": false }, { "text": "They are stockpiling resources to help the villains \"change the entire balance of power\".", "unlocked": false }] },
          { "id": "man-codex-1770656846669", "title": "The Gilded Capes", "category": "FACTION", "content": "A small faction of heroes who introduce themselves during the escalation of crime. They are known as heroes who help others.", "unlocked": true, "relationship": { "civilianRep": 0, "superRep": 0, "knowsIdentity": false }, "secrets": [{ "text": "While they appear benevolent, they include morally dubious individuals who may be involved in the city's corruption.", "unlocked": false }, { "text": "There is often some hidden tension in the group over certain sponsors.", "unlocked": false }], "appearance": "They wear over-designed, sponsored costumes designed by their sponsors." },
          { "id": "man-codex-1770657020016", "title": "The Shadow Stalkers", "category": "FACTION", "content": "An elite reconnaissance group working for the player's main enemy. Their sole mission is to find the truth of the player's identity. They are virtually untraceable.", "unlocked": false, "relationship": { "civilianRep": -50, "superRep": -50, "knowsIdentity": false }, "appearance": "They wear stealth suits that blend into the urban environment and use long-range surveillance tech.", "secrets": [{ "text": "They are searching for the players identity.", "unlocked": false }, { "text": "They report directly to the hero's main enemy.", "unlocked": false }] },
          { "id": "man-codex-1770657140999", "title": "Law Enforcement", "category": "FACTION", "content": "Local law enforcement for the city.", "unlocked": true, "relationship": { "civilianRep": 20, "superRep": 0, "knowsIdentity": false }, "appearance": "Typical local-level police gear." },
          { "id": "man-codex-1770657340512", "title": "Aetherius Labs", "category": "FACTION", "content": "A cutting-edge research firm dedicated to studying new technological breakthroughs.", "unlocked": true, "relationship": { "civilianRep": 0, "superRep": 0, "knowsIdentity": false }, "appearance": "Personnel wear pristine, sterile white lab coats with teal identification lanyards.", "secrets": [{ "text": "There is conflict within the company related to what they should study.", "unlocked": false }] },
          { "id": "man-codex-1770657673139", "title": "The Ignition Event", "category": "LORE", "content": "The colloquial term for the unexplained phenomenon 10 years ago, which caused the sudden surge of \"super-individuals\" in the general population. It is the dividing line in history between the \"Old World\" and the current era of heroes and villains.", "unlocked": true, "relationship": { "civilianRep": 0, "superRep": 0, "knowsIdentity": false } },
          { "id": "man-codex-1770657772294", "title": "\"Phase-2\" Ballistics", "category": "LORE", "content": "New tech adopted by organized crime during the Escalation Week. These are experimental weapons that bypass standard police Kevlar, forcing law enforcement to rely on super-powered vigilantes to handle what used to be routine street crime.", "unlocked": false, "relationship": { "civilianRep": 0, "superRep": 0, "knowsIdentity": false }, "secrets": [{ "text": "The technology is actually rejected military hardware sold by shady characters.", "unlocked": false }, { "text": "Prolonged use of these weapons can cause radiation poisoning in the user, a fact the sellers hid.", "unlocked": false }] },
          { "id": "man-codex-1770658258394", "title": "The Sentinel", "category": "LOCATION", "content": "The headquarters of the city's largest news network. It serves as the primary lens through which the public sees unbiased news.", "unlocked": true, "relationship": { "civilianRep": 0, "superRep": 0, "knowsIdentity": false }, "appearance": "A gleaming spire of glass and steel that dominates the skyline, topped with massive satellite dishes. The lobby is a public museum of \"Hero History,\" while the upper floors are frantic, open-plan newsrooms filled with screens monitoring activity." },
          { "id": "man-codex-1770658319048", "title": "Sector 4 \"The Rust\"", "category": "LOCATION", "content": "A neglected industrial district where \"low level street crime is evolving\". It is the stronghold for the street gangs who are testing the \"new tech\" adopted by organized crime.", "unlocked": true, "relationship": { "civilianRep": 0, "superRep": 0, "knowsIdentity": false }, "appearance": "A maze of brick factories and rusted warehouses, illuminated by flickering orange streetlights. The walls are covered in graffiti marking the territory of various street-level gangs vying for power.", "secrets": [{ "text": "One of the warehouses contains a stockpile of the \"new tech\" weapons waiting for distribution.", "unlocked": false }] },
          { "id": "man-codex-1770658388511", "title": "Monument Plaza", "category": "LOCATION", "content": "A central public square intended to celebrate the city's peace, now a flashpoint for public events.", "unlocked": true, "relationship": { "civilianRep": 0, "superRep": 0, "knowsIdentity": false }, "appearance": "A wide, paved plaza featuring a large fountain and statues of historical figures. Often events can be seen happening here." },
          { "id": "man-codex-1770658463546", "title": "The Skyline Bistro", "category": "LOCATION", "content": "A quiet, unassuming restaurant.", "unlocked": true, "relationship": { "civilianRep": 0, "superRep": 0, "knowsIdentity": false } },
          { "id": "man-codex-1770658788089", "title": "Detective Silas Graves", "category": "NPC", "content": "A weary veteran of the Special Crimes Unit who remembers when police work was just about robbers and gangs, not \"super-individuals\". He is currently overwhelmed by the way low-level street crime is evolving and is desperately trying to keep the peace in a city that is becoming increasingly dangerous.", "unlocked": true, "relationship": { "civilianRep": 0, "superRep": 0, "knowsIdentity": false }, "appearance": "He wears a rumpled trench coat over a standard-issue bulletproof vest that looks too thin to stop the new tech weapons. He has a perpetually lit cigarette and deep bags under his eyes.", "secrets": [{ "text": "He is secretly feeding information to a vigilante because he knows the law can no longer keep up.", "unlocked": false }, { "text": "He suspects his own captain is on the payroll of one of the shady factions.", "unlocked": false }] },
          { "id": "man-codex-1770658921737", "title": "Veronica Sharpe", "category": "NPC", "content": "A high-level executive for a defense contractor who represents elusive clients looking to make deals with the new powered population. She specializes in offering lucrative payroll contracts to heroes, effectively turning them into private security for her clients.", "unlocked": true, "relationship": { "civilianRep": 0, "superRep": 0, "knowsIdentity": false }, "appearance": "Sharp and immaculate, dressed in high-end business fashion with a tablet always in hand. Her smile is practiced and cold, like a shark in a boardroom.", "secrets": [{ "text": "She is intentionally destabilizing certain neighborhoods to lower property values for her buyers.", "unlocked": false }] },
          { "id": "man-codex-1770658984998", "title": "Cinder", "category": "NPC", "content": "One of the new supervillains who has shown their face in the aftermath of the city's chaos. He is charismatic and volatile, actively amassing a following of disenfranchised youths who view him as a liberator rather than a criminal.", "unlocked": true, "relationship": { "civilianRep": 0, "superRep": 0, "knowsIdentity": false }, "appearance": "His skin is charred and cracked, glowing with internal heat. He wears a makeshift uniform of fire-retardant industrial gear and a mask that looks like a skull wreathed in flame.", "secrets": [{ "text": "He is being manipulated by a greater power to distract the city's heroes.", "unlocked": false }, { "text": "He is secretly dying because his body cannot contain his own power.", "unlocked": false }, { "text": "He is secretly Marcus Cole.", "unlocked": false }] },
          { "id": "man-codex-1770659034526", "title": "Dr. Elias Chen", "category": "NPC", "content": "A researcher obsessed with the \"Awakening\" event, trying to scientifically understand where these powers come from. He often consults for the police but is frustrated by the military's attempts to weaponize his research on the \"new tech\".", "unlocked": false, "relationship": { "civilianRep": 0, "superRep": 0, "knowsIdentity": false }, "appearance": "Disheveled and frantic, usually wearing a lab coat stained with coffee and chemical burns. He wears thick glasses and constantly talks into a voice recorder.", "secrets": [{ "text": "He accidentally created the tech that the organized crime syndicates are now using.", "unlocked": false }] },
          { "id": "man-codex-1770659089336", "title": "Jax \"Piston\" O'Malley", "category": "NPC", "content": "A mid-level gangster who was the first to successfully integrate the \"new tech\" adopted by organized crime. He acts as a gatekeeper for the criminal underworld, testing new weapons on rival gangs to prove their worth.", "unlocked": false, "relationship": { "civilianRep": 0, "superRep": 0, "knowsIdentity": false }, "appearance": "A hulking man whose right arm has been replaced or encased in a crude, hydraulic pile-bunker gauntlet. He wears heavy leather and a flat cap.", "secrets": [{ "text": "The tech in his arm is slowly poisoning his blood.", "unlocked": false }, { "text": "He is planning a coup to take over his crime family using his new weapons.", "unlocked": false }, { "text": "He has a soft spot for a specific civilian and secretly protects their neighborhood.", "unlocked": false }] },
          { "id": "man-codex-1770659140315", "title": "Paladin Prime", "category": "NPC", "content": "A \"morally dubious\" hero who was one of the first to accept a corporate payroll offer. He treats heroism as a business, only responding to crimes in \"subscribed\" neighborhoods and focusing heavily on his public image.", "unlocked": true, "relationship": { "civilianRep": 0, "superRep": 0, "knowsIdentity": false }, "appearance": "Wears a gleaming, golden armor suit covered in sponsorship logos. He has perfect hair and a blinding white smile that he flashes for the cameras.", "secrets": [{ "text": "He staged a fight with a villain to boost his ratings last month.", "unlocked": false }, { "text": "He is secretly addicted to a power-enhancing drug provided by his sponsors.", "unlocked": false }] },
          { "id": "man-codex-1770659213547", "title": "Maya Lin", "category": "NPC", "content": "A tenacious reporter trying to uncover the truth behind certain events.", "unlocked": true, "relationship": { "civilianRep": 0, "superRep": 0, "knowsIdentity": false }, "appearance": "Practical and unobtrusive, often wearing a hoodie and carrying a heavy backpack with camera gear. She has sharp, observant eyes and always looks like she hasn't slept.", "secrets": [{ "text": "She has a encrypted drive containing evidence of the government's involvement in the Awakening.", "unlocked": false }] },
          { "id": "man-codex-1770659286005", "title": "The Architect", "category": "NPC", "content": "A supervillain who has been operating from the shadows. He is a cold, calculating strategist.", "unlocked": false, "relationship": { "civilianRep": 0, "superRep": 0, "knowsIdentity": false }, "appearance": "Rarely seen in person, he appears on screens as a silhouette or wears a featureless, mirror-polished mask and a pristine black suit.","secrets": [{ "text": "His scheme is intended to \"save\" the city by forcing it to evolve through trauma.", "unlocked": false }, { "text": "He knows the civilian identity of his greatest enemy and is saving that information for the final blow.", "unlocked": false }] },
          { "id": "man-codex-1770659476131", "title": "Wraith", "category": "NPC", "content": "A mysterious hero who refuses to speak or sign any corporate deals. He operates at night, targeting shady factions that the police are too afraid to touch, often using brutal methods.", "unlocked": false, "relationship": { "civilianRep": 0, "superRep": 0, "knowsIdentity": false }, "appearance": "Clad in tattered black rags that seem to move on his own, with no visible face. He moves like smoke and strikes from the shadows.", "secrets": [{ "text": "He stole their gear from a defeated villain.", "unlocked": false }, { "text": "He is secretly the Mayor's son, David Vance.", "unlocked": false }] },
          { "id": "man-codex-1770659603983", "title": "Mayor Julian Vance", "category": "NPC", "content": "A career politician whose tenure was meant to be a \"golden age of infrastructure\" but has instead become a nightmare of damage control. He is desperate to maintain the illusion of \"Peace\" and order, leading him to make increasingly desperate alliances with the various factions. He publicly supports the police, but wonders if they can handle the rise in crime.", "unlocked": true, "relationship": { "civilianRep": 0, "superRep": 0, "knowsIdentity": false }, "appearance": "He has the classic look of a statesman—silver hair, firm jaw, and expensive suits—but recent months have taken a toll. He looks hollowed out, with shaking hands that he hides in his pockets during press conferences.", "secrets": [{ "text": "He secretly authorized the use of \"Phase-2 Ballistics\" (the new tech) by the police, despite knowing the risks.", "unlocked": false }, { "text": "He has a panic room beneath City Hall stocked with supplies.", "unlocked": false }] },
          { "id": "man-codex-1770659797136", "title": "David Vance", "category": "NPC", "content": "The Mayor's active and carefree son who frequents public events and parties, and is often viewed as the spoiled rich boy.", "unlocked": true, "relationship": { "civilianRep": 0, "superRep": 0, "knowsIdentity": false }, "appearance": "He is often scene wearing designer clothes, and expensive sneakers. He constantly wears sunglasses, even indoors." }
        ],
        "logs": ["Welcome to Sentinel. Your journey begins."],
        "isProcessing": false,
        "downtimeActivities": [
          { "id": "da1", "title": "Train Powers", "description": "Focus on honing your abilities in a safe environment.", "type": "TRAINING", "autoRewards": { "will": 0.25 }, "autoLog": "You spent hours at the gym.", "roleplayPrompt": "You are at your training spot. Describe your routine, focusing on the mechanics of your powers and your physical exertion. There are no enemies, just you and your limits." },
          { "id": "da2", "title": "Work Shift", "description": "Earn some money at your civilian job.", "type": "WORK", "autoRewards": { "money": 50 }, "autoLog": "A standard shift. Boring but profitable.", "roleplayPrompt": "You arrive at work. Describe the mundane tasks you perform and how you interact with colleagues while keeping your secret identity safe." },
          { "id": "da3", "title": "Socialize", "description": "Spend time with a contact or meet someone new. (Requires >20 Rep for specifics)", "type": "SOCIAL", "roleplayPrompt": "You arrange a casual meeting in a quiet location. The goal is to strengthen your bond, share news, or just relax." },
          { "id": "da4", "title": "Investigate Rumors", "description": "Hit the streets or net to find new leads/tasks.", "type": "CUSTOM", "roleplayPrompt": "You are actively looking for trouble or clues. Where do you go? What sources do you check?" }
        ],
        "automators": [],
        "newsHistory": [],
        "timeline": [],
        "newsSettings": { "articleCount": 3, "frequencyMin": 5, "frequencyMax": 8, "historyRetention": 7, "generateRelatedTasks": true, "articleTypesChance": { "hero": 20, "villain": 20, "expose": 5, "other": 55 } },
        "dailyConfig": { "tasksAvailablePerDay": 4, "taskEffortLimit": 3 },
        "weekThemes": [
          { "id": "wt-1770655363115", "startDay": 1, "endDay": 7, "title": "The Awakening", "description": "The player is joining the ranks of super-individuals. Low level street crime is evolving. The player must learn to balance their civilian- and super- identities.", "focus": "BALANCED" },
          { "id": "wt-1770655377821", "startDay": 8, "endDay": 21, "title": "Peace", "description": "The player's job becomes more taxing and the strain between their identities is starting to cause some difficulties.", "focus": "BALANCED" },
          { "id": "wt-1770655393211", "startDay": 22, "endDay": 28, "title": "Escalation", "description": "Organized crime adopts new tech. The city becomes dangerous. A few heroes may introduce themselves.", "focus": "BALANCED" },
          { "id": "wt-1770655409759", "startDay": 29, "endDay": 35, "title": "Offers", "description": "Shady characters are looking to make deals. Secretly putting \"heroes\" on the payroll would be lucrative.", "focus": "BALANCED" },
          { "id": "wt-1770655421529", "startDay": 36, "endDay": 42, "title": "Crime City", "description": "Various shady factions are vying for power. The player may be key in shaping this conflict and its outcome. A couple morally dubious \"heroes\" may be involved.", "focus": "BALANCED" },
          { "id": "wt-1770655433462", "startDay": 43, "endDay": 49, "title": "Villains", "description": "In the aftermath of the previous weeks, a few new supervillains have shown their faces. They are amassing a following.", "focus": "BALANCED" },
          { "id": "wt-1770655448662", "startDay": 50, "endDay": 63, "title": "Power", "description": "The villains are gaining power in the city. The player must decide how far they will go to deal with this problem.", "focus": "BALANCED" },
          { "id": "wt-1770655482690", "startDay": 64, "endDay": 70, "title": "Issues", "description": "An enemy of the player learns of someone they care about. The player must make difficult decisions this week, as the enemy gets closer to finding the truth.", "focus": "BALANCED" },
          { "id": "wt-1770655498725", "startDay": 71, "endDay": 77, "title": "True Power", "description": "A supervillain in-play reveals his long-time scheme. It could change the entire balance of power in the city. The result (whether good or bad), will cause serious aftermath. The player's main enemy learns their identity, and the player must deal with this enemy.", "focus": "BALANCED" }
        ],
        "generationModel": "gemini-3-pro-preview",
        "music": {
          "currentMood": "MENU",
          "isPlaying": false,
          "volume": 0.5,
          "tracks": []
        },
        "taskSuggestions": [],
        "archivedSuggestions": []
      }
    }
  }
];
