// Deliberately not "use client" - this can render on the server, and
// reading a NEXT_PUBLIC_ env var works fine there too.
export default function Header() {
  const schoolName = process.env.NEXT_PUBLIC_SCHOOL_NAME || "Al-Asaas Schools";
  const logoUrl = process.env.NEXT_PUBLIC_LOGO_URL;

  // The full-width Banner component already shows the logo image edge to
  // edge above this - avoid showing it twice, just show the name here.
  if (logoUrl) {
    return (
      <div className="pt-3 pb-4">
        <span className="font-semibold text-slate-700">{schoolName}</span>
      </div>
    );
  }

  const initials = schoolName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center gap-3 pb-4">
      <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm shrink-0">
        {initials || "A"}
      </div>
      <span className="font-semibold text-slate-700">{schoolName}</span>
    </div>
  );
}
