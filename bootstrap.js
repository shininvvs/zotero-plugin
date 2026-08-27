var HangulCite;
var HangulCiteParticles;

function install() {}

function uninstall() {}

async function startup({ id, version, rootURI }) {
	await Zotero.initializationPromise;

	Services.scriptloader.loadSubScript(rootURI + 'src/particles.js');
	Services.scriptloader.loadSubScript(rootURI + 'src/hangulcite.js');

	HangulCite.init({ id, version, rootURI });
	HangulCite.addToAllWindows();

	await Zotero.PreferencePanes.register({
		pluginID: id,
		src: rootURI + 'prefs.xhtml',
		id: 'hangul-cite-prefs',
		label: '한글 인용'
	});
}

function shutdown() {
	if (!HangulCite) return;
	HangulCite.removeFromAllWindows();
	HangulCite = undefined;
	HangulCiteParticles = undefined;
}

function onMainWindowLoad({ window }) {
	HangulCite?.addToWindow(window);
}

function onMainWindowUnload({ window }) {
	HangulCite?.removeFromWindow(window);
}
