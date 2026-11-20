"use client";
import { useState } from "react";
import { RotateCcw, Sparkles, Table2 } from "lucide-react";

type Item = { id: number; kind: "flower" | "table"; x: number; y: number };
const palettes = [{name:"Ivory garden", color:"#e7dfd1"},{name:"Blush bloom",color:"#d6a5a5"},{name:"Berry evening",color:"#7d2d38"},{name:"Sage ceremony",color:"#98a882"}];

export default function EventDesigner() {
  const [palette, setPalette] = useState(0); const [items, setItems] = useState<Item[]>([{id:1,kind:"flower",x:12,y:20},{id:2,kind:"flower",x:78,y:20},{id:3,kind:"table",x:22,y:64},{id:4,kind:"table",x:46,y:64},{id:5,kind:"table",x:70,y:64}]);
  const add = (kind: Item["kind"]) => setItems((current) => [...current, { id: Date.now(), kind, x: 28 + Math.random() * 35, y: 38 + Math.random() * 32 }]);
  return <main className="designer-page"><aside className="designer-panel"><p className="eyebrow">STEP 02 OF 04 — DESIGN DIRECTION</p><h1>Shape the<br/><em>atmosphere.</em></h1><p>This is a visual starting point, not a venue plan or final quotation.</p><label>Occasion</label><div className="choice-set"><button className="selected">Wedding / Nikkah</button><button>Birthday celebration</button><button>Private gathering</button></div><label>Palette</label><div className="palette">{palettes.map((p,index)=><button key={p.name} aria-label={p.name} className={index===palette?"active":""} style={{background:p.color}} onClick={()=>setPalette(index)} />)}</div><p className="palette-name">{palettes[palette].name}</p><div className="designer-actions"><button onClick={()=>add("flower")}><Sparkles size={15}/> Add flowers</button><button onClick={()=>add("table")}><Table2 size={15}/> Add table</button><button onClick={()=>setItems([])}><RotateCcw size={15}/> Reset</button></div></aside><section className="designer-stage"><div className="floorplan" style={{ background: palettes[palette].color }}>{items.map(item=><div className={`design-item ${item.kind}`} key={item.id} style={{left:`${item.x}%`,top:`${item.y}%`}}>{item.kind === "flower" ? "✿" : ""}</div>)}<div className="floor-stage">CELEBRATIONS06<br/><span>CONCEPT BOARD · NOT TO SCALE</span></div></div></section></main>;
}
