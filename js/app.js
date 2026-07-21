"use strict";

const DEFAULT_PROMPT = `You are CodeAutopsy, a friendly code mentor for students.
Analyze the submitted code and return ONLY valid JSON. Do not wrap it in markdown.

The JSON must match this schema:
{
  "language": "detected language",
  "overview": "2-4 beginner-friendly sentences explaining what the code does and its overall health",
  "lines": [
    { "line": 1, "code": "exact code from that line", "explain": "plain-language explanation" }
  ],
  "bugs": [
    {
      "title": "short bug name",
      "severity": "Critical | Moderate | Minor",
      "line": "line number or snippet",
      "why": "what behavior this causes and why",
      "misconception": "the likely wrong mental model",
      "fix": "a small suggested fix, not a full rewrite"
    }
  ],
  "quiz": [
    {
      "q": "question about this exact code",
      "options": ["answer A", "answer B", "answer C", "answer D"],
      "answer": 0
    }
  ]
}

Rules:
- Explain meaningful lines or logical blocks.
- Focus on why mistakes happened, not just the fix.
- Include 3-5 quiz questions when possible.
- If there are no bugs, use an empty bugs array and say so in the overview.
- Do not analyze malicious exploit code.`;

const API_URLS = {
  openai: "https://api.openai.com/v1/chat/completions",
  openrouter: "https://openrouter.ai/api/v1/chat/completions",
  grok: "https://api.groq.com/openai/v1/chat/completions"
};

const $ = (id) => document.getElementById(id);
const sysPrompt = $("sysPrompt");

if (sysPrompt) {
  sysPrompt.value = DEFAULT_PROMPT;
}

const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[char]);

function showError(msg) {
  const errBox = $("errBox");
  errBox.textContent = msg;
  errBox.classList.remove("hidden");
}

function clearError() {
  $("errBox").classList.add("hidden");
}

function showTab(name) {
  document.querySelectorAll("#tabs button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.t === name);
  });
  ["overview", "lines", "bugs", "quiz"].forEach((tab) => {
    $("tab-" + tab).classList.toggle("hidden", tab !== name);
  });
}

function renderPlaceholder() {
  $("tab-overview").innerHTML = '<div class="placeholder">No report yet.</div>';
  $("tab-lines").innerHTML = "";
  $("tab-bugs").innerHTML = "";
  $("tab-quiz").innerHTML = "";
}

function render(report) {
  $("tab-overview").innerHTML = `<div><p><strong>Language:</strong> ${esc(report.language || "Unknown")}</p><p>${esc(report.overview || "No summary available.")}</p></div>`;

  $("tab-lines").innerHTML =
    (report.lines || [])
      .map(
        (line) =>
          `<div class="line-item">
            <div class="line-header">
              <span class="line-number">${esc(line.line)}</span>
              <code class="line-code">${esc(line.code)}</code>
            </div>
            <div class="line-explanation">${esc(line.explain)}</div>
          </div>`
      )
      .join("") || '<div class="placeholder">No line-by-line explanation available.</div>';

  $("tab-bugs").innerHTML =
    (report.bugs || [])
      .map(
        (bug) =>
          `<div class="bug-item"><h3>${esc(bug.title)}</h3><p><strong>Severity:</strong> ${esc(bug.severity)}</p><p><strong>Line:</strong> ${esc(bug.line)}</p><p>${esc(bug.why)}</p><p><strong>Misconception:</strong> ${esc(bug.misconception)}</p><p><strong>Fix:</strong> ${esc(bug.fix)}</p></div>`
      )
      .join("") || '<div class="placeholder">No bugs detected.</div>';

  $("tab-quiz").innerHTML =
    (report.quiz || [])
      .map((q, index) => {
        const options = Array.isArray(q.options) ? q.options : [];
        return `<div class="quiz-item">
          <p class="quiz-question"><strong>Q${index + 1}.</strong> ${esc(q.q)}</p>
          <div class="quiz-options">
            ${options.map((opt, i) => `<button class="quiz-opt" data-question="${index}" data-answer="${i}">${esc(opt)}</button>`).join("")}
          </div>
          <div class="quiz-answer" id="answer-${index}"><strong>Answer:</strong> ${esc(options[q.answer])}</div>
        </div>`;
      })
      .join("") || '<div class="placeholder">No quiz questions available.</div>';

  showTab("overview");
  setTimeout(() => {
    const tabsContainer = $("tabs");
    if (tabsContainer && tabsContainer.parentElement) {
      tabsContainer.parentElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, 100);
}

function loadSample() {
  $("lang").value = "Python";
  $("codeInput").value = `def average(nums):\n  total = 0\n  for i in range(1, len(nums)):\n    total += nums[i]\n  return total / len(nums)\n\nscores = [80, 90, 70]\nprint(average(scores))`;
}

function getPrompt() {
  return sysPrompt ? sysPrompt.value : DEFAULT_PROMPT;
}

function buildUserPrompt(code) {
  return `Language hint: ${$("lang").value}\n\nCode to analyze:\n${code}`;
}

function parseReport(text) {
  const cleaned = String(text || "")
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const jsonText = start >= 0 && end >= start ? cleaned.slice(start, end + 1) : cleaned;
  return normalizeReport(JSON.parse(jsonText));
}

function normalizeReport(report) {
  return {
    language: report.language || "Unknown",
    overview: report.overview || "No summary available.",
    lines: Array.isArray(report.lines) ? report.lines : [],
    bugs: Array.isArray(report.bugs) ? report.bugs : [],
    quiz: Array.isArray(report.quiz)
      ? report.quiz
          .filter((q) => Array.isArray(q.options) && q.options.length > 0)
          .map((q) => ({
            q: q.q || "Question unavailable.",
            options: q.options,
            answer: Number.isInteger(q.answer) ? q.answer : 0
          }))
      : []
  };
}

async function readError(response) {
  const body = await response.text();
  try {
    const json = JSON.parse(body);
    return json.error?.message || json.message || body.slice(0, 300);
  } catch {
    return body.slice(0, 300);
  }
}

async function callGemini(systemPrompt, userPrompt, apiKey, model) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json"
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error ${response.status}: ${await readError(response)}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }
  return parseReport(text);
}

