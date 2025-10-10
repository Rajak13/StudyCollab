'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMemo, useState } from 'react'
import { Button, Input } from '../ui'

interface FAQItem {
  question: string
  answer: string
  category: 'general' | 'technical' | 'features' | 'pricing'
}

const faqData: FAQItem[] = [
  {
    question: 'Is StudyCollab free to use?',
    answer:
      'Yes! StudyCollab is completely free to use. We believe education should be accessible to everyone, so all our core features including task management, note-taking, resource sharing, and study groups are available at no cost.',
    category: 'pricing'
  },
  {
    question: 'Can I access StudyCollab on mobile devices?',
    answer:
      'Absolutely! StudyCollab is fully responsive and works seamlessly on desktop, tablet, and mobile devices. We also offer a Progressive Web App (PWA) for an app-like experience on your phone.',
    category: 'technical'
  },
  {
    question: 'How secure is my data?',
    answer:
      'We take security seriously. All data is encrypted in transit and at rest, we use industry-standard authentication, and we comply with privacy regulations. Your study materials and personal information are safe with us.',
    category: 'technical'
  },
  {
    question: 'Can I collaborate with students from other institutions?',
    answer:
      'Yes! StudyCollab supports collaboration across institutions. You can join study groups and share resources with students from around the world.',
    category: 'features'
  },
  {
    question: 'What makes StudyCollab different from other study apps?',
    answer:
      "StudyCollab combines personal productivity tools with community features in one platform. We're completely free, open-source, and designed specifically for student needs with features like collaborative study boards, resource sharing, and integrated task management.",
    category: 'general'
  },
  {
    question: 'How do I get started with StudyCollab?',
    answer:
      "Getting started is simple! Just click the 'Get Started' button, create your account, and you'll be guided through setting up your profile and exploring the features. No credit card or payment required.",
    category: 'general'
  },
  {
    question: 'Can I use StudyCollab offline?',
    answer:
      'The desktop app offers offline capabilities for viewing and editing your notes and tasks. Changes will sync automatically when you reconnect to the internet.',
    category: 'technical'
  },
  {
    question: 'What features are included in StudyCollab?',
    answer:
      'StudyCollab includes task management with calendar views, rich note-taking with templates, collaborative study boards, resource sharing with voting, study groups with chat, file management, and much more.',
    category: 'features'
  },
  {
    question: 'Is there a desktop app available?',
    answer:
      'Yes! We offer a native desktop application with additional features like system notifications, global shortcuts, file drag-and-drop, and offline access. Download it from our homepage.',
    category: 'technical'
  },
  {
    question: 'How do study groups work?',
    answer:
      'Study groups are collaborative spaces where you can chat with members, share resources, work on study boards together, and organize group activities. You can create public or private groups and invite specific members.',
    category: 'features'
  }
]

const categories = [
  { id: 'all', label: 'All Questions', icon: '📋' },
  { id: 'general', label: 'General', icon: '❓' },
  { id: 'features', label: 'Features', icon: '⚡' },
  { id: 'technical', label: 'Technical', icon: '🔧' },
  { id: 'pricing', label: 'Pricing', icon: '💰' }
]

export function InteractiveFAQ() {
  const [openItems, setOpenItems] = useState<number[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const toggleItem = (index: number) => {
    setOpenItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    )
  }

  const filteredFAQs = useMemo(() => {
    let filtered = faqData

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item => 
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [searchQuery, selectedCategory])

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

        {/* Search and Filter Controls */}
        <div className="mx-auto max-w-3xl mb-8">
          <div className="mb-6">
            <Input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="flex items-center gap-2"
              >
                <span>{category.icon}</span>
                {category.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="mx-auto max-w-3xl space-y-4">
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No questions found matching your search.</p>
            </div>
          ) : (
            filteredFAQs.map((item, index) => (
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
            ))
          )}
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
