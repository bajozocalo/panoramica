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
import { Heart, Trash2, ChevronRight } from 'lucide-react';
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

interface GeneratedImage {
  url: string;
  thumbnailUrl?: string;
  prompt: string;
  isFavorite?: boolean;
}

interface GenerationHistory {
  id: string;
  createdAt: Date;
  productType: string;
  scenes: string[];
  generatedImages: GeneratedImage[];
}

const scenes = [
    { id: 'forest', name: 'Forest', image: 'https://images.pexels.com/photos/167699/pexels-photo-167699.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2' },
    { id: 'beach', name: 'Beach', image: 'https://images.pexels.com/photos/1078983/pexels-photo-1078983.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2' },
    { id: 'studio', name: 'Studio', image: 'https://images.pexels.com/photos/66134/pexels-photo-66134.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2' },
    { id: 'city', name: 'City', image: 'https://images.pexels.com/photos/2113566/pexels-photo-2113566.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2' },
    { id: 'kitchen', name: 'Kitchen', image: 'https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2' },
    { id: 'space', name: 'Space', image: 'https://images.pexels.com/photos/1252890/pexels-photo-1252890.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2' },
];

const PAGE_SIZE = 5;

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
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [generationHistory, setGenerationHistory] = useState<GenerationHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [favorites, setFavorites] = useState<GeneratedImage[]>([]);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [editingImage, setEditingImage] = useState<GeneratedImage | null>(null);
  const [editPrompt, setEditPrompt] = useState('');

  useEffect(() => {
    if (userLoaded && !user) {
      router.push('/auth/login');
    }
  }, [user, userLoaded, router]);

  useEffect(() => {
    const checkOnboarding = async () => {
        if (user) {
            const userRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists() && !userDoc.data().metadata?.onboardingCompleted) {
                setShowOnboarding(true);
            }
        }
    };
    checkOnboarding();
  }, [user]);

  const handleCloseOnboarding = async () => {
    setShowOnboarding(false);
    if (user) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
            'metadata.onboardingCompleted': true
        });
    }
  };

  const fetchHistory = useCallback(async (initial = false) => {
    if (!user) return;
    setHistoryLoading(true);

    const q = initial
      ? query(collection(db, 'generations'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(PAGE_SIZE))
      : query(collection(db, 'generations'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'), startAfter(lastVisible), limit(PAGE_SIZE));

    const documentSnapshots = await getDocs(q);

    const newHistory: GenerationHistory[] = [];
    const userFavorites: GeneratedImage[] = [];
    documentSnapshots.forEach((doc) => {
      const data = doc.data();
      const generation = {
        id: doc.id,
        createdAt: data.createdAt.toDate(),
        productType: data.productType,
        scenes: data.scenes,
        generatedImages: data.generatedImages,
      };
      newHistory.push(generation);
      generation.generatedImages.forEach((img: GeneratedImage) => {
          if (img.isFavorite) {
              userFavorites.push(img);
          }
      });
    });

    setGenerationHistory(prev => initial ? newHistory : [...prev, ...newHistory]);
    if (initial) setFavorites(userFavorites);
    else setFavorites(prev => [...prev, ...userFavorites]);
    
    setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
    setHasMore(documentSnapshots.docs.length === PAGE_SIZE);
    setHistoryLoading(false);
  }, [user, lastVisible]);

  useEffect(() => {
    if(user) fetchHistory(true);
  }, [user, fetchHistory]);

  const handleImageUpload = async (file: File) => {
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) {
      return toast({ title: 'Invalid File Type', description: 'Please upload an image file.', variant: 'destructive' });
    }
    if (file.size > 10 * 1024 * 1024) {
      return toast({ title: 'File Too Large', description: 'Image must be less than 10MB.', variant: 'destructive' });
    }
    try {
      const filePath = `uploads/${user.uid}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, filePath);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      setUploadedImage({ url: downloadUrl, path: filePath });
    } catch (err) {
      toast({ title: 'Upload Failed', description: 'Failed to upload image.', variant: 'destructive' });
      console.error(err);
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!file || !user) return;
    if (file.type !== 'image/png') {
      return toast({ title: 'Invalid File Type', description: 'Please upload a PNG file.', variant: 'destructive' });
    }
    if (file.size > 2 * 1024 * 1024) {
      return toast({ title: 'File Too Large', description: 'Logo must be less than 2MB.', variant: 'destructive' });
    }
    try {
      const filePath = `logos/${user.uid}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, filePath);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      setLogoImage({ url: downloadUrl, path: filePath });
    } catch (err) {
      toast({ title: 'Upload Failed', description: 'Failed to upload logo.', variant: 'destructive' });
      console.error(err);
    }
  };

  const handleImageRemove = () => setUploadedImage(null);
  const handleLogoRemove = () => setLogoImage(null);

  const toggleScene = (sceneId: string) => {
    setSelectedScenes((prev) =>
      prev.includes(sceneId)
        ? prev.filter((id) => id !== sceneId)
        : [...prev, sceneId]
    );
  };

  const toggleStyle = (styleId: string) => {
    setSelectedStyles((prev) =>
      prev.includes(styleId)
        ? prev.filter((id) => id !== styleId)
        : [...prev, styleId]
    );
  };

  const toggleMood = (moodId: string) => {
    setSelectedMoods((prev) =>
      prev.includes(moodId)
        ? prev.filter((id) => id !== moodId)
        : [...prev, moodId]
    );
  };

  const handleGenerate = async () => {
    if (!uploadedImage || (!customPrompt && selectedScenes.length === 0) || !productType) {
      return toast({ title: 'Missing Information', description: 'Please upload an image, select scenes or add a custom prompt, and choose a product type.', variant: 'destructive' });
    }
    setGenerating(true);
    try {
      const generateFn = httpsCallable(functions, 'generateProductPhotos');
      const result = await generateFn({
        imagePath: uploadedImage.path,
        productType,
        scenes: selectedScenes,
        styles: selectedStyles,
        moods: selectedMoods,
        numberOfVariations,
        logoPath: logoImage?.path,
        customPrompt,
      });
      const data = result.data as any;
      setGeneratedImages(data.images);
      toast({ title: 'Generation Complete!', description: `${data.images.length} images generated successfully.` });
      fetchHistory(true); // Refresh history
    } catch (err: any) {
      toast({ title: 'Generation Failed', description: err.message || 'An unknown error occurred.', variant: 'destructive' });
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `panoramica-generated-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast({ title: 'Download Failed', description: 'Could not download the image.', variant: 'destructive' });
      console.error(error);
    }
  };

  const handleToggleFavorite = async (generationId: string, imageUrl: string, isCurrentlyFavorite: boolean) => {
    if (!user) return;
    const generationRef = doc(db, 'generations', generationId);
    const generation = generationHistory.find(g => g.id === generationId);
    if (!generation) return;

    const updatedImages = generation.generatedImages.map(img => 
        img.url === imageUrl ? { ...img, isFavorite: !isCurrentlyFavorite } : img
    );

    try {
        await updateDoc(generationRef, { generatedImages: updatedImages });
        toast({
            title: isCurrentlyFavorite ? 'Removed from Favorites' : 'Added to Favorites',
        });
        fetchHistory(true); // Refresh history to update favorites
    } catch (error) {
        toast({ title: 'Error Updating Favorites', description: 'Could not update your favorites.', variant: 'destructive' });
        console.error(error);
    }
  };

  const handleDeleteGeneration = async (generationId: string) => {
    try {
      const deleteFn = httpsCallable(functions, 'deleteGeneration');
      await deleteFn({ generationId });
      toast({ title: 'Generation Deleted', description: 'The generation has been successfully deleted.' });
      setGenerationHistory(prev => prev.filter(g => g.id !== generationId));
    } catch (error: any) {
      toast({ title: 'Deletion Failed', description: error.message || 'An unknown error occurred.', variant: 'destructive' });
      console.error(error);
    }
  };

  const handleEdit = async () => {
    if (!editingImage || !editPrompt) return;
    setGenerating(true);
    setEditingImage(null);
    try {
      const editFn = httpsCallable(functions, 'editProductPhoto');
      await editFn({
        imageUrl: editingImage.url,
        prompt: editPrompt,
      });
      toast({ title: 'Edit Complete!', description: 'Your image has been edited successfully.' });
      fetchHistory(true); // Refresh history
    } catch (err: any) {
      toast({ title: 'Edit Failed', description: err.message || 'An unknown error occurred.', variant: 'destructive' });
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading || !userLoaded) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <OnboardingModal isOpen={showOnboarding} onClose={handleCloseOnboarding} />
      <header className="bg-white dark:bg-gray-800 border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center">
              <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Panoramica.digital</h1>
              </Link>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <CreditBalance />
              <Link href="/pricing">
                <Button size="sm" className="hidden sm:inline-flex">Buy Credits</Button>
                <Button size="sm" className="sm:hidden">Credits</Button>
              </Link>
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="create">Create Images</TabsTrigger>
            <TabsTrigger value="gallery">My Gallery</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Create Your Product Photos</CardTitle>
                    <CardDescription>Follow the steps below to generate stunning product images</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Accordion type="multiple" defaultValue={["item-1", "item-2"]} className="w-full">
                      <AccordionItem value="item-1">
                        <AccordionTrigger className="text-sm font-semibold">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">1</span>
                            Upload Product Image
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          {uploadedImage ? (
                            <div>
                              <Image src={uploadedImage.url} alt="Uploaded product" width={500} height={500} className="rounded-lg w-full" />
                              <Button onClick={handleImageRemove} variant="outline" className="mt-4 w-full">Remove Image</Button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6">
                              <Label htmlFor="product-image" className="cursor-pointer w-full">
                                <div className="text-center">
                                  <p className="text-sm text-gray-500 dark:text-gray-400">Click or drag to upload</p>
                                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 10MB</p>
                                </div>
                              </Label>
                              <Input id="product-image" type="file" className="hidden" onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])} />
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="item-2">
                        <AccordionTrigger className="text-sm font-semibold">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">2</span>
                            Choose Background
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4">
                          <div>
                            <Label className="text-sm mb-2 block">Custom Prompt (6 Credits)</Label>
                            <textarea
                              value={customPrompt}
                              onChange={(e) => setCustomPrompt(e.target.value)}
                              placeholder="e.g., A clean, minimalist office desk..."
                              className="w-full p-2 border rounded text-sm"
                              rows={3}
                            />
                          </div>
                          <div className="text-center text-sm text-gray-500">OR</div>
                          <div>
                            <Label className="text-sm mb-2 block">Choose Preset Scenes</Label>
                            <div className={`grid grid-cols-2 gap-2 ${customPrompt ? 'opacity-50 pointer-events-none' : ''}`}>
                              {scenes.map((scene) => (
                                <div
                                  key={scene.id}
                                  className={`relative cursor-pointer rounded-lg border-2 transition-all ${selectedScenes.includes(scene.id) ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-gray-200'}`}
                                  onClick={() => toggleScene(scene.id)}
                                >
                                  <Image src={scene.image} alt={scene.name} width={500} height={500} className="rounded-lg aspect-square object-cover" />
                                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-center text-xs py-1 rounded-b-lg">{scene.name}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="item-3">
                        <AccordionTrigger className="text-sm font-semibold">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">3</span>
                            Style & Mood (Optional)
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4">
                          <div>
                            <Label className="text-sm mb-2 block">Styles</Label>
                            <div className="grid grid-cols-2 gap-2">
                              {STYLE_OPTIONS.map((style) => (
                                <Button
                                  key={style.id}
                                  size="sm"
                                  variant={selectedStyles.includes(style.id) ? 'default' : 'outline'}
                                  onClick={() => toggleStyle(style.id)}
                                  className="text-xs"
                                >
                                  {style.name}
                                </Button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm mb-2 block">Moods</Label>
                            <div className="grid grid-cols-2 gap-2">
                              {MOOD_OPTIONS.map((mood) => (
                                <Button
                                  key={mood.id}
                                  size="sm"
                                  variant={selectedMoods.includes(mood.id) ? 'default' : 'outline'}
                                  onClick={() => toggleMood(mood.id)}
                                  className="text-xs"
                                >
                                  {mood.name}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="item-4">
                        <AccordionTrigger className="text-sm font-semibold">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">4</span>
                            Generation Settings
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="product-type" className="text-sm">Product Type</Label>
                            <Select onValueChange={setProductType} value={productType}>
                              <SelectTrigger><SelectValue placeholder="Select a product type" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="shoes">Shoes</SelectItem>
                                <SelectItem value="cosmetics">Cosmetics</SelectItem>
                                <SelectItem value="electronics">Electronics</SelectItem>
                                <SelectItem value="jewelry">Jewelry</SelectItem>
                                <SelectItem value="food">Food & Drink</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="variations" className="text-sm">Number of Variations</Label>
                            <Select onValueChange={(v) => setNumberOfVariations(parseInt(v))} defaultValue="1">
                              <SelectTrigger><SelectValue placeholder="Select variations" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1 Variation</SelectItem>
                                <SelectItem value="2">2 Variations</SelectItem>
                                <SelectItem value="3">3 Variations</SelectItem>
                                <SelectItem value="4">4 Variations</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="item-5">
                        <AccordionTrigger className="text-sm font-semibold">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-secondary-foreground text-xs">+</span>
                            Add Logo (Optional)
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          {logoImage ? (
                            <div>
                              <Image src={logoImage.url} alt="Uploaded logo" width={500} height={500} className="rounded-lg w-full" />
                              <Button onClick={handleLogoRemove} variant="outline" className="mt-4 w-full">Remove Logo</Button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6">
                              <Label htmlFor="logo-image" className="cursor-pointer w-full">
                                <div className="text-center">
                                  <p className="text-sm text-gray-500 dark:text-gray-400">Click or drag to upload</p>
                                  <p className="text-xs text-gray-400 mt-1">PNG up to 2MB</p>
                                </div>
                              </Label>
                              <Input id="logo-image" type="file" className="hidden" onChange={(e) => e.target.files && handleLogoUpload(e.target.files[0])} />
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    <div className="mt-6 pt-6 border-t">
                      <Button
                        onClick={handleGenerate}
                        disabled={generating || !uploadedImage || (!customPrompt && selectedScenes.length === 0) || !productType}
                        className="w-full"
                        size="lg"
                      >
                        {generating ? 'Generating...' : 'Generate Images'}
                      </Button>
                      {!uploadedImage && (
                        <p className="text-xs text-muted-foreground text-center mt-2">Upload a product image to begin</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Latest Generation</CardTitle>
                    <CardDescription>Your most recently generated images</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {generating ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <Skeleton className="h-48 w-full rounded-lg" />
                        <Skeleton className="h-48 w-full rounded-lg" />
                        <Skeleton className="h-48 w-full rounded-lg" />
                      </div>
                    ) : generatedImages.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {generatedImages.map((image, index) => (
                          <div key={index} className="relative group aspect-square">
                            <Image src={image.thumbnailUrl || image.url} alt={`Generated image ${index + 1}`} width={500} height={500} className="rounded-lg w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                              <Button size="sm" onClick={() => handleDownload(image.url)}>Download</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState title="No images generated yet" description="Click 'Generate Images' to create your first product photos" />
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="gallery" className="mt-0">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Favorites</CardTitle>
                  <CardDescription>Your favorite product images</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {historyLoading && generationHistory.length === 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Skeleton className="h-32 w-full rounded-lg" />
                      <Skeleton className="h-32 w-full rounded-lg" />
                      <Skeleton className="h-32 w-full rounded-lg" />
                      <Skeleton className="h-32 w-full rounded-lg" />
                    </div>
                  ) : favorites.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {favorites.map((image, index) => (
                        <div key={index} className="relative group aspect-square">
                          <Image src={image.thumbnailUrl || image.url} alt={`Favorite ${index + 1}`} width={500} height={500} className="rounded-lg w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                            <Button size="sm" onClick={() => handleDownload(image.url)}>Download</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState title="No favorites yet" description="Heart your favorite images from the generation history" />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Generation History</CardTitle>
                  <CardDescription>All your past generations</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {historyLoading && generationHistory.length === 0 ? (
                    <div className="space-y-4">
                      <Skeleton className="h-32 w-full rounded-lg" />
                      <Skeleton className="h-32 w-full rounded-lg" />
                    </div>
                  ) : generationHistory.length > 0 ? (
                    <div className="space-y-4">
                      {generationHistory.map((gen) => (
                        <Card key={gen.id} className="overflow-hidden">
                          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                            <div className="space-y-1">
                              <CardTitle className="text-base">{gen.productType}</CardTitle>
                              <CardDescription className="text-xs">
                                {gen.scenes.join(', ')} • {gen.createdAt.toLocaleString()}
                              </CardDescription>
                            </div>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Generation?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete this generation and all its images. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteGeneration(gen.id)} className="bg-destructive text-destructive-foreground">
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </CardHeader>
                          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 pt-0">
                            {gen.generatedImages.map((image, index) => (
                              <div key={index} className="relative group aspect-square">
                                <Image src={image.thumbnailUrl || image.url} alt={`Generated ${index + 1}`} width={500} height={500} className="rounded-lg w-full h-full object-cover" />
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 bg-black/50 hover:bg-black/70"
                                    onClick={() => handleToggleFavorite(gen.id, image.url, !!image.isFavorite)}
                                  >
                                    <Heart className={`h-4 w-4 ${image.isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                                  </Button>
                                </div>
                                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                  <Button size="sm" onClick={() => handleDownload(image.url)}>Download</Button>
                                  <Button size="sm" variant="secondary" onClick={() => { setEditingImage(image); setEditPrompt(image.prompt); }}>
                                    Edit
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      ))}
                      {hasMore && (
                        <Button onClick={() => fetchHistory()} disabled={historyLoading} variant="outline" className="w-full">
                          {historyLoading ? 'Loading...' : 'Load More'}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <EmptyState title="No generations yet" description="Your generation history will appear here after you create images" />
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {editingImage && (
          <AlertDialog open onOpenChange={() => setEditingImage(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Edit Image</AlertDialogTitle>
                <AlertDialogDescription>
                  <Image src={editingImage.thumbnailUrl || editingImage.url} alt="Editing image" width={500} height={500} className="rounded-lg my-4" />
                  <textarea
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    className="w-full p-2 border rounded"
                    rows={3}
                  />
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleEdit}>Generate</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </main>
    </div>
  );
}
