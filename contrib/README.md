# CSL 저장소 제출 준비물

여기 있는 파일은 플러그인에 번들되지 않습니다.
[CSL 공식 저장소](https://github.com/citation-style-language/styles)에 제출하려고
만든 것으로, 아직 PR 을 올리지 않았습니다.

## journal-of-kiise.csl

한국정보과학회 정보과학회논문지(Journal of KIISE) 투고규정을 구현한 스타일입니다.

```
[1] K. Park, H. Hwang, C. Lee, and S. Min, "Analysis of Delay-Bandwidth
    Normalization Characteristic in Decay Usage Algorithm of UNIX,"
    Journal of KIISE, Vol. 34, No. 10, pp. 511-520, Oct. 2007.
```

번호식 인용, 저자 이니셜, 제목 큰따옴표, `Vol./No./pp.`, 월 약자.
규정 출처는 스타일의 `documentation` 링크에 있습니다.

**남은 일**: 실제 출력을 규정 예시와 대조하는 검증. 그 다음 PR.

### 규정과 다른 점

- 규정은 한국어 논문 참고문헌 끝에 `(in Korean)` 을 붙이라고 하지만 넣지
  않았습니다. CSL 1.0.2 는 항목의 `language` **값**을 조건으로 쓸 수 없습니다.
  변수의 존재 여부만 볼 수 있어서 "한국어일 때만" 을 표현할 방법이 없습니다.
- 학술대회 논문에 `Proc. of` 를 붙이지 않았습니다. 이미 회의록 제목에
  `Proceedings of ...` 가 들어 있는 경우가 많아 중복됩니다.

## 왜 한국어 저자-연도 스타일은 제출하지 않았나

`styles/korean-author-date.csl` 은 국내 학술 관행을 일반화한 것이라
저장소 수록 기준에 맞지 않습니다.

> Styles should be based on an official style guide (and link to the style
> guide in online or printed form).
>
> 거부 대상: styles for personal use, or for internal use within small organizations

가리킬 공식 규정 문서가 없어 `documentation` 링크를 채울 수 없습니다.
저장소 README 도 이런 경우 직접 배포하라고 안내하며, 이 플러그인이 그렇게
하고 있습니다.

## 검증 방법

CSL 공식 스키마는 RelaxNG 압축 문법(`.rnc`)이라 변환이 필요합니다.

```bash
pip install lxml rnc2rng
BASE=https://raw.githubusercontent.com/citation-style-language/schema/master/schemas/styles
for f in csl csl-categories csl-choose csl-terms csl-types csl-variables; do
  curl -sO "$BASE/$f.rnc"
done
python -c "import rnc2rng; open('csl.rng','w',encoding='utf-8').write(rnc2rng.dumps(rnc2rng.load('csl.rnc')))"
python -c "
from lxml import etree
rng = etree.RelaxNG(etree.parse('csl.rng'))
print(rng.validate(etree.parse('journal-of-kiise.csl')))"
```

저장소는 여기에 더해 `csl-repository.rnc` 로 더 엄격하게 봅니다. 주요 제약:

- `<info>` 자식 요소의 **순서가 고정**입니다
- `<link rel="documentation">` 이 **필수**입니다
- `<rights>` 는 라이선스 URL 과 본문 문자열이 정확히 일치해야 합니다
- 들여쓰기는 공백 2칸

이 파일은 위 항목을 모두 통과한 상태입니다.
