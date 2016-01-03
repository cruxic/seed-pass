/**
Copyright (c) 2016 Adam Bennett (cruxic at gmail dot com).
This code is subject to the Seed Pass LICENSE:
  https://github.com/cruxic/seed-pass/blob/master/LICENSE
*/

var gShowingContentId = null;

var gSeed = null;

//convenience
function getElm(id) {
	return document.getElementById(id);
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

function on_btnActViewSeed() {
	if (gSeed) {
		showContentDiv('Content_ViewSeed');
		var elm = getElm('txtViewSeed');
		elm.value = gSeed;
		elm.focus();
		elm.select();
	}	
}

function on_btnActChangePIN() {
	if (gSeed) {
		showContentDiv('Content_ChangePIN');
		var btn = getElm('btnSubmitPINChange');
		btn.onclick = onChangePINStep1;
		disableFormSubmit(btn);
	}
}

function onChangePINStep1() {
	hideWarning();
	
	var old_pin = getElm('old_pin').value.trim();
	var new_pin = getElm('new_pin').value.trim();
	var new_pin2 = getElm('new_pin2').value.trim();

	if (!isValidPIN(old_pin)) {
		showWarning('Old PIN is invalid');
		return;
	}

	if (!isValidPIN(new_pin)) {
		showWarning('New PIN must be 4 or more digits (0-9)');
		return;
	}	
	
	if (new_pin != new_pin2) {
		showWarning('New PIN does not match');
		return;
	}
	
	//Compute the verimg
	var seedWords = decrypt_seed(gSeed, old_pin);
	var verimg = getVerimgFromDecryptedSeed(seedWords);
	
	showContentDiv('Content_ChangePIN_verimg');	
	var img = getElm('changePinVerimg').src = getVerimgFileName(verimg);
	getElm('btn_verimg_retry').onclick = function() {
		showContentDiv('Content_ChangePIN');
		var elm = getElm('old_pin');
		elm.value = '';
		elm.focus();
	};
	
	getElm('btn_verimg_next').onclick = function() {
		finishPINChange(seedWords, new_pin);
	};
}

function make_weak_salt8() {
	//Create 8 bytes of salt
	var noise = '' + new Date().getTime();
	var i;
	for (i = 0; i < 13; i++)
		noise += Math.random();	
	var words = SHA2.sha256(SHA2.str2words(noise));
	
	return words.slice(0,2);
}

function finishPINChange(seedWords, new_pin) {
	//crypto quality random is not necessary for public salt
	var saltWords = make_weak_salt8();
	
	gSeed = encrypt_seed(seedWords, new_pin, saltWords);
	
	chrome.storage.local.set({'seed': gSeed}, function() {
		if (chrome.runtime.lastError)
			showWarning('Failed to save seed!');
		else {
			showContentDiv('Content_ViewSeedAfterPINChange');
			var elm = getElm('txtViewNewSeed');
			elm.value = gSeed;
			elm.focus();
			elm.select();
		}
	});	

	//force verimg prompt upon next use
	chrome.runtime.sendMessage({
		type: "background_setLastVerimg",
		verimg: -1
	});
	
	
}


function on_btnActChangeSeed() {
	showContentDiv('Content_ChangeSeed');	
	
	getElm('btnDeleteSeed').onclick = on_btnDeleteSeed;
}

function on_btnDeleteSeed() {
	hideWarning();
	
	//did they confirm
	if (!getElm('chkDeleteSeed').checked) {
		showWarning('Please confirm this action');
		return;		
	}
	
	//Load the seed
	chrome.storage.local.remove(['seed'], function() {
		if (chrome.runtime.lastError)
			showWarning('Deletion failed!');
		else
			window.close();				
	});
}

function showActions() {
	showContentDiv('Content_Actions');	
	getElm("btnActViewSeed").onclick = 	on_btnActViewSeed;
	getElm('btnActChangePIN').onclick = on_btnActChangePIN;
	getElm('btnActChangeSeed').onclick = on_btnActChangeSeed;
}

document.addEventListener('DOMContentLoaded', function() {
	
	//Load the seed
	chrome.storage.local.get(['seed'], function(items) {
		if (items && items.seed) {
			if (isValidSeed(items.seed)) {
				gSeed = items.seed;
				showActions();
			}
			else
				showWarning('Stored seed is invalid!');
		}
		else
			showWarning('No seed has been setup yet.  Click the Seed Pass toolbar icon to do this.');			
	});		
});

