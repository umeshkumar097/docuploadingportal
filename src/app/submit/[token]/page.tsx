import { getCandidateByToken } from "@/lib/actions/candidate";
import { notFound } from "next/navigation";
import { CandidateForm } from "@/components/candidate-form";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

export default async function SubmitPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const candidate = await getCandidateByToken(token);

  if (!candidate) {
    notFound();
  }

  const isAlreadySubmitted = candidate.status === "READY" || candidate.status === "READY_FOR_BATCH";

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/premium-bg.png"
          alt="Background"
          fill
          className="object-cover scale-105 blur-[2px]"
          priority
        />
        <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-[2px]" />
      </div>

      <main className="relative z-10 w-full max-w-5xl py-12 md:py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {isAlreadySubmitted ? (
          <div className="glass-card p-12 md:p-20 rounded-[3rem] text-center space-y-8 max-w-2xl mx-auto shadow-2xl backdrop-blur-2xl border-white/40">
            <div className="w-24 h-24 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
                Submission <span className="text-emerald-500">Verified</span>
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Your documents have been validated and the process is complete. <br className="hidden md:block" />
                No further action is required from your side.
              </p>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in duration-1000">
            <CandidateForm candidateId={candidate.id} initialData={candidate} />
          </div>
        )}
      </main>
    </div>
  );
}
