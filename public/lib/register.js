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

	var valid = validate();
	if (!valid) {
		alert('Invalid Input');
		return false;
	} 

	// Reference: http://visionmedia.github.io/superagent/#post-/%20put%20requests
	superagent
		.post(this.getAttribute('action'))
		.send(serializeFormData(this))
		.end(function (res) {
			if (res.error) {
				alert(res.body.err || res.error);
				return console.error(res.body.err || res.error);
			}

			alert('Account is created Successfully');
			// refresh the page with latest results
			location.href = '/';
		});
}

function validate(e){
	var valid;

	var pwEle = document.querySelector('#pw-input-group'),
		pwConfirmEle = document.querySelector('#confirm-pw-input-group'),
		pw = document.querySelector('#password-input').value,
		pwConfirm = document.querySelector('#confirm-password-input').value;

		valid = pw && (pw === pwConfirm);
	if (valid){
		pwEle.classList.remove('has-error');
		pwConfirmEle.classList.remove('has-error');

		pwEle.classList.add('has-success');
		pwConfirmEle.classList.add('has-success');

	} else {
		pwEle.classList.remove('has-success');
		pwConfirmEle.classList.remove('has-success');

		pwEle.classList.add('has-error');
		pwConfirmEle.classList.add('has-error');

	
	}

	return valid;
}


document.querySelector('#password-input').addEventListener('change', validate);
document.querySelector('#confirm-password-input').addEventListener('change', validate);
document.querySelector('form').addEventListener('submit', onSubmitHandler);






