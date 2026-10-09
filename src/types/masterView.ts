export interface DocTheme {
  id: string;
  name: string;
  swatch: string;
  sort: number;
  created_at: string;
}

/** One document, flattened from doc_insight + links + tiles + pages for the Master View screen. */
export interface MasterViewDoc {
  linkId: string;
  title: string;
  createdAt: string;
  summary: string;
  hidden: boolean;
  themeId: string | null;
  pageTitle: string;
  pageSwatch: string;
}

export interface AskResultDoc {
  linkId: string;
  reason: string;
}
