import type { TintName } from '@/constants/theme';
import type { StageId } from './stages';
import type { SkillLevel } from '@/lib/types';

export type TipCategory = 'potty' | 'feeding' | 'training' | 'grooming' | 'social' | 'health' | 'exercise' | 'sleep' | 'behavior';

export const CATEGORY_INFO: Record<TipCategory, { label: string; tint: TintName; icon: string }> = {
  potty: { label: 'Potty', tint: 'butter', icon: 'potty' },
  feeding: { label: 'Feeding', tint: 'peach', icon: 'bowl' },
  training: { label: 'Training', tint: 'lavender', icon: 'medal' },
  grooming: { label: 'Grooming', tint: 'sky', icon: 'brush' },
  social: { label: 'Social', tint: 'mint', icon: 'heart' },
  health: { label: 'Health', tint: 'rose', icon: 'cross' },
  exercise: { label: 'Exercise', tint: 'mint', icon: 'paw' },
  sleep: { label: 'Sleep', tint: 'lavender', icon: 'moon' },
  behavior: { label: 'Behavior', tint: 'peach', icon: 'spark' },
};

export interface Tip {
  id: string;
  cat: TipCategory;
  stages: StageId[] | 'all';
  title: string;
  body: string;
}

export const TIPS: Tip[] = [
  // Potty
  { id: 'p1', cat: 'potty', stages: ['baby', 'puppy'], title: 'Go out at the trigger moments', body: 'Take your puppy out right after waking, after eating or drinking, after play, and before bed. Most accidents happen when one of these is missed.' },
  { id: 'p2', cat: 'potty', stages: ['baby', 'puppy', 'junior'], title: 'Same spot, same words', body: 'Carry or lead your puppy to the same potty spot and say a cue like "go potty". Reward within 2 seconds of finishing, outside, not back at the door.' },
  { id: 'p3', cat: 'potty', stages: 'all', title: 'Clean accidents with enzyme cleaner', body: 'Regular cleaners leave a scent that invites a repeat. Enzyme cleaners break the smell down. Never punish accidents; just interrupt calmly and go outside.' },
  { id: 'p4', cat: 'potty', stages: ['baby', 'puppy'], title: 'Night trips are normal', body: 'Young puppies usually need one or two night trips. Keep them boring: no play, dim lights, straight back to bed.' },
  { id: 'p5', cat: 'potty', stages: 'all', title: 'Check the poop', body: 'Healthy stool is firm, brown and easy to pick up. Runny stool for more than a day, blood, or worms is a reason to call your vet.' },
  // Feeding
  { id: 'f1', cat: 'feeding', stages: ['baby', 'puppy', 'junior', 'adolescent'], title: 'Feed puppy food until grown', body: 'Puppy formulas have the right calcium and energy for growth. Large and giant breeds need a large-breed puppy food to protect their joints.' },
  { id: 'f2', cat: 'feeding', stages: 'all', title: 'Treats are 10% of the day', body: 'Keep treats to about 10% of daily calories and use part of each meal as training rewards. Pawgress shows your treat budget on the dashboard.' },
  { id: 'f3', cat: 'feeding', stages: 'all', title: 'Switch foods slowly', body: 'Change food over 7 to 10 days: 25% new for a few days, then 50%, then 75%, then 100%. Sudden switches often cause an upset stomach.' },
  { id: 'f4', cat: 'feeding', stages: 'all', title: 'Use the body check, not just the bag', body: 'You should feel the ribs easily under a thin layer of fat and see a waist from above. Bag amounts are a starting point, so adjust to your dog.' },
  { id: 'f5', cat: 'feeding', stages: 'all', title: 'Know your high-value treats', body: 'Save the treats your dog goes wild for (like chicken or cheese) for hard things: recall, vet visits and nail trims. Use kibble for easy, everyday rewards.' },
  // Training
  { id: 't1', cat: 'training', stages: ['baby', 'puppy', 'junior'], title: 'Short and sweet', body: 'Puppies learn best in 3 to 5 minute sessions, several times a day. End on a win while your puppy still wants more.' },
  { id: 't2', cat: 'training', stages: 'all', title: 'Mark and reward', body: 'Say "yes!" the instant your dog does the right thing, then give a treat. The marker tells them exactly what earned the reward.' },
  { id: 't3', cat: 'training', stages: ['junior', 'adolescent'], title: 'Adolescence is a phase', body: 'Around 6 to 18 months, dogs often "forget" cues. Go back a step, raise the reward value, and keep sessions short. It does pass.' },
  { id: 't4', cat: 'training', stages: ['baby', 'puppy', 'junior'], title: 'Teach a soft mouth', body: 'If teeth touch skin, say "ouch" calmly, pause play for a few seconds, then offer a toy to bite instead. Consistency teaches bite inhibition.' },
  // Grooming
  { id: 'g1', cat: 'grooming', stages: ['baby', 'puppy', 'junior'], title: 'Handle paws, ears and mouth daily', body: 'Touch each paw, look in the ears and lift the lips for a second, then treat. This makes vet visits and nail trims easy for life.' },
  { id: 'g2', cat: 'grooming', stages: 'all', title: 'Nails every 2 to 4 weeks', body: 'If you can hear clicking on the floor, nails are too long. Trim a little at a time, and try one paw a day with treats.' },
  { id: 'g3', cat: 'grooming', stages: 'all', title: 'Brush teeth daily', body: 'Dental disease is very common in dogs over 3. Use a dog toothpaste (never human toothpaste) and start with just a few seconds.' },
  { id: 'g4', cat: 'grooming', stages: 'all', title: 'Bath only when needed', body: 'Most dogs need a bath every 4 to 8 weeks. Too many baths dry out the skin. Use a dog shampoo and rinse well.' },
  { id: 'g5', cat: 'grooming', stages: 'all', title: 'Double coats shed in seasons', body: 'Double-coated breeds "blow" their undercoat once or twice a year. Brush with an undercoat rake daily during shedding season and never shave them.' },
  // Social
  { id: 's1', cat: 'social', stages: ['baby', 'puppy'], title: 'The socialization window', body: 'Between about 3 and 14 to 16 weeks, puppies decide what is normal. Aim for many calm, positive meetings with people, sounds, surfaces and gentle dogs.' },
  { id: 's2', cat: 'social', stages: ['baby', 'puppy'], title: 'Socialize safely before vaccines finish', body: 'Carry your puppy to watch the world, invite friends over, and meet healthy vaccinated adult dogs. Avoid dog parks until your vet says the vaccine series is done.' },
  { id: 's3', cat: 'social', stages: 'all', title: 'Read the body language', body: 'Yawning, lip licking, turning away and a tucked tail mean "I need space". Move further away and let your dog watch from a comfortable distance.' },
  // Health
  { id: 'h1', cat: 'health', stages: ['baby', 'puppy'], title: 'The vaccine series', body: 'Core puppy vaccines are usually given at about 6 to 8, 10 to 12 and 14 to 16 weeks, with rabies according to local law. Your vet will set the exact schedule.' },
  { id: 'h2', cat: 'health', stages: 'all', title: 'Monthly parasite prevention', body: 'Ask your vet about flea, tick, heartworm and worm prevention for your area. Set a monthly reminder in the Plan tab.' },
  { id: 'h3', cat: 'health', stages: 'all', title: 'When to call the vet now', body: 'Call right away for repeated vomiting, a swollen hard belly, trouble breathing, collapse, a suspected toxin, or no pee for 12 hours or more.' },
  { id: 'h4', cat: 'health', stages: ['adolescent'], title: 'Spay and neuter timing', body: 'The best timing depends on breed and size. Larger breeds often benefit from waiting until growth is done. Discuss it with your vet.' },
  { id: 'h5', cat: 'health', stages: ['senior'], title: 'Senior check-ups', body: 'Twice-yearly vet visits with blood work catch problems early. Watch for changes in thirst, appetite, weight and mobility.' },
  // Exercise
  { id: 'e1', cat: 'exercise', stages: ['baby', 'puppy', 'junior', 'adolescent'], title: 'The 5-minute guideline', body: 'A popular rule of thumb is about 5 minutes of structured walking per month of age, twice a day, plus free play. Avoid long runs and jumping until growth plates close.' },
  { id: 'e2', cat: 'exercise', stages: 'all', title: 'Sniffing is exercise for the brain', body: 'A slow 20-minute sniff walk can tire a dog out as much as a fast hour. Let them explore with their nose.' },
  { id: 'e3', cat: 'exercise', stages: 'all', title: 'Mind the heat', body: 'Walk in the cooler parts of the day. If the pavement is too hot for the back of your hand, it is too hot for paws.' },
  // Sleep
  { id: 'z1', cat: 'sleep', stages: ['baby', 'puppy', 'junior'], title: 'Overtired puppies bite more', body: 'Puppies need 18 to 20 hours of sleep. A crazy, bitey puppy often needs a nap, so try a chew in the crate somewhere quiet.' },
  { id: 'z2', cat: 'sleep', stages: 'all', title: 'A den of their own', body: 'A crate or pen with a soft bed and a chew becomes a safe place. Never use it as punishment.' },
  // Behavior
  { id: 'b1', cat: 'behavior', stages: ['junior', 'adolescent'], title: 'Chewing is a need', body: 'Teething peaks around 3 to 6 months. Rotate safe chews, freeze a wet washcloth, and keep shoes out of reach.' },
  { id: 'b2', cat: 'behavior', stages: 'all', title: 'Practice alone time', body: 'Build up time apart slowly, starting with a few minutes while you are home. A food puzzle when you leave makes goodbyes a good thing.' },
];

