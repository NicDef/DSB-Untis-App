'use strict';

// Eine Nachricht vom Server erhalten
const socket = io();

var dsbDataRaw;
var dsbData;

socket.on('data', async (data) => {
	dsbDataRaw = await JSON.parse(data);
	dsbData = formatData(dsbDataRaw[0]);
});

const selectedClass = document.getElementById('selectClass');
const container = document.getElementById('container');

const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

var today = new Date();
var dd = String(today.getDate()).padStart(2, '0');
var m = String(today.getMonth() + 1); //January is 0!
var yyyy = today.getFullYear();

today = dd + '.' + m + '.' + yyyy;
var day = days[new Date().getDay()];
const defaultDate = today + ' ' + day;

function showData(dataDate = defaultDate) {
	if (dsbData == undefined || dsbDataRaw == undefined) return;

	console.log(dsbData);

	const myClazz = selectedClass.value;

	setLocalStorage(myClazz);

	var lastUpdate = dsbDataRaw[0]['dateString'];
	for (let i = 0; i < dsbData.length; i++) {
		if (dsbData[i][1] == dataDate) {
			try {
				const tableElem = document.getElementById('table');
				container.removeChild(tableElem);
			} catch {}

			var table = [...dsbData[i][0]];
			createTable(table, myClazz, dataDate, lastUpdate);
			return;
		}
	}
}

function createTable(table, selectedClass, date, lastUpdate) {
	var tableElem = document.createElement('table'); // Tabelle erstellen
	tableElem.classList.add('table');
	tableElem.id = 'table';
	tableElem.classList.add('table' + selectedClass);
	tableElem.classList.add('table-xs');
	var tableBody = document.createElement('tbody'); // TBody erstellen

	fillTableHead(tableBody, selectedClass, date, lastUpdate); // Tabellenkopf mit Klasse und Datum füllen

	let wantedRows = [];
	let sortedRows = [];

	// Über jede Reihe des Datensatzes iterieren
	for (let i = 0; i < table.length; i++) {
		if (!isWantedClass(table[i][0], selectedClass)) continue; // Die aktuelle Reihe nur zur Darstellung verwenden, wenn die Klasse dieser Reihe, mit der ausgewählten Klasse übereinstimmt

		table[i] = removeNameOfClass(table[i], table[i][0]); // Den Klassenname am Anfang der Reihe löschen, um Probleme mit dem Sortieren nach Unterrichtstunde zu vermeiden!

		wantedRows.push(table[i]); // Diese Reihe mit zur Sortierung hinzufügen
	}

	sortedRows = sortRowsByLesson(wantedRows); // Die zu verwendenden Reihen nach den Unterrichtsstunden sortieren

	// Für jede sortierte Reihe
	for (let k = 0; k < sortedRows.length; k++) {
		var row = document.createElement('tr'); // Eine neue Reihe erstellen

		// Nach dieser Schleife ist eine Reihe gefüllt
		for (let j = 0; j < 4; j++) {
			// 4 Zellen pro Reihe erstellen
			var cell = document.createElement('td');
			var textNodeToAppend = fillCell(sortedRows[k], cell, j); // Die jeweilige Zelle mit dem richtigen Wert füllen
			try {
				cell.appendChild(textNodeToAppend); // Den erworbenen Wert in die Zelle schreiben
				row.appendChild(cell); // Die Zelle an die Reihe anhängen
			} catch (err) {
				console.error(err);
				return;
			}
		}
		tableBody.appendChild(row); // Die Reihe an den Tbody anhängen
	}

	// fillTableFooter(tableBody, info);

	tableElem.appendChild(tableBody);
	container.appendChild(tableElem);
}

/**
 * Removes the class name at the beginning of the row
 * @param {*} row The row
 * @param {*} clazz The class name that was chosen at the beginning
 * @returns The row without it's first element (the class name)
 */
function removeNameOfClass(row, clazz) {
	const rowCopy = [...row];
	for (let i = 0; i < rowCopy.length; i++) {
		if (rowCopy[i] === clazz) {
			rowCopy.splice(i, 1);
		}
	}

	return rowCopy;
}

