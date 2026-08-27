HangulCite = {
	id: null,
	version: null,
	rootURI: null,
	initialized: false,
	addedElementIDs: [],

	FALLBACK_STYLE: 'http://www.zotero.org/styles/apa',
	STYLE_ID_PREFIX: 'http://www.zotero.org/styles/',
	PREF_FIX_PARTICLES: 'hangulCite.fixParticles',

	/**
	 * 종속 스타일이 참조하는 부모 중 Zotero 기본 제공에 없는 것들.
	 * 부모가 먼저 설치돼 있어야 종속 스타일 설치가 성공한다.
	 */
	PARENT_STYLES: [
		'nlm-citation-sequence-superscript',
		'springer-basic-author-date',
		'springer-socpsych-author-date'
	],

	KOREAN_STYLES: [
		'journal-of-korean-neurosurgical-society',
		'journal-of-the-korean-society-of-civil-engineers',
		'korean-journal-of-anesthesiology',
		'korean-journal-of-radiology',
		'the-korean-journal-of-gastroenterology',
		'the-korean-journal-of-internal-medicine',
		'the-korean-journal-of-mycology',
		'journal-of-korean-medical-science',
		'journal-of-the-korean-society-for-applied-biological-chemistry',
		'journal-of-the-korean-statistical-society',
		'korean-social-science-journal',
		'the-korean-journal-of-pathology'
	],

	init({ id, version, rootURI }) {
		if (this.initialized) return;
		this.id = id;
		this.version = version;
		this.rootURI = rootURI;
		this.initialized = true;

		// 설정 탭 스크립트에서 호출할 수 있도록 노출한다
		Zotero.HangulCite = this;
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

		this.addMenuItem(doc, popup, 'hangul-cite-bib', '참고문헌 복사',
			() => this.copyCitation(window, { mode: 'bibliography' }));
		this.addMenuItem(doc, popup, 'hangul-cite-intext', '본문 인용 복사',
			() => this.copyCitation(window, { mode: 'citation' }));

		popup.appendChild(doc.createXULElement('menuseparator'));
		this.addStyleMenu(doc, popup, window);

		popup.appendChild(doc.createXULElement('menuseparator'));
		this.addMenuItem(doc, popup, 'hangul-cite-links', '링크 복사',
			() => this.copyLinks(window));

		itemMenu.appendChild(menu);
		this.trackElement(menu);

		this.log('menu installed (particles: '
			+ (typeof HangulCiteParticles === 'object' ? 'ok' : 'MISSING') + ')');
	},

	addMenuItem(doc, popup, id, label, onCommand) {
		const item = doc.createXULElement('menuitem');
		item.id = id;
		item.setAttribute('label', label);
		item.addEventListener('command', onCommand);
		popup.appendChild(item);
		return item;
	},

	/**
	 * 설치된 스타일 목록을 하위 메뉴로 단다. 설정을 열지 않고
	 * 이번 한 번만 다른 양식으로 뽑고 싶을 때 쓴다.
	 * 사용자가 스타일을 추가할 수 있으므로 열 때마다 다시 채운다.
	 */
	addStyleMenu(doc, popup, window) {
		const menu = doc.createXULElement('menu');
		menu.id = 'hangul-cite-styles';
		menu.setAttribute('label', '다른 스타일로 참고문헌 복사');

		const stylePopup = doc.createXULElement('menupopup');
		stylePopup.addEventListener('popupshowing', () => {
			while (stylePopup.firstChild) stylePopup.firstChild.remove();

			const current = this.getStyleID();
			for (const style of Zotero.Styles.getVisible()) {
				const item = doc.createXULElement('menuitem');
				item.setAttribute('label', style.title);
				item.setAttribute('type', 'radio');
				if (style.styleID === current) item.setAttribute('checked', 'true');
				item.addEventListener('command', () => this.copyCitation(window, {
					mode: 'bibliography',
					styleID: style.styleID
				}));
				stylePopup.appendChild(item);
			}
		});

		menu.appendChild(stylePopup);
		popup.appendChild(menu);
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

	/** 인용 스타일은 Zotero 설정의 빠른 복사 설정을 그대로 따른다. */
	getStyleID() {
		const setting = Zotero.Prefs.get('export.quickCopy.setting') || '';
		const match = /^bibliography(?:\/[^=]*)?=(.+)$/.exec(setting);
		const styleID = match ? match[1] : this.FALLBACK_STYLE;
		return Zotero.Styles.get(styleID) ? styleID : this.FALLBACK_STYLE;
	},

	getSelectedItems(window) {
		return window.ZoteroPane.getSelectedItems().filter(item => item.isRegularItem());
	},

	/**
	 * HTML 과 평문을 함께 만든다. Zotero 자체 구현과 같은 방식으로,
	 * 엔진은 html 로 만들고 두 형식을 각각 뽑는다.
	 */
	format(items, style, mode) {
		const locale = Zotero.Prefs.get('export.quickCopy.locale') || Zotero.locale;
		const engine = style.getCiteProc(locale, 'html');
		try {
			engine.updateItems(items.map(item => item.id));

			if (mode === 'citation') {
				const citation = {
					citationItems: items.map(item => ({ id: item.id })),
					properties: {}
				};
				return {
					html: engine.previewCitationCluster(citation, [], [], 'html'),
					text: engine.previewCitationCluster(citation, [], [], 'text')
				};
			}

			return {
				html: Zotero.Cite.makeFormattedBibliographyOrCitationList(engine, items, 'html'),
				text: Zotero.Cite.makeFormattedBibliographyOrCitationList(engine, items, 'text')
			};
		}
		finally {
			engine.free();
		}
	},

	copyCitation(window, { mode, styleID }) {
		try {
			const items = this.getSelectedItems(window);
			if (!items.length) {
				this.notify(window, '선택된 항목이 없습니다.');
				return;
			}

			const style = Zotero.Styles.get(styleID || this.getStyleID());
			if (!style) {
				this.notify(window, '인용 스타일을 찾을 수 없습니다.');
				return;
			}

			let { html, text } = this.format(items, style, mode);
			if (!text || !text.trim()) {
				this.notify(window, '생성된 내용이 없습니다.');
				return;
			}

			let corrected = false;
			if (Zotero.Prefs.get(this.PREF_FIX_PARTICLES)) {
				const fixedText = HangulCiteParticles.fix(text);
				corrected = fixedText !== text;
				text = fixedText;
				html = HangulCiteParticles.fix(html);
			}

			this.writeClipboard(html, text);

			const label = mode === 'citation' ? '본문 인용' : '참고문헌';
			this.notify(window, `${label} ${items.length}개 복사됨\n${style.title}`
				+ (corrected ? '\n조사 교정됨' : ''));
		}
		catch (e) {
			this.log(e);
			this.notify(window, '오류가 발생했습니다: ' + e.message);
		}
	},

	/**
	 * text/html 과 text/plain 을 함께 올린다. 두 형식을 모두 넣어야
	 * 붙여넣는 곳에 따라 서식이 살거나 평문으로 떨어진다.
	 */
	writeClipboard(html, text) {
		const transferable = Components.classes['@mozilla.org/widget/transferable;1']
			.createInstance(Components.interfaces.nsITransferable);
		const clipboard = Components.classes['@mozilla.org/widget/clipboard;1']
			.getService(Components.interfaces.nsIClipboard);

		const addFlavor = (flavor, value) => {
			const holder = Components.classes['@mozilla.org/supports-string;1']
				.createInstance(Components.interfaces.nsISupportsString);
			holder.data = value;
			transferable.addDataFlavor(flavor);
			transferable.setTransferData(flavor, holder, value.length * 2);
		};

		addFlavor('text/html', html);
		addFlavor('text/plain', text);

		clipboard.setData(transferable, null,
			Components.interfaces.nsIClipboard.kGlobalClipboard);
	},

	// --- Links ------------------------------------------------------------

	/** DOI 가 있으면 doi.org 링크로, 없으면 URL 필드를 쓴다. */
	copyLinks(window) {
		try {
			const items = this.getSelectedItems(window);
			if (!items.length) {
				this.notify(window, '선택된 항목이 없습니다.');
				return;
			}

			const links = items
				.map((item) => {
					const doi = item.getField('DOI');
					if (doi) return 'https://doi.org/' + doi;
					return item.getField('url') || null;
				})
				.filter(Boolean);

			if (!links.length) {
				this.notify(window, 'DOI나 URL이 있는 항목이 없습니다.');
				return;
			}

			Zotero.Utilities.Internal.copyTextToClipboard(links.join('\n'));

			const missing = items.length - links.length;
			this.notify(window, `링크 ${links.length}개 복사됨`
				+ (missing ? `\n${missing}개는 링크 없음` : ''));
		}
		catch (e) {
			this.log(e);
			this.notify(window, '오류가 발생했습니다: ' + e.message);
		}
	},

	// --- Bundled styles ---------------------------------------------------

	/** 번들된 국내 학회 스타일 중 이미 설치된 개수 */
	countInstalledStyles() {
		return this.KOREAN_STYLES
			.filter(name => !!Zotero.Styles.get(this.STYLE_ID_PREFIX + name))
			.length;
	},

	/**
	 * 번들 파일을 읽는다. 플러그인이 .xpi 안에 들어 있으면 rootURI 가 jar: 스킴이라
	 * XHR 기반 경로가 실패할 수 있어서 fetch 를 먼저 쓰고 안 되면 되돌아간다.
	 */
	async readBundledStyle(name) {
		const url = this.rootURI + 'styles/' + name + '.csl';
		try {
			const response = await fetch(url);
			if (!response.ok) throw new Error('HTTP ' + response.status);
			return await response.text();
		}
		catch (e) {
			this.log('fetch failed for ' + name + ', falling back: ' + e);
			return Zotero.File.getContentsFromURLAsync(url);
		}
	},

	/**
	 * 번들된 스타일을 설치한다. 이미 있는 것은 건너뛰므로 여러 번 눌러도 안전하다.
	 * 부모 스타일을 먼저 넣어야 종속 스타일이 부모를 찾을 수 있다.
	 */
	async installBundledStyles() {
		const result = { installed: 0, skipped: 0, failed: [] };

		for (const name of [...this.PARENT_STYLES, ...this.KOREAN_STYLES]) {
			if (Zotero.Styles.get(this.STYLE_ID_PREFIX + name)) {
				result.skipped++;
				continue;
			}

			try {
				const string = await this.readBundledStyle(name);
				await Zotero.Styles.install({ string }, name, true);
				result.installed++;
			}
			catch (e) {
				this.log('style install failed: ' + name + ' - ' + e);
				result.failed.push(name);
			}
		}

		this.log(`bundled styles: ${result.installed} installed, `
			+ `${result.skipped} skipped, ${result.failed.length} failed`);
		return result;
	},

	// --- Preferences pane -------------------------------------------------

	/**
	 * 설정 탭의 동작을 붙인다. 탭의 인라인 onload 는 설정 창 스코프에서
	 * 실행되므로, 거기서 닿을 수 있는 Zotero.HangulCite 를 통해 호출된다.
	 * @param {Element} root - 탭의 최상위 요소
	 */
	initPrefsPane(root) {
		const doc = root.ownerDocument;
		const button = doc.getElementById('hangul-cite-install-styles');
		const status = doc.getElementById('hangul-cite-styles-status');
		if (!button || !status) {
			this.log('prefs pane: elements not found');
			return;
		}

		const refresh = () => {
			const installed = this.countInstalledStyles();
			const total = this.KOREAN_STYLES.length;
			status.value = `${total}개 중 ${installed}개 설치됨`;
			button.disabled = installed === total;
		};

		button.addEventListener('command', async () => {
			button.disabled = true;
			status.value = '설치 중...';
			try {
				const result = await this.installBundledStyles();
				refresh();
				if (result.failed.length) {
					status.value += ` · ${result.failed.length}개 실패 (디버그 출력 참고)`;
					button.disabled = false;
				}
			}
			catch (e) {
				Zotero.logError(e);
				status.value = '오류가 발생했습니다: ' + e.message;
				button.disabled = false;
			}
		});

		refresh();
		this.log('prefs pane initialized');
	},

	notify(window, message) {
		const pw = new Zotero.ProgressWindow({ window });
		pw.changeHeadline('한글 인용');
		pw.addDescription(message);
		pw.show();
		pw.startCloseTimer(3000);
	}
};
