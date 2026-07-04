"use client";

import { useState } from "react";
import { saveSiteContent } from "@/lib/actions";
import { RichEditor } from "./RichEditor";

type LangVersion = { key: string; label: string; html: string };

/**
 * One visible editor with language switcher pills. Inactive editors stay
 * mounted (hidden) so unsaved changes survive switching languages.
 */
export function RulesEditors({
  versions,
  saveLabel,
}: {
  versions: LangVersion[];
  saveLabel: string;
}) {
  const [active, setActive] = useState(versions[0]?.key);

  return (
    <>
      <div className="lang-pills">
        {versions.map((v) => (
          <button
            key={v.key}
            type="button"
            className={active === v.key ? "active" : ""}
            onClick={() => setActive(v.key)}
          >
            {v.label}
          </button>
        ))}
      </div>
      {versions.map((v) => (
        <form
          key={v.key}
          action={saveSiteContent}
          className="content-edit"
          style={{ display: active === v.key ? "block" : "none" }}
        >
          <input type="hidden" name="key" value={v.key} />
          <RichEditor name="html" initialHtml={v.html} />
          <button type="submit">{saveLabel}</button>
        </form>
      ))}
    </>
  );
}
