/**
 * Vilken bygge man tittar på.
 *
 * Två personer som kör samma app ska kunna jämföra en sträng och veta om de ser
 * samma kod. Värdena stämplas in vid bygget av `vite.config.ts` — de går inte
 * att råka ändra i efterhand, och de följer med i klientbundlen.
 */

declare const __APP_COMMIT__: string;
declare const __APP_BRANCH__: string;
declare const __APP_BUILT_AT__: string;
declare const __APP_DIRTY__: boolean;

function read(value: string | undefined, fallback: string): string {
  return value && value.length > 0 ? value : fallback;
}

export const BUILD = {
  /** Kort commit-sha, det som identifierar koden. */
  commit: read(typeof __APP_COMMIT__ === "string" ? __APP_COMMIT__ : undefined, "okänd"),
  branch: read(typeof __APP_BRANCH__ === "string" ? __APP_BRANCH__ : undefined, "okänd"),
  builtAt: read(typeof __APP_BUILT_AT__ === "string" ? __APP_BUILT_AT__ : undefined, ""),
  /** Byggd med ocommittade ändringar — då säger sha:t inte hela sanningen. */
  dirty: typeof __APP_DIRTY__ === "boolean" ? __APP_DIRTY__ : false,
};

/** Det som står i gränssnittet: `a1b2c3d` eller `a1b2c3d+` när bygget var smutsigt. */
export function versionLabel(): string {
  return `${BUILD.commit}${BUILD.dirty ? "+" : ""}`;
}

/** Hela sanningen, för den som hovrar. */
export function versionDetail(): string {
  // Fast tidszon, annars renderar servern UTC och webbläsaren lokal tid — samma
  // bygge skulle se ut som två, och hydreringen klagar.
  const when = BUILD.builtAt
    ? new Date(BUILD.builtAt).toLocaleString("sv-SE", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "Europe/Stockholm",
      })
    : "okänd tid";
  return `${BUILD.branch} · ${BUILD.commit}${BUILD.dirty ? " (ocommittat)" : ""} · byggd ${when}`;
}
