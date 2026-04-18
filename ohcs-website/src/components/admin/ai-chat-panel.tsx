'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Bot, Send, X, Sparkles, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// Reads from localStorage — controlled by Super Admin in Settings page
function isDemoMode(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem('ohcs_ai_demo_mode');
  return stored === null ? true : stored === 'true';
}

// Smart demo responses based on keywords
function getDemoResponse(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('summary') || lower.includes('overview') || lower.includes('how is')) {
    return `**Current Exercise Summary: 2026 Graduate Entrance Examination**\n\n\u2022 **371 total applications** received since 15 March 2026\n\u2022 **156 in Received** stage awaiting initial screening\n\u2022 **89 in Screening** \u2014 document verification in progress\n\u2022 **64 completed Examination** \u2014 average score: 62.4%\n\u2022 **32 in Interview** stage\n\u2022 **18 Shortlisted** for final consideration\n\u2022 **12 Appointed** so far\n\n**Key Insight:** The conversion rate from Received to Appointed is currently 3.2%, which is consistent with previous exercises. The screening stage has the largest backlog \u2014 consider allocating additional reviewers.`;
  }

  if (lower.includes('pass rate') || lower.includes('exam') || lower.includes('score')) {
    return `**Examination Performance Analysis**\n\n\u2022 **Pass Rate:** 64% (41 of 64 candidates scored above the 50% threshold)\n\u2022 **Average Score:** 62.4%\n\u2022 **Highest Score:** 89% (Adjoa Nyarko)\n\u2022 **Lowest Score:** 34% (2 candidates below minimum)\n\u2022 **Score Distribution:**\n  - 80-100%: 8 candidates (12.5%)\n  - 60-79%: 28 candidates (43.8%)\n  - 50-59%: 5 candidates (7.8%)\n  - Below 50%: 23 candidates (35.9%)\n\n**Recommendation:** The pass mark of 50% is yielding a healthy pool. Consider raising to 55% if you need to narrow the shortlist further.`;
  }

  if (lower.includes('region') || lower.includes('geographic') || lower.includes('where')) {
    return `**Geographic Distribution of Applications**\n\n\u2022 **Greater Accra:** 142 applications (38.3%) \u2014 highest\n\u2022 **Ashanti:** 89 applications (24.0%)\n\u2022 **Central:** 45 applications (12.1%)\n\u2022 **Eastern:** 38 applications (10.2%)\n\u2022 **Northern:** 22 applications (5.9%)\n\u2022 **Other Regions:** 35 applications (9.4%)\n\n**Concern:** Northern Region representation is significantly below population proportion (17.4% of population vs 5.9% of applications). Consider targeted outreach through Regional Training Institute in Kumasi and partnership with northern universities.`;
  }

  if (lower.includes('fraud') || lower.includes('duplicate') || lower.includes('suspicious')) {
    return `**Anti-Fraud Analysis**\n\n\u2022 **3 duplicate pairs detected** \u2014 same email addresses used across multiple applications\n\u2022 **2 suspicious IP clusters** \u2014 7 applications from the same IP within 30 minutes\n\u2022 **1 identity mismatch** \u2014 name/phone combination appears in a previous exercise under a different email\n\n**Actions Taken:**\n- 2 cases under investigation\n- 1 case cleared (shared family device confirmed)\n\n**Recommendation:** Enable phone number verification for the next exercise. Current duplicate rate (0.8%) is within acceptable bounds but monitoring should continue.`;
  }

  if (lower.includes('recommend') || lower.includes('shortlist') || lower.includes('who should')) {
    return `**Shortlisting Recommendation**\n\nBased on examination scores above 65% and complete documentation:\n\n1. **Adjoa Nyarko** \u2014 Score: 89%, MA Development Studies\n2. **Kwame Tetteh** \u2014 Score: 84%, BSc Accounting\n3. **Akosua Dufie** \u2014 Score: 81%, MSc Public Policy\n4. **Yaw Amoako** \u2014 Score: 78%, BSc Administration\n5. **Esi Appiah** \u2014 Score: 76%, BSc Computer Science\n6. **Kojo Mensah** \u2014 Score: 74%, BSc Supply Chain\n\n**Note:** 6 additional candidates scored between 65-73% and could be placed on a reserve list. All recommended candidates have verified qualifications and clean fraud checks.`;
  }

  if (
    lower.includes('draft') ||
    lower.includes('email') ||
    lower.includes('notification') ||
    lower.includes('write')
  ) {
    return `**Draft Communication \u2014 Shortlisted Candidates**\n\n---\n\nDear [Candidate Name],\n\nRe: 2026 Civil Service Graduate Entrance Examination \u2014 Shortlisting Notification\n\nWe are pleased to inform you that following the evaluation of your examination results, you have been **shortlisted** for the next stage of the 2026 Civil Service recruitment exercise.\n\nYour Reference Number: [OHCS-REC-XXXXXXXX-XXXX]\n\nPlease note the following:\n\u2022 Interview dates will be communicated within 14 working days\n\u2022 Bring original copies of all academic certificates\n\u2022 Report to the designated venue 30 minutes before your scheduled time\n\nFor enquiries, contact recruitment@ohcs.gov.gh\n\nCongratulations and best wishes.\n\nRecruitment, Training & Development Directorate\nOffice of the Head of the Civil Service`;
  }

  if (
    lower.includes('compare') ||
    lower.includes('last year') ||
    lower.includes('previous') ||
    lower.includes('trend')
  ) {
    return `**Year-over-Year Comparison**\n\n| Metric | 2025 Exercise | 2026 Exercise | Change |\n|--------|:---:|:---:|:---:|\n| Applications | 198 | 371 | +87.4% |\n| Pass Rate | 58% | 64% | +6pts |\n| Avg Score | 56.2% | 62.4% | +6.2pts |\n| Time to Shortlist | 45 days | 34 days* | -24.4% |\n| Appointment Rate | 6.1% | 3.2%* | -2.9pts |\n\n*Current exercise still in progress\n\n**Key Trends:**\n- Application volume has nearly doubled \u2014 possibly driven by improved online portal\n- Candidate quality is improving (higher scores)\n- Processing speed has improved significantly\n- Lower appointment rate reflects larger applicant pool, not reduced opportunities`;
  }

  return `I can help you analyse the recruitment data. Here are some things you can ask me:\n\n\u2022 **"Summarise the current exercise"** \u2014 overview of pipeline and key metrics\n\u2022 **"What's the exam pass rate?"** \u2014 detailed score analysis\n\u2022 **"Show regional distribution"** \u2014 geographic breakdown of applications\n\u2022 **"Any fraud detected?"** \u2014 anti-fraud analysis summary\n\u2022 **"Recommend candidates for shortlisting"** \u2014 data-driven shortlist\n\u2022 **"Draft a notification email"** \u2014 compose candidate communications\n\u2022 **"Compare with last year"** \u2014 year-over-year trends\n\nWhat would you like to know?`;
}

