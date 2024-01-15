/**
 * Simple DOM wrapper library.
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

/**
 * DOM node wrapper.  Base abstract class.
 */
function BaseDOMNode(node) {
	Object.defineProperty(this, "node", {
		value: node,
		enumerable: false,
		writable: false
	});
}


BaseDOMNode.getRawNode = function(node) {
	if (node instanceof Node) {
		return node;
	} else if (node instanceof BaseDOMNode) {
		return node.node;
	} else if (node != null) {
		/* Shortcut: for insertion of text on-the-fly */
		return document.createTextNode(node.toString());
	} else {
		return document.createTextNode("");
	}
};


BaseDOMNode.prototype.addToParent = function(parent) {
	BaseDOMNode.getRawNode(parent).appendChild(this.node);
	return this;
};


BaseDOMNode.prototype.removeFromParent = function() {
	if (this.node.parentNode) {
		this.node.parentNode.removeChild(this.node);
	}
};


BaseDOMNode.prototype.addCSSClasses = function(names) {
	if (typeof (names) === "string") {
		names = [names];
	}

	for (var i = 0; i < names.length; i++) {
		this.node.classList.add(names[i]);
	}

	return this;
};


BaseDOMNode.prototype.toggleCSSClasses = function(names) {
	if (typeof (names) === "string") {
		names = [names];
	}

	for (var i = 0; i < names.length; i++) {
		this.node.classList.toggle(names[i]);
	}

	return this;
};


BaseDOMNode.prototype.removeCSSClasses = function(names) {
	if (typeof (names) === "string") {
		names = [names];
	}

	for (var i = 0; i < names.length; i++) {
		this.node.classList.remove(names[i]);
	}

	return this;
};


BaseDOMNode.prototype.replaceCSSClass = function(old_class, new_class) {
	this.node.classList.replace(old_class, new_class);

	return this;
};


/**
 * Container DOM node.  This sub-class includes functions for
 * adding and removing children.
 */
function ContainerDOMNode(node, children) {
	BaseDOMNode.call(this, node);

	if (children != null) {
		if (!Array.isArray(children)) {
			children = [children];
		}

		for (var i = 0; i < children.length; i++) {
			this.appendChild(children[i]);
		}
	}
}

Object.setPrototypeOf(ContainerDOMNode.prototype, BaseDOMNode.prototype);


ContainerDOMNode.prototype.appendChild = function(new_child) {
	this.node.appendChild(BaseDOMNode.getRawNode(new_child));
	return this;
};


ContainerDOMNode.prototype.insertBefore = function(new_child, existing_child) {
	this.node.insertBefore(
		BaseDOMNode.getRawNode(new_child),
		BaseDOMNode.getRawNode(existing_child)
	);
	return this;
};


ContainerDOMNode.prototype.replaceNode = function(new_child, old_child) {
	this.node.replaceChild(
		BaseDOMNode.getRawNode(new_child),
		BaseDOMNode.getRawNode(old_child)
	);
	return this;
};


ContainerDOMNode.prototype.removeNode = function(existing_child) {
	this.node.removeChild(
		BaseDOMNode.getRawNode(existing_child)
	);
	return this;
};


ContainerDOMNode.prototype.removeAll = function() {
	/* Clear all body elements */
	while (this.node.children.length > 0) {
		this.node.removeChild(this.node.children[
			this.node.children.length - 1
		]);
	}
	return this;
};


function DivNode(children) {
	ContainerDOMNode.call(this, document.createElement("div"), children);
}

Object.setPrototypeOf(DivNode.prototype, ContainerDOMNode.prototype);


function SpanNode(children) {
	ContainerDOMNode.call(this, document.createElement("span"), children);
}

Object.setPrototypeOf(SpanNode.prototype, ContainerDOMNode.prototype);


function HyperlinkNode(href, target, label) {
	ContainerDOMNode.call(this, document.createElement("a"), label);
	if (href != null) {
		this.node.href = href;
	}
	if (target != null) {
		this.node.target = target;
	}
}

Object.setPrototypeOf(HyperlinkNode.prototype, ContainerDOMNode.prototype);


/**
 * Table maker class.  This class simplifies management of tables.
 */
function TableMaker(headings) {
	/*
	 * BaseDOMNode is used because we don't want the user mucking around
	 * with creating child nodes of the table directly.
	 */
	BaseDOMNode.call(this, document.createElement("table"));

	Object.defineProperty(this, "thead", {
		value: document.createElement("thead"),
		enumerable: false,
		writable: false
	});

	Object.defineProperty(this, "tbody", {
		value: document.createElement("tbody"),
		enumerable: false,
		writable: false
	});

	var heading = document.createElement("tr");
	var headings_by_name = {};
	Object.defineProperty(this, "headings_by_name", {
		value: headings_by_name,
		enumerable: false,
		writable: false
	});
	Object.defineProperty(this, "headings", {
		value: headings.map(function (h) {
			var hdesc = TableMaker._newHeading(h.name, h.label);
			headings_by_name[hdesc.name] = hdesc;
			heading.appendChild(hdesc.th.node);
			return hdesc;
		}),
		enumerable: false,
		writable: false
	});
	Object.defineProperty(this, "rows", {
		value: [],
		enumerable: false,
		writable: false
	});

	this.thead.appendChild(heading);
	this.node.appendChild(this.thead);
	this.node.appendChild(this.tbody);
}

TableMaker._newHeading = function(name, label) {
	var th = (new ContainerDOMNode(document.createElement("th")))
		.appendChild(label);
	return {
		name: name,
		th: th
	};
};

Object.setPrototypeOf(TableMaker.prototype, BaseDOMNode.prototype);

TableMaker.prototype._createRow = function(data) {
	if (!Array.isArray(data)) {
		data = this.headings.map(function(h) {
			return data[h.name];
		});
	}

	var tr = document.createElement("tr");
	var cells = {};
	for (var i = 0; i < this.headings.length; i++) {
		var h = this.headings[i];
		var c = data[i];

		var td = (new ContainerDOMNode(document.createElement("td")))
			.appendChild(c);
		cells[h.name] = td;
		tr.appendChild(td.node);
	}

	return {
		tr: tr,
		cells: cells
	};
};


TableMaker.prototype.appendRow = function(data) {
	var row = this._createRow(data);

	this.tbody.appendChild(row.tr);
	this.rows.push(row);

	return this;
};


TableMaker.prototype.insertBeforeRow = function(data, existing) {
	var row = this._createRow(data);

	this.tbody.insertBefore(row.tr, this.rows[existing].tr);
	this.rows.splice(existing, 0, row);

	return this;
};


TableMaker.prototype.replaceRow = function(data, existing) {
	var row = this._createRow(data);

	this.tbody.replaceChild(row.tr, this.rows[existing].tr);
	this.rows[existing] = row;

	return this;
};


TableMaker.prototype.removeRow = function(existing) {
	var row = this._createRow(data);

	this.tbody.removeChild(this.rows[existing].tr);
	this.rows.splice(existing, 1);

	return this;
};
