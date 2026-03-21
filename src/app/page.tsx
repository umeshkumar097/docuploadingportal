import Link from "next/link";
import { Shield, Lock, FileCheck, Server, Trash2 } from "lucide-react";
import { AnimatedBackground } from "@/components/animated-background";

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
      {/* Premium Live Animated Background */}
      <AnimatedBackground />

      {/* Hero Content */}
      <main className="relative z-10 w-full max-w-6xl px-6 pt-32 pb-20 text-center flex flex-col items-center">
        {/* Main Background Ambient Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none opacity-50 mix-blend-screen" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 blur-[150px] rounded-full pointer-events-none opacity-50 mix-blend-screen" />

        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.05)] mb-10 animate-fade-in-up hover:bg-white/10 transition-colors">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
          </span>
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-blue-100">
            Enterprise Document Management
          </span>
        </div>

        <h1 className="text-6xl md:text-8xl lg:text-[7.5rem] font-black tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white via-white/95 to-white/60 animate-fade-in-up animation-delay-200 drop-shadow-2xl leading-[1.1]">
          CRUXDOC <br className="md:hidden" /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 hidden md:inline">PORTAL</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 md:hidden">PORTAL</span>
        </h1>

        <p className="text-lg md:text-2xl text-zinc-400/90 max-w-3xl mx-auto mb-14 leading-relaxed font-light animate-fade-in-up animation-delay-400">
          The ultra-secure, premium platform for candidate document collection and verification. <span className="text-zinc-200 font-medium">Designed for speed, built for reliability.</span>
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 animate-fade-in-up animation-delay-600 mb-40 relative z-20 flex-wrap">
          <Link
            href="/apply"
            className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg hover:from-blue-500 hover:to-indigo-500 transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(79,70,229,0.4)] hover:shadow-[0_0_60px_rgba(79,70,229,0.6)] ring-1 ring-white/20"
          >
            Submit Documents
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl text-white font-semibold text-lg hover:bg-white/10 hover:border-white/20 transition-all active:scale-[0.98] flex items-center justify-center shadow-xl"
            >
              Admin/Ops Login
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl text-white font-semibold text-lg hover:bg-white/10 hover:border-white/20 transition-all active:scale-[0.98] flex items-center justify-center shadow-xl"
            >
              Company/Agency Login
            </Link>
          </div>
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
                  className={`bg-black/40 backdrop-blur-2xl p-8 rounded-[2rem] border border-white/10 hover:border-white/20 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_40px_rgba(59,130,246,0.15)] hover:bg-black/60 relative overflow-hidden group ${idx === 3 ? "lg:col-span-1 lg:col-start-2 lg:-ml-1/2" : ""} ${idx === 4 ? "lg:col-span-1" : ""}`}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 ring-1 ring-white/5`}>
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
      <div className="relative z-10 w-full py-8 border-t border-white/5 mt-auto bg-black/50 backdrop-blur-md">
        <div className="flex flex-col items-center justify-center gap-2">
            <p className="text-[10px] md:text-xs tracking-widest uppercase font-bold text-zinc-600 text-center">
              &copy; {new Date().getFullYear()} CruxDoc Technology &bull; Secure &middot; Fast &middot; Premium
            </p>
            <p className="text-[10px] tracking-widest uppercase font-bold text-zinc-600 text-center">
              Developed by <a href="https://aiclex.in" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400 transition-colors">Aiclex Technologies</a>
            </p>
        </div>
      </div>
    </div>
  );
}
