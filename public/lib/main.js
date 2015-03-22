function getQueryString() {
  	var result = {}, queryString = location.search.slice(1),
      re = /([^&=]+)=([^&]*)/g, m;

  	while (m = re.exec(queryString)) {
    	result[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
  	}

  	return result;
}


function init(){
	var dir = getQueryString()['dir'];

	if (dir === 'undefined'){
		var uid = document.querySelector('#user-id');
		superagent
			.get('/fs/getRoot')
			.query({uid: uid})
			.end(function (err, res){
				if (err){
					console.log(err);
				} else {

				}

			});
	} else {
		superagent
			.get('/fs/lsDir')
			.query({fileid: dir})
			.end(function (err, res){
				if (err){
					console.log(err);
				} else {

				}
			})
	}

	
};

function logoutHandler(e){
	e.preventDefault();

	var form = document.createElement("form");

	form.setAttribute("method", "POST");
	form.setAttribute("action", "/api/logout");

	form.submit();
}

init();
document.querySelector('#logout-opt').addEventListener("click", logoutHandler);