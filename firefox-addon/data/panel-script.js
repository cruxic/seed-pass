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

self.port.on("showError", function(message) {
	var elm = document.getElementById('error');
	if (elm) {
		elm.firstChild.nodeValue = message;
		elm.style.display = 'block';
	}
	else
		console.log('panel-script: showError: page has no #error element.');
});

function submitPrompt(arg) {
	var jsonText = JSON.stringify(arg);
	//console.log('panel-script: callback with ' + jsonText);
	self.port.emit('prompt_submit', jsonText);  //arg must be a primitive type!
}

function onload_touch_prompt(sitename) {
	document.getElementById('sitename').value = sitename;	
}

function onload_no_field_selected(info) {
	var elm = document.getElementById('proceed_anyway');
	elm.onclick = submitPrompt;
	elm.focus();
}

function onload_PleaseImportOrCreate(arg) {
	setOnclickCallback('IMPORT');
	setOnclickCallback('CREATE');
	setOnclickCallback('OVERVIEW');
} 

function onload_AreYouOnASecureComputer(arg) {
	setOnclickCallback('NEXT');
}

function onload_CreateSeedPassword(arg) {
	setFormSubmitCallback('Form');
	
	/*if (typeof(error) == 'string') {
		console.log('error' + error);
		document.getElementById('error').firstChild.nodeValue = error;	
	}*/
}


function onload_EnterSeedName(arg) {
	setFormSubmitCallback('Form');	
} 

function onload_ScribbleNoise() {
	window.gScribbler = new Scribbler('scribbleCanv', submitPrompt);
}

function Scribbler(canvasId, doneCallback) {
	this.canvElm = document.getElementById(canvasId);	
	this.canvElm.addEventListener("mousemove", this.on_mousemove.bind(this));
	this.ctx = this.canvElm.getContext("2d");
	this.lastX = -1;
	this.lastY = -1;
	this.hue = 1.0;	
	this.ctx.lineWidth = 4;
	this.noise = [];
	this.doneCallback = doneCallback;
	this.done = false;
}

Scribbler.prototype.on_mousemove = function(e) {
	if (this.done)
		return;

	//console.log(e.clientX + "," + e.clientY);
	var rect = this.canvElm.getBoundingClientRect();
	var x = e.clientX - rect.left;
	var y = e.clientY - rect.top;
	
	if (this.lastX == -1) {
		this.lastX = x - 1;
		this.lastY = y - 1;
	}
	
	var ctx = this.ctx;

	this.hue += 0.05;
	if (this.hue > 1.0)
		this.hue = 0.0;
	this.ctx.strokeStyle = HSVtoRGB(this.hue, 1.0, 1.0);
		
	ctx.beginPath();
	ctx.moveTo(this.lastX, this.lastY);
	ctx.lineTo(x, y);
	ctx.stroke();
	ctx.closePath();
	
	this.lastX = x;
	this.lastY = y;
	
	//use milliseconds and position as random data
	this.noise.push(performance.now() & 0xFFFFFFFF);  //force primitive integer
	this.noise.push(x);
	this.noise.push(y);
	
	//update progress bar
	var elm = document.getElementById('progress');
	var nSamples = this.noise.length / 3;
	var percent = Math.floor(nSamples / 450.0 * 100.0);
	elm.firstChild.nodeValue = percent + '%';
	
	//done?
	if (percent >= 100) {
		this.done = true;
		elm.firstChild.nodeValue = '100% - Thank you.';
		
		//wait a second then submit
		var result = this.noise;
		var callback = this.doneCallback;
		setTimeout(function() {
			callback(result);
		}, 1000);
		
	}
};


//http://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately
function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    
	r = Math.round(r * 255.0);
    g = Math.round(g * 255.0);
    b = Math.round(b * 255.0);
    return "#" + ((r << 16) | (g << 8) | b).toString(16);    
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
			case "hidden":
				value = input.value.trim();
				break;
			case "number":
				value = parseInt(input.value.trim());
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
		submitPrompt(obj);
	}, 1);
	return false;
}

function setOnclickCallback(elementId) {
	var elm = document.getElementById(elementId);
	if (!elm)
		throw new Error('panel-script: element "' + elementId + '" not found.');
	elm.onclick = function() {
		submitPrompt(elementId);
	};
}

//When these scripts are loaded in a tab instead of a panel, emulate the "show" event
setTimeout(function(){
	//console.log("emitting tab_script_ready");
	self.port.emit("tab_script_ready");
}, 25);
