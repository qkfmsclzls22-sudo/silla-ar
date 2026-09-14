import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { coverRect, screenPoint, trackingState, smoothingAlpha, clamp } from "./camera-math.js";

const $ = id => document.getElementById(id);
const video = $("video"), stage = $("stage");
const presets = {
  crown: { name: "금관", url: "../crown/crown_side_ornaments_v4.glb", width: 1.48, anchor: 10 },
  smile: { name: "수막새", url: "../smile/smile-textured-v1.glb", width: 1.36, anchor: 1 }
};
const state = {
  selected: "crown", mode: "face", facing: "environment", mirrored: false,
  running: false, busy: false, show: false, stream: null, session: 0,
  worker: null, workerReady: false, workerBusy: false, workerTimer: null,
  lastFrame: -1, lastDetect: 0, lastSeen: 0, pose: null,
  manual: { x: 0, y: 0, width: 160 }, drag: null,
  adjustments: { size: 1, height: 0, horizontal: 0, angle: 0 },
  photoURL: null, photoBlob: null
};
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
$("render-layer").appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 5000);
camera.position.z = 2000;
const pmrem = new THREE.PMREMGenerator(renderer);
const room = new RoomEnvironment();
const envTarget = pmrem.fromScene(room, 0.04);
scene.environment = envTarget.texture;
room.dispose(); pmrem.dispose();
scene.add(new THREE.HemisphereLight(0xffffff, 0xb4a08a, 2));
const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(-200, 500, 800); scene.add(light);
const anchor = new THREE.Group();
const adjustment = new THREE.Group();
anchor.add(adjustment); scene.add(anchor); anchor.visible = false;
const models = new Map(), loads = new Map();
const draco = new DRACOLoader();
draco.setDecoderPath("https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/libs/draco/");
draco.setWorkerLimit(1);
const loader = new GLTFLoader(); loader.setDRACOLoader(draco);
const target = new THREE.Vector3();
let lastRender = 0;

function say(message) { if ($("status").textContent !== message) $("status").textContent = message; }
function label(message) { if ($("tracking-label").textContent !== message) $("tracking-label").textContent = message; }
function updateControls() {
  $("start").disabled = state.busy || state.running;
  $("start").textContent = state.busy ? "카메라 여는 중" : state.running ? "카메라 켜짐" : "카메라 켜기";
  $("switch").disabled = !state.running || state.busy;
  $("stop").disabled = !state.running && !state.busy;
  $("switch").textContent = state.facing === "environment" ? "셀카로 전환" : "후면으로 전환";
  $("camera-label").textContent = state.mirrored ? "전면 카메라 · 셀카 (좌우 반전)" : "후면 카메라 · 다른 사람 촬영";
  $("show").disabled = !state.running || !models.has(state.selected);
  $("show").textContent = loads.has(state.selected) && !models.has(state.selected)
    ? "3D 유물 불러오는 중" : presets[state.selected].name + " 띄우기";
  $("hide").disabled = !state.show;
  $("recenter").disabled = !state.running;
  $("capture").disabled = !state.running || !anchor.visible || $("photo-dialog").open;
  $("layers").classList.toggle("mirrored", state.mirrored);
  $("guide").hidden = !state.running || state.mode === "manual" || state.show;
  $("welcome").hidden = state.running;
  for (const key of ["face", "manual"]) $("mode-" + key).setAttribute("aria-pressed", String(key === state.mode));
}
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h);
  camera.left = -w / 2; camera.right = w / 2;
  camera.top = h / 2; camera.bottom = -h / 2; camera.updateProjectionMatrix();
  state.pose = null;
  state.manual.x = clamp(state.manual.x, -w / 2, w / 2);
  state.manual.y = clamp(state.manual.y, -h / 2, h / 2);
}
new ResizeObserver(resize).observe(stage);
resize();

