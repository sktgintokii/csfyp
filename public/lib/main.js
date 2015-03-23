var dir, uid;

function getQueryString() {
  	var result = {}, queryString = location.search.slice(1),
      re = /([^&=]+)=([^&]*)/g, m;

  	while (m = re.exec(queryString)) {
    	result[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
  	}

  	return result;
}

function setCurrentDir(dir){
	document.querySelector('#file-list').setAttribute("fileid", dir);
}

function setRootId(err, res){
	var rootId;

	if (err){
		return console.log(err);
	}

	var ele = document.querySelector('#path-crum > li[aria-label="root"]');
	ele.setAttribute("fileid", res.body._id);

	if (dir === undefined) {
		dir = res.body._id;
	}
	setCurrentDir(dir);
}

function showFileList(err, res){
	if (err){
		return console.log(err);
	} 
		
	var array = res.body.dir;
	var content = '';

	for (var i = 0; i < array.length; i++){
		var file = array[i];


		content += '<tr tabindex="0" fileid="' + file._id + '">' +
				'<td aria-label="name">' + file.name + '</td>' +
				'<td aria-label="type">' + file.type + '</td>' +
				'</tr>';
	}
	document.querySelector('#file-list > tbody').innerHTML = content;
	[].forEach.call(document.querySelectorAll('#file-list > tbody > tr'), fileListHandlers);	
}

function init(){
	dir = getQueryString()['dir'];
	uid = document.querySelector('#user-id').innerHTML;

	if (dir === undefined){
		superagent
			.get('/fs/getRoot')
			.query({uid: uid})
			.end(showFileList);
	} else {
		setCurrentDir(dir);
		superagent
			.get('/fs/lsDir')
			.query({fileid: dir})
			.end(showFileList);
	}

	superagent
		.get('/fs/getRootId')
		.query({uid: uid})
		.end(setRootId);
};

//----------------List of Event Handlers-------------------
function createFolderHandler(e){
	e.preventDefault();

	superagent
		.get('/fs/getRoot')
		.query({uid: uid})
		.end(function (err, res){
			if (err){
				alert(err);
			} else {
				showFileList(res.body.dir);
			}

		});
}

function fileListHandlers(ele){
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
	var type = this.querySelector('td[aria-label="type"]').innerHTML;
	var dest = "/?dir=" + this.getAttribute("fileid");

	if (type === "dir"){
		location.replace(dest);
	} else {
		console.log("123", dest);
	}
}

function logoutHandler(e){
	e.preventDefault();

	var form = document.createElement("form");

	form.setAttribute("method", "POST");
	form.setAttribute("action", "/api/logout");

	form.submit();
}

//---------------------  Start of execution of main.js -----------------
init();
document.querySelector('#logout-opt').addEventListener("click", logoutHandler);
document.querySelector('#create-folder-opt').addEventListener("click", createFolderHandler);

[].forEach.call(document.querySelectorAll('#file-list > tbody > tr'), fileListHandlers);







