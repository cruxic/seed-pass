
//The text or password field which was selected then the extension was invoked.
var gSelectedField = null;
//the most recent password that was last successfully inserted
var gLastInsertedPassword = '';

function getFocusedTextInput() {
	var elm = document.activeElement;
	var types = ['text', 'password'];
	if (elm && elm.nodeName.toLowerCase() === 'input' &&
		types.indexOf(elm.getAttribute('type')) != -1)
		return elm;
	else
		return null;
}

/*function onMessage(msg, sender, sendResponse) {
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
}*/

self.port.on("findFocusedField", function() {
	gSelectedField = getFocusedTextInput();

	self.port.emit("findFocusedField_result", {
		hasFocusedInput: gSelectedField !== null,
		scheme: document.location.protocol,
		hostname: document.location.hostname,
		isRepeat: gLastInsertedPassword ? true : false
	});
});

self.port.on("injectPassword", function(password) {
	if (gSelectedField) {
		gSelectedField.value = password;
		gLastInsertedPassword = password;
	}
	else
		console.log("injectPassword: no selected field!");
});

self.port.on("repeatPassword", function(password) {
	if (gSelectedField && gLastInsertedPassword) {
		gSelectedField.value = gLastInsertedPassword;
	}
	else
		console.log("repeatPassword: nothing to repeat!");
});
