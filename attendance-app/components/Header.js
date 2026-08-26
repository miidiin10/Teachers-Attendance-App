// Deliberately not "use client" - renders on the server just fine.
// Uses the bundled /public/logo.jpg by default; NEXT_PUBLIC_LOGO_URL can
// override it later (e.g. to swap logos without touching code).
export default function Header() {
  const logoUrl = process.env.NEXT_PUBLIC_LOGO_URL || "/logo.jpg";
  const schoolName = process.env.NEXT_PUBLIC_SCHOOL_NAME || "Al-Asaas Schools";

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
