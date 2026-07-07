import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Download, Play, Sparkles, Copy, Scissors, Target, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import type { ViralClipsResult } from "@/lib/seo.functions";

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function copy(text: string, label: string) {
  navigator.clipboard.writeText(text).then(
    () => toast.success(`${label} copied`),
    () => toast.error("Copy failed"),
  );
}

export function ViralClipsView({ data }: { data: ViralClipsResult }) {
  const hasFallback = data.fallback || data.clips.length === 0;

  return (
    <div className="space-y-6 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="glass-card p-5">
        <div className="flex gap-4 items-start">
          <img
            src={data.thumbnail}
            alt={data.title}
            className="w-32 sm:w-40 rounded-lg border border-border/40"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Source video
            </p>
            <h3 className="font-semibold truncate">{data.title}</h3>
            <p className="text-sm text-muted-foreground">{data.author}</p>
            <p className="text-sm mt-2 text-muted-foreground line-clamp-2">
              {data.videoSummary}
            </p>
          </div>
        </div>
      </Card>

      {hasFallback ? (
        <Card className="glass-card p-6 border-destructive/40 bg-destructive/5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-destructive/10 p-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
            </div>
            <div className="space-y-3">
              <div>
                <h2 className="text-xl font-semibold">This video couldn't be analyzed for clips</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {data.userMessage || "We couldn't extract enough caption data from this video."}
                </p>
              </div>

              <div className="rounded-lg border border-border/60 bg-background/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Try one of these
                </p>
                <ul className="space-y-2 text-sm text-foreground">
                  <li>• Use a public YouTube video with captions or subtitles enabled</li>
                  <li>• Try a different long-form video that has spoken dialogue</li>
                  <li>• Open the video on YouTube first and confirm captions are available</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2 mb-1">
              <Scissors className="h-5 w-5 text-primary" /> {data.clips.length} Viral Clip
              {data.clips.length === 1 ? "" : "s"} Found
            </h2>
            <p className="text-sm text-muted-foreground">
              Ranked by viral potential. Each clip has a hook, main body, punchline and CTA — ready
              to download and post.
            </p>
          </div>

          {data.clips.map((clip, i) => {
            const startUrl = `${data.videoUrl}&t=${Math.floor(clip.startSeconds)}s`;
            const downloadUrl = `https://ssyoutube.com/watch?v=${data.videoId}`;
            return (
              <Card key={i} className="glass-card p-5 space-y-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge className="bg-gradient-brand text-brand-foreground border-0">
                        #{i + 1}
                      </Badge>
                      <Badge variant="outline" className="font-mono">
                        {formatTime(clip.startSeconds)} → {formatTime(clip.endSeconds)}
                      </Badge>
                      <Badge variant="outline">
                        {Math.round(clip.endSeconds - clip.startSeconds)}s
                      </Badge>
                      <Badge
                        className={`border-0 ${
                          clip.viralScore >= 80
                            ? "bg-emerald-500/20 text-emerald-300"
                            : clip.viralScore >= 60
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-rose-500/20 text-rose-300"
                        }`}
                      >
                        <Sparkles className="h-3 w-3 mr-1" /> {clip.viralScore}/100
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-lg leading-tight">{clip.title}</h3>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      className="border-border/60"
                    >
                      <a href={startUrl} target="_blank" rel="noopener noreferrer">
                        <Play className="h-4 w-4 mr-1.5" /> Preview
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      asChild
                      className="bg-gradient-brand text-brand-foreground hover:opacity-90"
                    >
                      <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-1.5" /> Download
                      </a>
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1 flex items-center gap-1">
                      <Target className="h-3 w-3" /> Hook (0-3s)
                    </p>
                    <p className="text-sm">{clip.hook}</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background/40 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      Main Body
                    </p>
                    <p className="text-sm">{clip.mainBody}</p>
                  </div>
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300 mb-1">
                      ⚡ Punch Line
                    </p>
                    <p className="text-sm">{clip.punchLine}</p>
                  </div>
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 mb-1 flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" /> Call to Action
                    </p>
                    <p className="text-sm">{clip.callToAction}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-border/60 bg-background/40 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Ready-to-paste caption
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2"
                      onClick={() =>
                        copy(
                          `${clip.suggestedCaption}\n\n${clip.suggestedHashtags.join(" ")}`,
                          "Caption",
                        )
                      }
                    >
                      <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                    </Button>
                  </div>
                  <p className="text-sm">{clip.suggestedCaption}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {clip.suggestedHashtags.map((h, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {h}
                      </Badge>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground italic border-l-2 border-primary/40 pl-3">
                  💡 Why it works: {clip.whyItWorks}
                </p>
              </Card>
            );
          })}

          <Card className="glass-card p-4 text-xs text-muted-foreground">
            <strong className="text-foreground">How to download a clip:</strong> Click{" "}
            <span className="text-foreground">Download</span> to open a free YouTube downloader
            pre-loaded with your video. Pick MP4, then trim it to the exact timestamps shown above
            using any free editor (CapCut, Clipchamp, or InShot). The{" "}
            <span className="text-foreground">Preview</span> button jumps you to the exact moment on
            YouTube so you can verify before downloading.
          </Card>
        </>
      )}
    </div>
  );
}
