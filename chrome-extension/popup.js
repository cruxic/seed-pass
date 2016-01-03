/**
Copyright (c) 2016 Adam Bennett (cruxic at gmail dot com).
This code is subject to the Seed Pass LICENSE:
  https://github.com/cruxic/seed-pass/blob/master/LICENSE
*/

var gShowingContentId = null;
var gSeed = null;
var gExpectedVerimg = -1;

//convenience
function getElm(id) {
	return document.getElementById(id);
}

document.addEventListener('DOMContentLoaded', function() {
	reloadSeed();
	
	//load the last verimg shown to the user
	chrome.runtime.sendMessage({type: "background_getLastVerimg"}, function(resp){
		if (typeof(resp) == 'number')
			gExpectedVerimg = resp;
	});
});

function reloadSeed() {
	//Load the seed
	chrome.storage.local.get(['seed'], function(items) {
		if (items && items.seed && isValidSeed(items.seed)) {
			gSeed = items.seed;
			onSeedLoaded();
		}
		else
			handleNoSeed();
	});
}

function onSeedLoaded() {
	//Load the content script into the active tab so we can see
	// if a password field is selected.  After this injection we
	// will receive 'contentScriptInjected' in onMessage()

	findActiveTab(function(tab) {
		//bugfix: don't attempt to inject the script into chrome:// URLs
		// such (eg a blank tab is chrome://newtab).  Only inject into
		// http and https
		if (tab && tab.url && tab.url.toLowerCase().indexOf('http') == 0) {

			chrome.tabs.executeScript(null, {
				file: 'injected-content-script.js'
			});
		}
		else {
			on_contentScriptInjected({
				repeat: false,
				showonly: true,  //Only allow viewing/copying passwords
				hostname: '',
				hasFocusedPasswordInput: false
			});
		}
	});
}

function handleNoSeed() {
	showContentDiv('Content_NoSeed');

	getElm('btnImportSeed').onclick = function() {
		showContentDiv('Content_ImportSeed');
		getElm('existing_seed').focus();
		var elm = getElm('btnDoImportSeed');
		disableFormSubmit(elm);
		elm.onclick = on_btnDoImportSeed_click;
	};

	getElm('btnNewSeed').onclick = function() {
		showContentDiv('Content_CreateSeed');
		getElm('new_seed_noise').focus();
		getElm('btnDoCreateSeed').onclick = on_btnDoCreateSeed_click;
	};
}

function findActiveTab(callback) {
	chrome.tabs.query({
		active: true,
		currentWindow: true,
	}, function(tabs) {
		callback(tabs.length > 0 ? tabs[0] : null);
	});
}

function on_btnDoCreateSeed_click() {
	hideWarning();

	var noise = getElm('new_seed_noise').value.trim();
	if (noise.length < 100) {
		showWarning('Enter at least 100 random characters');
		return;
	}
	//make sure they deleted the original text
	if (noise.indexOf('characters') != -1) {
		showWarning('Please delete the original message first.');
		return;
	}

	//validate PIN
	var pin = getElm('new_seed_PIN').value.trim();
	if (!isValidPIN(pin)) {
		showWarning('PIN must be 4 or more digits (0-9)');
		return;
	}

	var noise2 = '' + new Date().getTime();
	var noise3 = '';
	var i;
	for (i = 0; i < 13; i++)
		noise3 += Math.random();

	var obj = create_random_seed(noise + noise2 + noise3);
	var encrypted_base64 = encrypt_seed(obj.seed, pin, obj.salt);

	showContentDiv('Content_CreateSeed_Verify');
	var elm = getElm('CreateSeed_Verify_seed');
	elm.value = encrypted_base64;
	elm.select();
	getElm('imgCreateSeed_Verify').src = getVerimgFileName(getVerimgFromDecryptedSeed(obj.seed));
	obj = null;
	getElm('btnCreateSeed_Verify').onclick = reloadSeed;
	
	chrome.storage.local.set({'seed': encrypted_base64}, function() {
		if (chrome.runtime.lastError)
			showWarning('Failed to save seed!');
	});
}


function on_btnDoImportSeed_click() {
	hideWarning();

	var seed = getElm('existing_seed').value.trim();
	if (!isValidSeed(seed)) {
		showWarning('Invalid seed');
		return;
	}

	chrome.storage.local.set({'seed': seed}, function() {
		if (chrome.runtime.lastError)
			showWarning('Failed to save seed!');
		else
			reloadSeed();
	});
}

function showContentDiv(id) {
	if (id != gShowingContentId) {
		var elm;
		//hide the existing one
		elm = getElm(gShowingContentId)
		if (elm)
			elm.style.display = 'none';
		gShowingContentId = null;

		//Hide any warning
		hideWarning();

		//show the new one
		elm = getElm(id);
		if (elm) {
			elm.style.display = 'block';
			gShowingContentId = id;
		}
	}
}

function showWarning(msg) {
	var elm = getElm('WarningMessage');
	elm.firstChild.nodeValue = msg;
	elm.style.display = 'block';
}

function hideWarning() {
	getElm('WarningMessage').style.display = 'none';
}

chrome.runtime.onMessage.addListener(onMessage);

function onMessage(msg, sender, sendResponse) {
	switch (msg.type) {
		case 'contentScriptInjected':
			on_contentScriptInjected(msg);
			break;
	}
}

