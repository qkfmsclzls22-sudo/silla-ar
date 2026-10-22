const catalog=id=>`https://digital.khs.go.kr/heritage/catalogDetail.do?order=4&index=1&id=${id}&type=4&hrtg=%EC%8B%A0%EB%9D%BC%EC%99%95%EA%B2%BD`;
export const interiorSource='https://gyeongju.museum.go.kr/kor/html/sub02/0201.html?d_mng_no=10&mode=VD';
export const artifacts=[
 {id:'wing',name:'금관총 금제 관식',short:'황금의 날개',category:'황금',era:'신라 · 5세기',model:'../heritage/assets/wing/model-v1.glb',height:1.35,
  intro:'얇은 금판 위에 펼쳐진, 신라의 눈부신 솜씨.',
  value:'얇은 금판을 오리고 뚫어 섬세한 무늬를 만든 금공예입니다. 날개와 중앙 장식을 따로 만든 뒤 작은 못으로 연결한 구조에서 신라 장인의 제작 기술을 볼 수 있어요.',
  story:'금관총에서 나온 관식입니다. 신라의 지배층은 금관과 귀걸이 같은 황금 장신구를 통해 높은 지위와 권위를 드러냈습니다. 이 관식의 중앙과 날개에는 용 무늬를 뚫어 새겼어요.',
  look:'날개 안쪽의 빈 공간을 보세요. 금을 더한 장식뿐 아니라, 금을 덜어내어 만든 무늬도 있습니다.',
  question:'이 날개에 전시 제목을 붙인다면?',source:catalog('13984209332231219890'),storySource:'https://gyeongju.museum.go.kr/kor/html/sub04/0403.html?mode=V&no=5050',note:'국가유산청 「금관총 순금 관식」 3D 에셋. 원본 형상과 질감 기반, 모바일용 경량화.'},
 {id:'pensive',name:'금동반가사유상',short:'생각에 잠긴 순간',category:'불교미술',era:'불교 조각 · 반가사유상',model:'../heritage/assets/pensive/model-v1.glb',height:1.65,
  intro:'손끝과 뺨이 만나는 곳에, 고요한 생각이 머뭅니다.',
  value:'몸의 자세만으로 깊은 생각을 표현하는 불교 조각입니다. 다리와 팔이 만드는 균형, 옷주름, 잔잔한 표정을 함께 감상해 보세요.',
  story:'‘반가’는 한쪽 다리를 다른 쪽 무릎에 얹은 자세, ‘사유’는 깊이 생각한다는 뜻이에요. 이 자세는 인간의 삶과 고통을 고민하는 모습을 나타냅니다. 이 설명은 반가사유상이라는 조각 형식에 관한 이야기입니다.',
  look:'뺨에 가볍게 닿은 손가락과, 무릎 위에 놓인 발을 따라 시선을 움직여 보세요.',
  question:'지금 이 조각은 무슨 생각을 하고 있을까요?',source:'https://digital.khs.go.kr/record/recordDetail3D.do?ichDataUid=13984209342670223083',storySource:'https://www.museum.go.kr/sayu',note:'국가유산청 제공 반가사유상 3D 원본 기반. 특정 소장처·국보 번호를 이 체험에서 단정하지 않습니다.'},
 {id:'earrings',name:'신라 금귀걸이',short:'작은 황금의 기술',category:'황금',era:'신라 왕경 에셋 · 금귀걸이 108',model:'../heritage/assets/earrings/model-v1.glb',height:1.15,
  intro:'작은 장신구에 담긴, 커다란 존재감.',
  value:'금귀걸이는 신라의 금속 세공과 장신구 문화를 보여줍니다. 신라 무덤에서 발견되는 황금 장신구는 당시 지배층이 권위를 표현하던 방식도 알려줘요.',
  story:'국가유산 디지털 서비스의 ‘금귀걸이 108’ 자료를 전시했습니다. 같은 금귀걸이라도 고리와 연결 장식, 아래로 드리운 장식의 조합이 달라요. 이 자료만으로 출토 무덤이나 주인을 확정하지 않았습니다.',
  look:'위쪽 고리부터 아래 장식까지 이어지는 연결 구조를 살펴보세요. 화면에서는 세부를 볼 수 있도록 확대했습니다.',
  question:'오늘의 장신구와 가장 닮은 부분은 어디인가요?',source:catalog('13930736472143000039'),storySource:'https://gyeongju.museum.go.kr/site/kor/html/sub04/0403.html?mode=L',note:'국가유산청 금귀걸이 108, 다운로드 파일명 007. 원본 형상·질감 기반.'},
 {id:'smile',name:'얼굴무늬 수막새',short:'지붕 위의 미소',category:'생활',era:'신라 · 경주 1564',model:'./assets/museum-v3/smile-v1.glb',height:1.3,
  intro:'천 년을 건너, 우리를 바라보는 얼굴.',
  value:'지붕 끝을 마감하는 기와에 사람의 얼굴을 표현한 유물입니다. 올라간 입꼬리와 볼의 부드러운 양감이 신라 사람들의 조형 감각을 전해 줍니다.',
  story:'영묘사터에서 나왔다고 전해지며, 일본인 다나카 토시노부가 보관하다 1972년 국립경주박물관에 기증했습니다. 박물관은 지붕 위에 얼굴을 둔 까닭을 나쁜 기운을 물리치려는 뜻으로 해석합니다.',
  look:'입꼬리와 눈동자를 함께 보세요. 조금 다른 각도에서도 같은 표정으로 느껴지나요?',
  question:'이 미소를 보고 떠오른 한 단어는?',source:'https://digital.khs.go.kr/',storySource:'https://gyeongju.museum.go.kr/kor/html/sub04/0402.html?mode=V&mng_no=395&GotoPage=1',note:'제공받은 국가유산 3D 형상과 질감 자료 기반. 원본 UV가 없어 질감 위치를 재구성했고 전시용으로 경량화했습니다.'},
 {id:'toou',name:'터번 쓴 토우',short:'신라에 온 낯선 얼굴',category:'생활',era:'신라 · 월성의 토우',model:'../toou/toou-v2.glb',height:1.25,
  intro:'손바닥만 한 흙인형이 들려주는 넓은 세계.',
  value:'토우는 흙으로 만든 작은 인형이에요. 사람의 옷차림과 동작을 표현한 토우는 신라의 생활과 문화적 다양성을 살펴보는 자료가 됩니다.',
  story:'월성 해자에서는 사람과 동물, 말을 탄 사람 등 여러 형태의 토우가 발견됐습니다. 머리에 터번을 두른 듯한 인물은 외래 문화와 연결해 살펴볼 수 있지만, 작은 인형만으로 실제 인물의 신원이나 국적을 단정할 수는 없어요.',
  look:'머리를 감싼 모양, 길게 내려온 옷, 옆으로 펼친 두 팔을 차례로 살펴보세요.',
  question:'이 인물이 월성에 왔다면 무엇을 구경했을까요?',source:catalog('13930736475529000463'),storySource:'https://www.museum.go.kr/MUSEUM/contents/M0701040000.do?schM=view&catCustomType=post&catId=93&arcId=18009',note:'국가유산청 천년 신라 왕경 「토우」와 대응하는 기존 SM_AR10001 모델. 서비스 목록은 제작방식을 ‘고증’으로 표기합니다.'}
].map(a=>({...a,thumb:`./assets/museum-v3/${a.id}.png`}));
export const artifactById=Object.fromEntries(artifacts.map(a=>[a.id,a]));
export const storageKey='gj-museum-gallery-v3';
export function normalizeState(raw){
 const initial={title:'내가 사랑한 신라',theme:'navy',cases:[null,null,null,null,null,null]};
 if(!raw||typeof raw!=='object')return initial;
 return {title:typeof raw.title==='string'?(raw.title.trim().slice(0,24)||initial.title):initial.title,theme:['navy','warm'].includes(raw.theme)?raw.theme:'navy',cases:initial.cases.map((_,i)=>{const c=raw.cases?.[i];return Object.hasOwn(artifactById,c?.id)?{id:c.id,rotation:Number.isFinite(c.rotation)?c.rotation%360:0,note:typeof c.note==='string'?c.note.slice(0,80):''}:null})};
}
