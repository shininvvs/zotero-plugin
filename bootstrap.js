var HangulCite;

function install() {}

function uninstall() {}

async function startup({ id, version, rootURI }) {
	await Zotero.initializationPromise;

	Services.scriptloader.loadSubScript(rootURI + 'src/hangulcite.js');
	HangulCite.init({ id, version, rootURI });
	HangulCite.addToAllWindows();
}

function shutdown() {
	if (!HangulCite) return;
	HangulCite.removeFromAllWindows();
	HangulCite = undefined;
}

function onMainWindowLoad({ window }) {
	HangulCite?.addToWindow(window);
}

function onMainWindowUnload({ window }) {
	HangulCite?.removeFromWindow(window);
}
