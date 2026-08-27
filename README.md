# Hangul Cite

Zotero에서 선택한 논문의 인용 정보를 한국어 논문 작성에 바로 쓸 수 있는 형태로
클립보드에 복사하는 플러그인입니다.

Zotero는 Word와 LibreOffice만 지원하기 때문에 한글(HWP) 사용자는 참고문헌을
수기로 옮겨 왔습니다. 게다가 한국어 인용 스타일은 조사를 `와/과`처럼 출력해서
그대로 붙여넣을 수도 없습니다. 이 플러그인이 그 두 가지를 처리합니다.

## 설치

1. [Releases](https://github.com/shininvvs/zotero-plugin/releases)에서 `hangul-cite.xpi` 다운로드
2. Zotero 실행 → **도구 → 플러그인**
3. 우측 상단 톱니바퀴 → **Install Plugin From File...**
4. 다운로드한 `.xpi` 선택

> Zotero 10.0.1에서 설치·동작을 확인했습니다.

## 기능

항목을 하나 이상 선택하고 **우클릭 → 한글 인용**

| 메뉴 | 하는 일 |
|---|---|
| 참고문헌 복사 | 서지 항목 전체를 복사 (`Ctrl+Shift+H`) |
| 본문 인용 복사 | `(홍길동, 2024)` 형태로 복사 |
| 다른 스타일로 참고문헌 복사 | 설치된 스타일 중에 골라서 한 번만 다르게 복사 |
| 링크 복사 | DOI가 있으면 `https://doi.org/...`, 없으면 URL |

복사할 때 **서식 있는 형식과 평문을 함께** 클립보드에 올립니다. 한글이나 Word에
붙여넣으면 학술지명 이탤릭과 하이퍼링크가 유지되고, 메모장에 붙여넣으면 평문으로
떨어집니다.

항목에 빈 필드가 있으면 CSL이 구두점만 남겨 `Visualization .` 처럼 마침표 앞에
공백이 생깁니다. 복사할 때 이런 잔여 공백을 정리합니다. 다만 뒤가 빈 `In.` 같은
내용까지는 지우지 않습니다 — 정상적으로 쓰인 경우와 구분할 수 없기 때문입니다.
그건 항목의 빠진 필드(학회 논문이라면 **의사록**)를 채워야 해결됩니다.

## 조사 교정

한국어 CSL 로케일은 앞 단어의 받침을 판별하지 못합니다. 그래서 이런 결과가 나옵니다.

```
Meng, Chutian, ... Yi Yang와/과Yueting Zhuang. "LogiStory: ..."
```

조사가 둘 다 남아 있고 뒤에 공백도 없어 논문에 그대로 쓸 수 없습니다.
플러그인이 앞 글자를 보고 알맞은 쪽만 남깁니다.

```
Meng, Chutian, ... Yi Yang과 Yueting Zhuang. "LogiStory: ..."
```

처리 대상은 `와/과`, `은/는`, `이/가`, `을/를`, `(으)로` 다섯 가지입니다.

**한계**: 한글은 유니코드 음절에서 받침을 정확히 계산하지만, 로마자 이름은
한국어 독음을 근사합니다. 모음으로 끝나면 받침 없음, 자음으로 끝나면 받침 있음,
`l`은 ㄹ 받침으로 봅니다. `Yang`(→ 양, ㅇ 받침)처럼 대체로 맞지만
`David`(→ 데이비드, 받침 없음)처럼 틀리는 경우가 있습니다.

결과가 어색하면 **편집 → 설정 → 한글 인용**에서 끌 수 있습니다.

## 빈 필드 경고

학회 논문의 **의사록**이나 책 소개 면의 **책 제목**이 비어 있으면, 일부
스타일이 내용 없는 `In.` 만 출력합니다.

```
... Story Visualization. In. 2025 [cited 2026 Aug 27]. Available from: ...
```

복사할 때 이런 항목이 있으면 대화상자로 알려줍니다. 어느 항목의 어느 칸이
비었는지 목록으로 보여주므로, 여러 개를 한 번에 복사해도 무엇을 고쳐야
하는지 알 수 있습니다.

```
참고문헌 3개 복사됨

아래 항목들은 인용이 불완전합니다.

• LogiStory: A Logic-Aware Framework for Multi-Image Story…
  빈 컬럼 : [의사록]
  협의 명에서 가져올 수 있음

• 한국어 정보처리의 현재와 미래
  빈 컬럼 : [책 제목, 저자]

의사록 칸을 지금 채울까요?

              [ 채우기 ]  [ 취소 ]
```

복사는 이미 끝난 뒤에 뜨므로, 확인을 누르지 않아도 클립보드에는 들어가
있습니다.

**인용 내용은 건드리지 않습니다.** 빈 `In.` 을 지우지 않는 이유는 정상적으로
쓰인 `In` 과 구분할 수 없기 때문입니다. 제목이 In 으로 끝나거나 성이 In 인
저자가 있으면 멀쩡한 인용이 망가집니다. 고칠 곳은 항목 쪽입니다.

### 협의 명에서 가져오기

OpenReview 나 arXiv 에서 가져온 학회 논문은 **의사록**이 비어 있고
**협의 명**만 채워져 오는 일이 잦습니다. 이런 항목이 있으면 경고 창에서
**채우기**를 누르는 것으로 옮겨 담을 수 있습니다.

둘은 엄연히 다른 칸이라 자동으로 옮기지 않고 묻습니다. 학회명과 회의록
제목이 다른 경우도 있기 때문입니다.

### arXiv 에서 가져온 논문

arXiv 는 사전 인쇄본 저장소라 게재 학회 정보를 갖고 있지 않습니다. 그래서
arXiv 에서 가져온 항목은 **의사록**과 **협의 명**이 둘 다 비어 있는 경우가
많고, 채워 넣을 원본도 항목 안에 없습니다.

아직 학회에 게재된 것이 아니라면 항목 유형을 **사전 인쇄**로 바꾸는 편이
맞습니다. 이 유형에는 의사록·협의 명 칸 자체가 없어서 경고가 뜨지 않고,
인용도 `In.` 대신 사전 인쇄본 형태로 제대로 나옵니다. 나중에 게재되면 그때
학회 논문으로 바꾸고 정보를 채우면 됩니다.

### 검사하는 칸

- **제목**, **저자** — 유형과 무관하게
- **의사록** — 학회 논문
- **책 제목** — 책 소개 면

## 인용 스타일 설정

기본값은 Zotero에 이미 설정된 **빠른 복사** 스타일입니다. 바꾸려면
**편집 → 설정 → 내보내기 → 항목 형식**. 설정이 없으면 APA로 동작합니다.

한 번만 다른 양식이 필요하면 설정을 건드리지 말고
**우클릭 → 한글 인용 → 다른 스타일로 참고문헌 복사**를 쓰세요.

## 한국어 저자-연도 스타일

CSL 공식 저장소에는 **한국어로 출력되는** 인용 양식이 없습니다. 국내 학술지
양식이라고 등록된 것들도 전부 영문으로 출판되는 학술지의 것입니다. 그래서
직접 하나 만들어 함께 넣었습니다.

```
홍길동·김철수. 2024. "논문 제목." 『학술지명』 12(3): 45-67.
홍길동. 2020. 『책 제목』. 서울: 출판사.

본문 인용: (홍길동, 2024)  (홍길동·김철수, 2024)  (홍길동 외, 2024)
```

**저자를 가운뎃점으로 잇습니다.** 국내 학술 관행이기도 하고, 이렇게 하면
한국어 로케일의 `와/과` 문제가 아예 생기지 않습니다. 접속 조사를 쓸 일이
없으니까요.

기본 로케일에서 학술 인용에 맞지 않는 용어도 스타일 안에서 덮었습니다.

| 용어 | 기본 로케일 | 이 스타일 |
|---|---|---|
| et-al | 기타 | 외 |
| editor | 편집자 | 엮음 |
| translator | 번역자 | 옮김 |
| in | in | 수록 |

**이름 표기**: 적힌 순서를 그대로 씁니다. 성을 앞으로 돌리면 서양 저자가
`Meng, Chutian·Fan Ma` 처럼 쉼표와 가운뎃점이 뒤섞여 읽기 나빠집니다.
목록 정렬은 별도 매크로가 성 기준으로 처리하므로 가나다·알파벳 순서는
정상입니다.

**`외` 앞의 공백**: citeproc-js 가 한글 앞뒤의 일반 공백을 CJK 규칙으로
지워서 `Huang외` 처럼 붙어 나옵니다. 로케일 정의에서 `외` 앞에 줄바꿈 없는
공백(U+00A0)을 넣어 우회했습니다.

**다른 스타일에서도 같은 문제가 납니다**: 한국어 로케일은 `et-al` 을
`기타` 로 정의하고 있어서, 이 스타일이 아닌 다른 스타일을 한국어로 뽑으면
`Huang기타` 가 나옵니다. 공유 로케일 쪽 문제라 이 플러그인이 손댈 수 있는
범위 밖입니다.

한국 저자 이름은 Zotero 에서 **성명을 한 칸에** 입력하는 편이 좋습니다.
두 칸으로 나누면 스타일에 따라 `홍, 길동` 처럼 쉼표가 끼어들 수 있습니다.

## 국내 학회 스타일

국내 학회지 인용 양식 12종이 플러그인에 함께 들어 있습니다.
**편집 → 설정 → 한글 인용 → 국내 학회 스타일 설치**를 누르면 Zotero의
스타일 목록에 추가되어 다른 스타일처럼 쓸 수 있습니다. 이미 있는 것은
건너뛰므로 여러 번 눌러도 안전합니다.

| 스타일 |
|---|
| Journal of Korean Medical Science |
| Journal of Korean Neurosurgical Society |
| Journal of the Korean Society of Civil Engineers |
| Journal of the Korean Society for Applied Biological Chemistry |
| Journal of the Korean Statistical Society |
| Korean Journal of Anesthesiology |
| Korean Journal of Radiology |
| Korean Social Science Journal |
| The Korean Journal of Gastroenterology |
| The Korean Journal of Internal Medicine |
| The Korean Journal of Mycology |
| The Korean Journal of Pathology |

이 중 5종은 다른 스타일의 서식을 그대로 쓰고 이름만 다른 종속 스타일이라,
필요한 부모 스타일 3종도 함께 설치됩니다. 자세한 대응 관계와 라이선스는
[styles/NOTICE.md](styles/NOTICE.md)를 보세요.

번들 파일은 [CSL 공식 저장소](https://github.com/citation-style-language/styles)에서
가져온 것이며 **CC BY-SA 3.0** 라이선스를 따릅니다. 플러그인 본체의 MIT
라이선스와는 별개입니다.

목록에 없는 양식은 [Zotero Style Repository](https://www.zotero.org/styles)에서
직접 검색해 설치하면 됩니다.

## 빌드

Node.js나 별도 빌드 도구가 필요하지 않습니다.

```powershell
powershell -ExecutionPolicy Bypass -File build.ps1
```

`build/hangul-cite.xpi` 가 생성됩니다.

## 릴리스

`update.json` 이 자동 업데이트의 기준이 됩니다. 새 버전을 낼 때마다
manifest 와 이 파일을 함께 올려야 하며, 셋이 어긋나면 업데이트가 조용히
실패합니다.

1. `manifest.json` 의 `version` 을 올린다
2. `build.ps1` 로 `.xpi` 를 만든다
3. 해시를 구한다 — `sha256sum build/hangul-cite.xpi`
4. `update.json` 의 `version`, `update_link` 의 태그, `update_hash` 를 고친다
5. 커밋하고 `vX.Y.Z` 태그를 붙여 푸시한다
6. GitHub Releases 에 같은 태그로 릴리스를 만들고 `.xpi` 를 첨부한다

`update_link` 는 릴리스 자산의 주소이므로 태그 이름이 정확해야 합니다.
Zotero 는 업데이트 확인 시 `maxVersion` 을 `*` 로 강제하므로, 상위 버전
차단은 `manifest.json` 의 `strict_max_version` 으로만 걸립니다.

## 개발

Zotero를 개발 모드로 띄우면 플러그인 폴더를 직접 로드할 수 있습니다.

1. Zotero 프로필 폴더의 `extensions/` 안에 `hangul-cite@shininvvs` 라는 이름의
   텍스트 파일을 만들고, 내용으로 이 저장소의 절대 경로를 적습니다.
2. `prefs.js` 에 `user_pref("extensions.lastAppBuildId", "");` 를 추가해
   플러그인 캐시를 무효화합니다.
3. Zotero 재시작.

로그는 **도움말 → 디버그 출력 로깅**에서 확인할 수 있습니다.
정상 로드되면 `Hangul Cite: menu installed` 줄이 찍힙니다.

프로필 디렉터리로 사이드로드하면 Zotero가 `extensions.autoDisableScopes` 때문에
플러그인을 자동으로 비활성화합니다. 플러그인 목록에서 직접 켜야 합니다.

### manifest 주의사항

Zotero 10은 `applications.zotero` 아래 세 필드를 **필수**로 검사합니다
(`Extension.sys.mjs` `parseManifest`). 하나라도 없으면 "현재 Zotero 버전과
호환되지 않습니다"라는 메시지와 함께 설치가 거부됩니다.

- `id`
- `update_url`
- `strict_max_version`

특히 `strict_max_version`은 생략할 수 없습니다. 버전 비교 로직 자체는
미지정 시 `*`로 처리하지만, 그 이전 단계인 manifest 검증에서 걸립니다.
따라서 Zotero가 메이저 업데이트될 때마다 이 값을 올려야 합니다.

## 구조

```
manifest.json          플러그인 메타데이터
bootstrap.js           Zotero 진입점 (startup/shutdown)
prefs.js               기본 설정값
prefs.xhtml            설정 탭
src/hangulcite.js      메뉴 등록 + 인용문 생성 + 클립보드 + 스타일 설치
src/particles.js       조사 교정 (독립 모듈)
styles/korean-author-date.csl   직접 만든 한국어 스타일 (MIT)
styles/*.csl           CSL 저장소에서 가져온 번들 (CC BY-SA, 출처는 NOTICE.md)
update.json            자동 업데이트 매니페스트
build.ps1              .xpi 패키징
```

## 앞으로

- [x] 국내 학회 CSL 스타일 번들
- [x] 한국어로 출력되는 CSL 스타일 직접 작성
- [x] 단축키 지원
- [x] 빈 칸 경고와 자동 채우기
- [ ] 한/글 COM 연동으로 커서 위치에 바로 삽입 — 한/글 정품이 있어야 개발·검증 가능
- [ ] KCI / RISS 메타데이터 커넥터 — Zotero 번역기를 따로 작성해야 함

## 라이선스

플러그인 코드는 MIT.

`styles/korean-author-date.csl` 은 직접 작성한 것으로 플러그인과 같은 MIT 입니다.

그 밖의 `styles/*.csl` 은 CSL 공식 저장소에서 가져온 것으로 **CC BY-SA 3.0**
을 따릅니다. 출처와 원 저작자 표기는 [styles/NOTICE.md](styles/NOTICE.md)에
있습니다.
