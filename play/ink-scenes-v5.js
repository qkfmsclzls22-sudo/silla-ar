import {displayRatio} from './mobile-kit-v4.js';
// Original code-drawn scenery for the interactive folk-art playground.
// Shapes are deliberately spare so the visitor's character or wish is the subject.
const ink='#334842',paper='#f3eedb';
function shape(c,d,fill,stroke=ink,w=1.8){const p=new Path2D(d);if(fill){c.fillStyle=fill;c.fill(p);}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke(p);}}
function line(c,d,w=1,color=ink){shape(c,d,null,color,w);}
function oval(c,x,y,rx,ry,color){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();}
function roof(c,x,y,w){c.save();c.translate(x,y);c.scale(w/250,w/250);shape(c,'M-132 12Q-80 7-63-9L-20-57Q0-52 20-57L64-9Q88 8 132 12L119 24Q55 17 0 20Q-58 16-119 25Z','#6e817c');for(let i=-5;i<=5;i++){const xx=i*19;line(c,`M${xx*.36} -47Q${xx*.7} -7 ${xx} 18`,.9,'#d4d7c3');}line(c,'M-130 14Q0 27 130 14',2);c.restore();}
function hall(c,x,y,w=230){c.save();c.translate(x,y);c.scale(w/230,w/230);shape(c,'M-91 6L90 6L91 89L-91 89Z','#d8c3a0');for(let i=-2;i<=2;i++){shape(c,`M${i*37-4} 5h8v84h-8Z`,'#a47160');if(i<2){shape(c,`M${i*37+7} 26h23v51h-23Z`,'#718a7b');for(let k=1;k<3;k++)line(c,`M${i*37+7+k*7} 27v49`,.6,'#c4cdb2');}}shape(c,'M-101 89h203l12 13h-227Z','#bcb8a0');line(c,'M-105 96h213',1);roof(c,0,-5,240);c.restore();}
function pine(c,x,y,s=1){c.save();c.translate(x,y);c.scale(s,s);shape(c,'M-7 0Q-10-49 5-87L10-85Q-1-41 3 0Z','#99876b');line(c,'M0-50L-30-73M5-69L31-94',4,'#806f59');for(const [px,py,rx] of [[-33,-78,38],[22,-100,43],[1,-119,38],[-55,-94,26]]){shape(c,`M${px-rx} ${py}q8-17 18-12q4-21 22-12q19-14 32 3q17-2 21 13q-20 18-48 12q-23 8-45-4Z`,'#a9b69a',ink,1.1);}c.restore();}
function pagoda(c,x,y,s=1,ornate=false){c.save();c.translate(x,y);c.scale(s,s);shape(c,'M-39 0h78l5 9h-88Z','#b4b3a0');for(let i=0;i<3;i++){const yy=-i*27,ww=36-i*6;shape(c,`M-${ww-10} ${yy-20}h${(ww-10)*2}v20h-${(ww-10)*2}Z`,'#c8c7b2');shape(c,`M-${ww} ${yy-20}l10-10h${ww*2-20}l10 10Z`,'#b7bba8');if(ornate)line(c,`M-${ww-12} ${yy-20}v-9M${ww-12} ${yy-20}v-9`,2);}line(c,'M0-93v-18',3);oval(c,0,-100,5,3,'#adac94');c.restore();}
export function inkScene(c,type){
 c.fillStyle=paper;c.fillRect(0,0,600,800);c.lineCap='round';c.lineJoin='round';
 // Quiet paper flecks, never a photographic landscape texture.
 for(let i=0;i<1800;i++){c.fillStyle=i%3?'#6a685a06':'#ffffff45';c.fillRect((i*137.19)%600,(i*83.43)%800,1,1);}
 if(type==='wolseong'){
  shape(c,'M-20 260Q90 189 218 233Q368 175 620 245L620 331Q466 309 331 339Q180 289-20 335Z','#c3cbb0',null);line(c,'M-10 299Q101 265 206 290Q379 254 610 293',1.4,'#899681');hall(c,385,214,167);pine(c,51,326,.68);shape(c,'M398 800Q418 714 491 693Q584 673 604 607L650 806Z','#a8c1b9',null);line(c,'M399 800Q418 715 492 694Q581 675 607 607',1.4,'#7b978d');
  for(let i=0;i<10;i++){const x=40+(i*127)%510,y=381+(i*61)%350;line(c,`M${x-6} ${y}q5-4 11 0m-5-1 1-5`,1,'#9da585');}
 }else if(type==='bulguksa'){
  shape(c,'M0 300Q175 280 300 302Q444 278 600 300L600 800H0Z','#e4dac0',null);hall(c,300,205,280);pagoda(c,103,355,1.1);pagoda(c,494,355,1.1,true);pine(c,-8,306,.9);pine(c,615,305,.95);line(c,'M119 348Q300 360 475 348',1,'#a49f85');
  for(let i=0;i<15;i++){const x=(i*113+27)%600,y=390+(i*53)%355;line(c,`M${x} ${y}q12-4 25-1`,.7,'#c2b89c');}
 }else{
  shape(c,'M-20 242Q92 73 229 184Q285 215 313 269L-20 285Z','#b8c4a2');line(c,'M18 244Q135 106 252 229',1,'#9da98a');pine(c,526,250,.8);shape(c,'M67 292L535 301L561 696L39 705Z','#ceaa7d');shape(c,'M81 310L517 317L539 678L61 688Z','#e2c397');for(let i=0;i<11;i++)line(c,`M${48+i*46} 695l3 12`,1,'#9f7b55');for(const [x,y]of [[67,292],[535,301],[561,696],[39,705]]){shape(c,`M${x-4} ${y-10}h8v30h-8Z`,'#8d7760');}line(c,'M67 292L535 301L561 696L39 705Z',1,'#f8ebc8');
 }
}
export function inkProp(c,id,x,y,s=1){
 c.save();c.translate(x,y);const ratio=displayRatio(c);c.scale(s*Math.min(1,1/ratio),s*Math.min(1,ratio));c.lineCap='round';c.lineJoin='round';
 if(id==='pine')pine(c,0,0,.72);
 if(id==='palace')hall(c,0,-61,137);
 if(id==='pagoda')pagoda(c,0,-6,.93,true);
 if(id==='deer'){
  oval(c,0,1,44,6,'#64735a18');shape(c,'M-32-37L-28-5L-21-5L-19-33L16-33L20-5L27-5L25-48Q44-62 37-81Q23-91 16-72L11-54Q-10-65-33-51Z','#c3a578');shape(c,'M-30-51Q-53-72-43-42Z','#c3a578');shape(c,'M19-76Q2-93 11-96Q25-90 29-79Z','#d3ba8f');shape(c,'M29-80Q35-103 42-94Q42-82 34-75Z','#d3ba8f');line(c,'M24-85L19-109L10-119M20-104L10-106M32-86L37-111L45-121M37-105L46-110',2.2,'#6f765e');oval(c,31,-72,2,2,ink);line(c,'M32-63l8-2',1);for(const [px,py]of [[-23,-48],[-12,-45],[0,-48],[5,-39],[-18,-37]])oval(c,px,py,2.5,2,'#f1e6c6');
 }
 if(id==='lotus'){
  oval(c,0,-5,55,17,'#a9c0b2');line(c,'M-33-4q9-4 17 0m30 0q11-3 18-1',1,'#638d7f');oval(c,-14,-11,24,11,'#9eaf83');line(c,'M-14-11l20-6',1,'#647e59');for(const px of [-20,20,-10,10,0])shape(c,`M0-14Q${px-20}-38 ${px}-54Q${px+20}-37 0-14Z`,'#cc9583',ink,1);oval(c,0,-18,10,4,'#d2b65c');
 }
 if(id==='lantern'){
  line(c,'M0-3V-103',4,'#6f705a');shape(c,'M-17-91L17-91L20-47L-20-47Z','#d8bd7b');line(c,'M-18-91Q0-109 18-91M-20-47L20-47M-12-88V-50M12-88V-50',1.6);shape(c,'M-15-6h30l8 6h-46Z','#a6ad92');
 }
 c.restore();
}
