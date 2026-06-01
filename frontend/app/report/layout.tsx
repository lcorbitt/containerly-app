/** Standalone routes (no public nav or authenticated shell). */
export default function ReportLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <main className="flex min-h-full flex-1 flex-col">{children}</main>;
}
