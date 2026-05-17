"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft, Sparkles, Loader2, Save, Check, Key, Shield, LogIn, LogOut, ClipboardPaste, X } from "lucide-react";
import { Concept } from "@/types";
import { getAllConceptsAsync, saveConceptToDb, hideConceptInDb, invalidateConceptsCache } from "@/lib/concepts";
import { getSettingsAsync, saveToDb } from "@/lib/db";
import { parseLocalDate } from "@/lib/date";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Auth type toggle: "apikey" | "oauth" | "oauth-browser"
  const [authType, setAuthType] = useState<"apikey" | "oauth" | "oauth-browser">("apikey");

  // API config
  const [apiKey, setApiKey] = useState("");
  const [oauthToken, setOauthToken] = useState("");
  const [credentialStatus, setCredentialStatus] = useState<"none" | "configured">("none");

  // OAuth browser flow state
  const [oauthCodeVerifier, setOauthCodeVerifier] = useState<string | null>(null);
  const [oauthCode, setOauthCode] = useState("");
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthConnected, setOauthConnected] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

  // Summary length
  const [summaryLength, setSummaryLength] = useState(4);

  // Model selection
  const [selectedModel, setSelectedModel] = useState("claude-sonnet-4-6");

  // Concept generation
  const [conceptName, setConceptName] = useState("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<{ short_summary: string; long_summary: string; x: number; y: number; z: number } | null>(null);
  const [saved, setSaved] = useState(false);
  const [userConcepts, setUserConcepts] = useState<Concept[]>([]);
  const [allConceptsList, setAllConceptsList] = useState<Concept[]>([]);
  const [conceptDate, setConceptDate] = useState("");

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastFading, setToastFading] = useState(false);
  const triggerToast = () => {
    setShowToast(true);
    setToastFading(false);
    setTimeout(() => setToastFading(true), 1600);
    setTimeout(() => { setShowToast(false); setToastFading(false); }, 2000);
  };

  useEffect(() => {
    const storedType = localStorage.getItem("auth-type") as "apikey" | "oauth" | "oauth-browser" | null;
    if (storedType) setAuthType(storedType);

    const storedKey = localStorage.getItem("anthropic-api-key");
    const storedToken = localStorage.getItem("anthropic-oauth-token");
    const storedOAuthCreds = localStorage.getItem("anthropic-oauth-credentials");

    if (storedKey) setApiKey(storedKey);
    if (storedToken) setOauthToken(storedToken);
    if (storedOAuthCreds) setOauthConnected(true);

    if (
      (storedType === "oauth" && storedToken) ||
      (storedType === "oauth-browser" && storedOAuthCreds) ||
      (storedType !== "oauth" && storedType !== "oauth-browser" && storedKey)
    ) {
      setCredentialStatus("configured");
    }

    const storedLength = localStorage.getItem("summary-length");
    if (storedLength) setSummaryLength(parseInt(storedLength, 10));

    const storedModel = localStorage.getItem("concept-model");
    if (storedModel) setSelectedModel(storedModel);

    // Load settings from Supabase (overrides localStorage)
    getSettingsAsync().then((s) => {
      if (s) {
        if (s.auth_type) { setAuthType(s.auth_type as "apikey" | "oauth" | "oauth-browser"); localStorage.setItem("auth-type", s.auth_type); }
        if (s.summary_length) { setSummaryLength(s.summary_length); localStorage.setItem("summary-length", s.summary_length.toString()); }
        if (s.selected_model) { setSelectedModel(s.selected_model); localStorage.setItem("concept-model", s.selected_model); }
      }
    });

    getAllConceptsAsync().then(setAllConceptsList);
  }, []);

  const saveCredentials = () => {
    localStorage.setItem("auth-type", authType);
    if (authType === "apikey") {
      localStorage.setItem("anthropic-api-key", apiKey);
      setCredentialStatus(apiKey ? "configured" : "none");
    } else if (authType === "oauth") {
      localStorage.setItem("anthropic-oauth-token", oauthToken);
      setCredentialStatus(oauthToken ? "configured" : "none");
    }
    saveToDb("settings", { id: "main", auth_type: authType }).catch(() => {});
    triggerToast();
  };

  // Start OAuth browser flow
  const startOAuthFlow = async () => {
    setOauthLoading(true);
    setOauthError(null);
    setOauthCode("");
    try {
      const res = await fetch("/api/oauth/anthropic/authorize");
      if (!res.ok) throw new Error("Failed to start OAuth flow");
      const { authUrl, codeVerifier } = await res.json();
      setOauthCodeVerifier(codeVerifier);
      window.open(authUrl, "_blank");
    } catch (err) {
      setOauthError(err instanceof Error ? err.message : "Failed to start login");
    } finally {
      setOauthLoading(false);
    }
  };

  // Complete OAuth flow with pasted code
  const completeOAuthFlow = async () => {
    if (!oauthCode.trim() || !oauthCodeVerifier) return;
    setOauthLoading(true);
    setOauthError(null);
    try {
      const res = await fetch("/api/oauth/anthropic/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: oauthCode.trim(), codeVerifier: oauthCodeVerifier }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Token exchange failed");
      }
      const credentials = await res.json();
      localStorage.setItem("auth-type", "oauth-browser");
      localStorage.setItem("anthropic-oauth-credentials", JSON.stringify(credentials));
      setAuthType("oauth-browser");
      setOauthConnected(true);
      setCredentialStatus("configured");
      setOauthCodeVerifier(null);
      setOauthCode("");
      triggerToast();
    } catch (err) {
      setOauthError(err instanceof Error ? err.message : "Exchange failed");
    } finally {
      setOauthLoading(false);
    }
  };

  // Disconnect OAuth
  const disconnectOAuth = () => {
    localStorage.removeItem("anthropic-oauth-credentials");
    setOauthConnected(false);
    setCredentialStatus("none");
    triggerToast();
  };

  const handleGenerate = async () => {
    if (!conceptName.trim()) { alert("Please enter a concept name."); return; }
    const storedType = localStorage.getItem("auth-type") || "apikey";

    const storedModel = localStorage.getItem("concept-model") || "claude-sonnet-4-6";
    let body: Record<string, unknown> = { name: conceptName, authType: storedType, summaryLength, modelId: storedModel };

    if (storedType === "oauth-browser") {
      const creds = localStorage.getItem("anthropic-oauth-credentials");
      if (!creds) {
        alert("Please sign in with Anthropic first.");
        return;
      }
      body.oauthCredentials = JSON.parse(creds);
      body.authType = "oauth";
    } else if (storedType === "oauth") {
      const token = localStorage.getItem("anthropic-oauth-token");
      if (!token) {
        alert("Please configure your Claude OAuth token first.");
        return;
      }
      body.oauthToken = token;
    } else {
      const key = localStorage.getItem("anthropic-api-key");
      if (!key) {
        alert("Please configure your Anthropic API key first.");
        return;
      }
      body.apiKey = key;
    }

    setLoading(true);
    setGenerated(null);
    setSaved(false);
    try {
      const res = await fetch("/api/concepts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Generation failed");
        return;
      }
      const data = await res.json();

      // Update credentials if they were refreshed
      if (data.refreshedCredentials) {
        localStorage.setItem("anthropic-oauth-credentials", JSON.stringify(data.refreshedCredentials));
      }

      setGenerated(data);
    } catch (e) {
      alert("Failed to generate concept: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!generated) return;
    const concept: Concept = {
      id: Date.now().toString(),
      name: conceptName,
      short_summary: generated.short_summary,
      long_summary: generated.long_summary,
      x: generated.x,
      y: generated.y,
      z: generated.z,
      date_learned: conceptDate || new Date().toISOString().split("T")[0],
    };
    try {
      await saveConceptToDb({ ...concept, is_user_created: true });
    } catch (e) {
      alert("Failed to save concept: " + (e instanceof Error ? e.message : String(e)));
      return;
    }
    setSaved(true);
    setConceptName("");
    setConceptDate("");
    setGenerated(null);
    invalidateConceptsCache();
    getAllConceptsAsync().then(setAllConceptsList);
    triggerToast();
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--accent-mid)" }} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
        <div className="text-center">
          <p className="mb-4" style={{ color: "var(--text-muted)" }}>You must be logged in to access settings.</p>
          <button onClick={() => router.push("/")} className="px-4 py-2 rounded-lg text-sm" style={{ background: "var(--accent)", color: "#fff" }}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-20" style={{ background: "var(--bg)" }}>
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 mb-8 text-sm transition-colors cursor-pointer"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-mid)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <h1 className="text-3xl font-bold mb-6" style={{ color: "var(--text)" }}>Settings</h1>

        {/* Quick link to the content editor — a stacked view of every section
            with its own edit affordances, isolated from the public shadowbox. */}
        <button
          onClick={() => router.push("/settings/edit")}
          className="w-full mb-8 p-5 rounded-xl text-left flex items-center justify-between cursor-pointer transition-colors"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        >
          <span className="flex flex-col gap-1">
            <span className="text-base font-semibold">Edit site content</span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              About, Projects, Papers, Posts, Skills, Resume — all in one stacked editable view.
            </span>
          </span>
          <span style={{ color: "var(--accent-mid)" }}>→</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Auth, Summary Length, Add Concept */}
          <div className="space-y-8">

        {/* API Configuration */}
        <section className="p-6 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text)" }}>
            <Key className="w-5 h-5" /> Authentication
          </h2>

          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs px-2 py-1 rounded-full" style={{
              background: credentialStatus === "configured" ? "rgba(2,132,199,0.15)" : "rgba(255,255,255,0.05)",
              color: credentialStatus === "configured" ? "var(--accent-mid)" : "var(--text-muted)",
            }}>
              {credentialStatus === "configured" ? "✓ Configured" : "Not configured"}
            </span>
          </div>

          {/* Auth type toggle — 3 options */}
          <div className="flex rounded-lg overflow-hidden mb-4" style={{ border: "1px solid var(--border)" }}>
            <button
              onClick={() => setAuthType("apikey")}
              className="flex-1 px-3 py-2 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              style={{
                background: authType === "apikey" ? "var(--accent)" : "var(--bg)",
                color: authType === "apikey" ? "#fff" : "var(--text-muted)",
              }}
            >
              <Key className="w-3 h-3" /> API Key
            </button>
            <button
              onClick={() => setAuthType("oauth-browser")}
              className="flex-1 px-3 py-2 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              style={{
                background: authType === "oauth-browser" ? "var(--accent)" : "var(--bg)",
                color: authType === "oauth-browser" ? "#fff" : "var(--text-muted)",
              }}
            >
              <LogIn className="w-3 h-3" /> Claude Login
            </button>
            <button
              onClick={() => setAuthType("oauth")}
              className="flex-1 px-3 py-2 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              style={{
                background: authType === "oauth" ? "var(--accent)" : "var(--bg)",
                color: authType === "oauth" ? "#fff" : "var(--text-muted)",
              }}
            >
              <Shield className="w-3 h-3" /> Token Paste
            </button>
          </div>

          {authType === "apikey" && (
            <>
              <label className="text-sm block mb-2" style={{ color: "var(--text-muted)" }}>Anthropic API Key</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                />
                <button
                  onClick={saveCredentials}
                  className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  <Save className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {authType === "oauth-browser" && (
            <div className="space-y-3">
              {oauthConnected ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm p-3 rounded-lg" style={{ background: "rgba(2,132,199,0.1)", color: "var(--accent-mid)" }}>
                    <Check className="w-4 h-4" /> Connected to Anthropic (Claude Pro/Max)
                  </div>
                  <button
                    onClick={disconnectOAuth}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors"
                    style={{ background: "rgba(255,100,100,0.1)", color: "#ff6464", border: "1px solid rgba(255,100,100,0.2)" }}
                  >
                    <LogOut className="w-4 h-4" /> Disconnect
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Sign in with your Anthropic account (Claude Pro/Max). No API key needed — uses your subscription directly.
                  </p>

                  {!oauthCodeVerifier ? (
                    <button
                      onClick={startOAuthFlow}
                      disabled={oauthLoading}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-50"
                      style={{ background: "var(--accent)", color: "#fff" }}
                    >
                      {oauthLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                      Sign in with Anthropic
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        A new tab opened for authorization. After authorizing, copy the code and paste it below:
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={oauthCode}
                          onChange={(e) => setOauthCode(e.target.value)}
                          placeholder="Paste authorization code here..."
                          className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none font-mono"
                          style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                        />
                        <button
                          onClick={completeOAuthFlow}
                          disabled={oauthLoading || !oauthCode.trim()}
                          className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-50 flex items-center gap-2"
                          style={{ background: "var(--accent)", color: "#fff" }}
                        >
                          {oauthLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardPaste className="w-4 h-4" />}
                          Submit
                        </button>
                      </div>
                    </div>
                  )}

                  {oauthError && (
                    <p className="text-xs p-2 rounded-lg" style={{ background: "rgba(255,100,100,0.1)", color: "#ff6464" }}>
                      {oauthError}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {authType === "oauth" && (
            <>
              <label className="text-sm block mb-2" style={{ color: "var(--text-muted)" }}>Claude OAuth Token</label>
              <p className="text-xs mb-3" style={{ color: "var(--text-muted)", opacity: 0.7 }}>
                Generate a token by running <code className="px-1 py-0.5 rounded text-xs" style={{ background: "var(--bg)", fontFamily: "var(--font-mono)" }}>npx @mariozechner/pi-ai login anthropic</code> in your terminal.
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={oauthToken}
                  onChange={(e) => setOauthToken(e.target.value)}
                  placeholder="Paste OAuth token..."
                  className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                />
                <button
                  onClick={saveCredentials}
                  className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  <Save className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </section>

        {/* Model Selection */}
        <section className="p-6 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text)" }}>
            <Sparkles className="w-5 h-5" /> Model
          </h2>
          <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
            Select which Claude model to use for concept generation
          </p>
          <select
            value={selectedModel}
            onChange={(e) => {
              setSelectedModel(e.target.value);
              localStorage.setItem("concept-model", e.target.value);
              saveToDb("settings", { id: "main", selected_model: e.target.value }).catch(() => {});
              triggerToast();
            }}
            className="w-full p-2.5 rounded-lg text-sm focus:outline-none"
            style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
          >
            <optgroup label="Latest (Claude 4.6)">
              <option value="claude-opus-4-6">Claude Opus 4.6 — most intelligent</option>
              <option value="claude-sonnet-4-6">Claude Sonnet 4.6 — speed + intelligence</option>
            </optgroup>
            <optgroup label="Claude 4.5">
              <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 — fastest, near-frontier</option>
              <option value="claude-sonnet-4-5-20250929">Claude Sonnet 4.5</option>
              <option value="claude-opus-4-5-20251101">Claude Opus 4.5</option>
            </optgroup>
            <optgroup label="Claude 4">
              <option value="claude-opus-4-1-20250805">Claude Opus 4.1</option>
              <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
              <option value="claude-opus-4-20250514">Claude Opus 4</option>
            </optgroup>
          </select>
          <p className="text-xs mt-2" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
            Opus 4.6 produces the most detailed breakdowns. Haiku 4.5 is fastest but less thorough.
          </p>
        </section>

        {/* Summary Length */}
        <section className="p-6 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text)" }}>
            <Sparkles className="w-5 h-5" /> Summary Length
          </h2>
          <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
            Number of sentences for the detailed summary (default: 4)
          </p>
          <div className="flex items-center gap-4">
            <span className="text-sm font-mono w-6 text-center" style={{ color: "var(--text-muted)" }}>1</span>
            <input
              type="range"
              min={1}
              max={10}
              value={summaryLength}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setSummaryLength(val);
                localStorage.setItem("summary-length", val.toString());
                saveToDb("settings", { id: "main", summary_length: val }).catch(() => {});
                triggerToast();
              }}
              className="flex-1 accent-[#218380]"
              style={{ accentColor: "var(--accent)" }}
            />
            <span className="text-sm font-mono w-6 text-center" style={{ color: "var(--text-muted)" }}>10</span>
          </div>
          <p className="text-center text-sm mt-2 font-semibold" style={{ color: "var(--accent-mid)" }}>
            {summaryLength} sentence{summaryLength === 1 ? "" : "s"}
          </p>
        </section>

        {/* Add Concept */}
        <section className="p-6 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text)" }}>
            <Sparkles className="w-5 h-5" /> Add New Concept
          </h2>

          {credentialStatus === "none" && (
            <p className="text-sm mb-4 p-3 rounded-lg" style={{ background: "rgba(255,200,0,0.1)", color: "var(--text-muted)" }}>
              Please configure your authentication above first.
            </p>
          )}

          <label className="text-sm block mb-2" style={{ color: "var(--text-muted)" }}>Concept Name</label>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={conceptName}
              onChange={(e) => setConceptName(e.target.value)}
              placeholder="e.g., Backpropagation"
              className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !conceptName.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate
            </button>
          </div>

          <label className="text-sm block mb-2" style={{ color: "var(--text-muted)" }}>Date (optional)</label>
          <input
            type="date"
            value={conceptDate}
            onChange={(e) => setConceptDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm mb-4 focus:outline-none"
            style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
          />

          {generated && (
            <div className="p-4 rounded-lg mb-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--accent-mid)" }}>Preview</h3>
              <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}><strong>Short:</strong> {generated.short_summary}</p>
              <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}><strong>Detailed:</strong> {generated.long_summary}</p>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                <Save className="w-4 h-4" /> Save Concept
              </button>
            </div>
          )}

          {saved && (
            <div className="flex items-center gap-2 text-sm p-3 rounded-lg" style={{ background: "rgba(2,132,199,0.1)", color: "var(--accent-mid)" }}>
              <Check className="w-4 h-4" /> Concept saved! It will appear in the visualization.
            </div>
          )}
        </section>

          </div>
          {/* End left column */}

          {/* Right Column: My Concepts */}
          <div>
            <section className="p-6 rounded-xl sticky top-20" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text)" }}>
                <Sparkles className="w-5 h-5" /> My Concepts
              </h2>
              {allConceptsList.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>No concepts yet.</p>
              ) : (
                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                  {allConceptsList.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                      <div className="flex-1 min-w-0 mr-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{c.name}</span>
                        </div>
                        <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{c.short_summary}</p>
                        <p className="text-[10px] mt-1 font-mono" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
                          {parseLocalDate(c.date_learned).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          if (!confirm(`Delete "${c.name}"?`)) return;
                          await hideConceptInDb(c.id).catch(() => {});
                          invalidateConceptsCache();
                          getAllConceptsAsync().then(setAllConceptsList);
                        }}
                        className="p-2 rounded-lg transition-opacity cursor-pointer shrink-0"
                        style={{ color: "#e74c3c", opacity: 0.4 }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.4")}
                        title="Delete concept"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
          {/* End right column */}

        </div>
        {/* End grid */}

      </div>

      {/* Saved toast */}
      {showToast && (
        <div style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          background: "rgba(2,132,199,0.9)",
          color: "#fff",
          padding: "8px 16px",
          borderRadius: 999,
          fontSize: 14,
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          gap: 6,
          zIndex: 9999,
          opacity: toastFading ? 0 : 1,
          transition: "opacity 0.4s ease",
          pointerEvents: "none",
        }}>
          <Check className="w-4 h-4" /> Saved
        </div>
      )}
    </div>
  );
}
