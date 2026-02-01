import React, { useState, useEffect, useRef } from 'react';
import { Page } from '../types/page';

interface PageTitleDisplayProps {
  currentPage: Page | null;
  onPageChange?: () => void; // Trigger when page changes
}

export function PageTitleDisplay({ currentPage, onPageChange }: PageTitleDisplayProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showFromPageChange, setShowFromPageChange] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const prevPageIdRef = useRef<string | null>(null);

  // Handle page change detection
  useEffect(() => {
    if (currentPage && prevPageIdRef.current !== null && currentPage.id !== prevPageIdRef.current) {
      // Page changed - trigger fade in for 2 seconds
      console.log('Page changed from', prevPageIdRef.current, 'to', currentPage.id);
      setShowFromPageChange(true);
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set timeout to hide after 2 seconds (only if not hovered)
      timeoutRef.current = window.setTimeout(() => {
        setShowFromPageChange(false);
      }, 2000);
    }
    
    // Update previous page reference (but not on initial load)
    if (currentPage) {
      if (prevPageIdRef.current === null) {
        // Initial load - just set the reference without showing
        prevPageIdRef.current = currentPage.id;
      } else {
        // Subsequent changes - update after the check above
        prevPageIdRef.current = currentPage.id;
      }
    }
  }, [currentPage]);

  // Update visibility based on both hover and page change states
  useEffect(() => {
    setIsVisible(isHovered || showFromPageChange);
  }, [isHovered, showFromPageChange]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // If not showing from page change, hide immediately
    if (!showFromPageChange) {
      setIsVisible(false);
    }
  };

  if (!currentPage) {
    return null;
  }

  return (
    <>
      {/* Hover detection area - invisible but generous size */}
      <div
        className="fixed top-0 left-0 w-[300px] h-[160px] z-20"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
      
      {/* Title display */}
      <div
        className={`
          fixed top-6 left-6 z-30 
          bg-black/20 backdrop-blur 
          text-white text-2xl font-semibold 
          px-8 py-6 rounded-2xl
          transition-opacity duration-300 ease-in-out
          pointer-events-none
          min-w-[200px]
          ${isVisible ? 'opacity-100' : 'opacity-0'}
        `}
      >
        {currentPage.title}
      </div>
    </>
  );
}