var arc = module.exports = {
	//	Read DOM tree and generate JSON
	read : function(dom, index){
		var obj = {};
		if (typeof index == 'undefined')
			var index = {};
		//*/
		var p0, p1;
		for (var i = 0; i < dom.attributes.length; i++){
			obj[dom.attributes[i].name] = dom.attributes[i].value;
			p0 = dom.attributes[i].value.indexOf('{{');
			p1 = dom.attributes[i].value.indexOf('}}');
			if (p0 > -1 && p1 > -1)
				index[dom.attributes[i].value.substring(p0+2, p1).trim()] = [obj, dom.attributes[i].name];
		}
		if (dom.childNodes.length == 0){
			obj.content = dom.innerHTML;
			p0 = dom.innerHTML.indexOf('{{');
			p1 = dom.innerHTML.indexOf('}}');
			if (p0 > -1 && p1 > -1)
				index[dom.innerHTML.substring(p0+2, p1).trim()] = [obj, 'content'];
		}
		/*/
		for (var i = 0; i < dom.attributes.length; i++){
			obj[dom.attributes[i].name] = dom.attributes[i].value;
			if (dom.attributes[i].value.substring(0, 2) == '{{' && dom.attributes[i].value.substr(-2) == '}}')
				index[dom.attributes[i].value.replace('{{', '').replace('}}', '')] = [obj, dom.attributes[i].name];
		}
		if (dom.childNodes.length == 0){
			obj.content = dom.innerHTML;
			if (dom.innerHTML.substring(0, 2) == '{{' && dom.innerHTML.substr(-2) == '}}')
				index[dom.innerHTML.replace('{{', '').replace('}}', '')] = [obj, 'content'];
		}
		//*/
		else if (dom.childNodes.length == 1){
			var res = arc.read(dom.childNodes[0], index);
			obj.content = res[0];
			//index = index.concat(res[1]);
		}
		else{
			obj.content = [];
			for (var i = 0; i < dom.childNodes.length; i++){
				var res = arc.read(dom.childNodes[i], index);
				obj.content.push(res[0]);
				//index = index.concat(res[1]);
			}
		}
		var output = {};
		output[dom.tagName.toLowerCase()] = obj;
		return [output, index];
	},

	//	Load a template to a DOM tree
	loadTemplate: function(template){
		var fs = require('fs');
		template = fs.readFileSync('./templates/'+template, 'utf8');
		return arc.parseHTML(template);
		//window = arc.react(data, arc.read(window));
		//return window.innerHTML;
	},

	//	Render HTML template with data
	render: function(template, data){
		var fs = require('fs');
		template = fs.readFileSync('./templates/'+template, 'utf8');
		var window = new arc.parseHTML(template);
		window = arc.react(data, arc.read(window))
		return window.innerHTML;
	},

	//	Generate DOM tree from JSON
	react: function(data, schema){
		/*var extend = require('util')._extend;
		schema = extend({}, schema);*/
		for (var key in schema[1]){
			/*/
			schema[1][key][0][schema[1][key][1]] = schema[1][key][0][schema[1][key][1]].
				replace(new RegExp('\\{\\{\s*'+key+'\s*\\}\\}', 'g'), data[key]);
			/*/
			schema[1][key][0][schema[1][key][1]] = schema[1][key][0][schema[1][key][1]].
				replace('{{'+key+'}}', data[key]);
			//*/
		}
		return arc.tree(schema[0]);//Object.assign({}, schema)
	},

	//	Generate DOM tree from JSON
	tree: function(data){
		var obj;
		for (var tagname in data){
			obj = new arc.dom(tagname, '');
			for (var key in data[tagname]){
				var value = data[tagname][key];
				if (key == 'content'){
					if (typeof value == 'string' || typeof value == 'number')
						obj.innerHTML = value;
					else if (typeof value == 'object')
						if (typeof value.length == 'undefined')
							obj.appendChild(arc.tree(value));
						else
							for (var i = 0; i < value.length; i++)
								obj.appendChild(arc.tree(value[i]));
				}
				else
					obj.setAttribute(key, value);
			}
		}
		return obj;
	},

	/*/	Generate HTML Table from JSON data and a JSON schema
	tbl: function(data, schema){
		var table = elem('table', false, {class: 'table-striped', width: '100%'});
		var tr = table.appendChild(elem('tr', false, {'data-id': 'head'}));
		for (var i = 0; i < schema.length; i++){
			if (typeof schema[i].type != 'undefined'){
				if (schema[i].type == 'numeric')
					tr.appendChild(elem('th', schema[i].title, {align: 'right'}));
				else
					tr.appendChild(elem('th', schema[i].title));
			}
			else
				tr.appendChild(elem('th', schema[i].title));
		}
		var tmp;
		for (var i = 0; i < data.length; i++){
			tr = table.appendChild(elem('tr', false, {'data-id': (data[i].id != undefined ? data[i].id : '')}));
			for (var j = 0; j < schema.length; j++){
				tmp = data[i][schema[j].name];
				if (schema[j]['enum'] != undefined && typeof schema[j]['enum'][tmp] != 'undefined')
					tmp = schema[j]['enum'][tmp];
				if (typeof schema[j].type != 'undefined'){
					if (schema[j].type == 'numeric')
						tr.appendChild(elem('td', tmp+'&nbsp;', {align: 'right'}));
					else
						tr.appendChild(elem('td', tmp+'&nbsp;'));
				}
				else
					tr.appendChild(elem('td', tmp+'&nbsp;'));
			}
		}
		return table;
	},*/

	//	Render HTML template with data
	parseHTML: function(html){
		html = html.replace(/\n/g, ' ').replace(/\t/g, ' ').replace(/\s+/g, ' ');
		var p0 = 0, p1 = -1, tag = '', between = '';
		var tree = new arc.dom('document', ''), path = [], tmp;
		//tree.index = {}
		path.push(tree);
		while (html.indexOf('<', p0) > -1){
			p0 = html.indexOf('<', p0)+1;
			between = html.substring(p1+1, p0-1);//.replace(/\s+/g, ' ');
			p1 = html.indexOf('>', p0);
			tag = html.substring(p0, p1).split(' ');
			//
			if (tag[0].substring(0, 1) == '/'){
				//if (between.trim() != '')
				//if (typeof between != 'undefined')
				path[path.length-1].innerText = between.trim();
				path.pop();
			}
			else{
				tmp = new arc.dom(tag[0], between);
				for (var i = tag.length-1; i > 0; i--)
					if (tag[i] == '/')
						tag.splice(i, 1);
					else if (tag[i].indexOf('=') == -1){
						tag[i-1] += tag[i];
						tag.splice(i, 1);
					}
				path[path.length-1].appendChild(tmp);
				for (var i = tag.length-1; i > 0; i--){
					tag[i] = tag[i].split('=');
					tmp.setAttribute(tag[i][0], tag[i][1].replace(/"/g, '').replace(/'/g, ''));
				}
				if (between.trim() != '')
					path[path.length-1].appendChild(new arc.dom('textnode', between));
				path.push(tmp);
			}
		}
		return tree;
	},

	//	Abstracts/Emulates a DOM object inside Node JS
	dom: function(tag, inner){
		var _self = this;
		this.tagName = tag;
		this.innerText = typeof inner == 'undefined' ? '' : inner;
		this.childNodes = [];
		this.attributes = [];
		this.index = {};
		this.parentNode = null;
		//
		this.appendChild = function(obj){
			obj.parentNode = _self;
			_self.childNodes.push(obj);
			for (var attr in obj.index)
				_self.index[attr] = obj.index[attr];
			obj.index = {};
		};
		this.upPropagateIndex = function(id, obj){	//	Add refertence to the top-most index
			if (_self.parentNode == null)
				_self.index[id] = obj;
			else
				_self.parentNode.upPropagateIndex(id, obj);
		};
		this.setAttribute = function(attrib, val){
			for (var i = 0; i < _self.attributes.length; i++)
				if (_self.attributes[i].name == attrib){
					_self.attributes[i].value = val;
					return true;
				}
			_self.attributes.push({name: attrib, value: val});
			if (attrib == 'id')
				_self.upPropagateIndex(val, _self);
		};
		this.getElementById = function(id){
			if (typeof _self.index[id] != 'undefined')
				return _self.index[id];
		};
		this.outerHTML = function(indent){
			if (tag == 'textnode')
				return _self.innerText;
			//if (typeof indent == 'undefined')
			var indentS = '';
			/*else
				var indentS = '\t'.repeat(indent);*/
			var out = '\n'+indentS+'<'+tag;
			for (var i = 0; i < _self.attributes.length; i++)
				out += ' '+_self.attributes[i].name+'="'+_self.attributes[i].value+'"';
			out += '>'+_self.innerText+'';
			for (var i = 0; i < _self.childNodes.length; i++)
				out += _self.childNodes[i].outerHTML(indent+1);
			if (_self.childNodes.length > 1)
				out += '\n'+indentS;
			return out+'</'+tag+'>';
		};
		Object.defineProperty(this, 'innerHTML', {
			set: function(html){
				//_self = arc.parseHTML(html);
				_self.innerText = html;
				_self.childNodes = [];
			},
			get: function(){
				var out = _self.innerText;
				for (var i = 0; i < _self.childNodes.length; i++)
					out += _self.childNodes[i].outerHTML();
				return out;
			}
		});
		_self.innerHTML = inner;
	},

	//	Generates a DOM object with Tag-Name and set innerHTML, Attributes
	elem: function(tagname, innerHTML, options){
		//var obj = document.createElementNS('http://www.w3.org/2000/svg', tagname);
		var obj = new arc.dom(tagname);
		if (typeof innerHTML !== 'undefined' && innerHTML != null && innerHTML != false)
			obj.innerHTML = innerHTML;
		if (typeof options !== 'undefined')
			for (var key in options)
				obj.setAttribute(key, options[key]);
		return obj;
	}

};