/**
 * Removes HTML tags.
 *
 * @param {*} arr The selected row
 * @returns The row without some HTML tags
 */
function removeHTML(arr) {
	var arrC = [...arr];
	for (let i = 0; i < arrC.length; i++) {
		arrC[i] = arrC[i].replace('<b>', '');
		arrC[i] = arrC[i].replace('</b>', '');
		arrC[i] = arrC[i].replace('<u>', '');
		arrC[i] = arrC[i].replace('</u>', '');
		arrC[i] = arrC[i].replace('<i>', '');
		arrC[i] = arrC[i].replace('</i>', '');
	}

	return arrC;
}

/**
 * Fill the first row the table with general information.
 *
 * @param {*} Parent The parent of the table
 * @param {*} selectedClass The class name that was chosen at the beginning
 * @param {*} date The date when the record was last updated
 */
function fillTableHead(parent, selectedClass, dateString, lastUpdate) {
	var tableHeadRow = document.createElement('tr');

	var nav = document.createElement('th');
	var tableHead = document.createElement('th');
	var update = document.createElement('td');

	var left = document.createElement('span');
	var right = document.createElement('span');
	left.classList.add('material-symbols-outlined');
	right.classList.add('material-symbols-outlined');
	left.appendChild(document.createTextNode('navigate_before'));
	right.appendChild(document.createTextNode('navigate_next'));
	left.id = 'navigateBefore';
	right.id = 'navigateNext';

	left.addEventListener('click', (e) => {
		dayBefore();
	});
	right.addEventListener('click', (e) => {
		dayNext();
	});

	var date = document.createElement('div');
	date.id = 'nav';
	update.classList.add('last-update');

	if (lastUpdate != null) update.appendChild(document.createTextNode(lastUpdate));
	tableHead.appendChild(document.createTextNode(selectedClass));

	if (dateString != null) date.append(document.createTextNode(dateString));

	nav.appendChild(left);
	nav.appendChild(date);
	nav.appendChild(right);
	nav.style.display = 'flex';

	tableHeadRow.appendChild(tableHead);
	tableHeadRow.appendChild(nav);
	tableHeadRow.appendChild(document.createElement('th'));
	tableHeadRow.appendChild(update);

	parent.appendChild(tableHeadRow);
}

function fillTableFooter(parent, info) {
	if (info == null) return;
	var tableFooterRow = document.createElement('tr');
	var footer = document.createElement('td');
	footer.classList.add('footer');
	footer.setAttribute('colspan', 4);

	for (let i = 0; i < info.length; i++) {
		var p = document.createElement('p');
		p.appendChild(document.createTextNode(info[i]));
		footer.appendChild(p);
	}

	tableFooterRow.appendChild(footer);
	parent.appendChild(tableFooterRow);
}

/**
 * Creates a textNode with the needed values.
 * @param {*} arrRow The row
 * @param {*} cell The column
 * @param {*} col The cell to fill
 * @returns The TextNode that needs to be appended to the cell
 */
function fillCell(arrRow, cell, col) {
	var textNode;
	var div;

	switch (col) {
		case 0: // Unterrichtsstunde
			textNode = document.createTextNode(arrRow[0]);
			break;
		case 1: // Neue Stunde
			div = document.createElement('div');
			div.setAttribute('id', 'extra');
			div.appendChild(document.createTextNode(arrRow[1] + ' für ' + arrRow[7] + ' ' + arrRow[3] + ' ' + arrRow[2] + ' ' + arrRow[9])); // Art, Vertretung von, Fach, Lehrer, Bemerk
			cell.appendChild(div);
			textNode = document.createTextNode(arrRow[5]);
			break;
		case 2: // Neuer Lehrer*in
			textNode = document.createTextNode(arrRow[4]);
			break;
		case 3: // Raum
			textNode = document.createTextNode(arrRow[6]);
			break;
	}

	return textNode;
}

/**
 * Compares a class name to the selected. Decides whether this class name is valid.
 * @param {*} classToCompare The class name that needs to be compared
 * @param {*} selectClass The selected class name
 * @returns true or false
 */
