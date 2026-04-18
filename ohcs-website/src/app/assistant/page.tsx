'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Send, Bot, Sparkles, ArrowLeft, MessageCircle,
  Building2, Users, FileText, HelpCircle, Loader2,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const SUGGESTED_QUESTIONS = [
  'What does OHCS do?',
  'How do I apply for the Civil Service?',
  'How do I submit an RTI request?',
  'Who is the Head of the Civil Service?',
  'How do I file a complaint?',
  'What are the office hours?',
];

function getBotResponse(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey') || lower.includes('good morning') || lower.includes('good afternoon') || lower.includes('good evening')) {
    return `${getGreeting()}! Welcome to the Office of the Head of the Civil Service. 😊\n\nI'm here to help you with anything related to Ghana's Civil Service — from recruitment and RTI requests to understanding our structure and services.\n\nPlease, how can I assist you today?`;
  }

  if (lower.includes('what does ohcs do') || lower.includes('what is ohcs') || lower.includes('about ohcs') || lower.includes('tell me about')) {
    return `Great question! The **Office of the Head of the Civil Service (OHCS)** is the apex administrative body responsible for managing, developing, and reforming Ghana's Civil Service.\n\nOur key functions include:\n• **Recruitment** — Managing the Civil Service Graduate Entrance Examination\n• **Training & Development** — Building capacity across 20,000+ civil servants\n• **Policy & Reform** — Driving modernisation of public service delivery\n• **Career Management** — Overseeing promotions, transfers, and postings\n• **Performance Management** — Ensuring accountability and excellence\n\nWe operate through **5 Line Directorates** and **6 Support Units** across all 16 regions of Ghana.\n\nWould you like to know more about any specific area?`;
  }

  if (lower.includes('apply') || lower.includes('recruitment') || lower.includes('join') || lower.includes('job') || lower.includes('exam') || lower.includes('entrance')) {
    return `Thank you for your interest in joining Ghana's Civil Service! Here's what you need to know:\n\n**How Recruitment Works:**\n1. OHCS announces recruitment exercises through official channels (ohcs.gov.gh, our social media)\n2. Applications are submitted through this portal during the open window\n3. Shortlisted candidates sit the **Civil Service Graduate Entrance Examination**\n4. Successful candidates are appointed and posted\n\n**Important:**\n⚠️ OHCS **never charges fees** for applications\n⚠️ Only trust announcements from **ohcs.gov.gh**\n⚠️ No individual is authorised to collect payments on our behalf\n\nYou can subscribe for notifications on our [Recruitment page](/services/recruitment) to be the first to know when the next exercise opens.\n\nIs there anything else about the recruitment process you'd like to know?`;
  }

  if (lower.includes('rti') || lower.includes('right to information') || lower.includes('information request') || lower.includes('public records')) {
    return `Under the **Right to Information Act, 2019 (Act 989)**, every person has the right to request information held by public institutions. Here's how:\n\n**Your Rights:**\n• You can request any information held by a public institution\n• No need to give a reason for your request\n• Institutions must respond within **14 working days**\n• If denied, you can appeal to the RTI Commission within 21 days\n\n**How to Submit:**\nVisit our [RTI page](/services/rti) and fill out the request form. You'll receive a reference number to track your request.\n\n**No fees** are charged for submitting a request (reproduction costs may apply for physical copies).\n\nWould you like me to guide you through the submission process?`;
  }

  if (lower.includes('head of') || lower.includes('who is the head') || lower.includes('leadership') || lower.includes('aggrey') || lower.includes('chief director')) {
    return `The current leadership of OHCS:\n\n**Head of the Civil Service:**\n🏛️ **Dr. Evans Aggrey-Darkoh, Ph.D.**\nLeading the transformation and modernisation of Ghana's civil service to deliver efficient, transparent, and accountable public services.\n\n**Chief Director:**\n🏛️ **Mr. Sylvanus Kofi Adzornu**\nOverseeing administrative operations and driving institutional excellence across all directorates and departments.\n\nYou can learn more about our full leadership team on the [Leadership page](/about/leadership).\n\nIs there anything else you'd like to know?`;
  }

  if (lower.includes('complaint') || lower.includes('feedback') || lower.includes('report') || lower.includes('issue') || lower.includes('problem')) {
    return `I'm sorry to hear you're experiencing an issue. We take all complaints and feedback seriously.\n\n**How to File:**\nVisit our [Complaints & Feedback page](/services/complaints) — our AI assistant will guide you through the process step by step.\n\n**What Happens Next:**\n• You'll receive a **reference number** immediately\n• Your complaint is routed to the appropriate directorate\n• You can track the status using your reference number\n• We aim to resolve complaints within **21 working days**\n\n**For urgent matters**, you can also:\n📞 Call: +233 (0)30 266 5421\n📧 Email: info@ohcs.gov.gh\n\nYour feedback helps us improve. Would you like help with anything else?`;
  }

  if (lower.includes('office hours') || lower.includes('when are you open') || lower.includes('opening hours') || lower.includes('what time')) {
    return `**OHCS Office Hours:**\n🕐 Monday – Friday: **8:00 AM – 5:00 PM**\n\nWe are closed on weekends and public holidays.\n\n**Location:**\n📍 Office of the Head of the Civil Service\nP.O. Box M.49, Accra, Ghana\n\n**Contact:**\n📞 +233 (0)30 266 5421\n📧 info@ohcs.gov.gh\n\nEven though the office may be closed, I'm available **24/7** right here to help you with information! 😊\n\nWhat else can I help you with?`;
  }

  if (lower.includes('directorate') || lower.includes('structure') || lower.includes('unit') || lower.includes('department')) {
    return `OHCS is structured into **5 Line Directorates** and **6 Support Units**:\n\n**Line Directorates:**\n1. 📊 Research, Statistics & Information Management (RSIMD)\n2. 💰 Finance & Administration (F&A)\n3. 📋 Planning, Budgeting, Monitoring & Evaluation (PBMED)\n4. 💼 Career Management (CMD)\n5. 🎓 Recruitment, Training & Development (RTDD)\n\n**Support Units:**\n1. 🔄 Reform Coordinating Unit (RCU)\n2. 📑 Internal Audit Unit (IAU)\n3. ⚖️ Civil Service Council (CSC)\n4. 🏢 Estate Unit\n5. 💳 Accounts Unit\n6. 📦 Stores Unit\n\nWe also have **3 Training Institutions** across the country.\n\nWould you like details about any specific directorate or unit?`;
  }

  if (lower.includes('publication') || lower.includes('download') || lower.includes('document') || lower.includes('form') || lower.includes('circular')) {
    return `You can access all official OHCS documents on our [Publications page](/publications):\n\n**Available Documents:**\n📄 Performance Agreement Templates\n📋 Civil Service Code of Conduct\n📊 Annual Performance Reports\n📝 Training Report Templates\n📜 RTI Manuals\n🏆 Awards Nomination Forms\n\nAll documents are **free to download**.\n\nFor a more comprehensive document library with AI-powered search, visit the **[OHCS E-Library](https://ohcselibrary.xyz)**.\n\nIs there a specific document you're looking for?`;
  }

  if (lower.includes('track') || lower.includes('reference') || lower.includes('status') || lower.includes('submission')) {
    return `To track the status of your submission:\n\n1. Visit our [Track Submission page](/track)\n2. Enter your **reference number** (format: OHCS-XXX-XXXXXXXX-XXXX)\n3. Enter the **email or phone** you used when submitting\n4. View your current status and timeline\n\nIf you've lost your reference number, please contact us:\n📞 +233 (0)30 266 5421\n📧 info@ohcs.gov.gh\n\nWould you like help with anything else?`;
  }

  if (lower.includes('thank') || lower.includes('thanks') || lower.includes('appreciate')) {
    return `You're very welcome! 😊 It's my pleasure to help.\n\nRemember, I'm available here **24/7** whenever you need information about Ghana's Civil Service.\n\nHave a wonderful day, and don't hesitate to come back if you need anything! 🇬🇭`;
  }

  if (lower.includes('bye') || lower.includes('goodbye') || lower.includes('see you')) {
    return `Thank you for visiting! Take care, and have a blessed day. 🇬🇭\n\nRemember, the Office of the Head of the Civil Service is always here to serve you. Come back anytime you need help!\n\n*Loyalty • Excellence • Service*`;
  }

  return `Thank you for your question! I want to make sure I give you the most accurate information.\n\nHere are some areas I can help you with:\n\n• **About OHCS** — our mission, structure, and leadership\n• **Recruitment** — how to join the Civil Service\n• **RTI Requests** — your right to information\n• **Complaints & Feedback** — report issues or share feedback\n• **Publications** — download official documents\n• **Track Submissions** — check your application status\n• **Office Hours & Contact** — how to reach us\n\nCould you please rephrase your question, or select one of the topics above? I'm here to help! 😊`;
}

