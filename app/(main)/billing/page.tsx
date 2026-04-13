"use client";

import { Check, Info, Rocket, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

const plans = [
  {
    name: "Free",
    slug: "free",
    price: "$0",
    description: "Perfect for exploring the platform and personal projects.",
    features: [
      "10 Daily AI Messages",
      "Up to 3 active quests",
      "Community support",
      "Standard analytics",
    ],
    highlight: false,
    icon: <Zap className="h-5 w-5 text-muted-foreground" />,
  },
  {
    name: "Pro",
    slug: "pro",
    price: "$19",
    description: "For professionals who need more power and customization.",
    features: [
      "Unlimited Daily AI Messages",
      "Unlimited active quests",
      "Priority email support",
      "Advanced analytics & exports",
      "Custom branding",
    ],
    highlight: true,
    icon: <Rocket className="h-5 w-5 text-primary" />,
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    price: "$49",
    description: "Full power for large teams and high-scale data collection.",
    features: [
      "Multi-user collaboration",
      "Dedicated account manager",
      "API access",
      "SSO & Custom domains",
      "White-labeling",
    ],
    highlight: false,
    icon: <Shield className="h-5 w-5 text-muted-foreground" />,
  },
];

export default function BillingPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-12 md:py-20">
      <div className="mb-16 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-black tracking-tight md:text-5xl"
        >
          Subscription <span className="text-primary">Plans</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg font-medium"
        >
          Choose the best plan for your data collection needs. All plans include our premium design system.
        </motion.p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.slug}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.1 * (index + 1) }}
            className={cn(
              "bg-background group relative flex flex-col rounded-3xl border p-8 transition-all duration-300",
              plan.highlight 
                ? "border-primary/50 ring-primary/20 shadow-primary/10 shadow-2xl ring-4" 
                : "border-border/50 hover:border-primary/20 hover:shadow-xl"
            )}
          >
            {plan.highlight && (
              <div className="bg-primary absolute -top-4 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-[10px] font-black tracking-widest text-primary-foreground uppercase">
                Most Popular
              </div>
            )}

            <div className="mb-8 flex items-center justify-between">
              <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-2xl",
                plan.highlight ? "bg-primary/10" : "bg-muted"
              )}>
                {plan.icon}
              </div>
              <div className="text-right">
                <span className="text-3xl font-black">{plan.price}</span>
                <span className="text-muted-foreground text-sm font-medium">/mo</span>
              </div>
            </div>

            <h3 className="text-xl font-bold">{plan.name}</h3>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              {plan.description}
            </p>

            <div className="my-8 h-px w-full bg-gradient-to-r from-transparent via-border/50 to-transparent" />

            <ul className="flex-1 space-y-4">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <div className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <Check className="h-2.5 w-2.5" />
                  </div>
                  <span className="text-sm font-semibold">{feature}</span>
                </li>
              ))}
            </ul>

            <Button 
              className={cn(
                "mt-8 h-12 w-full rounded-2xl font-black tracking-widest uppercase transition-all active:scale-[0.98]",
                plan.highlight ? "shadow-primary/20 shadow-lg" : "variant-outline"
              )}
              variant={plan.highlight ? "default" : "outline"}
              disabled
            >
              Coming Soon
            </Button>
          </motion.div>
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="bg-accent/5 border-border/30 mt-16 flex items-center justify-center gap-3 rounded-2xl border p-6 text-center"
      >
        <Info className="text-muted-foreground h-5 w-5" />
        <p className="text-muted-foreground text-sm font-bold">
          The billing service is not available right now. This is for demonstration purposes.
        </p>
      </motion.div>
    </div>
  );
}
