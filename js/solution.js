'use strtict'

const formComments = document.querySelectorAll('.comments__form');
	commOn = document.querySelector('#comments-on'),
	commOff = document.querySelector('#comments-off'),
	wrap = document.querySelector('.wrap'),
	menu = document.querySelector('ul.menu'),
	burger = document.querySelector('.burger'),
	currentImg = document.querySelector('.current-image'),
	error = document.querySelector('.error'),
	loader = document.querySelector('.image-loader'),
	canvas = document.querySelector('#canvas'),
	ctx = canvas.getContext('2d'),
	mask = document.querySelector('.mask'),
	serverUrl = 'https://neto-api.herokuapp.com/pic/',
	socketUrl = 'wss://neto-api.herokuapp.com/pic/';

	let ws;
	let currColor;

//Режим публикации
currentImg.src = '';
wrap.removeChild(document.querySelector('.comments__form'));
hideEl(burger);
hideEl(document.querySelector('.comments'));
hideEl(document.querySelector('.draw'));
hideEl(document.querySelector('.share'));


function hideEl(el) {
	el.style.display = 'none';
}

function showEl(el) {
	el.style.display = '';
}

burger.addEventListener('click', burgerWrap)

function burgerWrap() {
	menu.dataset.state = 'default';
	menu.querySelector('.menu__item').dataset.state = 'default';

	Array.from(menu.querySelectorAll('.mode')).forEach(modeItem => {
		modeItem.dataset.state = '';
		showEl(modeItem);
	})
	
	Array.from(document.querySelectorAll('.tool')).forEach(toolItem => toolItem.dataset.state = '');
}

//Меню в режиме рецензирования
showMenu()
function showMenu() {
	Array.from(document.querySelectorAll('.mode')).forEach(modeItem => {
		modeItem.dataset.state = '';
		document.querySelector('.menu__item.tool').dataset.state = '';
		modeItem.addEventListener('click', () => {
				menu.dataset.state = 'selected';
				modeItem.dataset.state = 'selected';
		})
	})
}


// Перемещение меню
let movedPiece = null;
let minY, minX, maxX, maxY;
let shiftX = 0;
let shiftY = 0;

document.addEventListener('mousedown', dragStart);
document.addEventListener('mousemove', dragMenu);
document.addEventListener('mouseup', dropMenu);
document.addEventListener('touchstart', event => dragStart(event.changedTouches[0]));
document.addEventListener('touchmove', event => dragMenu(event.changedTouches[0].pageX, event.changedTouches[0].pageY));
document.addEventListener('touchend', event => dropMenu(event.changedTouches[0]));

function dragStart(event) {
	if (event.target.classList.contains('drag')) {
	movedPiece = event.target.parentElement;
	minX = wrap.offsetLeft;
	minY = wrap.offsetTop;
	maxX = wrap.offsetLeft + wrap.offsetWidth - movedPiece.offsetWidth;
	maxY = wrap.offsetTop + wrap.offsetHeight - movedPiece.offsetHeight;
	shiftX = event.pageX - event.target.getBoundingClientRect().left - window.pageXOffset;
	shiftY = event.pageY - event.target.getBoundingClientRect().top - window.pageYOffset;
}
}

function dragMenu(event) {
	if (movedPiece) {
	event.preventDefault();
	let x = event.pageX - shiftX;
	let y = event.pageY - shiftY;
	x = Math.min(x, maxX);
	y = Math.min(y, maxY);
	x = Math.max(x, minX);
	y = Math.max(y, minY);
	movedPiece.style.left = x + 'px';
	movedPiece.style.top = y + 'px';
}
}

function dropMenu(event) {
	if (movedPiece) {
		movedPiece = null;
	}
}

//загрузка картинки
menu.querySelector('.new').addEventListener('change', loadImg);
wrap.addEventListener('drop', dropImg); 
wrap.addEventListener('dragover', event => event.preventDefault()); 

function loadImg(event) {
	hideEl(error);
	showEl(loader);
	const files = Array.from(event.target.files);
	sendFile(files);
}

