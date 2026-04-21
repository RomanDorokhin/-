# GAME DESIGN CHECKLIST

Purpose: this document is the hard reference for design direction.
Before shipping any mechanic/secret/system, check it against this list.

## How to use

- During planning: tag each feature with at least 3 matching principles.
- During implementation: add a short note in PR/checklist showing where each principle is implemented.
- During testing: fail the feature if it breaks critical principles (Agency, Feedback, Readability).

---

## Core principles

### 1) Emergent gameplay (rules > scripts)

Goal: players generate stories by interacting with systems.

Pass criteria:
- Feature is primarily rule-driven, not one-shot scripted.
- Two or more systems can combine into unexpected outcomes.
- The same trigger can produce different outcomes depending on game state.

Fail signals:
- Event always plays the same way.
- Player has no room to improvise.

### 2) Mastery loop (skill matters)

Goal: players improve through understanding and execution, not grind.

Pass criteria:
- Repeated attempts increase success chance because player learns.
- Failure reveals useful information for the next try.
- Mechanical execution and timing affect outcomes.

Fail signals:
- Progress depends mostly on random repetition.
- Failure gives no learning value.

### 3) Tension through resource

Goal: scarcity forces meaningful decisions.

Primary constrained resources for this project:
- Time (session/countdown pressure)
- Risk budget (ban pressure/escalation)
- Control stability (input distortion / world instability)

Pass criteria:
- Every major choice spends, preserves, or converts a scarce resource.
- Resource pressure is visible and understandable.

Fail signals:
- Player can do everything without trade-offs.
- Resource exists but does not change behavior.

### 4) Readability through contrast

Goal: player reads danger/opportunity instantly.

Pass criteria:
- Visual language is consistent (color, shape, motion).
- Danger, reward, and interactable states are distinguishable at a glance.
- Critical state changes are obvious in under 1 second.

Fail signals:
- Important states look too similar.
- Surprise comes from unclear visuals, not design intent.

### 5) Immediate feedback loop

Goal: each action receives instant audiovisual/system response.

Target:
- action -> first feedback <= 100 ms for core interactions

Pass criteria:
- Input triggers at least one immediate feedback channel (visual, audio, motion, UI).
- High-impact actions trigger layered feedback (multiple channels).

Fail signals:
- Player input feels ignored or delayed.
- Feedback only appears after long logic chains.

---

## Seven production rules

### A) Agency
- Player action must change state in a real way.
- No fake buttons / fake choices without systemic consequence.

### B) Affordance (readable intention)
- Before acting, player can predict likely outcome class.
- Interactables look interactable; threats look threatening.

### C) Immediate response
- No dead inputs.
- Core loops always acknowledge input quickly.

### D) Risk vs reward in every decision
- Each meaningful action has an upside and a cost.
- Remove "obviously best" choices unless intentional onboarding.

### E) Failure = information
- On failure, player learns what changed and why.
- Loss state should improve next decision quality.

### F) Momentum
- Action naturally leads to next decision.
- Avoid dead-air between event and next objective.

### G) Effort/result alignment
- Harder action -> stronger/rarer payoff.
- If payoff is intentionally small, action complexity must also be small.

---

## Feature review template (copy into PRs)

Feature:

Mapped principles:
- [ ] Emergent gameplay
- [ ] Mastery loop
- [ ] Tension through resource
- [ ] Readability through contrast
- [ ] Immediate feedback
- [ ] Agency
- [ ] Affordance
- [ ] Immediate response
- [ ] Risk/reward
- [ ] Failure = information
- [ ] Momentum
- [ ] Effort/result alignment

Notes:
- Control changes:
- World/phase changes:
- Risk/reward changes:
- Meta progression changes:

Ship decision:
- [ ] PASS
- [ ] NEEDS REVISION
