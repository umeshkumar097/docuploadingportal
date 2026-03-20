import Link from "next/link";
import Image from "next/image";
import { Shield, Lock, FileCheck, Server, Trash2 } from "lucide-react";

const securityFeatures = [
  {
    icon: Lock,
    title: "Bank-Grade Encryption",
    desc: "All candidate documents are secured with AES-256 bit encryption both in transit and at rest.",
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  },
  {
    icon: Shield,
    title: "Strict Access Control",
    desc: "Zero-trust architecture ensures only strictly authorized operational verifiers can view sensitive data.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10"
  },
  {
    icon: FileCheck,
    title: "Multi-Tier Validation",
    desc: "A rigorous dual-layered validation process guarantees authentic document structural integrity.",
    color: "text-violet-500",
    bg: "bg-violet-500/10"
  },
  {
    icon: Server,
    title: "Isolated Infrastructure",
    desc: "Hosted on highly resilient, geographically isolated secure edge networks to prevent data breaches.",
    color: "text-amber-500",
    bg: "bg-amber-500/10"
  },
  {
    icon: Trash2,
    title: "Automated Data Purging",
    desc: "100% GDPR compliant. Documents are permanently destroyed from our servers post-verification.",
    color: "text-rose-500",
    bg: "bg-rose-500/10"
  }
];

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col items-center overflow-x-hidden bg-black text-white selection:bg-blue-500/30">
      {/* Premium Background */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/hero-bg.png"
          alt="Premium Background"
          fill
          className="object-cover opacity-50 scale-105 animate-pulse-slow object-top"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black" />
      </div>

      {/* Hero Content */}
      <main className="relative z-10 w-full max-w-6xl px-6 pt-32 pb-20 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-white/10 mb-8 animate-fade-in-up">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs font-medium tracking-widest uppercase text-blue-200/80">
            Enterprise Document Management
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/40 animate-fade-in-up animation-delay-200 drop-shadow-2xl">
          CRUXDOC <span className="text-blue-500">PORTAL</span>
        </h1>

        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed font-light animate-fade-in-up animation-delay-400">
          The ultra-secure, premium platform for candidate document collection and verification. Designed for speed, built for reliability.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-600 mb-32">
          <Link
            href="/apply"
            className="w-full sm:w-auto px-10 py-4 rounded-xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-500 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(59,130,246,0.4)] hover:shadow-[0_0_60px_rgba(59,130,246,0.6)]"
          >
            Submit Documents
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          
          <Link
            href="/login"
            className="w-full sm:w-auto px-10 py-4 rounded-xl glass-card border border-white/10 text-white font-semibold text-lg hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            Staff Login
          </Link>
        </div>

        {/* Security Grid Section */}
        <div className="w-full text-left animate-fade-in-up animation-delay-700">
          <div className="flex flex-col items-center text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Uncompromising <span className="text-blue-500">Security</span></h2>
            <p className="text-zinc-500 max-w-2xl text-sm md:text-base font-medium">Your data privacy is our absolute priority. We utilize military-grade infrastructure to process, validate, and purge your documents.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto relative">
             {/* Decorative glow behind grid */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-lg bg-blue-500/20 blur-[100px] rounded-full pointer-events-none" />
             
             {securityFeatures.map((feature, idx) => (
                <div 
                  key={idx} 
                  className={`glass-card p-8 rounded-[2rem] border border-white/5 hover:border-white/20 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10 relative overflow-hidden group ${idx === 3 ? "lg:col-span-1 lg:col-start-2 lg:-ml-1/2" : ""} ${idx === 4 ? "lg:col-span-1" : ""}`}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                        <feature.icon className={`h-7 w-7 ${feature.color}`} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{feature.title}</h3>
                    <p className="text-sm font-medium text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors">
                        {feature.desc}
                    </p>
                </div>
             ))}
          </div>
        </div>
      </main>

      {/* Footer Decoration */}
      <div className="relative z-10 w-full py-8 border-t border-white/5 mt-auto">
        <p className="text-[10px] md:text-xs tracking-widest uppercase font-bold text-zinc-600 text-center">
          &copy; 2026 CruxDoc Technology &bull; Secure &middot; Fast &middot; Premium
        </p>
      </div>
    </div>
  );
}
