/**
Copyright (c) 2016 Adam Bennett (cruxic at gmail dot com).
This code is subject to the Seed Pass LICENSE:
  https://github.com/cruxic/seed-pass/blob/master/LICENSE
*/

function make_sitename(hostname) {
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

function getVerimgFileName(verimgNumber) {
	var hex2 = verimgNumber.toString(16).toUpperCase();
	if (hex2.length == 1)
		hex2 = '0' + hex2;
	return 'verimg/' + hex2 + '.jpg';
}

function disableFormSubmit(formChildElement) {
	//Find the parent form
	var elm = formChildElement;

	function returnFalse() {
		return false;
	}

	while (elm != null) {
		if (elm.nodeName == 'FORM') {
			elm.onsubmit = returnFalse;
			break;
		}
		elm = elm.parentNode;
	}

}

function isValidPIN(s) {
	var re = /^[0-9]{4,}$/;
	return typeof(s) == 'string' && re.exec(s);
}

function isASCII(s) {
	var i;
	for (i = 0; i < s.length; i++) {
		if (s.charCodeAt(i) > 127)
			return false;
	}

	return true;
}

function compute_password(seed_base64, siteName) {
	if (!siteName || siteName.length == 0)
		throw new Error('Invalid site name');

	//For now, require siteName to be ASCII because I have not tested
	// unicode conversion.
	if (!isASCII(siteName))
		throw new Error('Site name cannot contain unicode characters.');

	//Site name is forced to lower case to reduce ambiguity
	siteName = siteName.toLowerCase();

	//sha256.js must have been included
	var key = SHA2.base64_to_words(seed_base64);
	if (!key || key.nbytes != 32)
		throw new Error('invalid seed_base64');

	//Something is wrong if key is a constant value (eg all 00 or FF)
	var w = key.words[0];
	if (key.words[1] == w &&
		key.words[2] == w &&
		key.words[3] == w) {
		throw new Error('unexpected constant key');
	}

	//Hash!
	var digestWords = SHA2.hmac(key, SHA2.str2words(siteName));
	if (!digestWords || digestWords.length != 8)
		throw new Error('unexpected hmac problem');

	//Convert the 32 byte hash to a printable password
	return make_universal_password(SHA2.words2hex(digestWords));
}

function findFirstDigit(s) {
	var i, c;
	for (i = 0; i < s.length; i++) {
		c = s.charCodeAt(i);
		//'0' - '9'
		if (c >= 48 && c <= 57)
			return s[i];
	}

	return null;
}

function make_universal_password(inputHex) {
	if (!inputHex || inputHex.length != 64)
		throw new Error('make_universal_password: invalid input');
		
	//We have to strike a balance here.  The geek in me would love to have
	// 20 characters of mixed case and symbols, but such passwords are
	// painful to type by hand, especially on a mobile device.  The following
	// formulation should be relatively easy to type on a mobile, but still
	// stands a good chance against an offline brute-force attack:
	//
	//Example: Qmtad.pgfex9
	//This construction yields 1.4x10^15 possibilities (1.4 Quadrillion: 1,411,670,957,000,000) 
	//This assumes the attacker knows the topology.  If they don't then
	// its much stronger still.	


	var ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

	//10 letters [a-z]
	var i, b;
	var pwd = '';
	for (i = 0; i < 20; i += 2) {
		b = parseInt(inputHex.substring(i,i+2), 16);
		pwd += ALPHABET[b % ALPHABET.length];
	}

	//Append a digit
	b = parseInt(inputHex.substring(inputHex.length - 2), 16);
	pwd += '0123456789'[b % 10];
	
	//Period after 5th letter
	pwd = pwd.substring(0,5) + '.' + pwd.substring(5);
	
	//Capitalize first letter
	pwd = pwd.substring(0,1).toUpperCase() + pwd.substring(1);
	
	return pwd;
}

//This is a bad PBKDF merely because it's too fast.
function bad_pbkdf_32(plainText, saltInputWords) {
	//because I have not tested SHA2.str2words with unicode yet
	if (!isASCII(plainText))
		throw new Error('Unicode passwords not yet supported');

	var digestWords = SHA2.hmac(SHA2.str2words(plainText), saltInputWords);
	if (!digestWords || digestWords.length != 8)
		throw new Error('unexpected hmac problem');

	return digestWords
}

//encrypt/decrypt 32bit words using XOR
function xor_encdec(keyWords, dataWords) {
	if (keyWords.length != dataWords.length)
		throw new Error('Key length does not match data length!');

	var result = new Array(keyWords.length);

	var i;
	for (i = 0; i < keyWords.length; i++) {
		 result[i] = dataWords[i] ^ keyWords[i];
	}

	return result;
}

function create_random_seed(noiseText) {
	if (!noiseText || noiseText.length < 100)
		throw new Error('Noise data too short');

	//Use the first third for salt, the remainder for the seed.
	//Keeping them separate should break any relationship between the salt,
	// which is public, and the seed, which is secret
	var i = Math.floor(noiseText.length / 3);
	var saltNoise = noiseText.substring(0,i);
	var seedNoise = noiseText.substring(i);

	//Digest!
	var saltWords = SHA2.sha256(SHA2.str2words(saltNoise));
	var seedWords = SHA2.sha256(SHA2.str2words(seedNoise));

	return {
		seed: seedWords,
		salt: saltWords.slice(0,2)  //8 bytes
	};
}

function encrypt_seed(seedWords, password, salt) {
	if (seedWords.length != 8 || !password || password.length < 4 || salt.length != 2)
		throw new Error('invalid argument');

	//Create encryption key
	var key = bad_pbkdf_32(password, new SHA2.InputWords(salt, 8));

	//Encrypt
	var encryptedWords = xor_encdec(key, seedWords);

	var payload = salt.concat(encryptedWords);

	//24bit checksum.
	//This checksum does not prevent tampering but it will give
	// a sanity check.  To prevent tampering we would checksum the
	// unencrypted seed or include the pin.  However that makes it
	// trival to brute force the pin.
	var chk = SHA2.sha256(new SHA2.InputWords(payload));
	chk = (chk[0] >> 8) & 0xFFFFFF;

	var header = 0x43000000 | chk;  //0x43 is 'C'

	var all = [header].concat(payload);

	//base64 encode
	return new SHA2.InputWords(all).toBase64();
}

function decrypt_seed(seed_base64, password) {
	//Decode base64 and verify format and checksum
	var obj = unpack_seed(seed_base64);
	if (!obj)
		throw new Error('Invalid seed');

	var key = bad_pbkdf_32(password, new SHA2.InputWords(obj.salt));

	return xor_encdec(key, obj.seed);
}

//Validate the seed format and checksum and return both seed and salt words.
// Returns null if the seed is malformed or corrupt in any way
function unpack_seed(seed_base64) {
	if (typeof(seed_base64) != 'string')
		return null;
	
	var words;
	try {
		words = SHA2.base64_to_words(seed_base64);
	}
	catch (e) {
		//invalid base 64!
		return null;
	}
	
	if (!words || words.nbytes != 44 || (words.words[0] >> 24) != 0x43) //'C'
		return null;
	
	
	//Verify 24bit checksum
	words = words.words;
	var header = words[0];
	var payload = new SHA2.InputWords(words.slice(1));				
	var chk1 = SHA2.sha256(payload);
	chk1 = (chk1[0] >> 8) & 0xFFFFFF;  //only the low 24bits	
	var chk2 = header & 0xFFFFFF;	
	if (chk1 !== chk2)
		return null;
	
	return {
		salt: words.slice(1,3),
		seed: words.slice(3)
	};
}

//Calculate the "verification image" number corresponding to the given seed.
function getVerimgFromDecryptedSeed(seedWords) {

	var constantSalt = SHA2.base64_to_words('ScYHRcjNQ9PaUxwqhI1ycQ==');
	var hash = SHA2.hmac(new SHA2.InputWords(seedWords, seedWords.length * 4),
		constantSalt);

	//return the low 7 bits of the first byte
	return (hash[0] >> 24) & 0x7F;
}

function isValidSeed(seed) {
	return unpack_seed(seed) !== null;
}
