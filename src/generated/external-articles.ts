export type ExternalArticle = {
  id: string;
  source: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  tags?: string[];
};

const externalArticles: ExternalArticle[] = [];

export default externalArticles;
