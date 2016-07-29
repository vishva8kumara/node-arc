module.exports = {
	index : function(request, response, params){
		var arc = require(__dirname+'/../arc.js');
		var document = arc.loadTemplate('home.html');
		var list = document.getElementById('inner-list');
		//
		var item = list.childNodes[0];
		//var schema = arc.read(item);
		list.innerHTML = '';
		var data = [{title: 'Home Page', img: 'lorem.png'}, {title: 'About Us', img: 'ipsum.png'}, {title: 'Contact', img: 'dolor.png'}];
		for (var i = 0; i < data.length; i++){
			//console.log(schema);
			//console.log(item.constructor.name);
			//console.log(arc.read(item).constructor.name);
			var tmp = arc.react(data[i], arc.read(item));
			list.appendChild(tmp);
			//console.log(tmp.innerHTML);
			//console.log('-----------------');
		}
		return document.innerHTML;
		//
		//return arc.render('home.html', {title: 'Home Page', img: 'lorem.png'});
	}
};
