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
 ,{id:'cheonma',name:'천마총 장니 천마도',short:'하늘을 달리는 말',category:'생활',era:'신라 · 경주 천마총',height:1.6,
  intro:'말다래 위에 남은, 신라의 힘찬 상상.',value:'말의 안장 양옆에 늘어뜨리는 장니에 그린 그림입니다. 하늘을 나는 듯한 말의 움직임과 가장자리 무늬에서 신라 회화의 표현을 살펴볼 수 있어요.',story:'1973년 천마총 발굴에서 발견된 천마도는 이 무덤에 이름을 주었습니다. 천마총에서는 금관과 허리띠를 비롯한 여러 장신구도 함께 나왔어요.',look:'말의 다리와 꼬리, 화면 가장자리를 둘러싼 무늬를 찾아보세요. 벽면에 전시하면 정면을 감상하기 좋아요.',question:'그림 속 말은 어디를 향해 달려갈까요?',source:catalog('13984209327902217636'),storySource:'https://www.kh.or.kr/visit/kor/road/10/view.do?key=2408220010',note:'국가유산청 「경주 천마총 장니 천마도」 공식 Cage 메시와 원본 질감. 정면 전시를 위한 방향 조정·경량화.'},
 {id:'belt',name:'금령총 금허리띠',short:'허리 아래로 흐르는 황금',category:'황금',era:'신라 · 금령총',height:1.6,
  intro:'허리띠 하나에도 드러나는 화려한 장식.',value:'띠꾸미개와 아래로 드리운 장식이 함께 어우러진 금허리띠입니다. 금판을 잇는 구조와 장식의 반복을 살펴보며 신라 금공예의 세밀함을 느껴 보세요.',story:'금령총에서는 금관과 금허리띠 같은 황금 장신구가 발견됐습니다. 의복에 달린 장식은 입은 사람의 모습과 지위를 표현하는 중요한 요소였어요.',look:'띠를 이루는 작은 판들과 아래로 내려오는 장식은 어떻게 연결되어 있나요?',question:'금관과 허리띠를 함께 전시한다면 어떤 제목이 어울릴까요?',source:catalog('13984209337068220262'),storySource:'https://digital.khs.go.kr/record/recordDetail3D.do?ichDataUid=13984209337068220262',note:'국가유산청 「금령총 금허리띠」 공식 Cage 모델과 원본 질감. 원본에 나뉘어 배치된 구성품의 배열을 유지해 전시하며, 임의로 조립하지 않았습니다.'},
 {id:'shoes',name:'식리총 금동신발',short:'발끝까지 새긴 아름다움',category:'황금',era:'신라 · 6세기 · 식리총',height:.85,
  intro:'신발 위를 가득 채운 작은 무늬들.',value:'금동 표면의 촘촘한 장식은 신라 시대 장인의 세밀한 기술을 보여 줍니다. 발을 감싸는 형태뿐 아니라 표면에 반복되는 무늬도 감상해 보세요.',story:'1924년 경주에서 발굴된 화려한 금동신발 때문에 무덤에 식리총이라는 이름이 붙었습니다. 식리는 화려하게 꾸민 신발이라는 뜻이에요.',look:'발등과 옆면의 무늬를 비교해 보세요. 전시물을 돌리면 긴 신발의 전체 형태가 드러납니다.',question:'오늘날 특별한 날 신는 신발과 어떤 점이 닮았나요?',source:catalog('13984209403793255051'),storySource:'https://modu.museum.go.kr/explore/video/20699',note:'국가유산청 「식리총 금동신발」 SM_24RE0045_High.fbx와 원본 질감. 메시 경량화·전시 방향 조정.'},
 {id:'necklace',name:'곡옥 목걸이',short:'구슬마다 다른 빛깔',category:'황금',era:'신라 왕경 에셋 · 옥류 연결 목걸이',height:1.45,
  intro:'색색의 구슬이 이어 만드는 하나의 선.',value:'구슬의 크기와 색, 굽은 옥의 형태가 어우러진 장신구입니다. 작은 부품들을 연결해 몸을 꾸미는 방식과 색의 조화를 살펴볼 수 있어요.',story:'국가유산청의 옥류 연결 곡옥 목걸이 자료입니다. 곡옥은 굽은 형태의 옥을 가리켜요. 이 전시는 자료만으로 목걸이의 주인이나 출토 무덤을 특정하지 않았습니다.',look:'아래쪽에 매달린 굽은 구슬과 목을 두르는 작은 구슬을 비교해 보세요.',question:'가장 마음에 드는 구슬의 색은 무엇인가요?',source:'https://digital.khs.go.kr/heritage/catalog.do?order=4&index=1',storySource:'https://digital.khs.go.kr/heritage/catalog.do?order=4&index=1',note:'국가유산청 「옥류연결 곡옥 목걸이」 서비스본 SM_CL00095_Low.fbx 및 원본 질감. 전시용 크기 조정.'},
 {id:'phoenixglass',name:'봉황머리 유리병',short:'신라에 도착한 먼 세계',category:'생활',era:'신라 · 황남대총 출토 유리병',height:1.5,
  intro:'길게 뻗은 입구와 푸른 손잡이의 만남.',value:'이국적인 형태의 유리병은 신라와 먼 지역 사이의 교류를 생각하게 합니다. 가늘게 올라간 목과 손잡이, 입구의 곡선을 함께 살펴보세요.',story:'황남대총 남분에서 발견된 봉수형 유리병은 수많은 유리 조각을 이어 보존처리했습니다. 파란 손잡이에는 고대에 깨진 부분을 금실로 감아 수리했던 흔적도 남아 있어요.',look:'손잡이의 푸른색과 금빛으로 감긴 부분을 찾아보세요.',question:'이 병이 신라에 도착하기까지 어떤 길을 거쳤을까요?',source:catalog('13984209338823221061'),storySource:'https://www.museum.go.kr/MUSEUM/contents/M0501000000.do?relicRecommendId=519881&schM=view',note:'국가유산청 「봉수형(봉황머리)유리병」 공식 Cage 메시와 원본 질감. 서비스의 재현 형상을 활용하며 실제 유리의 투명도를 정밀 재현한 것은 아닙니다.'},
 {id:'horseman',name:'기마인물형 토기',short:'말을 탄 작은 여행자',category:'생활',era:'신라 왕경 에셋 · 기마인물형토기',height:1.3,
  intro:'흙으로 빚은 말과 사람, 그리고 그릇.',value:'사람과 말을 입체적으로 표현한 토기입니다. 인물의 자세와 옷차림, 말갖춤은 당시의 생활 모습을 상상하게 하는 단서가 됩니다.',story:'기마인물형토기는 말에 탄 인물을 표현한 그릇입니다. 이 공식 디지털 자료에서도 말 등에 달린 입구와 앞으로 뻗은 긴 관을 찾아볼 수 있어요.',look:'인물의 모자, 말의 얼굴, 그릇의 입구를 차례로 살펴보세요.',question:'말을 탄 사람은 누구를 만나러 가는 걸까요?',source:catalog('13930736474473000352'),storySource:'https://www.museum.go.kr/MUSEUM/contents/M0606020200.do',note:'국가유산청 기마인물형토기 서비스본 SM_AR10005.fbx 및 원본 질감. 공식 디지털 재현 자료이며 특정 출토품과의 완전한 일치를 주장하지 않습니다.'},
 {id:'seosu',name:'서수모양 주전자',short:'상상 속 동물이 된 그릇',category:'생활',era:'신라 · 미추왕릉지구',height:1.25,
  intro:'용일까, 거북일까? 신라의 상상력.',value:'거북 같은 몸통에 용을 닮은 머리와 꼬리가 어우러진 그릇입니다. 상상의 동물과 실용적인 그릇의 형태를 한 몸에 표현했어요.',story:'몸통 속이 비어 있고 등에 깔때기 모양의 입구, 가슴에는 긴 귀때가 있습니다. 국립경주박물관은 주전자 같은 그릇으로 사용됐을 것으로 설명합니다.',look:'액체를 넣는 입구와 따르는 부분을 찾아보세요. 머리만 보지 말고 꼬리도 살펴보세요.',question:'이 동물에게 새 이름을 붙인다면?',source:catalog('13984209329377218237'),storySource:'https://gyeongju.museum.go.kr/kor/html/sub04/0402.html?mng_no=44&mode=V',note:'국가유산청 「서수모양 주전자」 공식 Cage 메시와 원본 질감. 전시용 경량화.'},
 {id:'dice',name:'신라 왕경 주사위',short:'작은 도구에 담긴 놀이',category:'생활',era:'국가유산청 · 신라 왕경 재현 자료',height:.75,
  intro:'손안의 작은 물건이 놀이를 시작합니다.',value:'면마다 다른 수를 표시하는 주사위 형태의 자료입니다. 장신구나 불상 옆에 전시하면 사람들의 일상과 놀이도 함께 생각할 수 있어요.',story:'국가유산청 신라 왕경 서비스가 제공하는 육면체 주사위 모델입니다. 월지에서 발견된 14면체 주령구와는 다른 형태의 자료입니다.',look:'면에 새긴 점과 모서리의 질감을 살펴보세요.',question:'친구와 이 주사위로 어떤 놀이를 해 보고 싶나요?',source:catalog('13930736471877000006'),storySource:'https://digital.khs.go.kr/record/recordDetail3D.do?ichDataUid=13930736471877000006',note:'국가유산청 「주사위」 서비스본 SM_AR20003_Low.fbx와 원본 질감. 특정 출토품의 이름이나 재질을 추정해 붙이지 않았습니다.'},
 {id:'buddha-plaque',name:'금동아미타삼존불 판불',short:'한 판에 모인 세 모습',category:'불교미술',era:'국가유산청 · 신라 왕경 불교미술',height:1.65,
  intro:'평평한 바탕에서 피어나는 입체적인 세계.',value:'중앙의 부처와 좌우의 보살을 함께 표현한 판불 자료입니다. 인물의 높낮이와 뒤쪽의 장식이 한 화면 안에서 어떻게 어우러지는지 보세요.',story:'삼존은 중심의 불상과 양옆의 두 보살을 함께 표현한 구성이에요. 국가유산청에서 제공하는 금동아미타삼존불 판불 002 자료를 전시에 담았습니다.',look:'세 인물의 손 모양과 머리 뒤 광배, 바탕의 뚫린 무늬를 비교해 보세요.',question:'독립된 불상과 판불은 어떤 느낌이 다른가요?',source:catalog('13930736471860000004'),storySource:'https://digital.khs.go.kr/record/recordDetail3D.do?ichDataUid=13930736471860000004',note:'국가유산청 금동아미타삼존불 판불 002 서비스본 SM_RE20006_Low.fbx와 인물·부속 원본 질감. 특정 출토지·소장품 번호는 단정하지 않았습니다.'},
 {id:'cheomseongdae',name:'첨성대 축소 모형',short:'경주의 하늘을 바라보다',category:'건축',era:'신라 · 경주 첨성대',height:1.6,
  intro:'경주에서 만난 돌탑을 손안의 전시로.',value:'돌을 층층이 쌓아 만든 첨성대의 형태를 3D로 감상합니다. 둥근 몸체와 중간의 네모난 창, 꼭대기의 돌 구조를 한눈에 비교할 수 있어요.',story:'경주의 대표적인 국가유산인 첨성대를 작은 전시 모형으로 가져왔습니다. 실제 건축물을 옮겨 놓은 유물이 아니라 국가유산청의 3D 자료를 축소한 전시입니다.',look:'아래쪽과 위쪽의 폭, 가운데 창의 위치를 살펴보세요.',question:'내 전시실에 경주의 건축물을 하나 더 넣는다면?',source:'https://digital.khs.go.kr/heri/heriDetail.do?ctptUid=13898859665995200028&ctptNo=1113700310000',storySource:'https://digital.khs.go.kr/heri/heriDetail.do?ctptUid=13898859665995200028&ctptNo=1113700310000',note:'국가유산청 「경주 첨성대」 공식 OBJ와 JPG. 원본 스캔 형상·질감을 유지하고 축소·경량화했습니다.'}
].map((a,i)=>({...a,model:a.model||`./assets/museum-v5/${a.id}-v1.glb`,thumb:`./assets/${i<5?'museum-v3':i<10?'museum-v4':'museum-v5'}/${a.id}.png`}));
export const artifactById=Object.fromEntries(artifacts.map(a=>[a.id,a]));
export const storageKey='gj-museum-gallery-v3';
// The first six slot indices are stable so existing personal exhibitions migrate intact.
export const exhibitionSlots=[
 ...[[-5,-5],[0,-7],[5,-5],[-5,1],[0,1],[5,1],[-5,7],[5,7],[-9,-1],[9,-1]].map(([x,z],i)=>({kind:'case',label:`유리 ${i+1}`,name:`${i+1}번 유리 진열장`,x,z})),
 ...[-9,-3,3,9].map((x,i)=>({kind:'wall',label:`벽 ${i+1}`,name:`벽면 ${i+1}번 전시`,x,z:-11.2}))
];
export const recommendedIds=['crown','pensive','horseman','earrings','bell','seosu','shoes','phoenixglass','cheomseongdae','dice','wing','cheonma','buddha-plaque','belt'];
export function normalizeState(raw){
 const initial={title:'내가 사랑한 신라',theme:'navy',cases:exhibitionSlots.map(()=>null)};
 if(!raw||typeof raw!=='object')return initial;
 return {title:typeof raw.title==='string'?(raw.title.trim().slice(0,24)||initial.title):initial.title,theme:['navy','warm'].includes(raw.theme)?raw.theme:'navy',cases:initial.cases.map((_,i)=>{const c=raw.cases?.[i];return Object.hasOwn(artifactById,c?.id)?{id:c.id,rotation:Number.isFinite(c.rotation)?c.rotation%360:0,note:typeof c.note==='string'?c.note.slice(0,80):''}:null})};
}
