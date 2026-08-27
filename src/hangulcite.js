HangulCite = {
	id: null,
	version: null,
	rootURI: null,
	initialized: false,
	addedElementIDs: [],

	FALLBACK_STYLE: 'http://www.zotero.org/styles/apa',
	STYLE_ID_PREFIX: 'http://www.zotero.org/styles/',
	PREF_FIX_PARTICLES: 'hangulCite.fixParticles',

	get SHORTCUT_LABEL() {
		return Zotero.isMac ? '⇧⌘H' : 'Ctrl+Shift+H';
	},

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

		const bibItem = this.addMenuItem(doc, popup, 'hangul-cite-bib', '참고문헌 복사',
			() => this.copyCitation(window, { mode: 'bibliography' }));
		bibItem.setAttribute('acceltext', this.SHORTCUT_LABEL);

		this.addMenuItem(doc, popup, 'hangul-cite-intext', '본문 인용 복사',
			() => this.copyCitation(window, { mode: 'citation' }));

		popup.appendChild(doc.createXULElement('menuseparator'));
		this.addStyleMenu(doc, popup, window);

		popup.appendChild(doc.createXULElement('menuseparator'));
		this.addMenuItem(doc, popup, 'hangul-cite-links', '링크 복사',
			() => this.copyLinks(window));

		itemMenu.appendChild(menu);
		this.trackElement(menu);

		this.addShortcut(doc, window);

		this.log('menu installed (particles: '
			+ (typeof HangulCiteParticles === 'object' ? 'ok' : 'MISSING') + ')');
	},

	/**
	 * 참고문헌 복사에 단축키를 단다.
	 *
	 * Zotero 는 자기 단축키를 prefs 로 관리할 뿐 플러그인용 등록 API 가 없어서
	 * mainKeyset 에 직접 <key> 를 붙인다. accel+shift 조합에서 Zotero 가 이미
	 * 쓰는 글자(S N O L K A C Y R ` ;)를 피해 H 를 쓴다.
	 */
	addShortcut(doc, window) {
		const keyset = doc.getElementById('mainKeyset');
		if (!keyset || doc.getElementById('hangul-cite-key')) return;

		const key = doc.createXULElement('key');
		key.id = 'hangul-cite-key';
		key.setAttribute('key', 'H');
		key.setAttribute('modifiers', 'accel shift');
		key.addEventListener('command',
			() => this.copyCitation(window, { mode: 'bibliography' }));

		keyset.appendChild(key);
		this.trackElement(key);

		// Gecko 는 이미 만들어진 keyset 에 <key> 를 더해도 바로 듣지 않는다.
		// 같은 자리에 다시 넣어 다시 읽게 한다.
		keyset.parentNode.insertBefore(keyset, keyset.nextSibling);
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
		conferencePaper: {
			field: 'proceedingsTitle',
			label: '의사록',
			// OpenReview 나 arXiv 에서 가져오면 협의 명만 채워져 오는 일이 잦다.
			// 둘은 엄연히 다른 칸이라 자동으로 옮기지 않고 물어본다.
			fillFrom: { field: 'conferenceName', label: '협의 명' }
		},
		bookSection: { field: 'bookTitle', label: '책 제목' }
	},

	/** 유형과 무관하게 비면 인용이 불완전해지는 칸 */
	COMMON_FIELDS: [
		{ field: 'title', label: '제목' }
	],

	/**
	 * 비어 있어서 인용을 불완전하게 만드는 칸을 항목별로 모은다.
	 *
	 * 출력에서 빈 "In." 을 지우지 않고 알리기만 하는 이유는, 정상적으로 쓰인
	 * "In" 과 구분할 수 없기 때문이다. 제목이 In 으로 끝나거나 성이 In 인
	 * 저자가 있으면 멀쩡한 인용을 망가뜨린다. 고칠 곳은 항목 쪽이다.
	 *
	 * @returns {{title: string, empty: string[]}[]} 어느 항목의 어느 칸이 비었는지
	 */
	findEmptyFields(items) {
		return items
			.map((item) => {
				const container = this.CONTAINER_FIELDS[item.itemType];
				const specs = [container, ...this.COMMON_FIELDS].filter(Boolean);

				const empty = specs
					.filter(spec => !item.getField(spec.field))
					.map(spec => spec.label);

				// 저자는 getField 로 읽히지 않아 따로 본다
				if (!item.getCreators().length) {
					empty.push('저자');
				}

				if (!empty.length) return null;

				return {
					item,
					title: item.getField('title') || '(제목 없음)',
					empty,
					fill: this.findFillSource(item, container)
				};
			})
			.filter(Boolean);
	},

	/**
	 * 비어 있는 칸을 다른 칸의 값으로 채울 수 있는지 본다.
	 * 채울 수 있어도 뜻이 완전히 같지는 않으므로 결정은 사용자가 한다.
	 */
	findFillSource(item, container) {
		if (!container || !container.fillFrom) return null;
		if (item.getField(container.field)) return null;

		const value = item.getField(container.fillFrom.field);
		if (!value) return null;

		return {
			field: container.field,
			label: container.label,
			from: container.fillFrom.label,
			value
		};
	},

	truncate(text, limit = 70) {
		return text.length > limit ? text.slice(0, limit - 1) + '…' : text;
	},

	/**
	 * 어느 항목의 어느 칸이 비었는지 대화상자로 알린다.
	 *
	 * 알림으로 띄우면 놓치기 쉽고, 항목이 여럿일 때 무엇을 고쳐야 하는지
	 * 알 수 없다. 복사는 이미 끝난 뒤이므로 창을 막아도 잃는 것이 없다.
	 */
	warnEmptyFields(window, summary, entries) {
		const list = entries
			.map(({ title, empty, fill }) =>
				`• ${this.truncate(title, 60)}\n  빈 컬럼 : [${empty.join(', ')}]`
				+ (fill ? `\n  ${fill.from}에서 가져올 수 있음` : ''))
			.join('\n\n');

		const subject = entries.length > 1 ? '아래 항목들은' : '아래 항목은';
		const body = summary + '\n\n'
			+ `${subject} 인용이 불완전합니다.\n\n`
			+ list;

		const fillable = entries.filter(entry => entry.fill);

		// 채우기 버튼이 왜 떴는지 안 떴는지 나중에 따질 수 있게 남긴다
		this.log('empty fields: ' + JSON.stringify(entries.map(e => ({
			title: e.title.slice(0, 30),
			empty: e.empty,
			fillFrom: e.fill ? e.fill.from : null
		}))));

		if (!fillable.length) {
			Zotero.alert(window, '한글 인용', body);
			return;
		}

		const ps = Services.prompt;
		const flags = ps.BUTTON_POS_0 * ps.BUTTON_TITLE_IS_STRING
			+ ps.BUTTON_POS_1 * ps.BUTTON_TITLE_CANCEL;

		const labels = [...new Set(fillable.map(entry => entry.fill.label))].join(', ');
		const choice = ps.confirmEx(window, '한글 인용',
			`${body}\n\n${labels} 칸을 지금 채울까요?`,
			flags, '채우기', null, null, null, {});

		if (choice === 0) {
			this.fillFields(window, fillable).catch((e) => {
				this.log(e);
				this.notify(window, '채우지 못했습니다: ' + e.message);
			});
		}
	},

	/** 대화상자에서 동의한 칸을 실제로 채운다. */
	async fillFields(window, fillable) {
		for (const { item, fill } of fillable) {
			item.setField(fill.field, fill.value);
			await item.saveTx();
		}

		this.notify(window, `${fillable.length}개 항목을 채웠습니다`);
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
			const emptyFields = this.findEmptyFields(items);
			const summary = `${label} ${items.length}개 복사됨`;

			if (emptyFields.length) {
				// 대화상자에서는 문제와 할 일만 보여준다. 스타일 이름 같은 것은
				// 지금 필요한 정보가 아니라 읽는 데 방해가 된다.
				this.warnEmptyFields(window, summary, emptyFields);
			}
			else {
				this.notify(window, `${summary}\n${style.title}`
					+ (corrected ? '\n조사 교정됨' : ''));
			}
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
	 * 오른쪽 아래 알림. 3초 뒤 사라지고, 마우스를 올리면 그동안 멈춘다.
	 *
	 * 놓쳐도 되는 소식만 여기로 보낸다. 놓치면 안 되는 경고는 대화상자를 쓴다
	 * (warnEmptyFields). addDescription 은 부를 때마다 별도 블록을 만들므로,
	 * 한 덩어리에 줄바꿈으로 욱여넣지 않고 나눠 넣는다.
	 *
	 * @param {string|string[]} blocks - 각각 한 덩어리로 표시된다
	 */
	notify(window, blocks) {
		const parts = (Array.isArray(blocks) ? blocks : [blocks]).filter(Boolean);

		const pw = new Zotero.ProgressWindow({ window });
		pw.changeHeadline('한글 인용');

		for (const part of parts) {
			pw.addDescription(part);
		}

		pw.show();
		pw.startCloseTimer(3000);
	}
};
