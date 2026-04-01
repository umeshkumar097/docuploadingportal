"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { 
  LayoutDashboard, 
  CheckSquare, 
  ClipboardCheck, 
  History, 
  LogOut, 
  Menu, 
  X,
  User,
  Activity,
  FileText,
  Database,
  Building2,
  Globe,
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavItem {
  label: string;
  href: string;
  icon: any;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
  hideFromVendor?: boolean;
}

const navItems: NavItem[] = [
  { label: "Candidates Workspace", href: "/dashboard", icon: LayoutDashboard },
  { label: "Master Data", href: "/dashboard/master-data", icon: Database },
  { label: "Clients", href: "/dashboard/godeye?tab=clients", icon: Globe, adminOnly: true },
  { label: "Addresses", href: "/dashboard/addresses", icon: MapPin, adminOnly: true },
  { label: "Certified DRA", href: "/dashboard/dra-certified", icon: ClipboardCheck },
  { label: "Outreach Tracking", href: "/dashboard/outreach", icon: Building2, adminOnly: true },
];

export function DashboardNav({ email, role, vendorName }: { email: string; role: string; vendorName?: string | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-background border-b sticky top-0 z-30">
        <h1 className="font-bold text-xl text-primary tracking-tight">CruxDoc</h1>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-card border-r flex flex-col transition-transform duration-300 transform
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:relative lg:translate-x-0
      `}>
        <div className="p-8 border-b">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold group-hover:scale-110 transition-transform">
              C
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight">CruxDoc</h1>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em]">
                {role} Portal
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-6 space-y-2 mt-4">
          {navItems.map((item) => {
            if (item.adminOnly && role !== "ADMIN" && role !== "SUPERADMIN") return null;
            if (item.superAdminOnly && role !== "SUPERADMIN") return null;
            if (item.hideFromVendor && role === "VENDOR") return null;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center gap-3 p-4 rounded-2xl transition-all duration-200 group
                  ${isActive 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]" 
                    : "hover:bg-accent text-muted-foreground hover:text-foreground hover:translate-x-1"}
                `}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "text-primary-foreground" : "group-hover:text-primary transition-colors"}`} />
                <span className="text-sm font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t mt-auto">
          <div className="bg-accent/50 rounded-2xl p-4 mb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <User className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground truncate max-w-[150px]">{email}</span>
                <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest flex items-center gap-1">
                    {role === "VENDOR" ? vendorName : role}
                    <div className="w-1 h-1 rounded-full bg-primary/40" />
                    {role === "VENDOR" ? "VENDOR" : "PORTAL"}
                </span>
            </div>
          </div>
          
             <Button 
                variant="ghost" 
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full justify-start gap-4 h-12 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 px-4 group"
             >
                <LogOut className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                <span className="font-bold">Logout</span>
             </Button>
        </div>
      </aside>
    </>
  );
}
