import React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, RefreshCw, X } from "lucide-react";
import { Button } from "./button";

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  variant?: "default" | "destructive" | "warning";
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = "오류가 발생했습니다",
  message,
  onRetry,
  onDismiss,
  className,
  variant = "default"
}) => {
  const variantClasses = {
    default: "bg-red-900/20 border-red-500/30 text-red-300",
    destructive: "bg-red-900/30 border-red-500/50 text-red-200",
    warning: "bg-yellow-900/20 border-yellow-500/30 text-yellow-300"
  };

  return (
    <div className={cn(
      "border rounded-lg p-4 flex items-start space-x-3",
      variantClasses[variant],
      className
    )}>
      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="text-sm mt-1">{message}</p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-3 border-gray-600 text-white hover:bg-gray-800"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            다시 시도
          </Button>
        )}
      </div>
      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="flex-shrink-0 text-white hover:bg-gray-800"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

interface ErrorCardProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorCard: React.FC<ErrorCardProps> = ({
  title = "오류가 발생했습니다",
  message,
  onRetry,
  className
}) => {
  return (
    <div className={cn(
      "bg-black/90 border border-gray-800 rounded-lg p-8 flex flex-col items-center text-center backdrop-blur-sm",
      className
    )}>
      <div className="w-16 h-16 bg-red-900/30 border border-red-500/30 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-white/80 mb-6 max-w-md">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} className="flex items-center bg-white text-black hover:bg-white/90">
          <RefreshCw className="w-4 h-4 mr-2" />
          다시 시도
        </Button>
      )}
    </div>
  );
};

interface ErrorOverlayProps {
  isVisible: boolean;
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const ErrorOverlay: React.FC<ErrorOverlayProps> = ({
  isVisible,
  title = "오류가 발생했습니다",
  message,
  onRetry,
  onDismiss,
  className
}) => {
  if (!isVisible) return null;

  return (
    <div className={cn(
      "fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4",
      className
    )}>
      <div className="bg-black/90 border border-gray-800 rounded-lg p-6 max-w-md w-full backdrop-blur-sm">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            <p className="text-white/80 mb-4">{message}</p>
            <div className="flex space-x-3">
              {onRetry && (
                <Button onClick={onRetry} size="sm" className="bg-white text-black hover:bg-white/90">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  다시 시도
                </Button>
              )}
              {onDismiss && (
                <Button variant="outline" onClick={onDismiss} size="sm" className="border-gray-600 text-white hover:bg-gray-800">
                  닫기
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || ErrorCard;
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}
