import { ExternalLink, Globe } from "lucide-react";

const LINKS = [
  { key: "website", label: "Website", icon: Globe },
  { key: "linkedin_url", label: "LinkedIn", icon: ExternalLink },
  { key: "x_url", label: "X", icon: ExternalLink },
  { key: "youtube_url", label: "YouTube", icon: ExternalLink },
];

// Outbound links the instructor chose to share. Only http(s) links are
// rendered (the API validates them, this is a second guard) and they open in
// a new tab without leaking the referrer.
export default function InstructorSocialLinks({ instructor, tone = "light" }) {
  const links = LINKS.filter(
    ({ key }) => typeof instructor[key] === "string" && /^https?:\/\//i.test(instructor[key]),
  );
  if (links.length === 0) return null;

  const toneClass =
    tone === "light"
      ? "border-paper/30 text-paper hover:bg-paper/10"
      : "border-line text-ink hover:bg-porcelain";

  return (
    <ul className="flex flex-wrap gap-2.5" aria-label="Links">
      {links.map(({ key, label, icon: Icon }) => (
        <li key={key}>
          <a
            href={instructor[key]}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-sans font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gold ${toneClass}`}
          >
            <Icon className="w-3.5 h-3.5" aria-hidden="true" />
            {label}
          </a>
        </li>
      ))}
    </ul>
  );
}
