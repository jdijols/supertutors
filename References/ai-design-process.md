In AI products, handoff is no longer a Figma file.

When I design a traditional product, my deliverables are clear: user flows, wireframes, components, interaction states. The screen is the spec.

When I design an AI product (conversational, agentic, or generative), that doesn't work anymore.

The experience depends on how the system interprets input, decides what to do, and recovers from failure. A static screen can't capture that.

So the artifacts change:
Intent Maps replace user flows. I'm not mapping a linear path. I'm mapping the space of possible user intentions and how the system should respond to each one.

Autonomy Matrices define what the AI can do alone, what requires confirmation, and what must escalate to a human. This is a design decision, not an engineering one.

Behavior Specs replace wireframes. Instead of "here's the screen," it's "here's exactly how the system behaves in every scenario, including ambiguity, failure, and edge cases."

Fallback Matrices document what happens when the AI doesn't understand, lacks data, or is uncertain. Because in AI products, failure modes are part of the core experience.

⚡ Eval Rubrics become a UX artifact. I define what "good" means (clarity, safety, tone, accuracy) so the system can be measured against product quality, not just technical performance.

Design System Rules for Agents make components machine-readable. If an AI generates UI, it needs to know when to use a button vs. a card, what's prohibited, and what falls outside the system.



The process changes too. It's no longer: Wireframe → Prototype → Handoff.

🎯 It's: Map intent → Define autonomy → Specify behavior → Document failures → Set quality criteria → Handoff a system spec.



Handoff used to be "here's what it looks like." Now it's "here's how it behaves, when it asks for help, and how we know it's working."