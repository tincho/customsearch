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
