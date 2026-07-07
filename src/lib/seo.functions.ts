import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const auditSchema = {
  name: "seo_audit",
  description: "Return a structured YouTube SEO audit",
  parameters: {
    type: "object",
    properties: {
      overallScore: { type: "number", description: "0-100" },
      titleScore: { type: "number" },
      descriptionScore: { type: "number" },
      tagsScore: { type: "number" },
      thumbnailScore: { type: "number" },
      summary: { type: "string" },
      strengths: { type: "array", items: { type: "string" } },
      weaknesses: { type: "array", items: { type: "string" } },
      suggestedTitles: { type: "array", items: { type: "string" } },
      suggestedDescription: { type: "string" },
      suggestedTags: { type: "array", items: { type: "string" } },
      suggestedHashtags: { type: "array", items: { type: "string" } },
      thumbnailTips: { type: "array", items: { type: "string" } },
      ctaTips: { type: "array", items: { type: "string" } },
    },
    required: [
      "overallScore",
      "titleScore",
      "descriptionScore",
      "tagsScore",
      "thumbnailScore",
      "summary",
      "strengths",
      "weaknesses",
      "suggestedTitles",
      "suggestedDescription",
      "suggestedTags",
      "suggestedHashtags",
      "thumbnailTips",
      "ctaTips",
    ],
    additionalProperties: false,
  },
};

type UserContent = string | Array<
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
>;

async function callAi(systemPrompt: string, userPrompt: UserContent, model = "google/gemini-2.5-flash") {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

  const res = await fetch(LOVABLE_AI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [{ type: "function", function: auditSchema }],
      tool_choice: { type: "function", function: { name: "seo_audit" } },
    }),
  });

  if (res.status === 429) throw new Error("Rate limited. Try again in a moment.");
  if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Workspace > Usage.");
  if (!res.ok) {
    const t = await res.text();
    console.error("AI error", res.status, t);
    throw new Error(`AI gateway error (${res.status})`);
  }

  const data = await res.json();
  const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) throw new Error("No structured response from AI");
  return JSON.parse(args);
}

function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1).split("/")[0] || null;
    if (u.searchParams.get("v")) return u.searchParams.get("v");
    const parts = u.pathname.split("/");
    const sIdx = parts.indexOf("shorts");
    if (sIdx >= 0 && parts[sIdx + 1]) return parts[sIdx + 1];
    const eIdx = parts.indexOf("embed");
    if (eIdx >= 0 && parts[eIdx + 1]) return parts[eIdx + 1];
  } catch {
    return null;
  }
  return null;
}

