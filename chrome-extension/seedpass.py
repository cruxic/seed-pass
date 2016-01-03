#!/usr/bin/python

#
# For now, the goal of this script is to replicate the Seed Pass algorithms
# so that we can be confident of their JavaScript implementation.
#

import sys
import hashlib
import hmac
import base64
import os

def hmac_sha256(key, message):
	hm = hmac.new(key, message, hashlib.sha256)
	return hm.digest()

def calc_sha256(data):
	h = hashlib.sha256()
	h.update(data)
	return h.digest()

#This is a bad PBKDF merely because it's too fast.
def bad_pbkdf_32(plainText, salt):
	return hmac_sha256(plainText, salt)

#encrypt/decrypt bytes using XOR
def xor_encdec(key, data):
	nbytes = len(key)
	assert(nbytes == len(data))
	assert(nbytes > 0)

	res = ''
	for i in range(0, nbytes):
		k = ord(key[i])
		d = ord(data[i])
		res += chr(k ^ d)

	return res

def encrypt_seed(rawSeed, pin, salt):
	assert(len(rawSeed) == 32)
	assert(len(salt) == 8)

	key = bad_pbkdf_32(pin, salt)

	enc = xor_encdec(key, rawSeed)

	payload = salt + enc

	#24bit checksum.
	#This checksum does not prevent tampering but it will give
	# a sanity check.  To prevent tampering we would checksum the
	# unencrypted seed or include the pin.  However that makes it
	# trival to brute force the pin.
	chk = calc_sha256(payload)[0:3]

	header = 'C' + chk

	return base64.b64encode(header + payload)


def decrypt_seed(encSeed, pin):
	encSeed = base64.b64decode(encSeed)
	assert(len(encSeed) == 44)
	assert(encSeed[0] == 'C')
	#payload checksum
	chk1 = calc_sha256(encSeed[4:])[0:3]
	chk2 = encSeed[1:4]
	assert chk1 == chk2, chk1.encode('hex') + '!=' + chk2.encode('hex')

	salt = encSeed[4:12]
	enc = encSeed[12:]

	key = bad_pbkdf_32(pin, salt)

	return xor_encdec(key, enc)

def make_universal_password(raw32):
	assert(len(raw32) == 32)
	
	#We want passwords that are relatively easy to type on a mobile device.
	#Example: Qmtad.pgfex9
	#This construction yields 1.4x10^15 possibilities (1.4 Quadrillion: 1,411,670,957,000,000) 
	#This assumes the attacker knows the topology.  If they don't then
	# its much stronger still.

	#10 letters [a-z]
	alphabet = 'abcdefghijklmnopqrstuvwxyz'
	pwd = ''
	for i in range(0,10):
		pwd += alphabet[ord(raw32[i]) % len(alphabet)]
		
	#append a digit
	pwd += '0123456789'[ord(raw32[31]) % 10]		
	
	#period after 5th letter
	pwd = pwd[0:5] + '.' + pwd[5:]
	
	#Capitalize first letter
	return pwd[0].upper() + pwd[1:]

def compute_password(rawSeed, siteName):
	raw32 = hmac_sha256(rawSeed, siteName.lower())
	return make_universal_password(raw32)


def basic_test(rawSeed):
	encSeed = encrypt_seed(rawSeed, '1234', 'Constant')
	print 'Encrypted:', encSeed

	decSeed = decrypt_seed(encSeed, '1234')
	assert(decSeed == rawSeed)
	print 'Decrypted OK', decSeed.encode('hex')

	print 'FaceBook:', compute_password(rawSeed, 'FaceBook.com')
	print 'Amazon  :', compute_password(rawSeed, 'Amazon.com')


def main(args):
	basic_test('This is thirty two bytes of seed')

	print 'Changing Seed'
	basic_test(base64.b64decode('irnXlBCcol6onU2N+Lkx07OXvdjoG2/2XJlJgrj8LHE='))

	print 'PASS'

if __name__ == '__main__':
	main(sys.argv[1:])
