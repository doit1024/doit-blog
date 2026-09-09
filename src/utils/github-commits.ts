const REPO = "doit1024/doit-blog";

export type CommitInfo = {
  sha: string;
  shortSha: string;
  message: string;
  title: string;
  body: string;
  date: string;
  url: string;
  author: string;
};

type GithubCommit = {
  sha: string;
  html_url: string;
  author?: { login?: string } | null;
  commit?: {
    message?: string;
    author?: { name?: string; date?: string } | null;
    committer?: { date?: string } | null;
  };
};

export async function fetchRecentCommits(
  limit = 40
): Promise<CommitInfo[]> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/commits?per_page=${limit}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "doit-blog-changelog",
        },
      }
    );

    if (!res.ok) {
      console.error(
        `Failed to fetch commits: ${res.status} ${res.statusText}`
      );
      return [];
    }

    const data = (await res.json()) as GithubCommit[];

    return data.map(c => {
      const message = c.commit?.message ?? "";
      const [titleLine, ...bodyLines] = message.split("\n");
      const body = bodyLines.join("\n").trim();

      return {
        sha: c.sha,
        shortSha: c.sha.slice(0, 7),
        message,
        title: (titleLine ?? "").trim(),
        body,
        date: c.commit?.author?.date ?? c.commit?.committer?.date ?? "",
        url: c.html_url,
        author: c.commit?.author?.name ?? c.author?.login ?? "",
      };
    });
  } catch (err) {
    console.error("Failed to fetch commits:", err);
    return [];
  }
}
