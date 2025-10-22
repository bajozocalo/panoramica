'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Welcome to Panoramica Digital!</DialogTitle>
          <DialogDescription>
            Here&apos;s a quick guide to get you started on creating amazing product photos.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <h3 className="font-semibold">Step 1: Upload Your Product</h3>
            <p className="text-sm text-gray-500">
              Click the upload area to select an image of your product. Clear, well-lit photos work best!
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Step 2: Choose Your Scenes</h3>
            <p className="text-sm text-gray-500">
              Select one or more scenes from our library. This is where the magic happens!
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Step 3: Generate!</h3>
            <p className="text-sm text-gray-500">
              Choose your product type, the number of variations you want, and hit &apos;Generate&apos;.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Get Started</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
