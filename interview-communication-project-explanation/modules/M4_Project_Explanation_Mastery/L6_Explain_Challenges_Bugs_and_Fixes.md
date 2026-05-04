# Explain Challenges Bugs and Fixes

> ⚠️ **Common Mistake:** ‘We restarted and magic’—shows no judgement.

---

## SEC-00_LESSON_ID

- **Lesson ID:** `M4-L6`
- **Lesson Title:** Explain Challenges Bugs and Fixes
- **Difficulty:** Intermediate
- **Time:** 17–25 minutes

---

## SEC-01_SKILL_OUTCOME

Tell debugging stories demonstrating method, not miracles.

---

## SEC-02_WHY_THIS_MATTERS

Many interns ship copy-pasta. Debug storytelling differentiates conscientious beginners.

Also: communicates honesty—you won’t fake omniscience.

---

## SEC-03_REAL_INTERVIEW_SCENARIO

**“Tell me toughest bug.”**

---

## SEC-04_FRAMEWORK_YOU_WILL_USE

**Name:** Debug Story Spine (SYMPTOM → HYPOTHESIS → TEST → ROOT → FIX)

**Definition:** Shows engineering thinking; keep story proportional to interviewer patience.

---

## SEC-05_BAD_ANSWER_TRANSCRIPT

> “It randomly worked after restart…”

---

## SEC-06_WHAT_WENT_WRONG

- No investigation narrative.
- Sounds lazy or secretive.

---

## SEC-07_GOOD_ANSWER_TRANSCRIPT

> “Symptom: intermittent 401—not every user.
Hypotheses: clock skew vs refresh race vs wrong header on one client path.
Tests: narrowed by logging token timestamps + reproducing on slow devices.
Root: dual refresh triggers—fixed by debouncing + single-flight guard.
Prevention: added regression checklist item—severity reduced; timing numbers VERIFY.”

---

## SEC-08_BREAKDOWN_LINE_BY_LINE

- Logical branches visible.
- Honest narrowing.
- Prevention thinking.

---

## SEC-09_SHORT_VERSION

**60s debug:** symptom → quickest ruled out → chosen fix.

---

## SEC-10_LONG_VERSION

**3 min**: include wrong paths briefly—shows rigor.

---

## SEC-11_FOLLOW_UP_QUESTIONS


1. **Q:** "Why not profiler X?"
   **A:** Cost/time/true constraints honest.


1. **Q:** "Customer impact?"
   **A:** Say VERIFY if unknown.


1. **Q:** "Team disagreement on fix?"
   **A:** Process story—truthful tone.


---

## SEC-12_CONFIDENCE_DELIVERY_TIPS

- **Voice:** speak clearly; emphasize names and truthful numbers slowly.
- **Pace:** slow down on technical words you can explain.
- **Pauses:** short silence beats extra “umm/like”.
- **Body / camera:** relaxed shoulders; stable camera; hands visible briefly.
- Slow down naming variables—precision impresses.

---

## SEC-13_PRACTICE_DRILL

Describe **three** bugs: trivial, messy, intermittent—vary structure.

---

## SEC-14_AI_MOCK_PRACTICE

### Prompt A (simulate interviewer ethically)

Skeptical interviewer challenges root cause lazily—stay calm. Rules: communication practice ONLY. Forbidden: cheating on tests/assignments, feeding hidden answers during live assessments. Do not invent my achievements—ask factual follow-ups.

### Prompt B (structure + feedback)

Judge investigation rigor communication. Rules: critique clarity, structure, honesty, pacing, confidence. Forbidden: rewriting my story with fabricated facts. Label anything unverifiable as VERIFY.

---

## SEC-15_SELF_EVALUATION_RUBRIC

| Dimension | 1–5 | What you're measuring |
|-----------|-----|-----------------------|
| Clarity | — | Listener can repeat your headline in one sentence |
| Structure | — | Moves are sequential, not scrambled |
| Confidence | — | Calm pacing, recovery after slips |

_Score 1–5 on each row. Pick your lowest score and rewrite one paragraph only._

---

## SEC-16_COMMON_MISTAKES

- Blaming compilers without proof.
- Security-sensitive exploit details disclosed irresponsibly—avoid.
- Embarrassing user data anecdotes—anonymize.
- Stories too niche for listener understanding.
- Unable to summarize for non-specialist interviewer.

---

## SEC-17_WHAT_YOU_LEARNED

- Debugging talk is transferable skill proof.
- Wrong hypotheses educated are gold.
- Prevention completes story arc.

---

## SEC-18_NEXT_STEP

Open `L7_Impact_Metrics_and_Results.md`.