async function fetchOEmbed(videoId: string) {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const SYSTEM = `You are an elite YouTube SEO strategist. You analyze videos and produce concrete, high-impact recommendations to maximize CTR, watch time, and discoverability. Always be specific, actionable, and use proven YouTube SEO patterns (curiosity gap, keyword front-loading, emotional hooks, broll tags, hashtags, chapter timestamps).`;

export const analyzeUrl = createServerFn({ method: "POST" })
  .inputValidator((d: { url: string }) => z.object({ url: z.string().url().max(500) }).parse(d))
  .handler(async ({ data }) => {
    const videoId = extractVideoId(data.url);
    if (!videoId) throw new Error("Could not detect a YouTube video ID in that URL.");
    const meta = await fetchOEmbed(videoId);
    const title = meta?.title || "Unknown title";
    const author = meta?.author_name || "Unknown channel";
    const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    const prompt = `Audit this YouTube video for SEO and growth.

Video URL: ${data.url}
Video ID: ${videoId}
Title: ${title}
Channel: ${author}
Thumbnail (auto): ${thumbnail}

Since you don't have the live description/tags, infer the niche from the title and channel, then:
1) Score the current title (0-100) based on length, keyword placement, curiosity, emotion.
2) Estimate description and tags scores (assume average if unknown — be honest in summary).
3) Score the auto thumbnail concept (0-100) and give specific visual fixes.
4) Provide 5 punchier alternative titles (<= 60 chars, keyword-front-loaded).
5) Provide a polished 250-400 word description with timestamps placeholder, links section, and CTA.
6) Provide 20 ranked tags (most important first) and 5 hashtags.
7) Give 4 concrete thumbnail tips and 3 CTA / engagement tips.

Be ruthless and specific. No fluff.`;

    const audit = await callAi(SYSTEM, prompt);
    return { videoId, title, author, thumbnail, audit };
  });

export const analyzeDraft = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      topic: string;
      format: "long" | "short";
      niche?: string;
      contentType?: string;
      audience?: string;
      language?: string;
      keywords?: string;
      draftTitle?: string;
      draftDescription?: string;
      draftTags?: string;
    }) =>
      z
        .object({
          topic: z.string().min(5).max(3000),
          format: z.enum(["long", "short"]).default("long"),
          niche: z.string().max(200).optional().default(""),
          contentType: z.string().max(100).optional().default(""),
          audience: z.string().max(300).optional().default(""),
          language: z.string().max(50).optional().default("English"),
          keywords: z.string().max(1000).optional().default(""),
          draftTitle: z.string().max(200).optional().default(""),
          draftDescription: z.string().max(5000).optional().default(""),
          draftTags: z.string().max(2000).optional().default(""),
        })
        .parse(d),
  )
  .handler(async ({ data }) => {
    const prompt = `Pre-publish SEO package generator. The creator has NOT yet filmed/published — generate a complete, competition-beating SEO kit from their idea.

VIDEO TOPIC / IDEA:
${data.topic}

Format: ${data.format === "short" ? "YouTube Short (vertical, <60s)" : "Long-form YouTube video"}
Niche / Category: ${data.niche || "(not specified — infer)"}
Content type: ${data.contentType || "(not specified — infer)"}
Target audience: ${data.audience || "(not specified — infer)"}
Language: ${data.language || "English"}
Target keywords (optional): ${data.keywords || "(none — propose the best)"}

Draft title (if any): ${data.draftTitle || "(none — propose one)"}
Draft description (if any): ${data.draftDescription || "(none)"}
Draft tags (if any): ${data.draftTags || "(none)"}

Deliver:
1) Score the current draft (title/description/tags/thumbnail concept). If fields are empty, score them honestly low and explain.
2) 5 punchy alternative titles (<=60 chars, keyword-front-loaded, tuned for the format and audience).
3) A polished ${data.format === "short" ? "80-150 word" : "250-400 word"} description with timestamp placeholders (long-form only), links section, and CTA, written in ${data.language || "English"}.
4) 20 ranked tags (most important first) + 5 hashtags, all relevant to the topic, niche and audience.
5) 4 specific thumbnail concepts + 3 engagement/CTA tips tailored to this exact idea.

Be ruthless and specific. Ground every recommendation in the provided topic.`;
    const audit = await callAi(SYSTEM, prompt);
    return { audit, draft: data };
  });

export const analyzeDraftWithVideo = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      topic: string;
      format: "long" | "short";
      niche?: string;
      contentType?: string;
      audience?: string;
      language?: string;
      keywords?: string;
      draftTitle?: string;
      draftDescription?: string;
      draftTags?: string;
      filename: string;
      mimeType: string;
      dataBase64: string;
    }) =>
      z
        .object({
          topic: z.string().min(5).max(3000),
          format: z.enum(["long", "short"]).default("long"),
          niche: z.string().max(200).optional().default(""),
          contentType: z.string().max(100).optional().default(""),
          audience: z.string().max(300).optional().default(""),
          language: z.string().max(50).optional().default("English"),
          keywords: z.string().max(1000).optional().default(""),
          draftTitle: z.string().max(200).optional().default(""),
          draftDescription: z.string().max(5000).optional().default(""),
          draftTags: z.string().max(2000).optional().default(""),
          filename: z.string().min(1).max(300),
          mimeType: z.string().min(1).max(100),
          dataBase64: z.string().min(100).max(35_000_000),
        })
        .parse(d),
  )
  .handler(async ({ data }) => {
    const dataUrl = `data:${data.mimeType};base64,${data.dataBase64}`;

    const textPrompt = `You are auditing a YouTube video the creator is about to publish. WATCH the video I'm sending (visuals AND audio — if there's only music, describe the mood, pacing, visuals, on-screen text, and what happens scene by scene). Ground every recommendation in what you ACTUALLY see and hear — not assumptions.

Creator's stated context:
- Topic / idea: ${data.topic}
- Format: ${data.format === "short" ? "YouTube Short (vertical, <60s)" : "Long-form YouTube video"}
- Niche / Category: ${data.niche || "(not specified — infer from the footage)"}
- Content type: ${data.contentType || "(infer from the footage)"}
- Target audience: ${data.audience || "(infer from the footage)"}
- Language: ${data.language || "English"}
- Target keywords (optional): ${data.keywords || "(none — propose the best from what you saw)"}
- Draft title (if any): ${data.draftTitle || "(none — propose one from the footage)"}
- Draft description (if any): ${data.draftDescription || "(none)"}
- Draft tags (if any): ${data.draftTags || "(none)"}

Deliver:
1) Identify the actual topic, niche, key moments, and mood of the video from the footage itself. Reconcile with the creator's stated context — if they contradict, trust the video and call it out in the summary.
2) Score the draft (title/description/tags/thumbnail potential) honestly. Low if empty or weak.
3) 5 punchy alternative titles (<=60 chars, keyword-front-loaded, curiosity-driven) based on what actually happens in the video.
4) A polished ${data.format === "short" ? "80-150 word" : "250-400 word"} description in ${data.language || "English"} with timestamp placeholders mapped to real beats you observed${data.format === "short" ? " (skip timestamps for Shorts)" : ""}, links section, and CTA.
5) 20 ranked tags (most important first) + 5 hashtags — all relevant to what's actually in the video AND to the niche/audience.
6) 4 specific thumbnail concepts using real visuals from the video + 3 engagement/CTA tips tailored to this exact video.

Be ruthless and specific. No fluff. If the video is silent/music-only, explicitly say so and tune the description/CTA accordingly.`;

    const audit = await callAi(
      SYSTEM,
      [
        { type: "text", text: textPrompt },
        { type: "image_url", image_url: { url: dataUrl } },
      ],
      "google/gemini-2.5-pro",
    );
    return { audit, draft: { ...data, dataBase64: undefined } };
  });

