//
// This content-script is loaded into all panels of the plugin.
// onload_PANEL_NAME() will be called after the panel loads.
//

self.port.on("onload", function(obj) {
	var funcname = "onload_" + obj.panelName;
	if (typeof(window[funcname]) == 'function') {
		console.log('panel-script: calling ' + funcname);
		window[funcname](obj.arg);
	}
});


function main_callback(arg) {
	var jsonText = JSON.stringify(arg);
	console.log('panel-script: callback with ' + jsonText);
	self.port.emit('callback', jsonText);  //arg must be a primitive type!
}

function onload_touch_prompt(sitename) {
	document.getElementById('sitename').value = sitename;	
}

function onload_no_field_selected(info) {
	var elm = document.getElementById('proceed_anyway');
	elm.onclick = main_callback;
	elm.focus();
}

function onload_PleaseImportOrCreate(arg) {
	setOnclickCallback('IMPORT');
	setOnclickCallback('CREATE');
	setOnclickCallback('OVERVIEW');
} 

function onload_AreYouOnASecureComputer() {
	setOnclickCallback('NEXT');
}

function onload_EnterSeedName(arg) {
	setFormSubmitCallback('Form');	
} 

function setFormSubmitCallback(formId) {
	var form = document.getElementById(formId);
	if (!form)
		throw new Error('panel-script: form "' + elementId + '" not found.');
	form.onsubmit = _formSubmit;
}

//Gather all inputs values as an object
function formValuesToObject(form) {
	var obj = Object.create(null);
	var i, input, name, value;
	var NOVALUE = {};

	var inputs = form.getElementsByTagName('input');
	for (i = 0; i < inputs.length; i++) {
		input = inputs[i];
		name = input.name ? input.name : input.id;
		if (!name)
			name = '?';
		value = NOVALUE;
			
		switch (String(input.type).toLowerCase()) {
			case "text":
			case "password":
				value = input.value;
				break;
			case "number":
				value = parseInt(input.value);
				break;
			case "checkbox":
				value = input.checked == true;
				break;
			default:
				break;
				
			//TODO: handle other types (http://www.w3schools.com/html/html_form_input_types.asp)
		
		}
		
		if (value !== NOVALUE)
			obj[name] = value;
	}
	
	//TODO: handle select
	
	return obj;
}

function _formSubmit(event) {
	event.preventDefault();  //prevent actual submit
	var obj = formValuesToObject(this);
	setTimeout(function() {
		main_callback(obj);
	}, 1);
	return false;
}

function setOnclickCallback(elementId) {
	var elm = document.getElementById(elementId);
	if (!elm)
		throw new Error('panel-script: element "' + elementId + '" not found.');
	elm.onclick = function() {
		main_callback(elementId);
	};
}

//When these scripts are loaded in a tab instead of a panel, emulate the "show" event
setTimeout(function(){
	console.log("emitting tab_script_ready");
	self.port.emit("tab_script_ready");
}, 25);
