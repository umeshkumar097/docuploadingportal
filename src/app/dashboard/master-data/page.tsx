import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { MasterDataUpload } from "@/components/master-data-upload";

export const metadata = {
  title: 'Master Data Upload | CruxDoc',
}

export default async function MasterDataPage() {
  const session = await auth();

  const role = session?.user?.role as any;
  if (!session || (role !== "ADMIN" && role !== "VENDOR")) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-foreground tracking-tight">Master Data Management</h1>
        <p className="text-muted-foreground mt-2 font-medium">
          Upload your official candidate Excel or CSV files to automatically map and populate candidate records.
          This enables instant auto-filling when candidates enter their Employee ID on the public form.
        </p>
      </div>
      
      <MasterDataUpload />
    </div>
  );
}
