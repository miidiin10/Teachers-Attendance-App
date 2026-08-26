// Small, unobtrusive credit badge shown on every page - a frosted-glass
// pill in the bottom-right corner, muted enough not to distract from the
// app itself but still legible.
export default function BrandBadge() {
  return (
    <div className="fixed bottom-3 right-3 z-50 pointer-events-none">
      <span className="text-[10px] tracking-wide text-slate-400/80 bg-white/50 backdrop-blur-sm px-2 py-1 rounded-full border border-white/60 shadow-sm">
        Built by meeddev
      </span>
    </div>
  );
}
