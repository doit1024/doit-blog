import type { APIRoute } from "astro";
import {
  handleReactionsRequest,
  resolvePepper,
  type ReactionsKv,
} from "@/utils/bb-reactions-handler";

export const prerender = false;

type EnvBag = {
  BB_REACTIONS?: unknown;
  BB_RX_PEPPER?: unknown;
};

function readEnv(locals: App.Locals): { kv?: ReactionsKv; pepper?: string } {
  const env = (locals as { runtime?: { env?: EnvBag } }).runtime?.env;
  const kv = env?.BB_REACTIONS;
  const pepper = env?.BB_RX_PEPPER;
  return {
    kv: isKv(kv) ? kv : undefined,
    pepper: typeof pepper === "string" ? pepper : undefined,
  };
}

function isKv(value: unknown): value is ReactionsKv {
  if (!value || typeof value !== "object") return false;
  const candidate = value as ReactionsKv;
  return (
    typeof candidate.get === "function" && typeof candidate.put === "function"
  );
}

const handle: APIRoute = ({ request, locals }) => {
  const env = readEnv(locals);
  return handleReactionsRequest(request, {
    kv: env.kv,
    pepper: resolvePepper(env.pepper),
  });
};

export const GET = handle;
export const POST = handle;
