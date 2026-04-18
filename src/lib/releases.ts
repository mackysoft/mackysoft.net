import activityData from "../generated/activity.json";
import { defaultLocale, type SiteLocale } from "./i18n";

export type ReleaseActivity = {
  groupId: string;
  source: string;
  repo: string;
  description: string;
  license: string;
  stargazerCount: number;
  name: string;
  version: string;
  url: string;
  publishedAt: string;
  coverUrl: string;
  coverAlt: string;
};

type ReleaseActivityData = {
  releases: ReleaseActivity[];
};

const activity = activityData as unknown as ReleaseActivityData;
const releaseStarCountFormatterMap: Record<SiteLocale, Intl.NumberFormat> = {
  ja: new Intl.NumberFormat("ja-JP"),
  en: new Intl.NumberFormat("en-US"),
  "zh-hant": new Intl.NumberFormat("zh-Hant"),
  ko: new Intl.NumberFormat("ko-KR"),
};

export function sortReleaseActivities(releases: ReleaseActivity[]) {
  return releases.sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
}

export function getLatestReleaseActivities(releases: ReleaseActivity[], limit = 3) {
  return sortReleaseActivities([...releases]).slice(0, limit);
}

export function getReleaseActivities() {
  return sortReleaseActivities([...activity.releases]);
}

export function getLatestReleases(limit = 3) {
  return getReleaseActivities().slice(0, limit);
}

export function getReleaseRepoName(repo: string) {
  return repo.split("/").at(-1) ?? repo;
}

export function formatReleaseStargazerCount(stargazerCount: number, locale: SiteLocale = defaultLocale) {
  return releaseStarCountFormatterMap[locale].format(stargazerCount);
}
