import { describe, expect, it } from "vitest";
import { formatPluginSourceForTable } from "./source-display.js";

describe("formatPluginSourceForTable", () => {
  it("shortens bundled plugin sources under the stock root", () => {
    const out = formatPluginSourceForTable(
      {
        origin: "bundled",
        source: "/opt/homebrew/lib/node_modules/penguins/extensions/memory-core/index.ts",
      },
      {
        stock: "/opt/homebrew/lib/node_modules/penguins/extensions",
        global: "/Users/x/.penguins/extensions",
        workspace: "/Users/x/ws/.penguins/extensions",
      },
    );
    expect(out.value).toBe("stock:memory-core/index.ts");
    expect(out.rootKey).toBe("stock");
  });

  it("shortens workspace plugin sources under the workspace root", () => {
    const out = formatPluginSourceForTable(
      {
        origin: "workspace",
        source: "/Users/x/ws/.penguins/extensions/open-prose/index.ts",
      },
      {
        stock: "/opt/homebrew/lib/node_modules/penguins/extensions",
        global: "/Users/x/.penguins/extensions",
        workspace: "/Users/x/ws/.penguins/extensions",
      },
    );
    expect(out.value).toBe("workspace:open-prose/index.ts");
    expect(out.rootKey).toBe("workspace");
  });

  it("shortens global plugin sources under the global root", () => {
    const out = formatPluginSourceForTable(
      {
        origin: "global",
        source: "/Users/x/.penguins/extensions/zalo/index.js",
      },
      {
        stock: "/opt/homebrew/lib/node_modules/penguins/extensions",
        global: "/Users/x/.penguins/extensions",
        workspace: "/Users/x/ws/.penguins/extensions",
      },
    );
    expect(out.value).toBe("global:zalo/index.js");
    expect(out.rootKey).toBe("global");
  });
});
