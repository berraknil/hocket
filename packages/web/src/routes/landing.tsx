import { Header } from '../components/landing/header';
import { HeroSection } from '../components/landing/hero-section';
import { Footer } from '../components/landing/footer';
import { AuthProvider } from '../contexts/auth-context';

export function Component() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-stone-50">
        <Header />
        <main className="flex-1 flex items-center pt-16">
          <HeroSection />
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}
