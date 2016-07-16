//This file defines the high-level flow of the plugin.  It is 
// intended to be browser agnostic.
var sha256 = require('sha256');

module.exports = function(state) {
	if (state.startEvent == 'TOOLBAR_CLICK' || state.startEvent == 'HOTKEY') {
		return doTOOLBAR_CLICK(state);
	}
}

function doTOOLBAR_CLICK(state) {
	if (isSeedSetup(state)) {
		
	}
	else {
		var result = state.prompt("PleaseImportOrCreate");
		switch (result) {
			case "IMPORT":
				break;
			case "CREATE":
				doCREATE(state);
				state.done();
				break;
			case "OVERVIEW":
				state.openBrowserTab("https://cruxic.github.io/seedpass/QUICK_OVERVIEW/");
				state.done();
				break;
			default:
				state.die(result);
		}
		
	}
}

function doCREATE(state) {
	//do all this in a full size browser window instead of the popup
	/*state.switchToPrivateWindow();
	
	state.prompt("AreYouOnASecureComputer");
		
	var formData = state.prompt("EnterSeedName");
	var seedName = formData['SeedName'];
	console.log('seed name ' + seedName);
	
	var passwordAndHint = state.prompt("CreateSeedPassword", null, validate_CreateSeedPassword);		
	*/
	var scribbleNoise = state.prompt("ScribbleNoise");  //an large array of integers
	
	var seed = state.get("createdSeed", function() {
		return createSeed(digestScribbleNoise(state, scribbleNoise));
	});		
}

function validate_CreateSeedPassword(state, formData) {
	while (true)
	{
		if (formData.pass1.length < 8)
			return "Password must be at least 8 characters.";
		else if (formData.pass1 != formData.pass2)
			return "Passwords do not match.";
		else
			return true;
	}
}

function digestScribbleNoise(state, integers) {
	//sanity
	if (integers.length < 100) {
		throw 'Scribble noise too short';			
	}
	
	//sanity
	var i;
	for (i = 0; i < integers.length; i++) {
		if (typeof(integers[i]) != 'number')
			throw 'Scribble noise at index ' + i + ' is not a number!';	
	}

	//feed each integer to sha256 as a 32bit integer
	var input = new sha256.InputWords(integers, integers.length * 4);
	return sha256.sha256(input);
}

function createSeed(scribbleDigestWords) {
	console.log(sha256.words2hex(scribbleDigestWords));
}

function isSeedSetup(state) {
	return false;	
}
