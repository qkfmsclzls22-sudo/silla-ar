const item=document.body.dataset.photoItem||location.pathname.split('/').filter(part=>part&&part!=='index.html').pop();
const viewer=document.querySelector('.vitrine model-viewer');
if(viewer){
 const section=document.createElement('section');section.className='photo-entry';
 const a=document.createElement('a');a.className='photo-open';a.textContent='사진 찍기';a.style.cssText='display:flex;align-items:center;justify-content:center;text-decoration:none';
 const url=new URL('../play/photo.html',location.href);url.searchParams.set('item',item);const tour=new URLSearchParams(location.search).get('tour');if(['bulguksa','museum','wolseong'].includes(tour))url.searchParams.set('tour',tour);a.href=url.href;
 const note=document.createElement('p');note.textContent='흰색 셔터로 촬영하고 같은 화면에서 저장하세요.';note.style.cssText='font-size:12px;text-align:center;opacity:.75';section.append(a,note);viewer.closest('.vitrine').after(section);
}
