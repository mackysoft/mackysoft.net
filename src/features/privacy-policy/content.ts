import { formatPageBreadcrumb } from "../../lib/page-header";
import type { SiteLocale } from "../../lib/i18n";

const privacyPolicyContentMap = {
  ja: {
    title: "Privacy Policy",
    description: "現時点のプライバシーポリシーです。",
    hero: {
      eyebrow: formatPageBreadcrumb("Home", "Privacy Policy"),
      title: "Privacy Policy",
    },
    paragraphs: [
      "現時点のサイトは静的配信を前提にしており、問い合わせフォームは設置していません。アクセス解析などを追加した場合は、このページを更新します。",
    ],
  },
  en: {
    title: "Privacy Policy",
    description: "The current privacy policy for this site.",
    hero: {
      eyebrow: formatPageBreadcrumb("Home", "Privacy Policy"),
      title: "Privacy Policy",
    },
    paragraphs: [
      "The current site is published as a static site and does not include a contact form. If analytics or additional data collection are introduced later, this page will be updated.",
    ],
  },
} as const;

export function getPrivacyPolicyContent(locale: SiteLocale) {
  return privacyPolicyContentMap[locale];
}
