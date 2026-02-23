"use client";

import { motion } from "framer-motion";
import {
  Zap,
  Layout,
  Sparkles,
  Smartphone,
  ShieldCheck,
  BarChart3,
  MousePointer2,
  Users,
} from "lucide-react";
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
    <section id="features" className="relative py-24 overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-bold mb-6"
          >
            Powerful Features for Modern Engagement
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            Everything you need to create, manage, and analyze high-converting
            forms and immersive quest experiences.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group p-8 rounded-2xl border bg-card hover:border-primary/50 transition-all duration-300"
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-300",
                  feature.bg,
                )}
              >
                <feature.icon className={cn("w-6 h-6", feature.color)} />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
