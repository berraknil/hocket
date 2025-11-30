import { SignInForm } from '../../components/auth/sign-in-form';
import { useAuth } from '../../hooks/use-auth';
import { Navigate, useSearchParams } from 'react-router-dom';
import { AuthProvider } from '../../contexts/auth-context';
import { Header } from '../../components/landing/header';
import { Footer } from '../../components/landing/footer';

function SignInContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-50">
        <Header />
        <div className="flex-1 flex items-center justify-center pt-16">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-stone-900 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-stone-600 font-light">Loading...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isAuthenticated) {
    // Redirect to the originally requested URL or dashboard
    const destination = redirectUrl || '/dashboard';
    return <Navigate to={destination} replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-16">
        <SignInForm redirectUrl={redirectUrl} />
      </main>
      <Footer />
    </div>
  );
}

export function Component() {
  return (
    <AuthProvider>
      <SignInContent />
    </AuthProvider>
  );
}