// Hide public header/footer
function useHideChrome() {
  useEffect(() => {
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');
    if (header) header.style.display = 'none';
    if (footer) footer.style.display = 'none';
    return () => {
      if (header) header.style.display = '';
      if (footer) footer.style.display = '';
    };
  }, []);
}

export default function AssistantPage() {
  useHideChrome();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `${getGreeting()}! 😊 Welcome to the Office of the Head of the Civil Service.\n\nI'm your dedicated assistant for all things related to Ghana's Civil Service. Whether you need information about recruitment, want to submit an RTI request, or simply have a question — I'm here to help.\n\nPlease, what can I assist you with today?`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const msg = text ?? input.trim();
    if (!msg || isTyping) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: msg,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));

    const botMsg: Message = {
      id: `bot-${Date.now()}`,
      role: 'assistant',
      content: getBotResponse(msg),
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

  function renderContent(text: string) {
    return text.split('\n').map((line, i) => (
      <span key={i}>
        {line.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} className="font-bold">{part.slice(2, -2)}</strong>;
          }
          const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
          if (linkMatch && linkMatch[2]) {
            return <Link key={j} href={linkMatch[2] as string} className="text-primary underline hover:no-underline">{linkMatch[1]}</Link>;
          }
          return <span key={j}>{part}</span>;
        })}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    ));
  }

  return (
    <div className="fixed inset-0 z-50 flex bg-surface">
      {/* ── Left Panel — Branding ── */}
      <div className="hidden lg:flex lg:w-[38%] bg-primary-dark flex-col relative overflow-hidden">
        {/* Kente mesh */}
        <div aria-hidden="true" className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 40px)' }} />
        <div aria-hidden="true" className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 40%, rgba(46,125,50,0.2) 0%, transparent 60%)' }} />

        {/* Animated threads */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[25%] left-0 right-0 h-px opacity-[0.1]" style={{ background: 'linear-gradient(90deg, transparent, #D4A017 30%, #D4A017 70%, transparent)', animation: 'kente-thread-h 8s ease-in-out infinite' }} />
          <div className="absolute top-[60%] left-0 right-0 h-px opacity-[0.07]" style={{ background: 'linear-gradient(90deg, transparent, #E8C547 20%, #E8C547 80%, transparent)', animation: 'kente-thread-h 12s ease-in-out 3s infinite reverse' }} />
          <div className="absolute left-[70%] top-0 bottom-0 w-px opacity-[0.06]" style={{ background: 'linear-gradient(0deg, transparent, #2E7D32 30%, #2E7D32 70%, transparent)', animation: 'kente-thread-v 10s ease-in-out 1s infinite' }} />
        </div>

        {/* Content */}
        <div className="relative flex-1 flex flex-col justify-between p-10">
          {/* Top: Back + Logo */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm mb-10 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to website
            </Link>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center shadow-xl">
                <Bot className="h-7 w-7 text-primary-dark" />
              </div>
              <div>
                <h1 className="text-white font-display text-2xl font-bold">Ask Ghana<br/>Civil Service</h1>
              </div>
            </div>
            <p className="text-white/45 text-base leading-relaxed mb-10">
              Your 24/7 digital assistant for everything about Ghana&apos;s Civil Service. Ask questions, get guidance, and access services — all in one place.
            </p>

            {/* Feature badges */}
            <div className="space-y-3">
              {[
                { icon: MessageCircle, text: 'Natural conversation — ask anything' },
                { icon: Building2, text: 'Full knowledge of OHCS structure & services' },
                { icon: FileText, text: 'Guides you through submissions & processes' },
                { icon: HelpCircle, text: 'Available 24/7, even when the office is closed' },
              ].map((f) => (
                <div key={f.text} className="flex items-center gap-3 text-white/40">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
                    <f.icon className="h-4 w-4 text-accent" />
                  </div>
                  <span className="text-sm">{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom: Kente + branding */}
          <div>
            <div className="h-[3px] rounded-full overflow-hidden mb-4" style={{ background: 'linear-gradient(90deg, #1B5E20 25%, #D4A017 25%, #D4A017 50%, #B71C1C 50%, #B71C1C 75%, #212121 75%)' }}>
              <div className="h-full" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 45%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.3) 55%, transparent 100%)', backgroundSize: '200% 100%', animation: 'kente-shimmer 4s ease-in-out infinite' }} />
            </div>
            <div className="flex items-center gap-3">
              <Image src="/images/ohcs-crest.png" alt="" width={24} height={24} className="object-contain opacity-40" style={{ width: 24, height: 24 }} />
              <span className="text-[10px] text-white/25 tracking-wider uppercase">Powered by OHCS &bull; Cloudflare Workers AI</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel — Chat ── */}
      <div className="flex-1 flex flex-col" style={{ backgroundColor: '#FDFAF5' }}>
        {/* Mobile header */}
        <div className="lg:hidden bg-primary-dark px-5 py-4 flex items-center gap-3">
          <Link href="/" className="text-white/40 hover:text-white"><ArrowLeft className="h-5 w-5" /></Link>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary-dark" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm">Ask Ghana Civil Service</h1>
            <p className="text-white/40 text-[10px]">Online — ready to help</p>
          </div>
        </div>

        {/* Suggested Questions — only show if 1 message (welcome only) */}
        {messages.length === 1 && (
          <div className="px-6 pt-6 pb-2">
            <p className="text-xs text-text-muted/50 uppercase tracking-wider font-semibold mb-3">Suggested Questions</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="px-4 py-2 rounded-full border-2 border-border/40 text-sm text-text-muted hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {messages.map((msg) => (
            <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn('flex items-start gap-3 max-w-[80%]', msg.role === 'user' && 'flex-row-reverse')}>
                {msg.role === 'assistant' && (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center shrink-0 shadow-sm mt-1">
                    <Bot className="h-4 w-4 text-primary-dark" />
                  </div>
                )}
                <div className={cn(
                  'rounded-2xl px-5 py-4 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-primary text-white rounded-br-md'
                    : 'bg-white border border-border/30 text-primary-dark rounded-bl-md shadow-sm',
                )}>
                  <div className="whitespace-pre-wrap">{renderContent(msg.content)}</div>
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="h-4 w-4 text-primary-dark" />
              </div>
              <div className="bg-white border border-border/30 rounded-2xl rounded-bl-md px-5 py-4 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-kente-red animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border/30 p-5 bg-white">
          <div className="flex gap-3 max-w-3xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question here..."
              className="flex-1 px-5 py-4 rounded-xl border-2 border-border/50 bg-surface text-base focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className={cn(
                'w-13 h-13 rounded-xl flex items-center justify-center transition-all shrink-0',
                input.trim() && !isTyping
                  ? 'bg-primary text-white hover:bg-primary-light shadow-sm'
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed',
              )}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
