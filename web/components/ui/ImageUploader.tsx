'use client';

export default function ImageUploader({
  onImageUpload,
}: {
  onImageUpload: (file: File) => void;
}) {
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-lg p-10 mx-auto border-2 border-dashed rounded-lg border-gray-300">
      <input
        type="file"
        onChange={handleImageChange}
        className="hidden"
        id="image-upload"
      />
      <label
        htmlFor="image-upload"
        className="cursor-pointer flex flex-col items-center"
      >
        <div className="flex flex-col items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-12 h-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-500">
            Click to upload a file
          </p>
        </div>
      </label>
    </div>
  );
}