self.port.on("show", function(message) {
	//fill in email
	var elm = document.getElementById('email');
	var email = 'nospam_cruxic@gmail.com'.substring(7);
	elm.firstChild.nodeValue = email;
	elm.href = 'mailto:' + email;

	document.getElementById('error').value = message;
});
