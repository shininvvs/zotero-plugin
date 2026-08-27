# 번들 CSL 스타일 출처와 라이선스

이 폴더의 `.csl` 파일은 직접 작성한 것이 아니라
[Citation Style Language 공식 저장소](https://github.com/citation-style-language/styles)에서
가져온 것입니다.

각 파일은 **Creative Commons Attribution-ShareAlike 3.0** 라이선스를 따르며,
원 저작자 표기는 각 파일 안의 `<info>` → `<author>`, `<contributor>` 요소에 있습니다.
라이선스 조항은 각 파일의 `<rights>` 요소에 명시돼 있습니다.

- 라이선스 전문: https://creativecommons.org/licenses/by-sa/3.0/
- 원본 저장소: https://github.com/citation-style-language/styles

플러그인 본체의 MIT 라이선스는 이 파일들에 적용되지 않습니다.

## 국내 학회 스타일 (12개)

독립 스타일:

- journal-of-korean-neurosurgical-society
- journal-of-the-korean-society-of-civil-engineers
- korean-journal-of-anesthesiology
- korean-journal-of-radiology
- the-korean-journal-of-gastroenterology
- the-korean-journal-of-internal-medicine
- the-korean-journal-of-mycology

종속 스타일 (부모 스타일의 서식을 그대로 쓰고 이름만 다릅니다):

- journal-of-korean-medical-science → nlm-citation-sequence
- journal-of-the-korean-society-for-applied-biological-chemistry → springer-basic-author-date
- journal-of-the-korean-statistical-society → apa
- korean-social-science-journal → springer-socpsych-author-date
- the-korean-journal-of-pathology → nlm-citation-sequence-superscript

## 부모 스타일 (3개)

위 종속 스타일이 참조하는 스타일 중 Zotero에 기본 포함되지 않은 것들입니다.
이것이 없으면 종속 스타일 설치가 실패합니다.

- nlm-citation-sequence-superscript
- springer-basic-author-date
- springer-socpsych-author-date

`nlm-citation-sequence` 와 `apa` 는 Zotero가 기본 제공하므로 번들하지 않습니다.

## 갱신 방법

원본 저장소가 스타일을 고치면 이 사본은 낡습니다. 갱신하려면:

```bash
BASE="https://raw.githubusercontent.com/citation-style-language/styles/master"
curl -s "$BASE/korean-journal-of-radiology.csl" -o styles/korean-journal-of-radiology.csl
```

종속 스타일은 `$BASE/dependent/` 아래에 있습니다.
