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
 page.on("console",m=>{if(m.text().includes("preview:model-ready")||m.type()==="error")logs.push(m.text().slice(0,350))});
 page.on("requestfailed",r=>failed.push({url:r.url(),error:r.failure()?.errorText}));
 const report={};
 try{
 await page.goto("http://127.0.0.1:4173/",{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>[...document.images].every(i=>i.complete),null,{timeout:12000});
 report.main=await page.evaluate(()=>({cards:document.querySelectorAll(".card").length,queen:!!document.querySelector('a[href="seondeok/"]'),photos:[...document.images].map(i=>({alt:i.alt,loaded:i.naturalWidth>0})),overflow:document.documentElement.scrollWidth>innerWidth}));
 const thumb=await page.screenshot({type:"jpeg",quality:45,fullPage:true});
 const sharp=require(process.env.SILLA_SHARP_PATH || "sharp");
 report.mainScreenshot=(await sharp(thumb).resize({width:260}).jpeg({quality:45}).toBuffer()).toString("base64");
 await page.goto("http://127.0.0.1:4173/tryon-preview/",{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>document.querySelector("#status").textContent.includes("유물은"),null,{timeout:22000});
 report.initial=await page.evaluate(()=>({camera:!!document.querySelector("video").srcObject,captureDisabled:document.querySelector("#capture").disabled,showDisabled:document.querySelector("#show").disabled}));
 await page.click("#start");
 await page.waitForFunction(()=>document.querySelector("video").readyState>=2,null,{timeout:15000});
 await page.click("#mode-manual");
 await page.waitForFunction(()=>!document.querySelector("#show").disabled,null,{timeout:26000});
 report.cameraBeforeShow=await page.locator("#capture").isDisabled();
 await page.click("#show");
 await page.waitForFunction(()=>!document.querySelector("#capture").disabled,null,{timeout:5000});
 await page.click("#capture");
 await page.waitForFunction(()=>document.querySelector("#photo-dialog").open && document.querySelector("#photo").naturalWidth>0,null,{timeout:6000});
 report.capture=await page.evaluate(()=>({w:document.querySelector("#photo").naturalWidth,h:document.querySelector("#photo").naturalHeight,blobLink:document.querySelector("#download").href.startsWith("blob:")}));
 await page.click("#retake");
 await page.click("[data-artifact=smile]");
 await page.waitForFunction(()=>!document.querySelector("#show").disabled,null,{timeout:20000});
 await page.click("#show");
 await page.waitForFunction(()=>!document.querySelector("#capture").disabled,null,{timeout:4000});
 report.smileLoaded=true;
 await page.click("#hide");report.hideDisablesCapture=await page.locator("#capture").isDisabled();
 await page.click("#stop");
 report.stop=await page.evaluate(()=>({streamGone:document.querySelector("video").srcObject===null,restartEnabled:!document.querySelector("#start").disabled}));
 const mm=await get("tryon-preview/camera-math.js");
 const math=await import("data:text/javascript;base64,"+mm.body.toString("base64"));
 assert.deepEqual(math.coverRect(1280,720,390,520),{width:924.4444444444445,height:520,x:-267.22222222222223,y:0});
 assert.equal(math.trackingState(true,1000,1100),"tracking");
 assert.equal(math.trackingState(true,1000,1500),"holding");
 assert.equal(math.trackingState(true,1000,2500),"lost");
 report.math="pass";
 }catch(e){report.failure=String(e)}
 report.errors=errors;report.logs=logs;report.failedRequests=failed;
 if (report.failure) process.exitCode=1;
 console.log(JSON.stringify(report));
 await browser.close();server.close();
})().catch(e=>{console.error(e);process.exitCode=1})
