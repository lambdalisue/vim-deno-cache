import type { Denops } from "https://deno.land/x/denops_std@v5.0.0/mod.ts";
import * as batch from "https://deno.land/x/denops_std@v5.0.1/batch/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v5.0.1/function/mod.ts";
import * as opts from "https://deno.land/x/denops_std@v5.0.1/option/mod.ts";
import { ensure, is } from "https://deno.land/x/unknownutil@v3.8.0/mod.ts";
import { findLocalCache } from "./deno_info.ts";

export function main(denops: Denops): void {
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
}

function parseDenoBufname(bufname: string): URL {
  return new URL(
    decodeURIComponent(bufname).replace(/^deno:\/(https?)\//, "$1://"),
  );
}
