// Full-width banner image spanning the very top edge of the page, outside
// the padded content column. Renders nothing until a logo is configured,
// so the layout doesn't show an empty gap before then.
export default function Banner() {
  const logoUrl = process.env.NEXT_PUBLIC_LOGO_URL;
  if (!logoUrl) return null;

  const schoolName = process.env.NEXT_PUBLIC_SCHOOL_NAME || "Al-Asaas Schools";

  return (
    <div className="w-full h-28 sm:h-36 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl}
        alt={`${schoolName} banner`}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
