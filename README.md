# CodeAutopsy 🔬

**A powerful AI-powered code analysis tool for students and developers to understand copied code and learn why bugs happen.**

---

## 📋 Overview

CodeAutopsy helps you understand code by providing:
- **Line-by-line explanations** of what each statement does
- **Bug detection & analysis** with clear explanations of WHY bugs happen
- **Misconception identification** that reveals the wrong belief behind the error
- **Interactive quizzes** based on the code's tricky parts
- **Multiple AI provider support** — Google Gemini, OpenAI, OpenRouter, or Groq

Perfect for:
- Students learning to code and copying from tutorials
- Reviewing code snippets from Stack Overflow or GitHub
- Understanding complex algorithms and logic
- Finding subtle bugs in code that appears to run correctly

---

## 🚀 Quick Start

### Option 1: Open in Browser (Fastest)
Open `index.html` directly in your browser. No server is required for normal use.

### Option 2: Run Locally (Recommended)
If your browser blocks local file access, use a local server:

```bash
cd codeautopsy
python -m http.server 8000
```

Then open: `http://localhost:8000`

---

## 📁 Project Structure

```
codeautopsy/
├── index.html          # Main HTML file (UI structure)
├── css/
│   └── styles.css      # Dark theme styling and layout
├── js/
│   └── app.js          # Application logic, AI integration, and UI behavior
└── README.md           # This file
```

### Files Explained
- **index.html** - page layout, inputs, tabs, and result panels
- **styles.css** - dark theme styling, responsive layout, buttons, and cards
- **app.js** - input handling, provider calls, report parsing, demo mode, and persistence

---

## ⚙️ How to Use

### Step 1: Paste Your Code
1. Copy code from your editor, tutorial, or Stack Overflow.
2. Paste it into the **"Patient intake"** section.
3. Pick the programming language or leave it on Auto-detect.

### Step 2: Choose an AI Provider

#### Option A: Google Gemini (Recommended)
1. Get an API key at [aistudio.google.com](https://aistudio.google.com)
2. Paste it into **AI settings** → **API key**
3. Use the free model `gemini-2.5-flash` (Gemini 2.0 Flash was retired June 2026)

#### Option B: OpenAI
1. Get an API key at [platform.openai.com](https://platform.openai.com)
2. Paste it into **AI settings**
3. Use `gpt-3.5-turbo` if you have free trial credits, or `gpt-4o-mini` if your account supports it

#### Option C: OpenRouter
1. Get an API key at [openrouter.ai/keys](https://openrouter.ai/keys)
2. Paste it into **AI settings**
3. Use a free model, e.g. `meta-llama/llama-3.3-70b-instruct:free` (any model ending in `:free`)
4. Calls go to `https://openrouter.ai/api/v1/chat/completions`

#### Option D: Groq
1. Get an API key at [console.groq.com/keys](https://console.groq.com/keys)
2. Paste it into **AI settings**
3. Use a current Groq model, e.g. `llama-3.3-70b-versatile` (note: Groq the fast-inference company is not the same as xAI's Grok model)

### Step 3: Run the Analysis
- Click **"🔬 Run Autopsy"**
- Wait a few seconds while the AI generates the report

### Step 4: Review the Report
The result panel includes:
1. **Overview** — summary of what the code does and its health
2. **Line-by-line** — easy explanations of each meaningful line
3. **Bugs & WHY** — identified bugs, their causes, misconceptions, and fixes
4. **Quiz me** — code-specific quiz questions with explanations

---

## 💡 Demo Mode

If you do not have an API key yet:
1. Enable **Demo mode**
2. Click **Load sample buggy code**
3. Click **Run Autopsy**

Demo mode uses a built-in example and does not require any API key.

---

## 🔐 Privacy & Security

- **API keys are stored only in your browser** using localStorage.
- **Your code is not sent to any project server** — only the AI provider receives it.
- **No logs or tracking** are stored by the app itself.

---

## 🛠️ Customize the AI Behavior

### AI instructions
- Open the **AI instructions** section
- Edit the prompt text
- The next analysis will use your custom prompt

The default prompt is designed to:
- Explain code in beginner-friendly language
- Focus on WHY bugs happen, not only what they are
- Create relevant quiz questions from the code

---

## 🎯 Languages Supported

- Python
- JavaScript / TypeScript
- Java
- C / C++
- HTML / CSS
- SQL
- Any language (when using Auto-detect)

---

## 🐛 Example: Off-by-One Bug

### Sample Input
```python
def average(nums):
    total = 0
    for i in range(1, len(nums)):
        total += nums[i]
    return total / len(nums)

scores = [80, 90, 70]
print(average(scores))  # Prints 53.33, should be 80
```

### What CodeAutopsy Finds
- **Bug**: First element skipped due to off-by-one error
- **Why**: `range(1, len(nums))` starts at index 1, so the first score is never added
- **Misconception**: assuming `range(1, n)` means the first item instead of the second
- **Fix**: `for i in range(len(nums)):` or better `for num in nums:`

---

## 💻 Technology Stack

- **Frontend**: HTML5 + CSS3
- **JavaScript**: Vanilla JS
- **AI Providers**:
  - Google Gemini
  - OpenAI
  - Groq
- **Browser Storage**: localStorage for provider/model settings and API key persistence

---

## 📝 Advanced Options

### Custom Model Selection
Change the model field to any model your provider supports:
- Gemini: `gemini-2.5-flash`, `gemini-2.5-flash-lite`
- OpenAI: `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`
- OpenRouter: any slug from [openrouter.ai/models](https://openrouter.ai/models), free ones end in `:free`
- Groq: `llama-3.3-70b-versatile`, `llama-3.1-8b-instant` (see [console.groq.com/docs/models](https://console.groq.com/docs/models) for the current list)

### Modify System Prompt
Edit the AI instructions to:
- Change analysis depth (beginner vs. expert)
- Add specific focus areas
- Request different quiz formats
- Change explanation style

---

## 🤝 Contributing

This is a student learning tool. To improve it:
1. Test with different code snippets
2. Report bugs in the analysis quality
3. Suggest new features or languages
4. Improve the default AI prompt

---

## 📄 License

**Educational Use Only** - This tool is designed for students to learn code understanding and debugging skills.

---

## 🎓 What You'll Learn

Using CodeAutopsy, you'll develop:
- ✅ Code reading skills
- ✅ Bug identification instincts
- ✅ Understanding of common programming mistakes
- ✅ Better debugging habits
- ✅ Confidence in explaining code to others

**Stop copying code blindly. Start understanding it.**

---

## ❓ FAQ

**Q: Is my code sent to the AI provider?**
A: Yes, only to the AI you choose (Gemini/OpenAI/Grok). Never to CodeAutopsy servers.

**Q: Can I use this offline?**
A: You need internet to call the AI provider's API, but the app runs fully locally.

**Q: Can I share my analysis?**
A: Yes! Copy the text from any tab or take a screenshot.

**Q: What's the best way to learn from this?**
A: Read the "WHY it happened" section carefully. That's where you'll fix your mental model.

---

**Made with 🔬 for curious learners everywhere**