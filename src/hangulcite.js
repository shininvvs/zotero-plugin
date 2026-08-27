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
	 * 값이 비면 일부 스타일이 "In." 만 남기는 필드. 둘 다 publicationTitle 을
	 * 베이스로 해서 CSL 의 container-title 로 들어간다.
	 * 라벨은 Zotero 한국어 화면에 실제로 표시되는 이름을 쓴다.
	 */
	CONTAINER_FIELDS: {
		conferencePaper: { field: 'proceedingsTitle', label: '의사록' },
		bookSection: { field: 'bookTitle', label: '책 제목' }
	},

	/**
	 * 컨테이너 필드가 빈 항목이 있는지 본다.
	 *
	 * 출력에서 빈 "In." 을 지우지 않고 알리기만 하는 이유는, 정상적으로 쓰인
	 * "In" 과 구분할 수 없기 때문이다. 제목이 In 으로 끝나거나 성이 In 인
	 * 저자가 있으면 멀쩡한 인용을 망가뜨린다. 고칠 곳은 항목 쪽이다.
	 *
	 * @returns {string[]} 비어 있는 필드의 라벨 목록 (중복 제거)
	 */
	findEmptyContainers(items) {
		const empty = items
			.map(item => [item, this.CONTAINER_FIELDS[item.itemType]])
			.filter(([item, spec]) => spec && !item.getField(spec.field))
			.map(([, spec]) => spec.label);

		return [...new Set(empty)];
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

	/**
	 * 빈 필드가 남긴 잔여 공백을 정리한다. 항목에 값이 없으면 CSL 이 구두점만
	 * 남겨서 "Visualization ." 처럼 마침표 앞에 공백이 생긴다.
	 *
	 * 내용은 지우지 않는다. 뒤가 빈 "In." 같은 것은 그대로 두는데, 정상적으로
	 * 쓰인 경우와 구분할 수 없기 때문이다. 그건 항목의 빠진 필드를 채워야 한다.
	 */
	tidy(text) {
		if (!text) return text;

		// 태그 밖에만 적용한다. 속성값 안의 공백을 건드리면 링크가 깨질 수 있다.
		const cleaned = text.replace(/(<[^>]*>)|([^<]+)/g, (match, tag, chunk) => {
			if (tag) return tag;
			return chunk
				.replace(/[ \t]+([.,;:)\]])/g, '$1')
				.replace(/[ \t]{2,}/g, ' ')
				.replace(/[ \t]+\n/g, '\n');
		});

		// 문자열 끝의 공백은 조각이 아니라 전체를 기준으로 턴다. 조각 단위로 하면
		// 조각의 끝이 곧 태그 앞이라 "Available from: <a>" 의 공백까지 지워진다.
		return cleaned.replace(/[ \t]+$/, '');
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

			text = this.tidy(text);
			html = this.tidy(html);

			this.writeClipboard(html, text);

			const label = mode === 'citation' ? '본문 인용' : '참고문헌';
			const emptyContainers = this.findEmptyContainers(items);

			this.notify(window, `${label} ${items.length}개 복사됨\n${style.title}`
				+ (corrected ? '\n조사 교정됨' : '')
				+ (emptyContainers.length
					? `\n⚠ ${emptyContainers.join(', ')}이(가) 비어 있습니다`
					+ '\n   스타일에 따라 "In."만 나옵니다'
					: ''));
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

	/**
	 * 오른쪽 아래 알림.
	 *
	 * 성공 알림은 3초 뒤 사라진다. 경고는 닫지 않고 클릭할 때까지 띄워 둔다.
	 * 놓치면 알릴 이유가 없어지기 때문이다. 클릭하면 닫히므로 확인 버튼처럼
	 * 쓸 수 있고, 모달과 달리 다른 작업을 막지 않는다. 여러 항목을 연달아
	 * 복사할 때 대화상자가 매번 앞을 가로막으면 쓰기 어려워진다.
	 */
	notify(window, message) {
		const isWarning = message.includes('⚠');

		const pw = new Zotero.ProgressWindow({ window });
		pw.changeHeadline('한글 인용');

		// 알림 API 에는 버튼을 넣을 수단이 없다(옵션은 window 와 closeOnClick 뿐).
		// 창 전체가 클릭 영역이므로 그 사실을 글로 알린다.
		pw.addDescription(isWarning
			? message + '\n\n▸ 아무 곳이나 클릭하면 닫힙니다'
			: message);

		pw.show();

		if (!isWarning) {
			pw.startCloseTimer(3000);
		}
	}
};
