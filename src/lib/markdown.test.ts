import { describe, expect, it } from "vitest";
import { tidyStreaming } from "./markdown";

describe("tidyStreaming", () => {
  it("closes open bold and hides partial citations", () => {
    expect(tidyStreaming("**LIQ-15: Create")).toBe("**LIQ-15: Create**");
    expect(tidyStreaming("Done. **")).toBe("Done. ");
    expect(tidyStreaming("**Done.** [linear:LI")).toBe("**Done.** ");
    expect(tidyStreaming("**Done.** [linear:LIQ-1]")).toBe("**Done.** [linear:LIQ-1]");
  });
});
