import type {ReactNode} from "react";
import {FileCheck2,ShieldCheck} from "lucide-react";

type Block=
  |{kind:"heading";level:number;text:string}
  |{kind:"quote";text:string}
  |{kind:"list";ordered:boolean;items:string[]}
  |{kind:"table";headers:string[];rows:string[][]}
  |{kind:"paragraph";text:string};

function cells(line:string){return line.trim().replace(/^\||\|$/g,"").split("|").map((item)=>item.trim());}

export function parseDocumentBlocks(content:string):Block[]{
  const lines=content.replace(/\r/g,"").split("\n"),blocks:Block[]=[];let index=0;
  while(index<lines.length){const line=lines[index].trim();if(!line){index++;continue;}
    const heading=line.match(/^(#{1,3})\s+(.+)$/);if(heading){blocks.push({kind:"heading",level:heading[1].length,text:heading[2]});index++;continue;}
    if(line.startsWith(">")){blocks.push({kind:"quote",text:line.replace(/^>\s?/,"")});index++;continue;}
    if(line.includes("|")&&lines[index+1]?.match(/^\s*\|?\s*:?-{3,}/)){const headers=cells(line);index+=2;const rows:string[][]=[];while(index<lines.length&&lines[index].includes("|")){rows.push(cells(lines[index]));index++;}blocks.push({kind:"table",headers,rows});continue;}
    const list=line.match(/^([-*]|\d+\.)\s+(.+)$/);if(list){const ordered=/\d+\./.test(list[1]),items:string[]=[];while(index<lines.length){const match=lines[index].trim().match(/^([-*]|\d+\.)\s+(.+)$/);if(!match||/\d+\./.test(match[1])!==ordered)break;items.push(match[2]);index++;}blocks.push({kind:"list",ordered,items});continue;}
    const paragraph=[line];index++;while(index<lines.length&&lines[index].trim()&&!lines[index].trim().match(/^(#{1,3})\s+|^>|^[-*]\s+|^\d+\.\s+/)){if(lines[index].includes("|")&&lines[index+1]?.match(/^\s*\|?\s*:?-{3,}/))break;paragraph.push(lines[index].trim());index++;}blocks.push({kind:"paragraph",text:paragraph.join(" ")});
  }
  return blocks;
}

function Inline({text}:{text:string}){
  const parts=text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[TBD[^\]]*\])/g);
  return <>{parts.map((part,index)=>part.startsWith("**")&&part.endsWith("**")?<strong key={index}>{part.slice(2,-2)}</strong>:part.startsWith("`")&&part.endsWith("`")?<code key={index}>{part.slice(1,-1)}</code>:part.startsWith("[TBD")?<mark key={index}>{part}</mark>:<span key={index}>{part}</span>)}</>;
}

function renderBlock(block:Block,index:number):ReactNode{
  if(block.kind==="heading"){if(block.level===1&&index===0)return null;const Tag=(block.level===1?"h2":block.level===2?"h2":"h3") as "h2"|"h3";return <Tag key={index}><Inline text={block.text}/></Tag>;}
  if(block.kind==="quote")return <aside key={index}><ShieldCheck size={17}/><p><Inline text={block.text}/></p></aside>;
  if(block.kind==="list"){const Tag=block.ordered?"ol":"ul";return <Tag key={index}>{block.items.map((item,itemIndex)=><li key={itemIndex}><Inline text={item}/></li>)}</Tag>;}
  if(block.kind==="table")return <div className="quality-preview-table" key={index}><table><thead><tr>{block.headers.map((header,cellIndex)=><th key={cellIndex}><Inline text={header}/></th>)}</tr></thead><tbody>{block.rows.map((row,rowIndex)=><tr key={rowIndex}>{block.headers.map((_,cellIndex)=><td key={cellIndex}><Inline text={row[cellIndex]??""}/></td>)}</tr>)}</tbody></table></div>;
  return <p key={index}><Inline text={block.text}/></p>;
}

export function DocumentPreview({title,content,revision}:{title:string;content:string;revision:number}){
  const blocks=parseDocumentBlocks(content);
  return <article className="quality-paper" aria-label={`Preview of ${title}`}>
    <header><div className="quality-paper-brand"><span><FileCheck2 size={16}/>MicroCD LabOps</span><strong>Controlled working document</strong></div><div className="quality-paper-title"><p>QUALITY SYSTEM RECORD</p><h1>{title}</h1><div><span>Revision {revision}</span><span>Working draft</span><span>Human review required</span></div></div></header>
    <div className="quality-paper-body">{blocks.length?blocks.map(renderBlock):<div className="quality-paper-empty"><FileCheck2 size={30}/><strong>Start writing to build the document preview.</strong><span>Headings, lists, tables, callouts, and TBD fields will be styled automatically.</span></div>}</div>
    <footer><span>Generated and controlled in MicroCD LabOps</span><span>Unapproved working copy</span></footer>
  </article>;
}
