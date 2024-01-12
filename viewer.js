/**
 * Fetch a URI via XMLHttpRequest and return via a promise.
 *
 * @param url		URL to retrieve
 * @param options	An object which describes request options:
 * 	method:		Request method to use, default is 'GET'
 * 	body:		Body to send in HTTP request, default is null.
 * 	beforeOpen:	Function to run before calling xhr.open(),
 * 			this will be given the XHR object for setting
 * 			headers, etc.
 * 	expect:		An object with expected status codes.  e.g.
 * 			{200: true} will expect code 200, and anything
 * 			else is an error.  Otherwise, only failed XHRs
 * 			(status 0) is considered an error.
 *
 * @returns		The XMLHttpRequest object, hopefully with data.
 * 
 * The exception returns the XMLHttpRequest as its xhr property.
 */
var fetch = function (url, options) {
	options = options || {};

	return new Promise(function (resolve, reject) {
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function () {
			if (xhr.readyState !== XMLHttpRequest.DONE) {
				return;
			}

			if ((xhr.status === 0) || (options.expect
					&& (!options.expect[xhr.status]))) {
				var err = new Error('XMLHTTPRequest failed');
				err.xhr = xhr;
				reject(err);
			} else {
				resolve(xhr);
			}
		};
		if (options.beforeOpen) {
			options.beforeOpen(xhr);
		}
		xhr.open(options.method || 'GET', url);
		xhr.send(options.body || null);
	});
};


var CalendarViewer = function (icsurl, start, end) {
	/* Current start and end time */
	this.start = start;
	this.end = end;

	/* Cache of icalendar data */
	var icsdata = null;
	var icsexpiry = 0;
	var icsevents = null;

	var _isCacheValid = function() {
		return Date.now() < icsexpiry;
	};

	this._getICSData = function() {
		/* Cache handling */
		if (_isCacheValid()) {
			return Promise.resolve(icsdata);
		}

		return fetch(icsurl, {
			expect: {200: true}
		}).then(function (xhr) {
			icsdata = ICAL.parse(xhr.responseText);
			icsexpiry = Date.now() + 300000; /* 5 minutes */
			return icsdata;
		});
	};

	this._getComponent = function () {
		return this._getICSData().then(function (jCalData) {
			return new ICAL.Component(jCalData);
		});
	};

	this._getEvents = function () {
		/* Cache handling */
		if (_isCacheValid()) {
			return Promise.resolve(icsevents);
		}

		return this._getComponent().then(function (comp) {
			icsevents = comp.getAllSubcomponents("vevent").filter(function (ve) {
				/* Filter out cancelled events */
				return ve.getFirstPropertyValue("status")
					!== "CANCELLED";
			}).map(function (ve) {
				return new ICAL.Event(ve);
			});
			return icsevents;
		});
	};
};

CalendarViewer.nextNDays = function(icsurl, days) {
	/* Current start time, midnight today */
	var start = ICAL.Time.now();
	start.adjust(0, -start.hour, -start.minute, -start.second);

	/* Current end time; 60 days from now */
	var end = start.clone();
	end.addDuration(new ICAL.Duration({days: days}));

	return new CalendarViewer(icsurl, start, end);
};

CalendarViewer.prototype.getEvents = function () {
	var self = this;

	return self._getEvents().then(function (allEvents) {
		/* Determine events that fit within the window */
		var events = [];

		var add = function(evt, start, end) {
			var now = ICAL.Time.now();

			events.push({
				start: start,
				end: end,
				evt: evt,
				inProgress: (now.compare(start) >= 0) && (now.compare(end) <= 0)
			});
		};

		var check = function (evt, start) {
			if (start === undefined) {
				start = evt.startDate;
			}

			/* Compute end time */
			var end = start.clone();
			end.addDuration(evt.duration);

			/*
			 * We have 4 possibilities:
			 * 1. Event ends before the start of our window
			 *            WWWWWWWW
			 *    eeeeeee
			 *    → hide
			 *
			 * 2. Event ends before the end of our window
			 *            WWWWWWWW
			 *          eeeeee
			 *              eeee
			 *    → show
			 *
			 * 3. Event starts before the end of our window
			 *            WWWWWWWW
			 *                eeee
			 *                  eeeeee
			 *    → show
			 *
			 * 4. Event starts after the end of our window
			 *            WWWWWWWW
			 *                     eeeeee
			 *    → hide
			 */

			/* Case 1. Ends before the start */
			if (self.start.compare(end) > 0) {
				/* Do nothing */
				return;
			}

			/* Case 2. Ends before or when our window ends */
			if (self.end.compare(end) >= 0) {
				/* Include */
				return add(evt, start, end);
			}

			/* Case 3. Starts before our window ends */
			if (self.end.compare(start) > 0) {
				/* Include */
				return add(evt, start, end);
			}

			/*
			 * Case 4. Event starts after the end of our window.
			 * We've already got the two explicit OK cases above,
			 * so no need to even check this.
			 */
		};

		allEvents.forEach(function (e) {
			/* Is this recurring? */
			if (e.isRecurring()) {
				var it = e.iterator(e.dtstart);
				var start = it.next();
				while (start && (self.end.compare(start) >= 0)) {
					check(e, start);
					start = it.next();
				}
			} else {
				check(e);
			}
		});

		/* Sort by start time, then end time */
		return events.sort(function (a, b) {
			return a.start.compare(b.start) || a.end.compare(b.end);
		});
	});
};
