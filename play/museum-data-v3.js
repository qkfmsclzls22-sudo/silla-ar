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
 ,{id:'crown',name:'금관총 금관',short:'나뭇가지처럼 솟은 황금',category:'황금',era:'신라 · 금관총',model:'./assets/museum-v4/crown-v1.glb',height:1.65,
  intro:'황금 위로 자라난, 신라의 상징.',value:'둥근 관테 위에 세운 나뭇가지 모양 장식이 시선을 끕니다. 얇은 금판을 오려 세운 구조에서 신라 금공예의 조형 감각을 살펴볼 수 있어요.',story:'금관총은 1921년 금관이 발견되면서 붙은 이름입니다. 금관의 주인은 확정되지 않았지만, 황금 장신구와 무덤은 신라 지배층의 권위를 보여 줍니다.',look:'관테와 세움장식이 이어지는 부분을 살펴보세요. 이 전시에는 공식 원본의 금관 본체를 골라 담았습니다.',question:'이 금관의 실루엣은 무엇을 닮았나요?',source:'https://digital.khs.go.kr/heritage/catalog.do?order=4&index=1',storySource:'https://gyeongju.museum.go.kr/kor/html/sub07/0705.html?GotoPage=11&mode=V&no=4601',note:'국가유산청 「금관총 금관(내·외관)」 원본 SM_24CL0003_Cage_High.fbx. 분리되어 있는 부속품을 제외한 본체 전시. 창작 수식은 추가하지 않았습니다.'},
 {id:'bell',name:'성덕대왕신종',short:'천년을 이어 온 울림',category:'불교미술',era:'통일신라 · 771년',model:'./assets/museum-v4/bell-v1.glb',height:1.7,
  intro:'소리와 문양을 함께 빚어 낸 거대한 종.',value:'종의 몸체에 새긴 문양과 비천상, 위쪽의 용 모양 고리가 신라의 주조 기술과 불교 미술을 함께 보여 줍니다. 실제 종은 높이 3.66m로, 여기서는 작은 전시 모형 크기로 감상해요.',story:'경덕왕이 아버지 성덕왕을 위해 만들기 시작했고, 혜공왕 때인 771년에 완성되었습니다. 종소리뿐 아니라 표면에 남은 글과 무늬도 중요한 역사 자료예요.',look:'종의 어깨와 아랫단의 무늬, 몸체의 비천상을 찾아보세요.',question:'이 종의 울림에 이름을 붙인다면?',source:'https://digital.khs.go.kr/heritage/catalog.do?order=4&index=1',storySource:'https://gyeongju.museum.go.kr/kor/html/sub04/0402.html?GotoPage=3&dvs_code=&mng_no=33&mode=V',note:'기존에 내려받은 국가유산청 「서라벌 천년왕경 성덕대왕신종」 SM_24RE0002_High_01.fbx와 원본 질감. 전시용 경량화·축소.'},
 {id:'amitabha',name:'불국사 금동아미타여래좌상',short:'극락전에 머무는 고요',category:'불교미술',era:'통일신라 · 경주 불국사',model:'./assets/museum-v4/amitabha-v1.glb',height:1.55,
  intro:'불국사에서 만난 고요를 전시실로.',value:'불국사 극락전의 금동 불상입니다. 단정한 자세와 얼굴, 몸을 감싼 옷주름을 통해 통일신라 불교 조각의 특징을 살펴볼 수 있어요.',story:'아미타불은 서방 극락세계를 주재하는 부처입니다. 불국사 투어에서 본 극락전을 떠올리며, 손의 모양과 앉은 자세를 가까이에서 감상해 보세요.',look:'무릎 위 손과 가슴 가까이 든 손, 어깨에서 흘러내리는 옷주름을 비교해 보세요.',question:'불국사에서 가장 오래 기억하고 싶은 장면은?',source:'https://digital.khs.go.kr/',storySource:'https://www.heritage.go.kr/heri/cul/culSelectDetail.do?ccbaCpno=1113700270000&pageNo=1_1_1_1',note:'기존에 내려받은 국가유산청 「국보 경주 불국사 금동아미타여래좌상 00001 모델링 서비스」 OBJ·JPG. 원본 스캔 형상과 질감 기반 경량화.'},
 {id:'helmet',name:'금동제 투구',short:'머리를 감싼 금빛',category:'무구',era:'국가유산청 · 신라 왕경 에셋',model:'./assets/museum-v4/helmet-v1.glb',height:1.25,
  intro:'몸을 지키는 도구에도 남아 있는 아름다움.',value:'투구는 머리를 보호하기 위한 장비입니다. 둥근 몸체와 가장자리, 표면의 세부를 따라 형태와 기능이 어떻게 어우러지는지 살펴보세요.',story:'신라 왕경 디지털 에셋으로 제공되는 금동제 투구입니다. 이 모델만으로 실제 착용자나 사용한 전투를 특정할 수는 없어요. 갑옷과 함께 전시하면 서로 다른 보호구의 구조를 비교할 수 있습니다.',look:'정면과 옆면에서 보이는 높이와 곡선을 비교해 보세요.',question:'갑옷과 투구 중 어느 쪽이 더 인상적인가요?',source:'https://digital.khs.go.kr/record/recordDetail3D.do?ichDataUid=13930736474358000339',storySource:'https://digital.khs.go.kr/record/recordDetail3D.do?ichDataUid=13930736474358000339',note:'국가유산청 금동제 투구 서비스본 SM_WA10101_Low.fbx 기반 기존 모델. 원본 형상·질감 활용.'},
 {id:'armor',name:'신라 판갑옷',short:'철판으로 이어 만든 방어',category:'무구',era:'국가유산청 · 신라 왕경 재현 자료',model:'./assets/museum-v4/armor-v1.glb',height:1.65,
  intro:'한 장 한 장의 철판이 몸을 지키기까지.',value:'판갑옷은 여러 철판을 연결해 몸을 보호하는 갑옷입니다. 곡면을 이루는 철판의 모양과 이어지는 선을 따라가면 몸에 맞춘 구조가 드러납니다.',story:'국가유산청이 제공하는 판갑옷 재현 자료입니다. 투구와 나란히 놓고 몸의 어느 부위를 보호하는지 비교해 보세요. 특정 인물이 입었던 갑옷으로 단정하지 않았습니다.',look:'가슴과 허리의 형태, 철판을 잇는 경계를 살펴보세요.',question:'이 갑옷을 전시한다면 어떤 제목을 붙일까요?',source:'https://digital.khs.go.kr/record/recordDetail3D.do?ichDataUid=13984209418025263053',storySource:'https://digital.khs.go.kr/record/recordDetail3D.do?ichDataUid=13984209418025263053',note:'국가유산청 판갑옷 재현 원본 SM_24WA0015_high.fbx 기반. 기존 전체 모델을 전시용으로 경량화.'}
].map((a,i)=>({...a,thumb:`./assets/${i<5?'museum-v3':'museum-v4'}/${a.id}.png`}));
export const artifactById=Object.fromEntries(artifacts.map(a=>[a.id,a]));
export const storageKey='gj-museum-gallery-v3';
// The first six slot indices are stable so existing personal exhibitions migrate intact.
export const exhibitionSlots=[
 ...[[-5,-5],[0,-7],[5,-5],[-5,1],[0,1],[5,1],[-5,7],[5,7],[-9,-1],[9,-1]].map(([x,z],i)=>({kind:'case',label:`유리 ${i+1}`,name:`${i+1}번 유리 진열장`,x,z})),
 ...[-9,-3,3,9].map((x,i)=>({kind:'wall',label:`벽 ${i+1}`,name:`벽면 ${i+1}번 전시`,x,z:-11.2}))
];
export const recommendedIds=['crown','pensive','toou','earrings','bell','smile','armor','helmet','amitabha',null,'wing',null,'smile',null];
export function normalizeState(raw){
 const initial={title:'내가 사랑한 신라',theme:'navy',cases:exhibitionSlots.map(()=>null)};
 if(!raw||typeof raw!=='object')return initial;
 return {title:typeof raw.title==='string'?(raw.title.trim().slice(0,24)||initial.title):initial.title,theme:['navy','warm'].includes(raw.theme)?raw.theme:'navy',cases:initial.cases.map((_,i)=>{const c=raw.cases?.[i];return Object.hasOwn(artifactById,c?.id)?{id:c.id,rotation:Number.isFinite(c.rotation)?c.rotation%360:0,note:typeof c.note==='string'?c.note.slice(0,80):''}:null})};
}
