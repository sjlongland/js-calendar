var args;
var body;
var calendar;
var calendar_picker;
var viewer;
var start_time;
var end_time;
var event_list;

var encodeArgs = function(new_args) {
	return JSON.stringify(Object.assign({}, args, new_args));
}

var reloadViewer = function(year) {
	var start;
	var end;

	date = ICAL.Time.fromString(args.date);

	if (year) {
		start = date.clone().startOfYear();
		end = date.clone().endOfYear();
	} else {
		start = date.clone().startOfMonth();
		end = date.clone().endOfMonth();
	}

	if (!viewer) {
		viewer = new CalendarViewer('../ics/wicen.ics', start, end);
	} else {
		viewer.start = start;
		viewer.end = end;
	}
}

var showYear = function() {
	calendar_picker = new DivNode().addCSSClasses("calendar_picker");

	var calendar_div = new DivNode();
	event_list = new DivNode();
	calendar_div.addCSSClasses('calendar');
	var range_div = new DivNode();
	start_time = document.createTextNode("<START>");
	end_time = document.createTextNode("<END>");

	var back_btn = document.createElement('button');
	back_btn.appendChild(document.createTextNode("<"));
	back_btn.addEventListener("click", function() {
		viewer.prevYear();
		renderYearList();
	});
	var next_btn = document.createElement('button');
	next_btn.appendChild(document.createTextNode(">"));
	next_btn.addEventListener("click", function() {
		viewer.nextYear();
		renderYearList();
	});

	var range_text_div = (new DivNode())
		.appendChild('Events between ')
		.appendChild(start_time)
		.appendChild(' and ')
		.appendChild(end_time);

	range_div
		.appendChild(back_btn)
		.appendChild(range_text_div)
		.appendChild(next_btn)
		.addCSSClasses("calendar_range");

	calendar_div
		.appendChild(range_div)
		.appendChild(calendar_picker)
		.appendChild(event_list);

	body.appendChild(calendar_div);

	reloadViewer(true);
	renderYearList();
}

