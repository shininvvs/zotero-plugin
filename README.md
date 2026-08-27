# Hangul Cite

Zotero에서 선택한 논문의 **본문 인용**과 **참고문헌**을 클립보드로 복사하는 플러그인입니다.
한글(HWP)로 논문을 쓸 때 Zotero 서지정보를 손으로 옮겨 적지 않기 위해 만들었습니다.

Zotero는 Word와 LibreOffice만 지원하기 때문에, 한글 사용자는 참고문헌을 수기로 작성해 왔습니다.
이 플러그인은 그 첫 단계로, Zotero의 CSL 엔진이 만든 결과물을 클립보드로 꺼내옵니다.

## 설치

1. [Releases](https://github.com/shininvvs/zotero-plugin/releases)에서 `hangul-cite.xpi` 다운로드
2. Zotero 실행 → **도구 → 플러그인**
3. 우측 상단 톱니바퀴 → **Install Plugin From File...**
4. 다운로드한 `.xpi` 선택

> Zotero 7 이상. **Zotero 10.0.1에서 API 호환성을 확인했습니다.**

## 사용법

항목을 하나 이상 선택하고 **우클릭 → 한글 인용**

| 메뉴 | 결과 |
|---|---|
| 본문 인용 복사 | `(홍길동, 2024)` |
| 참고문헌 복사 | `홍길동. (2024). 논문 제목. 학술지명, 12(3), 45-67.` |

복사된 텍스트를 한글 문서에 그대로 붙여넣으면 됩니다.

## 인용 스타일 설정

플러그인은 Zotero에 이미 설정된 **빠른 복사** 스타일을 그대로 사용합니다.
별도 설정 화면이 없으며, 스타일을 바꾸려면:

**편집 → 환경설정 → 내보내기 → 항목 형식**

설정이 없으면 APA로 동작합니다.

한국 학회 양식이 필요하면 [Zotero Style Repository](https://www.zotero.org/styles)에서
`Korean` 으로 검색해 설치한 뒤 위 설정에서 선택하세요.

## 빌드

Node.js나 별도 빌드 도구가 필요하지 않습니다.

```powershell
powershell -ExecutionPolicy Bypass -File build.ps1
```

`build/hangul-cite.xpi` 가 생성됩니다.

## 개발

Zotero를 개발 모드로 띄우면 플러그인 폴더를 직접 로드할 수 있습니다.

1. Zotero 프로필 폴더의 `extensions/` 안에 `hangul-cite@shininvvs` 라는 이름의
   텍스트 파일을 만들고, 내용으로 이 저장소의 절대 경로를 적습니다.
2. `prefs.js` 에 `user_pref("extensions.lastAppBuildId", "");` 를 추가해
   플러그인 캐시를 무효화합니다.
3. Zotero 재시작.

로그는 **도움말 → 디버그 출력 로깅**에서 확인할 수 있습니다.

## 구조

```
manifest.json          플러그인 메타데이터
bootstrap.js           Zotero 7 진입점 (startup/shutdown)
src/hangulcite.js      메뉴 등록 + 인용문 생성 로직
build.ps1              .xpi 패키징
```

## 앞으로

- [ ] 한/글 COM 연동으로 커서 위치에 바로 삽입
- [ ] 국내 학회 CSL 스타일 번들
- [ ] KCI / RISS 메타데이터 커넥터
- [ ] 단축키 지원
- [ ] 인용 스타일 개별 설정 (현재는 Zotero 빠른 복사 설정을 따름)

## 라이선스

MIT
