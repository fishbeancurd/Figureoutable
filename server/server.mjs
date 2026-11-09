// Pawgress AI proxy
// -----------------
// A tiny HTTP server that sits between the app and Claude so your API key never ships inside the app.
//
//   ANTHROPIC_API_KEY=sk-ant-...  node server.mjs
//
// Then, in the app: Profile → AI connection → paste http://<your-computer-ip>:8787
//
// Optional env vars:
//   PORT             default 8787
//   APP_TOKEN        if set, the app must send the same value (Profile → AI connection → access code)
//   PAWGRESS_MODEL   default claude-opus-5-5

import http from 'node:http';
import Anthropic from '@anthropic-ai/sdk';

const PORT = Number(process.env.PORT ?? 8787);
const APP_TOKEN = process.env.APP_TOKEN ?? '';
const MODEL = process.env.PAWGRESS_MODEL ?? 'claude-opus-5-5';
const MAX_BODY_BYTES = 12 * 1024 * 1024; // room for one compressed photo

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

const SYSTEM = `You are Pawgress, a warm, practical assistant for dog owners, many of them new to dogs.
You help with feeding, food safety, growth, potty training, training, grooming, exercise, behavior and everyday care.

How to answer:
- Lead with the direct answer in one sentence, then give the key reasons and what to do. Keep it short enough to read on a phone.
- Personalize to the dog profile you are given (age, breed, weight, allergies, calorie target).
- When the owner shares a photo, say what you see in it first. If you are not sure what it is, say so and ask.
- When the question is whether the dog can eat something, start your reply with exactly one line:
  VERDICT: safe | VERDICT: caution | VERDICT: unsafe
  then a blank line, then your answer. Only add this line for food or ingestion questions.
- If anything suggests poisoning, trouble breathing, collapse, a bloated belly, repeated vomiting, or blood, tell the owner to contact their vet or an emergency vet now, before any other advice.
- You are not a vet and cannot diagnose. Recommend a vet visit when symptoms last, worsen, or worry the owner.
- Use plain words, no markdown headings. Short bullet lists are fine.`;

function send(res, status, body) {
  res.writeHead(status, {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'content-type, x-app-token',
    'access-control-allow-methods': 'POST, GET, OPTIONS',
  });
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('too_large'));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new Error('bad_json'));
      }
    });
    req.on('error', reject);
  });
}

/** App messages → Claude messages. Images ride along on the user turn they were attached to. */
function toClaudeMessages(messages) {
  const out = [];
  for (const m of messages.slice(-20)) {
    if (m.role !== 'user' && m.role !== 'assistant') continue;
    if (m.role === 'assistant') {
      if (m.text) out.push({ role: 'assistant', content: m.text });
      continue;
    }
    const content = [];
    if (m.image?.data) {
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: m.image.mediaType ?? 'image/jpeg', data: m.image.data },
      });
    }
    content.push({ type: 'text', text: m.text?.trim() || 'What can you tell me about this for my dog?' });
    out.push({ role: 'user', content });
  }
  while (out.length && out[0].role !== 'user') out.shift();
  return out;
}

function parseVerdict(text) {
  const m = text.match(/^\s*VERDICT:\s*(safe|caution|unsafe)\s*\n+/i);
  if (!m) return { reply: text.trim() };
  return { verdict: m[1].toLowerCase(), reply: text.slice(m[0].length).trim() };
}

async function handleChat(body) {
  const messages = toClaudeMessages(Array.isArray(body.messages) ? body.messages : []);
  if (!messages.length) return { status: 400, body: { error: 'No message to answer.' } };

  const dog = typeof body.dog === 'string' ? body.dog.slice(0, 2000) : '';
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: 'medium' },
    // If a safety classifier declines, the API retries on a suitable fallback model in the same call.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: [
      { type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: dog ? `Dog profile:\n${dog}` : 'No dog profile was shared.' },
    ],
    messages,
  });

  if (response.stop_reason === 'refusal') {
    return {
      status: 200,
      body: { reply: "I can't help with that one. For anything about your dog's health, your vet is the best person to ask." },
    };
  }
  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
  return { status: 200, body: parseVerdict(text || 'Sorry, I could not come up with an answer. Please try again.') };
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.method === 'GET' && req.url === '/health') return send(res, 200, { ok: true, model: MODEL });
  if (req.method !== 'POST' || req.url !== '/chat') return send(res, 404, { error: 'Not found' });
  if (APP_TOKEN && req.headers['x-app-token'] !== APP_TOKEN) return send(res, 401, { error: 'Wrong access code.' });

  let body;
  try {
    body = await readJson(req);
  } catch (e) {
    return send(res, e.message === 'too_large' ? 413 : 400, {
      error: e.message === 'too_large' ? 'Photo is too large.' : 'Request was not valid JSON.',
    });
  }

  try {
    const out = await handleChat(body);
    send(res, out.status, out.body);
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      console.error('Invalid ANTHROPIC_API_KEY');
      send(res, 502, { error: 'The AI server key is not valid.' });
    } else if (error instanceof Anthropic.RateLimitError) {
      send(res, 429, { error: 'The AI is busy right now. Try again in a minute.' });
    } else if (error instanceof Anthropic.BadRequestError) {
      console.error('Bad request:', error.message);
      send(res, 400, { error: 'The AI could not read that message or photo.' });
    } else if (error instanceof Anthropic.APIConnectionError) {
      send(res, 502, { error: 'Could not reach the AI service.' });
    } else if (error instanceof Anthropic.APIError) {
      console.error(`API error ${error.status}:`, error.message);
      send(res, 502, { error: 'The AI service had a problem. Try again shortly.' });
    } else {
      console.error(error);
      send(res, 500, { error: 'Something went wrong on the AI server.' });
    }
  }
});

server.listen(PORT, () => {
  console.log(`Pawgress AI proxy on http://localhost:${PORT} using ${MODEL}`);
  if (!process.env.ANTHROPIC_API_KEY) console.warn('Warning: ANTHROPIC_API_KEY is not set.');
});
