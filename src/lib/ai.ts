// Pluggable AI for the "Ask" chat.
// - Demo provider: runs on the phone with no key, answering from Pawgress's built-in dog-care knowledge.
// - Proxy provider: sends the chat (and photo) to your own server (see /server), which calls Claude.
// Switch by setting EXPO_PUBLIC_AI_PROXY_URL at build time, or Profile → AI connection in the app.

import type { ChatMessage, Dog } from './types';
import { snapshot, ageLabel, latestWeightKg } from './dogmath';
import { findFoodFacts, type Verdict } from '@/data/foodSafety';
import { pottyGuide } from '@/data/stages';
import { tipsFor, LESSONS } from '@/data/learn';

export interface OutgoingMessage {
  role: 'user' | 'assistant';
  text: string;
  image?: { data: string; mediaType: string };
}

export interface AIReply {
  text: string;
  verdict?: Verdict;
}

export interface AIProvider {
  id: 'demo' | 'proxy';
  label: string;
  send(history: OutgoingMessage[], dog: Dog | null): Promise<AIReply>;
}

export function dogSummary(dog: Dog | null): string {
  if (!dog) return '';
  const s = snapshot(dog);
  const kg = latestWeightKg(dog);
  return [
    `Name: ${dog.name}`,
    `Breed: ${dog.breed} (${dog.size} size), ${dog.sex}${dog.neutered ? ', neutered' : ''}`,
    `Age: ${ageLabel(s.weeks)} (life stage: ${s.stage.name})`,
    kg ? `Latest weight: ${kg} kg; expected adult weight about ${dog.adultWeightKg} kg` : `Expected adult weight about ${dog.adultWeightKg} kg`,
    `Daily calorie target: about ${s.cal.daily} kcal over ${s.cal.meals} meals; treat budget ${s.cal.treatBudget} kcal`,
    `Activity: ${dog.activity}`,
    dog.allergies.length ? `Known allergies or sensitivities: ${dog.allergies.join(', ')}` : 'No known allergies',
  ].join('\n');
}

// ---------- Proxy provider ----------

