import type { SiteLocale } from "../../lib/i18n";

const homePageContentMap = {
  ja: {
    pageTitle: undefined,
    latestArticlesEyebrow: "Latest Articles",
    latestArticlesHeading: "最新の記事",
    latestArticlesCta: "View Articles",
    latestReleasesEyebrow: "Latest Releases",
    latestReleasesHeading: "最新のリリース",
    latestReleasesCta: "View Assets",
    aboutEyebrow: "About",
    aboutHeading: "活動の正本をここに集約する",
    aboutBody: "外部サービスに依存しすぎず、プロフィール、作品、記事、連絡導線を一か所で追える構成に切り替えています。",
    aboutCta: "About",
    contactEyebrow: "Contact",
    contactHeading: "仕事・相談と OSS の窓口",
    contactBody: "仕事・相談はメール、OSS 関連は GitHub と、用途ごとに連絡先を分けて案内しています。",
    contactCta: "Contact",
    homeHeading: "Home",
  },
  en: {
    pageTitle: undefined,
    latestArticlesEyebrow: "Latest Articles",
    latestArticlesHeading: "Latest Articles",
    latestArticlesCta: "View Articles",
    latestReleasesEyebrow: "Latest Releases",
    latestReleasesHeading: "Latest Releases",
    latestReleasesCta: "View Assets",
    aboutEyebrow: "About",
    aboutHeading: "A single source of truth for ongoing work",
    aboutBody: "The site is being rebuilt so profile, projects, writing, and contact paths can be followed in one place without leaning too heavily on external services.",
    aboutCta: "About",
    contactEyebrow: "Contact",
    contactHeading: "Work, consulting, and OSS contact paths",
    contactBody: "Work and consulting go through email, while OSS-related communication goes through GitHub so each kind of message has a clear destination.",
    contactCta: "Contact",
    homeHeading: "Home",
  },
} as const;

export function getHomePageContent(locale: SiteLocale) {
  return homePageContentMap[locale];
}

