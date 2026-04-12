import { formatBreadcrumb } from "../../lib/breadcrumb";
import type { SiteLocale } from "../../lib/i18n";

type PrivacyPolicyLink = {
  label: string;
  href: string;
};

type PrivacyPolicySection = {
  heading: string;
  paragraphs: string[];
  items?: string[];
  links?: PrivacyPolicyLink[];
};

type PrivacyPolicyContent = {
  title: string;
  description: string;
  hero: {
    eyebrow: string;
    title: string;
  };
  lead: string[];
  sections: PrivacyPolicySection[];
};

const privacyPolicyContentMap: Record<SiteLocale, PrivacyPolicyContent> = {
  ja: {
    title: "Privacy Policy",
    description: "本サイトで実際に利用している情報の取扱いをまとめたプライバシーポリシーです。",
    hero: {
      eyebrow: formatBreadcrumb("Home", "Privacy Policy"),
      title: "Privacy Policy",
    },
    lead: [
      "本サイトは、ゲーム、アセット、技術記事を公開する個人サイトです。このページでは、本サイトで実際に利用している機能に合わせて、情報の取得と利用の考え方を説明します。",
    ],
    sections: [
      {
        heading: "運営者情報と連絡先",
        paragraphs: [
          "本サイトの運営者は Hiroya Aramaki（荒牧裕也）/ Makihiro です。",
          "お問い合わせは Contact ページから案内している方法で受け付けます。GitHub 経由で受けた連絡についても、本ポリシーに沿って取り扱います。",
        ],
        links: [
          {
            label: "Contact",
            href: "/contact/",
          },
        ],
      },
      {
        heading: "取得する情報",
        paragraphs: [
          "本サイトでは、利用状況の把握や提供機能の維持のため、Cookie 等の識別子、IP アドレス、ブラウザ情報、参照元、閲覧した URL、閲覧日時などの技術情報を取得することがあります。",
          "また、テーマ設定と表示言語を保持するため、利用者の端末内の localStorage に `mackysoft-theme` と `mackysoft-locale` を保存します。",
          "メールまたは GitHub を通じてお問い合わせいただいた場合は、氏名、メールアドレス、アカウント名、件名、本文その他利用者が任意に送信した情報を取得します。",
        ],
      },
      {
        heading: "利用目的",
        paragraphs: [
          "取得した情報は、サイトの表示と運営、利用状況の分析、利便性の向上、不正利用や障害への対応、お問い合わせへの対応のために利用します。",
          "取得した情報を、広告目的の拡張機能や会員管理のために利用することはありません。",
        ],
      },
      {
        heading: "アクセス解析",
        paragraphs: [
          "本サイトでは Google Analytics 4 を利用しています。Google Analytics 4 は Cookie 等を用いて利用状況を収集し、Google によりデータが処理されます。",
          "本サイトでは、基本的なアクセス計測とサイト内イベント計測のみを行い、Google signals や広告向けパーソナライズ機能は利用しません。",
        ],
        links: [
          {
            label: "Google Analytics Privacy Disclosures Policy",
            href: "https://support.google.com/analytics/answer/7318509?hl=en",
          },
          {
            label: "Google Privacy Policy",
            href: "https://policies.google.com/privacy",
          },
        ],
      },
      {
        heading: "外部サービス",
        paragraphs: [
          "本サイトでは、Google Fonts を利用してフォントを配信しています。フォント読み込み時には、利用者のブラウザから Google のサーバーへ通信が発生します。",
          "ゲームページの動画埋め込みには `youtube-nocookie.com` を利用しています。埋め込み表示時には YouTube に関連する通信が発生する場合があります。",
          "GitHub、X、Zenn などの外部サイトへ移動した後は、それぞれの事業者が定めるプライバシーポリシー等が適用されます。",
        ],
      },
      {
        heading: "利用者による制御方法",
        paragraphs: [
          "Cookie や localStorage の保存は、利用者のブラウザ設定から削除または無効化できます。ただし、その場合はテーマ設定や表示言語の保持、一部の計測機能が正しく動作しないことがあります。",
          "Google Analytics による情報収集を停止したい場合は、Google が提供するオプトアウト アドオン等をご利用ください。",
        ],
        links: [
          {
            label: "Google Analytics Opt-out Browser Add-on",
            href: "https://tools.google.com/dlpage/gaoptout/intl/en/success.html",
          },
        ],
      },
      {
        heading: "改定日",
        paragraphs: [
          "制定日: 2026年4月12日",
          "最終更新日: 2026年4月12日",
        ],
      },
    ],
  },
  en: {
    title: "Privacy Policy",
    description: "This privacy policy explains how this site handles the information it actually uses.",
    hero: {
      eyebrow: formatBreadcrumb("Home", "Privacy Policy"),
      title: "Privacy Policy",
    },
    lead: [
      "This site is a personal website for publishing games, assets, and technical writing. This page explains how information is collected and used based on the features that are actually active on the site.",
    ],
    sections: [
      {
        heading: "Operator and Contact",
        paragraphs: [
          "This site is operated by Hiroya Aramaki / Makihiro.",
          "You can contact the operator through the methods listed on the Contact page. Messages sent through GitHub are also handled in line with this policy.",
        ],
        links: [
          {
            label: "Contact",
            href: "/contact/",
          },
        ],
      },
      {
        heading: "Information Collected",
        paragraphs: [
          "This site may collect technical information such as cookie-based identifiers, IP addresses, browser information, referrers, visited URLs, and access timestamps in order to understand usage and keep site features working.",
          "To preserve theme and language preferences, this site stores `mackysoft-theme` and `mackysoft-locale` in the visitor's browser localStorage.",
          "If you contact the operator by email or through GitHub, the site may receive your name, email address, account name, subject, message body, and any other information you choose to send.",
        ],
      },
      {
        heading: "Purpose of Use",
        paragraphs: [
          "Collected information is used to provide and operate the site, analyze usage, improve convenience, respond to abuse or technical issues, and handle inquiries.",
          "Collected information is not used for advertising features or account management.",
        ],
      },
      {
        heading: "Analytics",
        paragraphs: [
          "This site uses Google Analytics 4. Google Analytics 4 uses cookies and similar technologies to collect usage information, and Google may process that data.",
          "This site uses only basic access measurement and on-site event measurement. Google signals and advertising personalization features are not used.",
        ],
        links: [
          {
            label: "Google Analytics Privacy Disclosures Policy",
            href: "https://support.google.com/analytics/answer/7318509?hl=en",
          },
          {
            label: "Google Privacy Policy",
            href: "https://policies.google.com/privacy",
          },
        ],
      },
      {
        heading: "External Services",
        paragraphs: [
          "This site uses Google Fonts to deliver fonts. When fonts are loaded, the visitor's browser communicates with Google's servers.",
          "Video embeds on game pages use `youtube-nocookie.com`. Displaying embedded video may still involve communication related to YouTube.",
          "After moving to external sites such as GitHub, X, or Zenn, the policies of those services apply.",
        ],
      },
      {
        heading: "Visitor Controls",
        paragraphs: [
          "Visitors can delete or disable cookies and localStorage through browser settings. Doing so may prevent theme preferences, language preferences, or some measurement features from working as intended.",
          "If you want to stop information collection by Google Analytics, use Google's opt-out browser add-on or similar controls provided by Google.",
        ],
        links: [
          {
            label: "Google Analytics Opt-out Browser Add-on",
            href: "https://tools.google.com/dlpage/gaoptout/intl/en/success.html",
          },
        ],
      },
      {
        heading: "Revision Date",
        paragraphs: [
          "Effective date: April 12, 2026",
          "Last updated: April 12, 2026",
        ],
      },
    ],
  },
};

export function getPrivacyPolicyContent(locale: SiteLocale) {
  return privacyPolicyContentMap[locale];
}