async function loadModel(key) {
  if (models.has(key)) return models.get(key);
  if (loads.has(key)) return loads.get(key);
  const promise = (async () => {
    const gltf = await loader.loadAsync(presets[key].url);
    const model = gltf.scene;
    model.updateMatrixWorld(true);
    let box = new THREE.Box3().setFromObject(model);
    let size = box.getSize(new THREE.Vector3());
    // Earlier crown revisions used Z-up. Correct only when the actual world bounds require it.
    if (key === "crown" && size.z > size.y * 1.35) {
      model.rotateX(-Math.PI / 2); model.updateMatrixWorld(true);
      box = new THREE.Box3().setFromObject(model); size = box.getSize(new THREE.Vector3());
    }
    if (!Number.isFinite(size.x) || size.x <= 0) throw Error("Invalid model bounds");
    const center = box.getCenter(new THREE.Vector3());
    if (key === "crown") center.y = box.min.y + size.y * 0.34; // Band above the hanging side ornaments.
    model.position.sub(center);
    const normalized = new THREE.Group();
    normalized.add(model); normalized.scale.setScalar(1 / size.x);
    normalized.visible = false; adjustment.add(normalized); models.set(key, normalized);
    console.info("preview:model-ready", key, { bounds: size.toArray() });
    return normalized;
  })();
  loads.set(key, promise); updateControls();
  try {
    const result = await promise;
    if (state.selected === key && state.running && state.mode === "face" && state.workerReady) say("구도를 잡은 뒤 ‘" + presets[key].name + " 띄우기’를 눌러주세요.");
    return result;
  } catch (error) {
    console.error("Model load failed", key, error);
    if (key === state.selected) say("3D를 불러오지 못했어요. 유물을 다시 선택하면 재시도합니다.");
    return null;
  } finally { loads.delete(key); updateControls(); }
}
function resetPose() { state.pose = null; state.lastSeen = 0; anchor.visible = false; }
function setMode(mode) {
  if (mode === "manual" && anchor.visible) {
    state.manual = { x: anchor.position.x, y: anchor.position.y, width: anchor.scale.x / state.adjustments.size };
  } else if (mode === "manual") {
    state.manual = { x: 0, y: state.selected === "crown" ? stage.clientHeight * 0.12 : 0, width: stage.clientWidth * 0.48 };
  }
  state.mode = mode;
  if (mode === "face") { resetPose(); if (state.running) startTracker(); }
  $("mode-help").textContent = mode === "face"
    ? "한 사람의 얼굴 위치와 방향을 따라갑니다. 인식이 잠시 끊기면 마지막 위치를 유지합니다."
    : "화면에 고정됩니다. 사람을 자동으로 따라가지 않아요. 화면을 드래그하거나 조절값으로 직접 맞춰주세요.";
  say(mode === "face" ? "얼굴이 정면에 들어오도록 구도를 잡아주세요." : "화면 고정 모드입니다. 유물을 띄운 뒤 드래그해 위치를 맞춰주세요.");
  updateControls();
}
function trackerFailure(message) {
  state.worker?.terminate(); state.worker = null;
  state.workerReady = false; state.workerBusy = false;
  clearTimeout(state.workerTimer);
  setMode("manual");
  say(message + " 화면 고정 모드로 계속 촬영할 수 있어요.");
}
function startTracker() {
  if (state.worker || !state.running) return;
  if (!window.Worker || !window.createImageBitmap) {
    trackerFailure("이 브라우저에서는 얼굴 인식을 시작할 수 없습니다."); return;
  }
  let worker;
  try { worker = new Worker(new URL("./face-worker.js?v=2", import.meta.url)); }
  catch { trackerFailure("얼굴 인식을 시작하지 못했습니다."); return; }
  state.worker = worker;
  state.workerTimer = setTimeout(() => {
    if (state.worker === worker && !state.workerReady) trackerFailure("얼굴 인식 준비가 지연되었습니다.");
  }, 45000);
  worker.onmessage = ({ data }) => {
    if (worker !== state.worker) return;
    if (data.type === "ready") {
      state.workerReady = true; clearTimeout(state.workerTimer);
      return;
    }
    state.workerBusy = false;
    if (data.type === "error") {
      console.warn("Face tracker:", data.message);
      trackerFailure("자동 인식을 사용할 수 없습니다."); return;
    }
    if (data.type !== "result" || data.session !== state.session || state.mode !== "face" || !state.running) return;
    if (data.landmarks) applyFace(data.landmarks, data.matrix);
  };
  worker.onerror = event => {
    event.preventDefault();
    if (state.worker === worker) trackerFailure("자동 인식을 불러오지 못했습니다.");
  };
  worker.postMessage({ type: "init" });
}
function applyFace(points, matrix) {
  const rect = coverRect(video.videoWidth, video.videoHeight, stage.clientWidth, stage.clientHeight);
  if (!rect || !points[454]) return;
  const w = stage.clientWidth, h = stage.clientHeight;
  const a = screenPoint(points[234], rect, w, h);
  const b = screenPoint(points[454], rect, w, h);
  const p = screenPoint(points[presets[state.selected].anchor], rect, w, h);
  const width = Math.hypot(a.x - b.x, a.y - b.y) * presets[state.selected].width;
  if (!Number.isFinite(width) || width < 18 || width > w * 2.5) return;
  const q = new THREE.Quaternion();
  if (matrix?.length === 16 && Array.from(matrix).every(Number.isFinite)) {
    const m = new THREE.Matrix4().fromArray(matrix);
    m.decompose(new THREE.Vector3(), q, new THREE.Vector3());
  } else {
    q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.atan2(b.y - a.y, b.x - a.x));
  }
  state.pose = { x: p.x, y: p.y, width, q };
  state.lastSeen = performance.now();
}
async function sendFrame(now) {
  if (!state.running || state.mode !== "face" || !state.workerReady || state.workerBusy ||
      video.readyState < 2 || video.currentTime === state.lastFrame || now - state.lastDetect < 85) return;
  state.lastDetect = now; state.lastFrame = video.currentTime; state.workerBusy = true;
  const worker = state.worker, session = state.session;
  try {
    const maxWidth = Math.min(640, video.videoWidth);
    const bitmap = await createImageBitmap(video, {
      resizeWidth: maxWidth, resizeHeight: Math.max(1, Math.round(video.videoHeight * maxWidth / video.videoWidth))
    });
    if (!state.running || worker !== state.worker || session !== state.session) { bitmap.close(); return; }
    worker.postMessage({ type: "frame", bitmap, timestamp: performance.now(), session }, [bitmap]);
  } catch (error) {
    if (worker === state.worker) trackerFailure("카메라 영상을 자동 인식에 연결하지 못했습니다.");
  }
}
function errorText(error) {
  if (error?.name === "NotAllowedError" || error?.name === "SecurityError") return "카메라 권한이 꺼져 있어요. 브라우저의 사이트 설정에서 카메라를 허용해주세요.";
  if (error?.name === "NotFoundError") return "사용할 수 있는 카메라를 찾지 못했습니다.";
  if (error?.name === "NotReadableError") return "다른 앱이 카메라를 사용 중일 수 있어요. 카메라 앱을 닫고 다시 눌러주세요.";
  return "카메라를 열지 못했습니다. Safari 또는 Chrome에서 다시 열어주세요.";
}
async function startCamera() {
  if (state.running || state.busy) return;
  if (!isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    say("카메라를 지원하는 HTTPS 브라우저에서 열어주세요. iPhone은 Safari, Android는 Chrome을 권장합니다."); return;
  }
  state.busy = true; const session = ++state.session; updateControls();
  say("카메라 권한을 허용해주세요. 마이크는 사용하지 않습니다.");
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false, video: { facingMode: { ideal: state.facing }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 24, max: 30 } }
    });
    if (session !== state.session) { stream.getTracks().forEach(track => track.stop()); return; }
    state.stream = stream; video.srcObject = stream;
    await video.play();
    if (session !== state.session || document.hidden) { stream.getTracks().forEach(track => track.stop()); return; }
    const actual = stream.getVideoTracks()[0].getSettings().facingMode;
    if (actual === "user" || actual === "environment") state.facing = actual;
    state.mirrored = state.facing === "user";
    state.running = true; state.show = false; state.lastFrame = -1; resetPose(); resize();
    stream.getVideoTracks()[0].addEventListener("ended", () => {
      if (state.stream === stream) { stopCamera(); say("카메라 연결이 종료되었습니다. 다시 켜주세요."); }
    });
    if (state.mode === "face") startTracker();
    loadModel(state.selected);
    say("구도를 먼저 잡아주세요. 준비되면 유물을 띄우세요.");
  } catch (error) {
    if (session === state.session) { state.stream?.getTracks().forEach(t => t.stop()); state.stream = null; video.srcObject = null; say(errorText(error)); }
  } finally { if (session === state.session) { state.busy = false; updateControls(); } }
}
function stopCamera() {
  ++state.session; state.running = false; state.busy = false; state.show = false;
  state.worker?.terminate(); state.worker = null; state.workerReady = false; state.workerBusy = false;
  clearTimeout(state.workerTimer);
  const stream = state.stream; state.stream = null; stream?.getTracks().forEach(t => t.stop());
  video.pause(); video.srcObject = null; resetPose(); updateControls(); label("카메라 꺼짐");
}
function render(now) {
  const dt = Math.min(now - lastRender, 100); lastRender = now;
  const tracking = trackingState(Boolean(state.pose), state.lastSeen, now);
  const active = state.running && state.show && models.has(state.selected);
  anchor.visible = active && (state.mode === "manual" || tracking === "tracking" || tracking === "holding");
  for (const [key, object] of models) object.visible = key === state.selected;
  if (anchor.visible) {
    const pose = state.mode === "face" ? state.pose : state.manual;
    const factor = smoothingAlpha(dt);
    target.set(pose.x, pose.y, 0); anchor.position.lerp(target, factor);
    const desired = pose.width * state.adjustments.size;
    anchor.scale.lerp(target.setScalar(desired), factor);
    anchor.quaternion.slerp(state.mode === "face" ? pose.q : new THREE.Quaternion(), factor);
    const mirrorSign = state.mirrored ? -1 : 1;
    adjustment.position.set(state.adjustments.horizontal * mirrorSign, state.adjustments.height, 0);
    adjustment.rotation.z = state.adjustments.angle * mirrorSign;
  }
  if (state.running) {
    if (state.mode === "manual") label(state.show ? "화면 고정 · 드래그해서 맞춰주세요" : "구도를 잡고 유물을 띄워주세요");
    else if (!state.workerReady) label("얼굴 인식 준비 중 · 화면 고정 모드도 이용할 수 있어요");
    else if (tracking === "tracking") label(state.show ? "얼굴을 따라가는 중" : "얼굴 확인 · 준비되면 유물을 띄워주세요");
    else if (tracking === "holding") label("잠시 인식이 끊겼어요 · 마지막 위치 유지 중");
    else label("얼굴을 정면으로 비춰주세요 · 어렵다면 화면 고정");
  }
  $("capture").disabled = !state.running || !anchor.visible || $("photo-dialog").open;
  renderer.render(scene, camera);
  if (!document.hidden && !$("photo-dialog").open) sendFrame(now);
  requestAnimationFrame(render);
}
requestAnimationFrame(render);

