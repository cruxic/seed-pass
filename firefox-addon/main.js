var data = require("sdk/self").data;
const tabs = require("sdk/tabs");
var hotkeys = require("sdk/hotkeys");
var panel = require("sdk/panel");
var action = require("sdk/ui/button/action");
var child_process = require("sdk/system/child_process");
var emit = require('sdk/event/core').emit;
var sha256 = require('sha256');
const sdk_url = require("sdk/url");
const gFlowFunc = require('flow');

var gFlowState = null;

//the currently displaying Panel (if any)
//var gActivePanel = null;

//used to emit() messages to content-script.js
var gContentPort = null;

var showHotKey = hotkeys.Hotkey({
	combo: "alt-p",
	onPress: function() {restartFlow('HOTKEY');}
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
	onClick: function() {restartFlow('TOOLBAR_CLICK');}
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
	if (info.hasFocusedInput) {
		beginTouchPromt(info);
	}
	else {
		showPanel('no_field_selected', info, function(){beginTouchPromt(info)});			
	}
}

function beginTouchPromt(info) {
	//TODO: warn if scheme is not 'https:'

	var sitename = makeSitename(info.hostname);

	//load seed password from plugin local storage (something never synchronized on the cloud).
	var seedpassword = 'TODO';

	var sitehash = make_site_hash(sitename, seedpassword)

	//Execute native program to communicate with USB device
	execUSBCommProgram(sitehash, onExecFinished);

	showPanel('touch_prompt', sitename);	
}



function makePanel(basename, onloadArg, callback) {
	var pnl = panel.Panel({
		width: 640,
		height: 480,
		position: actionButton,
		contentURL: data.url(basename + ".html"),
		contentScriptFile: data.url("panel-script.js")
	});

	pnl.on("show", function() {
		if (typeof(callback) == 'function')
			pnl.port.on('callback', callback);		
		pnl.port.emit("onload", {panelName: basename, arg: onloadArg});
	});
	
	return pnl;
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

function FlowState(startEvent) {
	this.startEvent = startEvent;
	this.promptPanel = null;
	this.promptId = null;
	this.tab = null;
	this.tabLoadArg = null;
	this.tabPort = null;  //Worker.port returned by tab.attach()
	this.nextPromptInTab = false;
	
	
	//used for get/set
	this.valueMap = Object.create(null);
}

function PauseFlowEx(sourceMsg) {
	this.sourceMsg = sourceMsg;
}

FlowState.prototype._printVars = function() {
	var key, value;
	var msg = '_printVars: startEvent=' + this.startEvent + '\n';
	for (key in this.valueMap) {
		if (key.indexOf('VAL_') == 0) {
			value = this.valueMap[key];
			msg += '\t' + key.substring(4) + ': ' + value + '\n';
		}
	}
	
	console.log(msg);
}

FlowState.prototype.get = function(name, defaultFunc) {
	var key = "VAL_" + name;
	var value = this.valueMap[key];
	
	//provide default if missing
	if (typeof(value) == 'undefined' && defaultFunc) {
		value = defaultFunc(this);
		this.valueMap[key] = value;
	}
	
	return value;
};

FlowState.prototype.set = function(name, value) {
	var key = "VAL_" + name;
	this.valueMap[key] = value;
};


FlowState.prototype.done = function(arg) {
	console.log('DONE');
	if (this.promptPanel)
		this.promptPanel.hide();
	throw new PauseFlowEx("done");	
}

FlowState.prototype.die = function(arg) {
	throw new Error('die called! arg=' + arg);
}

FlowState.prototype.panelCallback = function(jsonText) {
	console.log('panelCallback for ' + this.promptId + '. result=' + jsonText);
	this.set(this.promptId + "_RESULT", JSON.parse(jsonText));
	incrementFlow();
}

FlowState.prototype.prompt = function(promptId, arg) {
	//Skip if we have the result already
	var promptResult = this.get(promptId + "_RESULT");
	if (typeof(promptResult) != 'undefined') {
		console.log('prompt: ' + promptId + ' has result ' + promptResult);
		return promptResult;
	}
	
	if (this.nextPromptInTab) {
		this.nextPromptInTab = false;
		
		var url = data.url(promptId + ".html");
		
		console.log('prompt: preparing tab');
		
		this.promptId = promptId;
		this.tabLoadArg = arg;
		
		tabs.open({
			url: url,
			isPrivate: true,
			inNewWindow: true,
			onReady: this._tab_onReady.bind(this)
		});
		throw new PauseFlowEx("tabs.open");
	}
	
	//Prompt in tab?
	if (this.tab) {	
		console.log('prompt: ' + promptId + ' loading in tab. arg=' + arg);
		this._printVars();
		
		
		this.promptId = promptId;
		this.tabLoadArg = arg;
		var url = data.url(promptId + ".html");
		console.log('changing url to ' + url);
		this.tab.url = url;
		throw new PauseFlowEx("tab.url=" + url);
	}
	//Prompt in Panel
	else {
		console.log('prompt: ' + promptId + ' making new panel. arg=' + arg);
		this.promptId = promptId;
		this.promptPanel = makePanel(promptId, arg, this.panelCallback.bind(this));
		this.promptPanel.show();
		throw new PauseFlowEx("promptPanel.show");
	}
};

FlowState.prototype.openBrowserTab = function(url) {
	console.log('openBrowserTab ' + url);
	tabs.open(url);
};

FlowState.prototype._tab_onReady = function(tab) {
	this.tab = tab;
	
	console.log("inside _tab_onReady " + this.promptId);

	var worker = tab.attach({
		contentScriptFile: data.url("panel-script.js")
	});
	
	console.log('attach complete');
	
	var promptId = this.promptId;
	var tabLoadArg = this.tabLoadArg;
	this.tabPort = worker.port;
	var that = this;
	
	worker.port.on("tab_script_ready", function() {
		console.log("heard tab_script_ready " + promptId);
		worker.port.on("callback", that.panelCallback.bind(that));
		worker.port.emit("onload", {panelName: promptId, arg: tabLoadArg});
	});
}

FlowState.prototype.switchToPrivateWindow = function() {
	console.log('insided switchToPrivateWindow');
	if (this.tab === null) {
		this.nextPromptInTab = true;
		if (this.promptPanel)
			this.promptPanel.hide();
	}
};

function restartFlow(startEvent) {
	console.log('restartFlow ' + startEvent);
	gFlowState = new FlowState(startEvent);
	incrementFlow();	
}

function incrementFlow() {
	try {
		console.log('BEGIN incrementFlow');
		gFlowState._printVars();
		gFlowFunc(gFlowState);
		console.log('END incrementFlow');
	}
	catch (e) {
		if (e instanceof PauseFlowEx) {
			console.log('PauseFlowEx ' + e.sourceMsg);
			return;
		}
		else {
			console.log('Unexpected exception in incrementFlow');
			throw e;
		}
	}
}

