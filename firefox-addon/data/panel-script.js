//
// This content-script is loaded into all panels of the plugin.
// onload_PANEL_NAME() will be called after the panel loads.
//

self.port.on("onload", function(obj) {
	var funcname = "onload_" + obj.panelName;
	if (typeof(window[funcname]) == 'function')
		window[funcname](obj.arg);
});

function main_callback(arg) {
	self.port.emit('callback', arg);
}

function onload_touch_prompt(sitename) {
	document.getElementById('sitename').value = sitename;	
}

function onload_no_field_selected(info) {
	var elm = document.getElementById('proceed_anyway');
	elm.onclick = main_callback;
	elm.focus();
}
