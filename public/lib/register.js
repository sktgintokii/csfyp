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

		document.querySelector('#password-input').focus();
	
	}

	return valid;
}

function submitFormHandler(e){
	var valid = validate();
	if (!valid){
		alert('Error: Passwords mismatched!');
		e.preventDefault();
		return false;
	}
	
}

document.querySelector('#password-input').addEventListener('change', validate);
document.querySelector('#confirm-password-input').addEventListener('change', validate);
document.querySelector('form').addEventListener('submit', submitFormHandler);