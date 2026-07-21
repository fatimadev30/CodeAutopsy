"use strict";

// ========== DEFAULT AI INSTRUCTIONS ==========
const DEFAULT_PROMPT = `You are CodeAutopsy, a strict but friendly code examiner for students who copy code without understanding it.
Analyze the code the user gives you and return ONLY valid JSON, no markdown, matching exactly this schema:
{
 "overview": "2-3 sentence plain-language summary of what this code does and its overall health",
 "language": "detected language",
 "lines": [{"line": 1, "code": "the code on that line", "explain": "simple one-sentence explanation"}],
 "bugs": [{"title": "short bug name", "severity": "high|medium|low", "line": 3,
           "why": "WHY this bug happened - tell the story of the mistake",
           "misconception": "the exact wrong belief the student had, e.g. 'you assumed range() starts at 1'",
           "fix": "only the corrected line(s), not the whole program"}],
 "quiz": [{"q": "question", "options": ["a","b","c","d"], "answer": 0, "explain": "why that answer is right"}]
}
Rules:
1. Explain every meaningful line in simple language a beginner understands.
2. For EVERY bug, do not just fix it - explain WHY it happened and name the misconception behind it. This is the most important part.
3. If there are no bugs, return an empty bugs array and say so in the overview.
4. Make 3-5 quiz questions focused on the buggy or tricky parts of THIS code.
5. Never rewrite the whole program for the student - guide understanding instead.`;

document.getElementById("sysPrompt").value = DEFAULT_PROMPT;

// ========== SAMPLE BUGGY CODE & DEMO ANALYSIS ==========
const SAMPLE = `def average(nums):
    total = 0
    for i in range(1, len(nums)):
        total += nums[i]
    return total / len(nums)

scores = [80, 90, 70]
print("Average:", average(scores))`;

const DEMO_REPORT = {
  overview:
    "This program tries to compute the average of a list of exam scores. The structure is right (sum then divide), but an off-by-one mistake in the loop silently skips the first score, so it prints 53.3 instead of 80. Classic copied-code bug: it runs without errors, so it looks correct.",
  language: "Python",
  lines: [
    {
      line: 1,
      code: "def average(nums):",
      explain: "Defines a function named average that receives a list called nums."
    },
    {
      line: 2,
      code: "    total = 0",
      explain: "Creates a running total starting at zero."
    },
    {
      line: 3,
      code: "    for i in range(1, len(nums)):",
      explain:
        "Loops i from 1 up to (but not including) the list length — this SKIPS index 0, the first item."
    },
    {
      line: 4,
      code: "        total += nums[i]",
      explain: "Adds the item at position i to the total."
    },
    {
      line: 5,
      code: "    return total / len(nums)",
      explain: "Divides by the FULL list length, even though one item was never added."
    },
    {
      line: 7,
      code: "scores = [80, 90, 70]",
      explain: "A test list of three scores."
    },
    {
      line: 8,
      code: 'print("Average:", average(scores))',
      explain: "Calls the function and prints the (wrong) result: 53.33 instead of 80."
    }
  ],
  bugs: [
    {
      title: "First element skipped (off-by-one)",
      severity: "high",
      line: 3,
      why:
        "The loop starts counting at 1 because humans count '1st, 2nd, 3rd'. But Python lists start at index 0, so nums[0] — the score 80 — is never added. The divide by len(nums) then spreads the too-small total across all 3 items, producing a believable-looking wrong answer. No crash, no error — which is exactly why this bug survives copy-paste.",
      misconception:
        "You assumed range(1, n) means 'from the 1st item' — in Python the 1st item is index 0, and range(1, n) starts at the SECOND item.",
      fix: "for i in range(len(nums)):   # or better:  for num in nums:"
    },
    {
      title: "No empty-list guard",
      severity: "medium",
      line: 5,
      why:
        "If someone calls average([]) the code divides by zero and crashes. The author only tested with a list that had items, so the failure path was never seen — a habit bug: testing only the happy path.",
      misconception: "You assumed the function will always receive a non-empty list.",
      fix: "if not nums: return 0  # decide what an empty average should be"
    }
  ],
  quiz: [
    {
      q: "What does range(1, len(nums)) actually iterate over for a 3-item list?",
      options: ["Indexes 1 and 2", "Indexes 0, 1 and 2", "Indexes 1, 2 and 3", "Just index 1"],
      answer: 0,
      explain:
        "range(1,3) gives 1 and 2 — index 0 is skipped, which is the bug."
    },
    {
      q: "Why does the program print a wrong answer instead of crashing?",
      options: [
        "Skipping an index is not an error in Python",
        "Python auto-fixes off-by-one errors",
        "print hides exceptions",
        "The list is too short to crash"
      ],
      answer: 0,
      explain: "Skipping data is logically wrong but perfectly legal — the scariest kind of bug."
    },
    {
      q: "Which call would make this code crash?",
      options: [
        "average([])",
        "average([5])",
        "average([1,2,3,4])",
        "average([0,0])"
      ],
      answer: 0,
      explain: "An empty list makes len(nums) zero → division by zero."
    },
    {
      q: "What is the most Pythonic fix for the loop?",
      options: [
        "for num in nums: total += num",
        "for i in range(0, len(nums)+1)",
        "while i <= len(nums)",
        "total = nums[1] + nums[2]"
      ],
      answer: 0,
      explain:
        "Iterating items directly removes index math — and the whole class of off-by-one bugs."
    }
  ]
};

