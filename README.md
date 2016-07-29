
# Node Arc
## A Veev like (minimalistic) Node.js framework with Arc.js as template engine

#### Vishva Kumara N P - vishva8kumara@gmail.com

Distributed Under MIT License

See [https://github.com/villvay/Veev] for an introduction to the similar php framework from which this is inspired from

## Overview
In this framework you can group codes in to modules which has the methods that handle requests.
Do not confuse these modules with node modules.

When an HTTP / RPC request comes, a module is loaded and a function is called.
The function returns data which will be rendered accordingly.

## URL routing
Veev phillosophy is to avoid writing url router alltogether.
Path segments in the URL are used to determine which module is to be loaded and which function is to be called.
It is simple - the first url path segment is the module and the second is the function.

Then what is about the third, fourth and so on..? Those will be parameters/arguments to the function.
Sub-modules and alternative routes that are available on veev - php will be implemented in near future.

Modules are located in the modules folder. index.js is the default module, and index is the default method.
Simply, index function on index.js will serve the root / home.
Similarly, if only one url path segment is specified, the index function on that module will be called.

Example:
URL: http://localhost:8081/draw/barchart
modules/draw.js is loaded
function barchart is called with three parameters (request, response, params)
It can either write to the response directly, or return a string or object.

When a function returns a string, it will be written to the response as text/html
If the function return an object, its JSON representation will be written to the response as text/json

Also a function can return an object with an attribute "error" which will cause the response to be HTTP 500
This will also write the error message to the console.

If a matching module or function is not found, the HTTP response code will be 404

var config = {
		'static': 'static',
		'port': 8081,
		'cache-modules': false,
		'rewrites': {
			'/favicon.ico': '/static/favicon.ico'
		}
	};

'static' is the folder for static content.
In a future releases we are hoping to add a css and JS minifier to this.

'port' is the port node.js will bind.

'cache-modules' can be turned off (false) for development, and true for production.
When it is false, every HTTP request will reload the module overriding the node.js cache,
so you don't have to restart the node.js application everytime you make a change.

'rewrites' is a URL rewriter that will be applied before processing the request.


## Arc
Arc.js [https://github.com/vishva8kumara/arc-reactor] is a UI toolkit that makes development of Single Page Apps and Cordova mobile apps very easy.
Node Arc is packed with a modified version of Arc.js that emulates 'some' DOM functionality on Node.js to serve the purpose of a template engine.

It can load an HTML template to a DOM like environment so you can use functions/attributes such as:
innerText, innerHTML, childNodes, parentNode, appendChild, setAttribute, getElementById.

Let's go deep in to arc reactor.

There is a simple way and an advanced way.
Simple way is to just render a template with data.
The advanced way is to:
* First build a DOM tree
* Then build a schema
* Put in to reactor with data
* Get HTML output
You can put several parts of the DOM seperately in to reactors and even iterate with an array of data.
You can put parts several times in to reactor to get further permutations and complex data structures.
All these are simplified with the functions described below.


### arc.render(template, data)
* Render HTML template with data
template: An HTML file name in templates folder.
data: A flat data object with values to replace template tags in template.
Returns HTML code as a string

This is the simplest form; useful when you don't need to iterate.
You can simply put data into a template file and get HTML.


### arc.loadTemplate(template)
* Loads a template file to a DOM tree.
template: An HTML file name in templates folder.
Returns a DOM tree.

When you want to do anything advanced, first you need to load a template into a DOM tree.
You can manipulate this with above mentioned emulated DOM functions/attributes.

Read on to see how to build schema from this which can be put in to the reactor.


### arc.parseHTML(HTML)
* Reads an HTML string and builds a DOM tree.
HTML: HTML code as a string
Returns a DOM tree.

When you already have an HTML code in a string, this can build a DOM tree from that.
You can manipulate this with above mentioned emulated DOM functions/attributes.


### arc.read(dom [, index])
* Convert a DOM tree to JSON schema
dom: A DOM tree.
index: optional - an index of known template tag pointers.
Returns an array [ schema , index of template tag pointers ].

When you already have a DOM tree, this makes a JSON Schema which can be put in to reactor.
You can select a DOM element by getElementById and put in to this to get a localized shema.
This is useful when you want to iterate an element over an array of data.


### arc.react(data, schema)
* Generate DOM tree from JSON schema + data
data: A flat data object with values to replace template tags in template.
schema: A schema object generated by arc.read
Returns a DOM tree.

Note: This Schema would be overwritten in the reactor, so you should either clone it or build it over when iterating.
This is a problem we are yet to resolve - maybe by some architectural redesign. But the bigger picture shall remain.

This is where the magic happens. You put data and a schema and get a DOM tree, which can be sent to the client/browser.
First you have to build a schema. A template or a part extracted from a template can be made in to a schema.
A schema can contain template tags which will be replaced with strings in the data.
The result can be put back into the template. You can even iterate this to get rows in a table or list-items.


Below here are the DOM abstraction in the lowest level, and you would not need those to use Arc.js in development,
but if you are interested in developing or contributing to Arc.js


### arc.dom(tag [, inner])
* Abstracts/Emulates a DOM object inside Node JS
tag: Tag name for the new DOM object.
inner: optional - innerHTML for the new DOM object.
A new object instance should be created.

This is a class for emulating DOM objects.

One limitation is that you cannot assign innerHTML and get back a DOM tree.
For that you would have to use arc.parseHTML, which will return you a document element with a dom structure.
So this DOM emulation is limited in functionality to maintain its flyweight design; which makes it very fast.

### arc.elem(tagname [, innerHTML [, options]])
* Builds a DOM object with Tag-Name and set innerHTML, Attributes
tagname: Tag name for the new DOM object.
innerHTML: optional - innerHTML for the new DOM object.
options: optional - A flat data object with attributes to be set.
A new object instance should be created.

END OF FILE
