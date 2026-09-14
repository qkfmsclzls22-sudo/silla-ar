const http=require("http");
const assert=require("assert");
const {chromium}=require(process.env.SILLA_PLAYWRIGHT_PATH || "playwright");
(async()=>{
 const base="https://raw.githubusercontent.com/qkfmsclzls22-sudo/silla-ar/"+(process.env.SILLA_TEST_REF || "main")+"/";
 const cache=new Map();
 async function get(path){if(!cache.has(path))cache.set(path,fetch(base+path,{signal:AbortSignal.timeout(18000)}).then(async r=>({status:r.status,body:Buffer.from(await r.arrayBuffer())})));return cache.get(path)}
 const server=http.createServer(async(req,res)=>{try{let path=new URL(req.url,"http://localhost").pathname.slice(1);if(path.endsWith("/")||!path)path+="index.html";const d=await get(path);const ext=path.split(".").pop();res.writeHead(d.status,{"Content-Type":({html:"text/html; charset=utf-8",js:"text/javascript; charset=utf-8",css:"text/css",jpg:"image/jpeg",glb:"model/gltf-binary"})[ext]||"application/octet-stream"});res.end(d.body)}catch(e){res.writeHead(500);res.end(String(e))}});
 await new Promise(resolve=>server.listen(4173,"127.0.0.1",resolve));
 const browser=await chromium.launch({headless:true,args:["--no-sandbox","--use-fake-ui-for-media-stream","--use-fake-device-for-media-stream","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
 const context=await browser.newContext({viewport:{width:390,height:844},permissions:["camera"],isMobile:true,hasTouch:true});
 const page=await context.newPage();
 const errors=[],logs=[],failed=[];
 page.on("pageerror",e=>errors.push(String(e)));
 page.on("console",m=>{if(m.text().includes("preview:model-ready")||["error","warning","warn"].includes(m.type()))logs.push(m.text().slice(0,350))});
 page.on("requestfailed",r=>failed.push({url:r.url(),error:r.failure()?.errorText}));

 const report={};
 try{
 const portraitResponse=await fetch("https://storage.googleapis.com/mediapipe-assets/portrait.jpg",{signal:AbortSignal.timeout(10000)});
 if(!portraitResponse.ok) throw Error("Fixture "+portraitResponse.status);
 const portrait=Buffer.from(await portraitResponse.arrayBuffer()).toString("base64");
 await context.addInitScript(({portrait})=>{
  window.__testBlank=false;window.__testX=0;window.__testCameraCalls=[];
  navigator.mediaDevices.getUserMedia=async constraints=>{
   window.__testCameraCalls.push(constraints);
   const image=new Image();image.src="data:image/jpeg;base64,"+portrait;
   await image.decode();
   const canvas=document.createElement("canvas");canvas.width=720;canvas.height=960;
   const ctx=canvas.getContext("2d");
   const draw=()=>{ctx.fillStyle="#999";ctx.fillRect(0,0,720,960);if(!window.__testBlank)ctx.drawImage(image,window.__testX,0,720,960)};
   draw();const timer=setInterval(draw,75);const stream=canvas.captureStream(15);
   const track=stream.getVideoTracks()[0],stop=track.stop.bind(track);
   track.stop=()=>{clearInterval(timer);stop()};
   return stream;
  };
 },{portrait});
 await page.goto("http://127.0.0.1:4173/tryon-preview/",{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>document.querySelector("#status").textContent.includes("유물은"),null,{timeout:16000});
 await page.click("#start");
 await page.waitForFunction(()=>document.querySelector("#tracking-label").textContent.includes("얼굴 확인") || document.querySelector("#mode-manual").getAttribute("aria-pressed")==="true",null,null,{timeout:30000}); if(await page.locator("#mode-manual").getAttribute("aria-pressed")==="true")throw Error("Tracker fell back to manual");
 report.realDetectorReady=true;
 await page.waitForFunction(()=>!document.querySelector("#show").disabled,null,{timeout:12000});
 await page.click("#show");
 await page.waitForFunction(()=>document.querySelector("#tracking-label").textContent.includes("따라가는 중"),null,{timeout:6000});
 await page.click("#capture");
 await page.waitForFunction(()=>document.querySelector("#photo").naturalWidth>0,null,{timeout:5000});
 const photoData=await page.locator("#photo").evaluate(async img=>Array.from(new Uint8Array(await (await fetch(img.src)).arrayBuffer())));
 const sharp=require(process.env.SILLA_SHARP_PATH || "sharp");
 report.stageScreenshot=(await sharp(Buffer.from(photoData)).resize({width:240}).jpeg({quality:50}).toBuffer()).toString("base64");
 report.captureWithRealDetection=true;
 await page.click("#retake");
 await page.evaluate(()=>{window.__testBlank=true});
 await page.waitForFunction(()=>document.querySelector("#tracking-label").textContent.includes("얼굴을 정면"),null,{timeout:6000});
 report.lostDisablesCapture=await page.locator("#capture").isDisabled();
 await page.evaluate(()=>{window.__testBlank=false;window.__testX=80});
 await page.waitForFunction(()=>document.querySelector("#tracking-label").textContent.includes("따라가는 중"),null,{timeout:12000});
 report.reacquired=true;
 await page.click("#switch");
 await page.waitForFunction(()=>document.querySelector("#layers").classList.contains("mirrored"),null,{timeout:8000});
 report.selfieMirrored=true;
 report.cameraSwitchHidesModel=await page.locator("#capture").isDisabled();
 report.cameraRequests=await page.evaluate(()=>window.__testCameraCalls);
 await page.click("#stop");
 report.stopped=await page.evaluate(()=>document.querySelector("video").srcObject===null);
 }catch(e){report.failure=String(e);report.status=await page.locator("#status").textContent();report.label=await page.locator("#tracking-label").textContent();}
 report.errors=errors;report.logs=logs;report.failedRequests=failed;
 if (report.failure) process.exitCode=1;
 console.log(JSON.stringify(report));
 await browser.close();server.close();
})().catch(e=>{console.error(e);process.exitCode=1})
