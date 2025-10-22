'use client';

import { useState } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';
import Image from 'next/image';
import { PRODUCT_TYPES } from '@/lib/constants';

interface ProductUploaderProps {
  uploadedImage: { url: string; path: string } | null;
  productType: string;
  onImageUpload: (file: File) => void;
  onProductTypeChange: (type: string) => void;
  onImageRemove: () => void;
}

export default function ProductUploader(props: ProductUploaderProps) {
  const {
    uploadedImage,
    productType,
    onImageUpload,
    onProductTypeChange,
    onImageRemove,
  } = props;
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">1. Upload Product Image</h2>
        {!uploadedImage ? (
          <ImageUploader onImageUpload={onImageUpload} />
        ) : (
          <div className="relative">
            <Image
              src={uploadedImage.url}
              alt="Uploaded product"
              width={200}
              height={200}
              className="rounded-lg"
            />
            <button
              onClick={onImageRemove}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
            >
              ×
            </button>
          </div>
        )}
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-4">2. Product Type</h2>
        <select
          value={productType}
          onChange={(e) => onProductTypeChange(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select product type</option>
          {PRODUCT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