export function tipsFor(stage: StageId, cat?: TipCategory): Tip[] {
  return TIPS.filter((t) => (t.stages === 'all' || t.stages.includes(stage)) && (!cat || t.cat === cat));
}

export function tipOfTheDay(stage: StageId, date = new Date()): Tip {
  const pool = tipsFor(stage);
  const day = Math.floor(date.getTime() / 86400000);
  return pool[day % pool.length];
}

// ---------- Lessons (step-by-step guides with progress) ----------

export interface Lesson {
  id: string;
  title: string;
  level: SkillLevel;
  cat: TipCategory;
  minWeeks: number;
  minutes: string;
  summary: string;
  steps: string[];
  pro: string;
}

export const LESSONS: Lesson[] = [
  { id: 'name', level: 'beginner', title: 'Name game', cat: 'training', minWeeks: 8, minutes: '3 min', summary: 'Teach your dog that their name means "look at me for something good".', steps: ['In a quiet room, say the name once in a happy voice.', 'The moment your dog looks at you, say "yes!" and give a treat.', 'Repeat 5 times, then stop. Do this 3 times a day.', 'Add mild distractions, like a toy on the floor.', 'Try it in the garden or on a walk.'], pro: 'Never use the name to scold. Keep it a guaranteed good thing.' },
  { id: 'potty', level: 'beginner', title: 'Potty training', cat: 'potty', minWeeks: 8, minutes: 'All day', summary: 'A clear routine with lots of rewards. Most puppies are reliable by 4 to 6 months.', steps: ['Pick one outdoor potty spot and a cue word like "go potty".', 'Go out on a schedule: after waking, eating, play, and every 1 to 3 hours.', 'Reward within 2 seconds of finishing, right at the spot.', 'Supervise indoors or use the crate or pen when you cannot watch.', 'Log every trip in Pawgress to spot your puppy\'s pattern.', 'Celebrate a full week without accidents to earn the sticker.'], pro: 'Restlessness, sniffing in circles and heading for a corner are signs that your puppy needs to go out.' },
  { id: 'crate', level: 'beginner', title: 'Crate as a happy den', cat: 'sleep', minWeeks: 8, minutes: '5 min', summary: 'Build a crate your dog chooses to rest in.', steps: ['Leave the door open and toss treats inside. Let your puppy go in and out freely.', 'Feed meals in the crate with the door open.', 'Close the door for a few seconds while they eat, then open it before they finish.', 'Build up to 5, 10, then 30 minutes with a chew while you sit nearby.', 'Practice short absences: leave the room for a minute and return calmly.'], pro: 'Puppies can usually stay in a crate for about as many hours as their age in months, plus one.' },
  { id: 'sit', level: 'beginner', title: 'Sit', cat: 'training', minWeeks: 8, minutes: '3 min', summary: 'The classic. A polite way to say please.', steps: ['Hold a treat at your dog\'s nose.', 'Slowly move it up and back over their head. Their bottom drops.', 'Say "yes!" the moment they sit, then reward.', 'After 5 good reps, say "sit" just before the hand motion.', 'Fade the lure: use an empty hand and reward from the other hand.'], pro: 'Ask for a sit before meals, doors and leash-on to make it part of daily life.' },
  { id: 'down', level: 'beginner', title: 'Down', cat: 'training', minWeeks: 10, minutes: '4 min', summary: 'Lying down on cue builds calm.', steps: ['Start from a sit with a treat at the nose.', 'Lower the treat slowly straight down between the front paws.', 'Then slide it along the floor away from them. They follow into a down.', 'Mark and reward on the floor between the paws.', 'Add the word "down" once they follow the lure reliably.'], pro: 'Reward on the floor to teach that lying down is where the good stuff happens.' },
  { id: 'come', level: 'beginner', title: 'Come when called', cat: 'training', minWeeks: 8, minutes: '5 min', summary: 'The most important safety cue. Make coming to you the best game ever.', steps: ['Say the name and "come!" in a happy voice, then run backwards a few steps.', 'Throw a party when they reach you: high-value treat and praise.', 'Play the "puppy ping-pong" game between two people in a room.', 'Practice in the garden on a long line.', 'Never call your dog to end fun or for something unpleasant.'], pro: 'Use your highest-value treat for recall. Pawgress tracks which treats your dog loves most.' },
  { id: 'leave', level: 'intermediate', title: 'Leave it', cat: 'training', minWeeks: 12, minutes: '4 min', summary: 'Teaches your dog to turn away from dropped food and dangerous things.', steps: ['Close a treat in your fist and let your dog sniff and lick.', 'The moment they back off, say "yes!" and reward from the other hand.', 'Add the word "leave it" just before presenting the fist.', 'Progress to a treat on the floor covered by your hand.', 'Practice walking past a treat on the floor on leash.'], pro: 'Always reward with something better than the thing they left.' },
  { id: 'stay', level: 'intermediate', title: 'Stay', cat: 'training', minWeeks: 14, minutes: '4 min', summary: 'Build duration, then distance, then distractions, one at a time.', steps: ['Ask for a sit and wait 1 second, then mark and reward.', 'Build to 5, then 10 seconds.', 'Take one step back and return to reward.', 'Add a release word like "free!" to end the stay.', 'Add mild distractions, like dropping a glove.'], pro: 'Go back to you to reward. Calling the dog to you breaks the stay.' },
  { id: 'leash', level: 'intermediate', title: 'Loose-leash walking', cat: 'exercise', minWeeks: 12, minutes: '10 min', summary: 'Walking politely without pulling.', steps: ['Indoors, reward your dog for standing at your side.', 'Take one step. If they stay by your leg, reward at your hip.', 'If the leash goes tight, stop and wait. Move again when it loosens.', 'Change direction often to keep it fun.', 'Practice in the quiet street before busy places.'], pro: 'A harness with a front clip helps strong pullers while you train.' },
  { id: 'handle', level: 'beginner', title: 'Happy handling', cat: 'grooming', minWeeks: 8, minutes: '3 min', summary: 'Makes grooming, nail trims and vet visits stress-free.', steps: ['Touch one paw for a second, then treat.', 'Look into one ear, then treat.', 'Lift a lip to see the teeth, then treat.', 'Touch the nail clippers to a nail without cutting, then treat.', 'Trim one nail tip and give a jackpot reward.'], pro: 'Go slow. If your dog pulls away, go back a step.' },
  { id: 'alone', level: 'intermediate', title: 'Alone time', cat: 'behavior', minWeeks: 10, minutes: '5 min', summary: 'Prevent separation stress by teaching that being alone is okay.', steps: ['Give a stuffed food toy in the pen and step out of sight for 30 seconds.', 'Come back calmly before your dog gets upset.', 'Build up slowly: 1, 3, 5, 10 minutes.', 'Practice leaving the house briefly with a chew.', 'Keep hellos and goodbyes low-key.'], pro: 'A pet camera helps you see when your dog settles and when they get anxious.' },
  { id: 'teeth', level: 'beginner', title: 'Tooth brushing', cat: 'grooming', minWeeks: 10, minutes: '2 min', summary: 'Daily brushing prevents painful dental disease.', steps: ['Let your dog lick dog toothpaste off your finger.', 'Rub your finger along the outside of the teeth for 2 seconds.', 'Switch to a finger brush or soft dog toothbrush.', 'Brush the outer surfaces in small circles, a few teeth at a time.', 'Build up to 30 seconds per side.'], pro: 'Never use human toothpaste. It often contains xylitol, which is toxic to dogs.' },
  { id: 'touch', level: 'beginner', title: 'Hand touch', cat: 'training', minWeeks: 8, minutes: '3 min', summary: 'Your dog boops your palm with their nose. A handy way to move them anywhere.', steps: ['Hold your flat palm a few centimetres from their nose.', 'When they sniff or bump it, say "yes!" and treat.', 'Add the word "touch" as you present your hand.', 'Move your hand to the side or lower so they follow.', 'Use it to call them away from distractions.'], pro: 'Touch is a great way to redirect a puppy who is jumping or mouthing.' },
  { id: 'wait', level: 'intermediate', title: 'Wait at the door', cat: 'training', minWeeks: 14, minutes: '4 min', summary: 'Your dog waits until released before going through doors or jumping out of the car.', steps: ['With your dog on leash, put your hand on the door handle. Reward if they stay still.', 'Open the door a crack. Close it calmly if they move forward, reward if they stay.', 'Open it fully for a second, then reward.', 'Release with "okay!" and walk through together.', 'Practice at the car door and garden gate.'], pro: 'Wait is a safety skill. Use it at every door, every day, and it becomes automatic.' },
  { id: 'dropit', level: 'intermediate', title: 'Drop it', cat: 'training', minWeeks: 12, minutes: '4 min', summary: 'Your dog lets go of what is in their mouth, so you can swap stolen socks for a treat.', steps: ['Play with a low-value toy, then hold a tasty treat at their nose.', 'The moment they let go, say "drop" and give the treat.', 'Give the toy back. Dropping it should not end the fun.', 'Say "drop" before showing the treat.', 'Practice with more exciting toys.'], pro: 'Never chase a dog who has something. Trade instead, so they learn bringing things to you pays.' },
  { id: 'place', level: 'intermediate', title: 'Go to your bed', cat: 'behavior', minWeeks: 16, minutes: '5 min', summary: 'Your dog goes to their mat and settles. Great during dinner or when guests arrive.', steps: ['Toss a treat onto the mat. Reward again when they step on it.', 'Wait for them to choose the mat on their own, then reward.', 'Reward when they lie down on it.', 'Add the cue "bed" and build up to 1 minute.', 'Practice while you eat or when the doorbell rings.'], pro: 'Hand over a chew on the mat to make settling easier for busy dogs.' },
  { id: 'paw', level: 'intermediate', title: 'Shake paw', cat: 'training', minWeeks: 12, minutes: '3 min', summary: 'A fun trick that also makes paw handling easier.', steps: ['Ask for a sit and hold a treat in a closed fist low near one paw.', 'When they paw at your hand, say "yes!" and treat.', 'Open your empty hand. Reward when they place a paw on it.', 'Add the word "paw" or "shake".', 'Try the other paw with a different word.'], pro: 'Combine with nail trims: shake, then a tiny trim, then a treat.' },
  { id: 'spin', level: 'advanced', title: 'Spin', cat: 'training', minWeeks: 16, minutes: '3 min', summary: 'Your dog turns a full circle on cue. A fun trick that burns energy indoors.', steps: ['Lure a quarter turn with a treat at the nose, then reward.', 'Lure a half turn, then a full circle.', 'Make the lure smaller until a small hand circle is enough.', 'Add the word "spin" before the hand signal.', 'Teach the other direction with a different word.'], pro: 'Keep spins to a few reps. Too many in a row can make dogs dizzy.' },
  { id: 'rollover', level: 'advanced', title: 'Roll over', cat: 'training', minWeeks: 20, minutes: '5 min', summary: 'A crowd-pleaser that builds trust and body awareness.', steps: ['Start in a down. Lure the nose toward the shoulder so they shift onto one hip.', 'Continue the lure over the shoulder until they roll onto their back. Reward.', 'Keep luring until they complete the roll.', 'Shrink the lure to a hand sweep.', 'Add the cue "roll over".'], pro: 'Practice on a soft surface. Some dogs dislike being on their back, so go slowly.' },
  { id: 'findit', level: 'advanced', title: 'Find it (nose work)', cat: 'exercise', minWeeks: 16, minutes: '10 min', summary: 'Sniffing games tire dogs out fast and build confidence.', steps: ['Say "find it" and drop a treat by your feet.', 'Toss treats a little further and let them search.', 'Hide treats under a cup while they watch.', 'Hide treats around the room while they wait.', 'Hide a scented toy and reward a big find.'], pro: 'Ten minutes of nose work is as tiring as a long walk, which makes it perfect for rainy days.' },
  { id: 'heel', level: 'advanced', title: 'Heel', cat: 'training', minWeeks: 24, minutes: '10 min', summary: 'Your dog walks right at your side, head by your leg, through busy places.', steps: ['Start with loose-leash walking. Heel builds on it.', 'Reward heavily for your dog\'s shoulder at your leg.', 'Add the cue "heel" and take a few steps, then reward.', 'Add turns and changes of pace.', 'Practice past distractions, then release with "free!"'], pro: 'Heel is hard work for a dog. Use it for short stretches, then let them sniff.' },
  { id: 'backup', level: 'advanced', title: 'Back up', cat: 'training', minWeeks: 24, minutes: '5 min', summary: 'Your dog walks backwards. Builds rear-end awareness and gives space at doorways.', steps: ['Stand facing your dog in a narrow hallway.', 'Step toward them. Reward any backward step.', 'Build to two or three steps before rewarding.', 'Add the cue "back".', 'Try it in open spaces.'], pro: 'Reward by tossing the treat behind them so they keep moving back.' },
  { id: 'bow', level: 'advanced', title: 'Take a bow', cat: 'training', minWeeks: 20, minutes: '4 min', summary: 'Front down, bottom up. Also a lovely warm-up stretch.', steps: ['From a stand, lure the treat down between the front paws.', 'Reward the moment the elbows dip before the bottom drops.', 'Place a hand gently under the belly if they lie down.', 'Add the cue "bow".', 'Build to holding it for 2 seconds.'], pro: 'Capture it too: reward natural stretches when your dog wakes up.' },
  { id: 'distance', level: 'advanced', title: 'Down at a distance', cat: 'training', minWeeks: 30, minutes: '5 min', summary: 'Your dog lies down when asked from across a room. A real-life safety skill.', steps: ['Ask for a down while standing right next to your dog.', 'Take one step back, ask for down, and toss the reward to them.', 'Build up to a few metres.', 'Use a hand signal like a raised palm.', 'Practice outside on a long line.'], pro: 'If they creep toward you, reduce the distance and reward faster.' },
  { id: 'emergency', level: 'advanced', title: 'Emergency recall', cat: 'training', minWeeks: 24, minutes: '5 min', summary: 'A special word that means "drop everything and run to me". Kept for real emergencies.', steps: ['Pick a unique word or whistle you never use otherwise.', 'Say it, then give a jackpot of their favorite food.', 'Repeat at home 5 times a day for a week, always with a jackpot.', 'Practice outdoors on a long line with mild distractions.', 'Use it sparingly and always reward hugely.'], pro: 'Never use the emergency word for anything boring. Its power comes from always paying off.' },
];

