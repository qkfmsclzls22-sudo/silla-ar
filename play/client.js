const params=new URLSearchParams(location.search);
const requested=params.get('tour');
const allowed=['bulguksa','museum','wolseong'];
const explicit=allowed.includes(requested);
const active=explicit?requested:'bulguksa';

if(explicit){
  try{sessionStorage.setItem('gj-active-tour',active)}catch{}
  document.querySelectorAll('[data-tour]').forEach((link)=>{
    link.hidden=link.dataset.tour!==active;
  });
}
document.querySelector('[data-tour="'+active+'"]').setAttribute('aria-current','page');
const returnUrl='../?tour='+encodeURIComponent(active)+'#artifact-title';
const backLink=document.querySelector('.back-link');
const brand=document.querySelector('.brand');
if(backLink)backLink.href=returnUrl;
if(brand)brand.href=returnUrl;

const routes={bulguksa:['./lantern.js?v=bulguksa3d1','mountLantern'],museum:['./museum.js','mountMuseum'],wolseong:['./wolseong-3d.js?v=3d3','mountWolseong']};
const [url,name]=routes[active];
try{const m=await import(url);await m[name](document.querySelector('main'))}catch(e){console.error(e);document.querySelector('main').innerHTML='<section class="card"><h2>화면을 불러오지 못했어요.</h2><p>새로고침하면 다시 열 수 있어요. 저장한 내용은 유지됩니다.</p><button onclick="location.reload()">다시 열기</button></section>'}
