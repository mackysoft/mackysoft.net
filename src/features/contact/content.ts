import { formatBreadcrumb } from "../../lib/breadcrumb";
import type { ExternalLinkId } from "../../lib/site";
import type { SiteLocale } from "../../lib/i18n";

const contactPageContentMap = {
  ja: {
    title: "Contact",
    description: "仕事・相談と OSS 関連の連絡窓口、返信方針をまとめたページです。",
    hero: {
      eyebrow: formatBreadcrumb("Home", "Contact"),
      title: "Contact",
    },
    lead: "連絡は以下からどうぞ。用途に近い窓口から送ってください。",
    channels: [
      {
        heading: "仕事・相談",
        description: "相談や問い合わせ、仕事の連絡はメールで受けています。",
        action: {
          type: "email",
          href: "mailto:mackysoft0129@gmail.com",
          label: "メールで連絡する",
        },
      },
      {
        heading: "OSS・アセット関連",
        description: "不具合報告や技術的な話は GitHub から受けています。",
        action: {
          type: "external",
          externalLinkId: "github" as ExternalLinkId,
          label: "GitHub を開く",
        },
      },
    ],
    replyPolicy: {
      heading: "返信について",
      paragraphs: [
        "全ての連絡に返信できるとは限りません。",
        "確認や判断に時間がかかることがあります。",
      ],
    },
  },
  en: {
    title: "Contact",
    description: "Contact paths for work, inquiries, and OSS-related communication, including the current reply policy.",
    hero: {
      eyebrow: formatBreadcrumb("Home", "Contact"),
      title: "Contact",
    },
    lead: "Use the channel that best matches your message.",
    channels: [
      {
        heading: "Work and Consulting",
        description: "For work, consulting, or general inquiries, email is the main contact path.",
        action: {
          type: "email",
          href: "mailto:mackysoft0129@gmail.com",
          label: "Send email",
        },
      },
      {
        heading: "OSS and Assets",
        description: "Bug reports and technical discussion are best handled on GitHub.",
        action: {
          type: "external",
          externalLinkId: "github" as ExternalLinkId,
          label: "Open GitHub",
        },
      },
    ],
    replyPolicy: {
      heading: "Reply Policy",
      paragraphs: [
        "I may not be able to reply to every message.",
        "Some messages take time to review or decide on.",
      ],
    },
  },
} as const;

export function getContactPageContent(locale: SiteLocale) {
  return contactPageContentMap[locale];
}
