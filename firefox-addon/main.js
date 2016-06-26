var data = require("sdk/self").data;
var tabs = require("sdk/tabs");
var hotkeys = require("sdk/hotkeys");
var panel = require("sdk/panel");
var action = require("sdk/ui/button/action");
var child_process = require("sdk/system/child_process");
var emit = require('sdk/event/core').emit;
var sha256 = require('sha256');
const sdk_url = require("sdk/url");

//the currently displaying Panel (if any)
var gActivePanel = null;

//used to emit() messages to content-script.js
var gContentPort = null;

var showHotKey = hotkeys.Hotkey({
	combo: "alt-p",
	onPress: onPluginClicked
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
	onClick: onPluginClicked
});

//Called when the plugin is invoked via hot-key or toolbar button
function onPluginClicked() {
	var worker = tabs.activeTab.attach({
		contentScriptFile: data.url("content-script.js")
	});

	gContentPort = worker.port;

	gContentPort.on("findFocusedField_result", on_findFocusedField_result);
	gContentPort.emit("findFocusedField", null);
}

/*Called after content-script.js is loaded.  info object contains:
{
	hasFocusedInput: true,
	scheme: 'https:',
	hostname: 'cruxic.github.io',
	isRepeat: false,  //true if we have already inserted one password into the page
}
*/
function on_findFocusedField_result(info) {

	//TODO: warn if scheme is not 'https:'

	var sitename = makeSitename(info.hostname);

	//load seed password from plugin local storage (something never synchronized on the cloud).
	var seedpassword = 'TODO';

	var sitehash = make_site_hash(sitename, seedpassword)

	//Execute native program to communicate with USB device
	execUSBCommProgram(sitehash, onExecFinished);

	showPanel('touch-prompt', sitename);
}

function showPanel(basename, onShowData) {
	var pnl = panel.Panel({
		width: 640,
		height: 480,
		position: actionButton,
		contentURL: data.url(basename + ".html"),
		contentScriptFile: data.url(basename + ".js")
	});

	if (typeof(onShowData) != 'undefined') {
		pnl.on("show", function() {
			pnl.port.emit("show", onShowData);
		});
	}

	pnl.show();

	gActivePanel = pnl;
}

function onExecFinished(hashhex, err) {
	if (err) {
		showPanel('error', 'execUSBCommProgram failed.\n' + err);
	}
	else {
		gContentPort.emit("injectPassword", hashhex.substring(0, 8));
		gActivePanel.hide();
	}
}

function execUSBCommProgram(sitehash, callback) {
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

function makeSitename(hostname) {
	//For MOST websites using the top and second-level domain name is the best
	// choice.  For example, the login page of homedepot.com appears to
	// be a load-balanced subdomain like (secure2.homedepot.com).
	// Similarly, newegg.com has their login page on secure.newegg.com.
	//
	// However, using the 2nd level domain is not always the best choice.
	// For  example, universities like oregonstate.edu have
	// many subdomains such as osulibrary.oregonstate.edu.
	// Perhaps future versions should allow the user to choose?


	//always lower case
	hostname = hostname.toLowerCase();

	//no IPv6.  This also filters out port numbers however those are not
	// supposed to make it into this function anyway.
	if (hostname.indexOf(':') == -1) {
		var parts = hostname.split('.');
		if (parts.length > 1) {
			// Don't process IPv4 addresses
			var re = new RegExp('[0-9]+');
			if (!re.test(parts[parts.length-1])) {
				//second-level.top-level
				return parts.slice(parts.length-2).join('.');
			}
		}
	}

	return hostname;
}


function make_site_hash(sitename, password) {
	var key = sha256.str2words(password);
	var message = sha256.str2words(sitename);
	return sha256.words2hex(sha256.hmac(key, message));
}