async function callChatProvider(provider, systemPrompt, userPrompt, apiKey, model) {
  const makeBody = (forceJson) => ({
    model,
    temperature: 0.2,
    ...(forceJson ? { response_format: { type: "json_object" } } : {}),
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]
  });

  const send = (forceJson) =>
    fetch(API_URLS[provider], {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(makeBody(forceJson))
    });

  let response = await send(true);
  if (!response.ok && response.status === 400) {
    const firstError = await readError(response);
    if (/response_format|json/i.test(firstError)) {
      response = await send(false);
    } else {
      throw new Error(`${providerLabel(provider)} API error ${response.status}: ${firstError}`);
    }
  }

  if (!response.ok) {
    throw new Error(`${providerLabel(provider)} API error ${response.status}: ${await readError(response)}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "";
  if (!text) {
    throw new Error(`${providerLabel(provider)} returned an empty response.`);
  }
  return parseReport(text);
}

function providerLabel(provider) {
  return {
    gemini: "Gemini",
    openai: "OpenAI",
    openrouter: "OpenRouter",
    grok: "Groq"
  }[provider] || "Provider";
}

async function runAutopsy() {
  clearError();
  const code = $("codeInput").value.trim();
  if (!code) {
    showError("Paste some code first.");
    return;
  }

  const demo = $("demoMode").checked;
  if (demo) {
    render({
      language: "Python",
      overview: "Demo mode report. This is a placeholder report for sample code.",
      lines: [
        { line: 1, code: "def average(nums):", explain: "Defines a function that receives a list." }
      ],
      bugs: [
        {
          title: "Off-by-one loop",
          severity: "Moderate",
          line: 3,
          why: "The loop starts at index 1 instead of 0.",
          misconception: "Assuming Python lists begin at 1.",
          fix: "Use range(len(nums)) or iterate directly."
        }
      ],
      quiz: [
        {
          q: "What is wrong with range(1, len(nums)) for a 3-item list?",
          options: ["It skips the first item", "It repeats the first item", "It accesses an invalid index", "Nothing is wrong"],
          answer: 0
        }
      ]
    });
    return;
  }

  const apiKey = $("apiKey").value.trim();
  if (!apiKey) {
    showError("Paste an API key in AI settings, or turn on Demo mode.");
    return;
  }

  const provider = $("provider").value;
  const model = $("model").value.trim();
  if (!model) {
    showError("Enter a model name in AI settings.");
    return;
  }

  const btn = $("runBtn");
  const oldText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Running autopsy...";

  try {
    const systemPrompt = getPrompt();
    const userPrompt = buildUserPrompt(code);
    const report =
      provider === "gemini"
        ? await callGemini(systemPrompt, userPrompt, apiKey, model)
        : await callChatProvider(provider, systemPrompt, userPrompt, apiKey, model);
    render(report);
  } catch (error) {
    const corsHint =
      error instanceof TypeError
        ? " If this is a browser CORS block, use Gemini/OpenRouter from the browser or move the call to a small backend proxy."
        : "";
    showError(`${error.message || "The API call failed."}${corsHint}`);
  } finally {
    btn.disabled = false;
    btn.textContent = oldText;
  }
}

function updateApiHelpLink(provider) {
  const helpLinks = {
    gemini: { url: "https://aistudio.google.com/app/apikey", text: "Get Gemini key" },
    openai: { url: "https://platform.openai.com/api-keys", text: "Get OpenAI key" },
    openrouter: { url: "https://openrouter.ai/keys", text: "Get OpenRouter key" },
    grok: { url: "https://console.groq.com/keys", text: "Get Groq key" }
  };
  const linkInfo = helpLinks[provider] || helpLinks.gemini;
  const linkEl = $("apiHelpLink");
  if (linkEl) {
    linkEl.href = linkInfo.url;
    linkEl.textContent = linkInfo.text;
  }
}

function saveSettings() {
  localStorage.setItem("codeAutopsy_provider", $("provider").value);
  localStorage.setItem("codeAutopsy_model", $("model").value);
  localStorage.setItem("codeAutopsy_apiKey", $("apiKey").value);
}

$("provider").addEventListener("change", () => {
  const provider = $("provider").value;
  const defaults = {
    gemini: "gemini-2.5-flash",
    openai: "gpt-4o-mini",
    openrouter: "meta-llama/llama-3.3-70b-instruct:free",
    grok: "llama-3.3-70b-versatile"
  };
  $("model").value = defaults[provider] || "gemini-2.5-flash";
  updateApiHelpLink(provider);
  saveSettings();
});

$("model").addEventListener("input", saveSettings);
$("apiKey").addEventListener("input", saveSettings);

function loadSettings() {
  const provider = localStorage.getItem("codeAutopsy_provider");
  const model = localStorage.getItem("codeAutopsy_model");
  const apiKey = localStorage.getItem("codeAutopsy_apiKey");
  
  if (provider) {
    $("provider").value = provider;
    updateApiHelpLink(provider);
  }
  if (model) $("model").value = model;
  if (apiKey) $("apiKey").value = apiKey;
}

$("runBtn").addEventListener("click", runAutopsy);
$("tabs").addEventListener("click", (event) => {
  if (event.target.matches("button[data-t]")) {
    showTab(event.target.dataset.t);
  }
});

renderPlaceholder();
loadSettings();
