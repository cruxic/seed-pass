/**
Copyright (c) 2016 Adam Bennett (cruxic at gmail dot com).
This code is subject to the Seed Pass LICENSE:
  https://github.com/cruxic/seed-pass/blob/master/LICENSE

Adamb: the following code was adapted from Lapo Luchini's SHA256 code.
I have made some additional features such as base64 and hmac.
The hmac was mostly copied from http://pajhome.org.uk/crypt/md5.

The original copyright notice is as follows:
*/

/* A JavaScript implementation of SHA-256 (c) 2009 Lapo Luchini <lapo@lapo.it>
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 *
 * Credits:
 * largely inspired to Angel Marin's http://anmar.eu.org/projects/jssha2/
 * with ideas from Christoph Bichlmeier's http://www.bichlmeier.info/sha256.html
 * (both distributed under the BSD License)
 */


var sha256 = {};
if (module) module.exports = sha256;  //export as CommonJS module so firefox addon can load it

/**This is raw input type to the core hash function.
It holds an array of 32bit integers and the total number of bytes
@param nbytes if omitted this will be words.length * 4
*/
sha256.InputWords = function(words, nbytes) {
	this.words = words.concat([]);  //bugfix: deep copy to prevent side effects
	this.nbytes = nbytes || (words.length * 4);
};

sha256.InputWords.prototype.toBase64 = function() {
	var i;
	var output = '';
	var temp, length;
	var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

	function encode(num) {
	  return lookup.charAt(num);
	}

	function tripletToBase64 (num) {
	  return encode(num >> 18 & 0x3F) +
		encode(num >> 12 & 0x3F) +
		encode(num >> 6 & 0x3F) +
		encode(num & 0x3F);
	}

	//convert 32bit words to bytes
	var uint8 = new Array(this.words.length * 4);
	var j = 0;
	for (i = 0; i < this.words.length; i++) {
		temp = this.words[i];
		uint8[j++] = (temp >> 24) & 0xFF;
		uint8[j++] = (temp >> 16) & 0xFF;
		uint8[j++] = (temp >> 8) & 0xFF;
		uint8[j++] = temp & 0xFF;
	}
	//remove the excess (if any)
	if (uint8.length > this.nbytes) {
		uint8 = uint8.slice(0, this.nbytes);
	}

	var extraBytes = uint8.length % 3; // if we have 1 byte left, pad 2 bytes

	// go through the array every three bytes, we'll deal with trailing stuff later
	length = uint8.length - extraBytes;
	for (i = 0; i < length; i += 3) {
	  temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
	  output += tripletToBase64(temp);
	}

	// pad the end with zeros, but make sure to not forget the extra bytes
	switch (extraBytes) {
	  case 1:
		temp = uint8[uint8.length - 1];
		output += encode(temp >> 2);
		output += encode((temp << 4) & 0x3F);
		output += '==';
		break;
	  case 2:
		temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1]);
		output += encode(temp >> 10);
		output += encode((temp >> 4) & 0x3F);
		output += encode((temp << 2) & 0x3F);
		output += '=';
		break;
	  default:
		break;
	}

	return output;
};

sha256.S = function(X, n) { return (X >>> n) | (X << (32 - n)); };
sha256.R = function(X, n) { return X >>> n; };
sha256.Ch = function(x, y, z) { return (x & y) ^ ((~x) & z); };
sha256.Maj = function(x, y, z) { return (x & y) ^ (x & z) ^ (y & z); };
sha256.Sigma0 = function(x) { return this.S(x, 2) ^ this.S(x, 13) ^ this.S(x, 22); };
sha256.Sigma1 = function(x) { return this.S(x, 6) ^ this.S(x, 11) ^ this.S(x, 25); };
sha256.Gamma0 = function(x) { return this.S(x, 7) ^ this.S(x, 18) ^ this.R(x, 3); };
sha256.Gamma1 = function(x) { return this.S(x, 17) ^ this.S(x, 19) ^ this.R(x, 10); };
sha256.K = [0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5, 0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3, 0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174, 0xE49B69C1, 0xEFBE4786, 0xFC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA, 0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147, 0x6CA6351, 0x14292967, 0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13, 0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85, 0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070, 0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3, 0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208, 0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2];

/**This is the raw, core function.  It operates on InputWords and returns an array of words*/
sha256.sha256 = function(inputWords) {
	var HASH = [0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A, 0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19];
	var W = new Array(64);
	var a, b, c, d, e, f, g, h, i, j, jt;
	var T1, T2;
	var m = inputWords.words.concat([]);  //bugfix: deep copy lest we modify the caller's argument!
	var l = inputWords.nbytes * 8;  //input bit length

	/* append padding */
	var padA = l >> 5;
	var padB = ((l + 64 >> 9) << 4) + 15;
	m[padA] |= 0x80 << (24 - l % 32);
	for (i = padA + 1; i < padB; ++i)
		m[i] = 0;
	m[padB] = l;

	for (i = 0; i < m.length; i += 16) {
		a = HASH[0];
		b = HASH[1];
		c = HASH[2];
		d = HASH[3];
		e = HASH[4];
		f = HASH[5];
		g = HASH[6];
		h = HASH[7];

		for (j = 0; j < 64; j++) {
			jt = j & 0xF;
			if (j < 16)
				W[j] = m[j + i];
			else {
				W[jt] = (W[jt] + this.Gamma1(W[(j+14)&0xF]))|0;
				W[jt] = (W[jt] + W[(j+9)&0xF])|0;
				W[jt] = (W[jt] + this.Gamma0(W[(j+1)&0xF]))|0;
			}

			T1 = (h + this.Sigma1(e))|0;
			T1 = (T1 + this.Ch(e, f, g))|0;
			T1 = (T1 + this.K[j])|0;
			T1 = (T1 + W[jt])|0;
			T2 = (this.Sigma0(a) + this.Maj(a, b, c))|0;

			h = g;
			g = f;
			f = e;
			e = (d + T1)|0;
			d = c;
			c = b;
			b = a;
			a = (T1 + T2)|0;
		}

		HASH[0] = (a + HASH[0])|0;
		HASH[1] = (b + HASH[1])|0;
		HASH[2] = (c + HASH[2])|0;
		HASH[3] = (d + HASH[3])|0;
		HASH[4] = (e + HASH[4])|0;
		HASH[5] = (f + HASH[5])|0;
		HASH[6] = (g + HASH[6])|0;
		HASH[7] = (h + HASH[7])|0;
	}
	return HASH;
};