// ========== UTILITY ==========
const $ = (id) => document.getElementById(id);
const esc = (s) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;"
  })[c]);

// ========== PERSISTENCE ==========
["apiKey", "model", "provider"].forEach((id) => {
  const saved = localStorage.getItem("ca_" + id);
  if (saved) $(id).value = saved;
  $(id).addEventListener("change", () => localStorage.setItem("ca_" + id, $(id).value));
});

$("provider").addEventListener("change", () => {
  const defs = {
    gemini: "gemini-2.0-flash",
    openai: "gpt-4o-mini",
    openrouter: "gpt-3.5-turbo",
    grok: "grok-3-mini"
  };
  $("model").value = defs[$("provider").value] || "gemini-2.0-flash";
  localStorage.setItem("ca_model", $("model").value);
});

// ========== TAB NAVIGATION ==========
function showTab(name) {
  document.querySelectorAll("#tabs button").forEach((b) =>
    b.classList.toggle("active", b.dataset.t === name)
  );
  ["overview", "lines", "bugs", "quiz"].forEach((t) =>
    $("tab-" + t).classList.toggle("hidden", t !== name)
  );
}

// ========== LOAD SAMPLE ==========
function loadSample() {
  $("codeInput").value = SAMPLE;
  $("lang").value = "Python";
}

// ========== API CALLS ==========
async function callGemini(sys, user, key, model) {
  const gurl =
    "https:" +
    "//generativelanguage" +
    ".googleapis.com/v1beta/models/" +
    encodeURIComponent(model) +
    ":generateContent?key=" +
    encodeURIComponent(key);
  const r = await fetch(gurl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: sys + "\n\n---\nCODE TO ANALYZE:\n" + user
            }
          ]
        }
      ],
      generationConfig: {
        response_mime_type: "application/json",
        temperature: 0.3
      }
    })
  });
  if (!r.ok) throw new Error("Gemini API error " + r.status + ": " + (await r.text()).slice(0, 300));
  const d = await r.json();
  return d.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

const API_URLS = {
  openai: "https:" + "//api" + ".openai.com/v1/chat/completions",
  openrouter: "https:" + "//oai.openrouter" + ".ai/v1/chat/completions",
  grok: "https:" + "//api" + ".groq.com/v1/chat/completions"
};

async function callOpenAI(sys, user, key, model, ourl) {
  try {
    const r = await fetch(ourl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + key
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: "CODE TO ANALYZE:\n" + user }
        ]
      })
    });
    if (!r.ok) throw new Error("API error " + r.status + ": " + (await r.text()).slice(0, 300));
    const d = await r.json();
    return d.choices?.[0]?.message?.content || "";
  } catch (err) {
    if (err instanceof TypeError && err.message === "Failed to fetch") {
      throw new Error(
        "Failed to fetch. This usually means the browser blocked the request or the provider endpoint is unreachable. " +
          "If you're using OpenRouter, try using a server-side proxy or confirm the key and endpoint are correct."
      );
    }
    throw err;
  }
}

function parseReport(text) {
  let t = text.trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start > -1 && end > -1) t = t.slice(start, end + 1);
  return JSON.parse(t);
}

