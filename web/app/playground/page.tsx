'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { BeforeAfterSlider } from '@/components/ui/BeforeAfterSlider';

export default function PlaygroundPage() {
  const { toast } = useToast();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit for playground
        toast({
          title: 'Image too large',
          description: 'Please upload an image smaller than 5MB.',
          variant: 'destructive',
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setOriginalImage(e.target?.result as string);
        setProcessedImage(null); // Reset processed image on new upload
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSampleImage = () => {
    setOriginalImage('https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2');
    setProcessedImage('https://images.pexels.com/photos/7292737/pexels-photo-7292737.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2');
  };

  const handleProcessImage = async () => {
    if (!originalImage) return;
    setIsLoading(true);
    // Simulate AI processing
    setTimeout(() => {
      // In a real implementation, this would be a call to a backend function
      // that returns the URL of the processed image.
      // For now, we'll just use a placeholder.
      setProcessedImage('https://images.pexels.com/photos/7292737/pexels-photo-7292737.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2');
      setIsLoading(false);
      toast({
        title: 'Processing Complete!',
        description: 'Your image background has been magically replaced.',
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <Image
                src="/panoramicalogo.png"
                alt="Panoramica.digital Logo"
                width={90}
                height={18}
              />
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/auth/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Editor Online Playground
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Try our AI Background tool for free. Upload your product photo or use a sample image to see the magic.
          </p>
        </div>

        <Card className="w-full">
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 h-full">
              <Label htmlFor="image-upload" className="cursor-pointer text-center">
                <Sparkles className="mx-auto h-12 w-12 text-gray-400" />
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Click to upload an image
                </span>
                <span className="mt-1 block text-xs text-gray-500">
                  PNG, JPG, WEBP up to 5MB
                </span>
              </Label>
              <Input id="image-upload" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              <Button variant="link" onClick={handleSampleImage} className="mt-4">
                Or try a sample image
              </Button>
            </div>

            <div className="relative aspect-square w-full max-w-md mx-auto">
              {originalImage && processedImage ? (
                <BeforeAfterSlider />
              ) : originalImage ? (
                <Image src={originalImage} alt="Your Upload" layout="fill" objectFit="contain" className="rounded-lg" />
              ) : (
                <div className="bg-gray-100 rounded-lg w-full h-full flex items-center justify-center">
                  <p className="text-gray-500">Your image will appear here</p>
                </div>
              )}
              {isLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-lg">
                  <p className="text-lg font-semibold">Processing...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {originalImage && (
          <div className="mt-8 text-center">
            <Button onClick={handleProcessImage} disabled={isLoading} size="lg">
              {isLoading ? 'Generating...' : 'Generate AI Background'}
              <Sparkles className="ml-2 h-5 w-5" />
            </Button>
          </div>
        )}

        <div className="mt-16 text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-2">Like what you see?</h2>
          <p className="text-gray-600 mb-6">Sign up to download your image and unlock all features.</p>
          <Link href="/auth/signup">
            <Button size="lg">Create Your Free Account</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
