"use client";

export function ReplyLink({ postId, label }: { postId: string; label: string }) {
  return (
    <button
      className="linkish"
      type="button"
      onClick={() => {
        const ta = document.getElementById("body") as HTMLTextAreaElement | null;
        if (!ta) return;
        const quote = `>>${postId}\n`;
        ta.value = ta.value === "" || ta.value.endsWith("\n") ? ta.value + quote : `${ta.value}\n${quote}`;
        ta.focus();
        // put the caret at the end so typing continues after the quote
        ta.setSelectionRange(ta.value.length, ta.value.length);
        ta.scrollIntoView({ behavior: "smooth", block: "center" });
      }}
    >
      {label}
    </button>
  );
}
