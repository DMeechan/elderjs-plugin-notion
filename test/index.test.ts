import plugin from "../src/index";

describe("plugin", () => {
  it("contains required fields", async () => {
    expect(plugin.name).toBeTruthy();
    expect(plugin.description).toBeTruthy();
    expect(plugin.init).toBeTruthy();
    expect(plugin.hooks.length).toBeGreaterThan(0);
    expect(plugin.config).toBeTruthy();
  });
});
