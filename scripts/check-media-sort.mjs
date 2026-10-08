/**
 * Comparator check for /library. No project test runner; run with:
 *   node --experimental-strip-types --test scripts/check-media-sort.mjs
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { compareMedia } from "../src/utils/media-library/types.ts";

function item(partial) {
  return {
    id: partial.title,
    title: partial.title,
    type: "书",
    year: null,
    date: null,
    status: null,
    cover: null,
    url: null,
    note: null,
    rating: null,
    created: null,
    playHours: null,
    artist: null,
    ...partial,
  };
}

function titles(rows) {
  return [...rows].sort(compareMedia).map(row => row.title);
}

test("same Shanghai day keeps date order, not created-second order", () => {
  const rows = [
    item({
      title: "晚日期",
      created: "2026-09-28T10:00:08.000Z",
      date: "2019-01-01",
    }),
    item({
      title: "早日期",
      created: "2026-09-28T10:00:01.000Z",
      date: "2024-05-01",
    }),
    item({
      title: "无日期",
      created: "2026-09-28T10:00:20.000Z",
      date: null,
    }),
  ];
  assert.deepEqual(titles(rows), ["早日期", "晚日期", "无日期"]);
});

test("a later Shanghai day comes first even when its date is older", () => {
  const rows = [
    item({
      title: "导入日",
      created: "2026-09-28T10:00:00.000Z",
      date: "2024-01-01",
    }),
    item({
      title: "新记",
      created: "2026-10-02T02:00:00.000Z",
      date: "1998-01-01",
    }),
  ];
  assert.deepEqual(titles(rows), ["新记", "导入日"]);
});

test("Shanghai midnight splits the calendar day", () => {
  const rows = [
    item({
      title: "前一天",
      created: "2026-09-28T15:59:59.000Z",
      date: "2025-01-01",
    }),
    item({
      title: "后一天",
      created: "2026-09-28T16:00:01.000Z",
      date: "2010-01-01",
    }),
  ];
  assert.deepEqual(titles(rows), ["后一天", "前一天"]);
});

test("same day and date use exact created_time, then zh title", () => {
  const rows = [
    item({
      title: "波",
      created: "2026-09-27T10:00:01.000Z",
      date: "2018-01-01",
    }),
    item({
      title: "阿",
      created: "2026-09-27T10:00:01.000Z",
      date: "2018-01-01",
    }),
    item({
      title: "较新",
      created: "2026-09-27T10:00:05.000Z",
      date: "2018-01-01",
    }),
  ];
  assert.deepEqual(titles(rows), ["较新", "阿", "波"]);
});

test("missing created sorts after any created day, then by date and title", () => {
  const rows = [
    item({ title: "波", created: null, date: null }),
    item({ title: "阿", created: null, date: null }),
    item({ title: "旧日期", created: null, date: "2010-01-01" }),
    item({ title: "新日期", created: null, date: "2025-01-01" }),
    item({
      title: "有创建",
      created: "2025-01-01T00:00:00.000Z",
      date: "1990-01-01",
    }),
  ];
  assert.deepEqual(titles(rows), ["有创建", "新日期", "旧日期", "阿", "波"]);
});