function isWantedClass(classToCompare, selectedClass) {
	// Klassenname in Einzelteile aufspalten
	var splittedSelectedClass = splitClassName(selectedClass);
	var splittedClassToCompare = splitClassName(classToCompare);

	let matches = 0;
	for (let i = 0; i < splittedSelectedClass.length; i++) {
		for (let j = 0; j < splittedClassToCompare.length; j++) {
			if (splittedSelectedClass[i] == splittedClassToCompare[j]) {
				matches++;
			}
		}
	}

	if (matches == splittedSelectedClass.length || (matches == 1 && splittedClassToCompare.length == 1)) return true;
	return false;
}

/**
 * Sorts the rows by lesson, starting with the lowest.
 * @param {*} rows The rows
 * @returns The sorted rows
 */
function sortRowsByLesson(rows) {
	// Die Reihen nach den Stunden sortieren
	let sortedRows = [...rows].sort();

	return sortedRows;
}

/**
 * Splittes a className to the class number and it's index/indices.
 * @param {*} clazz
 * @returns the splitted class name
 */
function splitClassName(clazz) {
	let splittedClazz = [];
	for (let i = 0; i < clazz.length; i++) {
		if (isNaN(clazz[i + 1]) && i + 1 < clazz.length && splittedClazz.length == 0) splittedClazz.push(clazz.slice(0, i + 1));
		if (isNaN(clazz[i])) splittedClazz.push(clazz[i]);
		if (isNaN(clazz[i + 1]) && i == clazz.length - 1 && splittedClazz.length == 0) splittedClazz.push(clazz.slice(0, i + 1));
	}

	return splittedClazz;
}

function setLocalStorage(clazz) {
	localStorage.setItem('selectedClassName', clazz);
}

function formatData(data) {
	const all = [];

	const header = [];
	data['header'].forEach((instance) => {
		instance.forEach((date) => {
			header.push(date);
		});
	});

	const info = [];
	let groupI = [];
	for (let i = 0; i <= data['information'].length; i++) {
		if (groupI.length >= 2 || i + 1 > data['information'].length) {
			info.push(groupI);
			groupI = [];
		} else {
			groupI.push(data['information'][i]);
		}
	}

	let table = [];
	let indices = [];
	for (const [i, row] of data['table'].entries()) {
		if (row[0] == '') indices.push(i);
	}
	for (let i = indices.length - 1; i >= 0; i--) {
		data['table'].splice(indices[i], 1);
	}
	for (let i = 1; i < data['table'].length; i++) {
		if (isNaN(data['table'][i][0][0]) || i + 1 >= data['table'].length) {
			let group = [];
			group.push(table);
			all.push(group);
			table = [];
		} else {
			table.push(removeHTML(data['table'][i])); // HTML Tags aus den Zellen entfernen
		}
	}

	for (let i = 0; i < all.length; i++) {
		try {
			all[i].push(header[i]);
			all[i].push(info[i]);
		} catch (err) {}
	}

	return all;
}

function dayBefore() {
	const dateString = document.getElementById('nav').innerHTML;

	let dateInput = dateString.split(' ')[0];
	dateInput = dateInput.split('.');

	let newDate = new Date(parseInt(dateInput[2]), parseInt(dateInput[1]) - 1, parseInt(dateInput[0]) - 1);

	let day = days[newDate.getDay()];

	var dd = String(newDate.getDate()).padStart(2, '0');
	var m = String(newDate.getMonth() + 1); //January is 0!
	var yyyy = newDate.getFullYear();

	newDate = dd + '.' + m + '.' + yyyy;

	showData(newDate + ' ' + day);
}

function dayNext() {
	const dateString = document.getElementById('nav').innerHTML;

	let dateInput = dateString.split(' ')[0];
	dateInput = dateInput.split('.');

	let newDate = new Date(parseInt(dateInput[2]), parseInt(dateInput[1]) - 1, parseInt(dateInput[0]) + 1);

	let day = days[newDate.getDay()];

	var dd = String(newDate.getDate()).padStart(2, '0');
	var m = String(newDate.getMonth() + 1); //January is 0!
	var yyyy = newDate.getFullYear();

	newDate = dd + '.' + m + '.' + yyyy;

	showData(newDate + ' ' + day);
}
