HangulCite = {
	id: null,
	version: null,
	rootURI: null,
	initialized: false,
	addedElementIDs: [],

	FALLBACK_STYLE: 'http://www.zotero.org/styles/apa',

	init({ id, version, rootURI }) {
		if (this.initialized) return;
		this.id = id;
		this.version = version;
		this.rootURI = rootURI;
		this.initialized = true;
	},

	log(msg) {
		Zotero.debug('Hangul Cite: ' + msg);
	},

	// --- UI ---------------------------------------------------------------

	addToAllWindows() {
		for (const win of Zotero.getMainWindows()) {
			if (win.ZoteroPane) this.addToWindow(win);
		}
	},

	removeFromAllWindows() {
		for (const win of Zotero.getMainWindows()) {
			if (win.ZoteroPane) this.removeFromWindow(win);
		}
	},

	addToWindow(window) {
		const doc = window.document;
		const itemMenu = doc.getElementById('zotero-itemmenu');
		if (!itemMenu || doc.getElementById('hangul-cite-menu')) return;

		const separator = doc.createXULElement('menuseparator');
		separator.id = 'hangul-cite-separator';
		itemMenu.appendChild(separator);
		this.trackElement(separator);

		const menu = doc.createXULElement('menu');
		menu.id = 'hangul-cite-menu';
		menu.setAttribute('label', '한글 인용');

		const popup = doc.createXULElement('menupopup');
		menu.appendChild(popup);

		this.addMenuItem(doc, popup, 'hangul-cite-intext', '본문 인용 복사',
			() => this.copyToClipboard(window, 'citation'));
		this.addMenuItem(doc, popup, 'hangul-cite-bib', '참고문헌 복사',
			() => this.copyToClipboard(window, 'bibliography'));

		itemMenu.appendChild(menu);
		this.trackElement(menu);

		this.log('menu installed (copyItemsToClipboard: '
			+ (window.Zotero_File_Interface?.copyItemsToClipboard ? 'ok' : 'MISSING') + ')');
	},

	addMenuItem(doc, popup, id, label, onCommand) {
		const item = doc.createXULElement('menuitem');
		item.id = id;
		item.setAttribute('label', label);
		item.addEventListener('command', onCommand);
		popup.appendChild(item);
	},

	trackElement(el) {
		if (!this.addedElementIDs.includes(el.id)) {
			this.addedElementIDs.push(el.id);
		}
	},

	removeFromWindow(window) {
		const doc = window.document;
		for (const id of this.addedElementIDs) {
			doc.getElementById(id)?.remove();
		}
	},

	// --- Citation ---------------------------------------------------------

	/**
	 * 인용 스타일은 Zotero 환경설정의 빠른 복사 설정을 그대로 따른다.
	 * 사용자가 한국 학회 양식을 지정해 두었다면 그것이 쓰인다.
	 */
	getStyle() {
		const setting = Zotero.Prefs.get('export.quickCopy.setting') || '';
		const match = /^bibliography(?:\/[^=]*)?=(.+)$/.exec(setting);
		const styleID = match ? match[1] : this.FALLBACK_STYLE;
		return Zotero.Styles.get(styleID)
			? styleID
			: (Zotero.Styles.get(this.FALLBACK_STYLE) ? this.FALLBACK_STYLE : null);
	},

	copyToClipboard(window, mode) {
		try {
			const items = window.ZoteroPane.getSelectedItems()
				.filter(item => item.isRegularItem());

			if (!items.length) {
				this.notify(window, '선택된 항목이 없습니다.');
				return;
			}

			const styleID = this.getStyle();
			if (!styleID) {
				this.notify(window, '인용 스타일을 찾을 수 없습니다.');
				return;
			}

			if (!window.Zotero_File_Interface?.copyItemsToClipboard) {
				this.notify(window, '이 Zotero 버전에서는 클립보드 복사를 지원하지 않습니다.');
				return;
			}

			// Zotero 자체 구현을 그대로 호출한다. text/html 과 text/plain 을 함께
			// 클립보드에 올리므로, 한글에 붙여넣을 때 학술지명 이탤릭 같은
			// 서식이 그대로 유지된다.
			const locale = Zotero.Prefs.get('export.quickCopy.locale') || Zotero.locale;
			window.Zotero_File_Interface.copyItemsToClipboard(
				items, styleID, locale, false, mode === 'citation');

			const label = mode === 'citation' ? '본문 인용' : '참고문헌';
			const style = Zotero.Styles.get(styleID);
			this.notify(window, `${label} ${items.length}개 복사됨\n${style.title}`);
		}
		catch (e) {
			this.log(e);
			this.notify(window, '오류가 발생했습니다: ' + e.message);
		}
	},

	notify(window, message) {
		const pw = new Zotero.ProgressWindow({ window });
		pw.changeHeadline('한글 인용');
		pw.addDescription(message);
		pw.show();
		pw.startCloseTimer(3000);
	}
};
