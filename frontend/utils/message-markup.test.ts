import assert from "node:assert/strict";
import {
  parseMessageMarkup,
  serializeMessageMarkup,
  stripMessageMarkup,
} from "./message-markup";

assert.deepEqual(parseMessageMarkup("plain text"), [{ type: "text", value: "plain text" }]);

assert.deepEqual(stripMessageMarkup("**bold** and *italic*"), "bold and italic");

const nested = parseMessageMarkup("**bold *and italic* **");
assert.equal(nested[0]?.type, "bold");

assert.equal(stripMessageMarkup("\\*not italic\\*"), "*not italic*");

const roundTrip = serializeMessageMarkup(parseMessageMarkup("hello **world**"));
assert.equal(roundTrip, "hello **world**");

assert.equal(stripMessageMarkup("~~strike~~ `code`"), "strike code");

console.log("message-markup tests passed");
