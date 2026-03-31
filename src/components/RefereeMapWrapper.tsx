import { lazy, Suspense, Component, ReactNode } from "react";

const RefereeMap = lazy(() => import("./RefereeMap"));

class MapErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="py-8">
          <div className="container mx-auto px-4">
            <div className="bg-gradient-card rounded-2xl p-6 border border-border text-center text-muted-foreground">
              Não foi possível carregar o mapa.
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const RefereeMapWrapper = () => (
  <MapErrorBoundary>
    <Suspense fallback={
      <div className="py-8">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-card rounded-2xl p-6 border border-border text-center text-muted-foreground animate-pulse" style={{ height: 350 }}>
            Carregando mapa...
          </div>
        </div>
      </div>
    }>
      <RefereeMap />
    </Suspense>
  </MapErrorBoundary>
);

export default RefereeMapWrapper;