export const LEVEL_INFO: Record<SkillLevel, { label: string; tint: TintName; blurb: string; needs?: SkillLevel; needCount: number }> = {
  beginner: { label: 'Beginner', tint: 'mint', blurb: 'Foundations every dog needs.', needCount: 0 },
  intermediate: { label: 'Intermediate', tint: 'lavender', blurb: 'Self-control and real-life manners.', needs: 'beginner', needCount: 3 },
  advanced: { label: 'Advanced', tint: 'peach', blurb: 'Tricks and pro-level skills for clever dogs.', needs: 'intermediate', needCount: 3 },
};

export const LEVELS: SkillLevel[] = ['beginner', 'intermediate', 'advanced'];

// ---------- Checklists ----------

export interface Checklist {
  id: string;
  title: string;
  tint: TintName;
  summary: string;
  items: { id: string; label: string }[];
}

export const CHECKLISTS: Checklist[] = [
  {
    id: 'supplies',
    title: 'Homecoming kit',
    tint: 'peach',
    summary: 'Everything to have ready before your dog comes home.',
    items: [
      { id: 'crate', label: 'Crate or playpen with a soft bed' },
      { id: 'bowls', label: 'Food and water bowls' },
      { id: 'food', label: 'The same food the breeder or shelter used' },
      { id: 'collar', label: 'Collar with an ID tag' },
      { id: 'harness', label: 'Harness and leash' },
      { id: 'treats', label: 'Small soft training treats' },
      { id: 'chews', label: 'Safe chew toys for teething' },
      { id: 'enzyme', label: 'Enzyme cleaner for accidents' },
      { id: 'bags', label: 'Poop bags' },
      { id: 'brush', label: 'Brush for their coat type' },
      { id: 'clippers', label: 'Nail clippers or grinder' },
      { id: 'toothbrush', label: 'Dog toothbrush and toothpaste' },
    ],
  },
  {
    id: 'proof',
    title: 'Puppy-proof the home',
    tint: 'butter',
    summary: 'Get down to puppy level and look for trouble.',
    items: [
      { id: 'cables', label: 'Hide or cover electrical cables' },
      { id: 'meds', label: 'Lock away medicines and cleaning products' },
      { id: 'plants', label: 'Move toxic plants (lilies, sago palm, aloe, pothos)' },
      { id: 'bins', label: 'Use bins with lids' },
      { id: 'shoes', label: 'Keep shoes, socks and kids\' toys off the floor' },
      { id: 'gates', label: 'Baby gates on stairs and off-limit rooms' },
      { id: 'fence', label: 'Check fences and gates for gaps' },
    ],
  },
  {
    id: 'admin',
    title: 'Vet and paperwork',
    tint: 'rose',
    summary: 'The behind-the-scenes jobs that keep your dog safe.',
    items: [
      { id: 'vet', label: 'Choose a vet and save their number' },
      { id: 'er', label: 'Find the nearest 24-hour emergency vet' },
      { id: 'firstvisit', label: 'Book a check-up within the first week' },
      { id: 'chip', label: 'Microchip registered to your details' },
      { id: 'vax', label: 'Vaccine schedule agreed with your vet' },
      { id: 'parasite', label: 'Flea, tick and worm prevention started' },
      { id: 'insurance', label: 'Consider pet insurance' },
      { id: 'license', label: 'Dog license or registration if required locally' },
      { id: 'poison', label: 'Save a pet poison helpline number' },
    ],
  },
  {
    id: 'social',
    title: 'Socialization bingo',
    tint: 'mint',
    summary: 'Aim for calm, happy meetings with each of these before 16 weeks, and keep going after.',
    items: [
      { id: 'kids', label: 'Children (calm and supervised)' },
      { id: 'hats', label: 'People in hats, glasses or uniforms' },
      { id: 'beards', label: 'People with beards' },
      { id: 'wheels', label: 'Bikes, scooters and wheelchairs' },
      { id: 'cars', label: 'Car rides' },
      { id: 'vacuum', label: 'Vacuum cleaner and hair dryer' },
      { id: 'doorbell', label: 'Doorbell and knocking' },
      { id: 'traffic', label: 'Traffic sounds' },
      { id: 'surfaces', label: 'Grass, gravel, tiles and metal grates' },
      { id: 'stairs', label: 'Stairs' },
      { id: 'dogs', label: 'Calm, vaccinated adult dogs' },
      { id: 'cats', label: 'Cats or other pets' },
      { id: 'vetvisit', label: 'A "happy visit" to the vet just for treats' },
      { id: 'handling', label: 'Being picked up and examined' },
      { id: 'rain', label: 'Rain and wind' },
    ],
  },
];