function dropImg(event) {
	if ((wrap.dataset.state === 'drawing') || (wrap.dataset.state === 'comments')) {return};
	event.preventDefault();
	hideEl(error);
	showEl(loader);
	const files = Array.from(event.dataTransfer.files);

	if (currentImg.dataset.state === 'load') {
		showEl(error);
		error.lastElementChild.textContent = 'Чтобы загрузить новое изображение, пожалуйста, воспользуйтесь пунктом "Загрузить новое" в меню';
		return;
	}
	sendFile(files);
}

function sendFile(files) {
const formData = new FormData();
	
files.forEach(file => {
	if ((file.type === 'image/jpeg') || (file.type === 'image/png')) {
	formData.append('image', file);
	formData.append('title', file.name);
	/*currentImg.src = URL.createObjectURL(file);
	currentImg.addEventListener('load', event => {
		URL.revokeObjectURL(event.target.src);
		currentImg.dataset.state = 'load'
	});*/
} else {
	showEl(error);
}
});

fetch(serverUrl, {
		body: formData,
		credentials: 'same-origin',
		method: 'POST'
		})
		.then( res => {
			if (res.status >= 200 && res.status < 300) {
				return res;
			}
			throw new Error (res.statusText);
		})
		.then(res => res.json())
		.then(res => {
			var id = res.id;
			var url = res.url;
			document.querySelector('.menu__url').value = `${location.origin + location.pathname}?${id}`;
			localStorage.setItem('fileId', id);
			localStorage.setItem('fileUrl', url);
			onLoadImg();
		})
		.catch(er => {
			console.log(er);
			hideEl(loader);
		});
}

// Получаем информацию о файле
function getInfo(id) {
	const xhrGet = new XMLHttpRequest();
	xhrGet.open(
		'GET',
		`${serverUrl}${id}`,
		false
	);
	xhrGet.send();

	getData = JSON.parse(xhrGet.responseText);
	console.log(xhrGet.responseText);
	getNewComments(getData.comments);
}

function onLoadImg() {
//if (currentImg.dataset.state === 'load') {
	var id = localStorage.getItem('fileId');
	var url = localStorage.getItem('fileUrl');
	hideEl(document.querySelector('.new'));
	hideEl(document.querySelector('.draw'));
	hideEl(document.querySelector('.comments'));
	document.querySelector('.menu__item.tool.share-tools').dataset.state = 'selected';
	document.querySelector('.menu').dataset.state = 'selected';
	document.querySelector('.menu__item').dataset.state = 'selected';
	currentImg.src = url;
	//document.querySelector('.menu__url').value = url; //не та ссылка  
	hideEl(error);
	hideEl(loader);
	showEl(burger);
	removeForms();
	clearPaint();
	getInfo(id);
	openWs(id);
}
//}

// удаление комментов при загрузке нового изображения
function removeForms() {
	const formComments = document.querySelectorAll('.comments__form');
	Array.from(formComments).forEach(form => {
		form.remove()
	});
}

//копируем урл картинки в буфер
document.querySelector('.menu_copy').addEventListener('click', (event) => {
	menu.querySelector('.menu__url').select();
    
  try {  
    var successful = document.execCommand('copy');  
    var msg = successful ? 'successful' : 'unsuccessful';  
    console.log('Copy link command was ' + msg);  
  } catch(err) {  
    console.log('Oops, unable to copy');  
  }  
    window.getSelection().removeAllRanges(); 
	});

canvas.addEventListener('click', () => {
	if (menu.querySelector('.draw').dataset.state === 'selected') {
		wrap.dataset.state = 'drawing';
	}
	else if ((menu.querySelector('.comments').dataset.state === 'selected')|| commOn.checked) {
		wrap.dataset.state = 'comments';
	 }
});


