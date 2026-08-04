# Lesson: Prompt Evaluation Metrics & A/B Testing

## SEC-00: Lesson ID

| Field | Value |
|-------|-------|
| Lesson ID | M3-L4 |
| Module | M3 - Debugging and Refinement |
| Difficulty | Intermediate |
| Time | 10–15 minutes |

---

## SEC-01: 🎯 Goal

By the end of this lesson, you will be able to:

- 🎯 Evaluate prompt quality using three core NLP metrics: **Fluency**, **Relevance**, and **Coherence**
- 🎯 Conduct systematic **A/B testing** between two prompt variants (Prompt A vs. Prompt B)
- 🎯 Tune prompts scientifically based on evaluation scores rather than subjective guessing

---

## SEC-02: 💼 Use Case

You have created two different prompts to summarize research papers or generate interview answers. How do you know which prompt produces better, higher-quality results?

In professional environments and academic projects, guessing is not enough. You need **Prompt Evaluation & A/B Testing**. By scoring responses on Fluency (grammar & readability), Relevance (addressing the prompt), and Coherence (logical flow), you can objectively select and tune the best prompt version for your applications, study bots, or client projects.

---

## SEC-03: ⚠️ Bad Prompt

```
Compare these two prompt outputs and tell me which one is better.

Output A: "Python is a language. It is easy. Many programmers use it for data science and web."
Output B: "Python excels in data science and web development due to its clean syntax and massive library ecosystem."
```

---

## SEC-04: Bad Output

```
Both outputs are good! Output B is a bit more descriptive and professional, so you should probably use Output B.
```

---

## SEC-05: 🛑 Why It Failed

- **No quantitative metrics** - Lacks scoring for Fluency, Relevance, and Coherence.
- **No evaluation rubric** - The evaluation is subjective opinion ("a bit more descriptive") rather than structured analysis.
- **No actionable tuning feedback** - Fails to explain *why* Output B scored higher or how to improve Output A.

---

## SEC-06: ✅ Good Prompt

```
Act as an AI Evaluation Expert. Evaluate Output A vs Output B using a 1-5 scale across three evaluation metrics:

Metrics Rubric:
1. Fluency (1-5): Grammatical correctness, natural phrasing, and readability.
2. Relevance (1-5): How directly and accurately the response answers the request.
3. Coherence (1-5): Logical progression, structure, and connection between ideas.

Task: Evaluate these outputs for the goal "Explain Python's advantages to a beginner".

Output A: "Python is a language. It is easy. Many programmers use it for data science and web."
Output B: "Python excels in data science and web development due to its clean syntax and massive library ecosystem."

Format:
- Metric Breakdown Table (Metric, Output A Score, Output B Score, Justification)
- Winner Announcement
- One prompt tuning recommendation for the winning version.
```

---

## SEC-07: Good Output

```
### Evaluation Matrix (A/B Test Results)

| Metric | Output A (1-5) | Output B (1-5) | Justification |
|--------|----------------|----------------|---------------|
| **Fluency** | 3 / 5 | 5 / 5 | Output A uses choppy, fragmented sentences. Output B uses fluid, professional phrasing. |
| **Relevance** | 4 / 5 | 5 / 5 | Both address Python, but B specifically highlights *why* it's advantageous (syntax & ecosystem). |
| **Coherence** | 3 / 5 | 5 / 5 | Output A lists disconnected facts. Output B logically connects advantages to use-cases. |
| **Total Score** | **10 / 15** | **15 / 15** | **Output B is the clear winner.** |

**Winner**: Output B (Score: 15/15)

**Prompt Tuning Recommendation**: To make Output B even better for beginners, add a constraint requiring a 1-line real-world analogy.
```

---

## SEC-08: ⚡ Upgrade Prompt

