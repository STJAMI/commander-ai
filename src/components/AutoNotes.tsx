import React, { useState } from "react";
import { Sparkles, FileText, Download, Copy, Printer, Loader2, ArrowRight } from "lucide-react";
import { Subject, Chapter } from "../types";
import Markdown from "react-markdown";

interface AutoNotesProps {
  subjects: Subject[];
  chapters: Chapter[];
}

export default function AutoNotes({ subjects, chapters }: AutoNotesProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || "");
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [notesMarkdown, setNotesMarkdown] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Dynamic lists
  const filteredChapters = chapters.filter(c => c.subjectId === selectedSubjectId);

  const handleSubjectChange = (id: string) => {
    setSelectedSubjectId(id);
    const subChaps = chapters.filter(c => c.subjectId === id);
    setSelectedChapterId(subChaps[0]?.id || "");
    setNotesMarkdown("");
  };

  const handleGenerateNotes = async () => {
    const activeSub = subjects.find(s => s.id === selectedSubjectId);
    const activeChap = chapters.find(c => c.id === selectedChapterId);

    if (!activeSub || !activeChap) return;

    setLoading(true);
    setNotesMarkdown("");

    try {
      const response = await fetch("/api/ai/generate-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: activeSub.name,
          chapter: activeChap.title
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate notes with AI");
      }

      const data = await response.json();
      setNotesMarkdown(data.markdown || "# Note Generation Failed.\nPlease click generate again.");
    } catch (err: any) {
      setNotesMarkdown(`### ⚠️ Notes Generation Failed\n\n**Cause**: ${err.message || "Connection timeout."}\n\nPlease verify your environment variable keys values and retry.`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyNotes = () => {
    if (!notesMarkdown) return;
    navigator.clipboard.writeText(notesMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${chapters.find(c => c.id === selectedChapterId)?.title || "Study Note"}</title>
          <style>
            body { font-family: -apple-system, system-ui, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            h1, h2, h3 { color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
            pre { background: #f1f5f9; padding: 15px; border-radius: 8px; font-family: monospace; overflow-x: auto; }
            blockquote { border-left: 4px solid #6366f1; padding-left: 15px; font-style: italic; color: #475569; }
          </style>
        </head>
        <body>
          <div class="note-container">
            ${document.getElementById("study-notes-render-layer")?.innerHTML || `<pre>${notesMarkdown}</pre>`}
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6" id="notes-generator-workspace">
      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 flex items-center gap-1">
          <FileText className="w-3.5 h-3.5 text-indigo-500" />
          <span>Automated Textual Parsing Engine</span>
        </span>
        <h2 className="text-lg font-black text-slate-800 tracking-tight mt-1">Syllabus Cheatsheet Generator</h2>
        <p className="text-slate-400 text-xs">Transform any syllabus topic into a perfectly formatted revision sheet in a single tap.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Select Subject */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Choose Subject</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => handleSubjectChange(e.target.value)}
            className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-2xl focus:outline-hidden bg-white font-extrabold"
          >
            <option value="" disabled>-- Choose Subject --</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Select Chapter */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Choose Chapter</label>
          <select
            value={selectedChapterId}
            onChange={(e) => setSelectedChapterId(e.target.value)}
            className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-2xl focus:outline-hidden bg-white font-extrabold"
          >
            <option value="" disabled>-- Choose Chapter --</option>
            {filteredChapters.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-1" id="notes-trigger-row">
        <button
          type="button"
          onClick={handleGenerateNotes}
          disabled={loading || !selectedChapterId}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white text-xs font-black px-5 py-3 rounded-2xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing Textbook Concepts...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-indigo-200 animate-pulse" />
              <span>Generate Academic Summary Sheet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {/* Preview Layer */}
      {notesMarkdown && (
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/20" id="cheat-notes-preview-deck">
          {/* Deck Action bar */}
          <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-indigo-650 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500 animate-spin" />
              Compiled Study Cheatsheet PDF Ready
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyNotes}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition cursor-pointer"
                title="Copy Markdown Raw Code"
              >
                {copied ? <span className="text-[9px] font-extrabold px-1 text-indigo-600">Copied!</span> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition cursor-pointer"
                title="Print Notes"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div 
            className="p-6 md:p-8 text-xs text-slate-800 leading-relaxed max-h-96 overflow-y-auto space-y-4 prose prose-indigo bg-white" 
            id="study-notes-render-layer"
          >
            <div className="markdown-body">
              <Markdown>{notesMarkdown}</Markdown>
            </div>
          </div>
        </div>
      )}

      {!notesMarkdown && !loading && (
        <div className="bg-slate-50/60 border border-slate-200 border-dashed rounded-2xl p-8 text-center text-slate-400">
          <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold">Ready to draft your next summary sheet Jami.</p>
          <p className="text-[10px] text-slate-400 mt-1">Select any chapter and click 'Generate' to see the AI compile dense cheat sheets in real-time.</p>
        </div>
      )}
    </div>
  );
}
