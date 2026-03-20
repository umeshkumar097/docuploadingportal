import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateCandidateStatus, updateDocumentStatus } from "@/lib/actions/verification";
import { auth } from "@/auth";

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">{candidate.name}'s Details</h2>
        <Badge variant="outline" className="text-lg px-4 py-1">{candidate.status}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {candidate.documents.map((doc) => (
          <Card key={doc.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex justify-between">
                {doc.type}
                <Badge variant={doc.status === "VERIFIED" ? "default" : doc.status === "REJECTED" ? "destructive" : "outline"}>
                  {doc.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-square bg-slate-100 rounded-md overflow-hidden flex items-center justify-center border">
                <img src={doc.fileUrl} alt={doc.type} className="object-contain w-full h-full" />
              </div>
              <div className="flex flex-col gap-2">
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="w-full">View Full Res</Button>
                </a>
                {role === "VALIDATOR" && (
                  <div className="flex gap-2 justify-between">
                     <form action={async () => {
                       "use server";
                       await updateDocumentStatus(doc.id, "VERIFIED");
                     }}>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">✅</Button>
                     </form>
                     <form action={async () => {
                       "use server";
                       await updateDocumentStatus(doc.id, "REJECTED", "Incomplete");
                     }}>
                        <Button size="sm" variant="destructive">❌</Button>
                     </form>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end gap-4 mt-8">
        {role === "OPS" && candidate.status === "PENDING" && (
           <form action={async () => {
             "use server";
             await updateCandidateStatus(candidate.id, "OPS_VERIFIED");
           }}>
              <Button size="lg">Verify Docs Received</Button>
           </form>
        )}
        {role === "VALIDATOR" && candidate.status === "OPS_VERIFIED" && (
           <form action={async () => {
             "use server";
             await updateCandidateStatus(candidate.id, "VALIDATED");
           }}>
              <Button size="lg" className="bg-green-600 hover:bg-green-700">Approve Candidate</Button>
           </form>
        )}
      </div>
    </div>
  );
}
