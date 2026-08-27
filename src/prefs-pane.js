/**
 * 환경설정 탭의 동작. 플러그인 본체는 부트스트랩 샌드박스에 있어서
 * 이 창에서 직접 보이지 않으므로 Zotero.HangulCite 로 접근한다.
 */
var HangulCitePrefs = {
	init() {
		this.status = document.getElementById('hangul-cite-styles-status');
		this.button = document.getElementById('hangul-cite-install-styles');

		this.button.addEventListener('command', () => this.installStyles());
		this.refresh();
	},

	get plugin() {
		return Zotero.HangulCite;
	},

	refresh() {
		if (!this.plugin) {
			this.status.value = '플러그인을 찾을 수 없습니다. Zotero를 재시작해 주세요.';
			this.button.disabled = true;
			return;
		}

		const installed = this.plugin.countInstalledStyles();
		const total = this.plugin.KOREAN_STYLES.length;

		this.status.value = `${total}개 중 ${installed}개 설치됨`;
		this.button.disabled = installed === total;
	},

	async installStyles() {
		this.button.disabled = true;
		this.status.value = '설치 중...';

		try {
			const result = await this.plugin.installBundledStyles();
			this.refresh();

			if (result.failed.length) {
				this.status.value += ` · ${result.failed.length}개 실패 (디버그 출력 참고)`;
				this.button.disabled = false;
			}
		}
		catch (e) {
			Zotero.logError(e);
			this.status.value = '오류가 발생했습니다: ' + e.message;
			this.button.disabled = false;
		}
	}
};
