#!/usr/bin/env node
/**
 * Insert or refresh this PR's bullets in CHANGELOG.md (未发布).
 *
 * Matches the existing doit-blog style:
 *   - **范围**：说明（[#N](url)）
 *   grouped under ### 变更 / 优化 / 修复 / 新增
 */

import fs from "node:fs";
import path from "node:path";

const SECTION_ORDER = ["变更", "优化", "修复", "新增", "说明"];

const TYPE_TO_SECTION = {
  feat: "新增",
  fix: "修复",
  perf: "优化",
  style: "优化",
  refactor: "变更",
  docs: "变更",
  chore: "变更",
  ci: "变更",
  build: "变更",
  test: "变更",
  revert: "修复",
};

const SCOPE_TO_AREA = {
  bb: "小声哔哔 `/bb`",
  "/bb": "小声哔哔 `/bb`",
  microblog: "小声哔哔 `/bb`",
  home: "首页",
  collage: "首页",
  posts: "长文",
  post: "长文",
  blog: "长文",
  notion: "长文 Notion",
  nav: "页头",
  header: "页头",
  changelog: "更新日志",
  log: "更新日志",
  site: "站点",
  ci: "CI",
  github: "CI",
};

const CONVENTIONAL =
  /^(feat|fix|perf|refactor|docs|style|chore|ci|build|test|revert)(?:\(([^)]+)\))?(!)?:\s*(.+)$/i;

const BOT_AUTHORS = new Set(["github-actions[bot]", "github-actions"]);

const CHECKBOX_SECTION = [
  { pattern: /\[x\]\s*bug fix/i, section: "修复" },
  { pattern: /\[x\]\s*new feature/i, section: "新增" },
  { pattern: /\[x\]\s*documentation update/i, section: "变更" },
];

export function shanghaiDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function parseConventional(title) {
  const trimmed = String(title ?? "").trim();
  const match = trimmed.match(CONVENTIONAL);
  if (!match) {
    return { type: null, scope: null, subject: stripTrailingPrRef(trimmed) };
  }
  return {
    type: match[1].toLowerCase(),
    scope: match[2] ? match[2].trim() : null,
    subject: stripTrailingPrRef(match[4].trim()),
  };
}

