'use client';

import { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Line } from 'react-konva';
import useImage from 'use-image';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { functions, storage } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface MagicRetouchModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onRetouchComplete: (newImageUrl: string) => void;
}

export default function MagicRetouchModal({ isOpen, onClose, imageUrl, onRetouchComplete }: MagicRetouchModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [image] = useImage(imageUrl, 'anonymous');
  const [lines, setLines] = useState<any[]>([]);
  const isDrawing = useRef(false);
  const stageRef = useRef<any>(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleMouseDown = (e: any) => {
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    setLines([...lines, { points: [pos.x, pos.y] }]);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing.current) {
      return;
    }
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    let lastLine = lines[lines.length - 1];
    lastLine.points = lastLine.points.concat([point.x, point.y]);
    lines.splice(lines.length - 1, 1, lastLine);
    setLines(lines.concat());
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  const handleUndo = () => {
    setLines(lines.slice(0, -1));
  };

  const handleRetouch = async () => {
    if (!prompt || lines.length === 0 || !stageRef.current || !user) {
      return toast({
        title: 'Missing Information',
        description: 'Please draw a mask and enter a prompt.',
        variant: 'destructive',
      });
    }
    setIsLoading(true);

    try {
      // Create a new stage for the mask, with a black background
      const maskStage = new Konva.Stage({
        width: image?.width,
        height: image?.height,
      });
      const layer = new Konva.Layer();
      // Add a black background
      layer.add(new Konva.Rect({
        x: 0,
        y: 0,
        width: image?.width,
        height: image?.height,
        fill: 'black'
      }));
      // Add the lines in white
      lines.forEach(line => {
        layer.add(new Konva.Line({
          points: line.points,
          stroke: 'white',
          strokeWidth: 20,
          tension: 0.5,
          lineCap: 'round',
          lineJoin: 'round',
        }));
      });
      maskStage.add(layer);

      const maskDataURL = maskStage.toDataURL();
      
      const maskFilePath = `masks/${user.uid}/${Date.now()}_mask.png`;
      const maskStorageRef = ref(storage, maskFilePath);
      await uploadString(maskStorageRef, maskDataURL, 'data_url');
      const maskDownloadUrl = await getDownloadURL(maskStorageRef);

      const magicRetouchFn = httpsCallable(functions, 'magicRetouch');
      const result = await magicRetouchFn({
        imageUrl,
        maskUrl: maskDownloadUrl,
        prompt,
      });

      const data = result.data as any;
      onRetouchComplete(data.image.url);
      toast({
        title: 'Magic Retouch Complete!',
        description: 'Your image has been successfully retouched.',
      });
      onClose();
    } catch (error: any) {
      toast({
        title: 'Magic Retouch Failed',
        description: error.message || 'An unknown error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Magic Retouch</AlertDialogTitle>
          <AlertDialogDescription>
            Draw a mask over the area you want to change, then describe what you want to see.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="relative w-full aspect-square">
          <Stage
            width={512}
            height={512}
            onMouseDown={handleMouseDown}
            onMousemove={handleMouseMove}
            onMouseup={handleMouseUp}
            ref={stageRef}
            className="absolute top-0 left-0"
          >
            <Layer>
              <KonvaImage image={image} width={512} height={512} />
              {lines.map((line, i) => (
                <Line
                  key={i}
                  points={line.points}
                  stroke="#ff0000"
                  strokeWidth={20}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                />
              ))}
            </Layer>
          </Stage>
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., 'a bouquet of flowers' or 'remove the person'"
          />
          <Button onClick={handleUndo} variant="outline">Undo</Button>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleRetouch} disabled={isLoading}>
            {isLoading ? 'Retouching...' : 'Apply Magic Retouch'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
