import { useState } from 'react';
import { useAuth } from '../../hooks/use-auth';
import { useNavigate } from 'react-router-dom';

// Helper function to extract service from handle
function getServiceFromHandle(handle: string): string {
  // If it's an email, default to bsky.social
  if (handle.includes('@')) {
    return 'https://bsky.social';
  }

  // Extract domain from handle (e.g., username.bsky.social -> https://bsky.social)
  const parts = handle.split('.');
  if (parts.length >= 2) {
    const domain = parts.slice(-2).join('.');
    return `https://${domain}`;
  }

  // Default to bsky.social if we can't determine
  return 'https://bsky.social';
}

// Helper function to provide better error messages
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Handle specific error cases
    if (message.includes('invalid identifier or password')) {
      return 'Invalid handle or app password. Please check your credentials and try again.';
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'Unable to connect to the service. Please check your internet connection and try again.';
    }
    if (message.includes('service') || message.includes('pds')) {
      return 'Could not connect to the ATProto service. Please verify your handle format (e.g., username.bsky.social).';
    }
    if (message.includes('timeout')) {
      return 'Connection timeout. The service may be unavailable. Please try again later.';
    }
    
    // Return the original error message if we don't have a better one
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
}

export function SignInForm({ redirectUrl }: { redirectUrl?: string | null }) {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Auto-detect service from handle
      const service = getServiceFromHandle(identifier);
      await signIn(service, identifier, password);
      // Navigate to redirect URL or dashboard
      navigate(redirectUrl || '/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Form container with subtle border and refined spacing */}
      <div className="bg-white border border-stone-200/50 px-10 py-12">
        {/* Header section */}
        <div className="mb-10 space-y-2">
          <h2 className="text-4xl font-extralight tracking-tight text-stone-900">
            Sign In
          </h2>
          <p className="text-sm text-stone-500 font-light leading-relaxed">
            Authenticate with your ATProto account from any service
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Handle input */}
          <div>
            <label 
              className="block text-xs uppercase tracking-wider text-stone-500 font-light mb-3" 
              htmlFor="identifier"
            >
              Handle or Email
            </label>
            <input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="username.bsky.social"
              className="w-full px-4 py-3 border border-stone-300 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900 transition-colors duration-300 font-light"
              disabled={isLoading}
              required
              autoComplete="username"
            />
            <p className="mt-2 text-xs text-stone-500 font-light leading-relaxed">
              Enter your full handle including the service domain
            </p>
          </div>

          {/* Password input */}
          <div>
            <label 
              className="block text-xs uppercase tracking-wider text-stone-500 font-light mb-3" 
              htmlFor="password"
            >
              App Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="xxxx-xxxx-xxxx-xxxx"
              className="w-full px-4 py-3 border border-stone-300 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900 transition-colors duration-300 font-light"
              disabled={isLoading}
              required
              autoComplete="current-password"
            />
            <p className="mt-2 text-xs text-stone-500 font-light leading-relaxed">
              Generate an app password from your service's settings page
            </p>
          </div>

          {/* Error message with better styling */}
          {error && (
            <div className="border-l-2 border-red-500 bg-red-50/50 pl-4 pr-4 py-3">
              <p className="text-sm text-red-800 font-light leading-relaxed">{error}</p>
            </div>
          )}

          {/* Submit button matching landing page CTA style */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-stone-900 px-6 py-3 text-sm uppercase tracking-wider text-white hover:bg-stone-800 transition-all duration-300 font-light disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isLoading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Additional help text */}
        <div className="mt-8 pt-6 border-t border-stone-200/50">
          <p className="text-xs text-stone-500 font-light leading-relaxed">
            Don't have an account?{' '}
            <a 
              href="https://bsky.app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-stone-900 hover:underline"
            >
              Create one on Bluesky
            </a>
            {' '}or any other ATProto service.
          </p>
        </div>
      </div>
    </div>
  );
}
