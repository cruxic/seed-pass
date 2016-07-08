//This file defines the high-level flow of the plugin.  It is 
// intended to be browser agnostic and purely declarative.

var SEEDPASS_FLOW = {
	
	//When the pluging icon is clicked
	Event_ToolbarClick: {
		Decide_IsSetup: {
			
		
		}			
	},
	//HotKey (Ctrl+P) does the same as Event_ToolbarClick
	Event_Hotkey = this.Event_ToolbarClick;


}

function SEEDPASS_FLOW(state) {
	if (state.startEvent == 'TOOLBAR_CLICK' || state.startEvent == 'HOTKEY') {
		return doTOOLBAR_CLICK(state);
	}
}

function doTOOLBAR_CLICK(state) {
	if (state.isSeedSetup()) {
		
	}
	else {
		switch (state.prompt("PleaseImportOrCreate")) {
			case "IMPORT":
				break;
			case "CREATE":
				doCREATE(state);
				state.done();
				break;
			case "LEARN_MORE":
				state.openBrowserTab("https://cruxic.github.io/seedpass/LEARN_MORE/");
				state.done();
				break;
			default:
				state.die();
		}
		
	}
}

function doCREATE(state) {
	//do all this in a full size browser window instead of the popup
	state.switchToBrowserTab("doCREATE");
	
	state.prompt("CreateMustBeDoneOnASecureComputer");
		
	state.prompt("EnterSeedName");
	var seedName = state.get("EnterSeedName");
	
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
