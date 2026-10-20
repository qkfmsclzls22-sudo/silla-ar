const allowedTours = ['bulguksa', 'museum', 'wolseong'];
const params = new URLSearchParams(location.search);
let active = params.get('tour');

if (allowedTours.includes(active)) {
  try { sessionStorage.setItem('gj-active-tour', active); } catch {}
} else {
  try { active = sessionStorage.getItem('gj-active-tour'); } catch {}
}

if (allowedTours.includes(active)) {
  const back = document.querySelector('.backlink, .camera-header .camera-icon');
  if (back) {
    back.href = '../?tour=' + encodeURIComponent(active) + '#artifact-title';
    back.setAttribute('aria-label', '선택한 투어의 AR 유물체험으로 돌아가기');
  }
}
