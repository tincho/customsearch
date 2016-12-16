var getColumns = getData.bind(null, '/columns', updateColumns);
document.addEventListener("DOMContentLoaded", getColumns);

function getData(uri, success, evt) {

    var request = new XMLHttpRequest();

    request.open('GET', uri);
    request.onreadystatechange = function() {
    	if(! (request.readyState == 4 && request.status === 200)) {
            return;
        }
        return success(request.responseText);
    }
    request.send();
}

function updateColumns(data) {
	var tpl1 = document.querySelector('select[name="search_fields"] option');
    var tpl2 = document.querySelector('select[name="display_fields"] option');

    var dataRepeat = document.createAttribute('data-repeat');
    dataRepeat.value = data;

    tpl1.attributes.setNamedItem(dataRepeat);
    tpl2.attributes.setNamedItem(dataRepeat.cloneNode());

    tpl1.repeat();
    tpl2.repeat();
}
