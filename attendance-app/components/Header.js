// Deliberately not "use client" - renders on the server just fine.
// The bundled /public/logo.jpg is Al-Asaas Schools' own logo, so it should
// only be used as a fallback for THAT school specifically - not for every
// future clone of this app. A different school that hasn't set its own
// NEXT_PUBLIC_LOGO_URL yet gets the neutral initials circle instead, never
// someone else's logo by accident.
export default function Header() {
  const schoolName = process.env.NEXT_PUBLIC_SCHOOL_NAME || "Al-Asaas Schools";
  const isDefaultSchool = !process.env.NEXT_PUBLIC_SCHOOL_NAME || schoolName === "Al-Asaas Schools";
  const logoUrl = process.env.NEXT_PUBLIC_LOGO_URL || (isDefaultSchool ? "/logo.jpg" : null);

  if (logoUrl) {
    return (
      <div className="pt-2 pb-4 flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt={`${schoolName} logo`}
          className="w-full max-w-[260px] h-auto"
        />
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
