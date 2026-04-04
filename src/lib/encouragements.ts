const DEMO_BUILDER_ENCOURAGEMENTS = [
  "Your buyers are about to have their 'aha' moment. Let's build it.",
  "Great demos don't just show a product — they tell a story. Yours starts now.",
  "The best demo your prospect has ever seen? You're about to make it.",
  "Every deal that ever closed started with someone building something. Let's go.",
  "You're one great demo away from a yes.",

  "Warning: demos built here may cause excessive excitement in your buyers.",
  "Less talk, more wow. You've got this.",
  "Your competitors are still sending slide decks. You're building experiences.",
  "Think of this as your buyers' future favorite thing to click on.",
  "Demo mode: activated. Let the magic begin.",

  "Buyers who see it, believe it. Let's make sure they see the right things.",
  "The fastest path from interest to intent? A great demo. You're in the right place.",
  "Good demos answer questions. Great demos create excitement. Build a great one.",
  "Show them the future. Your future customer is waiting.",

  "What story do you want your buyer to walk away with? Start there.",
  "Build it once, wow them every time.",
  "Every click you design here is a step closer to 'send me the contract.'",
  "Your pipeline will thank you for this.",
]

export function getRandomEncouragement() {
  return DEMO_BUILDER_ENCOURAGEMENTS[
    Math.floor(Math.random() * DEMO_BUILDER_ENCOURAGEMENTS.length)
  ]
}