/*function createCommentForm(event){
	event.preventDefault();
	if (!(menu.querySelector('.comments').dataset.state === 'selected')|| !commOn.checked) { return;}
	wrap.dataset.state = 'comments';
	//показываем форму только последнего коммента
	if(document.querySelector('.comments__form')) {
		Array.from(document.querySelectorAll('.comments__form')).forEach(form => {
			form.querySelector('.comments__body').style.display = 'none';
			});
	}
	let formComment = document.createElement('form')
	formComment.classList.add('comments__form');
	formComment.innerHTML = `
		<span class="comments__marker"></span><input type="checkbox" class="comments__marker-checkbox">
		<div class="comments__body">
		<div class="comment">
            <p class="comment__time"></p>
            <p class="comment__message"></p>
          </div>
			<div class="comment">
				<div class="loader">
					<span></span>
					<span></span>
					<span></span>
					<span></span>
					<span></span>
				</div>
			</div>
			<textarea class="comments__input" type="text" placeholder="Напишите ответ..."></textarea>
			<input class="comments__close" type="button" value="Закрыть">
			<input class="comments__submit" type="submit" value="Отправить">
		</div>`;

    formComment.style.left = (event.pageX) + "px";
    formComment.style.top = (event.pageY) + "px";
    formComment.style.zIndex = '3';
    formComment.style.display = 'block';
	formComment.style.position = 'absolute';
	formComment.querySelector('.comments__body').style.display = 'block';

	localStorage.setItem('top', (formComment.style.top).replace(/\D/g, ""));
	localStorage.setItem('left', (formComment.style.left).replace(/\D/g, ""));
	wrap.insertBefore(formComment, canvas);

	//кнопка "закрыть"
	formComment.querySelector('.comments__close').addEventListener('click', () => {
		formComment.querySelector('.comments__marker-checkbox').checked = false;
		formComment.querySelector('.comments__body').style.display = 'none';
	});

	// кнопка "отправить" 
	formComment.querySelector('.comments__submit').addEventListener('click', sendMessage);
	formComment.querySelector('.comments__input').addEventListener('keydown', (event) => {
		if (event.keyCode === 13) {
			sendMessage();
		}
	});
}
*/
canvas.addEventListener('click', createNewComment);

function createNewComment(event) {
   event.preventDefault();
	if (!(menu.querySelector('.comments').dataset.state === 'selected')|| !commOn.checked) { return;}
	wrap.dataset.state = 'comments';
	//показываем форму только последнего коммента
	if(document.querySelector('.comments__form')) {
		Array.from(document.querySelectorAll('.comments__form')).forEach(form => {
			form.querySelector('.comments__body').style.display = 'none';
			});
	}

        const form = document.createElement('div');
        form.className = 'comments__form new';

        const marker = document.createElement('span');
        marker.className = 'comments__marker';

        const commentsBody = document.createElement('div');
        commentsBody.className = 'comments__body';

        const createMessage = document.createElement('div');
        createMessage.className = 'comment';

        const loader = document.createElement('div');
        loader.className = 'loader';

        const span = document.createElement('span');

        const commentsInput = document.createElement('textarea');
        commentsInput.className = 'comments__input';
        commentsInput.setAttribute('type', 'text');
        commentsInput.setAttribute('placeholder', 'Напишите ответ...');

        const commentsClose = document.createElement('input');
        commentsClose.className = 'comments__close';
        commentsClose.type = 'button';
        commentsClose.value = 'Закрыть';

        const commentsSubmit = document.createElement('input');
        commentsSubmit.className = 'comments__submit';
        commentsSubmit.type = 'submit';
        commentsSubmit.value = 'Отправить';

        createMessage.appendChild(loader);
        loader.appendChild(span);
        loader.appendChild(span);
        loader.appendChild(span);
        commentsBody.appendChild(createMessage);
        commentsBody.appendChild(commentsInput);
        commentsBody.appendChild(commentsClose);
        commentsBody.appendChild(commentsSubmit);

        form.style.left = event.pageX + 'px';
        form.style.top = event.pageY + 'px';
     
        form.appendChild(marker);
        form.appendChild(commentsBody);
        wrap.appendChild(form);
  
        commentsBody.style.zIndex = '3';
    	commentsBody.style.display = 'block';
		commentsBody.style.position = 'absolute';
		marker.style.zIndex = '4';

        //кнопка "закрыть"
		form.querySelector('.comments__close').addEventListener('click', () => {
			form.querySelector('.comments__body').style.display = 'none';
	});

		// кнопка "отправить" 
		form.querySelector('.comments__submit').addEventListener('click', createComment);
		form.querySelector('.comments__input').addEventListener('keydown', (event) => {
			if (event.keyCode === 13) {
			createComment();
		}
	});
 }	


