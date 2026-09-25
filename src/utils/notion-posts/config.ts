import { R2_ORIGIN, WEBP_CLOUD_ORIGIN } from "@/utils/assets";

export type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBase: string;
};

export type NotionPostsConfig = {
  token: string | undefined;
  databaseId: string | undefined;
  mediaDatabaseId: string | undefined;
  r2: R2Config | undefined;
  webpOrigin: string;
};

function emptyToUndef(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function readNotionPostsConfig(
  env: NodeJS.ProcessEnv = process.env
): NotionPostsConfig {
  const token = emptyToUndef(env.NOTION_TOKEN);
  const databaseId = emptyToUndef(env.NOTION_DATABASE_ID);
  const mediaDatabaseId = emptyToUndef(env.NOTION_MEDIA_DATABASE_ID);

  const accountId = emptyToUndef(env.R2_ACCOUNT_ID);
  const accessKeyId = emptyToUndef(env.R2_ACCESS_KEY_ID);
  const secretAccessKey = emptyToUndef(env.R2_SECRET_ACCESS_KEY);
  const bucket = emptyToUndef(env.R2_BUCKET_NAME);
  const publicBase = emptyToUndef(env.R2_PUBLIC_BASE) ?? R2_ORIGIN;

  const r2 =
    accountId && accessKeyId && secretAccessKey && bucket
      ? {
          accountId,
          accessKeyId,
          secretAccessKey,
          bucket,
          publicBase: publicBase.replace(/\/$/, ""),
        }
      : undefined;

  return {
    token,
    databaseId,
    mediaDatabaseId,
    r2,
    webpOrigin: WEBP_CLOUD_ORIGIN.replace(/\/$/, ""),
  };
}

export function hasNotionSource(config: NotionPostsConfig): boolean {
  return Boolean(config.token && config.databaseId);
}

/**
 * Preview channel: `NOTION_INCLUDE_PREVIEW=true|false` overrides.
 * Otherwise a set `WORKERS_CI_BRANCH` other than `main` includes Preview.
 * Unset env and `main` stay Published-only.
 */
export function notionPostsIncludePreview(
  env: NodeJS.ProcessEnv = process.env
): boolean {
  const override = env.NOTION_INCLUDE_PREVIEW;
  if (override === "true") return true;
  if (override === "false") return false;
  const branch = env.WORKERS_CI_BRANCH;
  return Boolean(branch) && branch !== "main";
}

export const ENGLISH_KEBAB_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
