"use client";

import { motion } from "framer-motion";
import { MessageSquarePlus, Settings2, Send, Trophy } from "lucide-react";

const steps = [
  {
    title: "Create Your Quest",
    description: "Use our AI generator or start from scratch with our drag-and-drop builder.",
    icon: MessageSquarePlus,
  },
  {
    title: "Customize & Configure",
    description:
      "Add branching logic, set up rewards, and style every element to match your brand.",
    icon: Settings2,
  },
  {
    title: "Share with Ease",
    description: "Distribute your quest via link, QR code, or embed it directly into your website.",
    icon: Send,
  },
  {
    title: "Get Results",
    description: "Watch the submissions roll in and analyze performance with real-time data.",
    icon: Trophy,
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-muted/30 py-24">
      <div className="container mx-auto px-6">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-6 text-4xl font-bold md:text-5xl"
          >
            How It Works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-muted-foreground text-lg"
          >
            Four simple steps to transform your audience engagement strategy.
          </motion.p>
        </div>

        <div className="relative">
          <div className="relative z-10 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group flex flex-col items-center text-center"
              >
                <div className="bg-background border-primary/20 group-hover:border-primary mb-6 flex h-16 w-16 items-center justify-center rounded-full border-4 shadow-xl transition-colors duration-500">
                  <step.icon className="text-primary h-8 w-8" />
                </div>
                <h3 className="mb-3 text-xl font-bold">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
