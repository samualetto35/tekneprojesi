"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X, Maximize2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface ImageCarouselProps {
  images: string[];
  title: string;
  autoPlayInterval?: number; // milliseconds
}

export default function ImageCarousel({ 
  images, 
  title,
  autoPlayInterval = 5000 
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPausedRef = useRef(false);
  
  // Zoom states
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // Auto-play functionality
  useEffect(() => {
    if (images.length <= 1 || isFullscreen || isPausedRef.current) return;

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, autoPlayInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [images.length, autoPlayInterval, isFullscreen, currentIndex]);

  // Pause auto-play on hover/touch
  const handleMouseEnter = () => {
    isPausedRef.current = true;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleMouseLeave = () => {
    isPausedRef.current = false;
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    // Reset zoom when changing image
    if (isFullscreen) {
      resetZoom();
    }
    // Reset auto-play
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setTimeout(() => {
      if (!isPausedRef.current && !isFullscreen) {
        intervalRef.current = setInterval(() => {
          setCurrentIndex((prev) => (prev + 1) % images.length);
        }, autoPlayInterval);
      }
    }, 100);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    // Reset zoom when changing image
    if (isFullscreen) {
      resetZoom();
    }
    // Reset auto-play
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setTimeout(() => {
      if (!isPausedRef.current && !isFullscreen) {
        intervalRef.current = setInterval(() => {
          setCurrentIndex((prev) => (prev + 1) % images.length);
        }, autoPlayInterval);
      }
    }, 100);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    // Reset zoom when changing image
    resetZoom();
    // Reset auto-play
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setTimeout(() => {
      if (!isPausedRef.current && !isFullscreen) {
        intervalRef.current = setInterval(() => {
          setCurrentIndex((prev) => (prev + 1) % images.length);
        }, autoPlayInterval);
      }
    }, 100);
  };

  // Zoom functions
  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const constrainPosition = (newScale: number, newX: number, newY: number) => {
    if (!imageRef.current || !containerRef.current) {
      return { x: newX, y: newY };
    }

    const img = imageRef.current;
    const container = containerRef.current;
    
    // Get image natural dimensions
    const imgRect = img.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    // Calculate scaled dimensions
    const scaledWidth = imgRect.width * newScale;
    const scaledHeight = imgRect.height * newScale;
    
    // Calculate boundaries
    const maxX = Math.max(0, (scaledWidth - containerRect.width) / 2);
    const maxY = Math.max(0, (scaledHeight - containerRect.height) / 2);
    
    // Constrain position
    return {
      x: Math.max(-maxX, Math.min(maxX, newX)),
      y: Math.max(-maxY, Math.min(maxY, newY)),
    };
  };

  const handleZoom = (delta: number, centerX?: number, centerY?: number) => {
    setScale((prevScale) => {
      const newScale = Math.max(1, Math.min(5, prevScale + delta));
      
      // Zoom to center of viewport or mouse position
      if (centerX !== undefined && centerY !== undefined && containerRef.current && imageRef.current) {
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        
        // Calculate zoom point relative to container center
        const zoomPointX = centerX - rect.left - rect.width / 2;
        const zoomPointY = centerY - rect.top - rect.height / 2;
        
        // Calculate new position to keep zoom point fixed
        const scaleChange = newScale / prevScale;
        const newX = position.x - (zoomPointX * (scaleChange - 1));
        const newY = position.y - (zoomPointY * (scaleChange - 1));
        
        // Constrain position
        const constrained = constrainPosition(newScale, newX, newY);
        setPosition(constrained);
      } else if (newScale === 1) {
        // Reset position when zooming out to 1x
        setPosition({ x: 0, y: 0 });
      }
      
      return newScale;
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!isFullscreen) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    handleZoom(delta, e.clientX, e.clientY);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!isFullscreen) return;
    e.stopPropagation();
    if (scale > 1) {
      resetZoom();
    } else {
      handleZoom(1.5, e.clientX, e.clientY);
    }
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    e.preventDefault();
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    const constrained = constrainPosition(scale, newX, newY);
    setPosition(constrained);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch pinch zoom
  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return null;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStartFullscreen = (e: React.TouchEvent) => {
    if (!isFullscreen) return;
    if (e.touches.length === 2) {
      const distance = getTouchDistance(e.touches);
      if (distance) setLastTouchDistance(distance);
    } else if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y });
    }
  };

  const handleTouchMoveFullscreen = (e: React.TouchEvent) => {
    if (!isFullscreen) return;
    if (e.touches.length === 2 && lastTouchDistance) {
      const distance = getTouchDistance(e.touches);
      if (distance) {
        const delta = (distance - lastTouchDistance) / 100;
        // Calculate center point between two touches
        const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        handleZoom(delta, centerX, centerY);
        setLastTouchDistance(distance);
      }
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      const newX = e.touches[0].clientX - dragStart.x;
      const newY = e.touches[0].clientY - dragStart.y;
      const constrained = constrainPosition(scale, newX, newY);
      setPosition(constrained);
    }
  };

  const handleTouchEndFullscreen = () => {
    setLastTouchDistance(null);
    setIsDragging(false);
  };

  // Reset zoom when fullscreen closes
  useEffect(() => {
    if (!isFullscreen) {
      resetZoom();
    }
  }, [isFullscreen]);

  // Touch handlers for swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    }
    if (isRightSwipe) {
      goToPrevious();
    }
  };

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <>
      <div 
        className="h-[60vh] bg-gray-200 relative overflow-hidden group cursor-pointer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={() => setIsFullscreen(true)}
      >
        {/* Images */}
        <div 
          className="flex h-full transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((image, index) => (
            <div key={index} className="w-full h-full flex-shrink-0 flex items-center justify-center bg-slate-900/30">
              <img
                src={image}
                alt={`${title} - Resim ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* Navigation Buttons - Show on hover */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity z-40 pointer-events-auto"
              aria-label="Önceki resim"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity z-40 pointer-events-auto"
              aria-label="Sonraki resim"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Fullscreen Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsFullscreen(true);
          }}
          className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity z-40 pointer-events-auto"
          aria-label="Tam ekran"
        >
          <Maximize2 className="w-5 h-5" />
        </button>

      </div>

      {/* Fullscreen Modal */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent 
          className="max-w-none w-screen h-screen max-h-screen p-0 bg-black border-none m-0 rounded-none left-0 top-0 translate-x-0 translate-y-0 [&>button]:!hidden"
          onClick={(e) => {
            // Close when clicking on the background (not on the image or buttons)
            if (e.target === e.currentTarget) {
              setIsFullscreen(false);
            }
          }}
        >
          <DialogTitle className="sr-only">Resim Galerisi - {title}</DialogTitle>
          <div className="relative w-full h-full flex flex-col items-center justify-center pb-16 md:pb-20">
            {/* Zoom Controls - Top right, left of close button */}
            <div className="absolute top-4 right-20 z-[60] flex items-center gap-2 bg-black/70 rounded-full px-3 py-2 shadow-lg">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleZoom(-0.5);
                }}
                disabled={scale <= 1}
                className="text-white hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all p-1.5"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <span className="text-white text-sm min-w-[3rem] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleZoom(0.5);
                }}
                disabled={scale >= 5}
                className="text-white hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all p-1.5"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              {scale > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    resetZoom();
                  }}
                  className="text-white hover:text-gray-300 transition-all p-1.5 ml-2 border-l border-white/20 pl-2"
                  aria-label="Reset zoom"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Close Button - Only one X button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsFullscreen(false);
              }}
              className="absolute top-4 right-4 z-[60] bg-black/70 hover:bg-black/90 text-white rounded-full p-2.5 shadow-lg transition-all"
              aria-label="Kapat"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Fullscreen Image Container - maintains aspect ratio, doesn't overflow, dark background on sides */}
            <div 
              ref={containerRef}
              className="relative w-full flex-1 flex items-center justify-center bg-black overflow-hidden cursor-grab active:cursor-grabbing pb-16 md:pb-20"
              onClick={(e) => {
                // Only close on background click if not zoomed
                if (scale <= 1 && e.target === e.currentTarget) {
                  setIsFullscreen(false);
                }
              }}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStartFullscreen}
              onTouchMove={handleTouchMoveFullscreen}
              onTouchEnd={handleTouchEndFullscreen}
            >
              <div
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                }}
                className="will-change-transform"
              >
                <img
                  ref={imageRef}
                  src={images[currentIndex]}
                  alt={`${title} - Resim ${currentIndex + 1}`}
                  className="max-w-full max-h-full w-auto h-auto object-contain select-none"
                  style={{ 
                    maxWidth: '100vw', 
                    maxHeight: 'calc(100vh - 120px)',
                    width: 'auto',
                    height: 'auto',
                    touchAction: 'none',
                  }}
                  onDoubleClick={handleDoubleClick}
                  draggable={false}
                />
              </div>
            </div>

            {/* Navigation in Fullscreen */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrevious();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white rounded-full p-3 z-[60] shadow-lg transition-all"
                  aria-label="Önceki resim"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white rounded-full p-3 z-[60] shadow-lg transition-all"
                  aria-label="Sonraki resim"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                {/* Image Counter in Fullscreen */}
                <div className="absolute top-4 left-4 bg-black/70 text-white px-4 py-2 rounded-full text-base z-[60] shadow-lg">
                  {currentIndex + 1} / {images.length}
                </div>

                {/* Thumbnail Gallery at Bottom */}
                <div className="absolute bottom-0 left-0 right-0 w-full bg-black/80 px-2 md:px-4 py-2 md:py-3 flex items-center justify-start gap-2 overflow-x-auto safe-area-inset-bottom">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        goToSlide(index);
                      }}
                      className={`flex-shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentIndex 
                          ? 'border-white scale-110' 
                          : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

