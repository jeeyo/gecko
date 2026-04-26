import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useNote } from "@/hooks/useNotes";
import { api } from "@/api/client";
import { NoteEditor } from "@/components/NoteEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function NoteEditPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading } = useNote(id);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (data) {
      setTitle(data.title);
      setContent(data.content);
      dirtyRef.current = false;
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () => api.updateNote(id!, { title, content }),
    onSuccess: () => {
      dirtyRef.current = false;
      qc.invalidateQueries({ queryKey: ["notes"] });
      qc.invalidateQueries({ queryKey: ["note", id] });
    },
  });

  const remove = useMutation({
    mutationFn: () => api.deleteNote(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes"] });
      nav("/notes");
    },
  });

  // Debounced auto-save while editing
  useEffect(() => {
    if (!data) return;
    if (title === data.title && content === data.content) return;
    dirtyRef.current = true;
    const t = setTimeout(() => {
      if (dirtyRef.current) save.mutate();
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, data]);

  if (isLoading || !data) {
    return <div className="p-4 text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col p-4 sm:p-6">
      <header className="mb-3 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => nav(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => dirtyRef.current && save.mutate()}
          placeholder="Untitled"
          className="flex-1 border-0 px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
        />
        <span className="text-xs text-muted-foreground">
          {save.isPending ? "Saving…" : dirtyRef.current ? "Unsaved" : "Saved"}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => remove.mutate()}
          aria-label="Delete note"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </header>

      {/* Mobile: tabs */}
      <div className="md:hidden">
        <Tabs defaultValue="edit">
          <TabsList className="w-full">
            <TabsTrigger value="edit" className="flex-1">Edit</TabsTrigger>
            <TabsTrigger value="preview" className="flex-1">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="edit" className="mt-3 h-[calc(100vh-220px)]">
            <NoteEditor value={content} onChange={setContent} />
          </TabsContent>
          <TabsContent value="preview" className="mt-3">
            <article className="prose prose-sm max-w-none rounded-md border p-4 dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || "*(empty)*"}</ReactMarkdown>
            </article>
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop: split */}
      <div className="hidden h-[calc(100vh-180px)] grid-cols-2 gap-4 md:grid">
        <NoteEditor value={content} onChange={setContent} />
        <article className="prose prose-sm h-full max-w-none overflow-auto rounded-md border p-4 dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || "*(empty)*"}</ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
