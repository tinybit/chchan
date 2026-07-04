import { getT } from "@/lib/i18n";

export async function Hero() {
  const t = await getT();
  return (
    <div className="hero">
      <div className="hero-logo">
        <img src="/bolt.svg" alt="" />
        <span>{t.siteName}</span>
      </div>
      <p className="hero-tagline">{t.tagline}</p>
    </div>
  );
}
