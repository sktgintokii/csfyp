(function() {
'use strict';
function serializeFormData(form) {
	return [].map.call(form.elements, function(el) {
		if (el.name && !el.disabled 
				&& (!el.type || el.type.toLowerCase() !== 'checkbox' || el.checked)) {
			if (el.tagName === 'SELECT' && el.hasAttribute('multiple'))
				return [].map.call(el.selectedOptions, function(o) {
					return [el.name, o.value].map(encodeURIComponent).join('=');
				}).join('&');
			return [el.name, el.value].map(encodeURIComponent).join('=');
		}
	}).join('&');
};

function onSubmitHandler(e) {
	// Disable default form submission to prevent page load
	e.preventDefault();

	// Reference: http://visionmedia.github.io/superagent/#post-/%20put%20requests
	superagent
		.post(this.getAttribute('action'))
		.send(serializeFormData(this))
		.end(function (res) {
			console.log(res.body);
			
			if (res.error) {
				alert('Login Failed');

				return console.error(res.error);
			}

			// refresh the page with latest results
			location.replace('/');
		});
}

document.querySelector("#login-form").addEventListener("submit", onSubmitHandler);


}) ();