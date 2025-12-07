import type { Entrypoint } from "jsr:@denops/std@8.2.0";
import * as batch from "jsr:@denops/std@8.2.0/batch";
import * as fn from "jsr:@denops/std@8.2.0/function";
import * as opts from "jsr:@denops/std@8.2.0/option";
import { ensure, is } from "jsr:@core/unknownutil@4.3.0";
import { findLocalCache } from "./deno_info.ts";

export const main: Entrypoint = (denops) => {
  denops.dispatcher = {
    async restore(path: unknown) {
      const url = parseDenoBufname(ensure(path, is.String));
      const resp = await fetch(url);
      const content = await resp.text();
      await batch.batch(denops, async (denops) => {
        await opts.buftype.set(denops, "acwrite");
        await opts.swapfile.set(denops, false);
        await opts.modifiable.set(denops, true);
        await denops.cmd(`keepjumps lockmarks %delete _`);
        await fn.setline(denops, 1, content.split("\n"));
        await denops.cmd(`keepjumps lockmarks $delete _`);
      });
    },

    async read(path: unknown) {
      const url = parseDenoBufname(ensure(path, is.String));
      const filename = await findLocalCache(url);
      if (!filename) {
        throw new Error(`Failed to find local cache: ${url}`);
      }
      await batch.batch(denops, async (denops) => {
        await opts.buftype.set(denops, "acwrite");
        await opts.swapfile.set(denops, false);
        await opts.modifiable.set(denops, true);
        await denops.cmd(`keepjumps lockmarks %delete _`);
        await denops.cmd(`silent keepjumps lockmarks 0read ${filename}`);
        await denops.cmd(`keepjumps lockmarks $delete _`);
        await opts.modified.set(denops, false);
      });
    },

    async write(path: unknown) {
      const url = parseDenoBufname(ensure(path, is.String));
      const filename = await findLocalCache(url);
      if (!filename) {
        throw new Error(`Failed to find local cache: ${url}`);
      }
      const content = await fn.getline(denops, 1, "$");
      await Deno.writeTextFile(filename, content.join("\n"));
      await opts.modified.set(denops, false);
    },
  };
};

function parseDenoBufname(bufname: string): URL {
  return new URL(
    decodeURIComponent(bufname).replace(/^deno:\/(https?)\//, "$1://"),
  );
}