// ---------- Milestones (journey stickers) ----------

export interface Milestone {
  id: string;
  label: string;
  stage: StageId;
  sticker: string; // short word on the sticker
  tint: TintName;
}

export const MILESTONES: Milestone[] = [
  { id: 'home', label: 'Came home', stage: 'baby', sticker: 'Home', tint: 'peach' },
  { id: 'night', label: 'First night through', stage: 'baby', sticker: 'Zzz', tint: 'lavender' },
  { id: 'vet1', label: 'First vet visit', stage: 'baby', sticker: 'Vet', tint: 'rose' },
  { id: 'name', label: 'Knows their name', stage: 'baby', sticker: 'Hi!', tint: 'butter' },
  { id: 'sit', label: 'First sit', stage: 'puppy', sticker: 'Sit', tint: 'mint' },
  { id: 'vaxdone', label: 'Puppy vaccines done', stage: 'puppy', sticker: 'Shots', tint: 'sky' },
  { id: 'walk1', label: 'First walk outside', stage: 'puppy', sticker: 'Walk', tint: 'mint' },
  { id: 'bath1', label: 'First bath', stage: 'puppy', sticker: 'Bath', tint: 'sky' },
  { id: 'pottyweek', label: 'A week without accidents', stage: 'junior', sticker: 'Potty', tint: 'butter' },
  { id: 'teeth', label: 'Adult teeth in', stage: 'junior', sticker: 'Teeth', tint: 'lavender' },
  { id: 'recall', label: 'Comes when called outside', stage: 'adolescent', sticker: 'Come', tint: 'peach' },
  { id: 'trick', label: 'First trick', stage: 'adolescent', sticker: 'Trick', tint: 'rose' },
  { id: 'adultfood', label: 'Switched to adult food', stage: 'adult', sticker: 'Food', tint: 'peach' },
  { id: 'bday1', label: 'First birthday', stage: 'adult', sticker: '1 yr', tint: 'butter' },
];

// ---------- Grooming schedule by coat ----------

export const GROOM_BY_COAT: Record<string, { brush: string; bath: string; extra: string }> = {
  short: { brush: 'Once a week with a rubber curry brush', bath: 'Every 6 to 8 weeks', extra: 'Short coats still shed, and a rubber mitt lifts loose hair.' },
  double: { brush: '2 to 3 times a week, daily in shedding season', bath: 'Every 6 to 8 weeks', extra: 'Use an undercoat rake. Never shave a double coat.' },
  long: { brush: 'Daily to prevent mats', bath: 'Every 4 to 6 weeks', extra: 'Check behind the ears and armpits, where mats start.' },
  curly: { brush: 'Daily with a slicker brush', bath: 'Every 3 to 6 weeks', extra: 'Professional trim every 6 to 8 weeks.' },
  wire: { brush: 'Weekly', bath: 'Every 6 to 8 weeks', extra: 'Hand-stripping a few times a year keeps the coat crisp.' },
};
