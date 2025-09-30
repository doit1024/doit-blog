import { b as createAstro, c as createComponent, m as maybeRenderHead, f as addAttribute, a as renderTemplate } from './astro/server_BhNfQlrz.mjs';
import 'kleur/colors';
import 'clsx';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import { S as SITE } from './config_Bu0bSZwp.mjs';

const $$Astro = createAstro("https://blog.doooit.me/");
const $$Datetime = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Datetime;
  dayjs.extend(utc);
  dayjs.extend(timezone);
  dayjs.locale("zh-cn");
  const {
    pubDatetime,
    modDatetime,
    size = "sm",
    class: className = "",
    timezone: postTimezone
  } = Astro2.props;
  const isModified = modDatetime && modDatetime > pubDatetime;
  const datetime = dayjs(isModified ? modDatetime : pubDatetime).tz(
    postTimezone || SITE.timezone
  );
  const date = datetime.format("YYYY-MM-DD");
  return renderTemplate`${maybeRenderHead()}<div${addAttribute(["flex items-center gap-x-2 opacity-80", className], "class:list")}> <!-- <IconCalendar
    class:list={[
      "inline-block size-6 min-w-[1.375rem]",
      { "scale-90": size === "sm" },
    ]}
  /> --> <!-- {
    isModified && (
      <span class:list={["text-sm", { "sm:text-base": size === "lg" }]}>
        更新时间:
      </span>
    )
  } --> <time${addAttribute(["text-sm", { "sm:text-base": size === "lg" }], "class:list")}${addAttribute(datetime.toISOString(), "datetime")}>${date} </time> </div>`;
}, "/Users/dumengjie/code/astro-paper/src/components/Datetime.astro", void 0);

export { $$Datetime as $ };
