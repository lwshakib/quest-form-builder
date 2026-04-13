"use client";

import { motion } from "framer-motion";
import { Zap, Layout, Sparkles, Smartphone, ShieldCheck, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "AI-Powered Generation",
    description:
      "Describe your goal and let our AI build the perfect quest or form structure in seconds.",
    icon: Sparkles,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    title: "Intuitive Builder",
    description:
      "Drag-and-drop interface with real-time preview. Building complex forms has never been easier.",
    icon: Layout,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    title: "Interactive Quests",
    description:
      "Transform boring forms into engaging quests with branching logic and gamified elements.",
    icon: Zap,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
  },
  {
    title: "Responsive Design",
    description:
      "Your quests look stunning on every device, from mobile phones to high-res desktops.",
    icon: Smartphone,
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  {
    title: "Secure & Compliant",
    description:
      "Enterprise-grade security. Your data is encrypted and handled with the highest privacy standards.",
    icon: ShieldCheck,
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    title: "Advanced Analytics",
    description:
      "Deep insights into user behavior, completion rates, and submission data at a glance.",
    icon: BarChart3,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="relative overflow-hidden py-24">
      <div className="relative z-10 container mx-auto px-6">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-6 text-4xl font-bold md:text-5xl"
          >
            Powerful Features for Modern Engagement
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-muted-foreground text-lg"
          >
            Everything you need to create, manage, and analyze high-converting forms and immersive
            quest experiences.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group bg-card hover:border-primary/50 rounded-2xl border p-8 transition-all duration-300"
            >
              <div
                className={cn(
                  "mb-6 flex h-12 w-12 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110",
                  feature.bg,
                )}
              >
                <feature.icon className={cn("h-6 w-6", feature.color)} />
              </div>
              <h3 className="mb-3 text-xl font-bold">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
