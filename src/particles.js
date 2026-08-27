/**
 * 한국어 CSL 로케일은 앞 단어의 받침을 판별하지 못해 "와/과", "은/는" 처럼
 * 두 조사를 슬래시로 이어 출력하고 뒤에 공백도 넣지 않는다.
 * 실제 논문에 그대로 쓸 수 없으므로 앞 글자를 보고 알맞은 쪽만 남긴다.
 *
 *   Yi Yang와/과Yueting Zhuang  ->  Yi Yang과 Yueting Zhuang
 *
 * 한글 음절은 코드포인트에서 받침을 바로 계산할 수 있다. 로마자와 숫자는
 * 한국어 독음을 기준으로 근사하므로 완벽하지 않다. 자세한 한계는 README 참고.
 */
HangulCiteParticles = {
	HANGUL_FIRST: 0xAC00,
	HANGUL_LAST: 0xD7A3,
	JONGSEONG_COUNT: 28,
	JONGSEONG_RIEUL: 8,

	// 로마자를 한국어로 읽었을 때 받침이 남지 않는 끝소리
	OPEN_LETTERS: 'aeiouwyh',

	// 숫자 독음의 받침: 0 영, 1 일, 2 이, 3 삼, 4 사, 5 오, 6 육, 7 칠, 8 팔, 9 구
	DIGIT_FINAL: {
		'0': 'other', '1': 'rieul', '2': null, '3': 'other', '4': null,
		'5': null, '6': 'other', '7': 'rieul', '8': 'rieul', '9': null
	},

	// rieulTakesShort: ㄹ 받침 뒤에서는 '으로'가 아니라 '로'를 쓴다
	RULES: [
		{ forms: ['와/과', '과/와'], withFinal: '과', withoutFinal: '와' },
		{ forms: ['은/는', '는/은'], withFinal: '은', withoutFinal: '는' },
		{ forms: ['이/가', '가/이'], withFinal: '이', withoutFinal: '가' },
		{ forms: ['을/를', '를/을'], withFinal: '을', withoutFinal: '를' },
		{ forms: ['으로/로', '로/으로'], withFinal: '으로', withoutFinal: '로', rieulTakesShort: true }
	],

	// 조사 뒤에 이 문자가 오면 공백을 넣지 않는다
	NO_SPACE_AFTER: /[\s.,;:)\]}」』”’]/,

	/**
	 * 글자의 받침 종류를 판별한다.
	 * @returns {'rieul'|'other'|null} null 이면 받침 없음 또는 판별 불가
	 */
	finalConsonant(ch) {
		if (!ch) return null;

		const code = ch.charCodeAt(0);
		if (code >= this.HANGUL_FIRST && code <= this.HANGUL_LAST) {
			const jongseong = (code - this.HANGUL_FIRST) % this.JONGSEONG_COUNT;
			if (jongseong === 0) return null;
			return jongseong === this.JONGSEONG_RIEUL ? 'rieul' : 'other';
		}

		if (ch >= '0' && ch <= '9') return this.DIGIT_FINAL[ch];

		if (/[a-z]/i.test(ch)) {
			const letter = ch.toLowerCase();
			if (this.OPEN_LETTERS.includes(letter)) return null;
			return letter === 'l' ? 'rieul' : 'other';
		}

		return null;
	},

	/**
	 * 조사 바로 앞의 의미 있는 글자를 찾는다.
	 * 따옴표나 괄호는 건너뛰고, HTML 태그는 통째로 뛰어넘는다.
	 */
	precedingChar(text, index) {
		let i = index - 1;
		while (i >= 0) {
			const ch = text[i];

			if (ch === '>') {
				const open = text.lastIndexOf('<', i);
				if (open === -1) return null;
				i = open - 1;
				continue;
			}
			if (/\s/.test(ch)) return null;
			if (/[\p{L}\p{N}]/u.test(ch)) return ch;
			i--;
		}
		return null;
	},

	pick(rule, final) {
		if (final === null) return rule.withoutFinal;
		if (final === 'rieul' && rule.rieulTakesShort) return rule.withoutFinal;
		return rule.withFinal;
	},

	applyRule(text, form, rule) {
		let result = '';
		let cursor = 0;

		for (;;) {
			const at = text.indexOf(form, cursor);
			if (at === -1) break;

			const final = this.finalConsonant(this.precedingChar(text, at));
			result += text.slice(cursor, at) + this.pick(rule, final);
			cursor = at + form.length;

			const next = text[cursor];
			if (next && !this.NO_SPACE_AFTER.test(next)) {
				result += ' ';
			}
		}

		return result + text.slice(cursor);
	},

	/** 평문과 HTML 모두에 적용할 수 있다. */
	fix(text) {
		if (!text) return text;

		let result = text;
		for (const rule of this.RULES) {
			for (const form of rule.forms) {
				result = this.applyRule(result, form, rule);
			}
		}
		return result;
	}
};
