import React from "react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = "md", 
  className 
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8", 
    lg: "w-12 h-12"
  };

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-gray-600 border-t-white absolute inset-0"
        )}
      />
      <div
        className={cn(
          "animate-pulse rounded-full bg-white/20 absolute inset-1"
        )}
      />
    </div>
  );
};

interface LoadingDotsProps {
  className?: string;
}

export const LoadingDots: React.FC<LoadingDotsProps> = ({ className }) => {
  return (
    <div className={cn("flex space-x-1", className)}>
      <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
    </div>
  );
};

interface LoadingCardProps {
  message?: string;
  className?: string;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({ 
  message = "로딩 중...", 
  className 
}) => {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-8 bg-black/90 backdrop-blur-sm rounded-xl border border-gray-700 shadow-2xl",
      className
    )}>
      <div className="relative mb-6">
        <LoadingSpinner size="lg" />
        <div className="absolute inset-0 animate-ping rounded-full bg-white/10"></div>
      </div>
      <p className="text-white/90 text-sm font-medium tracking-wide">{message}</p>
      <div className="mt-4 flex space-x-1">
        <div className="w-1 h-1 bg-white/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-1 h-1 bg-white/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-1 h-1 bg-white/60 rounded-full animate-bounce"></div>
      </div>
    </div>
  );
};

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  isVisible, 
  message = "로딩 중...", 
  className 
}) => {
  if (!isVisible) return null;

  return (
    <div className={cn(
      "fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50",
      className
    )}>
      <div className="bg-black/95 border border-gray-700 rounded-xl p-8 flex flex-col items-center backdrop-blur-sm shadow-2xl">
        <div className="relative mb-6">
          <LoadingSpinner size="lg" />
          <div className="absolute inset-0 animate-ping rounded-full bg-white/10"></div>
        </div>
        <p className="text-white/90 font-medium tracking-wide">{message}</p>
        <div className="mt-4 flex space-x-1">
          <div className="w-1 h-1 bg-white/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-1 h-1 bg-white/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-1 h-1 bg-white/60 rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
};
