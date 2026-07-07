import { Youtube } from "lucide-react";

export function Header() {
  return (
    <header className="w-full border-b border-border/50 backdrop-blur-xl bg-background/40 sticky top-0 z-40">
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow">
              <Youtube className="h-5 w-5 text-brand-foreground" strokeWidth={2.5} />
            </div>
          </div>
          <div className="leading-tight">
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-gradient">TubeRank</span>
            </h1>
            <p className="text-xs text-muted-foreground">AI-powered YouTube SEO</p>
          </div>
        </div>
      </div>
    </header>
  );
}
