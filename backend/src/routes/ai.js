const express = require('express');
const router  = express.Router();
const authenticateToken = require('../middleware/auth');


// ── In-memory rate limiter (10 req / min per user) ────────────────────────────
const rateLimitMap = new Map();
const RATE_LIMIT   = 10;
const WINDOW_MS    = 60_000;

function checkRateLimit(userId) {
  const now    = Date.now();
  const record = rateLimitMap.get(userId) || { count: 0, windowStart: now };

  if (now - record.windowStart > WINDOW_MS) {
    record.count       = 1;
    record.windowStart = now;
  } else {
    record.count += 1;
  }

  rateLimitMap.set(userId, record);
  return record.count <= RATE_LIMIT;
}

// ── POST /api/ai/generate-tasks ───────────────────────────────────────────────
router.post('/generate-tasks', authenticateToken, async (req, res) => {
  try {
    const { projectGoal } = req.body;

    if (!projectGoal || typeof projectGoal !== 'string' || projectGoal.trim().length < 3) {
      return res.status(400).json({ message: 'projectGoal must be a non-empty string (min 3 chars).' });
    }

    if (!checkRateLimit(req.user.id)) {
      return res.status(429).json({ message: 'Too many AI requests. Please wait a minute.' });
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      return res.status(503).json({ message: 'AI service not configured. Add GROQ_API_KEY to backend .env.' });
    }

    const prompt = `You are a project management AI assistant.

Break down the following task/goal into 3 to 5 concrete, actionable subtasks.

Task: "${projectGoal.trim()}"

Respond ONLY with a valid JSON array. No explanation. No markdown. No code blocks.
Each item must have exactly these fields:
- "title": short action-oriented task title (max 60 chars)
- "priority": one of "low", "medium", "high"
- "estimate": realistic time estimate string like "2h", "1 day", "30 min"

Example format:
[{"title":"Set up project structure","priority":"high","estimate":"1h"},{"title":"Write unit tests","priority":"medium","estimate":"2h"}]`;

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        model:       'llama-3.1-8b-instant',
        messages:    [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens:  600,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error('[AI] Groq API error:', groqRes.status, errText);
      return res.status(502).json({ message: 'AI service returned an error. Please try again.' });
    }

    const groqData = await groqRes.json();
    const rawText  = groqData.choices?.[0]?.message?.content?.trim();

    if (!rawText) {
      return res.status(502).json({ message: 'AI returned an empty response.' });
    }

    // Parse JSON — strip any accidental markdown fences
    let tasks;
    try {
      const clean = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
      tasks = JSON.parse(clean);
      if (!Array.isArray(tasks)) throw new Error('Not an array');
    } catch {
      console.error('[AI] Failed to parse JSON:', rawText);
      return res.status(502).json({ message: 'AI response could not be parsed. Try rephrasing your goal.' });
    }

    // Sanitize & validate each task
    const VALID_PRIORITIES = new Set(['low', 'medium', 'high']);
    const sanitized = tasks.slice(0, 6).map((t) => ({
      title:    String(t.title   || '').slice(0, 80),
      priority: VALID_PRIORITIES.has(t.priority) ? t.priority : 'medium',
      estimate: String(t.estimate || '').slice(0, 20),
    })).filter((t) => t.title.length > 0);

    return res.json({ tasks: sanitized });

  } catch (err) {
    console.error('[AI] Unexpected error:', err);
    return res.status(500).json({ message: 'Unexpected error in AI service.' });
  }
});

module.exports = router;
