import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import Loading from "../components/Loading";

/*
 * Scroll fix: the original LoadingProvider never called setIsLoading(false)
 * unless the 3D character model finished loading. Since Scene.tsx now
 * calls setLoading(100) + setIsLoading(false) immediately on mount,
 * this provider just wires those calls through and keeps body scrollable.
 *
 * Extra safety: if setIsLoading(false) is never called within 4s
 * (e.g. during dev with hot-reload), we auto-dismiss so the page
 * never gets stuck behind a loading screen with scroll locked.
 */

interface LoadingType {
  isLoading: boolean;
  setIsLoading: (state: boolean) => void;
  setLoading: (percent: number) => void;
}

export const LoadingContext = createContext<LoadingType | null>(null);

export const LoadingProvider = ({ children }: PropsWithChildren) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(0);

  // Auto-dismiss fallback — ensures scroll is never permanently locked
  useEffect(() => {
    const fallback = setTimeout(() => {
      setIsLoading(false);
    }, 4000);
    return () => clearTimeout(fallback);
  }, []);

  // Whenever loading screen is dismissed, ensure body can scroll
  useEffect(() => {
    if (!isLoading) {
      document.body.style.overflowY = "auto";
    }
  }, [isLoading]);

  const value: LoadingType = { isLoading, setIsLoading, setLoading };

  return (
    <LoadingContext.Provider value={value}>
      {isLoading && <Loading percent={loading} />}
      <main className="main-body">{children}</main>
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
};
