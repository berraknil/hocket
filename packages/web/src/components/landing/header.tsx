import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/use-auth';

export function Header() {
  const { isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md">
      <nav className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="group flex items-center">
              <span className="text-lg font-light tracking-wide text-stone-900 relative inline-block">
                <span className="inline-block transition-all duration-700 ease-in-out group-hover:opacity-0">
                  H0CK3T
                </span>
                <span className="absolute inset-0 inline-block transition-all duration-700 ease-in-out opacity-0 group-hover:opacity-100">
                  HOCKET
                </span>
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-8">
            {isAuthenticated && (
              <Link
                to="/dashboard"
                className="text-sm font-normal text-stone-600 hover:text-stone-900 transition-colors"
              >
                Dashboard
              </Link>
            )}
            <Link
              to={`/s/${generateSessionName()}`}
              className="text-sm font-normal text-stone-600 hover:text-stone-900 transition-colors"
            >
              Playground
            </Link>
            {!isAuthenticated ? (
              <Link
                to="/auth/sign-in"
                className="text-sm font-normal text-stone-600 hover:text-stone-900 transition-colors"
              >
                Sign In
              </Link>
            ) : (
              <button
                onClick={handleSignOut}
                className="text-sm font-normal text-stone-600 hover:text-stone-900 transition-colors"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

function generateSessionName(): string {
  const adjectives = ['swift', 'bright', 'cosmic', 'lunar', 'stellar', 'quantum', 'neural', 'sonic'];
  const nouns = ['wave', 'pulse', 'beam', 'flow', 'spark', 'drift', 'glow', 'beat'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${adj}-${noun}-${num}`;
}