// ========== MAIN AUTOPSY RUNNER ==========
async function runAutopsy() {
  const code = $("codeInput").value.trim();
  const errBox = $("errBox");
  errBox.classList.add("hidden");

  if (!code) {
    return showError('Paste some code first (or click "Load sample buggy code").');
  }

  const btn = $("runBtn");
  btn.disabled = true;
  btn.innerHTML = '<span class="spin"></span>Performing autopsy…';

  try {
    let report;
    const key = $("apiKey").value.trim();
    const useDemo = $("demoMode").checked && !key;

    if (useDemo) {
      await new Promise((r) => setTimeout(r, 900));
      report = DEMO_REPORT;
    } else {
      if (!key)
        throw new Error(
          'No API key. Open "AI settings" and paste one (Gemini keys are free at aistudio.google.com) — or tick Demo mode.'
        );

      const sys = $("sysPrompt").value;
      const user = "Language hint: " + $("lang").value + "\n\n" + code;

      const raw =
        $("provider").value === "gemini"
          ? await callGemini(sys, user, key, $("model").value.trim())
          : await callOpenAI(sys, user, key, $("model").value.trim(), API_URLS[$("provider").value]);

      report = parseReport(raw);
    }

    render(report);
  } catch (e) {
    showError(e.message);
  }

  btn.disabled = false;
  btn.innerHTML = "🔬 Run Autopsy";
}

function showError(msg) {
  const b = $("errBox");
  b.textContent = msg;
  b.classList.remove("hidden");
}

// ========== RENDER RESULTS ==========
function render(rep) {
  $("tab-overview").innerHTML = `<div class="overview"><p><b>Language:</b> ${esc(
    rep.language || "?"
  )}</p><br><p>${esc(rep.overview || "")}</p><br><p><b>${(rep.bugs || []).length}</b> bug(s) found · <b>${(
    rep.quiz || []
  ).length}</b> quiz questions ready.</p></div>`;

  $("tab-lines").innerHTML =
    (rep.lines || [])
      .map(
        (l) =>
          `<div class="lineRow"><div class="lineNo">${esc(l.line)}</div><div class="lineCode">${esc(
            l.code
          )}</div><div class="lineExp">↳ ${esc(l.explain)}</div></div>`
      )
      .join("") || '<div class="placeholder">No line notes.</div>';

  $("tab-bugs").innerHTML =
    (rep.bugs || [])
      .map(
        (b) =>
          `<div class="bug"><h3>🐛 ${esc(b.title)} <span class="sev ${esc(
            b.severity
          )}">${esc(b.severity)}</span> <span style="color:var(--muted);font-size:12px">line ${esc(
            b.line
          )}</span></h3>
       <div class="why"><b>WHY it happened:</b> ${esc(b.why)}<br><br><b>Your misconception:</b> ${esc(
            b.misconception
          )}</div>
       <div class="fix">✔ fix: ${esc(b.fix)}</div></div>`
      )
      .join("") || '<div class="placeholder">🎉 No bugs found in this code.</div>';

  let score = 0,
    answered = 0;
  $("tab-quiz").innerHTML =
    `<div class="score" id="scoreLine">Answer the questions — they come from YOUR code.</div>` +
    (rep.quiz || [])
      .map(
        (q, qi) =>
          `<div class="qz"><p><b>Q${qi + 1}.</b> ${esc(q.q)}</p>${q.options
            .map(
              (o, oi) =>
                `<button class="opt" data-q="${qi}" data-o="${oi}">${esc(o)}</button>`
            )
            .join("")}
        <div class="qexp" id="qexp${qi}">💡 ${esc(q.explain)}</div></div>`
      )
      .join("");

  document.querySelectorAll(".opt").forEach((btn) =>
    btn.addEventListener("click", () => {
      const qi = +btn.dataset.q,
        oi = +btn.dataset.o,
        q = rep.quiz[qi];
      const group = document.querySelectorAll(`.opt[data-q="${qi}"]`);

      if (group[0].disabled) return;

      group.forEach((b, i) => {
        b.disabled = true;
        if (i === q.answer) b.classList.add("correct");
      });

      if (oi !== q.answer) btn.classList.add("wrong");
      else score++;

      answered++;
      $("qexp" + qi).style.display = "block";
      $("scoreLine").textContent = `Score: ${score}/${answered} answered (${rep.quiz.length} total)`;
    })
  );

  showTab("overview");
}
