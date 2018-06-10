'use strtict'

const commOn = document.querySelector('#comments-on'),
	commOff = document.querySelector('#comments-off'),
	wrap = document.querySelector('.wrap'),
	menu = document.querySelector('ul.menu'),
	burger = document.querySelector('.burger'),
	//drag = document.querySelector('.drag'),
	currentImg = document.querySelector('.current-image'),
	error = document.querySelector('.error'),
	loader = document.querySelector('.image-loader'),
	canvas = document.querySelector('#canvas'),
	ctx = canvas.getContext('2d'),
	divComments = document.querySelector('.comments__body'),
	imgInput = document.querySelector('#imgInput'),
	serverUrl = 'https://neto-api.herokuapp.com',
	socketUrl = 'wss://neto-api.herokuapp.com/pic/';


//Состояние Публикация
currentImg.src = '';
wrap.removeChild(document.querySelector('.comments__form')); 
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

//меню
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

//переключение меню
showMenu()
function showMenu() {
	Array.from(document.querySelectorAll('.mode')).forEach(modeItem => {
		modeItem.dataset.state = '';
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
	showTools();
});

document.querySelector('.draw').addEventListener('click', ()=> {
	hideEl(document.querySelector('.new'));
	hideEl(document.querySelector('.comments'));
	hideEl(document.querySelector('.share'));
	showTools();
});

document.querySelector('.share').addEventListener('click', ()=> {
	hideEl(document.querySelector('.new'));
	hideEl(document.querySelector('.draw'));
	hideEl(document.querySelector('.comments'));
	showTools();
});

function showTools() {
	showEl(burger);
	document.querySelector('.menu').dataset.state = 'selected';
	document.querySelector('.menu__item').dataset.state = 'selected';
	document.querySelector('.menu__item.tool').dataset.state = 'selected';
	showEl(document.querySelector('.tool'));
}
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
		console.log('nope!')
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
		//canvas.style.backgroundImage=`url(${URL.createObjectURL(file)})`;
		currentImg.src = URL.createObjectURL(file);
		currentImg.addEventListener('load', event => {
		URL.revokeObjectURL(event.target.src);
	} else {
		showEl(error);	
	}
});

const xhr = new XMLHttpRequest();
xhr.open('POST', serverUrl);
xhr.addEventListener('load', () => {
	if (xhr.status === 200) {
		console.log(`Файл сохранен`);
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
});
xhr.send(formData);
}

function setcurrentImage(fileInfo) {
	currentImg.src = fileInfo.url;
}

//рисование
//Создаем холст для рисования	
let curves = [];
let drawing = false;
let needsRepaint = false;
let brush_radius = 4;

//очистка холста
function clearPaint(e) {
	ctx.clearRect(0, 0, canvas.width, canvas.height);   
  	curves = []; 	
}

canvas.width = screen.width;
canvas.height = screen.height;
ctx.clearRect(0, 0, canvas.width, canvas.height); 

window.addEventListener('resize', function(e) {
	canvas.width = screen.width;
	canvas.height = screen.height;
	ctx.clearRect(0, 0, canvas.width, canvas.height);   
	curves = []; 
});
