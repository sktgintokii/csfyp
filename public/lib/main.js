var dir, uid;
var fileUploadCnt = 0;
var options = {
	title: 'My Daily Activities',
	sliceVisibilityThreshold: 0,
	width: 400,
	height: 500,
	colors: ['#ED1C62', '#ADA6A9']
};

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

function validate(e) {
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

function sendFile(file) {
    var uri = "/fs/uploadFile";
    var xhr = new XMLHttpRequest();
    var fd = new FormData();
    
    xhr.open("POST", uri, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            // Handle response.
            //alert(xhr.responseText); // handle response.
            console.log(xhr.responseText);
            init();
            fileUploadCnt -= 1;

            if (fileUploadCnt < 1){
            	document.querySelector('.navbar-fixed-bottom .alert').style.visibility = "hidden";
            }
        }
    };
    fd.append('fileid', dir);
    fd.append('upload', file);
    // Initiate a multipart/form-data upload
    xhr.send(fd);
    fileUploadCnt += 1;

	document.querySelector('.navbar-fixed-bottom .alert').style.visibility = "visible";
	window.setTimeout(function(){
		
	}, 1500);

}

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
		var iconClass;
		if (file.type.toLowerCase() === 'dir'){
			iconClass = 'fa fa-folder-open';
		} else {
			iconClass = 'fa fa-file';
		}
	
		content += '<tr tabindex="0" draggable="true" fileid="' + file._id + '">' +
				'<td aria-label="icon"><i class="' + iconClass + '"</i></td>'+ 
				'<td aria-label="name">' + file.name + '</td>' +
				'<td aria-label="type">' + file.type + '</td>' +
				'<td aria-label="dlLink"><a href="#"><i class="fa fa-cloud-download"></i></a></td>' + 
				'</tr>';
	}
	document.querySelector('#file-list > tbody').innerHTML = content;
	[].forEach.call(document.querySelectorAll('#file-list > tbody > tr'), fileListHandlers);
	[].forEach.call(document.querySelectorAll('#file-list td[aria-label="dlLink"]'), fileDlLinkHandler);

}

function deleteFileById(fileId){
	superagent
		.get('/fs/deleteFile')
		.query({fileid: fileId})
		.end(function (err, res){
			var error = err || res.body.err;
			if (error){
				return console.log('Error when deleting file: %s', error);
			}

			init();
		});
}

function moveFileById(sfileid, dfileid){
	superagent
		.get('/fs/moveFile')
		.query({sfileid: sfileid, dfileid: dfileid})
		.end(function (err, res){
			var error = err || res.body.err;
			if (error){
				return console.log('Error when moving file: %s', error);
			}

			init();
		});
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

	superagent
		.get('/fs/getCapacity')
		.end(function (err, res){
			var error = err || res.body.err;
			if (error){
				return console.log(error);
			}

			var capacity = res.body.capacity;
			var usedSpace = Number(capacity.totalSpace) - Number(capacity.totalUsedSpace);

			console.log(res.body.capacity, usedSpace, Number(capacity.totalSpace), Number(capacity.totalUsedSpace))
			editChart(usedSpace, capacity.totalUsedSpace);

			var data = google.visualization.arrayToDataTable([
			  ['State of space allocated', 'Bytes'],
			  ['Used',      Number(capacity.totalUsedSpace)],
			  ['Unused',     Number(capacity.totalSpace) - Number(capacity.totalUsedSpace)]
			]);

			drawChart(data);

			setDriveDetailsTable(capacity.drive);
		});


};



function drawChart(input) {
	var data;
	if (input){
		data = input;
	} else {
		data = google.visualization.arrayToDataTable([
		  ['State of space allocated', 'Bytes'],
		  ['Used',      0],
		  ['Unused',     1]
		]);
	}



	var chart = new google.visualization.PieChart(document.getElementById('piechart'));

	chart.draw(data, options);
}

function editChart(unusedSpace, usedSpace){
	unusedSpace /= (1024 * 1024);
	usedSpace /= (1024 * 1024);

	var data = google.visualization.arrayToDataTable([
	  ['State of space allocated', 'MB'],
	  ['Used space (MB)', parseFloat(usedSpace.toFixed(2))],
	  ['Unused space (MB)', parseFloat(unusedSpace.toFixed(2))]
	]);

	var chart = new google.visualization.PieChart(document.getElementById('piechart'));

	chart.draw(data, options);
}