var renderYearList = function() {
	location.hash = encodeArgs({
		display: "year",
		date: viewer.start.toString()
	});

	start_time.textContent = viewer.start.toString();
	end_time.textContent = viewer.end.toString();

	viewer.getEvents().then(function (events) {
		var now = ICAL.Time.now();
		var today = now.clone().adjust(0, -now.hour, -now.minute, -now.second);
		var tomorrow = today.clone().adjust(1, 0, 0, 0);

		calendar_picker.removeAll();
		calendar = [];

		for (var month = 1; month <= 12; month++) {
			var cal_month = new CalendarMonth(
				viewer.start.year, month, true
			);

			var cal_table = new TableMaker(
				DAY_NAMES.map(function(name) {
					name = name.substr(0, 3);
					return {
						name: name,
						label: name
					}
				})
			);
			cal_table.addCSSClasses('calendar_table');

			for (var i = 0; i < cal_month.rows.length; i++) {
				cal_table.appendRow(
					cal_month.rows[i].map(function (day) {
						if (day) {
							var cell = document.createElement("button");
							cell.appendChild(document.createTextNode(day.date.toString()));
							cell.addEventListener("click", function() {
								if (day.events.length > 0) {
									day.events[0].link.node.scrollIntoView();
								}
							});
							cell.disabled = true;

							var day_ical = new ICAL.Time({
								year: day.year,
								month: day.month,
								day: day.date,
								hour: 0,
								minute: 0,
								second: 0,
								isDate: false
							});

							if (day_ical.compare(today) < 0) {
								/* This is in the past */
								cell.classList.add("calendar_event_in_past");
							} else if (day_ical.compare(tomorrow) < 0) {
								/* This is the current day */
								cell.classList.add("calendar_event_in_progress");
							}

							day.cell = cell;
							day.events = [];
							return cell;
						} else {
							var cell = new SpanNode();
							return cell;
						}
					})
				);
			}
			var month_btn = document.createElement('button');
			month_btn.appendChild(document.createTextNode(cal_month.name));

			/*
			 * .bind, because 'var' "hoists" the variable's scope to the top-level
			 * function.  Yes JS, I fucking hate you for that "feature".
			 */
			month_btn.addEventListener("click", (function(month) {
				var month_ical = new ICAL.Time({
					year: viewer.start.year,
					month: month,
					day: 1,
					hour: 0,
					minute: 0,
					second: 0,
					isDate: false
				});
				args.date = month_ical.toString();
				body.removeAll();
				showMonth();
			}).bind(null, month));

			var cal_month_div = (new DivNode())
				.appendChild(month_btn)
				.appendChild(cal_table)
				.addCSSClasses("calendar_month");
			calendar_picker.appendChild(cal_month_div);
			calendar.push(cal_month);
		}

		event_list.removeAll();

		events.forEach(function (e) {
			/* Figure out URI for event link */
			var date = e.start.toICALString();
			var dateTimeSep = date.indexOf('T');
			if (dateTimeSep >= 0) {
				date = date.substr(0,dateTimeSep);
			}
			var event_link = new HyperlinkNode(
				location.pathname + "#" + encodeURIComponent(encodeArgs({
					date: e.start.toString(),
					display: "day"
				})),
				args.target
			);
			event_link.addCSSClasses('calendar_event');
			if (e.inProgress) {
				event_link.addCSSClasses('calendar_event_in_progress');
			} else if (e.pastEvent) {
				event_link.addCSSClasses('calendar_event_past');
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

			event_link.node.addEventListener("click", function() {
				args.date = e.start.toString();
				body.removeAll();
				showDay();
			});

			/* Add the event to the list for the day */
			var calday = calendar[e.start.month - 1].days[e.start.day - 1];
			calday.events.push({
				link: event_link,
				event: e
			});
			calday.cell.disabled = false;
		});
	}).catch(function (err) {
		event_list.node.innerHTML = '<pre>' + err.message + '\n' + err.stack + '</pre>';
	});
}


var showMonth = function() {
	calendar_picker = new DivNode().addCSSClasses("calendar_picker");

	var calendar_div = new DivNode();
	event_list = new DivNode();
	calendar_div.addCSSClasses('calendar');
	var range_div = new DivNode();
	start_time = document.createTextNode("<START>");
	end_time = document.createTextNode("<END>");

	var range_text_div = (new DivNode())
		.appendChild('Events between ')
		.appendChild(start_time)
		.appendChild(' and ')
		.appendChild(end_time);


	if (!args.embed) {
		var back_btn = document.createElement('button');
		back_btn.appendChild(document.createTextNode("<"));
		back_btn.addEventListener("click", function() {
			viewer.prevMonth();
			renderMonthList();
		});

		range_div.appendChild(back_btn);
	}

	range_div.appendChild(range_text_div)
		.addCSSClasses("calendar_range");

	if (!args.embed) {
		var next_btn = document.createElement('button');
		next_btn.appendChild(document.createTextNode(">"));
		next_btn.addEventListener("click", function() {
			viewer.nextMonth();
			renderMonthList();
		});

		range_div.appendChild(next_btn);
	}

	calendar_div.appendChild(range_div);

	if (!args.embed) {
		var year_btn = document.createElement('button');
		year_btn.appendChild(document.createTextNode("Back to year"));
		year_btn.addEventListener("click", function() {
			body.removeAll();
			showYear();
		});

		var navigation_div = (new DivNode())
			.addCSSClasses("calendar_navigation")
			.appendChild(year_btn);

		calendar_div
			.appendChild(navigation_div);
	}

	calendar_div
		.appendChild(calendar_picker)
		.appendChild(event_list);

	body.appendChild(calendar_div);

	reloadViewer(false);
	renderMonthList();
}


var renderMonthList = function() {
	location.hash = encodeArgs({
		display: "month",
		date: viewer.start.toString()
	});

	start_time.textContent = viewer.start.toString();
	end_time.textContent = viewer.end.toString();

	viewer.getEvents().then(function (events) {
		var now = ICAL.Time.now();
		var today = now.clone().adjust(0, -now.hour, -now.minute, -now.second);
		var tomorrow = today.clone().adjust(1, 0, 0, 0);

		calendar = new CalendarMonth(
			viewer.start.year, viewer.start.month, true
		);

		calendar_picker.removeAll();
		var cal_table = new TableMaker(
			DAY_NAMES.map(function(name) {
				name = name.substr(0, 3);
				return {
					name: name,
					label: name
				}
			})
		);
		cal_table.addCSSClasses('calendar_table');

		for (var i = 0; i < calendar.rows.length; i++) {
			cal_table.appendRow(
				calendar.rows[i].map(function (day) {
					if (day) {
						var cell = document.createElement("button");
						cell.appendChild(document.createTextNode(day.date.toString()));
						cell.addEventListener("click", function() {
							if (day.events.length > 0) {
								day.events[0].link.node.scrollIntoView();
							}
						});
						cell.disabled = true;

						var day_ical = new ICAL.Time({
							year: day.year,
							month: day.month,
							day: day.date,
							hour: 0,
							minute: 0,
							second: 0,
							isDate: false
						});

						if (day_ical.compare(today) < 0) {
							/* This is in the past */
							cell.classList.add("calendar_event_in_past");
						} else if (day_ical.compare(tomorrow) < 0) {
							/* This is the current day */
							cell.classList.add("calendar_event_in_progress");
						}

						day.cell = cell;
						day.events = [];
						return cell;
					} else {
						var cell = new SpanNode();
						return cell;
					}
				})
			);
		}
		calendar_picker.appendChild(cal_table);

		event_list.removeAll();

		events.forEach(function (e) {
			/* Figure out URI for event link */
			var date = e.start.toICALString();
			var dateTimeSep = date.indexOf('T');
			if (dateTimeSep >= 0) {
				date = date.substr(0,dateTimeSep);
			}
			var event_link = new HyperlinkNode(
				location.pathname + "#" + encodeURIComponent(encodeArgs({date: e.start.toString(), display: "day", embed: false})),
				args.embed ? "_blank" : null
			);
			event_link.addCSSClasses('calendar_event');
			if (e.inProgress) {
				event_link.addCSSClasses('calendar_event_in_progress');
			} else if (e.pastEvent) {
				event_link.addCSSClasses('calendar_event_past');
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

			if (!args.embed) {
				event_link.node.addEventListener("click", function() {
					args.date = e.start.toString();
					body.removeAll();
					showDay();
				});
			}

			/* Add the event to the list for the day */
			var calday = calendar.days[e.start.day - 1];
			calday.events.push({
				link: event_link,
				event: e
			});
			calday.cell.disabled = false;
		});
	}).catch(function (err) {
		event_list.node.innerHTML = '<pre>' + err.message + '\n' + err.stack + '</pre>';
	});
}


var showDay = function() {
	if (args.display !== "day") {
		body.removeAll();
	}

	calendar_picker = new DivNode().addCSSClasses("calendar_picker");

	var calendar_div = new DivNode();
	event_list = new DivNode();
	calendar_div.addCSSClasses('calendar');
	var range_div = new DivNode();
	start_time = document.createTextNode("<START>");

	var back_btn = document.createElement('button');
	back_btn.appendChild(document.createTextNode("<"));
	back_btn.addEventListener("click", function() {
		var date = ICAL.Time.fromString(args.date).adjust(-1, 0, 0, 0);
		args.date = date.toString();

		if (date.compare(viewer.start) < 0) {
			reloadViewer(false);
		}

		renderDayList();
	});
	var next_btn = document.createElement('button');
	next_btn.appendChild(document.createTextNode(">"));
	next_btn.addEventListener("click", function() {
		var date = ICAL.Time.fromString(args.date).adjust(1, 0, 0, 0);
		args.date = date.toString();

		if (date.compare(viewer.end) > 0) {
			reloadViewer(false);
		}

		renderDayList();
	});

	var month_btn = document.createElement('button');
	month_btn.appendChild(document.createTextNode("Back to month"));
	month_btn.addEventListener("click", function() {
		body.removeAll();
		showMonth();
	});

	var year_btn = document.createElement('button');
	year_btn.appendChild(document.createTextNode("Back to year"));
	year_btn.addEventListener("click", function() {
		body.removeAll();
		showYear();
	});

	var navigation_div = (new DivNode())
		.addCSSClasses("calendar_navigation")
		.appendChild(month_btn)
		.appendChild(year_btn);

	var range_text_div = (new DivNode())
		.appendChild('Events occurring on ')
		.appendChild(start_time);

	range_div
		.appendChild(back_btn)
		.appendChild(range_text_div)
		.appendChild(next_btn)
		.addCSSClasses("calendar_range");

	calendar_div
		.appendChild(range_div)
		.appendChild(navigation_div)
		.appendChild(calendar_picker)
		.appendChild(event_list);

	body.appendChild(calendar_div);

	reloadViewer(false);
	renderDayList();
}


var renderDayList = function() {
	location.hash = encodeArgs({
		display: "day",
		date: args.date
	});

	var start_of_day = ICAL.Time.fromString(args.date);
	var end_of_day = start_of_day.clone().adjust(1, 0, 0, 0);

	start_time.textContent = start_of_day.toString();

	viewer.getEvents().then(function (events) {
		var now = ICAL.Time.now();
		var today = now.clone().adjust(0, -now.hour, -now.minute, -now.second);
		var tomorrow = today.clone().adjust(1, 0, 0, 0);

		calendar = new CalendarMonth(
			viewer.start.year, viewer.start.month, true
		);

		calendar_picker.removeAll();
		var cal_table = new TableMaker(
			DAY_NAMES.map(function(name) {
				name = name.substr(0, 3);
				return {
					name: name,
					label: name
				}
			})
		);
		cal_table.addCSSClasses('calendar_table');

		for (var i = 0; i < calendar.rows.length; i++) {
			cal_table.appendRow(
				calendar.rows[i].map(function (day) {
					if (day) {
						var day_ical = new ICAL.Time({
							year: day.year,
							month: day.month,
							day: day.date,
							hour: 0,
							minute: 0,
							second: 0,
							isDate: false
						});

						var cell = document.createElement("button");
						cell.appendChild(document.createTextNode(day.date.toString()));
						cell.addEventListener("click", function() {
							args.date = day_ical.toString();
							renderDayList();
						});
						cell.disabled = true;

						if (day_ical.compare(today) < 0) {
							/* This is in the past */
							cell.classList.add("calendar_event_in_past");
						} else if (day_ical.compare(tomorrow) < 0) {
							/* This is the current day */
							cell.classList.add("calendar_event_in_progress");
						}

						day.cell = cell;
						return cell;
					} else {
						var cell = new SpanNode();
						return cell;
					}
				})
			);
		}
		calendar_picker.appendChild(cal_table);

		event_list.removeAll();

		events.forEach(function (e) {
			/* Enable this day for clicking */
			calendar.days[e.start.day - 1].cell.disabled = false;

			if (e.end.compare(start_of_day) <= 0) {
				/* This finished before today */
				return;
			} else if (e.start.compare(end_of_day) >= 0) {
				/* This started after tomorrow */
				return;
			}

			/* Figure out URI for event link */
			var date = e.start.toICALString();
			var dateTimeSep = date.indexOf('T');
			if (dateTimeSep >= 0) {
				date = date.substr(0,dateTimeSep);
			}
			var event_div = new DivNode();
			event_div.addCSSClasses('calendar_event');
			if (e.inProgress) {
				event_div.addCSSClasses('calendar_event_in_progress');
			} else if (e.pastEvent) {
				event_div.addCSSClasses('calendar_event_past');
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

			event_div.appendChild(time_div);
			event_div.appendChild(summary_div);
			event_div.appendChild(location_div);

			event_list.appendChild(event_div);
		});
	}).catch(function (err) {
		event_list.node.innerHTML = '<pre>' + err.message + '\n' + err.stack + '</pre>';
	});
}

var main = function() {
	try {
		args = Object.assign(
			{
				display: "month",
				date: ICAL.Time.now().toString()
			},
			JSON.parse(
				decodeURIComponent(location.hash).substring(1)
			)
		);
	} catch (err) {
		console.log(err);
		args = {
			display: "month",
			date: ICAL.Time.now().toString()
		};
	}

	body = new ContainerDOMNode(document.getElementsByTagName('body')[0]);

	switch (args.display) {
	case "day":
		showDay();
		break;
	case "year":
		showYear();
		break;
	case "month":
	default:
		showMonth();
		break;
	}
};
