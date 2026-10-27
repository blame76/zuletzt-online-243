// Deliberately limited, HTML-escaped manuscript Markdown renderer.
const escapeHtml=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
const tick=String.fromCharCode(96);
const inline=s=>escapeHtml(s).replace(/\*\*([^*\n]+)\*\*/g,"<strong>$1</strong>").replace(/\*([^*\n]+)\*/g,"<em>$1</em>").replace(new RegExp(tick+"([^"+tick+"\\n]+)"+tick,"g"),"<code>$1</code>");
export function markdownToHtml(markdown){
 const output=[],paragraph=[],quote=[],quoteParagraph=[];
 const flushParagraph=()=>{if(paragraph.length){output.push("<p>"+inline(paragraph.join(" "))+"</p>");paragraph.length=0}};
 const flushQuoteParagraph=()=>{if(quoteParagraph.length){quote.push("<p>"+inline(quoteParagraph.join(" "))+"</p>");quoteParagraph.length=0}};
 const flushQuote=()=>{flushQuoteParagraph();if(quote.length){output.push("<blockquote>"+quote.join("")+"</blockquote>");quote.length=0}};
 for(const raw of markdown.replace(/\r\n/g,"\n").split("\n")){
   const line=raw.trim();
   if(line.startsWith(">")){
     flushParagraph();
     const quoted=line.replace(/^>\s?/,"");
     if(!quoted.trim())flushQuoteParagraph();
     else quoteParagraph.push(quoted.trim());
     continue;
   }
   flushQuote();
   if(!line){flushParagraph();continue}
   if(/^#{1,3}\s/.test(line)){
     flushParagraph();const level=line.match(/^#+/)[0].length;
     const tag=level===1?"h1":"h2";
     output.push("<"+tag+">"+inline(line.replace(/^#+\s*/,""))+"</"+tag+">");
   }else if(/^---+$/.test(line)){flushParagraph();output.push("<hr>")}
   else paragraph.push(line);
 }
 flushParagraph();flushQuote();
 return output.join("\n");
}