export function AiChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hello! I'm the **OHCS Recruitment Intelligence Analyst**. I can help you analyse recruitment data, identify trends, generate insights, and draft communications.\n\nWhat would you like to know about the current recruitment exercise?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking delay
    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));

    let responseText: string;
    if (isDemoMode()) {
      responseText = getDemoResponse(userMsg.content);
    } else {
      try {
        const res = await fetch('/api/v1/admin/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMsg.content,
            context: {
              exerciseName: '2026 Graduate Entrance Examination',
              totalApplications: 371,
              pipelineData:
                'Received:156, Screening:89, Examination:64, Interview:32, Shortlisted:18, Appointed:12',
            },
          }),
        });
        const data = await res.json();
        responseText =
          data.data?.message ?? 'I apologise, I could not process that request.';
      } catch {
        responseText =
          'I apologise, the AI service is currently unavailable. Please try again later.';
      }
    }

    const botMsg: Message = {
      id: `bot-${Date.now()}`,
      role: 'assistant',
      content: responseText,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, botMsg]);
    setIsTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Simple markdown bold rendering
  function renderContent(text: string) {
    return text.split('\n').map((line, i) => (
      <span key={i}>
        {line.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
          part.startsWith('**') && part.endsWith('**') ? (
            <strong key={j} className="font-bold">
              {part.slice(2, -2)}
            </strong>
          ) : (
            <span key={j}>{part}</span>
          ),
        )}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    ));
  }

  return (
    <>
      {/* Floating AI Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 z-50 w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 group"
          aria-label="Open AI Analyst"
        >
          <Sparkles className="h-6 w-6 text-primary-dark" aria-hidden="true" />
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-2xl border-2 border-accent/50 animate-ping opacity-30" />
        </button>
      )}

      {/* Chat Panel */}
      <div
        className={cn(
          'fixed top-0 right-0 bottom-0 w-[420px] bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Header */}
        <div className="bg-primary-dark p-5 flex items-center justify-between relative overflow-hidden shrink-0">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 24px), repeating-linear-gradient(90deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 24px)',
            }}
          />
          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center shadow-lg">
              <Bot className="h-5 w-5 text-primary-dark" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Recruitment Intelligence</h3>
              <p className="text-white/40 text-[10px] uppercase tracking-wider">
                AI Analyst &bull; Llama 3.3 70B
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="relative text-white/40 hover:text-white transition-colors p-1"
            aria-label="Close AI Analyst"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Kente stripe */}
        <div
          className="h-[3px] shrink-0"
          style={{
            background:
              'linear-gradient(90deg, #1B5E20 25%, #D4A017 25%, #D4A017 50%, #B71C1C 50%, #B71C1C 75%, #212121 75%)',
          }}
        />

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-primary text-white rounded-br-md'
                    : 'bg-gray-100 text-primary-dark rounded-bl-md',
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="h-3 w-3 text-accent" aria-hidden="true" />
                    <span className="text-[10px] font-bold text-accent uppercase tracking-wider">
                      AI Insight
                    </span>
                  </div>
                )}
                <div className="whitespace-pre-wrap">{renderContent(msg.content)}</div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 text-accent animate-spin" />
                <span className="text-xs text-text-muted">Analysing data...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border/30 p-4 shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about recruitment data..."
              className="flex-1 px-4 py-3 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className={cn(
                'w-11 h-11 rounded-xl flex items-center justify-center transition-all shrink-0',
                input.trim() && !isTyping
                  ? 'bg-primary text-white hover:bg-primary-light'
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed',
              )}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="text-[10px] text-text-muted/40 mt-2 text-center">
            Powered by Cloudflare Workers AI &bull; Llama 3.3 70B
          </p>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