sha256.str2words = function(str) {
	var bin = [];
	var chrsz = 8;
	var mask = (1 << chrsz) - 1;
	for (var i = 0; i < str.length * chrsz; i += chrsz)
		bin[i>>5] |= (str.charCodeAt(i / chrsz) & mask) << (24 - i%32);
	return new sha256.InputWords(bin, str.length);
};

sha256.words2hex = function(binarray) {
	var hex_tab = "0123456789abcdef";
	var str = "";
	for(var i = 0; i < binarray.length * 4; i++) {
		str += hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8+4)) & 0xF) +
			hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8  )) & 0xF);
	}
	return str;
};


/*Hash a text string using SHA256 and return 64 character hex string*/
sha256.hash_text_to_hex = function(s) {
	return this.words2hex(this.sha256(this.str2words(s)));
};

sha256.base64_to_words = function(b64) {

	function decode(elt) {
		//ASCII codes:
		// + = 43
		// / = 47
		// 0 = 48
		// a = 97
		// A = 65
		var code = elt.charCodeAt(0);
		//code === '+'
		if (code === 43) return 62;
		//code === '/'
		if (code === 47) return 63;
		//code < '0'
		if (code < 48) return -1; // no match
		//code < '0' + 10 return code - '0' + 26 + 26
		if (code < 58) return code + 4;
		//code < 'A' + 26 return code - 'A'
		if (code < 91) return code - 65;
		//code < 'a' + 26 return code - 'a' + 26
		if (code < 123) return code - 71;
	}

	//adamb: adapted from https://github.com/beatgammit/base64-js/blob/master/lib/b64.js
	//MIT license
	var words = [];

	var i, j, l, tmp, placeHolders, arr;

	if (b64.length % 4 > 0) {
	  throw new Error('base64 length ' + b64.length + ' is not a multiple of 4');
	}

	// the number of equal signs (place holders)
	// if there are two placeholders, than the two characters before it
	// represent one byte
	// if there is only one, then the three characters before it represent 2 bytes
	// this is just a cheap hack to not do indexOf twice
	var len = b64.length;
	placeHolders = b64.charAt(len - 2) === '=' ? 2 : b64.charAt(len - 1) === '=' ? 1 : 0;

	// base64 is 4/3 + up to two characters of the original data
	//arr = new Array(b64.length * 0.75 - placeHolders);
	arr = [];

	// if there are placeholders, only get up to the last complete 4 chars
	l = placeHolders > 0 ? b64.length - 4 : b64.length;

	for (i = 0, j = 0; i < l; i += 4, j += 3) {
	  tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3));
	  arr.push((tmp & 0xFF0000) >> 16);
	  arr.push((tmp & 0xFF00) >> 8);
	  arr.push(tmp & 0xFF);
	}

	if (placeHolders === 2) {
	  tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4);
	  arr.push(tmp & 0xFF);
	} else if (placeHolders === 1) {
	  tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2);
	  arr.push((tmp >> 8) & 0xFF);
	  arr.push(tmp & 0xFF);
	}

	//convert bytes to 32bit words
	tmp = arr.length;  //nbytes
	//pad final word
	j = arr.length % 4;
	for (i = 0; i < j; i++)
		arr.push(0);
	i = 0;
	while (i < arr.length) {
		//build 32bit word
		l = (arr[i++] << 24) |
			(arr[i++] << 16) |
			(arr[i++] << 8) |
			 arr[i++];
		words.push(l);
	}

	return new this.InputWords(words, tmp);
}

/*
Calculate the HMAC-sha256 of a key and some data.
adamb: this HMAC code is adapted from http://pajhome.org.uk/crypt/md5 (BSD License)
key and data must be InputWords
*/
sha256.hmac = function(key, message) {
	var BLOCKSIZE_BYTES = 64;
	var BLOCKSIZE_WORDS = 16;
	var bkey, i;

	//If key is longer SHA256 internal block size (512bits) then hash it.
	if (key.nbytes > BLOCKSIZE_BYTES)
		bkey = this.sha256(key);
	else
		bkey = key.words;

	//Note: at this point, bkey is <= BLOCKSIZE_BYTES.  If less,
	// the deficit will be treated as zeros.

	var ipad = new Array(BLOCKSIZE_WORDS);
	var opad = new Array(BLOCKSIZE_WORDS);

	for(i = 0; i < bkey.length; i++)
	{
		ipad[i] = bkey[i] ^ 0x36363636;
		opad[i] = bkey[i] ^ 0x5C5C5C5C;
	}

	//deficit is treated as zeros
	for(; i < BLOCKSIZE_WORDS; i++)
	{
		ipad[i] = 0x36363636;
		opad[i] = 0x5C5C5C5C;
	}

	var inwords = new sha256.InputWords(ipad.concat(message.words),
		BLOCKSIZE_BYTES + message.nbytes);
	var hash = this.sha256(inwords);
	inwords.words = opad.concat(hash);
	inwords.nbytes = inwords.words.length * 4;
	return this.sha256(inwords);
};
