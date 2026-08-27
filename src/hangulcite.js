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
	 * Zotero 환경설정의 빠른 복사 스타일을 그대로 따른다.
	 * 사용자가 한국 학회 양식을 설정해 두었다면 그것이 쓰인다.
	 */
	getStyle() {
		const setting = Zotero.Prefs.get('export.quickCopy.setting') || '';
		const match = /^bibliography(?:\/[^=]*)?=(.+)$/.exec(setting);
		const styleID = match ? match[1] : this.FALLBACK_STYLE;
		return Zotero.Styles.get(styleID) || Zotero.Styles.get(this.FALLBACK_STYLE);
	},

	format(items, style, mode) {
		const locale = Zotero.Prefs.get('export.quickCopy.locale') || Zotero.locale;
		const engine = style.getCiteProc(locale, 'text');
		try {
			engine.updateItems(items.map(item => item.id));

			if (mode === 'bibliography') {
				return Zotero.Cite.makeFormattedBibliography(engine, 'text');
			}
			return engine.previewCitationCluster(
				{
					citationItems: items.map(item => ({ id: item.id })),
					properties: {}
				},
				[], [], 'text'
			);
		}
		finally {
			engine.free();
		}
	},

	copyToClipboard(window, mode) {
		try {
			const items = window.ZoteroPane.getSelectedItems()
				.filter(item => item.isRegularItem());

			if (!items.length) {
				this.notify(window, '선택된 항목이 없습니다.');
				return;
			}

			const style = this.getStyle();
			if (!style) {
				this.notify(window, '인용 스타일을 찾을 수 없습니다.');
				return;
			}

			const text = (this.format(items, style, mode) || '').trim();
			if (!text) {
				this.notify(window, '생성된 내용이 없습니다.');
				return;
			}

			Zotero.Utilities.Internal.copyTextToClipboard(text);

			const label = mode === 'bibliography' ? '참고문헌' : '본문 인용';
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
