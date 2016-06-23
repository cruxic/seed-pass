self.port.on("show", function(findFocusedField_result) {
	document.getElementById('sitename').value = findFocusedField_result.hostname;
});