//Создание объекта нового коммента
function createComment(event) {
	event.preventDefault();

    const elem = event.target.parentNode.querySelector('textarea');
    const form = event.target.parentNode.parentNode;
    if (elem.value) {
    	var id = localStorage.getItem('fileId');
        const comment = {'message': elem.value, 'left': parseInt(form.style.left), 'top': parseInt(form.style.top)};
        sendComment(id, comment, form);
        //addComments(comment);
        elem.value = '';
    }
}

// Отправляем комментарий на сервер.
function sendComment(id, comment, form){
	const formData = new FormData();
	formData.append('message', comment.message);
	formData.append('top', comment.top);
	formData.append('left', comment.left);
	showEl(form.querySelector('.loader'));
	console.log(`${serverUrl}${id}/comments`);

		fetch(`${serverUrl}${id}/comments`, {
				method: 'POST',
				body: formData,
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
				},
			})
			.then( res => {
				if (res.status >= 200 && res.status < 300) {
					return res;
				}
				throw new Error (res.statusText);
			})
			.then(res => res.json())
			.then(res => {
				hideEl(form.querySelector('.loader'));
				console.log(res);
				//createCommentsList(res.comments);
			})
			.catch(er => {
				console.log(er);
			});
	}

function createCommentsList(comments) {
    const commentArr = [];
    console.log(comments)
    for (const comment in comments) {
        commentArr.push(comments[comment]);
    }
    createCommentForm(commentArr);
}

//Добавление нашего комментария в форму
/*
function addComment(elem, target) {
    const comments = target.querySelector('.comments__body').querySelectorAll('.comment');
    if (target) {
        target.querySelector('.comments__body').insertBefore(elem, target.querySelector('.load'));
        target.querySelector('.comments__body').style.display = 'block';
    }
}
*/

function addComments(comments) {
	let loaderDiv = form.querySelector('.loader').parentElement;

	const newMessageDiv = document.createElement('div');
	newMessageDiv.classList.add('comment');
	newMessageDiv.dataset.timestamp = message.timestamp;
		
	const time = document.createElement('p');
	time.classList.add('comment__time');
	time.textContent = getDate(message.timestamp);
	newMessageDiv.appendChild(time);

	const commentMessage = document.createElement('p');
	commentMessage.classList.add('comment__message');
	commentMessage.textContent = message.message;
	newMessageDiv.appendChild(commentMessage);

	form.querySelector('.comments__body').insertBefore(newMessageDiv, loaderDiv);
}

//добавляем полученные комментарии в форму. Событие comment - получаем json с текстом и координатами.
//Надо проверить, есть ли форма с такими координатами. Если есть, вставить туда текст, если нет - создать форму и вставить текст
function getNewComments(newComment) {
	if (!newComment) return;
	Object.keys(newComment).forEach(id => {
		//добавляем полученный коммент в существующую форму
		Array.from(wrap.querySelectorAll('.comments__form')).forEach(form => {
			if (form.dataset.left === newComments[id].left && form.dataset.top === newComments[id].top) {
				form.querySelector('.loader').style.display = 'none';
				addMessageComment(newComment[id], form); 
			} else {
				//создаем форму и добавляем коммент
				newForm.dataset.left = newComment[id].left;
				newForm.dataset.top = newComment[id].top;
				newForm.style.left = newComment[id].left + 'px';
				newForm.style.top = newComment[id].top + 'px';
				wrap.insertBefore(newForm, canvas);
				addComment(newComment[id], newForm);

			if (commOff.checked) {
				newForm.style.display = 'none';
			}
			}
		});
		});
}

// надо скрыть остальные формы при клике на маркер
wrap.addEventListener('click', switchForms)

function switchForms(event) {
	if (!event.target.classList.contains('comments__marker-checkbox')) return;
	if (event.target.nextElementSibling.style.display === 'block') return;

	Array.from(document.querySelectorAll('.comments__form')).forEach(form => {
			form.querySelector('.comments__body').style.display = 'none';
	});
	event.target.closest('form.comments__form').querySelector('.comments__body').style.display = 'block';
}

//скрыть-открыть комментарии
commOn.addEventListener('click', commentsOn);
commOff.addEventListener('click', commentsOff);

function commentsOff() {
	const formComments = document.querySelectorAll('.comments__form');
	Array.from(formComments).forEach(form => {
		form.style.display = 'none';
	 })
}

function commentsOn() {
	const formComments = document.querySelectorAll('.comments__form');
	Array.from(formComments).forEach(form => {
		form.style.display = '';
	})
}

