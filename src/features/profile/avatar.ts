import avatar from "./assets/avatar.png";

import { getProfileContent } from "./content";
import type { SiteLocale } from "../../lib/i18n";

export function getProfileAvatar(locale: SiteLocale) {
  const profile = getProfileContent(locale);

  return {
    src: avatar,
    alt: profile.avatar.alt,
  } as const;
}
