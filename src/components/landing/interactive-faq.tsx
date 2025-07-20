'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useState } from 'react'

interface FAQItem {
  question: string
  answer: string
}

const faqData: FAQItem[] = [
  {
    question: 'Is StudyCollab free to use?',
    answer:
      'Yes! StudyCollab is completely free to use. We believe education should be accessible to everyone, so all our core features including task management, note-taking, resource sharing, and study groups are available at no cost.',
  },
  {
    question: 'Can I access StudyCollab on mobile devices?',
    answer:
      'Absolutely! StudyCollab is fully responsive and works seamlessly on desktop, tablet, and mobile devices. We also offer a Progressive Web App (PWA) for an app-like experience on your phone.',
  },
  {
    question: 'How secure is my data?',
    answer:
      'We take security seriously. All data is encrypted in transit and at rest, we use industry-standard authentication, and we comply with privacy regulations. Your study materials and personal information are safe with us.',
  },
  {
    question: 'Can I collaborate with students from other universities?',
    answer:
      'Yes! While you can filter and find students from your university, StudyCollab supports collaboration across institutions. You can join study groups and share resources with students from Nepal and around the world.',
  },
  {
    question: 'What makes StudyCollab different from other study apps?',
    answer:
      "StudyCollab is built specifically for the needs of Nepali students while being globally accessible. We combine personal productivity tools with community features, and we're completely free and open-source.",
  },
  {
    question: 'How do I get started with StudyCollab?',
    answer:
      "Getting started is simple! Just click the 'Get Started' button, create your account, and you'll be guided through setting up your profile and exploring the features. No credit card or payment required.",
  },
]

export function InteractiveFAQ() {
  const [openItems, setOpenItems] = useState<number[]>([])

  const toggleItem = (index: number) => {
    setOpenItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    )
  }

  return (
    <section id="faq" className="bg-muted/50 py-20">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-muted-foreground">
            Everything you need to know about StudyCollab
          </p>
        </div>

        <div className="mx-auto max-w-3xl space-y-4">
          {faqData.map((item, index) => (
            <Card
              key={index}
              className="border-0 bg-gradient-to-r from-white to-primary/5 transition-all duration-300 hover:shadow-md"
            >
              <CardHeader
                className="cursor-pointer select-none"
                onClick={() => toggleItem(index)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="flex-1 pr-4 text-left text-lg font-semibold">
                    {item.question}
                  </CardTitle>
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 transition-colors duration-200 hover:bg-primary/20">
                    <span className="text-lg font-bold text-primary">
                      {openItems.includes(index) ? '−' : '+'}
                    </span>
                  </div>
                </div>
              </CardHeader>
              {openItems.includes(index) && (
                <CardContent className="animate-in slide-in-from-top-2 pt-0 duration-300">
                  <div className="border-t border-primary/10 pt-4">
                    <p className="leading-relaxed text-muted-foreground">
                      {item.answer}
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="mb-4 text-muted-foreground">Still have questions?</p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#"
              className="inline-flex items-center gap-2 font-medium text-primary transition-colors hover:text-primary/80"
            >
              <span className="text-lg">💬</span>
              Contact our support team
            </a>
            <span className="hidden text-muted-foreground sm:inline">•</span>
            <a
              href="#"
              className="inline-flex items-center gap-2 font-medium text-primary transition-colors hover:text-primary/80"
            >
              <span className="text-lg">👥</span>
              Join our community
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
