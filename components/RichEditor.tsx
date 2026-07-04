"use client";

import { useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

const EMOJIS = [
  "😀", "😂", "🤣", "😅", "😊", "😍", "🤔", "😎", "🙃", "😭",
  "😡", "🤯", "🥲", "😴", "🤡", "💀", "👻", "🤖", "👍", "👎",
  "👀", "🙏", "💪", "🔥", "✨", "🎉", "❤️", "💯", "🚀", "⚡",
  "💩", "🍿", "☕", "🍺", "🐸", "🐈", "🗿", "❗", "❓", "✅",
];

function ToolButton({
  onClick,
  active,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      className={`tool${active ? " active" : ""}`}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  return (
    <div className="editor-toolbar">
      <ToolButton
        title="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <b>B</b>
      </ToolButton>
      <ToolButton
        title="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <i>I</i>
      </ToolButton>
      <ToolButton
        title="Strikethrough"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <s>S</s>
      </ToolButton>
      <ToolButton
        title="Inline code"
        active={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        {"</>"}
      </ToolButton>
      <span className="tool-sep" />
      {([1, 2, 3] as const).map((level) => (
        <ToolButton
          key={level}
          title={`Heading ${level}`}
          active={editor.isActive("heading", { level })}
          onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
        >
          H{level}
        </ToolButton>
      ))}
      <span className="tool-sep" />
      <ToolButton
        title="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        ••
      </ToolButton>
      <ToolButton
        title="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1.
      </ToolButton>
      <ToolButton
        title="Quote"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        &ldquo;&rdquo;
      </ToolButton>
      <ToolButton
        title="Horizontal rule"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        —
      </ToolButton>
      <span className="tool-sep" />
      <span className="emoji-wrap">
        <ToolButton title="Emoji" active={emojiOpen} onClick={() => setEmojiOpen((v) => !v)}>
          🙂
        </ToolButton>
        {emojiOpen && (
          <span className="emoji-palette">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onMouseDown={(ev) => {
                  ev.preventDefault();
                  editor.chain().focus().insertContent(e).run();
                  setEmojiOpen(false);
                }}
              >
                {e}
              </button>
            ))}
          </span>
        )}
      </span>
      <span className="tool-sep" />
      <ToolButton title="Undo" onClick={() => editor.chain().focus().undo().run()}>
        ↶
      </ToolButton>
      <ToolButton title="Redo" onClick={() => editor.chain().focus().redo().run()}>
        ↷
      </ToolButton>
    </div>
  );
}

/** WYSIWYG editor that mirrors its HTML into a hidden form field. */
export function RichEditor({ name, initialHtml }: { name: string; initialHtml: string }) {
  const [html, setHtml] = useState(initialHtml);
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialHtml,
    immediatelyRender: false,
    onUpdate: ({ editor: e }) => setHtml(e.getHTML()),
  });

  if (!editor) return <div className="rich-editor loading" />;

  return (
    <div className="rich-editor-frame">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} className="rich-editor" />
      <input type="hidden" name={name} value={html} />
    </div>
  );
}
