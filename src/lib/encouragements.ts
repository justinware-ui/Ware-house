const DEMO_BUILDER_ENCOURAGEMENTS = [
  "Your competitors are out here sending PDFs. Be better.",
  "Somewhere, a buyer is sitting through a boring demo. Don't let it be yours.",
  "Warning: what you're about to build may cause buyers to ghost other vendors.",
  "A great demo won't close every deal. But a bad one will lose them. No pressure.",
  "You could send another cold email. Or you could build this. Choose wisely.",

  "Let's make something so good your buyer forwards it without being asked.",
  "Your product is great. Time to stop being the best-kept secret in your market.",
  "Buyers don't read. They click. Give them something worth clicking.",
  "This demo isn't going to build itself. (We checked.)",
  "The pipeline isn't going to fill itself either, but this is a good start.",

  "Somewhere out there, a champion is waiting to show this to their boss. Don't let them down.",
  "Fun fact: no one ever said 'I wish that demo had more slides.' Build accordingly.",
  "Your SDRs will love you for this. Your competitors? Less so.",
  "Less 'let me walk you through our platform,' more 'oh wow, I need this.'",
  "Legend has it a demo built here once closed a deal before the follow-up email was sent.",

  "You're not here to show features. You're here to change minds. Act like it.",
  "Make it so good they screenshot it and send it to their team.",
  "Build the demo you wish someone had sent you.",
  "Average demos get 'I'll think about it.' Great demos get 'who do I send the PO to?'",
]

export function getRandomEncouragement() {
  return DEMO_BUILDER_ENCOURAGEMENTS[
    Math.floor(Math.random() * DEMO_BUILDER_ENCOURAGEMENTS.length)
  ]
}