function setDriveDetailsTable(list){
	var content = '';
	for (var i = 0; i < list.length; i++){
		var item = list[i];
		var icon;
		if (item.platform.toLowerCase() === 'google'){
			icon = '<i class="fa fa-google fa-fw"></i>';
		} else {
			icon = '<i class="fa fa-dropbox fa-fw"></i>'
		}

		content += '<tr>' 
				+ '<td>' + icon + '</td>'
				+ '<td>' + item.email + '</td>'
				+ '</tr>';

	}

	var table = document.querySelector('#drive-details-table > tbody');
	table.innerHTML = content;
}

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
	fileUploadCnt += 1;

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
	    	fileUploadCnt -= 1;
	    	if (fileUploadCnt < 1){
	    		document.querySelector('.navbar-fixed-bottom .alert').style.visibility = "hidden";
	    	}


	    },
	    error: function(){
	    	fileUploadCnt -= 1;
	    	if (fileUploadCnt < 1){
	    		document.querySelector('.navbar-fixed-bottom .alert').style.visibility = "hidden";
	    	}
	    	console.log('Fail to upload file');
	    }
	});
}

function changePWHandler(e){
	e.preventDefault();


	jQuery.ajax({
	    url: '/account/api/changepw',
	    data: $('#change-pw-form').serialize(),
	    cache: false,
	    type: 'POST',
	    success: function(data){
	    	alert('Password has been changed!');

	    },
	    error: function(xhr, error, errorThrown) {  
           if(xhr.status && xhr.status==400){
                alert(JSON.parse(xhr.responseText).err); 
           }else{
               alert("Fail to change password");
           }
          }
	});


	// var form = document.querySelector('#change-pw-form');
	// console.log(serializeFormData(form));

	// superagent
	// 	.post(form.getAttribute('action'))
	// 	.send(serializeFormData(form))
	// 	.end(function (err, res){
	// 		var error = err || res.body.err;
	// 		if (error){
	// 			return console.log('Error when changing pw: %s', error);
	// 		}
	// 	});

}

function fileListHandlers(ele){
	//ele.addEventListener("click", fileListClickHandler);
	ele.addEventListener("dblclick", fileListDblClickHandler);
}

function fileDlLinkHandler(ele){
	ele.addEventListener("click", function(e){
		e.preventDefault();

		var fileid = this.parentNode.getAttribute("fileid");

		/*
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
		*/
		document.getElementById('dl-iframe').src = '/fs/getDownloadLink?fileid=' + fileid;
		document.getElementById('dl-iframe').click();
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



function logoutHandler(e){
	e.preventDefault();

	var form = document.createElement("form");

	form.setAttribute("method", "POST");
	form.setAttribute("action", "/api/logout");

	form.submit();
}

function handleFileSelect(evt) {
	evt.stopPropagation();
	evt.preventDefault();

	var files = evt.dataTransfer.files; // FileList object.
/*
	// files is a FileList of File objects. List some properties.
	var output = [];
	for (var i = 0, f; f = files[i]; i++) {
		output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
      		f.size, ' bytes, last modified: ',
          	f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
          	'</li>');
	}
	document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';
*/
    for (var i=0; i<files.length; i++) {
        sendFile(files[i]);
    }

}

function handleDragOver(evt) {
	evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}

//---------------------  Start of execution of main.js -----------------
init();
google.load("visualization", "1", {packages:["corechart"]});
google.setOnLoadCallback(drawChart);

document.querySelector('#logout-opt').addEventListener("click", logoutHandler);
document.querySelector('#create-folder-modal .confirm-btn').addEventListener("click", createFolderHandler);
document.querySelector('#upload-modal .confirm-btn').addEventListener("click", uploadFileHandler);
document.querySelector('#password-modal .confirm-btn').addEventListener("click", changePWHandler);


document.querySelector('#password-input').addEventListener('change', validate);
document.querySelector('#confirm-password-input').addEventListener('change', validate);


[].forEach.call(document.querySelectorAll('#file-list > tbody > tr'), fileListHandlers);

// Drag and drop upload
var dropZone = document.querySelector('.drop_zone');
dropZone.addEventListener('dragover', handleDragOver, false);
dropZone.addEventListener('drop', handleFileSelect, false);









