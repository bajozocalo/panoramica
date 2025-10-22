'use client';

import Image from 'next/image';
import EmptyState from './EmptyState';

interface GeneratedImage {
  url:string;
  prompt: string;
}

export default function ImageList({ images }: { images: GeneratedImage[] }) {
  if (images.length === 0) {
    return (
      <EmptyState
        title="No images generated"
        description="Generate some images to see them here."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {images.map((image, index) => (
        <div
          key={index}
          className="w-full h-48 bg-gray-200 rounded-lg overflow-hidden"
        >
          <Image
            src={image.url}
            alt={`Generated image ${index + 1}`}
            width={500}
            height={500}
            className="object-cover w-full h-full"
          />
        </div>
      ))}
    </div>
  );
}