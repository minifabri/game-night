import path from "node:path";
import { pathToFileURL } from "node:url";
import { describePackErrors, gamePackSchema, splitPack, type GamePack } from "../src/lib/game-pack.ts";

/** Loads `games/<id>.ts`, validates it and splits it into public content + admin-only secrets. */
export async function readPack(file: string | undefined) {
  if (!file) {
    console.error("Indica il file del gioco, es. games/palestrati-vs-divanisti.ts");
    process.exit(1);
  }
  const mod = (await import(pathToFileURL(path.resolve(file)).href)) as { default: GamePack };
  const parsed = gamePackSchema.safeParse(mod.default);
  if (!parsed.success) {
    console.error(`Il file ${file} non è valido:`);
    for (const line of describePackErrors(parsed.error, mod.default)) console.error(`- ${line}`);
    process.exit(1);
  }
  return splitPack(mod.default);
}