const TIKTOK_SYSTEM = `You are an elite TikTok growth strategist who has scaled multiple accounts past 1M followers. You understand the TikTok algorithm: hook in the first 1-3 seconds, watch-time + completion rate + rewatches drive virality, captions tease but don't spoil, hashtags blend broad + niche + trending, sounds matter, and CTAs are subtle ("comment your guess", "save for later", "wait for it"). You analyze video footage directly and return ruthless, copy-paste-ready output.`;

export const analyzeTikTok = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { filename: string; intendedCaption?: string; niche?: string; mimeType: string; dataBase64: string }) =>
      z
        .object({
          filename: z.string().min(1).max(300),
          intendedCaption: z.string().max(500).optional().default(""),
          niche: z.string().max(200).optional().default(""),
          mimeType: z.string().min(1).max(100),
          dataBase64: z.string().min(100).max(35_000_000),
        })
        .parse(d),
  )
  .handler(async ({ data }) => {
    const dataUrl = `data:${data.mimeType};base64,${data.dataBase64}`;

    const textPrompt = `You are auditing a TikTok video the creator is about to post. WATCH the video (visuals + audio — if it's music-only or silent, describe mood, pacing, on-screen text, and scene-by-scene action). Ground EVERY recommendation in what you actually see and hear.

Creator context:
- Filename: ${data.filename}
- Niche (optional): ${data.niche || "(infer from the footage)"}
- Intended caption (optional): ${data.intendedCaption || "(none — propose one)"}

Map your output into this structure:
- overallScore: viral potential 0-100 based on hook strength, pacing, watch-time potential, rewatch value, and clarity.
- titleScore: hook/caption strength (first 3 seconds + caption combined).
- descriptionScore: caption quality (curiosity, keywords, length, CTA).
- tagsScore: estimated hashtag relevance & discoverability based on the niche detected.
- thumbnailScore: cover-frame / first-frame stopping power.
- summary: ruthless 3-4 sentence verdict explaining viral potential and the #1 thing to fix.
- strengths: 4-6 specific things this video does well (cite real moments).
- weaknesses: 4-6 specific things hurting reach (weak hook, slow start, bad lighting, unclear payoff, etc.).
- suggestedTitles: 5 punchy TikTok captions/hooks (<=100 chars each) that create a curiosity gap, tease the payoff, and front-load keywords. Mix POV, question, listicle, and "wait for it" styles.
- suggestedDescription: ONE polished, ready-to-paste TikTok caption (120-220 chars) including a hook line, a curiosity tease, a soft CTA (comment/save/follow), and 2-3 inline keywords. No hashtag block here — hashtags go below.
- suggestedTags: 20 ranked TikTok keywords/SEO phrases (most important first) tuned for TikTok search — what people would type to find this video. Lowercase, no # symbol.
- suggestedHashtags: exactly 5 hashtags (mix: 1 broad/trending, 2 niche, 2 micro-niche). Include the # symbol. These are the 5 hashtags the creator should post with.
- thumbnailTips: 4 specific cover-frame / first-frame fixes to maximize stop-scroll (which exact frame to pick, on-screen text overlay, facial expression, contrast).
- ctaTips: 4 virality boosters tailored to THIS video — trending sound suggestion, posting time, comment-bait line, duet/stitch hook, pinned-comment idea.

Be ruthless. No fluff. Every line must reference what you actually saw or heard.`;

    const audit = await callAi(
      TIKTOK_SYSTEM,
      [
        { type: "text", text: textPrompt },
        { type: "image_url", image_url: { url: dataUrl } },
      ],
      "google/gemini-2.5-pro",
    );
    return { audit, input: { filename: data.filename, intendedCaption: data.intendedCaption, niche: data.niche } };
  });

