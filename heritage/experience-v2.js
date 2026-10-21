import {artifacts,legacyItems} from './catalog-v2.js?v=20261021-3';
const $=id=>document.getElementById(id),params=new URLSearchParams(location.search),raw=params.get('item'),id=legacyItems[raw]||raw;
const selected=Object.hasOwn(artifacts,id)?id:'pensive',a=artifacts[selected],root='assets/'+selected+'/';
document.title=a.title+' · 신라 변신 사진관 | 경주트립';for(const key of ['title','description','invitation','tip','story','credit'])$(key).textContent=a[key];
a.sources.forEach(([text,href])=>{const el=document.createElement('a');el.textContent=text+' ↗';el.href=href;el.target='_blank';el.rel='noopener';$('sourceLinks').append(el)});
const viewer=$('viewer');viewer.addEventListener('load',()=>$('modelStatus').textContent='3D 준비 완료 · AR은 지원되는 휴대폰에서 열려요.');viewer.addEventListener('error',()=>$('modelStatus').textContent='3D를 불러오지 못했어요. 새로고침해 주세요. 사진 체험은 이용할 수 있어요.');viewer.setAttribute('poster',root+(a.poster||'overlay-v1.png'));viewer.setAttribute('src',root+(a.model||'model-v1.glb'));viewer.setAttribute('alt',a.title+' 3D 모델');
const url=new URL('../play/photo.html',location.href);url.searchParams.set('item',selected);if(['bulguksa','museum','wolseong'].includes(params.get('tour')))url.searchParams.set('tour',params.get('tour'));$('openPhoto').onclick=()=>location.href=url.href;
