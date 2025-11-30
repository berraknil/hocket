import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthGuard } from "../components/auth/auth-guard";
import { AuthProvider } from "../contexts/auth-context";
import { SketchProvider } from "../contexts/sketch-context";
import { SketchList } from "../components/sketch/sketch-list";
import { Header } from "../components/landing/header";
import { Footer } from "../components/landing/footer";
import { useAuth } from "../hooks/use-auth";
import { useSketch } from "../hooks/use-sketch";
import { SketchListItem } from "../lib/sketch-schema";
import { generateRandomSessionName } from "../lib/utils";

function DashboardContent() {
  const { session } = useAuth();
  const { sketches, isLoading, removeSketch, refreshSketches } = useSketch();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenSketch = (sketch: SketchListItem) => {
    const sessionName = generateRandomSessionName();
    navigate(`/s/${sessionName}?sketch=${encodeURIComponent(sketch.uri)}`);
  };

  const handleDeleteSketch = async (sketch: SketchListItem) => {
    if (!confirm("Are you sure you want to delete this sketch?")) {
      return;
    }

    setIsDeleting(true);
    try {
      await removeSketch(sketch.uri);
    } catch (error) {
      console.error("Failed to delete sketch:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNewSketch = () => {
    const sessionName = generateRandomSessionName();
    navigate(`/s/${sessionName}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Header />

      <main className="flex-1 mx-auto max-w-7xl px-6 pt-24 pb-20 lg:px-8 w-full">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-extralight tracking-tight text-stone-900 mb-2">
              Your Sketches
            </h1>
            <p className="text-sm text-stone-500 font-light">
              Signed in as {session?.handle}
            </p>
          </div>
          <button
            onClick={handleNewSketch}
            className="bg-stone-900 px-6 py-3 text-sm uppercase tracking-wider text-white hover:bg-stone-800 transition-all duration-300 font-light"
          >
            New Sketch
          </button>
        </div>

        <SketchList
          sketches={sketches}
          isLoading={isLoading || isDeleting}
          onOpen={handleOpenSketch}
          onDelete={handleDeleteSketch}
        />

        <div className="mt-8 text-center">
          <button
            onClick={() => refreshSketches()}
            className="text-sm text-stone-600 hover:text-stone-900 font-light"
          >
            Refresh
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export function Component() {
  return (
    <AuthProvider>
      <AuthGuard>
        <SketchProvider>
          <DashboardContent />
        </SketchProvider>
      </AuthGuard>
    </AuthProvider>
  );
}
