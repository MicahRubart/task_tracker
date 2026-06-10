import type { Metadata } from "next";
import "./globals.css";
import { DeptNav } from "@/components/DeptNav";
import { EmployeeSelector } from "@/components/EmployeeSelector";
import { AdminUnlock } from "@/components/AdminUnlock";
import { EmployeeManager } from "@/components/EmployeeManager";
import { getEmployees } from "@/app/actions/employees";

export const metadata: Metadata = {
  title: "Workplan Tracker",
  description: "Team task tracking across departments",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const employees = await getEmployees();

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">Workplan</h1>
              <span className="w-px h-5 bg-gray-200" />
              <EmployeeSelector employees={employees} />
            </div>
            <div className="flex items-center gap-2">
              <EmployeeManager employees={employees} />
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
