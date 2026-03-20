import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateCandidateStatus, updateDocumentStatus, deleteDocument } from "@/lib/actions/verification";
import { auth } from "@/auth";
import { CopyButton } from "@/components/copy-button";
import { 
  User, 
  ArrowLeft, 
  ExternalLink, 
  CheckCircle2, 
  XSquare, 
  Clock,
  ShieldCheck,
  Building2,
  Phone,
  CreditCard,
  Trash2
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const candidate = await prisma.candidate.findUnique({
    where: { id },
    include: { documents: true },
  });

  if (!candidate) notFound();

  const role = session?.user.role;

  return (
    <div className="space-y-10 pb-20">
      {/* Header / Back Link */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
            <Link 
                href="/dashboard" 
                className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors group mb-4"
            >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
            </Link>
            <h2 className="text-4xl font-black tracking-tight text-foreground">
                {candidate.name}'s <span className="text-primary/80">Profile</span>
            </h2>
            <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 font-bold px-3 py-1 uppercase tracking-widest text-[10px]">
                    ID: {candidate.id}
                </Badge>
                <Badge 
                    className={`
                        font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider
                        ${candidate.status === "PENDING" ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"}
                    `}
                >
                  {candidate.status}
                </Badge>
            </div>
        </div>

        <div className="flex items-center gap-3">
            {role === "OPS" && candidate.status === "PENDING" && (
                <form action={async () => {
                    "use server";
                    await updateCandidateStatus(candidate.id, "OPS_VERIFIED");
                }}>
                    <Button type="submit" size="lg" className="rounded-2xl h-14 px-8 font-black shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground group">
                        <ShieldCheck className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                        Verify Documents Received
                    </Button>
                </form>
            )}
            {role === "VALIDATOR" && candidate.status === "OPS_VERIFIED" && (
                <form action={async () => {
                    "use server";
                    await updateCandidateStatus(candidate.id, "VALIDATED");
                }}>
                    <Button type="submit" size="lg" className="rounded-2xl h-14 px-8 font-black shadow-xl shadow-emerald-500/20 bg-emerald-500 hover:bg-emerald-600 text-white group">
                        <CheckCircle2 className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                        Final Approval
                    </Button>
                </form>
            )}
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-card p-6 rounded-3xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Building2 className="h-6 w-6" />
              </div>
              <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Employer</p>
                  <p className="text-base font-bold text-foreground">{candidate.employer || "N/A"}</p>
              </div>
          </div>
          <div className="glass-card p-6 rounded-3xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Phone className="h-6 w-6" />
              </div>
              <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Mobile</p>
                  <p className="text-base font-bold text-foreground">{candidate.mobileNumber || "N/A"}</p>
              </div>
          </div>
          <div className="glass-card p-6 rounded-3xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
                  <CreditCard className="h-6 w-6" />
              </div>
              <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Employee ID</p>
                  <p className="text-base font-bold text-foreground">{candidate.employeeId || "N/A"}</p>
              </div>
          </div>
          <div className="glass-card p-6 rounded-3xl flex items-center justify-between border-primary/20 bg-primary/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <ExternalLink className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Submission Link</p>
                    <p className="text-xs font-medium text-muted-foreground">Ready to share</p>
                </div>
              </div>
              <CopyButton token={candidate.token} variant="default" size="icon" />
          </div>
      </div>

      {/* Documents Grid */}
      <div className="space-y-6">
        <h3 className="text-2xl font-black px-2">Uploaded Documents</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {candidate.documents.map((doc: any) => (
            <div key={doc.id} className="group animate-in fade-in zoom-in duration-500">
              <div className="glass-card rounded-[2rem] overflow-hidden flex flex-col h-full border-white/20 hover:border-primary/30 transition-all hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1">
                <div className="p-6 pb-2">
                  <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary">{doc.type}</span>
                      <Badge 
                        variant="secondary"
                        className={`
                            text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter
                            ${doc.status === "VERIFIED" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : doc.status === "REJECTED" ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"}
                        `}
                      >
                        {doc.status}
                      </Badge>
                  </div>
                </div>

                <div className="mx-6 aspect-square bg-accent/20 rounded-2xl overflow-hidden relative group">
                  <img src={doc.fileUrl} alt={doc.type} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" className="rounded-xl bg-white text-black hover:bg-white/90 font-bold border-none shadow-lg scale-90 group-hover:scale-100 transition-transform">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Full
                          </Button>
                      </a>
                  </div>
                </div>

                <div className="p-6 mt-auto">
                    <div className="flex gap-3 justify-center">
                        {role === "VALIDATOR" && (
                          <>
                            <form action={async () => {
                              "use server";
                              await updateDocumentStatus(doc.id, "VERIFIED");
                            }}>
                                <Button type="submit" size="sm" className="h-10 w-16 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white border-emerald-500/20 transition-all font-bold group">
                                    <CheckCircle2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                </Button>
                            </form>
                            <form action={async () => {
                              "use server";
                              await updateDocumentStatus(doc.id, "REJECTED", "Incomplete or Blur");
                            }}>
                                <Button type="submit" size="sm" variant="ghost" className="h-10 w-16 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white border-destructive/20 transition-all font-bold group">
                                    <XSquare className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                </Button>
                            </form>
                          </>
                        )}
                        
                        {/* Only Admin and Ops can permanently delete a corrupted document */}
                        {(role === "ADMIN" || role === "OPS") && (
                            <form action={async () => {
                              "use server";
                              await deleteDocument(doc.id, candidate.id);
                            }}>
                                <Button type="submit" size="sm" variant="ghost" className="h-10 w-16 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white border-red-500/20 transition-all font-bold group" title="Delete corrupted document to allow re-upload">
                                    <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                </Button>
                            </form>
                        )}
                    </div>
                </div>
              </div>
            </div>
          ))}
          {candidate.documents.length === 0 && (
            <div className="col-span-full h-60 flex flex-col items-center justify-center space-y-4 glass-card rounded-[2rem]">
                <Clock className="h-12 w-12 text-muted-foreground animate-pulse" />
                <p className="text-muted-foreground font-bold italic tracking-tight">No documents uploaded yet...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