function getDate(timestamp) {
	const options = {
		day: '2-digit',
		month: '2-digit',
		year: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	};
	const date = new Date(timestamp);
	const dateStr = date.toLocaleString('ru-RU', options);
	return dateStr.slice(0, 8) + dateStr.slice(9);
}

// веб сокет
function openWs(id) {
	ws = new WebSocket(`${socketUrl}${id}`);
	ws.addEventListener('open', () => console.log('Connection ws open'));
	ws.addEventListener('message', event => {
		if (JSON.parse(event.data).event === 'pic'){
			document.querySelector('.menu__url').value = JSON.parse(event.data).pic.url;
			console.log('pic');
		}

		if (JSON.parse(event.data).event === 'comment'){
			getNewComments(JSON.parse(event.data).comment);
			//получаем json с текстом и координатами. Надо проверить, есть ли форма с такими координатами
			console.log('comm');		
		}

		if (JSON.parse(event.data).event === 'mask'){
			mask.src = JSON.parse(event.data).mask.url; 
			console.log('mask');
		}
	});
}

//выбор цвета для рисования
 Array.from(menu.querySelectorAll('.menu__color')).forEach(color => {
	 	color.addEventListener('change', () => {
	 	wrap.dataset.state = 'drawing';
		currColor = document.querySelector('.draw-tools .menu__color:checked').value;
		if (color.checked) {
			return currColor;
	}
	});	
});

//рисование
//Создаем холст 	
let curves = [];
let drawing = false;
let repaint = false;
let brush_radius = 4;

//очистка холста
function clearPaint(e) {
	ctx.clearRect(0, 0, canvas.width, canvas.height);   
  	curves = []; 	
}

canvas.width = screen.width;
canvas.height = screen.height;
ctx.clearRect(0, 0, canvas.width, canvas.height); 
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.display = 'block';
canvas.style.position = 'absolute';
canvas.style.zIndex = '2';

mask.width = screen.width;
mask.height = screen.height;
mask.style.top = '0';
mask.style.left = '0';
mask.style.display = 'block';
mask.style.position = 'absolute';
mask.style.zIndex = '1';

canvas.addEventListener('dblclick', () => {
	clearPaint();
  	repaint = true;
})
canvas.addEventListener('mouseup', () => {
  drawing = false;
})
canvas.addEventListener('mouseleave', () => {
  drawing = false;
})


canvas.addEventListener('mousedown', e => {
	e.preventDefault();
	if (menu.querySelector('.draw').dataset.state === 'selected') {
  curves.push([e.offsetX, e.offsetY]);
  drawing = true;
  ctx.beginPath();
  ctx.fillStyle = currColor;
  ctx.arc(e.offsetX, e.offsetY, brush_radius/2, 0, 2 * Math.PI);
  ctx.fill();
}
else return;
});

canvas.addEventListener('mousemove', e => { 
  if (!drawing) return;
  curves.push([e.offsetX, e.offsetY])
  ctx.beginPath();
  ctx.strokeStyle = currColor;
  ctx.lineWidth = brush_radius;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.moveTo(curves[curves.length-2][0],curves[curves.length-2][1]);
  ctx.lineTo(curves[curves.length-1][0],curves[curves.length-1][1])
  ctx.stroke();
  setInterval(tick, 1000);
});

//ресайз холста
window.addEventListener('resize', function(e) {
	canvas.width = screen.width;
	canvas.height = screen.height;
	ctx.clearRect(0, 0, canvas.width, canvas.height);   
	curves = []; 
	mask.width = screen.width;
	mask.height = screen.height;
})

function tick () {
  if (repaint) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    repaint = false;
  }
  setTimeout(function() {  
    window.requestAnimationFrame(tick);
  }, 1000);
}

//посылаем данные рисования на сервер
var id = localStorage.getItem('fileId');
ws = new WebSocket(`${socketUrl}${id}`);

canvas.addEventListener('update', e => {
  e.canvas.toBlob(function (blob) {
       ws.send(blob);
       console.log('paint send');
  });
});

window.addEventListener('beforeunload', () => { 
	ws.close(); 
	localStorage.clear();
	console.log('Веб-сокет закрыт')
	}); 

