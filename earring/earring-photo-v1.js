// Camera and 3D are composited locally. Native AR remains a separate option.
const original = document.querySelector('.vitrine model-viewer');
if (original) setupPhotoMode(original);

function setupPhotoMode(original) {
  const entry = document.createElement('section');
  entry.className = 'photo-entry';
  entry.innerHTML = '<button type="button" class="photo-open" disabled>3D 불러오는 중…</button><div class="photo-entry-note"><p role="status">유물을 불러오고 있어요.</p><button type="button" class="photo-about">안내 ⓘ</button></div>';
  original.closest('.vitrine').after(entry);
  const openButton = entry.querySelector('.photo-open');
  const entryStatus = entry.querySelector('[role="status"]');
  const info = document.createElement('dialog'); info.className = 'photo-info-dialog';
  const infoTitle=document.createElement('h2');infoTitle.textContent=document.querySelector('h1').textContent;
  const guide=document.createElement('p');guide.textContent='사진 찍기를 누르면 한쪽 귀에 맞춰보세요 · 창작 시제품 끌어서 위치를 맞추고 두 손가락으로 크기를 조절하세요. 방향은 귀걸이 조절에서 바꿀 수 있어요. 촬영 후 같은 화면에서 저장하거나 다시 찍을 수 있습니다. 카메라 영상과 사진은 서버로 전송하지 않아요.';
  const infoClose=document.createElement('button');infoClose.textContent='닫기';infoClose.onclick=()=>info.close();
  info.append(infoTitle,guide);
  for(const el of document.querySelectorAll('.page > .info,.page > footer'))info.append(el.cloneNode(true));
  info.append(infoClose);document.body.append(info);
  entry.querySelector('.photo-about').onclick=()=>info.showModal();
  function entryReady(){openButton.disabled=!original.loaded;openButton.textContent=original.loaded?'사진 찍기':'3D 불러오는 중…';entryStatus.textContent=original.loaded?'유물이 카메라 위에 바로 나타나요.':'유물을 불러오고 있어요.'}
  original.addEventListener('load',entryReady);entryReady();
  original.addEventListener('error',()=>{openButton.disabled=true;openButton.textContent='모델 로딩 실패';entryStatus.textContent='인터넷 연결을 확인하고 새로고침해 주세요.'});
  const browserHelp=document.getElementById('browser-help');
  if(browserHelp){const dismiss=document.createElement('button');dismiss.type='button';dismiss.textContent='닫기';dismiss.style.cssText='display:block;margin-left:auto;padding:10px 18px';dismiss.onclick=()=>browserHelp.hidden=true;browserHelp.prepend(dismiss)}
  const originalStatus=document.getElementById('arStatus')||document.getElementById('model-status');
  if(originalStatus)new MutationObserver(()=>{if(!dialog.open&&original.loaded&&!originalStatus.textContent.startsWith('AR로 보기를 눌러'))entryStatus.textContent=originalStatus.textContent}).observe(originalStatus,{childList:true,characterData:true,subtree:true});
  const dialog = document.createElement('dialog');
  dialog.className = 'photo-dialog';
  dialog.setAttribute('aria-label', '유물과 함께 사진 찍기');
  dialog.innerHTML = `
    <div class="photo-layout">
      <div class="photo-toolbar"><button type="button" data-action="close" aria-label="촬영 닫기">‹</button><strong></strong><span class="photo-brand">경주트립</span></div>
      <div class="photo-workspace">
        <div class="photo-viewfinder">
          <div class="photo-stage">
            <video autoplay muted playsinline aria-label="카메라 미리보기"></video>
            <div class="photo-object"></div>
            <section class="photo-result" hidden aria-label="촬영한 사진"><img alt="유물과 함께 촬영한 사진. 길게 눌러 저장할 수도 있어요."></section>
          </div>
          <div class="photo-settings" hidden>
            <div class="photo-settings-title"><strong>귀걸이 맞추기</strong><button type="button" data-action="settings-close" aria-label="조절 닫기">×</button></div>
            <div class="photo-row"><button type="button" data-action="move" aria-pressed="true">위치 이동</button><button type="button" data-action="rotate" aria-pressed="false">방향 회전</button><button type="button" data-action="reset">초기화</button></div>
            <div class="photo-size"><button type="button" data-action="smaller" aria-label="유물 축소">−</button><input type="range" min="8" max="180" value="30" aria-label="유물 크기"><button type="button" data-action="larger" aria-label="유물 확대">＋</button></div>
          </div>
        </div>
        <div class="photo-dock">
          <p class="photo-status" role="status" aria-live="polite"></p>
          <div class="photo-live-controls">
            <div class="photo-shutter-row">
              <button type="button" data-action="settings" class="photo-side" aria-expanded="false"><span aria-hidden="true">↔</span>귀걸이 조절</button>
              <button type="button" data-action="capture" class="photo-shutter" aria-label="사진 촬영" disabled><span></span></button>
              <button type="button" data-action="camera" class="photo-side"><span aria-hidden="true">⟳</span>카메라 전환</button>
            </div>
            <button type="button" data-action="retry" hidden>카메라 다시 켜기</button>
          </div>
          <div class="photo-review-controls" hidden>
            <div class="photo-row"><button type="button" data-action="retake">다시 찍기</button><button type="button" class="photo-primary" data-action="share">사진첩에 저장</button></div>
            <p class="photo-save-hint"></p><a class="photo-save" download="gyeongju-photo.jpg" hidden>파일로 저장</a>
          </div>
        </div>
      </div>
    </div>`;
  document.body.append(dialog);
  const $ = selector => dialog.querySelector(selector);
  const action = name => $(`[data-action="${name}"]`);
  $('.photo-toolbar strong').textContent=document.querySelector('h1').textContent;
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
  let stream, epoch = 0, facing = 'user', mirrored = false;
  let x = .5, y = .5, moving = true, drag = null, capturing = false;
  const pointers = new Map();
  let pinch = null;
  let photoFile, photoURL, oldOverflow, wasRotating, phase='live';
  const hint = '귀걸이를 귀에 맞춰 끌기 · 두 손가락으로 크기 조절';
  function fit(){const viewport=window.visualViewport?.height||innerHeight;document.documentElement.style.setProperty('--photo-height',viewport+'px');if(dialog.open){const r=$('.photo-viewfinder').getBoundingClientRect(),w=Math.min(r.width,r.height*.75);stage.style.width=w+'px';stage.style.height=w/.75+'px'}}
  new ResizeObserver(fit).observe($('.photo-viewfinder'));
  window.visualViewport?.addEventListener('resize',fit);window.addEventListener('resize',fit);fit();
  function settings(show){$('.photo-settings').hidden=!show;action('settings').setAttribute('aria-expanded',String(show));if(!show&&!moving)setMode(true)}
  function review(show){phase=show?'review':'live';result.hidden=!show;$('.photo-live-controls').hidden=show;$('.photo-review-controls').hidden=!show;dialog.classList.toggle('reviewing',show);settings(false);pointers.clear();drag=pinch=null;fit()}
  function canShare(){try{return !!(photoFile&&navigator.share&&navigator.canShare?.({files:[photoFile]}))}catch{return false}}
  function layout() {
    object.style.left = `${x * 100}%`; object.style.top = `${y * 100}%`;
    // Keep the render viewport fixed: resizing it can trigger camera reframing.
    // A transform scales the visible model and its captured bounding rectangle equally.
    object.style.transform = `translate(-50%, -50%) scale(${Number(size.value)/80})`;
  }
  function resize(value) {
    size.value = String(Math.max(Number(size.min), Math.min(Number(size.max), value)));
    layout();
  }
  function setMode(move) {
    moving = move; drag = null; pinch = null; pointers.clear();
    stage.classList.toggle('rotating', !move);
    action('move').setAttribute('aria-pressed', String(move));
    action('rotate').setAttribute('aria-pressed', String(!move));
    status.textContent = move ? hint : '유물을 드래그해 방향을 돌리세요. 위치를 바꾸려면 위치 이동을 누르세요.';
  }
  function updateCapture() {
    action('capture').disabled = phase!=='live' || capturing || !stream || video.readyState < 2 || !model.loaded;
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
      if (token !== epoch || !dialog.open || document.hidden) { next.getTracks().forEach(t => t.stop()); return; }
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
    photoURL = null; photoFile = null; result.hidden = true;$('.photo-save').removeAttribute('href');
    result.querySelector('img').removeAttribute('src');
  }
  function close() { if (dialog.open) dialog.close(); }
  dialog.addEventListener('close', () => {
    ++epoch; stopCamera(); clearPhoto(); object.replaceChildren();
    document.body.style.overflow = oldOverflow;
    if (wasRotating) original.setAttribute('auto-rotate', '');
    openButton.focus({preventScroll:true});
  });
  openButton.addEventListener('click', () => {
    oldOverflow = document.body.style.overflow;
    wasRotating = original.hasAttribute('auto-rotate'); original.removeAttribute('auto-rotate');
    document.body.style.overflow = 'hidden';
    capturing=false;object.append(model); dialog.showModal();review(false);setBusy(false);fit();
    x = .68; y = .52; size.value = '30'; layout();
    model.cameraOrbit = original.getAttribute('camera-orbit') || '0deg 75deg 105%';
    model.jumpCameraToGoal(); setMode(true);
    startCamera();
  });
  action('close').addEventListener('click', close);
  action('retry').addEventListener('click', startCamera);
  action('settings').addEventListener('click',()=>settings($('.photo-settings').hidden));
  action('settings-close').addEventListener('click',()=>settings(false));
  action('retake').addEventListener('click',()=>{++epoch;clearPhoto();review(false);startCamera()});
  action('camera').addEventListener('click', () => { facing = facing === 'environment' ? 'user' : 'environment'; startCamera(); });
  action('move').addEventListener('click', () => setMode(true));
  action('rotate').addEventListener('click', () => setMode(false));
  action('reset').addEventListener('click', () => {
    x = .68; y = .52; size.value = '30'; layout();
    model.cameraOrbit = original.getAttribute('camera-orbit') || '0deg 75deg 105%';
    model.jumpCameraToGoal(); setMode(true);
  });
  size.addEventListener('input', layout);
  action('smaller').addEventListener('click', () => resize(Number(size.value)-15));
  action('larger').addEventListener('click', () => resize(Number(size.value)+15));
  function distance() {
    const [a,b] = [...pointers.values()];
    return Math.hypot(a.x-b.x, a.y-b.y);
  }
  stage.addEventListener('pointerdown', event => {
    if (!moving || capturing || phase!=='live' || event.target.closest('button,input')) return;
    pointers.set(event.pointerId, {x:event.clientX,y:event.clientY});
    if (pointers.size === 1) drag = {id:event.pointerId, px:event.clientX, py:event.clientY, x, y};
    if (pointers.size === 2) { pinch = {distance:Math.max(1,distance()),size:Number(size.value)}; drag = null; }
    stage.setPointerCapture(event.pointerId);
  });
  stage.addEventListener('pointermove', event => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, {x:event.clientX,y:event.clientY});
    if (pinch && pointers.size >= 2) { resize(pinch.size*distance()/pinch.distance); return; }
    if (!drag || drag.id !== event.pointerId) return;
    const r = stage.getBoundingClientRect();
    x = drag.x + (event.clientX - drag.px)/r.width;
    y = drag.y + (event.clientY - drag.py)/r.height; layout();
  });
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) stage.addEventListener(name, event => { pointers.delete(event.pointerId); drag = null; pinch = null; });
  model.addEventListener('load', () => { updateCapture(); if (stream&&phase==='live') status.textContent = hint; });
  model.addEventListener('error', () => { action('capture').disabled = true; status.textContent = '유물을 불러오지 못했어요. 창을 닫고 인터넷 연결을 확인한 뒤 다시 시도해주세요.'; });
  video.addEventListener('loadeddata', updateCapture);
  function setBusy(busy) {
    capturing = busy; stage.classList.toggle('busy', busy);
    for (const el of dialog.querySelectorAll('.photo-live-controls button,.photo-settings button,.photo-settings input')) el.disabled = busy;
    updateCapture();
  }
  action('capture').addEventListener('click', async () => {
    if (action('capture').disabled) return;
    const token = epoch;
    settings(false);setBusy(true); status.textContent = '사진을 만드는 중입니다.';
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
      result.querySelector('img').src = photoURL; $('.photo-save').href = photoURL;$('.photo-save').hidden=true;
      review(true);stopCamera();
      $('.photo-save-hint').textContent=canShare()?'아이폰은 저장 메뉴에서 이미지 저장을 선택해 주세요.':'사진을 길게 눌러 저장하거나 저장 버튼으로 내려받으세요.';
      status.textContent = '마음에 드는 한 장을 저장하세요.';
      action('retake').focus({preventScroll:true});
    } catch {
      if (token === epoch && dialog.open) status.textContent = '사진을 만들지 못했어요. 유물이 보이는지 확인한 뒤 다시 촬영해주세요.';
    } finally { if(token===epoch&&dialog.open)setBusy(false);else capturing=false; }
  });
  action('share').addEventListener('click', async () => {
    if (!photoFile||phase!=='review') return;
    if(canShare()){
      const token=epoch;
      try { await navigator.share({files:[photoFile]}); }
      catch (error) { if(token===epoch&&dialog.open&&error.name!=='AbortError'){$('.photo-save').hidden=false;$('.photo-save-hint').textContent='사진을 길게 눌러 저장하거나 파일로 저장을 눌러 주세요.'} }
    }else{$('.photo-save').click();$('.photo-save').hidden=false;$('.photo-save-hint').textContent='다운로드를 요청했어요. 사진을 길게 눌러 저장할 수도 있어요.'}
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && dialog.open && phase!=='review') {
      ++epoch;setBusy(false);stopCamera(); action('retry').hidden = false;
      status.textContent = '카메라를 일시 정지했어요. 다시 켜기를 눌러 주세요.';
    }
  });
  window.addEventListener('pagehide', () => { ++epoch; stopCamera(); });
}