var data = require("sdk/self").data;
var tabs = require("sdk/tabs");
var hotkeys = require("sdk/hotkeys");
var panel = require("sdk/panel");
var action = require("sdk/ui/button/action");
var child_process = require("sdk/system/child_process");



var showHotKey = hotkeys.Hotkey({
	combo: "alt-p",
	onPress: showPanel
});


// Create a button
var actionButton = action.ActionButton({
	id: "show-panel",
	label: "Show Panel",
	icon: {
		"16": "./toolbar16.png",
		"32": "./toolbar32.png",
		"64": "./toolbar64.png"
	},
	onClick: showPanel
});

function showPanel() {
	var worker = tabs.activeTab.attach({
		contentScriptFile: data.url("injected-content-script.js")
	});
	
	worker.port.on("findFocusedField_result", function(obj) {
		console.log(JSON.stringify(obj));	
		showResult(obj);
	});
	
	worker.port.emit("findFocusedField", null);

}

function showResult(obj) {
	var p = panel.Panel({
		width: 640,
		height: 480,
		position: actionButton,
		contentURL: data.url("touch-prompt.html"),
		contentScriptFile: data.url("touch-prompt.js")
	});
	
	// When the panel is displayed it generated an event called
	// "show": we will listen for that event and when it happens,
	// send our own "show" event to the panel's script, so the
	// script can prepare the panel for display.
	p.on("show", function() {
		p.port.emit("show", obj);
	});
	
	p.show();	
	
	test_exec();
}

function test_exec() {
	var ls = child_process.spawn('/bin/ls', ['-lh', '/usr']);

	ls.stdout.on('data', function (data) {
	  console.log('stdout: ' + data);
	});

	ls.stderr.on('data', function (data) {
	  console.log('stderr: ' + data);
	});

	ls.on('close', function (code) {
	  console.log('child process exited with code ' + code);
	});	
}



// Listen for messages called "text-entered" coming from
// the content script. The message payload is the text the user
// entered.
// In this implementation we'll just log the text to the console.
/*text_entry.port.on("text-entered", function (text) {
	console.log(text);
	//text_entry.hide();
	
	var worker = tabs.activeTab.attach({
		contentScriptFile: data.url("injected-content-script.js")
	});
	
	worker.port.on("findFocusedField_result", function(obj) {
		console.log(JSON.stringify(obj));	
	});
	
	worker.port.emit("findFocusedField", null);
});*/
