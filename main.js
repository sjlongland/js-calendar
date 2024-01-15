var body;
var viewer;
var start_time;
var end_time;
var event_list;

var renderList = function() {
	start_time.textContent = viewer.start.toString();
	end_time.textContent = viewer.end.toString();

	viewer.getEvents().then(function (events) {
		var now = ICAL.Time.now();

		event_list.removeAll();

		events.forEach(function (e) {
			/* Figure out URI for event link */
			var date = e.start.toICALString();
			var dateTimeSep = date.indexOf('T');
			if (dateTimeSep >= 0) {
				date = date.substr(0,dateTimeSep);
			}
			var event_link = new HyperlinkNode(
				'https://owncloud.brisbanewicen.org.au/calendar/js/#day=' + encodeURIComponent(date),
				'_blank'
			);
			event_link.addCSSClasses('calendar_event');
			if (e.inProgress) {
				event_link.addCSSClasses('calendar_event_in_progress');
			}

			var time_div = new DivNode();
			time_div.addCSSClasses('calendar_event_time');

			var start_span = new SpanNode();
			start_span.addCSSClasses('calendar_event_start');
			start_span.appendChild(e.start.toString());

			var time_sep_span = new SpanNode();
			time_sep_span.addCSSClasses('calendar_event_time_sep');
			time_sep_span.appendChild(' - ');

			var end_span = new SpanNode();
			end_span.addCSSClasses('calendar_event_end');
			end_span.appendChild(e.end.toString());

			time_div.appendChild(start_span);
			time_div.appendChild(time_sep_span);
			time_div.appendChild(end_span);

			if (e.inProgress) {
				var progress_span = new SpanNode();
				progress_span.addCSSClasses('calendar_event_in_progress_span');
				progress_span.appendChild('In Progress');
				time_div.appendChild(' ');
				time_div.appendChild(progress_span);
			}

			var summary_div = new DivNode();
			var summary_span = new SpanNode();
			summary_span.addCSSClasses('calendar_event_summary');
			summary_span.appendChild(e.evt.summary);
			summary_div.appendChild(summary_span);

			var location_div = new DivNode();
			location_div.addCSSClasses('calendar_event_location');
			location_div.appendChild(e.evt.location);

			event_link.appendChild(time_div);
			event_link.appendChild(summary_div);
			event_link.appendChild(location_div);

			event_list.appendChild(event_link);
		});
	}).catch(function (err) {
		event_list.node.innerHTML = '<pre>' + err.message + '\n' + err.stack + '</pre>';
	});
}

var main = function() {
	body = new ContainerDOMNode(document.getElementsByTagName('body')[0]);

	var calendar_div = new DivNode();
	event_list = new DivNode();
	calendar_div.addCSSClasses('calendar');
	var range_div = new DivNode();
	start_time = document.createTextNode("<START>");
	end_time = document.createTextNode("<END>");

	var back_btn = document.createElement('button');
	back_btn.appendChild(document.createTextNode("<"));
	back_btn.addEventListener("click", function() {
		viewer.seekDays(-60);
		renderList();
	});
	var next_btn = document.createElement('button');
	next_btn.appendChild(document.createTextNode(">"));
	next_btn.addEventListener("click", function() {
		viewer.seekDays(60);
		renderList();
	});

	range_div
		.appendChild(back_btn)
		.appendChild('Events between ')
		.appendChild(start_time)
		.appendChild(' and ')
		.appendChild(end_time)
		.appendChild(next_btn);

	calendar_div
		.appendChild(range_div)
		.appendChild(event_list);

	body.appendChild(calendar_div);

	viewer = CalendarViewer.nextNDays('../ics/wicen.ics', 60);
	renderList();
};
