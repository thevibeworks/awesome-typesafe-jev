// Section order and copy. The README and the site both render from this.
export const CATEGORIES = [
  ["browser-computer-use", "Browser and computer use", "Agents that click and type, with Jev making each step's decision."],
  ["agent-tooling", "Agent tooling", "Routers, guardrails, verifiers and harness parts built on typed answers."],
  ["game", "Games and control", "Jev making real-time decisions in a game or a simulator."],
  ["benchmark-research", "Benchmarks and research", "Measurements, evals and open reimplementations. Read the method before the number."],
  ["application", "Applications and demos", "End-user tools with Jev doing the judgment."],
  ["official", "Official", "From TypeSafe AI. Start here if you have not made a call yet."],
  ["sdk", "SDKs and integrations", "Clients and adapters beyond the official Python and JS SDKs."],
];
export const CATEGORY_IDS = CATEGORIES.map(c => c[0]);
