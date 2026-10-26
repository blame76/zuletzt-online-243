import test from "node:test";
import assert from "node:assert/strict";
import {markdownToHtml} from "../web/markdown.mjs";
test("blockquote blank markers preserve separate quoted paragraphs",()=>{
 const result=markdownToHtml("> Absatz eins\n>\n> Absatz zwei\n>\n> Absatz drei\n\nDanach.");
 assert.equal((result.match(/<blockquote>/g)||[]).length,1);
 assert.equal((result.match(/<blockquote>[\s\S]*?<\/blockquote>/)||[""])[0].match(/<p>/g).length,3);
 assert.ok(result.includes("<p>Danach.</p>"));
});
test("untrusted markdown cannot inject HTML",()=>{
 const result=markdownToHtml("<script>alert('x')</script>\n\n> <img src=x onerror=alert(1)>");
 assert.ok(!result.includes("<script>"));assert.ok(!result.includes("<img"));assert.ok(result.includes("&lt;script&gt;"));
});
