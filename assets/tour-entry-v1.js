const TOUR_KEY = 'gj-active-tour';
const tours = {
  bulguksa: {
    card: 'lantern-tour',
    badge: '불국사 투어 전용 QR',
    title: '불국사 투어 · 소원을 달고, 유물과 찰칵.',
    intro: '공통 AR 유물체험과 3D 소원등 마당을 함께 즐겨요.',
    section: '불국사에서 이어지는 나만의 소원',
    note: '이 QR은 불국사 투어 전용이에요. 위 AR 유물체험은 세 투어 모두 공통으로 이용할 수 있어요.'
  },
  museum: {
    card: 'museum-tour',
    badge: '박물관 투어 전용 QR',
    title: '박물관 투어 · 나의 시선으로 신라를 전시하다.',
    intro: '공통 AR 유물체험과 나만의 3D 전시실을 함께 즐겨요.',
    section: '박물관에서 이어지는 나의 신라 전시실',
    note: '이 QR은 박물관 투어 전용이에요. 위 AR 유물체험은 세 투어 모두 공통으로 이용할 수 있어요.'
  },
  wolseong: {
    card: 'wolseong-tour',
    badge: '야경 투어 전용 QR',
    title: '야경 투어 · 월성을 만들고, 유물과 찰칵.',
    intro: '공통 AR 유물체험과 3D 월성 건축을 함께 즐겨요.',
    section: '야경 속에서 완성하는 나만의 월성',
    note: '이 QR은 야경 투어 전용이에요. 위 AR 유물체험은 세 투어 모두 공통으로 이용할 수 있어요.'
  }
};

const params = new URLSearchParams(location.search);
const active = params.get('tour');
const config = tours[active];

if (config) {
  try { sessionStorage.setItem(TOUR_KEY, active); } catch {}
  document.body.dataset.tour = active;
  document.title = config.title + ' | 경주트립';

  const intro = document.querySelector('.intro');
  const heading = intro?.querySelector('h1');
  const copy = intro?.querySelector('p');
  if (intro && heading) {
    const badge = document.createElement('p');
    badge.className = 'tour-entry-badge';
    badge.textContent = config.badge;
    intro.insertBefore(badge, heading);
    heading.textContent = config.title;
  }
  if (copy) copy.textContent = config.intro;

  document.querySelectorAll('.artifact-card').forEach((link) => {
    const url = new URL(link.getAttribute('href'), location.href);
    url.searchParams.set('tour', active);
    link.href = url.href;
  });

  document.querySelectorAll('.tour-card').forEach((card) => {
    card.hidden = !card.classList.contains(config.card);
  });

  const tourHeading = document.querySelector('.tour-heading h2');
  if (tourHeading) tourHeading.textContent = config.section;

  const tourNote = document.querySelector('.tour-footnote');
  if (tourNote) tourNote.textContent = config.note;
}