const clipsSchema = {
  name: "viral_clips",
  description: "Return a list of viral clip candidates from a YouTube video",
  parameters: {
    type: "object",
    properties: {
      videoSummary: { type: "string", description: "2-3 sentence summary of what the video is about" },
      clips: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "Punchy clip title (<=70 chars)" },
            startSeconds: { type: "number", description: "Clip start in seconds from video beginning" },
            endSeconds: { type: "number", description: "Clip end in seconds (must be 15-90s after start for max virality)" },
            viralScore: { type: "number", description: "0-100 likelihood this clip goes viral" },
            hook: { type: "string", description: "The opening 1-3 second hook line — what stops the scroll" },
            mainBody: { type: "string", description: "What happens in the meat of the clip — the value/story/tension" },
            punchLine: { type: "string", description: "The payoff / twist / aha moment that lands the clip" },
            callToAction: { type: "string", description: "Soft CTA tailored to the clip (comment / save / follow / part 2 tease)" },
            suggestedCaption: { type: "string", description: "Ready-to-paste caption for Shorts / Reels / TikTok (<=200 chars)" },
            suggestedHashtags: { type: "array", items: { type: "string" }, description: "Exactly 5 hashtags with #" },
            whyItWorks: { type: "string", description: "1-2 sentences on why this specific moment will go viral" },
          },
          required: ["title", "startSeconds", "endSeconds", "viralScore", "hook", "mainBody", "punchLine", "callToAction", "suggestedCaption", "suggestedHashtags", "whyItWorks"],
        },
      },
    },
    required: ["videoSummary", "clips"],
    additionalProperties: false,
  },
};

export type ViralClip = {
  title: string;
  startSeconds: number;
  endSeconds: number;
  viralScore: number;
  hook: string;
  mainBody: string;
  punchLine: string;
  callToAction: string;
  suggestedCaption: string;
  suggestedHashtags: string[];
  whyItWorks: string;
};

export type ViralClipsResult = {
  videoId: string;
  title: string;
  author: string;
  thumbnail: string;
  videoUrl: string;
  videoSummary: string;
  clips: ViralClip[];
  fallback?: boolean;
  error?: "TRANSCRIPT_FETCH_FAILED" | "SERVICE_FAILED";
  userMessage?: string;
};

type TranscriptEntry = { start: number; dur: number; text: string };

async function parseTimedTextJson(text: string): Promise<TranscriptEntry[]> {
  const entries: TranscriptEntry[] = [];
  try {
    const data = JSON.parse(text) as {
      events?: Array<{ tStartMs?: number; dDurationMs?: number; segs?: Array<{ utf8?: string }> }>;
    };
    if (!data.events) return entries;
    for (const ev of data.events) {
      if (typeof ev.tStartMs !== "number" || !ev.segs) continue;
      const t = ev.segs.map((s) => s.utf8 || "").join("").replace(/\n/g, " ").trim();
      if (!t) continue;
      entries.push({ start: ev.tStartMs / 1000, dur: (ev.dDurationMs || 0) / 1000, text: t });
    }
  } catch {
    // ignore
  }
  return entries;
}

function parseTimedTextXml(xml: string): TranscriptEntry[] {
  const entries: TranscriptEntry[] = [];
  const re = /<text\s+start="([\d.]+)"(?:\s+dur="([\d.]+)")?[^>]*>([\s\S]*?)<\/text>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const start = parseFloat(m[1]);
    const dur = m[2] ? parseFloat(m[2]) : 0;
    const text = m[3]
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/<[^>]+>/g, "")
      .replace(/\n/g, " ")
      .trim();
    if (text) entries.push({ start, dur, text });
  }
  return entries;
}

