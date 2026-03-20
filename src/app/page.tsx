import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black text-white">
      {/* Premium Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero-bg.png"
          alt="Premium Background"
          fill
          className="object-cover opacity-60 scale-105 animate-pulse-slow"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black" />
      </div>

      {/* Content */}
      <main className="relative z-10 w-full max-w-5xl px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-white/10 mb-8 animate-fade-in-up">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs font-medium tracking-widest uppercase text-blue-200/80">
            Enterprise Document Management
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/40 animate-fade-in-up animation-delay-200">
          CRUXDOC <span className="text-blue-500">PORTAL</span>
        </h1>

        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light animate-fade-in-up animation-delay-400">
          The ultra-secure, premium platform for candidate document collection and verification. Designed for speed, built for reliability.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-600">
          <Link
            href="/login"
            className="w-full sm:w-auto px-10 py-4 rounded-xl bg-white text-black font-bold text-lg hover:bg-zinc-200 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
          >
            Access Portal
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          
          <Link
            href="/login"
            className="w-full sm:w-auto px-10 py-4 rounded-xl glass-card border border-white/10 text-white font-semibold text-lg hover:bg-white/10 transition-all active:scale-95"
          >
            Learn More
          </Link>
        </div>
      </main>

      {/* Footer Decoration */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 opacity-40">
        <p className="text-xs tracking-widest uppercase font-medium text-zinc-500">
          &copy; 2026 CruxDoc Technology &bull; Secure &middot; Fast &middot; Premium
        </p>
      </div>
    </div>
  );
}
