/*
	This is a persistent background page, not an event page because we need to
	hold sensitive global state in RAM only, not persisted to storage.
*/

//The last verification image number which was shown to the user
var gLastVerimg = -1;

function onMessage(msg, sender, sendResponse) {
	//TODO: check sender for security?
	switch (msg.type) {
		case 'background_getLastVerimg':
			sendResponse(gLastVerimg);
			break;
		case 'background_setLastVerimg':
			if (typeof msg.verimg == 'number')
				gLastVerimg = msg.verimg;
			//no response required
			break;
	}
}

function init() {
	chrome.runtime.onMessage.addListener(onMessage);
}

init();