$("start").addEventListener("click", startCamera);
$("stop").addEventListener("click", () => { stopCamera(); say("카메라를 껐습니다. 다시 켜면 새 구도로 시작합니다."); });
$("switch").addEventListener("click", async () => {
  if (state.busy) return;
  const next = state.facing === "environment" ? "user" : "environment";
  stopCamera(); state.facing = next; await startCamera();
});
$("mode-face").addEventListener("click", () => setMode("face"));
$("mode-manual").addEventListener("click", () => setMode("manual"));
for (const button of document.querySelectorAll("[data-artifact]")) button.addEventListener("click", () => {
  state.selected = button.dataset.artifact; state.show = false; resetPose();
  for (const b of document.querySelectorAll("[data-artifact]")) b.setAttribute("aria-pressed", String(b === button));
  resetAdjustments();
  if (state.mode === "manual") setMode("manual");
  if (state.running) loadModel(state.selected);
  updateControls();
});
$("show").addEventListener("click", () => {
  if (!state.running || !models.has(state.selected)) return;
  state.show = true;
  if (state.mode === "manual") {
    anchor.position.set(state.manual.x, state.manual.y, 0);
    anchor.scale.setScalar(state.manual.width * state.adjustments.size);
  } else if (state.pose) {
    anchor.position.set(state.pose.x, state.pose.y, 0); anchor.scale.setScalar(state.pose.width * state.adjustments.size);
    anchor.quaternion.copy(state.pose.q);
  }
  say(state.mode === "face" ? "금관·수막새가 맞지 않으면 크기·높이를 조절해주세요. 인식이 어려우면 화면 고정을 이용하세요." : "화면을 드래그해 위치를 맞추고 촬영해주세요.");
  updateControls();
});
$("hide").addEventListener("click", () => { state.show = false; anchor.visible = false; updateControls(); say("유물을 숨겼습니다. 구도를 바꾼 뒤 다시 띄워주세요."); });
$("recenter").addEventListener("click", () => {
  if (state.mode === "manual") state.manual = { x: 0, y: state.selected === "crown" ? stage.clientHeight * .12 : 0, width: stage.clientWidth * .48 };
  else resetPose();
  say(state.mode === "face" ? "얼굴을 다시 찾고 있습니다. 정면을 비춰주세요." : "유물을 화면 가운데로 옮겼습니다.");
});
function resetAdjustments() {
  for (const [id, value] of Object.entries({ size: 100, height: 0, horizontal: 0, angle: 0 })) {
    $(id).value = value; $(id).dispatchEvent(new Event("input"));
  }
}
for (const id of ["size", "height", "horizontal", "angle"]) $(id).addEventListener("input", () => {
  const value = Number($(id).value);
  state.adjustments[id] = id === "angle" ? value * Math.PI / 180 : value / 100;
  $(id + "-value").textContent = value + (id === "size" ? "%" : id === "angle" ? "°" : "");
});
$("reset").addEventListener("click", resetAdjustments);
stage.addEventListener("pointerdown", event => {
  if (state.mode !== "manual" || !state.show || !state.running) return;
  state.drag = { px: event.clientX, py: event.clientY, x: state.manual.x, y: state.manual.y };
  stage.setPointerCapture(event.pointerId);
});
stage.addEventListener("pointermove", event => {
  if (!state.drag) return;
  state.manual.x = clamp(state.drag.x + (event.clientX - state.drag.px) * (state.mirrored ? -1 : 1), -stage.clientWidth / 2, stage.clientWidth / 2);
  state.manual.y = clamp(state.drag.y - (event.clientY - state.drag.py), -stage.clientHeight / 2, stage.clientHeight / 2);
});
for (const event of ["pointerup", "pointercancel", "lostpointercapture"]) stage.addEventListener(event, () => { state.drag = null; });

