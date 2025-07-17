export interface ArticleResponse {
  article: {
    slug: string;
    title: string;
    description: string;
    body: string;
    tagList: string[];
    createdAt: Date | null;
    updatedAt: Date | null;
    favoritesCount: number;
    author: {
      username: string | null;
      bio: string | null;
      image: string | null;
      following: boolean;
    };
  };
}
