//TODO turn this into an IFFE so we know we're not conflictin

function retrieveMapsJSON() {

}

function init() {
  var request = new XMLHttpRequest();
  request.addEventListener("load", function() {
    var result = JSON.stringify(this.responseText);
  });
  request.open("GET", "http://localhost:3000/getMaps");
  request.setRequestHeader('Authorization', 'Bearer ff779ee219d7be0549c971d6ba2311d5');
  request.setRequestHeader('Content-Type', 'application/json');
  request.setRequestHeader('Accept', 'application/json');
  request.setRequestHeader('Access-Control-Allow-Origin', '*');
  request.send();
}

init();
