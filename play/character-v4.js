import {tones,ellipse,round,contain,displayRatio} from './mobile-kit-v4.js';
export const defaults={face:0,hair:0,outfit:0,pose:0,tone:0,skin:0};
export const characterOptions={face:['방긋','호탕하게','어리둥절','느긋하게','능청 윙크','시무룩','으쓱으쓱','두근두근'],hair:['올림머리','긴 머리','화랑 머리띠','양갈래 쪽'],outfit:['가벼운 나들이','꽃무늬 치마','금빛 왕실','씩씩한 화랑'],pose:['반가워요','볼 하트','부채 살랑','소원을 빌어']};
export function cleanCharacter(v){const a={...defaults};if(v&&typeof v==='object')for(const k of Object.keys(a)){if(Number.isInteger(v[k])&&v[k]>=0&&v[k]<(k==='tone'?6:k==='skin'?5:k==='face'?8:4))a[k]=v[k];}return a;}
const skinTones=['#f5d7b5','#eac59d','#d7a775','#b98258','#8e6045'];
function path(c,d,fill,stroke='#5b4a39',width=1.7){const p=new Path2D(d);c.fillStyle=fill;c.fill(p);if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke(p);}}
function line(c,d,width=2,color='#594435'){c.strokeStyle=color;c.lineWidth=width;c.stroke(new Path2D(d));}
export function drawCharacter(c,a,x,y,scale=1,ornaments={}){
 c.save();c.translate(x,y);const ratio=displayRatio(c);c.scale(scale*Math.min(1,1/ratio),scale*Math.min(1,ratio));c.lineCap='round';c.lineJoin='round';
 const skin=skinTones[a.skin],robe=tones[a.tone],hair='#3e3c37',dark='#5e4736';
 ellipse(c,0,4,64,8,'#39433120');
 // Hair behind the face, curved brush-like outlines and a small off-centre knot.
 if(a.hair===1)path(c,'M-40-192Q-58-127-45-83L-27-101L-13-86L7-103L35-81Q58-120 40-194Z',hair);
 if(a.hair===0){ellipse(c,0,-226,21,17,hair);line(c,'M-17-230Q0-241 17-229',1,'#716958');}
 if(a.hair===3){ellipse(c,-38,-213,17,19,hair);ellipse(c,38,-213,17,19,hair);line(c,'M-50-213Q-36-224-27-212M27-212Q39-225 50-213',1,'#7f7868');}
 // Separate shoes and trousers give the figure a grounded, handmade silhouette.
 path(c,'M-33-44L-32-6Q-38 2-49 0Q-55-3-47-10L-45-43Z','#d7c8a7');
 path(c,'M10-43L18-5Q34 2 43-3Q47-9 36-12L33-43Z','#d7c8a7');
 path(c,'M-49-10Q-36-8-31-3Q-34 6-53 3Q-62-1-49-10Z','#514e42');
 path(c,'M18-8Q29-12 40-6Q53 1 42 4L20 2Z','#514e42');
 const hem=a.outfit===1||a.outfit===2?75:57;
 const grad=robe;
 if(a.outfit===0){path(c,'M-35-84Q-53-55-43-20Q-31-9-18-20L0-49Q9-31 20-13Q33-8 44-24L28-80Z','#f6efdc');line(c,'M-21-70Q-33-42-30-23M6-72Q16-49 28-28',1.3,'#8a8b76');path(c,'M-28-140Q-46-132-48-108L-42-73Q-8-64 37-77L43-111Q39-134 27-140Z',grad);}
 else path(c,`M-28-140Q-46-132-49-109L-${hem}-18Q-23-2 8-13Q43-2 ${hem}-21L45-111Q39-134 27-140Z`,grad);
 if(a.outfit===3)path(c,'M-27-139L-48-118L-52-24L-13-13L-2-110L20-139Z','#536d79');
 if(a.outfit===2){path(c,'M-36-136L-21-133L-24-24L-66-22L-58-37L-39-38Z','#a68145');path(c,'M25-136L37-136L61-33L72-22L25-20Z','#a68145');}
 if(a.outfit!==0)line(c,`M-33-92Q-32-47-${hem-7}-24M-15-96L-23-25M4-95L3-21M23-92L36-23M35-91Q42-42 ${hem-7}-29`,1,'#705b3955');
 // Wrap collar, narrow sash, embroidered hems.
 path(c,'M-24-140L-5-119L27-140L35-132L-4-104L-32-132Z','#f9eed4');
 path(c,'M-43-102Q0-96 42-103L45-91Q0-84-45-91Z',a.outfit===2?'#af853d':a.outfit===3?'#68506c':'#8f634b');
 path(c,'M7-95Q14-86 14-57L25-62L22-96Z',a.outfit===2?'#c8aa58':'#88644c');
 if(a.outfit!==0)for(let i=-2;i<=2;i++){const sx=i*21,sy=a.outfit===1?-51:-35;line(c,`M${sx-3} ${sy}q3-8 6 0q-3 7-6 0`,1,a.outfit===2?'#e7ca72':'#f5dfb2b0');}
 if(a.outfit===1){for(let i=0;i<7;i++){const xx=-43+(i*23)%87,yy=-82+(i*17)%55;for(let j=0;j<5;j++)ellipse(c,xx+Math.cos(j*1.256)*3,yy+Math.sin(j*1.256)*3,2.3,2.3,'#f3d8ba');ellipse(c,xx,yy,1.5,1.5,'#a96957');}}
 // Sleeves vary with the chosen gesture.
 if(a.pose===0){path(c,'M-35-131Q-55-134-66-151L-75-139Q-67-110-43-105Z',robe);path(c,'M-66-149Q-79-160-75-168Q-73-172-69-163L-68-179Q-64-185-62-176L-61-165Q-52-173-53-162L-57-148Z',skin);path(c,'M34-132Q51-119 61-68L43-63L24-114Z',robe);ellipse(c,53,-64,9,11,skin);}
 if(a.pose===1){path(c,'M-31-132L-62-127Q-66-158-46-167L-36-156L-43-145Z',robe);path(c,'M31-132L62-127Q66-158 46-167L36-156L43-145Z',robe);ellipse(c,-42,-163,9,11,skin);ellipse(c,42,-163,9,11,skin);line(c,'M-45-169l6 6M45-169l-6 6',1.4);}
 if(a.pose===2){path(c,'M-33-132Q-48-106-50-65L-31-61L-15-112Z',robe);ellipse(c,-41,-61,9,10,skin);path(c,'M32-133L64-118L55-104L22-111Z',robe);ellipse(c,60,-111,8,9,skin);path(c,'M59-111L40-160Q68-185 97-157Z','#eadbb3');for(let i=0;i<6;i++)line(c,`M59-111L${43+i*10} ${-161-Math.sin(i/5*Math.PI)*12}`,1,'#9b845b');}
 if(a.pose===3){path(c,'M-34-133L-59-105Q-42-88-6-116L-10-132L-33-120Z',robe);path(c,'M34-133L59-105Q42-88 6-116L10-132L33-120Z',robe);path(c,'M-9-116L-9-142Q-5-150-1-140L0-121Z',skin);path(c,'M9-116L9-142Q5-150 1-140L0-121Z',skin);}
 // A small neck and an oversized expressive face.
 path(c,'M-12-150L-11-136L0-125L12-137L12-152Z',skin);ellipse(c,-43,-179,7,11,skin);ellipse(c,43,-179,7,11,skin);
 path(c,'M-43-185Q-47-214-20-225Q12-235 36-215Q48-195 41-174Q36-144 1-144Q-32-144-43-185Z',skin);
 path(c,'M-43-180Q-54-207-34-221Q-5-242 26-224Q51-218 45-183L35-199Q16-196 7-215Q-9-198-35-200Z',hair);
 line(c,'M-34-215Q-12-231 9-221M13-224Q34-219 39-205',1.3,'#8a806755');
 if(a.hair===2){path(c,'M-41-204Q0-214 43-203L44-196Q0-205-42-197Z','#8d6b87');path(c,'M39-201L60-179L47-181L39-194Z','#8d6b87');}
 ellipse(c,-26,-169,9,4,'#d77f714a');ellipse(c,26,-169,9,4,'#d77f714a');
 if(a.face===0){ellipse(c,-17,-182,2.5,3.5,dark);ellipse(c,17,-182,2.5,3.5,dark);line(c,'M-8-167Q0-158 9-167',1.8);}
 if(a.face===1){line(c,'M-24-181Q-17-190-10-181M10-181Q17-190 24-181',2.1);path(c,'M-11-166Q0-161 11-166Q7-151 0-153Q-7-152-11-166Z','#ae6358');}
 if(a.face===2){ellipse(c,-17,-183,4,5,dark);ellipse(c,17,-183,4,5,dark);ellipse(c,0,-162,5,6,'#ad685b');line(c,'M-24-195l11-2M13-197l11 2',1.5);}
 if(a.face===3){line(c,'M-24-182Q-17-177-10-182M10-182Q17-177 24-182',2);line(c,'M-6-163Q0-161 6-163',1.5);}
 if(a.face===4){ellipse(c,-17,-182,2.7,4,dark);line(c,'M11-182l10 3-11 3M-10-166Q1-153 16-168',2);line(c,'M-24-195l12-2',1.7);}
 if(a.face===5){line(c,'M-24-194l12 5M13-190l12-5M-23-181l11 1M13-180l10-1M-9-159q9-9 18 0',2);}
 if(a.face===6){line(c,'M-25-184l14-3M13-186l13 2M-8-164q11 6 22-3',2);line(c,'M-24-195l12-2M14-199l10 3',1.8);}
 if(a.face===7){path(c,'M-18-177Q-30-186-23-190Q-18-194-16-188Q-11-195-7-189Q-4-183-18-177Z','#ac665c',null);path(c,'M18-177Q6-186 13-190Q18-194 20-188Q25-195 29-189Q32-183 18-177Z','#ac665c',null);line(c,'M-9-164Q0-156 10-165',2);}
 line(c,'M0-180l-2 8 4 1',1,'#aa7a565c');
 if(a.outfit===2){if(ornaments.wing)contain(c,ornaments.wing,-58,-260,116,55,1);else path(c,'M-33-224L-37-246L-20-235L-9-253L0-235L13-251L24-234L40-244L33-222Z','#c4a052');if(ornaments.earrings){contain(c,ornaments.earrings,-52,-177,10,30,1);contain(c,ornaments.earrings,42,-177,10,30,1);}}
 if(a.outfit===1||a.hair===3){for(let j=0;j<5;j++)ellipse(c,-35+Math.cos(j*1.256)*6,-215+Math.sin(j*1.256)*6,4.8,4.8,'#d48c7f');ellipse(c,-35,-215,3,3,'#e3c173');}
 c.restore();
}
export function miniFace(i){const mouths=['M13 20q4 5 8 0','M12 19q5 9 10 0Z','M17 19a3 4 0 1 0 .1 0','M14 21h6','M13 21q6 2 9-2','M13 23q5-6 9 0','M13 21l8-1','M13 21q5 3 9-1'][i];const eyes=['M11 14h2m8 0h2','M10 15q2-4 4 0m6 0q2-4 4 0','M11 14h2m8 0h2','M10 15l4 1m6 0 4-1','M11 14h2m8 0 3 2-3 1','M10 13l4 2m6 0 4-2','M10 15l4-1m6-1 4 1','M10 14l2 3 3-3m5 0 2 3 3-3'][i];return `<svg viewBox="0 0 34 28" aria-hidden="true"><path d="M5 12Q5 2 17 2Q29 2 29 14Q28 26 17 26Q5 26 5 12Z" fill="#d6b58c" stroke="#5e604f"/><path d="${eyes}${mouths}" fill="none" stroke="#5a5041" stroke-width="1.4" stroke-linecap="round"/></svg>`;}