async function fetchYouTubeTranscript(videoId: string): Promise<TranscriptEntry[] | null> {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
  };

  // Strategy 1: directly try common languages with both manual + auto-generated tracks, json3 + xml
  const langs = ["en", "en-US", "en-GB"];
  for (const lang of langs) {
    for (const kind of ["", "&kind=asr"]) {
      for (const fmt of ["&fmt=json3", ""]) {
        try {
          const url = `https://www.youtube.com/api/timedtext?lang=${lang}&v=${videoId}${kind}${fmt}`;
          const res = await fetch(url, { headers });
          if (!res.ok) continue;
          const text = await res.text();
          if (!text || text.length < 50) continue;
          const entries = fmt ? await parseTimedTextJson(text) : parseTimedTextXml(text);
          if (entries.length > 5) return entries;
        } catch {
          /* continue */
        }
      }
    }
  }

  // Strategy 2: scrape watch page for caption tracks listed in playerResponse
  try {
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en`, { headers });
    if (pageRes.ok) {
      const html = await pageRes.text();
      const match = html.match(/"captionTracks":(\[.*?\])/);
      if (match) {
        const tracks = JSON.parse(match[1]) as Array<{ baseUrl: string; languageCode?: string; kind?: string }>;
        // Prefer English manual, then English ASR, then any
        tracks.sort((a, b) => {
          const score = (t: typeof a) =>
            (t.languageCode?.startsWith("en") ? 0 : 10) + (t.kind === "asr" ? 1 : 0);
          return score(a) - score(b);
        });
        for (const track of tracks.slice(0, 3)) {
          try {
            const baseUrl = track.baseUrl.replace(/\\u0026/g, "&");
            const tRes = await fetch(`${baseUrl}&fmt=json3`, { headers });
            if (!tRes.ok) continue;
            const text = await tRes.text();
            const entries = await parseTimedTextJson(text);
            if (entries.length > 5) return entries;
            const xmlEntries = parseTimedTextXml(text);
            if (xmlEntries.length > 5) return xmlEntries;
          } catch {
            /* continue */
          }
        }
      }
    }
  } catch {
    /* fallthrough */
  }

  return null;
}

function buildViralClipFallback(params: {
  videoId: string;
  title: string;
  author: string;
  thumbnail: string;
  videoUrl: string;
  error: ViralClipsResult["error"];
  userMessage: string;
}): ViralClipsResult {
  return {
    videoId: params.videoId,
    title: params.title,
    author: params.author,
    thumbnail: params.thumbnail,
    videoUrl: params.videoUrl,
    videoSummary: "We couldn't extract enough caption data from this video to safely identify viral short-form moments.",
    clips: [],
    fallback: true,
    error: params.error,
    userMessage: params.userMessage,
  };
}

export const findViralClips = createServerFn({ method: "POST" })
  .inputValidator((d: { url: string }) => z.object({ url: z.string().url().max(500) }).parse(d))
  .handler(async ({ data }): Promise<ViralClipsResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const videoId = extractVideoId(data.url);
    if (!videoId) throw new Error("Could not detect a YouTube video ID in that URL.");
    const meta = await fetchOEmbed(videoId);
    const title = meta?.title || "Unknown title";
    const author = meta?.author_name || "Unknown channel";
    const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    try {
      const transcript = await fetchYouTubeTranscript(videoId);
      if (!transcript || transcript.length === 0) {
        return buildViralClipFallback({
          videoId,
          title,
          author,
          thumbnail,
          videoUrl,
          error: "TRANSCRIPT_FETCH_FAILED",
          userMessage:
            "We couldn't fetch captions for this video. Try a public video with captions/subtitles enabled, or use a different video.",
        });
      }

      const MAX_ENTRIES = 1500;
      const entries = transcript.slice(0, MAX_ENTRIES);
      const transcriptText = entries.map((e) => `[${Math.floor(e.start)}s] ${e.text}`).join("\n");

      const systemPrompt = `You are an elite short-form clip strategist. You read long YouTube video transcripts (with timestamps) and identify the EXACT 15-90 second moments most likely to go viral as Shorts/Reels/TikToks. You think in terms of: HOOK (first 1-3s scroll-stopper), MAIN BODY (the tension/value/story), PUNCH LINE (payoff/twist/aha), CTA (soft engagement bait). You give precise start/end timestamps grounded in the transcript.`;

      const userPrompt = `Video: ${title} by ${author}
URL: ${videoUrl}

TRANSCRIPT (each line prefixed with timestamp in seconds from start):
${transcriptText}

Find the 5 most viral-ready clip moments from this transcript.

For each clip:
- Pick a moment that is naturally self-contained (15-90 seconds long, ideally 30-60s).
- Set startSeconds and endSeconds based on the EXACT timestamps in the transcript.
- HOOK: quote/paraphrase the opening 1-3 seconds — what stops the scroll.
- MAIN BODY: what happens in the meat of the clip.
- PUNCH LINE: the payoff/twist/aha that lands the clip.
- Soft CTA tailored to that specific clip.
- A copy-paste caption + 5 hashtags for Shorts/Reels/TikTok.
- Score viral potential 0-100 honestly.

Also write a 2-3 sentence videoSummary.

Return 5 clips, ranked by viral potential (highest first). Ground every timestamp in the transcript above.`;

      const res = await fetch(LOVABLE_AI_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [{ type: "function", function: clipsSchema }],
          tool_choice: { type: "function", function: { name: "viral_clips" } },
        }),
      });

      if (res.status === 429) throw new Error("Rate limited. Try again in a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Workspace > Usage.");
      if (!res.ok) {
        const t = await res.text();
        console.error("AI error", res.status, t);
        throw new Error(`AI gateway error (${res.status}): ${t.slice(0, 200)}`);
      }

      const json = await res.json();
      const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      if (!args) throw new Error("No structured response from AI");
      const parsed = JSON.parse(args) as { videoSummary: string; clips: ViralClip[] };

      return {
        videoId,
        title,
        author,
        thumbnail,
        videoUrl,
        videoSummary: parsed.videoSummary,
        clips: parsed.clips,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      console.error("findViralClips failed", { videoId, message });

      if (message.toLowerCase().includes("transcript") || message.toLowerCase().includes("caption")) {
        return buildViralClipFallback({
          videoId,
          title,
          author,
          thumbnail,
          videoUrl,
          error: "TRANSCRIPT_FETCH_FAILED",
          userMessage:
            "We couldn't fetch captions for this video. Try a public video with captions/subtitles enabled, or use a different video.",
        });
      }

      return buildViralClipFallback({
        videoId,
        title,
        author,
        thumbnail,
        videoUrl,
        error: "SERVICE_FAILED",
        userMessage: "Something went wrong while analyzing this video. Please try again in a moment.",
      });
    }
  });

export const analyzeUpload = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { filename: string; intendedTitle?: string; mimeType: string; dataBase64: string }) =>
      z
        .object({
          filename: z.string().min(1).max(300),
          intendedTitle: z.string().max(200).optional().default(""),
          mimeType: z.string().min(1).max(100),
          dataBase64: z.string().min(100).max(35_000_000), // ~25MB base64
        })
        .parse(d),
  )
  .handler(async ({ data }) => {
    const dataUrl = `data:${data.mimeType};base64,${data.dataBase64}`;

    const textPrompt = `You are auditing a YouTube video that the creator is about to upload. WATCH THE VIDEO I'm sending you and base your entire analysis on what you actually see and hear in it.

Filename: ${data.filename}
Intended title (may be empty): ${data.intendedTitle || "(none — propose one based on the video)"}

Your job:
1) Identify the actual topic, niche, and key moments of the video from the footage itself.
2) Score the intended title (be honest — score low if missing or weak).
3) Produce 5 punchy alternative titles (<=60 chars, keyword-front-loaded, curiosity-driven) that genuinely reflect the video content.
4) Write a polished 250-400 word YouTube description with timestamp placeholders mapped to real beats you observed, links section, and CTA.
5) Provide 20 ranked tags (most important first) and 5 hashtags — all relevant to what's actually in the video.
6) Score thumbnail potential and give 4 specific thumbnail concepts based on visuals from the video.
7) Give 3 concrete CTA / engagement tips tailored to this video's content.

Be ruthless and specific. No fluff. Ground every recommendation in what you saw.`;

    const audit = await callAi(
      SYSTEM,
      [
        { type: "text", text: textPrompt },
        { type: "image_url", image_url: { url: dataUrl } },
      ],
      "google/gemini-2.5-pro",
    );
    return { audit, input: { filename: data.filename, intendedTitle: data.intendedTitle } };
  });
