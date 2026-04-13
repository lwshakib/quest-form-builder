"use client";

import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is a 'Quest'?",
    answer:
      "A Quest is our modern take on forms. It's an interactive, multi-step experience that combines the functionality of a form with the engagement of a game or personal conversation. It's designed to keep users engaged until completion.",
  },
  {
    question: "How does the AI generation work?",
    answer:
      "Our AI uses advanced language models to understand your requirements. Just describe what you want to achieve (e.g., 'Create a newsletter signup with a preference survey'), and it will generate the structure, questions, and even suggestions for rewards.",
  },
  {
    question: "Can I customize the design?",
    answer:
      "Absolutely! Every quest and form is fully customizable. You can change colors, fonts, backgrounds, and layouts to perfectly align with your brand identity.",
  },
  {
    question: "Is there a limit on submissions?",
    answer:
      "Our Free plan includes ample submissions for starters. Pro and Enterprise plans offer unlimited submissions to grow with your business needs.",
  },
  {
    question: "Can I integrate with other tools?",
    answer:
      "Yes, Quest Form Builder supports integrations with popular tools like Slack, Discord, Google Sheets, and CRM platforms via webhooks and native connectors.",
  },
];

export default function FaqSection() {
  return (
    <section id="faq" className="py-24">
      <div className="container mx-auto max-w-4xl px-6">
        <div className="mb-16 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-6 text-4xl font-bold md:text-5xl"
          >
            Frequently Asked Questions
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-muted-foreground text-lg"
          >
            Everything you need to know about Quest Form Builder.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-b-border/50">
                <AccordionTrigger className="hover:text-primary py-6 text-left text-lg font-semibold transition-colors hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6 text-base leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
