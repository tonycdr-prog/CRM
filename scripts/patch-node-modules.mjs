import fs from "node:fs";
import path from "node:path";

const patches = [
  {
    filePath: "node_modules/get-tsconfig/dist/index.mjs",
    contents: [
      'import * as cjs from "./index.cjs";',
      "export const createFilesMatcher = cjs.createFilesMatcher;",
      "export const createPathsMatcher = cjs.createPathsMatcher;",
      "export const getTsconfig = cjs.getTsconfig;",
      "export const parseTsconfig = cjs.parseTsconfig;",
      "export default cjs;",
      "",
    ].join("\n"),
  },
  {
    filePath: "node_modules/helmet/index.mjs",
    contents: ['import helmet from "./index.cjs";', "export default helmet;", ""].join(
      "\n",
    ),
  },
  {
    filePath: "node_modules/express-rate-limit/dist/index.mjs",
    contents: [
      'import rateLimit from "./index.cjs";',
      "export default rateLimit;",
      "",
    ].join("\n"),
  },
];

for (const patch of patches) {
  const absolutePath = path.resolve(patch.filePath);
  if (fs.existsSync(absolutePath)) {
    continue;
  }

  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, patch.contents, "utf8");
}
