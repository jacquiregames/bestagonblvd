// src/components/ImagePreloader.tsx 
import React, { useEffect } from 'react';

interface ImagePreloaderProps {
  imageUrls: string[];
  onComplete: () => void;
}

const ImagePreloader: React.FC<ImagePreloaderProps> = ({ imageUrls, onComplete }) => {
  useEffect(() => {
    let isMounted = true;
    
    const loadImages = async () => {
      const promises = imageUrls.map((url) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.src = url; 
          
          img.onload = () => resolve(true);
          img.onerror = () => {
            console.warn(`Preload failed: ${url}`);
            resolve(true); 
          };
        });
      });

      await Promise.all(promises);
      
      if (isMounted) {
        // Optional: Small delay for visual polish so the loader is seen
        setTimeout(onComplete, 800); 
      }
    };

    loadImages();

    return () => { isMounted = false; };
  }, [imageUrls, onComplete]);

  return null;
};
 
export default ImagePreloader;