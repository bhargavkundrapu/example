# Lesson: LLM APIs, Automation & Prompt Chaining

## SEC-00: Lesson ID

| Field | Value |
|-------|-------|
| Lesson ID | M7-L4 |
| Module | M7 - Coding With AI |
| Difficulty | Intermediate |
| Time | 10–15 minutes |

---

## SEC-01: 🎯 Goal

By the end of this lesson, you will be able to:

- 🎯 Structure prompts for programmatic consumption via **LLM APIs** (OpenAI, Anthropic, Gemini API)
- 🎯 Design **Prompt Chains** where the output of Prompt A automatically becomes the input for Prompt B
- 🎯 Build automated prompt-based workflows and micro-apps (e.g., email assistants, automated quiz generators)

---

## SEC-02: 💼 Use Case

When building real-world software applications, you don't copy-paste prompts into ChatGPT manually—you call LLM APIs in your code. But trying to solve a complex multi-step task in a single API call often fails. 

**Prompt Chaining** solves this by breaking complex workflows into a pipeline of smaller, dedicated prompt steps. For example:
- **Step 1 API Call**: Extract raw text → Output JSON summary
- **Step 2 API Call**: Feed JSON summary → Output formatted email draft
- **Step 3 API Call**: Feed email draft → Generate 3 quiz questions

This pipeline pattern is the secret behind real-world AI automations, web applications, and agentic workflows.

---

## SEC-03: ⚠️ Bad Prompt

```
// Monolithic Single API Call Attempt
Prompt: "Read this raw customer email, determine the sentiment, draft a polite response, create a internal support ticket in JSON, and write a 1-line summary for the manager."
```

---

## SEC-04: Bad Output

```
Customer is unhappy. Dear Customer, sorry for the delay. { "ticket_id": 101, "priority": "high" } Manager Summary: Customer complained about shipping.
```

---

## SEC-05: 🛑 Why It Failed

- **Monolithic overload** - Requesting 4 different tasks in one single API call leads to messy, unparseable output.
- **No programmatic API parsing** - Mixing conversational text with JSON code breaks automated JSON parsers (`JSON.parse()` will throw a syntax error).
- **No modular debugging** - If the sentiment analysis step fails, the entire API pipeline fails without revealing where the error occurred.

---

## SEC-06: ✅ Good Prompt

```
// 2-Step Prompt Chain Specification for API Integration

=== STAGE 1: Data Extraction Prompt (API Call #1) ===
Goal: Extract key sentiment and issues from customer input.
Constraints: Output MUST be valid JSON only. No markdown formatting.
JSON Schema:
{
  "sentiment": "positive | neutral | negative",
  "core_issue": "string",
  "urgency": "low | medium | high"
}
Input Text: [RAW_CUSTOMER_EMAIL]

=== STAGE 2: Response Generation Prompt (API Call #2) ===
Goal: Draft a customer support reply based on Stage 1 JSON data.
Context: You are a tier-1 support assistant.
Input Data: [STAGE_1_JSON_OUTPUT]
Constraints: Max 100 words. Address the core_issue directly and match tone to urgency.
Format: Plain text email response body.
```

---

## SEC-07: Good Output

```
=== STAGE 1 API OUTPUT (JSON) ===
{
  "sentiment": "negative",
  "core_issue": "Delayed package delivery for Order #8492",
  "urgency": "high"
}

=== STAGE 2 API OUTPUT (Email Reply) ===
Dear Valued Customer,

Thank you for reaching out to ExpoGraph Support. We sincerely apologize for the delay regarding your Order #8492.

We have prioritized your delivery with our courier partner, and an updated tracking link has been sent to your email. We appreciate your patience and are working to resolve this immediately.

Best regards,
ExpoGraph Support Team
```

---

## SEC-08: ⚡ Upgrade Prompt

