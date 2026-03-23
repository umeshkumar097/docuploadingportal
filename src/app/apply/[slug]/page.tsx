import { CandidateFormPublic } from "@/components/candidate-form-public";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ApplyClientPage({ params }: { params: { slug: string } }) {
  const client = await prisma.client.findUnique({
    where: { slug: params.slug },
  });

  if (!client) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background relative overflow-hidden font-sans pt-12 pb-24 px-4 sm:px-6 lg:px-8">
      {/* Premium Gradient Backgrounds */}
      <div className="absolute top-0 left-0 -translate-y-12 -translate-x-1/3 opacity-20 pointer-events-none">
        <div className="w-[40rem] h-[40rem] bg-primary/30 rounded-full blur-3xl mix-blend-screen" />
      </div>
      <div className="absolute bottom-0 right-0 translate-y-1/4 translate-x-1/3 opacity-20 pointer-events-none">
        <div className="w-[40rem] h-[40rem] bg-emerald-500/20 rounded-full blur-3xl mix-blend-screen" />
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto">
         <CandidateFormPublic clientId={client.id} clientName={client.name} />
      </div>
    </main>
  );
}
