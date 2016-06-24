var data = require("sdk/self").data;
var tabs = require("sdk/tabs");
var hotkeys = require("sdk/hotkeys");
var panel = require("sdk/panel");
var action = require("sdk/ui/button/action");
var child_process = require("sdk/system/child_process");
var emit = require('sdk/event/core').emit;
var sha256 = require('sha256');
const sdk_url = require("sdk/url");

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
	
	var sitehash = make_site_hash('foo', 'bar');
	
	exec_usb_communicate(sitehash, function(hashhex, err) {
		if (err)
			console.log('ERROR: ' + err);
		else
			console.log('SUCCESS ' + hashhex);
	});
}

function make_site_hash(sitename, password) {
	var key = sha256.str2words(password);
	var message = sha256.str2words(sitename);
	return sha256.words2hex(sha256.hmac(key, message));
}

function exec_usb_communicate(sitehash, callback) {
	console.log(data.url('usb-communicate'));
	var filepath = sdk_url.toFilename(data.url('usb-communicate'));	
	var proc = child_process.spawn('/usr/bin/python', [filepath]);

	var allStdout = '';
	var allStderr = '';
	
	proc.stdout.on('data', function (data) {
		//'data' seems to be line buffered but I'll include accumulation logic
		// in case it's not for some reason
		if (allStdout.length < 4096)  //prevent excessive output
			allStdout += data;
	});

	proc.stderr.on('data', function (data) {
		if (allStderr.length < 4096)  //prevent excessive output
			allStderr += data;
	});

	proc.on('close', function (code) {
		if (code == 0) {
			//correct output is 64 hex characters, double quoted
			var re = /"([a-fA-F0-9]{64})"/g;
			var m = re.exec(allStdout);
			if (m) {
				//return first capture
				callback(m[1], null);
				return;
			}	
		}	
		
		//something went wrong
		allStderr += '\n(exit status' + code + ')';			
		callback(null, allStderr);
		
	});	
	
	//send sitehash via stdin instead of program arg so that it 
	// can't be easily snooped in process list.
	emit(proc.stdin, 'data', sitehash + "\n");
	emit(proc.stdin, 'end');
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
