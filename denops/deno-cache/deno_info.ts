import { ensure, is } from "https://deno.land/x/unknownutil@v3.8.0/mod.ts";

// const isDenoInfoSpan = is.ObjectOf({
//   start: is.ObjectOf({
//     line: is.Number,
//     character: is.Number,
//   }),
//   end: is.ObjectOf({
//     line: is.Number,
//     character: is.Number,
//   }),
// });
//
// const isDenoInfoFile = is.ObjectOf({
//   specifier: is.String,
//   span: isDenoInfoSpan,
// });

const isDenoInfo = is.ObjectOf({
  roots: is.ArrayOf(is.String),
  modules: is.ArrayOf(is.ObjectOf({
    // kind: is.String,
    // dependencies: is.OptionalOf(is.ArrayOf(is.ObjectOf({
    //   specifier: is.String,
    //   code: is.OptionalOf(isDenoInfoFile),
    //   type: is.OptionalOf(isDenoInfoFile),
    // }))),
    local: is.String,
    // emit: is.String,
    // map: is.Null,
    // size: is.Number,
    // mediaType: is.String,
    specifier: is.String,
  })),
  // redirects: is.Record,
  // npmPackages: is.Record,
});

const textDecoder = new TextDecoder();

export async function findLocalCache(url: URL): Promise<string | undefined> {
  const cmd = new Deno.Command(Deno.execPath(), {
    args: ["info", "--json", url.toString()],
    stdout: "piped",
    stderr: "piped",
  });
  const { stdout, stderr, success } = await cmd.output();
  if (!success) {
    const stderrStr = textDecoder.decode(stderr);
    throw new Error(`Failed to execute deno info: ${stderrStr}`);
  }
  const stdoutStr = textDecoder.decode(stdout);
  const denoInfo = ensure(JSON.parse(stdoutStr), isDenoInfo);
  const root = denoInfo.roots[0];
  const module = denoInfo.modules.find((m) => m.specifier === root);
  return module?.local;
}
