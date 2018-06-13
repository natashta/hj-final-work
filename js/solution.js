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
	serverUrl = 'https://neto-api.herokuapp.com',
	socketUrl = 'wss://neto-api.herokuapp.com/pic/';

	let currColor;


//Режим публикации
currentImg.src = '';
removeComments();
//wrap.removeChild(formComments); 
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
/*
document.querySelector('.comments').addEventListener('click', ()=> {
	hideEl(document.querySelector('.new'));
	hideEl(document.querySelector('.draw'));
	hideEl(document.querySelector('.share'));
	document.querySelector('.menu__item.tool.comments-tools').dataset.state = 'selected';
	document.querySelector('.menu').dataset.state = 'selected';
	document.querySelector('.menu__item').dataset.state = 'selected';
});

document.querySelector('.draw').addEventListener('click', ()=> {
	hideEl(document.querySelector('.new'));
	hideEl(document.querySelector('.comments'));
	hideEl(document.querySelector('.share'));
	document.querySelector('.menu__item.tool.draw-tools').dataset.state = 'selected';
	document.querySelector('.menu').dataset.state = 'default';
	document.querySelector('.menu__item').dataset.state = 'selected';
	document.querySelector('.menu[data-state="default"] > .mode').dataset.state = 'selected';
});

document.querySelector('.share').addEventListener('click', ()=> {
	hideEl(document.querySelector('.new'));
	hideEl(document.querySelector('.draw'));
	hideEl(document.querySelector('.comments'));
	document.querySelector('.menu__item.tool.share-tools').dataset.state = 'selected';
	document.querySelector('.menu').dataset.state = 'selected';
	document.querySelector('.menu__item').dataset.state = 'selected';
});
*/


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
	formData.append('load', 'load');
	currentImg.src = URL.createObjectURL(file);
	currentImg.addEventListener('load', event => {
	URL.revokeObjectURL(event.target.src);
	currentImg.dataset.state = 'load'
	
});
} else {
	showEl(error);
}
});

const xhr = new XMLHttpRequest();
xhr.open('POST', serverUrl);
xhr.addEventListener('load', () => {
	if (xhr.status === 200) {
		console.log('load')
	}
	});
xhr.addEventListener("error", () => {
	showEl(error);
});
xhr.addEventListener('loadstart', () => {
	showEl(loader);
});
xhr.addEventListener('loadend', () => {
	hideEl(loader);
	onLoadImg();
});
xhr.send(formData);
}

function onLoadImg() {
if (currentImg.dataset.state === 'load') {
	hideEl(document.querySelector('.new'));
	hideEl(document.querySelector('.draw'));
	hideEl(document.querySelector('.comments'));
	document.querySelector('.menu__item.tool.share-tools').dataset.state = 'selected';
	document.querySelector('.menu').dataset.state = 'selected';
	document.querySelector('.menu__item').dataset.state = 'selected';
}
}

//Логика: после загрузки картинки клик в любом месте холста(картинки) 
//открывает функцию комментирования либо функцию рисования в зависимости от открытого пункта меню
canvas.addEventListener('click', (event) => {
	event.preventDefault();
	if ((menu.querySelector('.comments').dataset.state === 'selected')|| commOn.checked) {
	console.log('comments on');
	}
})

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

//Клик на экране - комменты. Надо создать форму для комментов и при клике ее аппенд.


//выбор цвета для рисования
Array.from(menu.querySelectorAll('.menu__color')).forEach(color => {
	 	color.addEventListener('change', () => {
	 		if (color.checked) {
		currColor = document.querySelector('.draw-tools input[type="radio"]:checked').value;
		return currColor;
		}
	});
	console.log(currColor); 
	return currColor;	
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
const ws = new WebSocket(socketUrl);

canvas.addEventListener('update', e => {
  e.canvas.toBlob(function (blob) {
       ws.send(blob);
  });
});
