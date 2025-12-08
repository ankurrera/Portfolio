import { Component, ReactNode } from "react";
import { Link } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <>
          <Header />
          
          <main id="main-content" className="min-h-screen flex items-center justify-center px-8 animate-fade-in">
            <div className="text-center max-w-2xl">
              <h1 className="text-7xl md:text-9xl font-light tracking-tight mb-8">
                Error
              </h1>
              <p className="text-2xl md:text-3xl font-light tracking-tight mb-4">
                Something went wrong
              </p>
              <p className="text-lg text-muted-foreground mb-12 max-w-md mx-auto">
                We encountered an unexpected error. Please try refreshing the page or return home.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <button
                  onClick={() => window.location.reload()}
                  className="inline-block px-8 py-3 bg-foreground text-background text-sm uppercase tracking-widest hover:opacity-90 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                >
                  Refresh Page
                </button>
                <Link
                  to="/"
                  className="inline-block px-8 py-3 border-2 border-foreground text-sm uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-300"
                >
                  Return Home
                </Link>
              </div>
            </div>
          </main>

          <Footer />
        </>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
