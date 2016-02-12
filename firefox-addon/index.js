var data = require("sdk/self").data;
var tabs = require("sdk/tabs");
var hotkeys = require("sdk/hotkeys");

var showHotKey = hotkeys.Hotkey({
  combo: "alt-p",
  onPress: handleClick
});

// Construct a panel, loading its content from the "text-entry.html"
// file in the "data" directory, and loading the "get-text.js" script
// into it.
var text_entry = require("sdk/panel").Panel({
  contentURL: data.url("text-entry.html"),
  contentScriptFile: data.url("get-text.js")
});

// Create a button
require("sdk/ui/button/action").ActionButton({
  id: "show-panel",
  label: "Show Panel",
  icon: {
    "16": "./toolbar16.png",
    "32": "./toolbar32.png",
    "64": "./toolbar64.png"
  },
  onClick: handleClick
});

// Show the panel when the user clicks the button.
function handleClick(state) {
  text_entry.show();
}

// When the panel is displayed it generated an event called
// "show": we will listen for that event and when it happens,
// send our own "show" event to the panel's script, so the
// script can prepare the panel for display.
text_entry.on("show", function() {
  text_entry.port.emit("show");
});

// Listen for messages called "text-entered" coming from
// the content script. The message payload is the text the user
// entered.
// In this implementation we'll just log the text to the console.
text_entry.port.on("text-entered", function (text) {
  console.log(text);
  //text_entry.hide();
  
  var worker = tabs.activeTab.attach({
      contentScriptFile: data.url("injected-content-script.js")
    });
    
	worker.port.on("findFocusedField_result", function(obj) {
		console.log(JSON.stringify(obj));	
	});
    
    worker.port.emit("findFocusedField", null);
});
