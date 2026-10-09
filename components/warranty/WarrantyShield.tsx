// "2 YEAR WARRANTY" shield badge (decorative; the H1 says the same thing)
export default function WarrantyShield({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 260" className={className} aria-hidden focusable="false">
      <path d="M110 6 206 40v78c0 66-42 112-96 136C56 230 14 184 14 118V40Z" fill="#ffffff" />
      <path d="M110 22 192 51v67c0 56-35 96-82 117-47-21-82-61-82-117V51Z" fill="#112a52" stroke="#006ea6" strokeWidth="3" />
      <text x="110" y="122" textAnchor="middle" fill="#ffffff" fontSize="78" fontWeight="800" fontFamily="inherit">
        2
      </text>
      <text x="110" y="152" textAnchor="middle" fill="#ffffff" fontSize="22" fontWeight="800" letterSpacing="3" fontFamily="inherit">
        YEAR
      </text>
      <path d="M0 160h220l-12 18 12 18H0l12-18Z" fill="#b9520a" />
      <text x="110" y="185" textAnchor="middle" fill="#ffffff" fontSize="22" fontWeight="800" letterSpacing="3" fontFamily="inherit">
        WARRANTY
      </text>
      <path d="M86 214l3 6 6 1-4 4 1 6-6-3-5 3 1-6-4-4 6-1Zm24 0l3 6 6 1-4 4 1 6-6-3-5 3 1-6-4-4 6-1Zm24 0l3 6 6 1-4 4 1 6-6-3-5 3 1-6-4-4 6-1Z" fill="#e86e00" />
    </svg>
  )
}