```
// 3-Stage Automated API Chain Architecture (Code Ready)

[CHAIN SPECIFICATION]:
- API Provider: OpenAI / Anthropic / Gemini SDK
- Pipeline Topology: Sequential (Stage 1 -> Stage 2 -> Stage 3)

Stage 1: Outline Extractor
- System Prompt: "You are a data extraction engine. Output strict JSON with key 'topics'."
- Input: [RAW_STUDY_NOTES]
- Validation: JSON Schema validation

Stage 2: Flashcard Generator (Chained from Stage 1)
- System Prompt: "You are an educator. Input is JSON topics. Output JSON array of Q&A flashcards."
- Input: [STAGE_1_JSON.topics]

Stage 3: Markdown Exporter (Chained from Stage 2)
- System Prompt: "You are a formatter. Convert Q&A JSON array into clean Markdown table."
- Input: [STAGE_2_JSON.flashcards]
- Format: | Question | Answer | Difficulty |
```

**What changed**: The upgrade defines a complete 3-stage production prompt chain specification with System Prompts for each stage, intermediate JSON schema validation, and structured data passing ready for implementation in Python or Node.js API scripts.

---

## SEC-09: 📝 Guided Practice

Try this yourself:

1. **Design a 2-Step Prompt Chain** for an automated Blog Post Generator:
   - **Stage 1 Prompt**: Takes a topic name (e.g. "Vibe Coding") and outputs a 5-point bulleted outline in JSON format (`{"outline": [...]}`).
   - **Stage 2 Prompt**: Takes the JSON outline from Stage 1 and writes a 300-word introduction section.
2. **Test the flow**: Run Stage 1, copy the output JSON, and pass it directly into Stage 2.
3. **Verify modularity**: Check how easy it is to tweak Stage 2 without altering Stage 1!

---

## SEC-10: ⏱️ Challenge

**5-Minute Challenge**:

You are building an automated **AI Quiz Generator App** using LLM APIs.
Write the specification for a 2-step prompt chain:
- **Step 1 (Analyzer)**: Takes raw chapter text and extracts 3 key technical concepts as JSON.
- **Step 2 (Quiz Builder)**: Takes the JSON concepts from Step 1 and outputs 3 multiple-choice quiz questions with answer options (A, B, C, D) and correct answers labeled.

Write the exact system prompts and input/output formats for both steps.

---

## SEC-11: ✅ Checklist

Before moving on, confirm:
- [ ] I understand how LLM APIs process System Prompts and User Prompts programmatically
- [ ] I can break complex monolithic tasks into modular Prompt Chains (Stage 1 → Stage 2 → Stage 3)
- [ ] I specify strict JSON schemas for intermediate API steps to prevent parsing errors
- [ ] I can design automated prompt workflows for real-world software applications

---

## SEC-12: 💡 What You Learned

1. **APIs demand structured outputs** - Programmatic API prompts should enforce strict JSON schemas so downstream code can parse outputs reliably.
2. **Prompt Chaining eliminates complexity** - Breaking 1 big task into 2-3 chained prompts increases accuracy and reduces hallucinations dramatically.
3. **Chained pipelines power AI applications** - Building modular prompt chains is the foundational pattern for AI agents, automations, and web apps.

---

## SEC-13: ❓ Mini Quiz

**Q1**: Why is Prompt Chaining preferred over writing one massive, monolithic prompt when building LLM API applications?
- A) Prompt chaining uses less internet bandwidth
- B) Monolithic prompts often drop instructions or fail, whereas chained micro-prompts perform single focused tasks with higher accuracy and valid JSON schemas
- C) LLM APIs do not support prompts longer than 10 words

**Answer**: B) Breaking tasks into chained micro-prompts improves accuracy, prevents instructions from being ignored, and allows clean step-by-step validation.

**Q2**: In an API prompt chain, what format should intermediate prompt outputs use to ensure reliable processing by the next script stage?
- A) Unstructured conversational paragraphs
- B) Machine-readable JSON schemas
- C) Handwritten bullet points with emojis

**Answer**: B) Machine-readable JSON allows script code (`JSON.parse()`) to cleanly extract data and feed it into the next API stage without parsing errors.

---

## SEC-14: 📌 One-Line Takeaway

> Break complex API tasks into chained micro-prompts—small steps build powerful automations.

---

## SEC-15: 🤖 Best AI Model
- **Best for API Integration & JSON Schemas**: GPT-4o / Claude 3.5 Sonnet / Gemini 1.5 Pro
