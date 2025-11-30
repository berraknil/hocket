export function Footer() {
  return (
    <footer className="border-t border-stone-200/50 bg-stone-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500 font-light">
          {/* Attribution */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1">
            <span className="uppercase tracking-wider text-stone-400">Built with</span>
            <a
              href="https://flok.cc"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-stone-900 transition-colors"
            >
              Flok
            </a>
            <span className="text-stone-300">·</span>
            <a
              href="https://strudel.cc"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-stone-900 transition-colors"
            >
              Strudel
            </a>
            <span className="text-stone-300">·</span>
            <a
              href="https://hydra.ojack.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-stone-900 transition-colors"
            >
              Hydra
            </a>
            <span className="text-stone-300">·</span>
            <a
              href="https://tidalcycles.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-stone-900 transition-colors"
            >
              Tidal Cycles
            </a>
          </div>

          {/* Copyright */}
          <div className="text-stone-400">
            © {new Date().getFullYear()} Hocket
          </div>
        </div>
      </div>
    </footer>
  );
}
