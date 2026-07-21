# 🔬 CodeAutopsy

**Understand copied code with AI-powered autopsy reports.**

> **Live Deployment:** [👉 Click here to view the live app](#) *(Note: Please replace this link with your actual Vercel, Netlify, or GitHub Pages deployment URL)*

---

## 💡 The Problem & Our Solution
**The Problem:** Students and beginner programmers often rely on copying and pasting code from tutorials, Stack Overflow, or AI chatbots without actually understanding how the code works. This leads to "copy-paste programming," where the student learns very little, and introduces bugs they don't know how to fix.

**The Solution:** **CodeAutopsy** is a student-focused web application designed to act as a friendly code mentor. Instead of just giving the user the answer, CodeAutopsy breaks down pasted code line-by-line, explains any hidden bugs (and the misconceptions behind them), and generates a custom quiz to ensure the student actually understands the code they are about to use. 

**Target Audience:** Computer Science students, coding bootcamp attendees, and self-taught developers.

---

## ✨ Features
CodeAutopsy is packed with features to help students learn actively:
* **Multi-Language Support:** Auto-detects or allows manual selection of Python, JavaScript, Java, C, C++, HTML/CSS, and SQL.
* **Line-by-Line Breakdown:** Dissects code into logical blocks with plain-language, beginner-friendly explanations.
* **Deep Bug Analysis:** Doesn't just find bugs—it explains the *severity*, *why* the bug happens, the *misconception* that led to it, and offers a small fix.
* **Interactive AI Quiz:** Automatically generates a multiple-choice quiz based on the specific pasted code to test the user's comprehension.
* **Bring Your Own AI (BYOK):** Supports multiple AI providers including **Google Gemini, OpenAI, OpenRouter, and Groq**.
* **Local Storage Persistence:** Remembers your selected provider, model, and API key across sessions so you don't have to re-enter them.
* **Demo Mode:** Allows users to try out the UI and see a sample report without needing an API key.
* **Dynamic Helper Links:** Automatically provides the correct link to generate an API key based on the selected AI provider.

---

## 🤖 The AI Feature
The core of CodeAutopsy is its structured AI analysis engine. By utilizing a highly specific system prompt, we force the AI to return data in a strict JSON format, which our frontend then parses and renders into a beautiful, tabbed interface.

**What it does:** It takes raw, undocumented code and transforms it into a structured educational report consisting of an overview, a line-by-line breakdown, a bug report, and a quiz.

**The System Prompt:**
```text
You are CodeAutopsy, a friendly code mentor for students.
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
- Do not analyze malicious exploit code.
```

---

## 🛠️ Tools, Services, and AI Models Used
* **Frontend Core:** Pure HTML5, Vanilla JavaScript (ES6+), and Vanilla CSS (no heavy frameworks, ensuring lightning-fast load times).
* **Styling:** Custom CSS with a modern dark-mode aesthetic, utilizing glassmorphism, CSS Grid/Flexbox, and Google Fonts (Inter).
* **AI Models Supported:** 
  * Google Gemini (`gemini-2.5-flash`)
  * OpenAI (`gpt-4o-mini`)
  * Groq (`llama-3.3-70b-versatile`)
  * OpenRouter (`meta-llama/llama-3.3-70b-instruct:free`)
* **Storage:** Browser `localStorage` API for persisting user settings.

---

## 📸 Screenshots
*(Note: Replace these placeholder images with actual screenshots of your app before submitting!)*

### 1. The Input & Configuration Screen
![Input Screen](https://placehold.co/800x450/090d17/38bdf8?text=Screenshot+1:+Paste+Code+&+AI+Settings)
*Users paste their code and configure their preferred AI provider.*

### 2. Line-by-Line Breakdown
![Line-by-Line](https://placehold.co/800x450/090d17/34d399?text=Screenshot+2:+Line-by-Line+Analysis)
*The app breaks down the code so the student understands exactly what each block does.*

### 3. Interactive Code Quiz
![Quiz Interface](https://placehold.co/800x450/090d17/a855f7?text=Screenshot+3:+Interactive+Quiz)
*Testing the user's knowledge to ensure they aren't just blindly copy-pasting.*

---

## 🚀 How to Run the Project

Since CodeAutopsy is built with pure HTML, CSS, and JavaScript, it is incredibly easy to run locally. No build tools or node modules are required!

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/CodeAutopsy.git
   cd CodeAutopsy
   ```

2. **Open the project:**
   Simply double-click on `index.html` to open it in your default web browser.
   
   *Alternatively, if you use VS Code, you can use the **Live Server** extension:*
   * Right-click `index.html`
   * Select "Open with Live Server"

3. **Provide an API Key:**
   * Expand the "AI settings" tab in the app.
   * Select your preferred provider (e.g., Google Gemini).
   * Click the "Get Key" link to generate a free API key.
   * Paste the key into the input field and click "Run Autopsy"!

---
*Built with ❤️ for students who want to learn.*
