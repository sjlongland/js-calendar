var body;
var viewer;

var main = function() {
	body = document.getElementsByTagName('body')[0];
	viewer = CalendarViewer.nextNDays('../ics/wicen.ics', 60);
	viewer.getEvents().then(function (events) {
		var now = ICAL.Time.now();
		var calendarDiv = document.createElement('div');
		calendarDiv.classList.add('calendar');
		var rangeDiv = document.createElement('div');
		rangeDiv.appendChild(document.createTextNode(
			'Events between '
			+ viewer.start.toString()
			+ ' and '
			+ viewer.end.toString()));
		calendarDiv.appendChild(rangeDiv);
		body.appendChild(calendarDiv);
		events.forEach(function (e) {
			var eventLink = document.createElement('a');
			/* Figure out URI for event link */
			var date = e.start.toICALString();
			var dateTimeSep = date.indexOf('T');
			if (dateTimeSep >= 0) {
				date = date.substr(0,dateTimeSep);
			}
			eventLink.href = 'https://owncloud.brisbanewicen.org.au/calendar/week.php?getdate=' + date;
			eventLink.target = '_blank';
			eventLink.classList.add('calendar_event');
			if (e.inProgress) {
				eventLink.classList.add('calendar_event_in_progress');
			}

			var timeDiv = document.createElement('div');
			timeDiv.classList.add('calendar_event_time');

			var startSpan = document.createElement('span');
			startSpan.classList.add('calendar_event_start');
			startSpan.appendChild(document.createTextNode(e.start.toString()));

			var timeSepSpan = document.createElement('span');
			timeSepSpan.classList.add('calendar_event_time_sep');
			timeSepSpan.appendChild(document.createTextNode(' - '));

			var endSpan = document.createElement('span');
			endSpan.classList.add('calendar_event_end');
			endSpan.appendChild(document.createTextNode(e.end.toString()));

			timeDiv.appendChild(startSpan);
			timeDiv.appendChild(timeSepSpan);
			timeDiv.appendChild(endSpan);

			if (e.inProgress) {
				var progressSpan = document.createElement('span');
				progressSpan.classList.add('calendar_event_in_progress_span');
				progressSpan.appendChild(document.createTextNode('In Progress'));
				timeDiv.appendChild(document.createTextNode(' '));
				timeDiv.appendChild(progressSpan);
			}

			var summaryDiv = document.createElement('div');
			var summarySpan = document.createElement('span');
			summarySpan.classList.add('calendar_event_summary');
			summarySpan.appendChild(document.createTextNode(e.evt.summary));
			summaryDiv.appendChild(summarySpan);

			var locationDiv = document.createElement('div');
			locationDiv.classList.add('calendar_event_location');
			locationDiv.appendChild(document.createTextNode(e.evt.location));

			eventLink.appendChild(timeDiv);
			eventLink.appendChild(summaryDiv);
			eventLink.appendChild(locationDiv);
			calendarDiv.appendChild(eventLink);
		});
	}).catch(function (err) {
		body.innerHTML = '<pre>' + err.message + '\n' + err.stack + '</pre>';
	});
};
