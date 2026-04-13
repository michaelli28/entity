import { readFileSync } from "fs";
import { resolve } from "path";

const tokensPath = resolve(
  __dirname,
  "../../../../packages/ui/src/styles/tokens.css"
);

describe("tokens.css purity", () => {
  let content: string;

  beforeAll(() => {
    content = readFileSync(tokensPath, "utf-8");
  });

  it("contains zero @keyframes rules", () => {
    expect(content).not.toContain("@keyframes");
  });

  it("contains zero @media rules", () => {
    expect(content).not.toContain("@media");
  });

  it("contains @theme block", () => {
    expect(content).toContain("@theme");
  });
});
