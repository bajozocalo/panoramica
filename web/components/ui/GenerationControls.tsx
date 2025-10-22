'use client';

interface GenerationControlsProps {
  uploadedImage: { url: string; path: string } | null;
  selectedScenes: string[];
  productType: string;
  generating: boolean;
  error: string | null;
  onGenerate: () => void;
}

export default function GenerationControls(props: GenerationControlsProps) {
  const {
    uploadedImage,
    selectedScenes,
    productType,
    generating,
    error,
    onGenerate,
  } = props;
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      <button
        onClick={onGenerate}
        disabled={
          !uploadedImage ||
          selectedScenes.length === 0 ||
          !productType ||
          generating
        }
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {generating ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Generating...
          </span>
        ) : (
          `Generate ${selectedScenes.length} Photo${
            selectedScenes.length > 1 ? 's' : ''
          } (${selectedScenes.length} credit${
            selectedScenes.length > 1 ? 's' : ''
          })`
        )}
      </button>
    </div>
  );
}
