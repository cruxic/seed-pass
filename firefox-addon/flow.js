//This file defines the high-level flow of the plugin.  It is 
// intended to be browser agnostic.

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
	state.switchToPrivateWindow();
	
	state.prompt("AreYouOnASecureComputer");
		
	var formData = state.prompt("EnterSeedName");
	var seedName = formData['SeedName'];
	console.log('seed name ' + seedName);
	
	state.prompt("CreateSeedPassword");
	var seedPassword = state.get("CreateSeedPassword");
		
	state.prompt("ScribbleNoise");				
	var scribbleNoise = state.get("ScribbleNoise");
	
	var seed = state.get("createdSeed", function() {
		return createSeed(scribbleNoise);
	});		
}

function createSeed(scribbleNoise) {

}

function isSeedSetup(state) {
	return false;	
}