function stripTrailingPrRef(text) {
  return text.replace(/\s*\(#\d+\)\s*$/, "").trim();
}

export function areaFromScope(scope, fallback = "站点") {
  if (!scope) return fallback;
  const key = scope.trim();
  if (SCOPE_TO_AREA[key]) return SCOPE_TO_AREA[key];
  const lower = key.toLowerCase();
  if (SCOPE_TO_AREA[lower]) return SCOPE_TO_AREA[lower];
  return key;
}

export function sectionFromPr({ title, body, labels = [] }) {
  const labelNames = labels.map(l => String(l).toLowerCase());
  if (labelNames.includes("bug") || labelNames.includes("fix")) return "修复";
  if (labelNames.includes("enhancement") || labelNames.includes("feature")) {
    return "新增";
  }

  const parsed = parseConventional(title);
  if (parsed.type && TYPE_TO_SECTION[parsed.type]) {
    return TYPE_TO_SECTION[parsed.type];
  }

  const text = String(body ?? "");
  for (const { pattern, section } of CHECKBOX_SECTION) {
    if (pattern.test(text)) return section;
  }
  return "变更";
}

function stripHtmlComments(text) {
  return String(text ?? "").replace(/<!--[\s\S]*?-->/g, "\n");
}

export function extractBodyBullets(body) {
  const withoutComments = stripHtmlComments(body);
  const descMatch = withoutComments.match(
    /##\s*Description\s*\n([\s\S]*?)(?=\n##\s|$)/i
  );
  const text = descMatch ? descMatch[1] : withoutComments;
  const lines = text.split("\n").map(line => line.trimEnd());
  const firstContent = lines.find(line => line.trim());
  if (!firstContent) return [];
  // Prose first → keep a single title-based entry. Only treat a
  // description as "main changes" when it opens with a bullet list.
  if (!/^\s*[-*]\s+(?!\[[ xX]\])/.test(firstContent)) return [];

  const bullets = [];
  for (const line of lines) {
    const match = line.match(/^\s*[-*]\s+(?!\[[ xX]\])(.+)$/);
    if (!match) continue;
    const item = sanitizeInline(match[1]);
    if (item) bullets.push(item);
  }
  return bullets;
}

export function sanitizeInline(text) {
  return String(text ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\s+/g, " ")
    .replace(/^[-*]\s+/, "")
    .replace(/<\/?[^>]+>/g, "")
    .trim()
    .slice(0, 400);
}

function stripExistingPrLink(text) {
  return text
    .replace(/（\[#\d+\]\(https?:\/\/[^)]+\)）/g, "")
    .replace(/\s*\(\[#\d+\]\(https?:\/\/[^)]+\)\)/g, "")
    .trim();
}

export function itemMentionsPr(item, prNumber) {
  const n = String(prNumber);
  return (
    new RegExp(`\\[#${n}\\]`).test(item) ||
    new RegExp(`/pull/${n}(?![0-9])`).test(item) ||
    new RegExp(`/issues/${n}(?![0-9])`).test(item)
  );
}

export function buildBullets({ title, body, prNumber, prUrl }) {
  const parsed = parseConventional(title);
  const area = areaFromScope(parsed.scope);
  const link = `（[#${prNumber}](${prUrl})）`;
  const fromBody = extractBodyBullets(body);
  const texts = fromBody.length
    ? fromBody
    : [parsed.subject || sanitizeInline(title) || "更新站点"];

  return texts.map(text => {
    const cleaned = stripExistingPrLink(sanitizeInline(text));
    if (/^\*\*[^*]+\*\*：/.test(cleaned)) {
      return `${cleaned}${link}`;
    }
    return `**${area}**：${cleaned}${link}`;
  });
}

function parseChangelog(md) {
  const text = String(md ?? "").replace(/\r\n/g, "\n");
  const h2Re = /^## 未发布(?:（([^）]*)）)?\s*$/m;
  const match = text.match(h2Re);

  if (!match) {
    const prelude = text.replace(/\s*$/, "\n\n");
    return {
      prelude,
      date: null,
      sections: [],
      rest: "",
    };
  }

  const start = match.index;
  const afterHeading = start + match[0].length;
  const restFrom = text.slice(afterHeading);
  const nextH2 = restFrom.search(/\n## (?!#)/);
  const unreleasedBody =
    nextH2 >= 0 ? restFrom.slice(0, nextH2) : restFrom;
  const rest = nextH2 >= 0 ? restFrom.slice(nextH2).replace(/^\n/, "") : "";

  return {
      prelude: text.slice(0, start).replace(/\s*$/, "\n\n"),
      date: match[1] || null,
      sections: parseSections(unreleasedBody),
      rest,
    };
}

function parseSections(body) {
  const lines = body.replace(/^\n/, "").split("\n");
  const sections = [];
  let current = { heading: null, items: [] };

  const flush = () => {
    if (current.heading || current.items.length) {
      sections.push(current);
    }
    current = { heading: null, items: [] };
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith("### ")) {
      flush();
      current = { heading: line.slice(4).trim(), items: [] };
      continue;
    }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      current.items.push(line.slice(2).trim());
      continue;
    }
  }
  flush();
  return sections;
}

function ensureSection(sections, name) {
  const found = sections.find(s => s.heading === name);
  if (found) return found;

  const created = { heading: name, items: [] };
  const want = SECTION_ORDER.indexOf(name);
  const shuoming = sections.findIndex(s => s.heading === "说明");

  if (want === -1) {
    if (shuoming >= 0) sections.splice(shuoming, 0, created);
    else sections.push(created);
    return created;
  }

  for (let i = 0; i < sections.length; i += 1) {
    const got = SECTION_ORDER.indexOf(sections[i].heading);
    if (got === -1) continue;
    if (got > want) {
      sections.splice(i, 0, created);
      return created;
    }
  }

  if (shuoming >= 0) {
    const latest = sections.findIndex(s => s.heading === "说明");
    sections.splice(latest, 0, created);
  } else {
    sections.push(created);
  }
  return created;
}

function serializeChangelog({ prelude, date, sections, rest }) {
  const heading = date ? `## 未发布（${date}）` : "## 未发布";
  const chunks = [prelude.replace(/\s*$/, "\n\n") + heading, ""];

  for (const section of sections) {
    if (!section.heading) continue;
    if (!section.items.length && section.heading !== "说明") continue;
    chunks.push(`### ${section.heading}`, "");
    for (const item of section.items) {
      chunks.push(`- ${item}`);
    }
    chunks.push("");
  }

  let out = `${chunks.join("\n").replace(/\n+$/, "\n")}`;
  if (rest && rest.trim()) {
    out += `\n${rest.replace(/^\n+/, "").replace(/\s*$/, "\n")}`;
  }
  if (!out.endsWith("\n")) out += "\n";
  return out;
}

function parseAuthors(raw) {
  return String(raw ?? "")
    .split(/[,|\n]/)
    .map(s => s.trim())
    .filter(Boolean);
}

function shouldSkipForHumanChangelog({
  changelogInDiff,
  changelogAuthors,
  markdown,
  prNumber,
}) {
  if (!changelogInDiff) return false;
  if (itemMentionsPr(markdown, prNumber)) return false;
  const authors = parseAuthors(changelogAuthors);
  if (!authors.length) return false;
  return authors.some(name => !BOT_AUTHORS.has(name));
}

export function applyChangelogUpdate(markdown, input) {
  const labels = Array.isArray(input.labels)
    ? input.labels
    : String(input.labels ?? "")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

  if (
    input.skip === true ||
    labels.some(l => l.toLowerCase() === "skip-changelog")
  ) {
    return { markdown, changed: false, reason: "skipped: skip-changelog" };
  }

  if (
    shouldSkipForHumanChangelog({
      changelogInDiff: input.changelogInDiff === true,
      changelogAuthors: input.changelogAuthors,
      markdown,
      prNumber: input.prNumber,
    })
  ) {
    return {
      markdown,
      changed: false,
      reason: "skipped: human changelog without PR number",
    };
  }

  const parsed = parseChangelog(markdown);
  const sectionName = sectionFromPr({
    title: input.title,
    body: input.body,
    labels,
  });
  const bullets = buildBullets({
    title: input.title,
    body: input.body,
    prNumber: input.prNumber,
    prUrl: input.prUrl,
  });

  for (const section of parsed.sections) {
    section.items = section.items.filter(
      item => !itemMentionsPr(item, input.prNumber)
    );
  }

  const target = ensureSection(parsed.sections, sectionName);
  target.items = [...bullets, ...target.items];

  const today = input.today || shanghaiDate();
  const next = serializeChangelog({
    ...parsed,
    date: today,
  });

  if (next === markdown.replace(/\r\n/g, "\n")) {
    return { markdown: next, changed: false, reason: "unchanged" };
  }

  return { markdown: next, changed: true, reason: "updated" };
}

function envFlag(value) {
  return /^(1|true|yes)$/i.test(String(value ?? "").trim());
}

export function runFromEnv(env = process.env, readFile, writeFile) {
  const prNumber = String(env.PR_NUMBER ?? "").trim();
  const title = env.PR_TITLE ?? "";
  const body = env.PR_BODY ?? "";
  const prUrl =
    env.PR_URL ||
    `https://github.com/doit1024/doit-blog/pull/${prNumber}`;
  const changelogPath = env.CHANGELOG_PATH || "CHANGELOG.md";

  if (!prNumber) {
    throw new Error("PR_NUMBER is required");
  }

  const previous = readFile(changelogPath, "utf8");
  const result = applyChangelogUpdate(previous, {
    prNumber,
    title,
    body,
    prUrl,
    labels: env.PR_LABELS ?? "",
    skip: envFlag(env.SKIP_CHANGELOG),
    changelogInDiff: envFlag(env.CHANGELOG_IN_DIFF),
    changelogAuthors: env.CHANGELOG_AUTHORS ?? "",
  });

  if (result.changed) {
    writeFile(changelogPath, result.markdown, "utf8");
  }

  return { ...result, changelogPath };
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(
      `${label}\n--- actual ---\n${actual}\n--- expected ---\n${expected}`
    );
  }
}

function assert(condition, label) {
  if (!condition) throw new Error(label);
}

export function runSelfTest() {
  const sample = `# 更新日志

记录本站（doit-blog）的产品改动。

## 未发布（2026-09-09）

### 变更

- **小声哔哔 \`/bb\`**：改为构建时静态生成（SSG）

### 优化

- **页面切换**：去掉默认整页淡入淡出

### 修复

- **小声哔哔 \`/bb\`**：Notion 接口返回 403（[#14](https://github.com/doit1024/doit-blog/pull/14)）

### 新增

- **站点**：新增 \`/changelog\` 更新日志页

### 说明

- 上游 AstroPaper 的完整历史仍在 git 中
`;

  const feat = applyChangelogUpdate(sample, {
    prNumber: 99,
    title: "feat(changelog): 合入前自动写入 CHANGELOG",
    body: "## Description\n\n- 打开 PR 时根据标题写入未发布条目\n- 可用 skip-changelog 跳过\n",
    prUrl: "https://github.com/doit1024/doit-blog/pull/99",
    today: "2026-09-17",
  });
  assert(feat.changed, "feat should change changelog");
  assert(
    feat.markdown.includes("## 未发布（2026-09-17）"),
    "date should update"
  );
  assert(
    feat.markdown.includes(
      "- **更新日志**：打开 PR 时根据标题写入未发布条目（[#99](https://github.com/doit1024/doit-blog/pull/99)）"
    ),
    "first body bullet"
  );
  assert(
    feat.markdown.includes("可用 skip-changelog 跳过（[#99]"),
    "second body bullet"
  );
  const addedIdx = feat.markdown.indexOf("### 新增");
  const featIdx = feat.markdown.indexOf("**更新日志**");
  const siteIdx = feat.markdown.indexOf("**站点**");
  assert(addedIdx < featIdx && featIdx < siteIdx, "prepend under 新增");

  const again = applyChangelogUpdate(feat.markdown, {
    prNumber: 99,
    title: "feat(changelog): 合入前自动写入 CHANGELOG",
    body: "## Description\n\n- 打开 PR 时根据标题写入未发布条目\n- 可用 skip-changelog 跳过\n",
    prUrl: "https://github.com/doit1024/doit-blog/pull/99",
    today: "2026-09-17",
  });
  assert(!again.changed, "identical rerun should be unchanged");

  const proseThenList = applyChangelogUpdate(sample, {
    prNumber: 77,
    title: "feat(changelog): 标题才是主改动",
    body: "## Description\n\n一段说明。\n\n- 实现细节不要进 changelog\n",
    prUrl: "https://github.com/doit1024/doit-blog/pull/77",
    today: "2026-09-17",
  });
  assert(
    proseThenList.markdown.includes("**更新日志**：标题才是主改动（[#77]"),
    "prose description uses the title"
  );
  assert(
    !proseThenList.markdown.includes("实现细节不要进 changelog"),
    "trailing implementation list is ignored"
  );

  const upsert = applyChangelogUpdate(feat.markdown, {
    prNumber: 99,
    title: "feat(changelog): 合入前自动写入 CHANGELOG",
    body: "## Description\n\n改成一条说明即可\n",
    prUrl: "https://github.com/doit1024/doit-blog/pull/99",
    today: "2026-09-17",
  });
  assert(upsert.changed, "title/body edit should upsert");
  assert(
    !upsert.markdown.includes("skip-changelog 跳过（[#99]"),
    "old bullets removed"
  );
  assertEqual(
    upsert.markdown.match(/\[#99\]/g)?.length ?? 0,
    1,
    "single PR 99 mention"
  );

  const skip = applyChangelogUpdate(sample, {
    prNumber: 99,
    title: "feat(changelog): x",
    body: "",
    prUrl: "https://github.com/doit1024/doit-blog/pull/99",
    labels: ["skip-changelog"],
  });
  assert(!skip.changed, "skip-changelog should no-op");
  assertEqual(skip.reason, "skipped: skip-changelog", "skip reason");

  const human = applyChangelogUpdate(sample, {
    prNumber: 26,
    title: "feat(posts): Notion 长文",
    body: "",
    prUrl: "https://github.com/doit1024/doit-blog/pull/26",
    changelogInDiff: true,
    changelogAuthors: "Cursor Agent",
  });
  assert(!human.changed, "human changelog without this PR number should skip");

  const pr9 = applyChangelogUpdate(sample, {
    prNumber: 9,
    title: "fix(home): unrelated",
    body: "",
    prUrl: "https://github.com/doit1024/doit-blog/pull/9",
    today: "2026-09-17",
  });
  assert(pr9.markdown.includes("[#9]"), "records #9");
  assert(
    pr9.markdown.includes(
      "（[#14](https://github.com/doit1024/doit-blog/pull/14)）"
    ),
    "does not eat #14 when inserting #9"
  );

  const pr1 = applyChangelogUpdate(sample, {
    prNumber: 1,
    title: "fix(home): prefix id",
    body: "",
    prUrl: "https://github.com/doit1024/doit-blog/pull/1",
    today: "2026-09-17",
  });
  assert(
    pr1.markdown.includes(
      "（[#14](https://github.com/doit1024/doit-blog/pull/14)）"
    ),
    "must keep #14 when writing #1"
  );

  const bot = applyChangelogUpdate(sample, {
    prNumber: 26,
    title: "feat(posts): Notion 长文",
    body: "",
    prUrl: "https://github.com/doit1024/doit-blog/pull/26",
    changelogInDiff: true,
    changelogAuthors: "github-actions[bot]",
    today: "2026-09-17",
  });
  assert(bot.changed, "bot-owned changelog should still insert");

  const fix = applyChangelogUpdate(sample, {
    prNumber: 15,
    title: "fix(/bb): 单条失败不拖垮整页",
    body: "",
    prUrl: "https://github.com/doit1024/doit-blog/pull/15",
    today: "2026-09-17",
  });
  assert(
    fix.markdown.includes("### 修复"),
    "fix stays under 修复"
  );
  assert(
    fix.markdown.includes("**小声哔哔 `/bb`**：单条失败不拖垮整页（[#15]"),
    "scope maps /bb"
  );

  process.stdout.write("update-changelog self-test ok\n");
}

function main() {
  if (process.argv.includes("--self-test")) {
    runSelfTest();
    return;
  }

  const result = runFromEnv(
    process.env,
    (file, enc) => fs.readFileSync(path.resolve(file), enc),
    (file, data, enc) => fs.writeFileSync(path.resolve(file), data, enc)
  );
  process.stdout.write(`${result.reason} (${result.changelogPath})\n`);
}

const invokedDirectly =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("update-changelog.mjs");

if (invokedDirectly) {
  main();
}
