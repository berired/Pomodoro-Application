export default function Footer(): React.JSX.Element {
  return (
    <footer className="border-t border-border mt-8 py-4 px-6 text-center font-mono">
      <div className="text-muted-foreground text-sm tracking-widest uppercase">
        <span className="text-primary opacity-60">█</span>
        {' '}
        <span className="font-[family-name:var(--font-display)] text-base">
          © {new Date().getFullYear()} David Xander Wagan
        </span>
        {' '}
        <span className="text-primary opacity-40">{'// '}</span>
        {' '}
        <span className="text-xs opacity-50">All rights reserved</span>
        {' '}
        <span className="text-primary opacity-60">█</span>
      </div>
      <div className="text-primary opacity-20 text-xs mt-1 tracking-[0.5em]">
        ─────────────────────────────
      </div>
    </footer>
  )
}
