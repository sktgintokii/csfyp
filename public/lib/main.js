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
//var array = [{name: 'chrome', type: 'exe'}, {name: 'ff', type: 'folder'}];

	var display() = function (array){
		var content = '';
			for (var i = 0; i < array.length; i++){
				var file = array[i];
				content += '<tr tabindex="0">' +
						'<td>' + file.name + '</td>' +
						'<td>' + file.type + '</td>' +
						'</tr>';
			}
		document.querySelector('#file-list > tbody').innerHTML = content;		
	}

	if (dir === undefined){
		var uid = document.querySelector('#user-id').innerHTML;
		superagent
			.get('/fs/getRoot')
			.query({uid: uid})
			.end(function (err, res){
				if (err){
					alert(err);
				} else {
					display(res.body.children);
				}

			});
	} else {
		superagent
			.get('/fs/lsDir')
			.query({fileid: dir})
			.end(function (err, res){
				if (err){
					alert(err);
				} else {
					display(res.body.children);
				}
			})
	}

	
};

function fileListHandler(ele){
	//ele.addEventListener("click", fileListClickHandler);
	ele.addEventListener("dblclick", fileListDblClickHandler);

}

function fileListClickHandler(e){
	e.preventDefault();

	$(this).siblings().removeClass("toggle");

	this.classList.add("toggle");
}

function fileListDblClickHandler(e){
	e.preventDefault();
	// TODO redirect to next page
	console.log("")
}

function logoutHandler(e){
	e.preventDefault();

	var form = document.createElement("form");

	form.setAttribute("method", "POST");
	form.setAttribute("action", "/api/logout");

	form.submit();
}

init();
document.querySelector('#logout-opt').addEventListener("click", logoutHandler);

[].forEach.call(document.querySelectorAll('#file-list > tbody > tr'), fileListHandler);







