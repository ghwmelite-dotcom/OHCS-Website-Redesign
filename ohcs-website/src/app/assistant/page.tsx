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
  const lower = message.toLowerCase().trim();

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. PERSONAL INTERACTIONS — name recognition, identity, greetings
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Name introductions — "hi im osborn", "my name is ama", "i am kwame" ──
  const nameMatch = lower.match(/(?:i'?m|my name is|i am|this is|call me)\s+([a-z]+)/i);
  if (nameMatch?.[1]) {
    const name = nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1);
    return `Lovely to meet you, ${name}! 😊 Welcome to the Office of the Head of the Civil Service.\n\nI'm **Lexi** — your dedicated assistant for all things Ghana Civil Service. How can I help you today, ${name}?`;
  }

  // ── Bot's identity — "what's your name", "who are you", "what are you" ──
  if (lower.match(/your name|who are you|what are you|what is your name|what's your name|whats your name|introduce yourself/)) {
    return `I'm **Lexi** — which stands for **OHCS Live Engagement & eXpert Intelligence**! 😊\n\nI'm the AI assistant for the Office of the Head of the Civil Service. I was created to help citizens and civil servants access information about Ghana's Civil Service quickly and easily. Think of me as your friendly digital colleague who never sleeps!\n\nI can help with recruitment, RTI requests, organisational structure, complaints, tracking submissions, and much more.\n\nWhat would you like to know?`;
  }

  // ── How are you / casual conversation ──
  if (lower.match(/how are you|how do you do|how's it going|how you dey|how be/)) {
    return `I'm doing great, thank you for asking! 😊 I'm always ready and happy to help.\n\nHow about you — is there something I can assist you with today regarding the Civil Service?`;
  }

  if (lower.match(/what can you do|what do you do|how can you help|what are your capabilities|help me/)) {
    return `I'm glad you asked! Here's what I can do for you:\n\n🏛️ **About OHCS** — explain our mission, structure, directorates, and leadership\n👥 **Recruitment** — guide you through the Civil Service entrance process\n📋 **Right to Information** — help you understand and submit RTI requests\n📝 **Complaints & Feedback** — guide you through filing processes\n📄 **Publications** — help you find official documents and forms\n🔍 **Track Submissions** — explain how to check your application status\n📞 **Contact & Office Hours** — provide our contact details\n🇬🇭 **General Knowledge** — answer questions about Ghana's Civil Service\n⚖️ **Legal Framework** — Civil Service Act, 1992 Constitution provisions\n💼 **Career Progression** — grading, promotions, transfers\n📚 **Training & Development** — study leave, scholarships, in-service training\n🏢 **Conditions of Service** — leave, pension, working hours, retirement\n📏 **Code of Conduct** — ethics, political neutrality, prohibited activities\n\nJust ask me anything in plain language — I'll do my best to help! 😊`;
  }

  // ── Pure greetings (only if the message is JUST a greeting, not "hi im john") ──
  if (lower.match(/^(hello|hi|hey|greetings|good morning|good afternoon|good evening|yo|hiya)[\s!.?]*$/)) {
    return `${getGreeting()}! 😊 Welcome! I'm **Lexi**, your assistant for the Ghana Civil Service.\n\nHow can I help you today?`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. LEGAL FRAMEWORK — Constitution, Civil Service Act, key legislation
  // ═══════════════════════════════════════════════════════════════════════════

  if (lower.match(/civil service act|pndcl 327|pndcl327|service act|act 327|law.*civil service|legislation.*civil/)) {
    return `The legal foundation of Ghana's Civil Service is the **Civil Service Act, 1993 (PNDCL 327)**. Here's what it covers:\n\n⚖️ **Key Provisions:**\n• **Establishment** of the Civil Service as a distinct arm of the Public Service\n• **Appointment** — Sets out how civil servants are recruited and appointed\n• **Promotion** — Criteria and procedures for career advancement\n• **Discipline** — Framework for handling misconduct and breaches of conduct\n• **Conditions of Service** — Rights and entitlements of civil servants\n• **Head of the Civil Service** — Appointed by the President on the advice of the Public Services Commission\n\n📌 **Important Notes:**\n• PNDCL 327 works alongside the **1992 Constitution** (Articles 190-195)\n• It defines the Civil Service as comprising persons employed in a civil capacity at OHCS and MDAs\n• The Act gives the Head of the Civil Service oversight of the entire service\n\nThe Act has been the governing framework for over 30 years and remains the primary legislation for Ghana's Civil Service.\n\nWould you like to know about specific provisions, or how the Constitution relates to the Civil Service?`;
  }

  if (lower.match(/constitution|article 19[0-5]|1992 constitution|constitutional.*provision|public services commission/)) {
    return `The **1992 Constitution of Ghana** provides the supreme legal framework for the Civil Service under **Chapter 14 — The Public Services**.\n\n📜 **Key Constitutional Articles:**\n\n• **Article 190** — Lists the Civil Service as one of Ghana's public services, alongside the Judicial Service, Health Service, Education Service, and others\n• **Article 191** — Establishes the **Public Services Commission (PSC)** as a constitutional body to advise the President on public service matters\n• **Article 192** — Provides for the appointment of the Chairman and members of the PSC\n• **Article 193** — Outlines the functions of the PSC, including advising on conditions of service, recruitment, and promotions\n• **Article 194** — Protects public officers from unfair dismissal — no officer can be removed without due process\n• **Article 195** — Ensures that public service appointments are based on **merit and competence**, not political affiliation\n\n🏛️ **Why This Matters:**\nThe Constitution guarantees the independence and professionalism of the Civil Service. It ensures political neutrality and protects civil servants from arbitrary treatment.\n\nWould you like to know more about a specific article or the Public Services Commission?`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. CONDITIONS OF SERVICE — leave, hours, retirement, pension
  // ═══════════════════════════════════════════════════════════════════════════

  if (lower.match(/leave|annual leave|sick leave|maternity|paternity|compassionate|study leave.*entitle|leave entitle/)) {
    return `Here's a comprehensive overview of **leave entitlements** for Ghana's civil servants:\n\n🗓️ **Annual Leave:**\n• Varies by grade — typically **15 to 30 working days** per year\n• Junior staff: 15 days | Senior staff: 21-25 days | Directors and above: 30 days\n• Must be taken within the leave year; limited carry-over allowed\n\n🏥 **Sick Leave:**\n• Up to **12 months on full pay** with a valid medical certificate\n• Extended sick leave may be granted on reduced pay in exceptional cases\n• Requires certification by a government medical officer for extended periods\n\n🤱 **Maternity Leave:**\n• **12 weeks** with full pay (can be extended on medical advice)\n• Nursing mothers entitled to 1 hour off daily for up to 1 year\n\n📚 **Study Leave:**\n• **With pay** — for service-sponsored courses; requires a bond of 3-5 years\n• **Without pay** — for self-sponsored courses; position held open\n• Must be for courses relevant to the Civil Service\n\n💐 **Compassionate Leave:**\n• Granted for bereavement, family emergencies\n• Typically 5-10 working days depending on circumstances\n\n🗳️ **Special Leave:**\n• For national service, jury duty, or union activities\n\nWould you like details about any specific type of leave, or how to apply for study leave?`;
  }

  if (lower.match(/working hours|work hours|office hours|when.*open|opening hours|what time|8.*5|eight.*five|40.*hour/)) {
    return `**OHCS Office Hours:**\n🕐 Monday – Friday: **8:00 AM – 5:00 PM**\n\n⏰ **Standard Working Week:**\n• **40 hours** per week across 5 working days\n• Lunch break: 12:00 PM – 1:00 PM (1 hour)\n• Effective working hours: 8 hours per day\n\n📌 **Important Notes:**\n• Civil servants are expected to be at their posts during working hours\n• Late arrival and early departure are recorded and may affect appraisals\n• Some MDAs may have shift arrangements for essential services\n\n**Location:**\n📍 Office of the Head of the Civil Service\nP.O. Box M.49, Accra, Ghana\n\n**Contact:**\n📞 +233 (0)30 266 5421\n📧 info@ohcs.gov.gh\n\nWe are closed on weekends and public holidays. However, I'm available **24/7** right here to help you with information! 😊\n\nWhat else can I help you with?`;
  }

  if (lower.match(/retire|retirement|pension|ssnit|superannuation|end of service|compulsory age|voluntary retirement/)) {
    return `Here's everything you need to know about **retirement and pension** in Ghana's Civil Service:\n\n🎂 **Retirement Age:**\n• **Compulsory retirement:** Age **60 years**\n• **Voluntary retirement:** After **20 years of service** or at age **45**\n• Extension of service beyond 60 may be granted in exceptional cases by the President\n\n💰 **Pension Scheme — 3-Tier System:**\nUnder the **National Pensions Act, 2008 (Act 766)**, Ghana operates a contributory pension scheme:\n\n**Tier 1 — Mandatory Basic (SSNIT):**\n• Managed by the Social Security & National Insurance Trust\n• Employee contributes **5.5%** of basic salary\n• Employer contributes **13%** of basic salary\n• Provides monthly pension upon retirement\n\n**Tier 2 — Mandatory Occupational Scheme:**\n• Managed by approved private pension fund managers\n• **5%** of basic salary (from employer's 13%)\n• Paid as a lump sum upon retirement\n\n**Tier 3 — Voluntary Provident Fund:**\n• Optional additional savings\n• Tax incentives for contributors\n• Managed by private fund managers of your choice\n\n📋 **End-of-Service Benefits:**\n• Accrued leave compensation\n• Service gratuity (where applicable)\n• Certificate of Service\n\nFor specific pension queries, you can also contact SSNIT directly or your MDA's accounts unit.\n\nWould you like to know more about how pension is calculated or how to plan for retirement?`;
  }

  if (lower.match(/salary|pay|compensation|remuneration|allowance|salary scale|single spine|ssss|fair wage/)) {
    return `Here's an overview of the **salary and compensation** framework for Ghana's Civil Service:\n\n💰 **Salary Structure:**\n• Ghana's public sector uses the **Single Spine Salary Structure (SSSS)**, implemented by the Fair Wages and Salaries Commission (FWSC)\n• The SSSS provides a unified pay structure across all public services\n• Salary is determined by your grade level, step, and qualifications\n\n📊 **Key Components of Pay:**\n• **Base pay** — Determined by the Single Spine Pay Point\n• **Market premium** — Additional percentage for certain professional categories\n• **Allowances** — May include housing, transport, and responsibility allowances depending on grade and posting\n\n📌 **Important Notes:**\n• Salary negotiations are conducted between **CLOGSAG** (the civil servants' association) and the government through the FWSC\n• Annual salary reviews are based on economic conditions and collective bargaining\n• Salary is paid monthly through the Controller & Accountant General's Department\n\n**If you're experiencing salary delays**, contact your MDA's accounts unit or the F&A Directorate at OHCS.\n\nWould you like to know about specific allowances, or how the grading system works?`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. CAREER PROGRESSION — grades, promotions, transfers
  // ═══════════════════════════════════════════════════════════════════════════

  if (lower.match(/grad(e|ing)|rank|level|career.*structure|hierarchy|administrative officer|principal.*officer|director grade/)) {
    return `The Ghana Civil Service uses a structured **grading system** for career progression:\n\n📊 **Grade Structure (from entry to apex):**\n\n1. **Administrative Officer (AO)** — Graduate entry level\n2. **Senior Administrative Officer (SAO)** — First promotion level\n3. **Principal Administrative Officer (PAO)** — Mid-career level\n4. **Assistant Director I & II** — Senior management entry\n5. **Deputy Director** — Senior management\n6. **Director** — Heads directorates in MDAs\n7. **Chief Director** — Apex grade; heads administration of an MDA\n\n📌 **Key Details:**\n• Minimum of **3-4 years** at each grade before promotion eligibility\n• Some technical/professional streams have equivalent but different grade titles\n• Each grade has multiple **steps** (salary increments within the grade)\n• Progression depends on performance, merit, seniority, and available vacancies\n\n🎯 **The Chief Director** is the highest career civil servant in an MDA, responsible for day-to-day administration and advising the Minister/CEO on policy implementation.\n\nWould you like to know more about the promotion process, or what's required to move from one grade to the next?`;
  }

  if (lower.match(/promot|advancement|move up|career.*progress|promotion.*process|how.*promoted|get promoted/)) {
    return `Here's how **promotions** work in Ghana's Civil Service:\n\n📋 **Promotion Criteria:**\n• **Merit** — Demonstrated competence and performance\n• **Seniority** — Minimum years of service at current grade (typically 3-4 years)\n• **Vacancy** — An available position at the next grade\n• **Satisfactory Performance Appraisals** — Consistent positive ratings over the qualifying period\n• **Good conduct** — No pending disciplinary cases\n\n🔄 **The Promotion Process:**\n1. **Eligibility screening** — CMD identifies officers who meet minimum requirements\n2. **Performance review** — Appraisal records are examined\n3. **Interview** — Candidates appear before the appropriate Promotion Committee\n4. **Recommendation** — Committee makes recommendations\n5. **Approval** — Approved by the Head of the Civil Service (for senior grades) or authorised officers\n6. **Notification** — Successful officers receive promotion letters\n\n📌 **Important Notes:**\n• Promotions are **not automatic** — meeting the minimum years is necessary but not sufficient\n• The **Career Management Directorate (CMD)** coordinates the promotion process\n• Officers can request their promotion status through their HR unit\n• Promotion interviews assess knowledge, leadership, and contribution to the service\n\nWould you like to know about the transfer process, or details about a specific grade?`;
  }

  if (lower.match(/transfer|posting|relocation|move.*ministry|inter.*ministerial|career.*management|cmd/)) {
    return `**Transfers and postings** are managed by the **Career Management Directorate (CMD)** at OHCS:\n\n🔄 **Types of Transfers:**\n• **Inter-ministerial** — Between different Ministries, Departments, and Agencies (MDAs)\n• **Inter-regional** — Between regions (e.g., Accra to Kumasi)\n• **Intra-organisational** — Within the same MDA but different divisions\n\n📋 **How Transfers Work:**\n• Based on **service needs** — filling vacancies where officers are needed most\n• Considers **officer's career development** — exposure to different functions\n• **Succession planning** — ensuring continuity in critical roles\n• Officers can request transfers, but approval depends on service needs\n\n📌 **CMD's Role:**\n• Manages the **promotion, transfer, and posting** process\n• Maintains **career records** for all civil servants\n• Provides **career counselling** to officers\n• Handles **succession planning** for senior positions\n• Coordinates with MDAs on staffing needs\n\n⚠️ **Important:** Transfer decisions are made in the interest of the service. While personal circumstances are considered, operational needs take priority.\n\nWould you like to know more about CMD, or how to request a transfer?`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. DISCIPLINARY PROCEDURES
  // ═══════════════════════════════════════════════════════════════════════════

  if (lower.match(/disciplin|misconduct|offense|offence|dismiss|suspend|warning|reprimand|fired|sack/)) {
    return `Here's how **disciplinary procedures** work in Ghana's Civil Service:\n\n⚠️ **Minor Offences:**\n• Late arrival / absenteeism\n• Negligence of duties\n• Insubordination (minor)\n\n**Sanctions for minor offences:**\n• Verbal or written **warning**\n• Official **reprimand** (placed on record)\n• **Deferment of salary increment**\n\n🚨 **Major Offences:**\n• Corruption, bribery, or fraud\n• Gross insubordination\n• Misuse or theft of public property\n• Conviction for a criminal offence\n• Unauthorised absence for extended periods\n\n**Sanctions for major offences:**\n• **Suspension** (with or without pay, pending investigation)\n• **Reduction in rank** / demotion\n• **Dismissal** from the Civil Service\n\n⚖️ **Due Process Guarantees:**\n• The officer **must be informed** of the charges in writing\n• The officer **must be given the opportunity to defend** themselves\n• Cases are heard by a **Disciplinary Committee**\n• Decisions must be documented and communicated formally\n\n🔁 **Right of Appeal:**\n• Officers can appeal disciplinary decisions to the **Public Services Commission (PSC)**\n• The PSC reviews whether due process was followed\n• Appeals must be filed within the specified timeframe\n\nIf you're facing a disciplinary matter and need guidance, please contact OHCS directly.\n\nWould you like to know more about the appeals process or the role of the PSC?`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. KEY INSTITUTIONS — PSC, CLOGSAG, OHCS relationships
  // ═══════════════════════════════════════════════════════════════════════════

  if (lower.match(/public services commission|psc(?!\w)|commission.*public|constitutional.*body.*civil/)) {
    return `The **Public Services Commission (PSC)** is a key constitutional body for Ghana's Civil Service:\n\n🏛️ **Establishment:**\n• Created under **Article 191** of the 1992 Constitution\n• Independent body — not under the control of any ministry\n\n📋 **Functions of the PSC:**\n• **Advises the President** on appointments, promotions, and discipline in the public services\n• **Oversight** — Ensures fairness and due process in public service management\n• **Appeals body** — Hears appeals from officers on disciplinary and other matters\n• **Policy advice** — Recommends conditions of service and HR policies\n• **Monitoring** — Ensures compliance with public service regulations\n\n🔄 **OHCS vs PSC — What's the Difference?**\n• **OHCS** handles **day-to-day administration** — recruitment exercises, training, career management, performance management\n• **PSC** provides **constitutional oversight and advisory functions** — ensuring the service operates fairly and within the law\n• Think of OHCS as the **executive arm** and PSC as the **oversight arm**\n\n📌 The PSC's independence is constitutionally protected, ensuring that civil service management remains professional and non-partisan.\n\nWould you like to know about CLOGSAG or other institutions related to the Civil Service?`;
  }

  if (lower.match(/clogsag|union|association|staff association|civil.*local.*government.*staff|collective.*bargain/)) {
    return `**CLOGSAG** — the **Civil and Local Government Staff Association of Ghana** — is the main professional association for civil servants:\n\n👥 **What is CLOGSAG?**\n• The principal **union/association** representing civil servants and local government workers\n• Represents members' interests in negotiations with the government\n• One of the largest public sector unions in Ghana\n\n📋 **Key Functions:**\n• **Collective bargaining** — Negotiates conditions of service, salary adjustments, and benefits with the government and Fair Wages and Salaries Commission\n• **Welfare** — Supports members facing work-related challenges\n• **Advocacy** — Lobbies for improved working conditions and professional development\n• **Dispute resolution** — Mediates between members and management\n• **Training** — Organises capacity-building programmes for members\n\n📌 **Membership:**\n• Open to all civil servants and local government workers\n• Membership is voluntary but widely subscribed\n• Dues are deducted at source from salary\n\n🤝 **Relationship with OHCS:**\n• CLOGSAG works with OHCS on matters affecting civil servants\n• Joint committees address policy issues, working conditions, and welfare\n• While CLOGSAG advocates for workers, OHCS manages the service — the relationship is collaborative\n\nWould you like to know more about conditions of service or how to contact CLOGSAG?`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. TRAINING & DEVELOPMENT — study leave, scholarships, CSTC
  // ═══════════════════════════════════════════════════════════════════════════

  if (lower.match(/study leave|bond|further studies|sponsored.*study|self.*sponsored|study.*abroad/)) {
    return `**Study leave** is an important benefit for career development in the Civil Service:\n\n📚 **Types of Study Leave:**\n\n**1. Study Leave WITH Pay (Service-Sponsored):**\n• For courses **directly relevant** to the Civil Service\n• Officer continues to receive full salary\n• Requires approval from the Head of the Civil Service\n• A **bond of 3-5 years** must be signed — you must return and serve for that period after completing studies\n• Failure to honour the bond requires repayment of all costs\n\n**2. Study Leave WITHOUT Pay (Self-Sponsored):**\n• For courses the officer wishes to pursue independently\n• No salary during the study period\n• Your position is **held open** for your return\n• Still requires approval to ensure continuity of service\n\n📋 **Application Process:**\n1. Submit a study leave application through your MDA\n2. Provide admission letter from a recognised institution\n3. Demonstrate relevance to your role or the Civil Service\n4. Application reviewed by RTDD and approved by appropriate authority\n5. Sign bond agreement (if with pay)\n\n📌 **Important Notes:**\n• Minimum of **3 years of service** before eligibility for study leave with pay\n• Priority given to programmes aligned with the service's strategic needs\n• The **RTDD** coordinates study leave administration\n\nWould you like to know about scholarships or specific training programmes?`;
  }

  if (lower.match(/scholarship|bursary|postgraduate.*funding|civil service scholarship|rtdd.*scholar/)) {
    return `The Ghana Civil Service offers scholarship opportunities for career development:\n\n🎓 **Civil Service Scholarship Programme:**\n• Available for **postgraduate studies** (Master's and PhD)\n• Administered by the **Recruitment, Training & Development Directorate (RTDD)**\n• Covers tuition fees and may include maintenance allowances\n• Priority given to courses aligned with the service's strategic priorities\n\n📋 **Eligibility:**\n• Must be a **confirmed civil servant** (completed probation)\n• Minimum of **3 years of service**\n• Satisfactory performance appraisals\n• Admission to a recognised institution (local or international)\n• Course must be relevant to the Civil Service\n\n🔄 **Process:**\n1. Scholarship opportunities are announced through RTDD and MDAs\n2. Applications submitted with supporting documents\n3. Selection by committee based on merit and service needs\n4. Successful candidates sign a **bond** to return and serve\n\n📌 **Other Scholarship Sources:**\n• Government of Ghana Scholarships (through the Scholarship Secretariat)\n• International partner scholarships (Commonwealth, Chevening, DAAD, etc.)\n• OHCS coordinates with the Scholarship Secretariat for civil servant applications\n\nWould you like to know more about in-service training or the CSTC?`;
  }

  if (lower.match(/training|learn|course|capacity|development|gimpa|cstc|in.?service|civil service training/)) {
    return `OHCS oversees civil servant training through **3 Training Institutions** and multiple partnerships:\n\n1. 🎓 **Civil Service Training Centre (CSTC)** — Accra\n   • Core public administration and management courses\n   • Leadership development programmes\n   • Professional skills (administrative writing, records management, IT)\n   • Induction training for new recruits\n\n2. 🏛️ **GIMPA Collaboration Programme** — Accra\n   • Executive education and postgraduate programmes\n   • Senior management development\n   • Specialised policy and governance courses\n\n3. 📚 **Regional Training Institute** — Kumasi\n   • Regional capacity building\n   • Decentralised training for officers outside Accra\n\n📋 **In-Service Training:**\n• Regular capacity-building programmes throughout the year\n• Covers topics like performance management, ICT, leadership, ethics\n• **RTDD** coordinates the annual training calendar\n• MDAs can request bespoke training for their staff\n\n📌 **Mandatory Training:**\n• **Induction training** — All new recruits must complete this, covering code of conduct, administrative writing, records management, and performance management\n• **Pre-promotion training** — Required before advancing to certain grades\n\nThe **Recruitment, Training & Development Directorate (RTDD)** coordinates all training programmes.\n\nWould you like to know about study leave, scholarships, or specific training opportunities?`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. RECRUITMENT DETAILS — entry requirements, exams, probation, induction
  // ═══════════════════════════════════════════════════════════════════════════

  if (lower.match(/entry requirement|qualification|who can apply|eligible|age limit|minimum.*degree|requirement.*join/)) {
    return `Here are the **entry requirements** for joining Ghana's Civil Service:\n\n🎓 **Academic Qualifications:**\n• Minimum of a **first degree** (Bachelor's) from a recognised university\n• Some positions require specific professional qualifications\n• Postgraduate qualifications are an advantage but not always required\n\n🇬🇭 **Citizenship:**\n• Must be a **Ghanaian citizen**\n\n🎂 **Age Requirement:**\n• Typically **18-35 years** for graduate entry\n• Some professional/specialist positions may have different age limits\n\n📋 **Other Requirements:**\n• Good character and no criminal record\n• Medically fit for duty\n• National Service completion (where applicable)\n• Willingness to be posted anywhere in Ghana\n\n📝 **The Examination:**\n• Shortlisted candidates sit the **Civil Service Graduate Entrance Examination**\n• Papers include: **General Paper, English Language**, and **subject-specific papers**\n• Pass mark varies by exercise and the number of vacancies\n• Examination is competitive — only the best candidates are selected\n\n⚠️ **Remember:** OHCS **never charges fees** for applications or examinations. Report any requests for payment to OHCS.\n\nWould you like to know about the probation period or what happens after you're appointed?`;
  }

  if (lower.match(/probat|confirm|new.*entrant|newly.*appoint|first.*year|provisional.*appoint/)) {
    return `All new entrants to Ghana's Civil Service undergo a **probationary period**:\n\n⏱️ **Duration:**\n• **2 years** from the date of appointment\n• During this period, the officer is on provisional appointment\n\n📋 **What Happens During Probation:**\n• Performance is closely monitored by supervisors\n• Regular feedback and assessment\n• The officer must demonstrate competence, reliability, and commitment\n• Must complete **mandatory induction training**\n\n✅ **Confirmation:**\n• After satisfactory completion of 2 years, the officer is **confirmed** in the Civil Service\n• Confirmation is based on positive performance appraisals and good conduct\n• A confirmation letter is issued\n\n❌ **Non-Confirmation:**\n• If performance is unsatisfactory, the probationary period may be extended\n• In serious cases, the appointment may be terminated\n\n📌 **Induction Training Covers:**\n• Code of Conduct and ethics\n• Administrative writing and correspondence\n• Records management\n• Performance management system\n• OHCS structure and processes\n• Public service values\n\nWould you like to know more about how the recruitment examination works?`;
  }

  if (lower.match(/apply|recruitment|join.*civil|job|exam|entrance|how.*join|next.*recruit/)) {
    return `Thank you for your interest in joining Ghana's Civil Service! Here's what you need to know:\n\n**How Recruitment Works:**\n1. OHCS announces recruitment exercises through official channels (ohcs.gov.gh, our social media)\n2. Applications are submitted through this portal during the open window\n3. Shortlisted candidates sit the **Civil Service Graduate Entrance Examination**\n4. Successful candidates are appointed and posted\n\n📝 **The Examination:**\n• Written exam covering **General Paper, English Language**, and subject-specific papers\n• Competitive process — pass mark varies by exercise\n• Results are published through official channels only\n\n📋 **After Appointment:**\n• New entrants serve a **2-year probationary period**\n• Mandatory **induction training** covering code of conduct, administrative writing, records management\n• Posted to an MDA based on service needs and your qualifications\n\n**Important:**\n⚠️ OHCS **never charges fees** for applications\n⚠️ Only trust announcements from **ohcs.gov.gh**\n⚠️ No individual is authorised to collect payments on our behalf\n\nYou can subscribe for notifications on our [Recruitment page](/services/recruitment) to be the first to know when the next exercise opens.\n\nIs there anything else about the recruitment process you'd like to know?`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. SPECIFIC DIRECTORATES — RSIMD, F&A, PBMED, CMD, RTDD
  // ═══════════════════════════════════════════════════════════════════════════

  if (lower.match(/rsimd|research.*statistic|information management|hrmis|workforce.*data|statistical.*report/)) {
    return `The **Research, Statistics & Information Management Directorate (RSIMD)** is a key line directorate at OHCS:\n\n📊 **Core Functions:**\n• **Workforce data collection** — Gathers and maintains data on all civil servants\n• **Statistical reports** — Produces regular reports on the size, composition, and distribution of the Civil Service\n• **HRMIS Management** — Manages the Human Resource Management Information System database\n• **Research** — Conducts studies to inform policy and management decisions\n• **Data analysis** — Provides evidence-based insights for planning and reform\n\n💻 **HRMIS:**\n• The centralised digital database for civil service personnel records\n• Contains data on appointments, promotions, qualifications, postings, and demographics\n• Used for workforce planning and decision-making\n\n📌 **Key Outputs:**\n• Annual workforce statistics\n• Staffing situation reports\n• Demographic analysis of the Civil Service\n• Data for policy briefs and reform initiatives\n\n**Need to verify a civil servant?** Contact RSIMD or the relevant MDA's HR unit.\n\nWould you like to learn about another directorate?`;
  }

  if (lower.match(/f&a|f ?& ?a|finance.*admin|budget.*preparation|procurement|asset.*manage|accounts.*directorate/)) {
    return `The **Finance & Administration Directorate (F&A)** manages OHCS's financial and administrative operations:\n\n💰 **Core Functions:**\n• **Budget preparation** — Develops and manages OHCS's annual budget\n• **Financial management** — Oversees expenditure, revenue, and financial reporting\n• **Procurement** — Manages the acquisition of goods and services in line with the Public Procurement Act\n• **Asset management** — Tracks and maintains OHCS property and equipment\n• **Accounts** — Processes payments, salaries, and financial transactions\n• **Administrative support** — Manages the day-to-day office operations\n\n📋 **Key Responsibilities:**\n• Ensuring compliance with the **Public Financial Management Act**\n• Preparing financial statements and audit responses\n• Managing stores, transport, and office facilities\n• Coordinating with the Controller & Accountant General's Department\n\n📌 **Salary-related queries?** If you're experiencing salary delays or have questions about your pay, contact your MDA's accounts unit first, then the F&A Directorate at OHCS if the issue is not resolved.\n\nWould you like to know about another directorate?`;
  }

  if (lower.match(/pbmed|planning.*budget|monitoring.*evaluation|strategic.*plan|m&e|annual.*performance.*report|apr|policy.*coord/)) {
    return `The **Planning, Budgeting, Monitoring & Evaluation Directorate (PBMED)** drives strategic planning at OHCS:\n\n📋 **Core Functions:**\n• **Strategic planning** — Develops OHCS's medium-term and annual work plans\n• **M&E framework** — Designs and implements the monitoring and evaluation system for the Civil Service\n• **Policy coordination** — Coordinates policy development and reform initiatives\n• **Annual Performance Report (APR)** — Prepares the annual report on OHCS performance and Civil Service outcomes\n• **Budget alignment** — Ensures activities are linked to budgets and national priorities\n\n📊 **Key Outputs:**\n• Medium-Term Development Plan\n• Annual Work Plans and budgets\n• Quarterly and annual performance reports\n• Policy briefs and reform proposals\n• M&E dashboards and indicators\n\n📌 **Why PBMED Matters:**\nPBMED ensures that OHCS and the wider Civil Service are not just busy, but **effective** — measuring results, tracking progress, and ensuring accountability.\n\nWould you like to know about another directorate, or about performance management in the Civil Service?`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. COMMON CITIZEN QUERIES — appointment letters, verification, fraud
  // ═══════════════════════════════════════════════════════════════════════════

  if (lower.match(/appointment letter|where.*my letter|collect.*letter|posted.*where|when.*letter/)) {
    return `If you're looking for your **appointment or posting letter**, here's what to do:\n\n📄 **For New Appointees:**\n• Your appointment letter is typically issued by OHCS after the recruitment exercise\n• Contact the **Career Management Directorate (CMD)** at OHCS for your letter\n• Alternatively, check with the **HR unit of the MDA** where you've been posted\n\n📋 **Information You'll Need:**\n• Your full name as used during application\n• Recruitment exercise reference number (if available)\n• Your contact details registered during the process\n\n📞 **Contact:**\n• OHCS Main Line: +233 (0)30 266 5421\n• Email: info@ohcs.gov.gh\n• Visit OHCS in person with a valid ID\n\n⚠️ **Important:** Your appointment is only valid when you receive an **official letter** on OHCS letterhead. Do not rely on verbal promises or unofficial communications.\n\nWould you like to know more about the posting process or what to expect as a new appointee?`;
  }

  if (lower.match(/verify.*civil servant|confirm.*employment|check.*if.*works|authentic.*civil servant|verification/)) {
    return `To **verify whether someone is a civil servant** in Ghana:\n\n🔍 **How to Verify:**\n\n1. **Contact RSIMD** — The Research, Statistics & Information Management Directorate maintains the HRMIS database of all civil servants\n2. **Contact the relevant MDA** — The HR unit of the Ministry, Department, or Agency can confirm employment\n3. **Contact OHCS directly** — For general verification queries\n\n📋 **Information to Provide:**\n• Full name of the individual\n• Staff ID number (if known)\n• MDA where they claim to work\n• Grade/rank claimed\n\n📞 **Contact Details:**\n• OHCS: +233 (0)30 266 5421\n• Email: info@ohcs.gov.gh\n\n⚠️ **Beware of Fraud:**\n• Some individuals falsely claim to be civil servants\n• Always verify through official channels before any financial transactions\n• Report suspected impersonation to OHCS or the police\n\nWould you like to know more, or do you have another question?`;
  }

  if (lower.match(/promise.*job|someone.*told.*job|paid.*for.*job|fraud|scam|cheat|guarantee.*employ|buy.*position/)) {
    return `🚨 **Important Warning About Employment Fraud:**\n\nOHCS **never promises employment** to anyone, and **no individual is authorised** to guarantee you a position in the Civil Service.\n\n⚠️ **Red Flags — Watch Out For:**\n• Anyone asking you to **pay money** for a Civil Service job\n• Claims that they can **guarantee your appointment** or placement\n• Requests for payment to **speed up your application**\n• Unofficial communication channels (personal WhatsApp, private meetings)\n• Promises of jobs in exchange for **gifts or favours**\n\n✅ **The Truth:**\n• All recruitment is **competitive** through official examination\n• Applications are only accepted through **ohcs.gov.gh** or official OHCS channels\n• OHCS **never charges fees** for applications, exams, or appointments\n• Selection is based on **merit** — examination results and qualifications\n\n📢 **If You've Been Approached:**\n• **Do not pay** any money\n• Report the individual to OHCS: +233 (0)30 266 5421 or info@ohcs.gov.gh\n• You can also report to the nearest **police station**\n• Keep any evidence (messages, receipts) for investigation\n\nYour vigilance helps protect others. Is there anything else I can help with?`;
  }

  if (lower.match(/salary delay|not.*paid|when.*salary|pay.*late|arrears|payment.*delay|owed.*salary/)) {
    return `I understand the frustration of salary delays. Here's how to address this:\n\n💰 **Steps to Resolve Salary Issues:**\n\n1. **Contact your MDA's Accounts Unit first** — They handle payroll processing at the organisational level\n2. **Check with the Controller & Accountant General's Department (CAGD)** — They manage government payroll\n3. **Contact the F&A Directorate at OHCS** — If the issue persists\n\n📋 **Common Causes of Delays:**\n• New appointment not yet on the payroll system (IPPD)\n• Transfer between MDAs — payroll transition lag\n• Documentation gaps — missing validation documents\n• System-wide payment processing delays\n\n📞 **Who to Contact:**\n• Your MDA's Accounts/HR Unit\n• OHCS F&A Directorate: +233 (0)30 266 5421\n• CAGD for payroll-specific issues\n\n📌 **Important Information to Have Ready:**\n• Your staff ID / employee number\n• Pay slips (if available)\n• Date of appointment or transfer\n• Name of your MDA\n\nWould you like help with anything else?`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. PERFORMANCE MANAGEMENT — appraisals, performance agreements
  // ═══════════════════════════════════════════════════════════════════════════

  if (lower.match(/appraisal|performance.*manage|performance.*review|assessment|rating|performance.*agreement|kpi|target/)) {
    return `The **Performance Management System** is central to career development in the Civil Service:\n\n📊 **Annual Performance Appraisal:**\n• Uses a **standardised template** across all MDAs\n• Combines **self-assessment** by the officer and **supervisor rating**\n• Covers key result areas, competencies, and behavioural indicators\n• Conducted **annually** (typically January-March for the previous year)\n• Results are linked to **promotions** and **training needs identification**\n\n📋 **Performance Agreements (Directors and Above):**\n• Directors and Chief Directors sign **annual performance agreements** with specific targets\n• Targets are aligned to the MDA's strategic plan and national priorities\n• Monitored **quarterly** with progress reviews\n• Annual assessment determines whether targets were met\n\n🎯 **Key Features:**\n• **Objective-setting** — Clear goals agreed at the beginning of the year\n• **Mid-year review** — Progress check and course correction\n• **End-of-year review** — Final assessment and rating\n• **Development plan** — Training needs identified for the next period\n\n📌 **Why It Matters:**\n• Satisfactory appraisals are **required for promotion**\n• Performance data informs training and development decisions\n• Ensures accountability at all levels of the service\n\nYou can download the Performance Agreement template from our [Publications page](/publications).\n\nWould you like to know more about promotions or training?`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 12. CODE OF CONDUCT & ETHICS
  // ═══════════════════════════════════════════════════════════════════════════

  if (lower.match(/code of conduct|ethic|integrity|political.*neutral|neutrality|partisan|bribe|corrupt|conflict.*interest/)) {
    return `The **Civil Service Code of Conduct** sets out the ethical standards expected of all civil servants:\n\n🏛️ **Core Principles:**\n• **Loyalty to the State** — Serve the nation, not any individual or political party\n• **Political neutrality** — Civil servants must not engage in partisan political activity\n• **Integrity** — Act honestly and ethically in all official dealings\n• **Accountability** — Be answerable for the use of public resources\n• **Confidentiality** — Protect sensitive government information\n• **Professionalism** — Maintain high standards of work and behaviour\n\n🚫 **Prohibited Activities:**\n• **Partisan political activity** — Cannot campaign for or hold office in a political party\n• **Accepting bribes or gifts** — No gifts that could compromise objectivity\n• **Unauthorised outside employment** — Cannot engage in paid work outside the service without permission\n• **Misuse of public property** — Government assets must be used only for official purposes\n• **Conflict of interest** — Must declare and recuse from decisions where personal interests are involved\n\n⚖️ **Sexual Harassment Policy:**\n• **Zero tolerance** for sexual harassment\n• Formal complaint mechanism is in place\n• Victims are protected from retaliation\n• Offenders face disciplinary action up to dismissal\n\n📄 You can download the full Code of Conduct from our [Publications page](/publications).\n\nWould you like to know about disciplinary procedures or how to report misconduct?`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 13. REFORM & MODERNISATION
  // ═══════════════════════════════════════════════════════════════════════════

  if (lower.match(/reform|modernis|digitali|e.?government|transformation|innovation|rcu|reform.*coordinat/)) {
    return `OHCS is actively driving **reform and modernisation** of Ghana's Civil Service:\n\n🔄 **Reform Coordinating Unit (RCU):**\n• Coordinates all reform initiatives across the Civil Service\n• Implements the Public Sector Reform Strategy\n• Monitors progress and reports on reform outcomes\n\n💻 **Key Reform Areas:**\n\n**1. Digitalisation:**\n• Implementation of the **HRMIS** (Human Resource Management Information System)\n• E-government services and digital records\n• Online recruitment and service delivery platforms\n\n**2. Service Delivery Improvement:**\n• Client Service Charters across MDAs\n• Reducing bureaucratic processes\n• One-stop service centres\n\n**3. Institutional Strengthening:**\n• Capacity building for civil servants\n• Performance management systems\n• Organisational restructuring where needed\n\n**4. Anti-Corruption Measures:**\n• Strengthened code of conduct enforcement\n• Asset declaration requirements\n• Transparency and accountability frameworks\n\n📌 The goal is to build a Civil Service that is **efficient, transparent, technology-driven, and citizen-centred**.\n\nWould you like to know more about specific reform initiatives?`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 14. MDA & REGIONAL STRUCTURE
  // ═══════════════════════════════════════════════════════════════════════════

  if (lower.match(/mda|ministr|how many.*mda|government.*agenc|regional.*admin|regional.*civil/)) {
    return `The Civil Service operates across Ghana's **Ministries, Departments, and Agencies (MDAs)** and all **16 regions**:\n\n🏛️ **What are MDAs?**\n• **Ministries** — Government departments headed by Ministers (e.g., Ministry of Finance, Ministry of Health)\n• **Departments** — Operational units that implement government programmes\n• **Agencies** — Specialised bodies established to deliver specific services\n\n📊 **Civil Service Presence:**\n• Civil servants work in MDAs across all 16 regions of Ghana\n• Each MDA has its own administrative structure with a **Chief Director** as the highest career civil servant\n• OHCS provides central coordination and oversight\n\n🗺️ **Regional Structure:**\n• Civil servants are posted to all 16 regions based on service needs\n• Regional Coordinating Councils have civil service staff\n• The Career Management Directorate (CMD) manages inter-regional transfers\n\n📌 **Key Facts:**\n• Over **20,000 civil servants** across the country\n• The Civil Service is distinct from other public services (Judicial, Health, Education, etc.)\n• Each MDA reports to OHCS on HR and administrative matters\n\nWould you like to know about a specific ministry or how postings work?`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 15. ORIGINAL RESPONSES (preserved) — OHCS info, leadership, complaints, etc.
  // ═══════════════════════════════════════════════════════════════════════════

  if (lower.includes('what does ohcs do') || lower.includes('what is ohcs') || lower.includes('about ohcs') || lower.includes('tell me about') || lower.includes('what is the office')) {
    return `Great question! The **Office of the Head of the Civil Service (OHCS)** is the apex administrative body responsible for managing, developing, and reforming Ghana's Civil Service.\n\nOur key functions include:\n• **Recruitment** — Managing the Civil Service Graduate Entrance Examination\n• **Training & Development** — Building capacity across 20,000+ civil servants\n• **Policy & Reform** — Driving modernisation of public service delivery\n• **Career Management** — Overseeing promotions, transfers, and postings\n• **Performance Management** — Ensuring accountability and excellence\n\nWe operate through **5 Line Directorates** and **6 Support Units** across all 16 regions of Ghana.\n\nWould you like to know more about any specific area?`;
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

  if (lower.match(/directorate|structure|unit|department|organis/)) {
    return `OHCS is structured into **5 Line Directorates** and **6 Support Units**:\n\n**Line Directorates:**\n1. 📊 Research, Statistics & Information Management (RSIMD)\n2. 💰 Finance & Administration (F&A)\n3. 📋 Planning, Budgeting, Monitoring & Evaluation (PBMED)\n4. 💼 Career Management (CMD)\n5. 🎓 Recruitment, Training & Development (RTDD)\n\n**Support Units:**\n1. 🔄 Reform Coordinating Unit (RCU)\n2. 📑 Internal Audit Unit (IAU)\n3. ⚖️ Civil Service Council (CSC)\n4. 🏢 Estate Unit\n5. 💳 Accounts Unit\n6. 📦 Stores Unit\n\nWe also have **3 Training Institutions** across the country.\n\nWould you like details about any specific directorate or unit?`;
  }

  if (lower.includes('publication') || lower.includes('download') || lower.includes('document') || lower.includes('form') || lower.includes('circular')) {
    return `You can access all official OHCS documents on our [Publications page](/publications):\n\n**Available Documents:**\n📄 Performance Agreement Templates\n📋 Civil Service Code of Conduct\n📊 Annual Performance Reports\n📝 Training Report Templates\n📜 RTI Manuals\n🏆 Awards Nomination Forms\n\nAll documents are **free to download**.\n\nFor a more comprehensive document library with AI-powered search, visit the **[OHCS E-Library](https://ohcselibrary.xyz)**.\n\nIs there a specific document you're looking for?`;
  }

  if (lower.includes('track') || lower.includes('reference') || lower.includes('status') || lower.includes('submission')) {
    return `To track the status of your submission:\n\n1. Visit our [Track Submission page](/track)\n2. Enter your **reference number** (format: OHCS-XXX-XXXXXXXX-XXXX)\n3. Enter the **email or phone** you used when submitting\n4. View your current status and timeline\n\nIf you've lost your reference number, please contact us:\n📞 +233 (0)30 266 5421\n📧 info@ohcs.gov.gh\n\nWould you like help with anything else?`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 16. AWARDS & RECOGNITION
  // ═══════════════════════════════════════════════════════════════════════════

  if (lower.match(/award|recogni|best worker|civil service week|excellence|outstanding.*officer/)) {
    return `The Civil Service recognises outstanding performance through several **awards and recognition programmes**:\n\n🏆 **Civil Service Excellence Awards:**\n• Recognises exceptional performance by individual officers and teams\n• Categories include Best Worker, Innovation Award, and Service Delivery Excellence\n• Nominations are open to all civil servants through their MDAs\n\n🎉 **Civil Service Week:**\n• An annual celebration of the Civil Service's contributions to national development\n• Features workshops, exhibitions, awards ceremonies, and public lectures\n• Provides an opportunity to showcase the work of civil servants\n\n📋 **How to Nominate:**\n• Download the Awards Nomination Form from our [Publications page](/publications)\n• Submit through your MDA's HR unit\n• Nominations are reviewed by a selection committee\n\n📌 **Purpose:**\nThese programmes motivate officers, promote a culture of excellence, and demonstrate to the public the value and dedication of Ghana's civil servants.\n\nWould you like to know more about Civil Service Week or other OHCS events?`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 17. INTERNAL AUDIT & GOVERNANCE
  // ═══════════════════════════════════════════════════════════════════════════

  if (lower.match(/audit|internal audit|iau|governance|accountab|transparen/)) {
    return `The **Internal Audit Unit (IAU)** plays a critical governance role at OHCS:\n\n📑 **Core Functions:**\n• **Financial audits** — Reviews financial transactions and processes for accuracy and compliance\n• **Compliance audits** — Ensures adherence to laws, regulations, and policies\n• **Performance audits** — Evaluates the efficiency and effectiveness of operations\n• **Risk assessment** — Identifies and assesses operational and financial risks\n• **Advisory role** — Recommends improvements to internal controls\n\n📋 **Key Responsibilities:**\n• Reviews procurement processes\n• Examines payroll and payment systems\n• Assesses asset management practices\n• Reports findings to the Head of the Civil Service\n• Coordinates with the Auditor General's Department\n\n📌 **Governance Framework:**\n• OHCS operates under the **Public Financial Management Act**\n• Subject to oversight by the **Auditor General**\n• Internal controls are reviewed and strengthened regularly\n• Transparency in resource allocation and expenditure\n\nGood governance ensures that public resources are used efficiently and for the benefit of citizens.\n\nWould you like to know about other support units at OHCS?`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 18. E-LIBRARY & DIGITAL RESOURCES
  // ═══════════════════════════════════════════════════════════════════════════

  if (lower.match(/e.?library|digital.*library|online.*resource|research.*resource|knowledge.*manage/)) {
    return `OHCS maintains a comprehensive **E-Library** for civil servants and the public:\n\n📚 **OHCS E-Library:**\n• Access at: **[ohcselibrary.xyz](https://ohcselibrary.xyz)**\n• AI-powered search for quick document discovery\n• Free access to official OHCS publications\n\n📄 **Available Resources:**\n• Civil Service Code of Conduct\n• Performance Management templates\n• Annual Performance Reports\n• Training manuals and guides\n• Policy documents and circulars\n• Reform programme documents\n• RTI manuals and guides\n\n💻 **Features:**\n• Search by keyword, topic, or date\n• Download documents in multiple formats\n• Regularly updated with new publications\n• Accessible from any device\n\n📌 You can also access publications directly from our [Publications page](/publications).\n\nIs there a specific document you're looking for?`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 19. CIVIL SERVICE COUNCIL
  // ═══════════════════════════════════════════════════════════════════════════

  if (lower.match(/civil service council|csc(?!\w)|council.*civil|advisory.*council/)) {
    return `The **Civil Service Council (CSC)** is an important advisory body within the Civil Service:\n\n⚖️ **Role:**\n• Provides **advisory support** on policy matters affecting the Civil Service\n• Reviews and recommends on conditions of service\n• Considers disciplinary cases referred to it\n• Advises the Head of the Civil Service on strategic matters\n\n📋 **Functions:**\n• Reviews proposals for changes to Civil Service regulations\n• Considers appeals and representations from officers\n• Advises on welfare and working conditions\n• Supports the maintenance of standards and discipline\n\n📌 **Composition:**\n• Comprises representatives from various levels of the Civil Service\n• Ensures diverse perspectives in decision-making\n• Works alongside the Public Services Commission\n\nThe CSC helps ensure that decisions affecting civil servants are well-considered and balanced.\n\nWould you like to know about other support units at OHCS?`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 20. CONTACT & SOCIAL MEDIA
  // ═══════════════════════════════════════════════════════════════════════════

  if (lower.match(/contact|phone|email|address|location|reach|social media|facebook|twitter|instagram|website/)) {
    return `Here's how to **reach OHCS**:\n\n📍 **Physical Address:**\nOffice of the Head of the Civil Service\nP.O. Box M.49, Accra, Ghana\n\n📞 **Phone:** +233 (0)30 266 5421\n📧 **Email:** info@ohcs.gov.gh\n🌐 **Website:** [ohcs.gov.gh](https://ohcs.gov.gh)\n\n🕐 **Office Hours:**\nMonday – Friday: **8:00 AM – 5:00 PM**\n(Closed on weekends and public holidays)\n\n📱 **Social Media:**\n• Follow OHCS on social media for the latest news, announcements, and recruitment updates\n• Official announcements are made through **ohcs.gov.gh** and verified social media accounts\n\n⚠️ **Important Reminder:**\n• Only trust communications from official OHCS channels\n• OHCS does not charge fees for any services\n• Report suspicious communications claiming to be from OHCS\n\nAnd remember — I'm available **24/7** right here to answer your questions! 😊\n\nWhat else can I help you with?`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 21. POLITE CLOSINGS & SOCIAL RESPONSES
  // ═══════════════════════════════════════════════════════════════════════════

  if (lower.includes('thank') || lower.includes('thanks') || lower.includes('appreciate')) {
    return `You're very welcome! 😊 It's my pleasure to help.\n\nRemember, I'm available here **24/7** whenever you need information about Ghana's Civil Service.\n\nHave a wonderful day, and don't hesitate to come back if you need anything! 🇬🇭`;
  }

  if (lower.includes('bye') || lower.includes('goodbye') || lower.includes('see you')) {
    return `Thank you for visiting! Take care, and have a blessed day. 🇬🇭\n\nRemember, the Office of the Head of the Civil Service is always here to serve you. Come back anytime you need help!\n\n*Loyalty • Excellence • Service*`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 22. GHANA — general knowledge
  // ═══════════════════════════════════════════════════════════════════════════

  if (lower.match(/ghana|country|capital|population|president|region|16 region/)) {
    return `Ghana 🇬🇭 is a beautiful West African nation!\n\n• **Capital:** Accra\n• **Population:** ~34 million\n• **Government:** Constitutional democracy\n• **Independence:** 6 March 1957 (first sub-Saharan African country)\n• **Regions:** 16 administrative regions\n• **Official Language:** English\n\nThe **Civil Service** is the administrative backbone of Ghana's government, employing over **20,000 professionals** who deliver public services to citizens across all 16 regions.\n\n🏛️ **Key Public Services:**\n• Civil Service (managed by OHCS)\n• Judicial Service\n• Health Service\n• Education Service\n• Police Service\n• Fire Service\n• Immigration Service\n• And several others listed in Article 190 of the Constitution\n\nIs there something specific about the Civil Service I can help you with?`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 23. FAIR WAGES & SALARIES COMMISSION
  // ═══════════════════════════════════════════════════════════════════════════

  if (lower.match(/fair wages|fwsc|single spine|salary.*commission|pay.*structure|wage.*commission/)) {
    return `The **Fair Wages and Salaries Commission (FWSC)** manages Ghana's public sector pay:\n\n💰 **What is FWSC?**\n• Established by the **Fair Wages and Salaries Commission Act, 2007 (Act 737)**\n• Responsible for ensuring **fair and transparent** compensation across all public services\n\n📊 **Single Spine Salary Structure (SSSS):**\n• A unified pay structure for all public sector workers\n• Replaced multiple pay scales with a single framework\n• Each position is assigned a **pay point** on the spine\n• Annual adjustments based on negotiations and economic conditions\n\n📋 **FWSC Functions:**\n• Determines public sector salary levels\n• Manages pay negotiations with unions (including CLOGSAG)\n• Ensures equity across public services\n• Reviews and adjusts salary structures periodically\n\n📌 **How It Affects You:**\n• Your salary as a civil servant is determined by your grade and the SSSS\n• Market premiums may apply for certain professions\n• Annual salary reviews are negotiated between government and unions\n\nWould you like to know about specific allowances or how to check your pay point?`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 24. PUBLIC HOLIDAYS & CALENDAR
  // ═══════════════════════════════════════════════════════════════════════════

  if (lower.match(/public holiday|holiday|independence day|republic day|founders|farmers|kwame nkrumah/)) {
    return `Ghana observes several **public holidays** when Civil Service offices are closed:\n\n🗓️ **Key Public Holidays:**\n• **1 January** — New Year's Day\n• **6 March** — Independence Day\n• **1 May** — May Day / Workers' Day\n• **25 May** — Africa Day (AU Day)\n• **4 August** — Founders' Day\n• **21 September** — Kwame Nkrumah Memorial Day\n• **1 July** — Republic Day\n• **First Friday of December** — Farmers' Day\n• **25-26 December** — Christmas & Boxing Day\n• **Easter** — Good Friday & Easter Monday (dates vary)\n• **Eid al-Fitr** and **Eid al-Adha** (dates vary based on Islamic calendar)\n\n📌 **For Civil Servants:**\n• Public holidays are non-working days with full pay\n• If a holiday falls on a weekend, the next working day may be declared a holiday\n• Essential services may require skeleton staff on holidays\n\nRemember, even on holidays, I'm available **24/7** right here! 😊\n\nIs there anything else you'd like to know?`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 25. RECORDS MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  if (lower.match(/record.*manage|file.*manage|registry|archiv|document.*manage|personal.*file|docket/)) {
    return `**Records management** is a critical function in Ghana's Civil Service:\n\n📁 **Why It Matters:**\n• Proper records ensure institutional memory and continuity\n• Required for accountability, transparency, and audit compliance\n• Essential for processing promotions, transfers, and benefits\n\n📋 **Key Aspects:**\n• **Personal files (dockets)** — Every civil servant has a personal file containing appointment, promotion, and service records\n• **Registry system** — MDAs maintain registries for correspondence and official documents\n• **Archiving** — Historical records are preserved according to national standards\n• **Digital records** — Progressive digitisation of records through HRMIS and other systems\n\n📌 **For Civil Servants:**\n• Ensure your personal file is **up to date** with all qualifications, promotions, and training records\n• Submit copies of certificates and relevant documents to your MDA's HR unit\n• Contact RSIMD at OHCS for records-related queries\n\n🎓 **Training:**\n• Records management is part of the **mandatory induction training** for new recruits\n• Regular refresher courses available through CSTC and RTDD\n\nWould you like to know more about how to update your personal file?`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 26. SECONDMENT & ATTACHMENT
  // ═══════════════════════════════════════════════════════════════════════════

  if (lower.match(/secondment|attachment|temporary.*post|loan.*officer|detach|international.*organ/)) {
    return `**Secondment and attachment** are mechanisms for temporary service outside your normal posting:\n\n🔄 **Secondment:**\n• Temporary assignment to another organisation (national or international)\n• Officer remains a civil servant and retains all rights\n• Common for assignments to international organisations (AU, UN, ECOWAS)\n• Requires approval from OHCS and the sending MDA\n• Typically for a defined period (1-3 years, renewable)\n\n📋 **Attachment:**\n• Short-term placement within another MDA or unit\n• For skills development or to meet temporary staffing needs\n• Officer returns to their substantive post after the attachment\n\n📌 **Key Points:**\n• During secondment, the officer's position may be held or filled temporarily\n• Salary and benefits during secondment depend on the terms agreed\n• International secondments may come with additional allowances from the receiving organisation\n• Secondment experience is recognised for career progression\n\n⚠️ **Process:**\n1. Request or nomination through your MDA\n2. Approval from OHCS / Head of Civil Service\n3. Terms agreed between sending and receiving organisations\n4. Formal secondment letter issued\n\nWould you like to know more about international opportunities or career development?`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 27. POLITE / CONVERSATIONAL CATCH-ALL
  // ═══════════════════════════════════════════════════════════════════════════

  if (lower.match(/please|okay|ok|alright|sure|great|nice|wonderful|awesome|cool/)) {
    return `You're welcome! 😊 I'm here whenever you need me.\n\nIs there anything specific about the Ghana Civil Service you'd like to know? Just ask — no question is too simple or too complex!`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FALLBACK — friendly and helpful
  // ═══════════════════════════════════════════════════════════════════════════

  return `That's an interesting question! While I'm still learning, I want to make sure I give you accurate information. 😊\n\nHere's what I can definitely help you with:\n\n• **"Tell me about OHCS"** — our mission and what we do\n• **"How do I join the Civil Service?"** — recruitment process\n• **"What's the Civil Service Act?"** — legal framework (PNDCL 327)\n• **"Tell me about leave entitlements"** — annual, sick, maternity, study leave\n• **"How do promotions work?"** — grading system and career progression\n• **"What's the pension scheme?"** — retirement and SSNIT\n• **"What's the Code of Conduct?"** — ethics and standards\n• **"I want to submit an RTI request"** — right to information\n• **"Who leads the Civil Service?"** — our leadership team\n• **"I have a complaint"** — how to file complaints\n• **"What about performance appraisals?"** — performance management\n• **"Tell me about CLOGSAG"** — the civil servants' association\n• **"What's your name?"** — get to know me!\n\nOr you can simply chat with me — I love a good conversation! 🇬🇭`;
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
      content: `${getGreeting()}! 😊 I'm **Lexi** — the OHCS Live Engagement & eXpert Intelligence.\n\nI'm your dedicated assistant for all things Ghana Civil Service. Whether you need information about recruitment, want to submit an RTI request, or simply have a question — I'm here to help.\n\nPlease, what can I assist you with today?`,
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
                <h1 className="text-white font-display text-2xl font-bold">Ask Lexi</h1>
                <p className="text-white/30 text-[10px] uppercase tracking-wider mt-1">OHCS Live Engagement & eXpert Intelligence</p>
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
            <h1 className="text-white font-bold text-sm">Ask Lexi</h1>
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
