import { SketchListItem } from '../../lib/sketch-schema';
import { formatDistanceToNow } from '../../lib/date-utils';

interface SketchCardProps {
  sketch: SketchListItem;
  onOpen: (sketch: SketchListItem) => void;
  onDelete?: (sketch: SketchListItem) => void;
}

export function SketchCard({ sketch, onOpen, onDelete }: SketchCardProps) {
  const { value } = sketch;
  const createdAt = value.createdAt ? new Date(value.createdAt) : new Date();

  return (
    <div className="group relative bg-white rounded-lg border border-stone-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-stone-900 truncate">
            {value.name || 'Untitled Sketch'}
          </h3>
          <p className="mt-1 text-sm text-stone-500">
            {formatDistanceToNow(createdAt)}
          </p>
        </div>
      </div>
      
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={() => onOpen(sketch)}
          className="flex-1 rounded-md bg-stone-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-stone-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-600"
        >
          Open
        </button>
        {onDelete && (
          <button
            onClick={() => onDelete(sketch)}
            className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
