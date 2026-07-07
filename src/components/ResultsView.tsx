import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreGauge } from "./ScoreGauge";
import { Check, X, Copy, Lightbulb, Image as ImageIcon, Megaphone } from "lucide-react";
import { toast } from "sonner";

export interface AuditData {
  overallScore: number;
  titleScore: number;
  descriptionScore: number;
  tagsScore: number;
  thumbnailScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestedTitles: string[];
  suggestedDescription: string;
  suggestedTags: string[];
  suggestedHashtags: string[];
  thumbnailTips: string[];
  ctaTips: string[];
}

interface Props {
  audit: AuditData;
  videoMeta?: { title: string; author: string; thumbnail: string };
}

function copy(text: string, label: string) {
  navigator.clipboard.writeText(text);
  toast.success(`${label} copied`);
}

export function ResultsView({ audit, videoMeta }: Props) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {videoMeta && (
        <Card className="glass-card p-5 flex gap-4 items-center">
          <img
            src={videoMeta.thumbnail}
            alt={videoMeta.title}
            className="w-32 h-20 object-cover rounded-lg"
          />
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{videoMeta.title}</h3>
            <p className="text-sm text-muted-foreground">{videoMeta.author}</p>
          </div>
        </Card>
      )}

      <Card className="glass-card p-6">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <ScoreGauge score={audit.overallScore} label="Overall" size={160} />
          <div className="flex-1 space-y-3">
            <h2 className="text-2xl font-bold text-gradient">SEO Audit Summary</h2>
            <p className="text-muted-foreground leading-relaxed">{audit.summary}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-border/50">
          <ScoreGauge score={audit.titleScore} label="Title" size={90} />
          <ScoreGauge score={audit.descriptionScore} label="Description" size={90} />
          <ScoreGauge score={audit.tagsScore} label="Tags" size={90} />
          <ScoreGauge score={audit.thumbnailScore} label="Thumbnail" size={90} />
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass-card p-5">
          <h3 className="flex items-center gap-2 font-semibold mb-3 text-success">
            <Check className="h-4 w-4" /> Strengths
          </h3>
          <ul className="space-y-2">
            {audit.strengths.map((s, i) => (
              <li key={i} className="text-sm flex gap-2">
                <span className="text-success mt-0.5">▸</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="glass-card p-5">
          <h3 className="flex items-center gap-2 font-semibold mb-3 text-destructive">
            <X className="h-4 w-4" /> Weaknesses
          </h3>
          <ul className="space-y-2">
            {audit.weaknesses.map((s, i) => (
              <li key={i} className="text-sm flex gap-2">
                <span className="text-destructive mt-0.5">▸</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="glass-card p-5">
        <h3 className="flex items-center gap-2 font-semibold mb-4">
          <Lightbulb className="h-4 w-4 text-primary" /> Title Suggestions
        </h3>
        <div className="space-y-2">
          {audit.suggestedTitles.map((t, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-secondary/30 p-3 hover:bg-secondary/60 transition-smooth"
            >
              <span className="text-sm">{t}</span>
              <Button size="sm" variant="ghost" onClick={() => copy(t, "Title")}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="glass-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Optimized Description</h3>
          <Button size="sm" variant="outline" onClick={() => copy(audit.suggestedDescription, "Description")}>
            <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
          </Button>
        </div>
        <pre className="whitespace-pre-wrap text-sm text-muted-foreground bg-background/40 rounded-lg p-4 max-h-72 overflow-auto font-sans leading-relaxed">
          {audit.suggestedDescription}
        </pre>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Tags</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copy(audit.suggestedTags.join(", "), "Tags")}
            >
              <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy all
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {audit.suggestedTags.map((t, i) => (
              <Badge key={i} variant="secondary" className="font-normal">
                {t}
              </Badge>
            ))}
          </div>
        </Card>
        <Card className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Hashtags</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copy(audit.suggestedHashtags.join(" "), "Hashtags")}
            >
              <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {audit.suggestedHashtags.map((t, i) => (
              <Badge key={i} className="bg-gradient-brand text-brand-foreground border-0">
                {t.startsWith("#") ? t : `#${t}`}
              </Badge>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass-card p-5">
          <h3 className="flex items-center gap-2 font-semibold mb-3">
            <ImageIcon className="h-4 w-4 text-primary" /> Thumbnail Tips
          </h3>
          <ul className="space-y-2">
            {audit.thumbnailTips.map((t, i) => (
              <li key={i} className="text-sm flex gap-2">
                <span className="text-primary mt-0.5">●</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="glass-card p-5">
          <h3 className="flex items-center gap-2 font-semibold mb-3">
            <Megaphone className="h-4 w-4 text-primary" /> CTA & Engagement
          </h3>
          <ul className="space-y-2">
            {audit.ctaTips.map((t, i) => (
              <li key={i} className="text-sm flex gap-2">
                <span className="text-primary mt-0.5">●</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
