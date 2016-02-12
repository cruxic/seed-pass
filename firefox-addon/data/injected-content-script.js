
//The text or password field which was selected then the extension was invoked.
var gSelectedField = null;
//the most recent password that was last successfully inserted
var gLastInsertedPassword = '';

function getFocusedPasswordInput() {
	var elm = document.activeElement;
	console.log(elm);
	console.log(elm.nodeName);
	console.log(elm.getAttribute('type'));
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
	console.log("here in findFocusedField");
	gSelectedField = getFocusedPasswordInput();
	
	self.port.emit("findFocusedField_result", {
		hasFocusedPasswordInput: gSelectedField !== null,
		hostname: document.location.hostname,
		repeat: gLastInsertedPassword ? true : false
	});
});
