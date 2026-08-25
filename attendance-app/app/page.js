import Link from "next/link";

export default function Home() {
  return (
    <main className="pt-16 text-center space-y-6">
      <h1 className="text-2xl font-bold">Teacher Attendance</h1>
      <p className="text-slate-500">Scan the QR code at the entrance to check in.</p>
      <div className="flex flex-col gap-3 pt-4">
        <Link href="/checkin" className="bg-slate-900 text-white rounded-xl py-3 font-medium">
          Check In
        </Link>
        <Link href="/leaderboard" className="border border-slate-300 rounded-xl py-3 font-medium">
          View Leaderboard
        </Link>
      </div>
    </main>
  );
}