$("capture").addEventListener("click", async () => {
  if (!state.running || !anchor.visible) return;
  $("capture").disabled = true;
  try {
    const w = stage.clientWidth, h = stage.clientHeight;
    const rect = coverRect(video.videoWidth, video.videoHeight, w, h);
    const canvas = document.createElement("canvas"), scale = Math.min(2, video.videoHeight / h);
    canvas.width = Math.round(w * scale); canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);
    if (state.mirrored) { ctx.translate(w, 0); ctx.scale(-1, 1); }
    ctx.drawImage(video, rect.x, rect.y, rect.width, rect.height);
    renderer.render(scene, camera);
    ctx.drawImage(renderer.domElement, 0, 0, w, h);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", .93));
    if (!blob) throw Error("No image");
    if (state.photoURL) URL.revokeObjectURL(state.photoURL);
    state.photoBlob = blob; state.photoURL = URL.createObjectURL(blob);
    $("photo").src = state.photoURL; $("download").href = state.photoURL;
    $("share").hidden = !navigator.canShare?.({ files: [new File([blob], "silla-tryon.jpg", { type: "image/jpeg" })] });
    $("photo-dialog").showModal();
    say("사진이 준비되었습니다. 저장하거나 공유해주세요.");
  } catch (error) { console.error(error); say("사진을 저장용 이미지로 만들지 못했습니다. 화면 캡처를 이용해주세요."); }
  finally { updateControls(); }
});
$("retake").addEventListener("click", () => $("photo-dialog").close());
$("photo-dialog").addEventListener("close", updateControls);
$("share").addEventListener("click", async () => {
  try { await navigator.share({ files: [new File([state.photoBlob], "silla-tryon.jpg", { type: "image/jpeg" })] }); }
  catch (error) { if (error.name !== "AbortError") say("공유가 지원되지 않아요. 사진 저장을 이용해주세요."); }
});
$("page-link").value = location.href;
$("copy-link").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(location.href); say("주소를 복사했습니다. Safari 또는 Chrome에서 열어주세요."); }
  catch { $("page-link").focus(); $("page-link").select(); $("page-link").setSelectionRange(0, $("page-link").value.length); say("주소를 길게 눌러 복사해주세요."); }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && (state.running || state.busy)) { stopCamera(); say("다른 화면으로 이동해 카메라를 껐습니다. 다시 켜주세요."); }
});
window.addEventListener("pagehide", stopCamera);
renderer.domElement.addEventListener("webglcontextlost", event => {
  event.preventDefault(); stopCamera(); say("3D 화면이 중단되었습니다. 새로고침 후 다시 시도해주세요.");
});
clearTimeout(window.previewBootTimer);
say("카메라를 켜고 구도를 먼저 잡아주세요. 유물은 ‘띄우기’를 누를 때만 나타납니다.");
updateControls();
