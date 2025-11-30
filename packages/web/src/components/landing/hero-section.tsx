import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/use-auth";

export function HeroSection() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="relative w-full overflow-hidden">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="grid"
              width="50"
              height="50"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 50 0 L 0 0 0 50"
                fill="none"
                stroke="black"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Main content container */}
      <div className="relative w-full max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 items-center">
          {/* Left side - Main headline */}
          <div className="lg:col-span-7">
            <div className="space-y-4">
              {/* Small label */}
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-[0.3em] text-stone-400 font-light">
                  Live Coding Platform
                </div>
                <div className="text-xs uppercase tracking-[0.3em] text-stone-500 font-light">
                  Built on top of AtProto
                </div>
              </div>

              {/* Large sculptural text */}
              <h1 className="relative">
                <div className="text-[clamp(3rem,12vw,9rem)] font-extralight leading-[0.9] tracking-[-0.02em] text-stone-900">
                  ALGORAVE
                </div>
                <div className="text-[clamp(2rem,8vw,6rem)] font-light leading-[0.9] tracking-[-0.01em] text-stone-600 mt-2">
                  but make it{" "}
                  <span className="italic text-stone-900">online</span>
                </div>
              </h1>

              {/* Subtitle */}
              <p className="text-base text-stone-500 max-w-md leading-relaxed pt-4 font-light">
                Collaborative live coding in the browser, built on AtProto.
                Create algorithmic music and visuals, share sessions, and
                perform with code in real-time.
              </p>
            </div>

            {/* CTA buttons */}
            <div className="mt-12 flex flex-col sm:flex-row items-start gap-3">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="group inline-flex items-center gap-2 bg-stone-900 px-6 py-3 text-sm uppercase tracking-wider text-white hover:bg-stone-800 transition-all duration-300 font-light"
                >
                  Go to Dashboard
                  <svg
                    className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </Link>
              ) : (
                <>
                  <Link
                    to={`/s/${generateSessionName()}`}
                    className="group inline-flex items-center gap-2 bg-stone-900 px-6 py-3 text-sm uppercase tracking-wider text-white hover:bg-stone-800 transition-all duration-300 font-light"
                  >
                    Start Jamming
                    <svg
                      className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </Link>
                  <Link
                    to="/auth/sign-in"
                    className="inline-flex items-center gap-2 border border-stone-300 px-6 py-3 text-sm uppercase tracking-wider text-stone-900 hover:bg-stone-100 transition-all duration-300 font-light"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Right side - Features grid */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-6">
              <FeatureItem
                number="01"
                title="Real-time Collaboration"
                description="Code together with others in shared sessions"
              />
              <FeatureItem
                number="02"
                title="Audio + Visual Synthesis"
                description="Combine Strudel patterns with Hydra visuals"
              />
              <FeatureItem
                number="03"
                title="No Installation Required"
                description="Everything runs directly in your browser"
              />
              <FeatureItem
                number="04"
                title="AtProto Authentication"
                description="Authenticate with any ATProto account from any platform"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="group border-l border-stone-200 pl-6 hover:border-stone-900 transition-colors duration-300">
      <div className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mb-2 font-light">
        {number}
      </div>
      <h3 className="text-lg font-light text-stone-900 mb-1 tracking-tight">
        {title}
      </h3>
      <p className="text-sm text-stone-500 leading-relaxed font-light">
        {description}
      </p>
    </div>
  );
}

function generateSessionName(): string {
  const adjectives = [
    "swift",
    "bright",
    "cosmic",
    "lunar",
    "stellar",
    "quantum",
    "neural",
    "sonic",
  ];
  const nouns = [
    "wave",
    "pulse",
    "beam",
    "flow",
    "spark",
    "drift",
    "glow",
    "beat",
  ];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${adj}-${noun}-${num}`;
}
