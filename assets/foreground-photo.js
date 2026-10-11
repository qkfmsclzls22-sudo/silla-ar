// Camera and 3D are composited locally. Native AR remains a separate option.
const original = document.querySelector('.vitrine model-viewer');
if (original) setupPhotoMode(original);

function setupPhotoMode(original) {
  const entry = document.createElement('section');
  entry.className = 'photo-entry';
  entry.innerHTML = '<button type="button">함께 사진 찍기 · 항상 앞에</button><p>유물이 사람 앞에 표시돼요. 위치와 크기를 맞춰 촬영하세요.<br>실제 공간에 놓으려면 위의 AR로 보기를 이용하세요.</p>';
  original.closest('.vitrine').after(entry);
  const openButton = entry.querySelector('button');
  const dialog = document.createElement('dialog');
  dialog.className = 'photo-dialog';
  dialog.setAttribute('aria-label', '유물과 함께 사진 찍기');
  dialog.innerHTML = `
    <div class="photo-layout">
      <div class="photo-toolbar"><strong>유물과 함께 사진 찍기</strong><button type="button" data-action="close">닫기</button></div>
      <div class="photo-stage">
        <video autoplay muted playsinline aria-label="카메라 미리보기"></video>
        <div class="photo-object"></div>
      </div>
      <p class="photo-status" role="status" aria-live="polite"></p>
      <div class="photo-controls">
        <div class="photo-row"><button type="button" data-action="move" aria-pressed="true">위치 이동</button><button type="button" data-action="rotate" aria-pressed="false">방향 회전</button><button type="button" data-action="reset">초기화</button></div>
        <label class="photo-size">유물 크기 <input type="range" min="20" max="180" value="80" aria-label="유물 크기"></label>
        <div class="photo-row"><button type="button" data-action="camera">카메라 전환</button><button type="button" class="photo-primary" data-action="capture" disabled>사진 촬영</button></div>
        <button type="button" data-action="retry" hidden>카메라 다시 켜기</button>
      </div>
      <section class="photo-result" hidden aria-label="촬영한 사진">
        <img alt="유물과 함께 촬영한 사진">
        <div class="photo-row"><button type="button" data-action="share">사진 저장 / 공유</button><a class="photo-save" download="gyeongju-photo.jpg">다운로드</a></div>
        <p>아이폰은 ‘사진 저장 / 공유’에서 이미지 저장을 선택하세요. 사진을 길게 눌러 저장할 수도 있어요. 촬영한 사진은 서버로 전송되지 않습니다.</p>
      </section>
    </div>`;
  document.body.append(dialog);
  const $ = selector => dialog.querySelector(selector);
  const action = name => $(`[data-action="${name}"]`);
  const stage = $('.photo-stage'), video = $('video'), object = $('.photo-object');
  const status = $('.photo-status'), size = $('input'), result = $('.photo-result');
  const model = document.createElement('model-viewer');
  for (const attr of ['src', 'alt', 'exposure', 'environment-image', 'camera-orbit', 'orientation', 'camera-target', 'field-of-view']) {
    if (original.hasAttribute(attr)) model.setAttribute(attr, original.getAttribute(attr));
  }
  model.setAttribute('camera-controls', '');
  model.setAttribute('disable-pan', '');
  model.setAttribute('disable-zoom', '');
  model.setAttribute('interaction-prompt', 'none');
  model.setAttribute('shadow-intensity', '0');
  model.setAttribute('touch-action', 'none');
  model.setAttribute('loading', 'eager');
  model.setAttribute('reveal', 'auto');
  let stream, epoch = 0, facing = 'environment', mirrored = false;
  let x = .5, y = .5, moving = true, drag = null, capturing = false;
  let photoFile, photoURL, oldOverflow, wasRotating;
  const hint = '화면을 드래그해 위치를 맞추세요. 방향 회전으로 옆모습도 조절할 수 있어요. 얼굴을 자동으로 따라가지는 않아요.';
  function layout() {
    object.style.left = `${x * 100}%`; object.style.top = `${y * 100}%`;
    object.style.width = `${size.value}%`;
  }
  function setMode(move) {
    moving = move; drag = null;
    stage.classList.toggle('rotating', !move);
    action('move').setAttribute('aria-pressed', String(move));
    action('rotate').setAttribute('aria-pressed', String(!move));
    status.textContent = move ? hint : '유물을 드래그해 방향을 돌리세요. 위치를 바꾸려면 위치 이동을 누르세요.';
  }
  function updateCapture() {
    action('capture').disabled = capturing || !stream || video.readyState < 2 || !model.loaded;
  }
  function stopCamera() {
    stream?.getTracks().forEach(track => track.stop()); stream = null;
    video.srcObject = null; updateCapture();
  }
  async function startCamera() {
    const token = ++epoch;
    stopCamera(); action('retry').hidden = true;
    status.textContent = '카메라를 켜는 중입니다. 카메라 사용을 허용해주세요.';
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported');
      const next = await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:facing},width:{ideal:1920},height:{ideal:1440}}});
      if (token !== epoch || !dialog.open) { next.getTracks().forEach(t => t.stop()); return; }
      stream = next; video.srcObject = next;
      mirrored = (next.getVideoTracks()[0].getSettings().facingMode || facing) === 'user';
      video.classList.toggle('mirrored', mirrored);
      await video.play();
      if (token !== epoch || !dialog.open) return;
      status.textContent = model.loaded ? hint : '카메라가 켜졌어요. 3D 모델을 불러오는 중입니다.';
      updateCapture();
    } catch (error) {
      if (token !== epoch || !dialog.open) return;
      stopCamera(); action('retry').hidden = false;
      status.textContent = error.name === 'NotAllowedError'
        ? '카메라 사용이 허용되지 않았어요. 브라우저의 카메라 권한을 허용한 뒤 다시 켜기를 눌러주세요. 아이폰은 Safari에서 열어주세요.'
        : '카메라를 열지 못했어요. 카메라를 사용하는 다른 앱을 닫고 Safari 또는 Chrome에서 다시 켜주세요.';
    }
  }
  function clearPhoto() {
    if (photoURL) URL.revokeObjectURL(photoURL);
    photoURL = null; photoFile = null; result.hidden = true;
    result.querySelector('img').removeAttribute('src');
  }
  function close() { if (dialog.open) dialog.close(); }
  dialog.addEventListener('close', () => {
    ++epoch; stopCamera(); clearPhoto(); object.replaceChildren();
    document.body.style.overflow = oldOverflow;
    if (wasRotating) original.setAttribute('auto-rotate', '');
    openButton.focus();
  });
  openButton.addEventListener('click', () => {
    oldOverflow = document.body.style.overflow;
    wasRotating = original.hasAttribute('auto-rotate'); original.removeAttribute('auto-rotate');
    document.body.style.overflow = 'hidden';
    object.append(model); dialog.showModal();
    x = y = .5; size.value = '80'; layout(); setMode(true);
    startCamera();
  });
  action('close').addEventListener('click', close);
  action('retry').addEventListener('click', startCamera);
  action('camera').addEventListener('click', () => { facing = facing === 'environment' ? 'user' : 'environment'; startCamera(); });
  action('move').addEventListener('click', () => setMode(true));
  action('rotate').addEventListener('click', () => setMode(false));
  action('reset').addEventListener('click', () => {
    x = y = .5; size.value = '80'; layout();
    model.cameraOrbit = original.getAttribute('camera-orbit') || '0deg 75deg 105%';
    model.jumpCameraToGoal(); setMode(true);
  });
  size.addEventListener('input', layout);
  stage.addEventListener('pointerdown', event => {
    if (!moving || capturing || !event.isPrimary) return;
    drag = {id:event.pointerId, px:event.clientX, py:event.clientY, x, y};
    stage.setPointerCapture(event.pointerId);
  });
  stage.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    const r = stage.getBoundingClientRect();
    x = Math.max(0, Math.min(1, drag.x + (event.clientX - drag.px)/r.width));
    y = Math.max(0, Math.min(1, drag.y + (event.clientY - drag.py)/r.height)); layout();
  });
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) stage.addEventListener(name, () => { drag = null; });
  model.addEventListener('load', () => { updateCapture(); if (stream) status.textContent = hint; });
  model.addEventListener('error', () => { action('capture').disabled = true; status.textContent = '유물을 불러오지 못했어요. 창을 닫고 인터넷 연결을 확인한 뒤 다시 시도해주세요.'; });
  video.addEventListener('loadeddata', updateCapture);
  function setBusy(busy) {
    capturing = busy; stage.classList.toggle('busy', busy);
    for (const el of dialog.querySelectorAll('.photo-controls button,.photo-controls input')) el.disabled = busy;
    updateCapture();
  }
  action('capture').addEventListener('click', async () => {
    if (action('capture').disabled) return;
    const token = epoch;
    setBusy(true); status.textContent = '사진을 만드는 중입니다.';
    try {
      const frame = stage.getBoundingClientRect(), rect = object.getBoundingClientRect();
      const canvas = document.createElement('canvas');
      const density = Math.min(3, 1920/Math.max(frame.width, frame.height));
      canvas.width = Math.round(frame.width*density); canvas.height = Math.round(frame.height*density);
      const ctx = canvas.getContext('2d');
      // Match object-fit:cover, including the front camera's mirrored preview.
      const ratio = Math.max(canvas.width/video.videoWidth, canvas.height/video.videoHeight);
      const w = video.videoWidth*ratio, h = video.videoHeight*ratio;
      ctx.save(); if (mirrored) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
      ctx.drawImage(video, (canvas.width-w)/2, (canvas.height-h)/2, w, h); ctx.restore();
      model.jumpCameraToGoal();
      const blob = await model.toBlob({mimeType:'image/png', idealAspect:false});
      const imageURL = URL.createObjectURL(blob);
      try {
        const image = new Image(); image.src = imageURL; await image.decode();
        ctx.drawImage(image, (rect.left-frame.left)*density, (rect.top-frame.top)*density, rect.width*density, rect.height*density);
      } finally { URL.revokeObjectURL(imageURL); }
      const output = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .95));
      if (!output) throw new Error('capture');
      if (token !== epoch || !dialog.open) return;
      clearPhoto(); photoFile = new File([output], 'gyeongju-photo.jpg', {type:'image/jpeg'});
      photoURL = URL.createObjectURL(output);
      result.querySelector('img').src = photoURL; result.querySelector('a').href = photoURL;
      result.hidden = false;
      action('share').hidden = !navigator.canShare?.({files:[photoFile]});
      status.textContent = '촬영했어요! 아래에서 사진을 저장하세요.';
      result.scrollIntoView({block:'nearest', behavior:'smooth'});
    } catch {
      if (token === epoch && dialog.open) status.textContent = '사진을 만들지 못했어요. 유물이 보이는지 확인한 뒤 다시 촬영해주세요.';
    } finally { setBusy(false); }
  });
  action('share').addEventListener('click', async () => {
    if (!photoFile) return;
    try { await navigator.share({files:[photoFile], title:'경주트립 유물 사진'}); }
    catch (error) { if (error.name !== 'AbortError') status.textContent = '공유를 열지 못했어요. 다운로드 또는 사진을 길게 눌러 저장해주세요.'; }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && dialog.open) {
      ++epoch; stopCamera(); action('retry').hidden = false;
      status.textContent = '카메라를 일시 정지했어요. 다시 켜기를 눌러 촬영을 이어가세요.';
    }
  });
  window.addEventListener('pagehide', () => { ++epoch; stopCamera(); });
}
