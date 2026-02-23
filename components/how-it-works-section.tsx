"use client";

import { motion } from "framer-motion";
import { MessageSquarePlus, Settings2, Send, Trophy } from "lucide-react";

const steps = [
  {
    title: "Create Your Quest",
    description:
      "Use our AI generator or start from scratch with our drag-and-drop builder.",
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
    description:
      "Distribute your quest via link, QR code, or embed it directly into your website.",
    icon: Send,
  },
  {
    title: "Get Results",
    description:
      "Watch the submissions roll in and analyze performance with real-time data.",
    icon: Trophy,
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-bold mb-6"
          >
            How It Works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            Four simple steps to transform your audience engagement strategy.
          </motion.p>
        </div>

        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex flex-col items-center text-center group"
              >
                <div className="w-16 h-16 rounded-full bg-background border-4 border-primary/20 flex items-center justify-center mb-6 group-hover:border-primary transition-colors duration-500 shadow-xl">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
