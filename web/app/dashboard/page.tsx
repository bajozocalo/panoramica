'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { functions, storage, db } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, limit, startAfter, getDocs, QueryDocumentSnapshot, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';
import UserMenu from '@/components/ui/UserMenu';
import CreditBalance from '@/components/ui/CreditBalance';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { Heart, Trash2, ChevronRight, Sparkles } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import OnboardingModal from '@/components/ui/OnboardingModal';
import { STYLE_OPTIONS, MOOD_OPTIONS } from '@/lib/constants';
import MagicRetouchModal from '@/components/ui/MagicRetouchModal';

// ... (interfaces remain the same)

export default function Dashboard() {
  const { user, loading, userLoaded } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [uploadedImage, setUploadedImage] = useState<{ url: string; path: string } | null>(null);
  const [selectedScenes, setSelectedScenes] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [productType, setProductType] = useState('');
  const [logoImage, setLogoImage] = useState<{ url: string; path: string } | null>(null);
  const [numberOfVariations, setNumberOfVariations] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<any[]>([]);
  const [generationHistory, setGenerationHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showMagicRetouch, setShowMagicRetouch] = useState(false);
  const [retouchImageUrl, setRetouchImageUrl] = useState('');

  // State for Virtual Models
  const [modelGender, setModelGender] = useState('');
  const [modelEthnicity, setModelEthnicity] = useState('');
  const [modelSetting, setModelSetting] = useState('');

  // ... (useEffect hooks remain the same)

  const handleGenerateWithVirtualModel = async () => {
    if (!uploadedImage || !modelGender || !modelEthnicity || !modelSetting) {
      return toast({ title: 'Missing Information', description: 'Please upload an image and select all model options.', variant: 'destructive' });
    }
    setGenerating(true);
    try {
      const prompt = `A photorealistic image of a ${modelGender} ${modelEthnicity} model in a ${modelSetting} setting, wearing the product.`;
      const generateFn = httpsCallable(functions, 'generateWithVirtualModel');
      const result = await generateFn({
        imageUrl: uploadedImage.path,
        prompt,
      });
      const data = result.data as any;
      setGeneratedImages([data.image]);
      toast({ title: 'Virtual Model Generation Complete!', description: 'Your image has been generated.' });
      fetchHistory(true);
    } catch (err: any) {
      toast({ title: 'Generation Failed', description: err.message || 'An unknown error occurred.', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  // ... (other handlers remain the same)

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* ... (header and onboarding modal) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="create">AI Backgrounds</TabsTrigger>
            <TabsTrigger value="virtual-models">Virtual Models</TabsTrigger>
            <TabsTrigger value="gallery">My Gallery</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="mt-0">
            {/* ... (existing AI Backgrounds content) */}
          </TabsContent>

          <TabsContent value="virtual-models" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Create with Virtual Models</CardTitle>
                    <CardDescription>Generate images of your product on a diverse range of AI models.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <Label className="font-semibold">1. Upload Product Image</Label>
                      {uploadedImage ? (
                        <div>
                          <Image src={uploadedImage.url} alt="Uploaded product" width={500} height={500} className="rounded-lg w-full" />
                          <Button onClick={() => setUploadedImage(null)} variant="outline" className="mt-4 w-full">Remove Image</Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6">
                          <Label htmlFor="product-image-vm" className="cursor-pointer w-full text-center">
                            <p className="text-sm text-gray-500">Click or drag to upload</p>
                            <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 10MB</p>
                          </Label>
                          <Input id="product-image-vm" type="file" className="hidden" onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])} />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="font-semibold">2. Describe Your Model</Label>
                      <Select onValueChange={setModelGender} value={modelGender}>
                        <SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="male">Male</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select onValueChange={setModelEthnicity} value={modelEthnicity}>
                        <SelectTrigger><SelectValue placeholder="Select Ethnicity" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Latina">Latina</SelectItem>
                          <SelectItem value="Afro-Latina">Afro-Latina</SelectItem>
                          <SelectItem value="Mestiza">Mestiza</SelectItem>
                          <SelectItem value="White">White</SelectItem>
                          <SelectItem value="Asian">Asian</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-semibold">3. Choose a Setting</Label>
                      <Select onValueChange={setModelSetting} value={modelSetting}>
                        <SelectTrigger><SelectValue placeholder="Select Setting" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional studio">Professional Studio</SelectItem>
                          <SelectItem value="outdoor urban city">Outdoor City</SelectItem>
                          <SelectItem value="beachside cafe">Beachside Cafe</SelectItem>
                          <SelectItem value="modern home interior">Modern Home</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="pt-6 border-t">
                      <Button
                        onClick={handleGenerateWithVirtualModel}
                        disabled={generating || !uploadedImage || !modelGender || !modelEthnicity || !modelSetting}
                        className="w-full"
                        size="lg"
                      >
                        {generating ? 'Generating...' : 'Generate with Virtual Model'}
                        <Sparkles className="ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-8">
                {/* ... (Display for generated images, similar to the other tab) */}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="gallery" className="mt-0">
            {/* ... (existing Gallery content) */}
          </TabsContent>
        </Tabs>

        {showMagicRetouch && (
          <MagicRetouchModal
            isOpen={showMagicRetouch}
            onClose={() => setShowMagicRetouch(false)}
            imageUrl={retouchImageUrl}
            onRetouchComplete={handleRetouchComplete}
          />
        )}
      </main>
    </div>
  );
}
