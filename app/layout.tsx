import type { Metadata } from "next";
import "./globals.css";
import { DeptNav } from "@/components/DeptNav";
import { EmployeeSelector } from "@/components/EmployeeSelector";
import { AdminUnlock } from "@/components/AdminUnlock";
import { EmployeeManager } from "@/components/EmployeeManager";
import { NotificationSettings } from "@/components/NotificationSettings";
import { getEmployees } from "@/app/actions/employees";

export const metadata: Metadata = {
  title: "Workplan Tracker",
  description: "Team task tracking across departments",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const employees = await getEmployees().catch(() => []);

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-indigo-800 shadow-lg">
          <div className="flex items-center justify-between px-5 py-3">
            {/* Left: brand + employee picker */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h1 className="text-base font-bold text-white tracking-tight">Workplan</h1>
              </div>
              <span className="w-px h-5 bg-white/20" />
              <EmployeeSelector employees={employees} />
            </div>

            {/* Right: employee manager + admin */}
            <div className="flex items-center gap-2">
              <EmployeeManager employees={employees} />
              <NotificationSettings />
              <AdminUnlock />
            </div>
          </div>
          <DeptNav />
        </header>

        <main className="flex-1 flex flex-col overflow-hidden">
          {children}
        </main>

      </body>
    </html>
  );
}
