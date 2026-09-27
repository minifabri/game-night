import path from "node:path";
import { pathToFileURL } from "node:url";
import { splitPack, type GamePack } from "../src/lib/game-pack.ts";

/** Loads `games/<id>.ts`, validates it and splits it into public content + admin-only secrets. */
export async function readPack(file: string | undefined) {
  if (!file) {
    console.error("Indica il file del gioco, es. games/palestrati-vs-divanisti.ts");
    process.exit(1);
  }
  const mod = (await import(pathToFileURL(path.resolve(file)).href)) as { default: GamePack };
  try {
    return splitPack(mod.default);
  } catch (err) {
    console.error(`Il file ${file} non è valido:`);
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}
