import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDto = join(frontendRoot, "..", "shared", "dto");
const targetRoot = join(frontendRoot, "shared");
const targetDto = join(targetRoot, "dto");

if (!existsSync(sourceDto)) {
  if (existsSync(targetDto)) {
    console.log("sync-shared: using existing frontend/shared/dto");
    process.exit(0);
  }
  console.error(`sync-shared: source not found at ${sourceDto}`);
  process.exit(1);
}

rmSync(targetRoot, { recursive: true, force: true });
mkdirSync(targetDto, { recursive: true });

let copied = 0;
for (const file of readdirSync(sourceDto)) {
  if (!file.endsWith(".dto.ts")) continue;
  cpSync(join(sourceDto, file), join(targetDto, file));
  copied += 1;
}

if (copied === 0) {
  console.error("sync-shared: no .dto.ts files found to copy");
  process.exit(1);
}

console.log(`sync-shared: copied ${copied} DTO file(s) → frontend/shared/dto/`);
