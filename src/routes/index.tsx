import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link as LinkIcon, Sparkles, Lightbulb, Upload, Loader2, Video, Zap, ChevronDown, ChevronUp, Music2, Scissors } from "lucide-react";
import { Header } from "@/components/Header";
import { ResultsView, type AuditData } from "@/components/ResultsView";
import { ViralClipsView } from "@/components/ViralClipsView";
import { analyzeUrl, analyzeDraft, analyzeUpload, analyzeDraftWithVideo, analyzeTikTok, findViralClips } from "@/lib/seo.functions";
import type { ViralClipsResult } from "@/lib/seo.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TubeRank Pro — AI YouTube SEO Audits" },
      {
        name: "description",
        content:
          "Boost your YouTube rankings with AI-powered SEO audits. Analyze published videos, optimize drafts before publishing, and prep uploads with titles, tags & descriptions.",
      },
      { property: "og:title", content: "TubeRank Pro — AI YouTube SEO Audits" },
      {
        property: "og:description",
        content: "AI-powered SEO audits and optimization for YouTube creators.",
      },
    ],
  }),
  component: Index,
});

type Result = { audit: AuditData; videoMeta?: { title: string; author: string; thumbnail: string } };

function Index() {
  const runUrl = useServerFn(analyzeUrl);
  const runDraft = useServerFn(analyzeDraft);
  const runUpload = useServerFn(analyzeUpload);
  const runDraftWithVideo = useServerFn(analyzeDraftWithVideo);
  const runTikTok = useServerFn(analyzeTikTok);
  const runClips = useServerFn(findViralClips);

  const [tab, setTab] = useState("url");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [clipsResult, setClipsResult] = useState<ViralClipsResult | null>(null);

  // URL form
  const [url, setUrl] = useState("");

  // Draft (Pre-Publish) form
  const [dTopic, setDTopic] = useState("");
  const [dFormat, setDFormat] = useState<"long" | "short">("long");
  const [dNiche, setDNiche] = useState("");
  const [dContentType, setDContentType] = useState("");
  const [dAudience, setDAudience] = useState("");
  const [dLanguage, setDLanguage] = useState("English");
  const [dAdvanced, setDAdvanced] = useState(false);
  const [dKeywords, setDKeywords] = useState("");
  const [dTitle, setDTitle] = useState("");
  const [dDesc, setDDesc] = useState("");
  const [dTags, setDTags] = useState("");
  const [dFile, setDFile] = useState<File | null>(null);

  // Upload form
  const [uFile, setUFile] = useState<File | null>(null);
  const [uTitle, setUTitle] = useState("");

  // TikTok form
  const [tFile, setTFile] = useState<File | null>(null);
  const [tCaption, setTCaption] = useState("");
  const [tNiche, setTNiche] = useState("");

  // Viral Clips form
  const [clipsUrl, setClipsUrl] = useState("");

  async function run(fn: () => Promise<Result>) {
    setLoading(true);
    setResult(null);
    setClipsResult(null);
    try {
      const r = await fn();
      setResult(r);
      toast.success("Analysis complete");
      setTimeout(() => {
        document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const runClipsHandler = () => {
    setLoading(true);
    setResult(null);
    setClipsResult(null);
    runClips({ data: { url: clipsUrl } })
      .then((r) => {
        setClipsResult(r);
        if (r.fallback || r.clips.length === 0) {
          toast.error(r.userMessage || "We couldn't analyze this video right now.");
        } else {
          toast.success(`Found ${r.clips.length} viral clips`);
        }
        setTimeout(() => {
          document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      })
      .catch((e) => {
        const msg = e instanceof Error ? e.message : "Something went wrong";
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen">
      <Header />
      <Toaster theme="dark" position="top-center" />

      <main className="container mx-auto px-4 sm:px-6 py-12 max-w-4xl">
        <section className="text-center mb-12 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
            Rank higher on <span className="text-gradient">YouTube & TikTok</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get a ruthless, AI-powered audit with copy-paste titles, captions, hashtags, and viral
            hooks that actually move the needle.
          </p>
        </section>

        <Card className="glass-card p-2 mb-8">
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="w-full grid grid-cols-2 sm:grid-cols-5 bg-transparent p-1 h-auto gap-1">
              <TabsTrigger
                value="url"
                className="data-[state=active]:bg-gradient-brand data-[state=active]:text-brand-foreground rounded-lg py-2.5"
              >
                <LinkIcon className="h-4 w-4 mr-2" /> Analyze URL
              </TabsTrigger>
              <TabsTrigger
                value="clips"
                className="data-[state=active]:bg-gradient-brand data-[state=active]:text-brand-foreground rounded-lg py-2.5"
              >
                <Scissors className="h-4 w-4 mr-2" /> Viral Clips
              </TabsTrigger>
              <TabsTrigger
                value="draft"
                className="data-[state=active]:bg-gradient-brand data-[state=active]:text-brand-foreground rounded-lg py-2.5"
              >
                <Lightbulb className="h-4 w-4 mr-2" /> Pre-Publish
              </TabsTrigger>
              <TabsTrigger
                value="upload"
                className="data-[state=active]:bg-gradient-brand data-[state=active]:text-brand-foreground rounded-lg py-2.5"
              >
                <Upload className="h-4 w-4 mr-2" /> Video Upload
              </TabsTrigger>
              <TabsTrigger
                value="tiktok"
                className="data-[state=active]:bg-gradient-brand data-[state=active]:text-brand-foreground rounded-lg py-2.5"
              >
                <Music2 className="h-4 w-4 mr-2" /> TikTok
              </TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="p-5 pt-6 space-y-4">
              <div>
                <h2 className="font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Analyze a Published Video
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Paste any YouTube video or Shorts link for a detailed SEO audit.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="https://youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="bg-background/60"
                />
                <Button
                  disabled={loading || !url}
                  onClick={() => run(() => runUrl({ data: { url } }))}
                  className="bg-gradient-brand text-brand-foreground hover:opacity-90 shadow-glow"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  {loading ? "Scanning..." : "Scan"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="clips" className="p-5 pt-6 space-y-4">
              <div>
                <h2 className="font-semibold flex items-center gap-2">
                  <Scissors className="h-4 w-4 text-primary" /> Find Viral Clips in a YouTube Video
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Paste a long YouTube video URL. AI watches it and finds the 5 most viral-ready
                  moments — each with hook, main body, punchline, CTA, caption, hashtags, and a
                  one-click download.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="https://youtube.com/watch?v=..."
                  value={clipsUrl}
                  onChange={(e) => setClipsUrl(e.target.value)}
                  className="bg-background/60"
                />
                <Button
                  disabled={loading || !clipsUrl}
                  onClick={runClipsHandler}
                  className="bg-gradient-brand text-brand-foreground hover:opacity-90 shadow-glow"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scissors className="h-4 w-4 mr-2" />}
                  {loading ? "Watching video..." : "Find Clips"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Works best on public, non-age-restricted videos under 30 minutes. Takes ~20-40
                seconds.
              </p>
            </TabsContent>

            <TabsContent value="draft" className="p-5 pt-6 space-y-5">
              <div>
                <h2 className="font-semibold flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-primary" /> Pre-Publish SEO Generator
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Describe your video idea and get a complete, competition-beating SEO package before you publish.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-wide text-muted-foreground">
                  VIDEO TOPIC / DESCRIPTION *
                </label>
                <Textarea
                  placeholder="Describe your video idea in detail..."
                  value={dTopic}
                  onChange={(e) => setDTopic(e.target.value)}
                  className="bg-background/60 min-h-28"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-wide text-muted-foreground">
                  VIDEO FORMAT *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDFormat("long")}
                    className={`flex items-center justify-center gap-2 rounded-lg border py-3 text-sm font-medium transition-smooth ${
                      dFormat === "long"
                        ? "bg-primary/15 border-primary text-foreground"
                        : "bg-background/40 border-border/60 text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    <Video className="h-4 w-4" /> Long Video
                  </button>
                  <button
                    type="button"
                    onClick={() => setDFormat("short")}
                    className={`flex items-center justify-center gap-2 rounded-lg border py-3 text-sm font-medium transition-smooth ${
                      dFormat === "short"
                        ? "bg-primary/15 border-primary text-foreground"
                        : "bg-background/40 border-border/60 text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    <Zap className="h-4 w-4" /> YouTube Short
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-wide text-muted-foreground">
                    NICHE / CATEGORY
                  </label>
                  <Input
                    placeholder="e.g. Tech, Gaming, Beauty..."
                    value={dNiche}
                    onChange={(e) => setDNiche(e.target.value)}
                    className="bg-background/60"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-wide text-muted-foreground">
                    CONTENT TYPE
                  </label>
                  <Select value={dContentType} onValueChange={setDContentType}>
                    <SelectTrigger className="bg-background/60">
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tutorial">Tutorial / How-to</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="vlog">Vlog</SelectItem>
                      <SelectItem value="listicle">Listicle / Top N</SelectItem>
                      <SelectItem value="explainer">Explainer</SelectItem>
                      <SelectItem value="reaction">Reaction</SelectItem>
                      <SelectItem value="interview">Interview / Podcast</SelectItem>
                      <SelectItem value="story">Storytime</SelectItem>
                      <SelectItem value="news">News / Commentary</SelectItem>
                      <SelectItem value="gameplay">Gameplay</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-wide text-muted-foreground">
                    TARGET AUDIENCE
                  </label>
                  <Input
                    placeholder="e.g. Beginners, Ages 18-25..."
                    value={dAudience}
                    onChange={(e) => setDAudience(e.target.value)}
                    className="bg-background/60"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-wide text-muted-foreground">
                    LANGUAGE
                  </label>
                  <Select value={dLanguage} onValueChange={setDLanguage}>
                    <SelectTrigger className="bg-background/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["English", "Hindi", "Spanish", "Portuguese", "French", "German", "Arabic", "Indonesian", "Japanese", "Korean", "Mandarin", "Russian", "Turkish"].map((l) => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-wide text-muted-foreground">
                  VIDEO FILE (OPTIONAL — AI WILL ACTUALLY WATCH IT)
                </label>
                <label className="block">
                  <div className="border-2 border-dashed border-border/60 rounded-xl p-5 text-center cursor-pointer hover:border-primary/60 transition-smooth bg-background/30">
                    <Video className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm">
                      {dFile ? (
                        <span className="text-foreground font-medium">{dFile.name}</span>
                      ) : (
                        "Upload your draft video (silent / music-only OK)"
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {dFile
                        ? `${(dFile.size / (1024 * 1024)).toFixed(1)} MB · AI will watch visuals + audio and ground every recommendation in the footage`
                        : "Max 20 MB · MP4, MOV, WebM · No voice needed — AI reads visuals, on-screen text, mood & pacing"}
                    </p>
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        if (f && f.size > 20 * 1024 * 1024) {
                          toast.error("File too large. Please upload under 20 MB (trim or compress).");
                          return;
                        }
                        setDFile(f);
                      }}
                    />
                  </div>
                </label>
                {dFile && (
                  <button
                    type="button"
                    onClick={() => setDFile(null)}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    Remove video
                  </button>
                )}
              </div>
              </div>

              <button
                type="button"
                onClick={() => setDAdvanced((v) => !v)}
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                {dAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {dAdvanced ? "Hide Advanced Options" : "Show Advanced Options"}
              </button>

              {dAdvanced && (
                <div className="space-y-3 rounded-lg border border-border/60 bg-background/30 p-4">
                  <Input
                    placeholder="Target keywords (comma-separated, optional)"
                    value={dKeywords}
                    onChange={(e) => setDKeywords(e.target.value)}
                    className="bg-background/60"
                  />
                  <Input
                    placeholder="Existing draft title (optional)"
                    value={dTitle}
                    onChange={(e) => setDTitle(e.target.value)}
                    className="bg-background/60"
                  />
                  <Textarea
                    placeholder="Existing draft description (optional)"
                    value={dDesc}
                    onChange={(e) => setDDesc(e.target.value)}
                    className="bg-background/60 min-h-24"
                  />
                  <Input
                    placeholder="Existing draft tags (comma-separated, optional)"
                    value={dTags}
                    onChange={(e) => setDTags(e.target.value)}
                    className="bg-background/60"
                  />
                </div>
              )}

              <Button
                disabled={loading || dTopic.trim().length < 5}
                onClick={() =>
                  run(async () => {
                    const baseData = {
                      topic: dTopic,
                      format: dFormat,
                      niche: dNiche,
                      contentType: dContentType,
                      audience: dAudience,
                      language: dLanguage,
                      keywords: dKeywords,
                      draftTitle: dTitle,
                      draftDescription: dDesc,
                      draftTags: dTags,
                    };
                    if (dFile) {
                      const buf = await dFile.arrayBuffer();
                      const bytes = new Uint8Array(buf);
                      let binary = "";
                      const chunk = 0x8000;
                      for (let i = 0; i < bytes.length; i += chunk) {
                        binary += String.fromCharCode.apply(
                          null,
                          Array.from(bytes.subarray(i, i + chunk)),
                        );
                      }
                      const dataBase64 = btoa(binary);
                      return runDraftWithVideo({
                        data: {
                          ...baseData,
                          filename: dFile.name,
                          mimeType: dFile.type || "video/mp4",
                          dataBase64,
                        },
                      });
                    }
                    return runDraft({ data: baseData });
                  })
                }
                className="bg-gradient-brand text-brand-foreground hover:opacity-90 shadow-glow w-full"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                {loading ? (dFile ? "Watching your video..." : "Generating...") : dFile ? "Watch Video & Generate SEO Package" : "Generate Full SEO Package"}
              </Button>
            </TabsContent>

            <TabsContent value="upload" className="p-5 pt-6 space-y-4">
              <div>
                <h2 className="font-semibold flex items-center gap-2">
                  <Upload className="h-4 w-4 text-primary" /> Generate SEO Kit for an Upload
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Drop your video — our AI watches it and writes the entire SEO kit for you.
                </p>
              </div>
              <label className="block">
                <div className="border-2 border-dashed border-border/60 rounded-xl p-6 text-center cursor-pointer hover:border-primary/60 transition-smooth bg-background/30">
                  <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm">
                    {uFile ? <span className="text-foreground font-medium">{uFile.name}</span> : "Click to select your video file"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {uFile
                      ? `${(uFile.size / (1024 * 1024)).toFixed(1)} MB · sent securely for AI analysis`
                      : "Max 20 MB · MP4, MOV, WebM"}
                  </p>
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      if (f && f.size > 20 * 1024 * 1024) {
                        toast.error("File too large. Please upload under 20 MB (trim or compress).");
                        return;
                      }
                      setUFile(f);
                    }}
                  />
                </div>
              </label>
              <Input
                placeholder="Intended title (optional — AI will suggest if empty)"
                value={uTitle}
                onChange={(e) => setUTitle(e.target.value)}
                className="bg-background/60"
              />
              <Button
                disabled={loading || !uFile}
                onClick={() =>
                  run(async () => {
                    const file = uFile!;
                    const buf = await file.arrayBuffer();
                    // Convert to base64 in chunks to avoid call-stack overflow
                    const bytes = new Uint8Array(buf);
                    let binary = "";
                    const chunk = 0x8000;
                    for (let i = 0; i < bytes.length; i += chunk) {
                      binary += String.fromCharCode.apply(
                        null,
                        Array.from(bytes.subarray(i, i + chunk)),
                      );
                    }
                    const dataBase64 = btoa(binary);
                    return runUpload({
                      data: {
                        filename: file.name,
                        intendedTitle: uTitle,
                        mimeType: file.type || "video/mp4",
                        dataBase64,
                      },
                    });
                  })
                }
                className="bg-gradient-brand text-brand-foreground hover:opacity-90 shadow-glow w-full"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                {loading ? "Watching your video..." : "Generate SEO kit"}
              </Button>
            </TabsContent>

            <TabsContent value="tiktok" className="p-5 pt-6 space-y-4">
              <div>
                <h2 className="font-semibold flex items-center gap-2">
                  <Music2 className="h-4 w-4 text-primary" /> TikTok Viral Kit
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Drop your TikTok video — AI watches it and writes scroll-stopping hooks, a viral
                  caption, 5 perfect hashtags, and a posting strategy to help it blow up.
                </p>
              </div>
              <label className="block">
                <div className="border-2 border-dashed border-border/60 rounded-xl p-6 text-center cursor-pointer hover:border-primary/60 transition-smooth bg-background/30">
                  <Music2 className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm">
                    {tFile ? <span className="text-foreground font-medium">{tFile.name}</span> : "Click to upload your TikTok video"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {tFile
                      ? `${(tFile.size / (1024 * 1024)).toFixed(1)} MB · AI will watch every second`
                      : "Max 20 MB · MP4, MOV · Vertical 9:16 recommended · Music-only / silent works"}
                  </p>
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      if (f && f.size > 20 * 1024 * 1024) {
                        toast.error("File too large. Please upload under 20 MB (trim or compress).");
                        return;
                      }
                      setTFile(f);
                    }}
                  />
                </div>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  placeholder="Niche (e.g. fitness, fashion, comedy) — optional"
                  value={tNiche}
                  onChange={(e) => setTNiche(e.target.value)}
                  className="bg-background/60"
                />
                <Input
                  placeholder="Intended caption (optional)"
                  value={tCaption}
                  onChange={(e) => setTCaption(e.target.value)}
                  className="bg-background/60"
                />
              </div>
              <Button
                disabled={loading || !tFile}
                onClick={() =>
                  run(async () => {
                    const file = tFile!;
                    const buf = await file.arrayBuffer();
                    const bytes = new Uint8Array(buf);
                    let binary = "";
                    const chunk = 0x8000;
                    for (let i = 0; i < bytes.length; i += chunk) {
                      binary += String.fromCharCode.apply(
                        null,
                        Array.from(bytes.subarray(i, i + chunk)),
                      );
                    }
                    const dataBase64 = btoa(binary);
                    return runTikTok({
                      data: {
                        filename: file.name,
                        intendedCaption: tCaption,
                        niche: tNiche,
                        mimeType: file.type || "video/mp4",
                        dataBase64,
                      },
                    });
                  })
                }
                className="bg-gradient-brand text-brand-foreground hover:opacity-90 shadow-glow w-full"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Music2 className="h-4 w-4 mr-2" />}
                {loading ? "Watching your TikTok..." : "Make my TikTok go viral"}
              </Button>
            </TabsContent>
          </Tabs>
        </Card>

        {loading && (
          <Card className="glass-card p-12 text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary mb-4" />
            <p className="font-medium">Analyzing with AI...</p>
            <p className="text-sm text-muted-foreground mt-1">This usually takes 5-15 seconds</p>
          </Card>
        )}

        {result && (
          <div id="results">
            <ResultsView audit={result.audit} videoMeta={result.videoMeta} />
          </div>
        )}

        {clipsResult && (
          <div id="results">
            <ViralClipsView data={clipsResult} />
          </div>
        )}

        <footer className="text-center text-xs text-muted-foreground mt-16 pb-6">
          {"\n"}
        </footer>
      </main>
    </div>
  );
}
