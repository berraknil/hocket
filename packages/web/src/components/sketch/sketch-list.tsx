import { SketchListItem } from '../../lib/sketch-schema';
import { SketchCard } from './sketch-card';

interface SketchListProps {
  sketches: SketchListItem[];
  isLoading: boolean;
  onOpen: (sketch: SketchListItem) => void;
  onDelete?: (sketch: SketchListItem) => void;
}

export function SketchList({ sketches, isLoading, onOpen, onDelete }: SketchListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-stone-900 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-stone-600">Loading sketches...</p>
        </div>
      </div>
    );
  }

  if (sketches.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-stone-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-semibold text-stone-900">No sketches</h3>
        <p className="mt-1 text-sm text-stone-500">
          Get started by creating a new sketch.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sketches.map((sketch) => (
        <SketchCard
          key={sketch.uri}
          sketch={sketch}
          onOpen={onOpen}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
