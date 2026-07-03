/** The signature element: a spinning 45rpm record with a tennis-ball label. */
export function Vinyl({ size = 120, spinning = false }: { size?: number; spinning?: boolean }) {
  return (
    <div
      className={spinning ? 'animate-spin-slow' : ''}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <circle cx="50" cy="50" r="49" fill="#22301F" />
        <circle cx="50" cy="50" r="46" fill="none" stroke="#3a4a35" strokeWidth="0.6" />
        <circle cx="50" cy="50" r="41" fill="none" stroke="#3a4a35" strokeWidth="0.6" />
        <circle cx="50" cy="50" r="36" fill="none" stroke="#3a4a35" strokeWidth="0.6" />
        <circle cx="50" cy="50" r="31" fill="none" stroke="#3a4a35" strokeWidth="0.6" />
        <circle cx="50" cy="50" r="24" fill="#D7E14C" />
        {/* tennis ball seams on the label */}
        <path d="M 33 34 Q 50 50 33 66" fill="none" stroke="#FBF7EF" strokeWidth="2.2" />
        <path d="M 67 34 Q 50 50 67 66" fill="none" stroke="#FBF7EF" strokeWidth="2.2" />
        <circle cx="50" cy="50" r="3" fill="#22301F" />
      </svg>
    </div>
  );
}
