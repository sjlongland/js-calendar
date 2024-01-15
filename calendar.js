/**
 * Simple calendar generation routine in JavaScript.
 *
 * The concept of this module is to make a simple, browser-compatible module
 * that can be used to generate HTML calendars in JavaScript on-the-fly.
 *
 * © 2024 Stuart Longland
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 * 
 * 1. Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDER AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

var MONTH_TABLE = Object.freeze([0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4]);

/**
 * Lengths of months in days, for a typical year.
 */
var MONTH_LEN = Object.freeze([
	31,	// Jan
	28,	// Feb: 29 on leap year!
	31,	// Mar
	30,	// Apr
	31,	// May
	30,	// Jun
	31,	// Jul
	31,	// Aug
	30,	// Sep
	31,	// Oct
	30,	// Nov
	31	// Dec
]);


/**
 * Day names
 */
var DAY_NAMES = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday"
];


/**
 * Month names
 */
var MONTH_NAMES = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December"
];


/**
 * Determine if a year is a leap year.
 */
function isLeapYear(year) {
	return (
		((year % 4) === 0)
		&& (
			((year % 100) !== 0)
			|| ((year % 400) === 0)
		)
	);
}


/**
 * Number of days in the month.
 */
function daysInMonth(year, month) {
	return (
		MONTH_LEN[month - 1]
		+ (
			((month === 2) && isLeapYear(year))
			? 1
			: 0
		)
	);
}


/**
 * Day of the week for the first day in the month.
 *
 * https://en.wikipedia.org/wiki/Determination_of_the_day_of_the_week#Sakamoto's_methods
 */
function dayOfWeek(year, month, day) {
	if (month < 3) {
		year--;
	}

	return (
		year
		+ Math.floor(year / 4)
		- Math.floor(year / 100)
		+ Math.floor(year / 400)
		+ MONTH_TABLE[month - 1]
		+ day			 /* day */
	) % 7;
}


/**
 * Object representing a calendar day.
 */
function CalendarDay(year, month, date, wday) {
	Object.defineProperty(this, "year", {
		value: year,
		enumerable: true,
		writable: false
	});
	Object.defineProperty(this, "month", {
		value: month,
		enumerable: true,
		writable: false
	});
	Object.defineProperty(this, "date", {
		value: date,
		enumerable: true,
		writable: false
	});
	Object.defineProperty(this, "wday", {
		value: wday,
		enumerable: true,
		writable: false
	});
	Object.defineProperty(this, "name", {
		value: DAY_NAMES[wday],
		enumerable: true,
		writable: false
	});
}


CalendarDay.prototype.toString = function() {
	return ((this.date < 10) ? '0' : '') + this.date.toString(10);
};


/**
 * Representation of a calendar month.
 *
 * @param year	{Number} Year represented, must be greater than 1752
 * @param month	{Number} Month number: 1-12 inclusive
 * @param fold	{Boolean} Whether to fold the last week into the first?
 * 		Default is false (do not fold).  No effect if the last day
 * 		of the month would overlap with the first.
 * @param Day	{function} Constructor for each day in the month, defaults
 * 		to CalendarDay
 */
function CalendarMonth(year, month, fold, Day) {
	var DAYS_IN_MONTH = daysInMonth(year, month);
	var FIRST_DAY = dayOfWeek(year, month, 1);

	/* coerce 'fold' to boolean */
	fold = (fold) ? true : false;

	/* Use CalendarDay if no Day given */
	if (!Day) {
		Day = CalendarDay;
	}

	var date = 1;
	var wday = 0;
	var week = [];
	var DAYS = [];
	var ROWS = [week];

	/* Pad out the first week of the month */
	while (wday < FIRST_DAY) {
		week.push(null);
		wday++;
	}

	/* Create the week rows for each day */
	while (date <= DAYS_IN_MONTH) {
		var day = new Day(year, month, date, wday);
		DAYS.push(day);
		week.push(day);

		date++;
		wday = (wday + 1) % 7;
		if (!wday) {
			/* New week */
			week = [];
			ROWS.push(week);
		}
	}

	if (fold && (wday <= FIRST_DAY)) {
		/* We can fold the last week into the first */
		var FIRST_WEEK = ROWS[0];

		for (wday = 0; wday < FIRST_DAY; wday++) {
			FIRST_WEEK[wday] = week[wday];
		}

		ROWS.pop();
	} else {
		/* Pad out the last week */
		while (wday < 7) {
			week.push(null);
			wday++;
		}
	}

	/* Expose the properties */
	Object.defineProperty(this, "year", {
		value: year,
		enumerable: true,
		writable: false
	});
	Object.defineProperty(this, "month", {
		value: month,
		enumerable: true,
		writable: false
	});
	Object.defineProperty(this, "days", {
		value: DAYS,
		enumerable: true,
		writable: false
	});
	Object.defineProperty(this, "rows", {
		value: ROWS,
		enumerable: true,
		writable: false
	});
	Object.defineProperty(this, "name", {
		value: MONTH_NAMES[month-1],
		enumerable: true,
		writable: false
	});
}


CalendarMonth.prototype.toString = function() {
	var rows = [];

	/* Output the month and year */
	rows.push(
		this.name
		+ ", "
		+ this.year.toString()
	);

	/* Output the day names */
	rows.push(DAY_NAMES.map(function(d) {
		return d.substring(0, 2);
	}).join(" "));

	/* Output each week */
	this.rows.forEach(function(week) {
		rows.push(week.map(function (day) {
			if (day) {
				return day.toString();
			} else {
				return "--";
			}
		}).join(" "));
	});

	return rows.join("\n");
};


if (window) {
	/* We are in a browser */
	window.CalendarMonth = CalendarMonth;
	window.CalendarDay = CalendarDay;
	window.DAY_NAMES = DAY_NAMES;
	window.MONTH_NAMES = MONTH_NAMES;
} else {
	/* We are in NodeJS */
	module.exports = {
		CalendarMonth: CalendarMonth,
		CalendarDay: CalendarDay,
		DAY_NAMES: DAY_NAMES,
		MONTH_NAMES: MONTH_NAMES
	};
}
