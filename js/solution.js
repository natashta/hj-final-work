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
	serverUrl = 'https://neto-api.herokuapp.com/pic',
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
	currentImg.src = URL.createObjectURL(file);
	currentImg.addEventListener('load', event => {
		URL.revokeObjectURL(event.target.src);
		currentImg.dataset.state = 'load'
	});
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
			localStorage.setItem('fileId', id);
			localStorage.setItem('fileUrl', url);
			//getInfo(res.id);
			onLoadImg()
		})
		.catch(er => {
			console.log(er);
			hideEl(loader);
		});
}


function onLoadImg() {
if (currentImg.dataset.state === 'load') {
	var id = localStorage.getItem('fileId');
	var url = localStorage.getItem('fileUrl');
	hideEl(document.querySelector('.new'));
	hideEl(document.querySelector('.draw'));
	hideEl(document.querySelector('.comments'));
	document.querySelector('.menu__item.tool.share-tools').dataset.state = 'selected';
	document.querySelector('.menu').dataset.state = 'selected';
	document.querySelector('.menu__item').dataset.state = 'selected';
	document.querySelector('.menu__url').value = url; //не та ссылка  
	hideEl(error);
	hideEl(loader);
	showEl(burger);
	removeForms();
	clearPaint();
	openWs();
}
}

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

/*
//Получить инфо о файле
function getInfo(id) {
	var xhrGet = new XMLHttpRequest();
	xhrGet.open("GET", `${serverUrl}/${id}`, false);
	xhrGet.send();

	var data = JSON.parse(xhrGet.responseText);
	console.log(data);
	openWs();
}
*/

canvas.addEventListener('click', () => {
	if (menu.querySelector('.draw').dataset.state === 'selected') {
		wrap.dataset.state = 'drawing';
	}
	else if ((menu.querySelector('.comments').dataset.state === 'selected')|| commOn.checked) {
		wrap.dataset.state = 'comments';
	 }
});

/*	
//Клик на экране - комменты
	canvas.addEventListener('click', (event) => {
	event.preventDefault();
	if ((menu.querySelector('.comments').dataset.state === 'selected')|| commOn.checked) {
		wrap.dataset.state = 'comments';
		//document.createElement('div').appendChild(createComment(event.offsetX, event.offsetY));
		//showComments();
	}
	else return;
});
*/

/*
function showComments(list) {
  const comments = list.map(createComment);
  const fragment = list.reduce((frag, elem) => {
    frag.appendChild(createComment(elem)) 
       return frag;
    }, document.createDocumentFragment());
  canvas.appendChild(fragment);
 }

function el(tagName, attributes, children) {
  const element = document.createElement(tagName);
  if (typeof attributes === 'object') {
    Object.keys(attributes).forEach(i => element.setAttribute(i, attributes[i]));
  }
  if (typeof children === 'string') {
    let strings = children.split('\n');
    const fragment = strings.reduce((fragment, currentValue, i) => {
      if (strings.length === 1) {
        fragment.textContent = currentValue;
      } else {
        fragment.appendChild(document.createTextNode(currentValue));
        if (i !== strings.length - 1) {
          fragment.appendChild(document.createElement('br'));
        }
      }
      return fragment;
    }, document.createDocumentFragment());
    element.appendChild(fragment);
  } else if (children instanceof Array) {
    children.forEach(child => element.appendChild(child));
  }
  return element;
}

function createComment(comment) {
	console.log(comment.text);

	return el('span', {class: 'comments__marker'}),
	el ('input', { class: 'comments__marker-checkbox',type: 'checkbox'});
  	el('div', { class: 'comments__body' }, [
    	el('div', { class: 'comment'}, [
    		el('p', { class: 'comment__time'}, new Date(comment.date).toLocaleString('ru-Ru')),
    		el('p', { class: 'comment__message'}, )
    ]),
    ]),
    el('div', { class: 'comment'}, [
		el('div', { class: 'loader'}, [
			el('span'),
			el('span'),
			el('span'),
			el('span'),
		])
    ])
    el('textarea', { class: 'comments__input', type: 'text'}),
	el('input', { class: 'close-comment', type: 'button'}, 'Закрыть'), 
	el('input', { class: 'submit-comment', type: 'submit'}, 'Отправить');
}
*/

function createCommentForm(event){
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

canvas.addEventListener('click', createCommentForm);	


// Отправляем комментарий на сервер. Не работает, все время network error
function sendMessage(event) {
	event.preventDefault();
	formComment = document.querySelector('.comments__form');
	formComment.querySelector('textarea').addEventListener('input', () => {
		showEl(formComment.querySelector('.loader'));
	});
	const message = formComment.querySelector('.comments__input').value;

	const formData = new FormData();
	formData.append('message', message);
	formData.append('top', localStorage.getItem('top'));
	formData.append('left', localStorage.getItem('left'));
	showEl(formComment.querySelector('.loader'));

	var id = localStorage.getItem('fileId');

		fetch(`${socketUrl}${id}/comments`, {
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
				formComment.querySelector('.comments__input').value = '';
				hideEl(formComment.querySelector('.loader'));
				console.log(res);
			})
			.catch(er => {
				console.log(er);
			});
	}

//Добавление нашего комментария в форму
function addComment(message, form) {
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

//добавление полученного комментария
//Надо проверить, есть ли форма с такими координатами. Если есть, вставить туда текст, если нет - создать форму и вставить текст
function checkForm() {

}

function addComment() {

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
function openWs() {
	var id = localStorage.getItem('fileId');
	ws = new WebSocket(`${socketUrl}${id}`);
	ws.addEventListener('message', event => {
		if (JSON.parse(event.data).event === 'pic'){
			document.querySelector('.menu__url').value = JSON.parse(event.data).pic.url;
		}

		if (JSON.parse(event.data).event === 'comment'){
			//addComment(JSON.parse(event.data).comment;
			//получаем json с текстом и координатами. Надо проверить, есть ли форма с такими координатами
			console.log('comm');		
		}

		if (JSON.parse(event.data).event === 'mask'){
			canvas.style.background = `url(${JSON.parse(event.data).mask.url})`; 
			//вроде как это прозрачный слой со штрихами. Должен отображаться поверх нашего img
			console.log('mask');
		}
	});
}

//выбор цвета для рисования
 Array.from(menu.querySelectorAll('.menu__color')).forEach(color => {
	 	color.addEventListener('change', () => {
	 	wrap.dataset.state = 'drawing';
	 	/*if (document.querySelector('.mask')) {
	 		hideEl(document.querySelector('.mask'));

	 	}*/
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
})

function tick () {
  if (repaint) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    repaint = false;
  }
  window.requestAnimationFrame(tick);
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
	console.log('Веб-сокет закрыт')
	}); 

