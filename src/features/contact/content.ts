import { formatBreadcrumb } from "../../lib/breadcrumb";
import type { ExternalLinkId } from "../../lib/site";
import type { SiteLocale } from "../../lib/i18n";

const contactPageContentMap = {
  ja: {
    title: "問い合わせ",
    description: "仕事・相談や OSS 関連の問い合わせ窓口と、返信方針をまとめたページです。",
    hero: {
      eyebrow: formatBreadcrumb("Home", "Contact"),
      title: "問い合わせ",
    },
    lead: "ご連絡は、用途に近い窓口からお願いします。",
    channels: [
      {
        heading: "仕事・相談",
        description: "仕事の相談やお問い合わせは、メールで受け付けています。",
        action: {
          type: "email",
          href: "mailto:mackysoft0129@gmail.com",
          label: "メールで問い合わせる",
        },
      },
      {
        heading: "OSS・アセット関連",
        description: "不具合報告や技術的な相談は GitHub から受け付けています。",
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
  "zh-hant": {
    title: "聯絡",
    description: "整理工作洽談、一般諮詢與 OSS 相關聯絡方式，以及目前的回覆方針。",
    hero: {
      eyebrow: formatBreadcrumb("Home", "Contact"),
      title: "聯絡",
    },
    lead: "請依照內容選擇最合適的聯絡管道。",
    channels: [
      {
        heading: "工作與諮詢",
        description: "工作洽談、顧問需求或一般聯絡，請以電子郵件為主。",
        action: {
          type: "email",
          href: "mailto:mackysoft0129@gmail.com",
          label: "寄送電子郵件",
        },
      },
      {
        heading: "OSS 與資產",
        description: "錯誤回報與技術討論較適合透過 GitHub 進行。",
        action: {
          type: "external",
          externalLinkId: "github" as ExternalLinkId,
          label: "開啟 GitHub",
        },
      },
    ],
    replyPolicy: {
      heading: "回覆方針",
      paragraphs: [
        "我不一定能回覆所有訊息。",
        "有些內容可能需要較多時間確認或判斷。",
      ],
    },
  },
} as const;

export function getContactPageContent(locale: SiteLocale) {
  return contactPageContentMap[locale];
}
