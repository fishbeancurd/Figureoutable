export type Verdict = 'safe' | 'caution' | 'unsafe';

export interface FoodFact {
  names: string[];
  label: string;
  verdict: Verdict;
  why: string;
  how?: string;
}

// General guidance compiled from widely published veterinary and animal-poison-control advice.
// Always defer to your vet for your individual dog.
export const FOOD_FACTS: FoodFact[] = [
  { names: ['grape', 'grapes', 'raisin', 'raisins', 'sultana', 'currant'], label: 'Grapes and raisins', verdict: 'unsafe', why: 'Can cause sudden kidney failure, even in small amounts. There is no known safe dose.', how: 'If eaten, call your vet or a pet poison line right away.' },
  { names: ['chocolate', 'cocoa', 'brownie', 'mocha'], label: 'Chocolate', verdict: 'unsafe', why: 'Contains theobromine and caffeine. Dark and baking chocolate are the most dangerous.', how: 'Note the type and amount eaten and call your vet.' },
  { names: ['xylitol', 'birch sugar', 'sugar-free gum', 'sugar free gum', 'gum', 'mints'], label: 'Xylitol (sugar-free sweetener)', verdict: 'unsafe', why: 'Causes a rapid drop in blood sugar and can damage the liver. Found in sugar-free gum, some peanut butters and baked goods.', how: 'This is an emergency. Contact your vet immediately.' },
  { names: ['onion', 'onions', 'garlic', 'chive', 'chives', 'leek', 'leeks', 'shallot'], label: 'Onions, garlic, chives and leeks', verdict: 'unsafe', why: 'Damage red blood cells. Cooked, raw and powdered forms are all harmful.' },
  { names: ['macadamia'], label: 'Macadamia nuts', verdict: 'unsafe', why: 'Can cause weakness, tremors, vomiting and fever.' },
  { names: ['alcohol', 'beer', 'wine'], label: 'Alcohol', verdict: 'unsafe', why: 'Dogs are far more sensitive to alcohol than people.' },
  { names: ['coffee', 'caffeine', 'tea', 'energy drink'], label: 'Coffee and caffeine', verdict: 'unsafe', why: 'Caffeine can cause a racing heart, tremors and seizures.' },
  { names: ['cooked bone', 'cooked bones', 'chicken bone', 'bone', 'bones'], label: 'Cooked bones', verdict: 'unsafe', why: 'Cooked bones splinter and can choke or pierce the gut.' },
  { names: ['dough', 'yeast'], label: 'Raw yeast dough', verdict: 'unsafe', why: 'Expands in the stomach and produces alcohol.' },
  { names: ['avocado'], label: 'Avocado', verdict: 'caution', why: 'The pit is a choking and blockage hazard and the skin and leaves contain persin. A little plain flesh is low risk but best avoided.' },
  { names: ['cherry', 'cherries', 'plum', 'peach pit', 'apricot'], label: 'Stone fruit pits', verdict: 'unsafe', why: 'Pits are a blockage risk and contain cyanide compounds. Flesh without the pit in small amounts is fine.' },
  { names: ['nutmeg'], label: 'Nutmeg', verdict: 'unsafe', why: 'Contains myristicin, which can cause tremors and seizures.' },
  { names: ['ham', 'bacon', 'sausage', 'fatty', 'fat trimmings', 'fried'], label: 'Fatty and salty meats', verdict: 'caution', why: 'Very fatty foods can trigger pancreatitis, and processed meats are high in salt.' },
  { names: ['cheese', 'milk', 'ice cream', 'yogurt', 'dairy'], label: 'Dairy', verdict: 'caution', why: 'Many dogs are lactose intolerant. A little plain cheese or plain yogurt is fine for most dogs as a treat.' },
  { names: ['tomato', 'tomatoes'], label: 'Tomatoes', verdict: 'caution', why: 'Ripe red flesh is fine in small amounts. Green parts and leaves contain solanine.' },
  { names: ['corn', 'corn cob', 'cob'], label: 'Corn', verdict: 'caution', why: 'Kernels are fine, but cobs cause dangerous blockages.' },
  { names: ['popcorn'], label: 'Popcorn', verdict: 'caution', why: 'Plain air-popped is fine. Skip butter, salt and unpopped kernels.' },
  { names: ['carrot', 'carrots'], label: 'Carrots', verdict: 'safe', why: 'Crunchy, low calorie and good for chewing. Cut into small pieces for puppies.', how: 'A great low-value everyday treat.' },
  { names: ['apple', 'apples'], label: 'Apples', verdict: 'safe', why: 'A sweet, crunchy treat. Remove the core and seeds.' },
  { names: ['blueberry', 'blueberries'], label: 'Blueberries', verdict: 'safe', why: 'Small, low calorie and full of antioxidants. Good training-sized treats.' },
  { names: ['banana', 'bananas'], label: 'Banana', verdict: 'safe', why: 'Safe in small slices. Higher in sugar, so keep portions small.' },
  { names: ['watermelon'], label: 'Watermelon', verdict: 'safe', why: 'Hydrating and safe without seeds and rind.' },
  { names: ['strawberry', 'strawberries'], label: 'Strawberries', verdict: 'safe', why: 'Safe in small pieces as an occasional treat.' },
  { names: ['cucumber'], label: 'Cucumber', verdict: 'safe', why: 'Very low calorie and crunchy.' },
  { names: ['green bean', 'green beans'], label: 'Green beans', verdict: 'safe', why: 'Plain, unsalted green beans are a filling low-calorie snack.' },
  { names: ['pumpkin'], label: 'Pumpkin', verdict: 'safe', why: 'Plain cooked or canned pumpkin (not pie filling) can help firm up soft stools.' },
  { names: ['sweet potato'], label: 'Sweet potato', verdict: 'safe', why: 'Cooked and plain is fine. Never raw.' },
  { names: ['chicken', 'turkey'], label: 'Plain cooked chicken or turkey', verdict: 'safe', why: 'Plain, boneless, skinless and unseasoned meat is a high-value treat.', how: 'Many dogs rate this as a high-value training reward.' },
  { names: ['rice'], label: 'Plain rice', verdict: 'safe', why: 'Plain cooked rice is easy on the stomach.' },
  { names: ['egg', 'eggs'], label: 'Cooked eggs', verdict: 'safe', why: 'Cooked eggs are a good source of protein. Avoid raw eggs.' },
  { names: ['salmon', 'fish', 'sardine', 'sardines'], label: 'Cooked fish', verdict: 'safe', why: 'Cooked, boneless fish is fine. Never feed raw salmon, which can carry a dangerous parasite.' },
  { names: ['peanut butter', 'peanut'], label: 'Peanut butter', verdict: 'caution', why: 'Fine in small amounts only if it contains no xylitol. Check the label every time.' },
  { names: ['bread'], label: 'Plain bread', verdict: 'caution', why: 'Plain baked bread is not toxic but has little nutritional value. Avoid raisin, garlic and raw dough.' },
  { names: ['mango'], label: 'Mango', verdict: 'safe', why: 'Peeled flesh without the pit is fine in small amounts.' },
  { names: ['broccoli'], label: 'Broccoli', verdict: 'caution', why: 'Small amounts are fine. Large amounts can upset the stomach.' },
];

export function findFoodFacts(text: string): FoodFact[] {
  const t = ` ${text.toLowerCase()} `;
  const hits = FOOD_FACTS.filter((f) => f.names.some((n) => new RegExp(`[^a-z]${n.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}[^a-z]`).test(t)));
  // Prefer longer, more specific matches first (e.g. "peanut butter" over "butter").
  return hits.sort((a, b) => (a.verdict === 'unsafe' ? -1 : 0) - (b.verdict === 'unsafe' ? -1 : 0));
}
