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
	document.querySelector('#upload-file-dir').setAttribute("value", dir);
	document.querySelector('#file-list').setAttribute("fileid", dir);
}

function setRootId(err, res){
	var error = err || res.body.err;
	if (error)
		return console.log(error);

	if (dir === undefined) {
		dir = res.body._id;
		setCurrentDir(dir);
	}
	
}

function setPathCrum(err, res){
	var error = err || res.body.err;
	if (error)
		return console.log(error);

	var ancestors = res.body.ancestor;

	console.log(res.body);
	var content = '';
	for (var i = 0; i < ancestors.length; i++){
		var anc = ancestors[i];
		content += '\n<li>' +
					'<a href="/?dir=' + anc._id + '">'+
					anc.name + '</a>\n</li>';
	};
	document.querySelector('#path-crum').innerHTML = content;
}

function showFileList(err, res){
	var error = err || res.body.err;
	if (error)
		return console.log(error); 
		
	var array = res.body.dir;
	var content = '';

	for (var i = 0; i < array.length; i++){
		var file = array[i];

		content += '<tr tabindex="0" fileid="' + file._id + '">' +
				'<td aria-label="name">' + file.name + '</td>' +
				'<td aria-label="type">' + file.type + '</td>' +
				'<td aria-label="dlLink"><a href="#"><i class="fa fa-cloud-download"></i></a></td>' + 
				'</tr>';
	}
	document.querySelector('#file-list > tbody').innerHTML = content;
	[].forEach.call(document.querySelectorAll('#file-list > tbody > tr'), fileListHandlers);
	[].forEach.call(document.querySelectorAll('#file-list td[aria-label="dlLink"]'), fileDlLinkHandler);

}

function init(){
	dir = getQueryString()['dir'];
	uid = document.querySelector('#user-id').innerHTML;

	if (dir === undefined){
		superagent
			.get('/fs/getRoot')
			.query({uid: uid})
			.end(showFileList);

		superagent
			.get('/fs/getRootId')
			.query({uid: uid})
			.end(function (err, res){
				setRootId(err, res);
				superagent
					.get('/fs/getAncestor')
					.query({fileid: dir})
					.end(setPathCrum);
			});

	} else {
		setCurrentDir(dir);
		superagent
			.get('/fs/lsDir')
			.query({fileid: dir})
			.end(showFileList);
		superagent
			.get('/fs/getAncestor')
			.query({fileid: dir})
			.end(setPathCrum);
			
	}


};

//----------------List of Event Handlers-------------------
function createFolderHandler(e){
	e.preventDefault();

	if (dir === undefined)
		return console.log('undefined dir');

	var name = document.querySelector('#create-folder-input').value;
	document.querySelector('#create-folder-input').value = '';
	if (name === '')
		name = 'New Folder';

	

	superagent
		.get('/fs/createDir')
		.query({name: name, fileid: dir})
		.end(function (err, res){
			if (err){
				console.log(err);
			} else {
				console.log('created folder [%s]', name);
				init();
			}

		});
}

function uploadFileHandler(e){
	e.preventDefault();
	var form = document.querySelector('#upload-form');

	document.querySelector('.navbar-fixed-bottom .alert').style.visibility = "visible";
	window.setTimeout(function(){
		document.querySelector('.navbar-fixed-bottom .alert').style.visibility = "hidden";
	}, 1500);

	var data = new FormData(form);
	jQuery.ajax({
	    url: '/fs/uploadFile',
	    data: data,
	    cache: false,
	    contentType: false,
	    processData: false,
	    type: 'POST',
	    success: function(data){
	    	if (data.err)
	    		return console.log(data.err);
	    	init();
	    	form.reset();


	    },
	    error: function(){
	    	console.log('Fail to upload file');
	    }
	});
}

function fileListHandlers(ele){
	//ele.addEventListener("click", fileListClickHandler);
	ele.addEventListener("dblclick", fileListDblClickHandler);
}

function fileDlLinkHandler(ele){
	ele.addEventListener("click", function(e){
		e.preventDefault();

		var fileid = this.parentNode.getAttribute("fileid");
		superagent
			.get('/fs/getDownloadLink')
			.query({fileid: fileid})
			.end(function (err, res){
				var error = err || res.body.err;
				if (error)
					return console.log(error);

				console.log(res);
				location.href = res.body.downloadLink;
			});
	});
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
		// TODO: show file details
		console.log("dblclick non-folder");
	}
}

function addDriveHandler(e){
	
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
document.querySelector('#create-folder-modal .confirm-btn').addEventListener("click", createFolderHandler);
document.querySelector('#upload-modal .confirm-btn').addEventListener("click", uploadFileHandler);
$('#add-drive-modal').on('show.bs.modal', addDriveHandler);

[].forEach.call(document.querySelectorAll('#file-list > tbody > tr'), fileListHandlers);







