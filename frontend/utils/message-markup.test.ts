import {
  parseMessageMarkup,
  serializeMessageMarkup,
  stripMessageMarkup,
} from "./message-markup";

describe("message-markup", () => {
  it("parses plain text", () => {
    expect(parseMessageMarkup("plain text")).toEqual([{ type: "text", value: "plain text" }]);
  });

  it("strips bold and italic markup", () => {
    expect(stripMessageMarkup("**bold** and *italic*")).toBe("bold and italic");
  });

  it("parses nested bold markup", () => {
    const nested = parseMessageMarkup("**bold *and italic* **");
    expect(nested[0]?.type).toBe("bold");
  });

  it("preserves escaped asterisks", () => {
    expect(stripMessageMarkup("\\*not italic\\*")).toBe("*not italic*");
  });

  it("round-trips markup", () => {
    const roundTrip = serializeMessageMarkup(parseMessageMarkup("hello **world**"));
    expect(roundTrip).toBe("hello **world**");
  });

  it("strips strike and code markup", () => {
    expect(stripMessageMarkup("~~strike~~ `code`")).toBe("strike code");
  });
});
