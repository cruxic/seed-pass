/*This is the JavaScript that is injected into the active page when the user invokes
the browserAction for the first time.
Remember that content scripts run in an isolated JavaScript context and thus there is no
risk of colliding with the JavaScript of the page itself.
*/

//The text or password field which was selected then the extension was invoked.
var gSelectedField = null;
//the most recent password that was last successfully inserted
var gLastInsertedPassword;
var gAlreadyInit;

function getFocusedPasswordInput() {
	var elm = document.activeElement;
	var types = ['text', 'password'];
	if (elm && elm.nodeName.toLowerCase() === 'input' &&
		types.indexOf(elm.getAttribute('type')) != -1)
		return elm;
	else
		return null;
}

function onMessage(msg, sender, sendResponse) {
    if (msg.type == 'passwordReady') {
		if (gSelectedField) {
			gSelectedField.value = msg.password;
			gLastInsertedPassword = msg.password;
		}
		msg.password = null;
    }
    else if (msg.type == 'repeatPassword') {
		if (gSelectedField && gLastInsertedPassword) {
			gSelectedField.value = gLastInsertedPassword;
		}
	}
}

function init() {
	//Prevent duplicate onMessage listeners
	if (!gAlreadyInit) {
		gAlreadyInit = true;
		//Listen for messages from the extension
		chrome.runtime.onMessage.addListener(onMessage);
	}

	gSelectedField = getFocusedPasswordInput();

	//Tell the extension if a password field is focused
	chrome.runtime.sendMessage(null, {
		type: 'contentScriptInjected',
		hasFocusedPasswordInput: gSelectedField !== null,
		hostname: document.location.hostname,
		repeat: gLastInsertedPassword ? true : false
	});
}

init();

