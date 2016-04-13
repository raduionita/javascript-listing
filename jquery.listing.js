(function($) {
    if ($ === null) {
        console.error('No jQuery no listing!');
        return;
    }

    var isArray = function(variable) {
        return Object.prototype.toString.call(variable) === '[object Array]';
    };
    var isString = function(variable) {
        return Object.prototype.toString.call(variable) === '[object String]';
    };
    
    if (typeof $.fn.delay === 'undefined') {
        $.fn.delay = function (msecs, callback) {
            msecs    = msecs || 1;
            callback = callback || function () { };
            return this.each(function(i) {
                setTimeout(callback, msecs);
            });
        };
    }
    
    if (typeof $.fn.serializeObject === 'undefined') {
        $.fn.serializeObject = function () {
            let o = {};
            let a = this.serializeArray();
            $.each(a, function() {
                if (o[this.name]) {
                    if (!o[this.name].push) {
                        o[this.name] = [o[this.name]];
                    }
                    o[this.name].push(this.value || '');
                } else {
                    o[this.name] = this.value || '';
                }
            });
            return o;
        };
    }
    
    if (typeof $.fn.listing === 'undefined') {
        $.fn.listing = function (options) {
            let noop = function () {
            };
            // defaults
            let defaults = {
                column: {
                    type: 'string', // number, string, date, time, datetime, bool
                    field: null,
                    label: '',
                    icon: null,
                    align: 'left',
                    vertical: 'middle',
                    nowrap: false,
                    hidden: false,
                    sortable: false,
                    prepend: '',
                    append: ''
                },
                action: {
                    icon   : null,
                    label  : null,
                    href   : null,
                    target : 'top',
                    hidden : false, // bool or function
                    onClick: noop
                },
                pager: {
                    align: 'left',
                    pageopt: [10, 25, 50]
                },
                settings: {
                    url: '/path/to/nowhere',
                    method: 'GET',   // GET | POST
                    type: 'json',  // json | html?
                    data: [],      // [] | function
                    width: '100%',
                    height: null,
                    page: 0,
                    perpage: 10,
                    total: null, // request total number of rows
                    filter: {},
                    columns: [],
                    actions: [],
                    pager: null, // TODO: if #pager use that elem to generate paginator
                    loader: null, // TODO: loading pinner
                    complete: false,
                    onResponse: noop,
                    onComplete: noop,
                    onError: noop,
                    onRow: noop,
                    onCell: noop
                }
            };
            let settings = $.extend(defaults.settings, options);
            for (let i = 0, l = settings.columns.length; i < l; ++i) {
                settings.columns[i] = $.extend({}, defaults.column, settings.columns[i]);
            }
            for (let i = 0, l = settings.actions.length; i < l; ++i) {
                if (isArray(settings.actions[i])) {
                    for (let j = 0, m = settings.actions[i].length; j < m; ++j) {
                        settings.actions[i][j] = $.extend({}, defaults.action, settings.actions[i][j]);
                    }
                } else {
                    settings.actions[i] = $.extend({}, defaults.action, settings.actions[i]);
                }
            }
            // build body
            let buildBody = function () {
                let data = this.settings.data || [];
                let $table = $(this);
                let $tbody = $table.find('tbody');
                if (!$tbody.length) {
                    $tbody = $('<tbody>');
                    $table.append($tbody);
                }
                $tbody.html('');
                let row, col, val, cls;
                let r = 0;
                for (let j = (this.settings.page * this.settings.perpage), l0 = data.length; j < l0 && j < ((this.settings.page + 1) * this.settings.perpage); ++j) {
                    let item = data[j];
                    row = '<tr class="row_' + j + '">';
                    let c = 0;
                    // fields
                    if (settings.columns.length) { // w/ columns
                        for (let i = 0, l1 = settings.columns.length; i < l1; ++i) {
                            col = settings.columns[i];
                            val = typeof item[col.field] !== 'undefined' ? item[col.field] : item[i];
                            cls = ('col_' + c + ' row_' + r) + (' ' + col.field) + (' t' + col.align) + (' v' + col.vertical) + (col.nowrap ? ' nowrap' : '') + (col.hidden ? ' hidden' : '');
                            row += '<td class="' + cls + '"><span class="' + col.field + '">';
                            row += '<span>' + (col.prepend ? col.prepend : '') + val + (col.append ? col.append : '') + '</span>';
                            row += '</td>';
                            ++c;
                        }
                    } else { // w/o columns
                        for (let field in item) {
                            if (item.hasOwnProperty(field)) {
                                val = item[field];
                                cls = ('col_' + c + ' row_' + r) + (' tleft') + (' vcenter');
                                row += '<td class="' + cls + ' ' + field + '"><span class="' + field + '">' + val + '</span></td>';
                            }
                            ++c;
                        }
                    }
                    // actions
                    if (settings.actions.length) {
                        row += '<td class="col_' + c + ' row_' + r + ' actions tcenter nowrap">';
                        row += '<div class="nowrap relative btn-group">';
                        for (let i = 0, l = settings.actions.length; i < l; ++i) {
                            if (isArray(settings.actions[i])) {
                                row += '<a class="btn btn-sm btn-default relative dropdown-toggle" data-toggle="dropdown" title="More actions">';
                                row += '<i class="fa fa-ellipsis-h"></i>';
                                row += '</a>';
                                row += '<ul class="more dropdown-menu dropdown-menu-right">';
                                for (let k = 0, m = settings.actions[i].length; k < m; ++k) {
                                    let action = settings.actions[i][k];
                                    let id = 'action_' + i + '_' + k + '_row_' + r;
                                    /* @TODO: if no function or string don't do shit */
                                    /* @TODO: add iframe support */
                                    let href = action.href;
                                    let target = action.target;
                                    let hidden = typeof action.hidden === 'function' ? action.hidden.call(this, item) : action.hidden;
                                    if (href) {
                                        href = typeof href === 'function' ? href(item) : href;
                                    } else {
                                        $table.on('click', '#' + id, function () { return action.onClick(item); });
                                    }
                                    // li/a
                                    row += '<li class="'+ (hidden?'hidden':'') +'">';
                                    row += '<a class="pointer tright" id="'+id+'" '+(href?'href="'+href+'"':'')+' '+(target?'target="'+target+'"':'') +'>';
                                    // label
                                    if (action.label) {
                                        row += '<span class="">' + action.label + '</span>';
                                    }
                                    // icon
                                    if (action.icon/* @TODO:  && is string */) {
                                        row += '&nbsp;&nbsp;<i class="fa ' + action.icon + '"></i>';
                                    }
                                    // end a/li
                                    row += '</a>';
                                    row += '</li>';
                                }
                                row += '</div>';
                            } else {
                                let action = settings.actions[i];
                                let id = 'action_' + i + '_row_' + r;
                                /* @TODO: if no function or string don't do shit */
                                /* @TODO: add iframe support */
                                let href = action.href; 
                                let target = action.target;
                                let hidden = typeof action.hidden === 'function' ? action.hidden.call(this, item) : action.hidden; 
                                if (href) {
                                    href = typeof href === 'function' ? href(item) : href;
                                } else {
                                    $table.on('click', '#' + id, function () { return action.onClick(item); });
                                }
                                // a
                                row += '<a class="pointer btn btn-sm btn-default'+(hidden?' hidden':'')+'" id="'+id+'" '+(href?'href="'+href+'"':'')+' '+(target?'target="'+target+'"':'') +'>';
                                // icon
                                if (action.icon/* @TODO: && is string */) {
                                    row += '<i class="fa ' + action.icon + '"></i>';
                                }
                                // label
                                if (action.label) {
                                    row += '<span class="">' + action.label + '</span>';
                                }
                                // end <a>
                                row += '</a>';
                            }
                        }
                        row += '</div>';
                        row += '</td>';
                    }
                    row += '</tr>';
                    let $row = $(row);
                    $tbody.append($row);
                    this.settings.onRow.call($row[0], item);
                    ++r;
                }

                $table.trigger('listing:complete');
            };
            // build head
            let buildHead = function () {
                let self = this;
                let $table = $(self);
                let $thead = $table.find('thead');
                if (!$thead.length) {
                    $thead = $('<thead>');
                    $table.append($thead);
                }
                let row = '';
                // TODO: checkbox column
                //...?
                // columns
                for (var i = 0, l = settings.columns.length; i < l; ++i) {
                    let col = settings.columns[i];
                    let cls = ('col_' + i) + (' ' + col.field) + (' t' + col.align) + (' v' + col.vertical) + (col.nowrap ? ' nowrap' : '') + (col.hidden ? ' hidden' : '') + (col.sortable ? ' sortable pointer' : '');
                    row += '<th data-field="' + col.field + '" class="' + cls + ' relative">';
                    row += '<span>' + col.label + '</span>';
                    if (col.sortable) {
                        row += '&nbsp;&nbsp;&nbsp;<span class="absolute" style="right:4px;"><i class="fa fa-sort sort-icon" style="opacity:0.8"></i></span>';
                    }
                    row += '</th>';
                }
                // action
                if (settings.actions.length) {
                    row += '<th data-field="actions" class="actions"><span>&nbsp;</span></th>';
                }
                // sort: bind click event 
                $thead.on('click', '.sortable', function (evt) {
                    evt.preventDefault();
                    if (self.settings.complete) {
                        var $this = $(this);
                        let $icon = $this.find('.sort-icon');
                        let dir = $icon.hasClass('fa-sort') || $icon.hasClass('fa-sort-asc') ? 'desc' : 'asc';
                        // icons
                        $thead.find('.sort-icon').removeClass('fa-sort-asc fa-sort-desc').addClass('fa-sort');
                        $icon.removeClass('fa-sort').addClass('fa-sort-' + dir);
                        let field = $this.data('field');
                        // sorting
                        // TODO: replace with a better algorithm(merge, quicksort)
                        if (field) {
                            for (let i = 0, l = self.settings.data.length; i < l; ++i) {
                                if (self.settings.data[i].hasOwnProperty(field)) {
                                    for (let j = i + 1; j < l; ++j) {
                                        if (self.settings.data[j].hasOwnProperty(field)) {
                                            if (dir === 'desc' && self.settings.data[i][field] <= self.settings.data[j][field]) { // desc
                                                // swap
                                                let t = self.settings.data[j];
                                                self.settings.data[j] = self.settings.data[i]; // ex-b
                                                self.settings.data[i] = t;                     // ex-a
                                            } else if (dir === 'asc' && self.settings.data[i][field] > self.settings.data[j][field]) {             // asc
                                                let t = self.settings.data[j];
                                                self.settings.data[j] = self.settings.data[i]; // ex-b
                                                self.settings.data[i] = t;                     // ex-a
                                            }
                                        }
                                    }
                                }
                            }
                            $table.trigger('listing:refresh');
                        }
                    }
                });
                // write
                $thead.append('<tr class="row_0">' + row + '</tr>');
            };
            // buildFoot
            let buildFoot = function () {
                let self = this;
                let $table = $(self);
                // pager
                let $pager = $('<div id="pager">');
                let pager = $.extend({}, defaults.pager, self.settings.pager);
                let row;
                row =  '<div id="reload" class="pull-left btn btn-sm btn-default"><i class="fa fa-refresh"></i></div>';
                row += '<div class="pager inline">';
                row +=     '<a id="pageleft" class="btn btn-sm btn-default" title="Previous page"><i class="fa fa-caret-left fa-lg "></i></a>';
                row +=     '&nbsp;&nbsp;<span id="pages" class="box10px inline">' + (self.settings.page + 1) + '</span>&nbsp;&nbsp;';
                row +=     '<a id="pageright" class="btn btn-sm btn-default" title="Next page"><i class="fa fa-caret-right fa-lg"></i></a>';
                row += '</div>';
                row += '<div class="btn-group relative pull-right dropup" title="Items per page">';
                row +=     '<a id="perpage" href="#" class="btn btn-sm btn-default dropdown-toggle" data-toggle="dropdown">' + self.settings.perpage + '</a>';
                row +=     '<ul id="perpageopt" class="dropdown-menu" style="width:100%">';
                for (let i = 0; i < pager.pageopt.length; ++i) {
                    row +=      '<li><a class="novpadding tcenter" href="#">' + pager.pageopt[i] + '</a></li>';
                }
                row +=     '</ul>';
                row += '</div>';
                $pager.append(row);
                // other or table
                if (isString(self.settings.pager)) {
                    // TODO: ... place pager in other places
                    $(self.settings.pager).append($pager);
                } else {
                    let $tfoot = $table.find('tfoot');
                    if (!$tfoot.length) {
                        $tfoot = $('<tfoot>');
                        $table.append($tfoot);
                    }
                    let $tr = $('<tr>');
                    let $td = $('<td class="tcenter" colspan="' + (settings.columns.length + 1) + '">');
                    $td.append($pager);
                    $tr.append($td);
                    $tfoot.append($tr);
                    $table.append($tfoot);
                }

                $pager.on('click', '#perpageopt > li a', function (evt) {
                    if (self.settings.complete === false) {
                        return;
                    }
                    evt.preventDefault();
                    let perpage = parseInt($(this).html());
                    self.settings.perpage = perpage || 10;
                    $('#perpage').html(self.settings.perpage);
                    $table.trigger('listing:refresh');
                }).on('click', '#reload', function (evt) {
                    if (self.settings.complete === false) {
                        return;
                    }
                    $('#pages').html(1);
                    $table.trigger('listing:reload');
                }).on('click', '#pageleft', function (evt) {
                    if (self.settings.complete === false) {
                        return;
                    }
                    self.settings.page = self.settings.page === 0 ? 0 : self.settings.page - 1;
                    $('#pages').html(self.settings.page + 1);
                    $table.trigger('listing:refresh');
                }).on('click', '#pageright', function (evt) {
                    if (self.settings.complete === false) {
                        return;
                    }
                    if (self.settings.data.length < ((self.settings.page + 1) * self.settings.perpage)) {
                        // return; // do nothing
                    } else {
                        self.settings.page += 1;
                        $('#pages').html(self.settings.page + 1);
                        if (self.settings.data.length > self.settings.page * self.settings.perpage) {
                            $table.trigger('listing:refresh');
                        } else {
                            $table.trigger('listing:update');
                        }
                    }
                });
            };
            // table + data request
            return this.each(function (i) {
                // clear data
                var self   = this;
                var $table = $(self);
                self.settings = settings;
                $table.width(self.settings.width).html('');
                // reload
                $table.on('listing:reload', function (evt) {
                    self.settings.page = 0;
                    self.settings.data = [];
                    self.settings.complete = false;
                    $table.find('.sort-icon').removeClass('fa-sort-asc fa-sort-desc').addClass('fa-sort');
                    $table.trigger('listing:update');
                });
                // refresh
                $table.on('listing:refresh', function (evt) {
                    $table.addClass('disabled');
                    $table.find('.fa-refresh').addClass('fa-spin');
                    buildBody.call(self);
                });
                // reset
                $table.on('listing:reset', function (evt) {
                    self.settings.page = 0;
                    self.settings.perpage = settings.perpage; // 10
                    self.settings.data = [];
                    self.settings.complete = false;
                });
                // update
                $table.on('listing:update', function (evt) {
                    // clear stuff
                    $table.addClass('disabled');
                    $table.find('tbody').html('');
                    $table.find('.fa-refresh').addClass('fa-spin');
                    // request
                    if (self.settings.type != 'local' && isString(self.settings.url)) {
                        $.ajax({
                            url: self.settings.url,
                            data: {
                                offset: self.settings.page * self.settings.perpage,                                                          // pageing
                                limit: self.settings.perpage,                                                                               // items per page
                                //order : ['id', 'desc'],                                                                                    // { by: 'id', dir: 'asc'}
                                filter: typeof self.settings.filter === 'function' ? self.settings.filter.call(self) : self.settings.filter, // { id: 10 } { name: 'something' } 
                            },
                            type: self.settings.method,
                            dataType: self.settings.type,
                            success: function (data) {
                                self.settings.data = self.settings.data.concat(data);
                                self.settings.onResponse.call(self);
                                buildBody.call(self);
                            }
                        })
                    } else if (self.settings.data) {
                        if (typeof self.settings.data === 'function') {
                            self.settings.data = self.settings.data.call(self);
                        }
                        buildBody.call(self);
                    }
                });
                // complete
                $table.on('listing:complete', function(evt) {
                    self.settings.onComplete.call(this);
                    self.settings.complete = true;
                    $table.find('.fa-refresh').removeClass('fa-spin');
                    $table.removeClass('disabled');
                });
                // populate thead
                if (self.settings.columns.length) {
                    buildHead.call(self);
                }
                // populate tfoot | pagination
                if (self.settings.pager != false) {
                    buildFoot.call(self);
                }
                // populate tbody
                $table.trigger('listing:update');
            });
        };
    }
})(jQuery || null);
