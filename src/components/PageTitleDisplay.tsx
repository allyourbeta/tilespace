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
    const currentPageId = currentPage?.id;
    console.log('PageTitleDisplay useEffect triggered:', {
      currentPageId,
      currentTitle: currentPage?.title,
      prevPageId: prevPageIdRef.current
    });
    
    if (currentPageId && prevPageIdRef.current !== null && currentPageId !== prevPageIdRef.current) {
      // Page changed - trigger fade in for 2 seconds
      console.log('✅ Page changed detected! From:', prevPageIdRef.current, 'to:', currentPageId);
      setShowFromPageChange(true);
      console.log('✅ setShowFromPageChange(true) called');
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set timeout to hide after 2 seconds
      timeoutRef.current = window.setTimeout(() => {
        console.log('⏰ Timeout: hiding title after 2 seconds');
        setShowFromPageChange(false);
      }, 2000);
      
      // Update reference after showing
      prevPageIdRef.current = currentPageId;
    } else if (currentPageId && prevPageIdRef.current === null) {
      // Initial load - just set the reference without showing
      console.log('🆕 Initial load - setting prevPageIdRef to:', currentPageId);
      prevPageIdRef.current = currentPageId;
    }
  }, [currentPage?.id, currentPage?.title]);

  // Update visibility based on both hover and page change states
  useEffect(() => {
    const newVisibility = isHovered || showFromPageChange;
    console.log('👁️ Visibility update:', {
      isHovered,
      showFromPageChange,
      newVisibility,
      currentTitle: currentPage?.title
    });
    setIsVisible(newVisibility);
  }, [isHovered, showFromPageChange, currentPage?.title]);

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
    console.log('❌ No currentPage - not rendering');
    return null;
  }

  console.log('🎨 Rendering PageTitleDisplay:', {
    title: currentPage.title,
    isVisible,
    showFromPageChange,
    isHovered
  });

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