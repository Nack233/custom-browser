import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.fallback) {
        return this.fallback;
      }
      return (
        <div className="p-4 m-2 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2">
            <span>⚠️ เกิดข้อผิดพลาดในการแสดงผลชั่วคราว: {this.state.error?.message}</span>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-2.5 py-1 rounded-lg bg-rose-500/30 hover:bg-rose-500/50 text-white font-medium text-[11px] transition-colors"
          >
            ลองใหม่
          </button>
        </div>
      );
    }

    return this.props.children;
  }

  private get fallback() {
    return this.props.fallback;
  }
}
