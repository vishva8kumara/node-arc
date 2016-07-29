module.exports = {
	barchart : function(request, response, params){
			//response.writeHead(200, {'Content-Type': 'image/svg'});
			if (typeof params.data == 'undefined')
				return {error: 'Please specify data'};
			var data = JSON.parse(new Buffer(params.data, 'base64').toString());
			var chart = new ArcChart({offsetWidth: data.width, offsetHeight: data.height}, data.data, data.colors, data.options);
			//console.log(chart.draw('column'));
			response.writeHead(200, {'Content-Type': 'text/html'});
			response.end(chart.draw('column').outerHTML());
		}
};

function ArcChart(context, data, colors, options){
	var _self = this;
	var arc = require(__dirname+'/../arc.js');
	//	Default options to use when not provided by programmer
	var defaultOptions = {
		chartArea:{left:40, right:10, bottom:60, top:5},
		backgroundColor: '#FFFFFF',
		grayDays: 'rgba(160, 160, 160, 0.3)',
		fontColor: '#303030',
		tooltipPosition: 'above',
	};
	for (var key in defaultOptions)
		if (typeof options[key] == 'object'){
			for (var skey in defaultOptions[key])
				if (typeof options[key][skey] == 'undefined')
					options[key][skey] = defaultOptions[key][skey];
		}
		else if (typeof options[key] == 'undefined')
			options[key] = defaultOptions[key];
	if (typeof colors == 'undefined'){
		colors = ['skyblue', 'yellow', 'lightgreen', 'red', 'purple', 'blue', 'orange', 'green'];
	}
	//
	//	Calculate minimum and maximum values so we can contain the chart withing these bounds - scaling
	var colMax = 0, rowMin = Math.min(), rowMax = 0;
	for (var i = 1; i < data.length; i++){
		if (data[i][0] > rowMax)
			rowMax = getVal(data[i][0]);
		if (data[i][0] < rowMin)
			rowMin = getVal(data[i][0]);
		for (var j = 1; j < data[i].length; j++)
			if (data[i][j]-colMax > 0)
				colMax = data[i][j];
	}
	//	Default step in X axis - Microseconds per day
	var xGap = 24*3600000;
	var graph = arc.elem('svg');
	//
	this.draw = function(chartType){
		if (colMax == 0)
			return {error: 'No data to display on the chart.'};
		//
		//	Create chart SVG arc.element
		graph = arc.elem('svg', null, {
				width: context.offsetWidth,
				height: context.offsetHeight,
				'font-family': options.fontFamily,
				'shape-rendering': (chartType=='line'?'':'crispEdges'),
				style: 'background-color:'+options.backgroundColor+';'});
		var chartGrid = arc.elem('g', null, {id: 'grid'});
		var chartArea = arc.elem('g', null, {id: 'chart', transform: 'translate('+options.chartArea.left+', '+options.chartArea.top+')'});
		var chartBG = arc.elem('g', null, {id: 'background', transform: 'translate('+options.chartArea.left+', '+options.chartArea.top+')'});
		//
		//	Calculate chart bounding rectangle
		var areaHeight = context.offsetHeight - options.chartArea.top - options.chartArea.bottom;
		var areaWidth = context.offsetWidth - options.chartArea.left - options.chartArea.right;
		var setWidth = (xGap * areaWidth) / (xGap + rowMax - rowMin);
		var colWidth = (setWidth / (data[0].length))-1;
		if (data[0].length == 2)
			colWidth = (setWidth / (data[0].length-0.5))-1;
		//
		//	Draw horizontal scale lines in the background
		drawHorizontalLine(chartGrid, context, options, topForVal(context, options, areaHeight, colMax, 0), false, '#808080');
		var segments = Math.ceil(colMax / 40) * 40;
		for (var i = 5; i > 0; i--){
			drawHorizontalLine(chartGrid, context, options, topForVal(context, options, areaHeight, colMax, i*(segments/8)), i*(segments/8), '#D0D0D0');
		}
		//
		//	Draw vertical ranges if specified
		if (typeof options.verticalRanges != 'undefined')
			for (range in options.verticalRanges)
				chartBG.appendChild(arc.elem('rect', null, {
									id: 'range-'+range,
									x: -5,
									y: 10 + (areaHeight * (1 - (options.verticalRanges[range][1] / colMax))),
									width: areaWidth+5,
									height: areaHeight * (options.verticalRanges[range][1]-options.verticalRanges[range][0]) / colMax,
									style: 'fill:'+options.verticalRanges[range][2]+';'
								}));
		//
		//	Determine X Axis label rotate angle if X axis is dense
		var barHeight;
		if (setWidth < 50)
			options.rotateXAxisLabels = 45;
		//
		//	Prepare lines if line chart
		if (chartType == 'line'){
			var lines = [], line, d, circle, circleHover;
			for (var i = 1; i < data[0].length; i++){
				line = arc.elem('path', null, {'stroke-width': 2, stroke: colors[i-1], d: '', fill: 'none'});
				chartArea.appendChild(line);
				lines.push(line);
			}
		}
		//
		var lastLblX = -100;
		//	Draw the chart
		for (var i = 1; i < data.length; i++){
			if (data[i].length == 1){
				//	A Gray Day - Date with no data (weekends)
				var rect = arc.elem('rect', null, {
								id: 'date-gray-'+getVal(data[i][0]),
								x: (setWidth * (getVal(data[i][0]) - rowMin) / xGap) + 1 - (data[0].length == 2 ? colWidth/4 : colWidth/2),
								y: 0-options.chartArea.top,
								width: setWidth-2,
								height: areaHeight+(2*options.chartArea.top),
								style: 'fill:'+options.grayDays+';'
							});
				chartBG.appendChild(rect);
			}
			else{
				var group = arc.elem('g', null, {id: 'date-'+getVal(data[i][0]), transform: 'translate('+(setWidth * (getVal(data[i][0]) - rowMin) / xGap)+', 0)'});
				// Draw Column Chart
				if (chartType == 'column'){
					//	Draw columns
					for (var j = 1; j < data[i].length; j++){
						barHeight = data[i][j] * areaHeight / colMax;
						var rect = arc.elem('rect', null, {
										id: 'value-'+data[0][j].toLowerCase().replace(/ /g, '-')+'-'+getVal(data[i][0]),
										x: ((colWidth+1)*(j-1)),
										y: areaHeight - barHeight + options.chartArea.top,
										width: colWidth,
										height: barHeight,
										style: 'fill:'+colors[j-1]+';'
									});
						group.appendChild(rect);
					}
				}
				//	Draw Line Chart
				else if (chartType == 'line'){
					for (var j = 1; j < data[i].length; j++){
						if (typeof data[i][j] != 'undefined'){
							barHeight = data[i][j] * areaHeight / colMax;
							d = lines[j-1].getAttribute('d');
							lines[j-1].setAttribute('d', d+(d==''?'M':'L')+(((setWidth-colWidth)/2) + (setWidth * (getVal(data[i][0]) - rowMin) / xGap))+','+(areaHeight - barHeight + options.chartArea.top));
							circleHover = arc.elem('g');
							circle = arc.elem('circle', null, {cx: ((setWidth-colWidth)/2), cy: (areaHeight - barHeight + options.chartArea.top), r: '3', stroke: 'none', 'stroke-width': 0, fill: colors[j-1]});
							circleHover.appendChild(circle);
						}
					}
				}
				//
				//	Draw txt labels
				if (30 + lastLblX < setWidth * (getVal(data[i][0]) - rowMin) / xGap){
					var txtLbl = arc.elem('g', null, {
							transform: (typeof options.rotateXAxisLabels != 'undefined' ?
										'rotate(-'+options.rotateXAxisLabels+' '+(10 - (setWidth/10))+' '+(context.offsetHeight-options.chartArea.bottom+options.chartArea.top)+')' : '')
						});
					txtLbl.appendChild(arc.elem('text', formatXAxis(data[i][0])[0], {
						'text-anchor': 'middle',
						'font-size': 12,
						y: areaHeight+16,
						fill: options.fontColor,
						transform: 'translate('+((setWidth/2)-15)+', 5)'}));
					txtLbl.appendChild(arc.elem('text', formatXAxis(data[i][0])[1], {
						'text-anchor': 'middle',
						'font-size': 12,
						y: areaHeight+30,
						fill: options.fontColor,
						transform: 'translate('+((setWidth/2)-15)+', 5)'}));
					group.appendChild(txtLbl);
					//
					lastLblX = setWidth * (getVal(data[i][0]) - rowMin) / xGap;
				}
				chartArea.appendChild(group);
			}
		}
		//
		graph.appendChild(chartGrid);
		graph.appendChild(chartBG);
		graph.appendChild(chartArea);
		//
		return graph;
	};
	//
	//	Draw a horizontal line in the chart background
	function drawHorizontalLine(graph, context, options, height, value, color){
		graph.appendChild(arc.elem('path', null, {
			d: 'M'+(options.chartArea.left-5)+','+height+
			' L'+(context.offsetWidth-options.chartArea.right)+','+height, stroke: color}));
		if (value != false)
			graph.appendChild(arc.elem('text', value,
				{'text-anchor': 'end',
				'font-size': 12,
				y: height + 5,
				x: options.chartArea.left - 8,
				fill: options.fontColor}));
	}
	//
	//	Calculate the pixel Y value for a given chart data
	function topForVal(context, options, areaHeight, colMax, val){
		return context.offsetHeight - options.chartArea.bottom + options.chartArea.top - (areaHeight * val / colMax);
	}
	//
	//	Format string for X axis labels
	function formatXAxis(x){
		x = new Date(x*1);
		return [x.toString().substring(0, 3), x.toString().substring(4, 10), x.toString().substring(11, 15)];
	}
	//
	//	Get X axis absolute value for a DateTime object
	function getVal(x){
		return x*1;
	}
}
