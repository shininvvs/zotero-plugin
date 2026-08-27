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
| 참고문헌 복사 | 서지 항목 전체를 복사 |
| 본문 인용 복사 | `(홍길동, 2024)` 형태로 복사 |
| 다른 스타일로 참고문헌 복사 | 설치된 스타일 중에 골라서 한 번만 다르게 복사 |
| 링크 복사 | DOI가 있으면 `https://doi.org/...`, 없으면 URL |

복사할 때 **서식 있는 형식과 평문을 함께** 클립보드에 올립니다. 한글이나 Word에
붙여넣으면 학술지명 이탤릭과 하이퍼링크가 유지되고, 메모장에 붙여넣으면 평문으로
떨어집니다.

항목에 빈 필드가 있으면 CSL이 구두점만 남겨 `Visualization .` 처럼 마침표 앞에
공백이 생깁니다. 복사할 때 이런 잔여 공백을 정리합니다. 다만 뒤가 빈 `In.` 같은
내용까지는 지우지 않습니다 — 정상적으로 쓰인 경우와 구분할 수 없기 때문입니다.
그건 항목의 빠진 필드(학회 발표 논문이라면 **회의록 제목**)를 채워야 해결됩니다.

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

## 인용 스타일 설정

기본값은 Zotero에 이미 설정된 **빠른 복사** 스타일입니다. 바꾸려면
**편집 → 설정 → 내보내기 → 항목 형식**. 설정이 없으면 APA로 동작합니다.

한 번만 다른 양식이 필요하면 설정을 건드리지 말고
**우클릭 → 한글 인용 → 다른 스타일로 참고문헌 복사**를 쓰세요.

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
styles/*.csl           번들 CSL 스타일 (CC BY-SA, 출처는 NOTICE.md)
build.ps1              .xpi 패키징
```

## 앞으로

- [ ] 한/글 COM 연동으로 커서 위치에 바로 삽입
- [x] 국내 학회 CSL 스타일 번들
- [ ] KCI / RISS 메타데이터 커넥터
- [ ] 단축키 지원

## 라이선스

플러그인 코드는 MIT.

`styles/` 아래 `.csl` 파일은 CSL 공식 저장소에서 가져온 것으로
**CC BY-SA 3.0**을 따릅니다. 출처와 원 저작자 표기는
[styles/NOTICE.md](styles/NOTICE.md)에 있습니다.