```
Act as an Automated Prompt Tuning & A/B Evaluation Suite.

I am conducting an A/B Test between Prompt Variant A and Prompt Variant B.

Variant A (GCCF Standard):
"Goal: Explain recursion. Context: 1st year CSE student. Constraints: Under 100 words. Format: Bullet points."

Variant B (CRAFTED Role-Based):
"Role: Senior CS Tutor. Goal: Explain recursion using a real-world stack analogy. Format: 3 bullets + 1 line summary."

Task:
1. Simulate running both variants on the topic "Recursion in Data Structures".
2. Evaluate outputs on Fluency, Relevance, and Coherence (1-5 scale each).
3. Calculate the overall Quality Index (Sum / 15 * 100%).
4. Provide a tuned Hybrid Version (Variant C) that combines the highest-scoring elements of both.
```

**What changed**: The upgrade automates the full A/B testing workflow, computes a percentage Quality Index across all 3 metrics, and automatically generates a hybrid "Variant C" prompt that merges the strengths of both test variants.

---

## SEC-09: 📝 Guided Practice

Try this yourself:

1. **Create Variant A & Variant B** for a task: "Write a cover letter opening sentence for a Frontend Developer intern role."
   - Variant A: Simple direct statement.
   - Variant B: Action-oriented statement with specific technical skills mentioned.
2. **Score both outputs** using the F-R-C framework:
   - **Fluency (1-5)**: Does it sound natural?
   - **Relevance (1-5)**: Does it fit the job target?
   - **Coherence (1-5)**: Is the message clear and structured?
3. **Declare a winner** and note the score difference.

---

## SEC-10: ⏱️ Challenge

**5-Minute Challenge**:

You are testing two prompts for a Customer Support Assistant.
- **Variant A**: "Answer the customer's query politely."
- **Variant B**: "Role: Support Agent. Goal: Answer query politely. Constraint: Acknowledge issue first, then give 2 solutions, end with contact link. Format: 3 paragraphs."

Run an A/B evaluation table comparing Variant A and Variant B on **Fluency**, **Relevance**, and **Coherence**. Calculate the total score for each and write a 1-sentence conclusion on why constraint-based prompts score higher on Relevance and Coherence.

---

## SEC-11: ✅ Checklist

Before moving on, confirm:
- [ ] I understand the 3 core prompt metrics: **Fluency**, **Relevance**, and **Coherence**
- [ ] I can set up an A/B evaluation matrix comparing Prompt A vs Prompt B
- [ ] I can score outputs objectively using a 1-5 numerical rubric
- [ ] I know how to tune winning prompts using evaluation feedback

---

## SEC-12: 💡 What You Learned

1. **Fluency, Relevance & Coherence form the evaluation standard** - Scoring prompts on these 3 NLP metrics turns subjective opinions into clear quantitative data.
2. **A/B Testing reveals hidden prompt weaknesses** - Testing two prompt variants side by side highlights exact structural changes that boost quality.
3. **Data-driven prompt tuning wins** - Using metric scores to refine prompts ensures continuous, predictable performance improvements.

---

## SEC-13: ❓ Mini Quiz

**Q1**: Which prompt evaluation metric measures whether the AI response logically connects ideas and maintains smooth transitions between paragraphs?
- A) Fluency
- B) Relevance
- C) Coherence

**Answer**: C) Coherence. Coherence specifically measures logical structure, flow, and internal consistency of ideas.

**Q2**: In an A/B prompt test, Variant A scores 4/5 on Relevance but 2/5 on Fluency. What prompt tuning fix should you apply?
- A) Add more background context (Context)
- B) Add style and tone guidelines or smooth phrasing constraints (Format/Tone)
- C) Change the core objective completely (Goal)

**Answer**: B) Add style and tone guidelines. Low fluency means grammar or phrasing is awkward; adding explicit tone or readability rules fixes fluency without reducing relevance.

---

## SEC-14: 📌 One-Line Takeaway

> Don't guess which prompt is better—score them on Fluency, Relevance, and Coherence to build winning prompts.

---

## SEC-15: 🤖 Best AI Model
- **Best for A/B Evaluation & Rubrics**: Claude 3.5 Sonnet / GPT-4o