export function proxyProvider(url: string, token?: string): AIProvider {
  const base = url.replace(/\/+$/, '');
  return {
    id: 'proxy',
    label: 'Claude via your server',
    async send(history, dog) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 90_000);
      try {
        const res = await fetch(`${base}/chat`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', ...(token ? { 'x-app-token': token } : {}) },
          body: JSON.stringify({ messages: history, dog: dogSummary(dog) }),
          signal: ctrl.signal,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? `The AI server answered with an error (${res.status}).`);
        return { text: data.reply ?? '', verdict: data.verdict };
      } catch (e: any) {
        if (e?.name === 'AbortError') throw new Error('The AI server took too long to answer. Try again.');
        if (e instanceof TypeError) throw new Error('Could not reach your AI server. Check the address in Profile → AI connection.');
        throw e;
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

// ---------- Demo provider ----------

const has = (t: string, ...words: string[]) => words.some((w) => t.includes(w));

function verdictWord(v: Verdict) {
  return v === 'safe' ? 'Yes, in moderation' : v === 'caution' ? 'Only with care' : 'No';
}

export const demoProvider: AIProvider = {
  id: 'demo',
  label: 'Demo mode (on-device)',
  async send(history, dog) {
    await new Promise((r) => setTimeout(r, 700 + Math.random() * 600));
    const last = [...history].reverse().find((m) => m.role === 'user');
    const text = (last?.text ?? '').toLowerCase();
    const hasPhoto = !!last?.image;
    const name = dog?.name ?? 'your dog';
    const snap = dog ? snapshot(dog) : null;

    // Food safety
    const facts = findFoodFacts(text);
    if (facts.length) {
      const worst = facts.find((f) => f.verdict === 'unsafe') ?? facts.find((f) => f.verdict === 'caution') ?? facts[0];
      const lines = facts.slice(0, 3).map((f) => `• ${f.label}: ${verdictWord(f.verdict).toLowerCase()}. ${f.why}${f.how ? ' ' + f.how : ''}`);
      const allergy = dog?.allergies.find((a) => facts.some((f) => f.names.some((n) => a.toLowerCase().includes(n))));
      let out = `${verdictWord(worst.verdict)}. ${facts.length === 1 ? worst.why : ''}`.trim();
      if (facts.length > 1) out += '\n\n' + lines.join('\n');
      else if (worst.how) out += `\n\n${worst.how}`;
      if (allergy) out += `\n\nHeads up: ${name}'s profile lists "${allergy}" as an allergy or sensitivity, so skip it.`;
      if (worst.verdict === 'safe' && snap)
        out += `\n\nKeep treats under about ${snap.cal.treatBudget} kcal a day for ${name}, which is 10% of the daily target.`;
      return { text: out, verdict: worst.verdict };
    }

    if (hasPhoto) {
      return {
        text: `Got the photo! In demo mode I can't look at pictures yet. Tell me what it is, for example "can ${name} eat blueberries?", and I'll check it against the food safety list.\n\nTo get real photo answers, connect an AI server in Profile → AI connection.`,
      };
    }

    if (!snap || !dog) {
      return { text: 'Add your dog in the profile and I can give answers tailored to their age and size.' };
    }

    if (has(text, 'calorie', 'kcal', 'how much', 'portion', 'feed', 'food')) {
      return {
        text: `${name} is ${ageLabel(snap.weeks)} old, so a good daily target is about ${snap.cal.daily} kcal, split over ${snap.cal.meals} meals of roughly ${snap.cal.perMeal} kcal each. That's about ${snap.cal.weekly.toLocaleString()} kcal this week.\n\n${snap.cal.explain} Treats should stay under ${snap.cal.treatBudget} kcal a day.\n\nCheck your food bag for kcal per cup and log meals so the dashboard can track it.`,
      };
    }
    if (has(text, 'pee', 'poo', 'potty', 'toilet', 'accident', 'poop')) {
      const g = pottyGuide(snap.weeks, snap.stage.id);
      return {
        text: `At ${ageLabel(snap.weeks)}, ${name} can usually hold it for about ${g.hold} hour${g.hold > 1 ? 's' : ''}.\n\n• Pee: ${g.pee}\n• Poo: ${g.poo}\n• Night: ${g.night}\n\nReward right at the potty spot within 2 seconds, and clean accidents with an enzyme cleaner.`,
      };
    }
    if (has(text, 'walk', 'exercise', 'run', 'play')) {
      return {
        text: `A good target for ${name} right now is about ${snap.exerciseTarget} minutes of activity a day, split into short sessions. Sniff walks count double for tiring out the brain.${snap.stage.id === 'baby' || snap.stage.id === 'puppy' || snap.stage.id === 'junior' ? '\n\nAvoid long runs, stairs and jumping until growth plates close, which is around 12 to 18 months depending on size.' : ''}`,
      };
    }
    if (has(text, 'groom', 'brush', 'bath', 'nail', 'teeth', 'ear')) {
      const t = tipsFor(snap.stage.id, 'grooming').slice(0, 3);
      return { text: t.map((x) => `• ${x.title}: ${x.body}`).join('\n\n') };
    }
    if (has(text, 'train', 'sit', 'bite', 'nip', 'come', 'recall', 'leash')) {
      const avail = LESSONS.filter((l) => l.minWeeks <= snap.weeks).slice(0, 4).map((l) => l.title);
      return {
        text: `For a ${snap.stage.name.toLowerCase()}, keep sessions to 3 to 5 minutes and end on a win. Good lessons for ${name} right now: ${avail.join(', ')}. You'll find step-by-step guides in the Learn tab.`,
      };
    }
    if (has(text, 'vomit', 'diarr', 'blood', 'letharg', 'not eating', 'sick', 'swallow', 'ate something', 'poison')) {
      return {
        text: `If ${name} is vomiting repeatedly, has blood in vomit or stool, a swollen belly, trouble breathing, or may have eaten something toxic, call your vet or an emergency vet now.\n\nFor a single soft stool with normal energy, offer water, skip treats for a day, and log it under Health so you can spot patterns. Call the vet if it lasts more than 24 hours.`,
      };
    }
    if (has(text, 'sleep', 'nap', 'tired', 'night')) {
      return { text: `${snap.stage.name}s need about ${snap.stage.sleep}. A bitey, wild puppy is often overtired, so try a quiet crate nap with a chew.` };
    }

    return {
      text: `I'm in demo mode, so I can answer about food safety ("can ${name} eat grapes?"), calories, potty timing, exercise, grooming and training for ${name}'s age.\n\nFor open-ended questions and photo answers, connect an AI server in Profile → AI connection.`,
    };
  },
};

export function getProvider(proxyUrl: string, token?: string): AIProvider {
  const url = proxyUrl || process.env.EXPO_PUBLIC_AI_PROXY_URL || '';
  return url ? proxyProvider(url, token) : demoProvider;
}

export function toOutgoing(chat: ChatMessage[], latestImage?: { data: string; mediaType: string }): OutgoingMessage[] {
  const out: OutgoingMessage[] = chat.map((m) => ({ role: m.role, text: m.text }));
  if (latestImage && out.length) out[out.length - 1].image = latestImage;
  return out;
}