function showStandardPrompt(msg) {
	var elm;

	var sitename = make_sitename(msg.hostname);

	showContentDiv('Content_StandardPrompt');
	getElm('prompt_pin').focus();

	elm = getElm('default_sitename');
	elm.firstChild.nodeValue = sitename;
	elm.onclick = function() {
		this.style.display = 'none';
		var elm = getElm('prompt_sitename');
		elm.style.display = 'inline';
		elm.focus();
		getElm('sitename_note').style.display = 'block';
	};

	getElm('sitename_note').style.display = 'none';

	elm = getElm('prompt_sitename');
	elm.value = sitename;
	elm.style.display = 'none';
	//getElm('prompt_sitename').value = make_sitename(msg.hostname);
	elm = getElm('btnPromptInsert');
	elm.disabled = msg.showonly === true;
	elm.onclick = function() {
		on_btnPromptSubmit(false);
	};

	disableFormSubmit(elm);

	getElm('btnPromptShow').onclick = function() {
		on_btnPromptSubmit(true);
	};

	//if sitename is empty (because user is on a blank page) then let them
	// put the site name manually
	if (!sitename) {
		getElm('default_sitename').style.display = 'none';
		var elm = getElm('prompt_sitename');
		elm.style.display = 'inline';
		elm.focus();
	}

}

function on_contentScriptInjected(msg) {
	if (msg.repeat) {
		showContentDiv('Content_RepeatOffer');
		var elm = getElm('btnRepeatSame');
		elm.focus();
		elm.onclick = function() {
			//send and close popup
			sendMessageToActiveTab({
				type: 'repeatPassword'
			}, true);
		};

		getElm('btnRepeatStartOver').onclick = function() {
			msg.repeat = false;
			on_contentScriptInjected(msg);
		};
	}
	else if (msg.hasFocusedPasswordInput || msg.showonly) {
		showStandardPrompt(msg);
	}
	else {
		showContentDiv('Content_NoFieldSelected');
		var elm = getElm('proceed_anyway');
		elm.focus();
		elm.onclick = function() {
			msg.showonly = true;
			on_contentScriptInjected(msg);
		};
	}
}

function showPassword(password) {
	showContentDiv('Content_ShowPassword');
	var elm = getElm('txtShowPassword');
	elm.value = password;
	elm.focus();
	elm.select();  //select all text
}

function calcPassword(encryptedSeed, pin, sitename) {
	if (!encryptedSeed)
		return {error:'No seed!'};
	if (!isValidPIN(pin))
		return {error:'PIN must be 4 or more digits (0-9)'};
	if (typeof(sitename) != 'string' || sitename.length == 0)
		return {error:'Site name cannot be empty'};

	try {
		var seedWords = decrypt_seed(encryptedSeed, pin);

		//TODO: unnecessary conversion to base64
		var seedb64 = new SHA2.InputWords(seedWords, seedWords.length * 4).toBase64();
		var pass = compute_password(seedb64, sitename);

		//Also compute the verification image from the
		// decrypted seed.
		var verimg = getVerimgFromDecryptedSeed(seedWords);

		if (!pass)
			return {error: 'Failed to compute password!'};
		else {
			return {
				pass: pass,
				verimg: verimg,
				expectedVerimg: gExpectedVerimg
			};
		}
	}
	catch (e) {
		return {error: '' + e};
	}
}


function on_btnPromptSubmit(showonly) {
	hideWarning();

	var pin = getElm('prompt_pin').value.trim();
	var sitename = getElm('prompt_sitename').value.trim();
	
	var msg = calcPassword(gSeed, pin, sitename);

	if (msg.error) {
		showWarning(msg.error);
		return;
	}

	//Show the verification image the first time they enter
	// their PIN or if it did not match the previous verification
	// image.
	if (msg.verimg !== gExpectedVerimg) {
		//bugfix: if they retry with the correct verimg we should still have them
		// confirm it so they know they got it right.
		gExpectedVerimg = -1;
		
		showContentDiv('Content_Verimg');
		var img = getElm('imgVerimg');
		img.src = getVerimgFileName(msg.verimg);

		img.onclick = function() {
			//user confirmed image
			gExpectedVerimg = msg.verimg;
			chrome.runtime.sendMessage({
				type: "background_setLastVerimg",
				verimg: msg.verimg
			});

			if (showonly) {
				showPassword(msg.pass);
			}
			else {
				sendMessageToActiveTab({
					type: 'passwordReady',
					password: msg.pass
				}, true);
			}
		};

		img.focus();
		disableFormSubmit(img);

		getElm('btnVerimgRetry').onclick = function() {
			showContentDiv('Content_StandardPrompt');
			var elm = getElm('prompt_pin');
			elm.value = '';
			elm.focus();
		};
	}
	else if (showonly) {
		showPassword(msg.pass);
	}
	else {
		//TODO: instead of sending message to the active tab, send
		// the message to the original tab ID - avoids possible hack
		sendMessageToActiveTab({
			type: 'passwordReady',
			password: msg.pass
		}, true);
	}
}

function sendMessageToActiveTab(msg, closePopup) {
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, msg);
		if (closePopup)
			setTimeout(window.close, 125);
	});
}






