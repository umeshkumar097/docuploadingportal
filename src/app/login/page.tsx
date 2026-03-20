"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid credentials. Please try again.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/Users/aiclex/.gemini/antigravity/brain/9c0e040f-5e69-45fa-ba50-555f135200c7/premium_bg_1773979450161.png"
          alt="Background"
          fill
          className="object-cover scale-105 blur-[2px]"
          priority
        />
        <div className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-[1px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="glass-card p-8 md:p-10 rounded-3xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
              CruxDoc Portal
            </h1>
            <p className="text-muted-foreground text-sm uppercase tracking-widest font-medium">
              Admin Access
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold ml-1 text-muted-foreground uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full h-12 bg-white/50 dark:bg-black/20 border border-white/30 dark:border-white/10 rounded-2xl px-4 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 backdrop-blur-md"
                placeholder="admin@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold ml-1 text-muted-foreground uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full h-12 bg-white/50 dark:bg-black/20 border border-white/30 dark:border-white/10 rounded-2xl px-4 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 backdrop-blur-md"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="premium-button w-full h-13 bg-primary text-primary-foreground rounded-2xl font-bold text-base shadow-lg hover:shadow-primary/30 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <svg 
                    className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-muted-foreground/60 text-[10px] uppercase tracking-tighter">
            © 2026 CruxDoc Technologies. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
