'use strtict'

const formComments = document.querySelectorAll('.comments__form');
	divComments = document.querySelector('.comments__body'),
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
	imgInput = document.querySelector('#imgInput'),
	serverUrl = 'https://neto-api.herokuapp.com/pic',
	socketUrl = `wss://neto-api.herokuapp.com/pic/`;

	const ws = new WebSocket(socketUrl);
	let currColor;
	let fileInfo;


//Режим публикации
currentImg.src = '';
//removeComments(); 
//hideEl(burger);
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

//Переключатели
//Меню в режиме рецензирования
showMenu()
function showMenu() {
		
	Array.from(document.querySelectorAll('.mode')).forEach(modeItem => {
		modeItem.dataset.state = '';
		document.querySelector('.menu__item.tool').dataset.state = '';
		modeItem.addEventListener('click', () => {
				menu.dataset.state = 'selected';
				modeItem.dataset.state = 'selected';
				//menu.querySelector('.tool').dataset.state = 'selected';
				//showEl(menu.querySelector('.tool'));
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
	const files = Array.from(event.target.files);

	sendFile(files);
	}

function dropImg(event) {
	hideEl(error);
	event.preventDefault();
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
			fileInfo = res;
			onLoadImg()
		})
		.catch(er => {
			console.log(er);
			hideEl(loader);
		});
}

function onLoadImg() {
if (currentImg.dataset.state === 'load') {
	hideEl(document.querySelector('.new'));
	hideEl(document.querySelector('.draw'));
	hideEl(document.querySelector('.comments'));
	document.querySelector('.menu__item.tool.share-tools').dataset.state = 'selected';
	document.querySelector('.menu').dataset.state = 'selected';
	document.querySelector('.menu__item').dataset.state = 'selected';
	document.querySelector('.menu__url').value = fileInfo.url;
	console.log(fileInfo.id);
	//createMask(); //эта функция, возможно, должна вызываться не здесь, а при получении даннных с локал сторадж (для других пользователей)
	hideEl(error);
}
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


//Получить инфо о файле
function getInfo(id) {
	var xhrGet = new XMLHttpRequest();
	xhrGet.open("GET", serverUrl, false);
	xhrGet.send();
	var data = JSON.parse(xhrGet.responseText);
	console.log(data);

}

/*function createMask(event) {
	//сделать размеры маски по размеру картинки
	//const width = getComputedStyle(wrap.querySelector('.current-image')).width;
	//const height = getComputedStyle(wrap.querySelector('.current-image')).height;
	const mask = document.createElement('div');
	mask.style.width = '100%';
	mask.style.height = '100%';
	mask.style.position = 'absolute';
	mask.style.top = '0';
	mask.style.left = '0';
	mask.style.display = 'block';
	mask.style.zIndex = '1';
	wrap.appendChild(mask);
	//console.log(mask);*/
	
//Клик на экране - комменты

	canvas.addEventListener('click', (event) => {
	event.preventDefault();
	if ((menu.querySelector('.comments').dataset.state === 'selected')&& commOn.checked) {
		showComments();
	}
});

let list = {};
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
  /*return el('div', { class: 'comment-wrap' }, [
    el('div', { class: 'photo', title: comment.author.name }, [
      el('div', { class: 'avatar', style: `background-image: url('${comment.author.pic}')` }, '')
    ]),
    el('div', { class: 'comment-block' }, [
      el('p', { class: 'comment-text' }, comment.text),
      el('div', { class: 'bottom-comment' }, [
        el('div', { class: 'comment-date' }, new Date(comment.date).toLocaleString('ru-Ru')),
        el('ul', { class: 'comment-actions' }, [
          el('li', { class: 'complain' }, 'Пожаловаться'),
          el('li', { class: 'reply' }, 'Ответить')
        ])
      ])
    ])
  ]);*/
}

	
/*
	const formComment = document.createElement('form')
	formComment.classList.add('comments__form');
	formComment.innerHTML = `
		<span class="comments__marker"></span><input type="checkbox" class="comments__marker-checkbox">
		<div class="comments__body">
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


    formComment.style.left = (event.pageX - 5) + "px";
    formComment.top = (event.pageY - 5) + "px";
	canvas.appendChild(formComment);
	console.log('comment');

	//hideEl(formComment.querySelector('.image-loader'));

	//кнопка "закрыть"
	formComment.querySelector('.comments__close').addEventListener('click', () => {
		formComment.querySelector('.comments__marker-checkbox').checked = false;
	});

	// кнопка "отправить"
	//formComment.addEventListener('click', messageSend);
	} 
		
});
*/
/*
const newForm = createElement(formStruct);

	divComments.appendChild(newForm);
	// навешиваем обработчик на кнопку «Добавить» в только что добавленной форме
	newForm.querySelector('.submit-comment').addEventListener('click', submitFormComment);

	// и на кнопку «Закрыть»
	newForm.querySelector('.close-comment').addEventListener('click', closeFormComment);

*/
//Убираем комментарии
function removeComments() {
	//const formComments = wrap.querySelectorAll('.comments__form');
	Array.from(formComments).forEach(form => {form.remove()});
}

//скрыть-открыть комментарии
commOn.addEventListener('click', commentsOn);
commOff.addEventListener('click', commentsOff);

function commentsOff() {
	//const forms = document.querySelectorAll('.comments__form');
	Array.from(formComments).forEach(form => {
		form.style.display = 'none';
	 })
}

function commentsOn() {
	//const forms = document.querySelectorAll('.comments__form');
	Array.from(formComments).forEach(form => {
		form.style.display = '';
	})
}
	 
let timestamp = fileInfo.timestamp;
function getTime(timestamp) {
	const options = {
		day: '2-digit',
		month: '2-digit',
		year: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	};
  const time = new Date(timestamp);
  const timeLine = time.toLocaleString('ru-RU', options);
  let h = ('0' + time.getHours()).slice(-2);
  let m = ('0' + time.getMinutes()).slice(-2);
  	console.log(`${h}:${m}`);
    return `${h}:${m}`;
}


//выбор цвета для рисования

Array.from(menu.querySelectorAll('.menu__color')).forEach(color => {
	 	color.addEventListener('change', () => {
		currColor = document.querySelector('.draw-tools .menu__color:checked').value;
		return currColor;

	});
	 	if (color.checked) {
	 		console.log(currColor); 
			return currColor;}
	
});


//рисование
//Создаем холст 	
let curves = [];
let drawing = false;
let repaint = false;
let brush_radius = 4;
let color = currColor;

//очистка холста
function clearPaint(e) {
	ctx.clearRect(0, 0, canvas.width, canvas.height);   
  	curves = []; 	
}


canvas.width = screen.width;
canvas.height = screen.height;
ctx.clearRect(0, 0, canvas.width, canvas.height); 
canvas.style.zIndex = '1';

canvas.addEventListener('dblclick', () => {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
  	curves = [];
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
  ctx.fillStyle = color;
  ctx.arc(e.offsetX, e.offsetY, brush_radius/2, 0, 2 * Math.PI);
  ctx.fill();
  console.log(color);
}
});

canvas.addEventListener('mousemove', e => { 
  if (!drawing) return;
  curves.push([e.offsetX, e.offsetY])
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = brush_radius;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.moveTo(curves[curves.length-2][0],curves[curves.length-2][1]);
  ctx.lineTo(curves[curves.length-1][0],curves[curves.length-1][1])
  ctx.stroke();
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
canvas.addEventListener('update', e => {
  e.canvas.toBlob(function (blob) {
       ws.send(blob);
  });
});

window.addEventListener('beforeunload', () => { 
	ws.close(); 
	console.log('Веб-сокет закрыт')
	}); 
