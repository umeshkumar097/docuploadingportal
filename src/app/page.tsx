import Link from "next/link";
import {
  Shield, Lock, FileCheck, Server, Trash2,
  CheckCircle2, ArrowRight, Phone, Mail, MapPin,
  Building2, Users, FileText, BarChart3, Clock,
  Upload, Eye, Download, Star, ChevronDown,
  Zap, Globe, Award, Headphones
} from "lucide-react";
import { AnimatedBackground } from "@/components/animated-background";

const securityFeatures = [
  { icon: Lock, title: "Bank-Grade Encryption", desc: "All candidate documents are secured with AES-256 bit encryption both in transit and at rest.", color: "text-blue-500", bg: "bg-blue-500/10" },
  { icon: Shield, title: "Strict Access Control", desc: "Zero-trust architecture ensures only authorized operational verifiers can view sensitive data.", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { icon: FileCheck, title: "Multi-Tier Validation", desc: "A rigorous dual-layered validation process guarantees authentic document structural integrity.", color: "text-violet-500", bg: "bg-violet-500/10" },
  { icon: Server, title: "Isolated Infrastructure", desc: "Hosted on highly resilient, geographically isolated secure edge networks to prevent data breaches.", color: "text-amber-500", bg: "bg-amber-500/10" },
  { icon: Trash2, title: "Automated Data Purging", desc: "100% GDPR compliant. Documents are permanently destroyed from our servers post-verification.", color: "text-rose-500", bg: "bg-rose-500/10" },
  { icon: Globe, title: "99.9% Uptime SLA", desc: "Enterprise-grade infrastructure with redundant systems ensuring your portal is always available.", color: "text-cyan-500", bg: "bg-cyan-500/10" },
];

const features = [
  { icon: Upload, title: "Bulk Document Collection", desc: "Candidates upload their own documents via a secure personalized link. No manual collection needed.", color: "text-blue-400" },
  { icon: Eye, title: "Real-Time Admin Dashboard", desc: "Track submission status, view documents, and manage candidates from a single powerful dashboard.", color: "text-violet-400" },
  { icon: BarChart3, title: "Batch-wise Filtering", desc: "Filter candidates by batch, phase, language, qualification, and date — instantly.", color: "text-emerald-400" },
  { icon: Download, title: "One-Click Excel Export", desc: "Export complete candidate data with all fields to Excel in one click for reporting.", color: "text-amber-400" },
  { icon: FileText, title: "Hall Ticket Management", desc: "Upload, manage, and distribute Hall Tickets to candidates in bulk via ZIP uploads.", color: "text-rose-400" },
  { icon: Headphones, title: "Dedicated Support", desc: "Our team is available to assist you with onboarding, configuration, and operations.", color: "text-cyan-400" },
];

const howItWorks = [
  { step: "01", title: "Company Onboarding", desc: "Your company is configured on the portal with custom form fields, document requirements, and branding.", icon: Building2 },
  { step: "02", title: "Candidate Submission", desc: "Candidates receive a unique link to submit their documents securely from any device, anytime.", icon: Upload },
  { step: "03", title: "Admin Review & Export", desc: "HR/Operations team reviews, filters, and exports all submitted data with one click.", icon: BarChart3 },
];

const stats = [
  { number: "5,000+", label: "Documents Processed" },
  { number: "15+", label: "BFSI Companies" },
  { number: "99.9%", label: "Uptime Guaranteed" },
  { number: "3 mins", label: "Avg. Submission Time" },
];

const testimonials = [
  { name: "Rajesh Sharma", role: "HR Head, TVS Credit", text: "CruxDoc has completely eliminated our manual document collection process. What used to take weeks now takes days.", rating: 5 },
  { name: "Priya Mehta", role: "Training Manager, Home Credit", text: "The batch-wise filtering and Excel export features save us hours every week. Highly recommended for BFSI operations.", rating: 5 },
  { name: "Anil Verma", role: "Operations Lead, NBFC", text: "Secure, fast, and extremely easy for candidates to use. Our document submission rate jumped to 95%+.", rating: 5 },
];

const faqs = [
  { q: "How secure is the document upload process?", a: "All documents are encrypted with AES-256 bit encryption, stored on isolated cloud infrastructure, and automatically purged after verification. We follow strict GDPR and data protection guidelines." },
  { q: "Can candidates upload from mobile devices?", a: "Yes! CruxDoc is fully responsive and optimized for all devices — mobile, tablet, and desktop. Candidates can upload documents from anywhere." },
  { q: "How are Hall Tickets distributed?", a: "You can upload a bulk ZIP file containing PDFs. The system automatically matches Hall Ticket numbers with candidates and makes them available for download." },
  { q: "Can we filter candidates by batch or phase?", a: "Absolutely. Our advanced filtering system allows you to filter by batch name, phase, date, language, qualification, and more — all in real time." },
  { q: "Who manages the portal — is setup required?", a: "Our team at Aiclex Technologies handles complete setup, onboarding, and ongoing support. You simply start receiving documents from day one." },
];

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col items-center overflow-x-hidden bg-black text-white selection:bg-blue-500/30">
      <AnimatedBackground />

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 w-full px-6 py-4 flex items-center justify-between bg-black/60 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-white text-sm">C</div>
          <div>
            <span className="font-black text-white text-lg tracking-tight">CruxDoc</span>
            <span className="text-zinc-500 text-[10px] block leading-none tracking-widest uppercase">by Aiclex Technologies</span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors">How It Works</a>
          <a href="#security" className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors">Security</a>
          <a href="#contact" className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors">Contact</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden md:block px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold hover:bg-white/10 transition-all">
            Login
          </Link>
          <Link href="/apply" className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold hover:from-blue-500 hover:to-indigo-500 transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)]">
            Submit Docs →
          </Link>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <main className="relative z-10 w-full max-w-6xl px-6 pt-40 pb-20 text-center flex flex-col items-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none opacity-50 mix-blend-screen" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 blur-[150px] rounded-full pointer-events-none opacity-50 mix-blend-screen" />

        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
            </span>
            <span className="text-xs font-bold tracking-[0.15em] uppercase text-blue-100">Enterprise Document Portal</span>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 backdrop-blur-md">
            <Award className="h-3.5 w-3.5 text-orange-400" />
            <span className="text-xs font-bold tracking-[0.15em] uppercase text-orange-300">DPIIT Recognized Startup</span>
          </div>
        </div>

        <h1 className="text-6xl md:text-8xl lg:text-[7rem] font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-white/95 to-white/60 leading-[1.05]">
          CRUXDOC<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">PORTAL</span>
        </h1>

        <p className="text-lg md:text-2xl text-zinc-400/90 max-w-3xl mx-auto mb-4 leading-relaxed font-light">
          India&apos;s most secure platform for <span className="text-zinc-200 font-medium">candidate document collection & verification</span> — built for BFSI, NBFCs, and large enterprises.
        </p>
        <p className="text-sm text-zinc-600 mb-12 font-medium">Powered by <span className="text-blue-400">Aiclex Technologies</span> • Trusted by 15+ companies</p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 flex-wrap">
          <Link href="/apply" className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg hover:from-blue-500 hover:to-indigo-500 transition-all flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(79,70,229,0.4)] hover:shadow-[0_0_60px_rgba(79,70,229,0.6)] ring-1 ring-white/20">
            Submit Your Documents <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link href="/login" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl text-white font-semibold text-lg hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center">
              Admin Login
            </Link>
            <Link href="/login" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl text-white font-semibold text-lg hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center">
              Company Login
            </Link>
          </div>
        </div>
      </main>

      {/* ── STATS BANNER ── */}
      <section className="relative z-10 w-full border-y border-white/5 bg-white/2 backdrop-blur-sm py-12">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">{s.number}</span>
              <span className="text-zinc-500 text-sm font-semibold mt-1 tracking-wide uppercase text-[11px]">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="relative z-10 w-full max-w-6xl px-6 py-24">
        <div className="text-center mb-16">
          <p className="text-blue-400 text-xs font-black uppercase tracking-[0.3em] mb-3">Simple Process</p>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">How <span className="text-blue-400">CruxDoc</span> Works</h2>
          <p className="text-zinc-500 max-w-xl mx-auto">From onboarding to document export — everything automated in 3 simple steps.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {howItWorks.map((step, i) => (
            <div key={i} className="relative bg-black/40 backdrop-blur-2xl p-8 rounded-[2rem] border border-white/10 hover:border-blue-500/30 transition-all duration-500 hover:-translate-y-2 group">
              <div className="absolute top-6 right-6 text-5xl font-black text-white/5 group-hover:text-blue-500/10 transition-colors">{step.step}</div>
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ring-1 ring-blue-500/20">
                <step.icon className="h-7 w-7 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{step.desc}</p>
              {i < 2 && <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-[2px] bg-gradient-to-r from-blue-500/50 to-transparent" />}
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="relative z-10 w-full max-w-6xl px-6 py-16">
        <div className="text-center mb-16">
          <p className="text-blue-400 text-xs font-black uppercase tracking-[0.3em] mb-3">What You Get</p>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Everything You Need to <span className="text-blue-400">Manage Documents</span></h2>
          <p className="text-zinc-500 max-w-xl mx-auto">Purpose-built for HR teams, training coordinators, and DRA managers in BFSI companies.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div key={i} className="bg-black/40 backdrop-blur-2xl p-7 rounded-[2rem] border border-white/10 hover:border-white/20 transition-all duration-500 hover:-translate-y-1 group">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <f.icon className={`h-6 w-6 ${f.color}`} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHO IT'S FOR ── */}
      <section className="relative z-10 w-full max-w-6xl px-6 py-16">
        <div className="rounded-[2.5rem] bg-gradient-to-br from-blue-600/20 to-indigo-600/10 border border-blue-500/20 p-10 md:p-16">
          <div className="flex flex-col md:flex-row gap-12 items-start">
            <div className="flex-1">
              <p className="text-blue-400 text-xs font-black uppercase tracking-[0.3em] mb-4">Built For</p>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">Designed for <span className="text-blue-400">India&apos;s BFSI</span> Industry</h2>
              <p className="text-zinc-400 leading-relaxed mb-8">CruxDoc is purpose-built for companies that regularly onboard large batches of DRA agents, field executives, and financial advisors — where document collection is a massive operational challenge.</p>
              <Link href="/apply" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all">
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex-1 space-y-4">
              {["NBFC & Financial Services Companies", "Insurance & DRA Recruitment Agencies", "Banking & Training Partners", "HR Outsourcing Firms", "Staffing & Manpower Companies"].map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl px-5 py-3.5 border border-white/5">
                  <CheckCircle2 className="h-5 w-5 text-blue-400 flex-shrink-0" />
                  <span className="text-white font-semibold text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECURITY ── */}
      <section id="security" className="relative z-10 w-full max-w-6xl px-6 py-16">
        <div className="text-center mb-16">
          <p className="text-blue-400 text-xs font-black uppercase tracking-[0.3em] mb-3">Enterprise Security</p>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Uncompromising <span className="text-blue-400">Security</span></h2>
          <p className="text-zinc-500 max-w-2xl mx-auto">Your data privacy is our absolute priority. We utilize military-grade infrastructure to process, validate, and purge your documents.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {securityFeatures.map((f, i) => (
            <div key={i} className="bg-black/40 backdrop-blur-2xl p-8 rounded-[2rem] border border-white/10 hover:border-white/20 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_40px_rgba(59,130,246,0.1)] group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className={`w-14 h-14 rounded-2xl ${f.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ring-1 ring-white/5`}>
                <f.icon className={`h-7 w-7 ${f.color}`} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="relative z-10 w-full max-w-6xl px-6 py-16">
        <div className="text-center mb-16">
          <p className="text-blue-400 text-xs font-black uppercase tracking-[0.3em] mb-3">Customer Stories</p>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Trusted by <span className="text-blue-400">Operations Teams</span></h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-black/40 backdrop-blur-2xl p-8 rounded-[2rem] border border-white/10 hover:border-white/20 transition-all duration-300">
              <div className="flex gap-1 mb-5">
                {Array(t.rating).fill(0).map((_, j) => <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-zinc-300 text-sm leading-relaxed mb-6 italic">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3 border-t border-white/5 pt-5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-white text-sm">
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{t.name}</p>
                  <p className="text-zinc-500 text-xs">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="relative z-10 w-full max-w-3xl px-6 py-16">
        <div className="text-center mb-16">
          <p className="text-blue-400 text-xs font-black uppercase tracking-[0.3em] mb-3">FAQs</p>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Frequently Asked <span className="text-blue-400">Questions</span></h2>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <details key={i} className="group bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 hover:border-white/20 transition-all">
              <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                <span className="font-bold text-white pr-4">{faq.q}</span>
                <ChevronDown className="h-5 w-5 text-zinc-400 flex-shrink-0 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-6 pb-6">
                <p className="text-zinc-400 text-sm leading-relaxed">{faq.a}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section className="relative z-10 w-full max-w-6xl px-6 py-12">
        <div className="rounded-[2.5rem] bg-gradient-to-r from-blue-600 to-indigo-700 p-12 md:p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.15)_0%,_transparent_60%)]" />
          <Zap className="h-10 w-10 text-white/40 mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 relative z-10">Ready to Digitize Your<br />Document Collection?</h2>
          <p className="text-blue-100 mb-8 text-lg relative z-10">Join 15+ BFSI companies who trust CruxDoc for seamless candidate document management.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <a href="https://wa.me/918449488090" target="_blank" rel="noopener noreferrer" className="px-8 py-4 rounded-xl bg-white text-blue-700 font-black text-lg hover:bg-blue-50 transition-all shadow-xl">
              WhatsApp Us Now
            </a>
            <a href="mailto:info@aiclex.in" className="px-8 py-4 rounded-xl bg-white/10 border border-white/30 text-white font-bold text-lg hover:bg-white/20 transition-all">
              info@aiclex.in
            </a>
          </div>
        </div>
      </section>

      {/* ── CONTACT SECTION ── */}
      <section id="contact" className="relative z-10 w-full max-w-6xl px-6 py-16">
        <div className="text-center mb-16">
          <p className="text-blue-400 text-xs font-black uppercase tracking-[0.3em] mb-3">Get In Touch</p>
          <h2 className="text-4xl font-black text-white mb-4">Contact <span className="text-blue-400">Aiclex Technologies</span></h2>
          <p className="text-zinc-500">We&apos;re here to help you set up and manage your document portal.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <a href="tel:+918449488090" className="bg-black/40 backdrop-blur-2xl p-8 rounded-[2rem] border border-white/10 hover:border-blue-500/30 transition-all group flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Phone className="h-7 w-7 text-blue-400" />
            </div>
            <div>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Phone / WhatsApp</p>
              <p className="text-white font-bold">+91 8449488090</p>
            </div>
          </a>
          <a href="mailto:info@aiclex.in" className="bg-black/40 backdrop-blur-2xl p-8 rounded-[2rem] border border-white/10 hover:border-blue-500/30 transition-all group flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Mail className="h-7 w-7 text-indigo-400" />
            </div>
            <div>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Email</p>
              <p className="text-white font-bold">info@aiclex.in</p>
            </div>
          </a>
          <div className="bg-black/40 backdrop-blur-2xl p-8 rounded-[2rem] border border-white/10 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <MapPin className="h-7 w-7 text-emerald-400" />
            </div>
            <div>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Office</p>
              <p className="text-white font-bold text-sm">Gaur City Mall, Noida<br />201318</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 w-full border-t border-white/5 bg-black/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-white text-sm">C</div>
                <div>
                  <span className="font-black text-white text-lg tracking-tight">CruxDoc Portal</span>
                  <span className="text-zinc-600 text-[10px] block leading-none tracking-widest uppercase">by Aiclex Technologies</span>
                </div>
              </div>
              <p className="text-zinc-500 text-sm leading-relaxed">India&apos;s secure enterprise document management platform for BFSI companies.</p>
              <p className="text-zinc-600 text-xs mt-4">DPIIT Recognized Startup<br />CIN: U62099UW2026PTC254970<br />GSTIN: 09ABGCA0151N1ZL</p>
            </div>

            {/* Quick Links */}
            <div>
              <p className="text-white font-bold mb-5 uppercase tracking-widest text-xs">Quick Links</p>
              <div className="space-y-3">
                <Link href="/apply" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium"><ArrowRight className="h-3.5 w-3.5 text-blue-500" /> Submit Documents</Link>
                <Link href="/login" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium"><ArrowRight className="h-3.5 w-3.5 text-blue-500" /> Admin Login</Link>
                <Link href="/login" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium"><ArrowRight className="h-3.5 w-3.5 text-blue-500" /> Company Login</Link>
                <a href="https://aiclex.in" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium"><ArrowRight className="h-3.5 w-3.5 text-blue-500" /> Aiclex Technologies</a>
              </div>
            </div>

            {/* Address */}
            <div>
              <p className="text-white font-bold mb-5 uppercase tracking-widest text-xs">Aiclex Solutions Pvt. Ltd.</p>
              <div className="space-y-4">
                <div>
                  <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">Corporate Office</p>
                  <p className="text-zinc-400 text-sm leading-relaxed">Unit No 8125, 8th Floor,<br />Gaur City Mall, Sector 4,<br />Greater Noida, UP – 201318</p>
                </div>
                <div>
                  <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">Registered Office</p>
                  <p className="text-zinc-400 text-sm leading-relaxed">E58, Sector 3,<br />Noida, UP – 201301</p>
                </div>
                <div className="flex flex-col gap-1">
                  <a href="tel:+918449488090" className="text-zinc-400 hover:text-white transition-colors text-sm">📞 +91 8449488090</a>
                  <a href="mailto:info@aiclex.in" className="text-zinc-400 hover:text-white transition-colors text-sm">✉️ info@aiclex.in</a>
                  <a href="https://aiclex.in" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-colors text-sm">🌐 aiclex.in</a>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-zinc-600 text-xs text-center md:text-left">
              © {new Date().getFullYear()} Aiclex Solutions Pvt. Ltd. All rights reserved. CruxDoc is a product of Aiclex Technologies.
            </p>
            <p className="text-zinc-600 text-xs">
              Secure · Fast · Enterprise-Grade
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
