/**
Copyright (c) 2016 Adam Bennett (cruxic at gmail dot com).
This code is subject to the Seed Pass LICENSE:
  https://github.com/cruxic/seed-pass/blob/master/LICENSE
*/

/*This file is invoked from unit-tests.html*/
function log(msg) {
	var textarea = document.getElementById('log');
	textarea.value += msg + '\n';
}

function assert(cond) {
	if (!cond) {
		log('FAIL');
		throw new Error('Test assertion failed');
	}
	else
		log('PASS');
}

function assertEq(a, b) {
	if (a !== b) {
		log('FAIL "' + a + '" !== "' + b + '"');
		throw new Error('Test assertion failed');
	}
	else
		log('PASS');
}



function run_unit_tests() {
	//clear log
	document.getElementById('log').value = '';

	//basic sha256
	assertEq(SHA2.hash_text_to_hex('Hello World'), 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e');

	//base64 decode 13 bytes
	var bb = SHA2.base64_to_words('5FhJ8SWVwDhtOO3R7A==');
	assertEq(SHA2.words2hex(bb.words), 'e45849f12595c0386d38edd1ec000000');
	assertEq(bb.nbytes, 13);

	//sha256 of 0-255 encoded as base64
	bb = SHA2.base64_to_words('AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWltcXV5fYGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fn+AgYKDhIWGh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+/w==');
	assertEq(SHA2.words2hex(bb.words), '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f606162636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7e7f808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9fa0a1a2a3a4a5a6a7a8a9aaabacadaeafb0b1b2b3b4b5b6b7b8b9babbbcbdbebfc0c1c2c3c4c5c6c7c8c9cacbcccdcecfd0d1d2d3d4d5d6d7d8d9dadbdcdddedfe0e1e2e3e4e5e6e7e8e9eaebecedeeeff0f1f2f3f4f5f6f7f8f9fafbfcfdfeff');
	assertEq(bb.nbytes, 256);
	assertEq(SHA2.words2hex(SHA2.sha256(bb)), '40aff2e9d2d8922e47afd4648e6967497158785fbd1da870e7110266bf944880');

	//hmac of identical 64 byte key and message. Bytes are 0-63
	bb = SHA2.base64_to_words('AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+Pw==');
	assertEq(SHA2.words2hex(SHA2.hmac(bb, bb)), 'c4aaa100f785d6b12dd6fc8a0fc97db70e77ccc09cd95ba3bc1b5ebd66b5053a');

	//hmac of identical 13 byte key and message. Bytes are 0-12
	bb = SHA2.base64_to_words('AAECAwQFBgcICQoLDA==');
	assertEq(SHA2.words2hex(SHA2.hmac(bb, bb)), '8fbb2e62656fa7fa2b8babb170e7040b45dc10fec7748f7fd25b00b6d753edea');

	//hmac of identical 65 byte key and message. Bytes are 0-64
	bb = SHA2.base64_to_words('AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0A=');
	assertEq(SHA2.words2hex(SHA2.hmac(bb, bb)), '7e49f1c96630a79b4ea39a862538ad85eb84b3672962a5817bb01c7044d4349c');

	//Some test vectors from RFC 4231 (https://tools.ietf.org/html/rfc4231)
	hmac_rfc_4321_test_vectors();

	//Text InputWords.toBase64
	assertEq(SHA2.base64_to_words('5FhJ8SWVwDhtOO3R7A==').toBase64(), '5FhJ8SWVwDhtOO3R7A==');
	assertEq(SHA2.base64_to_words('lrvaotk2WKpqLnjQVS+Ojg==').toBase64(), 'lrvaotk2WKpqLnjQVS+Ojg==');
	assertEq(SHA2.base64_to_words('AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWltcXV5fYGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fn+AgYKDhIWGh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+/w==').toBase64(), 'AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWltcXV5fYGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fn+AgYKDhIWGh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+/w==');

	//encrypt_seed and decrypt_seed
	var rawSeedWords = SHA2.str2words('This is thirty two bytes of seed');
	var saltWords = SHA2.str2words('Constant');
	var encSeed = encrypt_seed(rawSeedWords.words, '1234', saltWords.words);
	assertEq(encSeed, 'Q0aSfkNvbnN0YW50A9c4b3LZKO0VH7aWNrEQsA7X1OX6rk8bw5xU1+HfhAU=');
	assert(isValidSeed(encSeed));
	var decWords = decrypt_seed(encSeed, '1234');
	assertEq(SHA2.words2hex(decWords), '54686973206973207468697274792074776f206279746573206f662073656564');

	rawSeedWords = SHA2.base64_to_words('irnXlBCcol6onU2N+Lkx07OXvdjoG2/2XJlJgrj8LHE=');
	encSeed = encrypt_seed(rawSeedWords.words, '1234', saltWords.words);
	assertEq(encSeed, 'Q8KwbENvbnN0YW503QaGiEIs+ZPJ6pJpunEBF8ovSV9rwUWev2p7dSpGzRA=');
	assert(isValidSeed(encSeed));
	decWords = decrypt_seed(encSeed, '1234');
	assertEq(SHA2.words2hex(decWords), '8ab9d794109ca25ea89d4d8df8b931d3b397bdd8e81b6ff65c994982b8fc2c71');
	
	//compute_password
	var seedB64 = SHA2.str2words('This is thirty two bytes of seed').toBase64();
	assertEq(compute_password(seedB64, 'FaceBook.Com'), 'Zikdb.uxigc7');
	assertEq(compute_password(seedB64, 'facebook.com'), 'Zikdb.uxigc7');
	assertEq(compute_password(seedB64, 'amazon.com'), 'Ikxhf.zylge6');
	

	var noise = 'abc123-abc123-abc123-abc123-abc123-abc123-abc123-abc123-abc123-abc123-abc123-abc123-abc123-abc123-abc123';
	var obj = create_random_seed(noise);
	assertEq(SHA2.words2hex(obj.seed), 'b1ad683e5b3856304cd541e4566502427254f32759c4fe47c8018c365e32eaf3');
	assertEq(SHA2.words2hex(obj.salt), '7255061158eb35fd');
	/*var encSeed = encrypt_seed(obj.seed, '1234', obj.salt);
	assertEq(encSeed, 'QgAAABoWSpDY1EIupNAvH2VUcW/hz7OVEJXKLw==');
	assert(isValidSeed(encSeed));
	var decSeed = decrypt_seed(encSeed, '1234');
	assertEq(SHA2.words2hex(decSeed), 'c69f8a530c0704b1af1503fef65a5449');
	assertEq(getVerimgFromDecryptedSeed(decSeed), 110);*/

	//make_sitename
	assertEq(make_sitename('FoOBaR.Com'), 'foobar.com');
	assertEq(make_sitename('FoO.BaR.coM'), 'bar.com');
	assertEq(make_sitename('A.org'), 'a.org');
	assertEq(make_sitename('a.b.c.d'), 'c.d');
	assertEq(make_sitename(''), '');
	assertEq(make_sitename('yada'), 'yada');
	assertEq(make_sitename('173.194.33.105'), '173.194.33.105');  //ipv4
	assertEq(make_sitename('2001:0db8:0000:0000:0000:ff00:0042:8329'), '2001:0db8:0000:0000:0000:ff00:0042:8329');
	//port numbers are not stripped off because they are not intended to be passed
	//to this function, just the host name (as in document.location.hostname)
	assertEq(make_sitename('site.com:8080'), 'site.com:8080');


	log('ALL PASS');
}

//Some test vectors from RFC 4231 (https://tools.ietf.org/html/rfc4231)
function hmac_rfc_4321_test_vectors() {
	/*
	4.2.  Test Case 1

	   Key =          0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b
					  0b0b0b0b                          (20 bytes)
	   Data =         4869205468657265                  ("Hi There")

	   HMAC-SHA-224 = 896fb1128abbdf196832107cd49df33f
					  47b4b1169912ba4f53684b22
	   HMAC-SHA-256 = b0344c61d8db38535ca8afceaf0bf12b
					  881dc200c9833da726e9376c2e32cff7
	   HMAC-SHA-384 = afd03944d84895626b0825f4ab46907f
					  15f9dadbe4101ec682aa034c7cebc59c
					  faea9ea9076ede7f4af152e8b2fa9cb6
	   HMAC-SHA-512 = 87aa7cdea5ef619d4ff0b4241a1d6cb0
					  2379f4e2ce4ec2787ad0b30545e17cde
					  daa833b7d6b8a702038b274eaea3f4e4
					  be9d914eeb61f1702e696c203a126854
	*/
	var key, data, bb;
	key = SHA2.base64_to_words('CwsLCwsLCwsLCwsLCwsLCwsLCws=');
	data = SHA2.base64_to_words('SGkgVGhlcmU=');
	assertEq(SHA2.words2hex(SHA2.hmac(key, data)), 'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7');

	/*
	4.3.  Test Case 2

	   Test with a key shorter than the length of the HMAC output.

	   Key =          4a656665                          ("Jefe")
	   Data =         7768617420646f2079612077616e7420  ("what do ya want ")
					  666f72206e6f7468696e673f          ("for nothing?")

	   HMAC-SHA-224 = a30e01098bc6dbbf45690f3a7e9e6d0f
					  8bbea2a39e6148008fd05e44
	   HMAC-SHA-256 = 5bdcc146bf60754e6a042426089575c7
					  5a003f089d2739839dec58b964ec3843
	   HMAC-SHA-384 = af45d2e376484031617f78d2b58a6b1b
					  9c7ef464f5a01b47e42ec3736322445e
					  8e2240ca5e69e2c78b3239ecfab21649
	   HMAC-SHA-512 = 164b7a7bfcf819e2e395fbe73b56e0a3
					  87bd64222e831fd610270cd7ea250554
					  9758bf75c05a994a6d034f65f8f0e6fd
					  caeab1a34d4a6b4b636e070a38bce737
	*/
	key = SHA2.base64_to_words('SmVmZQ==');
	data = SHA2.base64_to_words('d2hhdCBkbyB5YSB3YW50IGZvciBub3RoaW5nPw==');
	assertEq(SHA2.words2hex(SHA2.hmac(key, data)), '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843');


	/*
	4.4.  Test Case 3

	   Test with a combined length of key and data that is larger than 64
	   bytes (= block-size of SHA-224 and SHA-256).

	   Key            aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
					  aaaaaaaa                          (20 bytes)
	   Data =         dddddddddddddddddddddddddddddddd
		              dddddddddddddddddddddddddddddddd
		              dddddddddddddddddddddddddddddddd
		              dddd                              (50 bytes)

	   HMAC-SHA-224 = 7fb3cb3588c6c1f6ffa9694d7d6ad264
					  9365b0c1f65d69d1ec8333ea
	   HMAC-SHA-256 = 773ea91e36800e46854db8ebd09181a7
					  2959098b3ef8c122d9635514ced565fe
	   HMAC-SHA-384 = 88062608d3e6ad8a0aa2ace014c8a86f
					  0aa635d947ac9febe83ef4e55966144b
					  2a5ab39dc13814b94e3ab6e101a34f27
	   HMAC-SHA-512 = fa73b0089d56a284efb0f0756c890be9
					  b1b5dbdd8ee81a3655f83e33b2279d39
					  bf3e848279a722c806b485a47e67c807
					  b946a337bee8942674278859e13292fb
	*/
	key = SHA2.base64_to_words('qqqqqqqqqqqqqqqqqqqqqqqqqqo=');
	data = SHA2.base64_to_words('3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d0=');
	assertEq(SHA2.words2hex(SHA2.hmac(key, data)), '773ea91e36800e46854db8ebd09181a72959098b3ef8c122d9635514ced565fe');

	/*

	4.5.  Test Case 4

	   Test with a combined length of key and data that is larger than 64
	   bytes (= block-size of SHA-224 and SHA-256).

	   Key =          0102030405060708090a0b0c0d0e0f10
					  111213141516171819                (25 bytes)
	   Data =         cdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcd
					  cdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcd
					  cdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcd
					  cdcd                              (50 bytes)

	   HMAC-SHA-224 = 6c11506874013cac6a2abc1bb382627c
					  ec6a90d86efc012de7afec5a
	   HMAC-SHA-256 = 82558a389a443c0ea4cc819899f2083a
					  85f0faa3e578f8077a2e3ff46729665b
	   HMAC-SHA-384 = 3e8a69b7783c25851933ab6290af6ca7
					  7a9981480850009cc5577c6e1f573b4e
					  6801dd23c4a7d679ccf8a386c674cffb
	   HMAC-SHA-512 = b0ba465637458c6990e5a8c5f61d4af7
					  e576d97ff94b872de76f8050361ee3db
					  a91ca5c11aa25eb4d679275cc5788063
					  a5f19741120c4f2de2adebeb10a298dd
	*/
	key = SHA2.base64_to_words('AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGQ==');
	data = SHA2.base64_to_words('zc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc0=');
	assertEq(SHA2.words2hex(SHA2.hmac(key, data)), '82558a389a443c0ea4cc819899f2083a85f0faa3e578f8077a2e3ff46729665b');

	/*
	4.8.  Test Case 7

	   Test with a key and data that is larger than 128 bytes (= block-size
	   of SHA-384 and SHA-512).

	   Key =          aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
					  aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
					  aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
					  aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
					  aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
					  aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
					  aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
					  aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
					  aaaaaa                            (131 bytes)
	   Data =         54686973206973206120746573742075  ("This is a test u")
					  73696e672061206c6172676572207468  ("sing a larger th")
					  616e20626c6f636b2d73697a65206b65  ("an block-size ke")
					  7920616e642061206c61726765722074  ("y and a larger t")
					  68616e20626c6f636b2d73697a652064  ("han block-size d")
					  6174612e20546865206b6579206e6565  ("ata. The key nee")
					  647320746f2062652068617368656420  ("ds to be hashed ")
					  6265666f7265206265696e6720757365  ("before being use")
					  642062792074686520484d414320616c  ("d by the HMAC al")
					  676f726974686d2e                  ("gorithm.")

	   HMAC-SHA-224 = 3a854166ac5d9f023f54d517d0b39dbd
					  946770db9c2b95c9f6f565d1
	   HMAC-SHA-256 = 9b09ffa71b942fcb27635fbcd5b0e944
					  bfdc63644f0713938a7f51535c3a35e2
	   HMAC-SHA-384 = 6617178e941f020d351e2f254e8fd32c
					  602420feb0b8fb9adccebb82461e99c5
					  a678cc31e799176d3860e6110c46523e
	   HMAC-SHA-512 = e37b6a775dc87dbaa4dfa9f96e5e3ffd
					  debd71f8867289865df5a32d20cdc944
					  b6022cac3c4982b10d5eeb55c3e4de15
					  134676fb6de0446065c97440fa8c6a58
	*/
	key = SHA2.base64_to_words('qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqo=');
	data = SHA2.base64_to_words('VGhpcyBpcyBhIHRlc3QgdXNpbmcgYSBsYXJnZXIgdGhhbiBibG9jay1zaXplIGtleSBhbmQgYSBsYXJnZXIgdGhhbiBibG9jay1zaXplIGRhdGEuIFRoZSBrZXkgbmVlZHMgdG8gYmUgaGFzaGVkIGJlZm9yZSBiZWluZyB1c2VkIGJ5IHRoZSBITUFDIGFsZ29yaXRobS4=');
	assertEq(SHA2.words2hex(SHA2.hmac(key, data)), '9b09ffa71b942fcb27635fbcd5b0e944bfdc63644f0713938a7f51535c3a35e2');

}
