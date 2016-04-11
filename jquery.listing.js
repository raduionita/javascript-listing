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
    
    $.fn.listing = function(options) {
        let noop = function() { };
        // defaults
        let defaults = {
            column: {
                type    : 'string', // number, string, date, time, datetime, bool
                field   : null,
                label   : '',
                icon    : null,
                align   : 'left',
                vertical: 'middle',
                nowrap  : false,
                hidden  : false,
                prepend : '',
                append  : ''
            },
            action: {
                icon   : null,
                label  : null,
                href   : null,
                target : 'top',
                onClick: noop
            },
            pager : {
                align: 'left'
            },
            settings: {
                url    : '/path/to/nowhere',
                method : 'GET',   // GET | POST
                type   : 'json',  // json | html?
                data   : null,    // [] | function
                width  : '100%',
                height : null,
                page   : 0,
                perpage: 10,
                total  : null, // request total number of rows
                columns: [],
                actions: [],
                pager  : null, // TODO: if #pager use that elem to generate paginator
                loader : null, // TODO: loading pinner
                onResponse: noop,
                onComplete: noop,
                onError   : noop,
                onRow     : noop,
                onCell    : noop
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
        let buildBody = function(data) {
            let $table = $(this);
            let $tbody = $('<tbody>');
            let row, col, val, cls;
            let r = 0;
            for (let j = 0, l0 = data.length; j < l0; ++j) {
                let item = data[j];
                row = '<tr class="row_' + j + '">';
                let c = 0;
                // fields
                if (settings.columns.length) { // w/ columns
                    for (let i = 0, l1 = settings.columns.length; i < l1; ++i) {
                        col  = settings.columns[i];
                        val  = typeof item[col.field] !== 'undefined' ? item[col.field] : item[i];
                        cls  = ('col_'+ c +' row_'+ r) + (' '+ col.field) + (' t'+ col.align) + (' v'+ col.vertical) + (col.nowrap?' nowrap':'') + (col.hidden?' hidden':'');
                        row += '<td class="'+ cls +'"><span class="'+ col.field +'">'+ (col.prepend?col.prepend:'') + val + (col.append?col.append:'') +'</span></td>';
                        ++c;
                    }
                } else { // w/o columns
                    for (let field in item) {
                        if (item.hasOwnProperty(field)) {
                            val  = item[field];
                            cls  = ('col_'+ c +' row_'+ r) + (' tleft') + (' vcenter');
                            row += '<td class="'+ cls +' '+ field +'"><span class="'+ field +'">'+ val +'</span></td>';
                        }
                        ++c;
                    }
                }
                // actions
                if (settings.actions.length) {
                    row += '<td class="col_'+ c +' row_'+ r +' actions tcenter nowrap">';
                    row += '<div class="nowrap relative btn-group">';
                    for (let i = 0, l = settings.actions.length; i < l; ++i) {
                        if (isArray(settings.actions[i])) {
                            row += '<a href="#" class="btn btn-sm btn-default relative dropdown-toggle" data-toggle="dropdown" title="More actions">';
                            row +=     '<i class="fa fa-ellipsis-h"></i>';
                            row += '</a>';
                            row += '<ul class="more relative dropdown-menu dropdown-menu-right">';
                            for(let k = 0, m = settings.actions[i].length; k < m; ++k) {
                                let action = settings.actions[i][k];
                                let id = 'action_'+ i +'_'+ k +'_row_'+ r;
                                row += '<li>';
                                if (action.href) {
                                    let href = typeof action.href === 'function' ? action.href(item) : action.href;
                                    /* @TODO: if no function or string don't do shit */
                                    /* @TODO: add iframe support */
                                    row += '<a href="'+ href +'" target="'+ action.target +'" class="tright" id="'+ id +'">';
                                } else {
                                    row += '<a href="#" class="tright" id="'+ id +'">';
                                    $table.on('click', '#'+ id, function() { return action.onClick(item); });
                                }
                                // label
                                if (action.label) {
                                    row += '<span class="">'+ action.label +'</span>';
                                }
                                // icon
                                if (action.icon/* @TODO:  && is string */) {
                                    row += '<i class="fa '+ action.icon +'"></i>';
                                }
                                // end a/li
                                row += '</a>';
                                row += '</li>';
                            }
                            row += '</div>';
                        } else {
                            let action = settings.actions[i];
                            let id = 'action_'+ i +'_row_'+ r;
                            if (action.href) {
                                let href = typeof action.href === 'function' ? action.href(item) : action.href;
                                /* @TODO: if no function or string don't do shit */
                                /* @TODO: add iframe support */
                                row += '<a href="'+ href +'" target="'+ action.target +'" class="btn btn-sm btn-default" id="'+ id +'">';
                            } else {
                                row += '<a href="#" class="btn btn-sm btn-default" id="'+ id +'">';
                                $table.on('click', '#'+ id, function() { return action.onClick(item); });
                            }
                            if (action.icon/* @TODO: && is string */) {
                                row += '<i class="fa '+ action.icon +'"></i>';
                            }
                            if (action.label) {
                                row += '<span class="">'+ action.label +'</span>';
                            }
                            
                            row += '</a>';
                        }
                    }
                    row += '</div>';
                    row += '</td>';
                }
                row += '</tr>';
                $tbody.append(row);
                ++r;
            }
            
            $table.append($tbody);
            
            settings.onComplete.call(this);
            this.settings.completed = true;
        };
        // build head
        let buildHead = function() {
            let $table = $(this);
            let row = '';
            
            for (var i = 0, l = settings.columns.length; i < l; ++i) {
                let col = settings.columns[i];
                let cls = ('col_'+ i) + (' '+ col.field) + (' t'+ col.align) + (' v'+ col.vertical) + (col.nowrap?' nowrap':'') + (col.hidden ?' hidden':'');
                row += '<th data-field="'+ col.field +'" class="'+ cls +'"><span>'+ col.label +'</span></th>';
            }
            
            if (settings.actions.length) {
                row += '<th data-field="actions" class="actions"><span>&nbsp;</span></th>';
            }
            
            $table.append('<thead><tr class="row_0">'+ row +'</tr></thead>');
        };
        // buildFoot
        let buildFoot = function() {
            let self = this;
            let $table = $(self);
            let stop = setInterval(function() {
                if (self.settings.completed) {
                    clearInterval(stop);
                    // build pager
                    let $tfoot = $('<tfoot>');
                    
                    
                    if (isString(self.settings.pager)) {
                        
                        
                    } else {
                        let pager = $.extend({}, defaults.pager, self.settings.pager);
                        console.log(pager);
                        let row;
                        
                        row  = '<tr><td class="tcenter" colspan="'+ (settings.columns.length + 1) +'">';
                        row +=     '<div class="pager inline">';
                        row +=         '<a class="btn btn-sm btn-default"><i class="fa fa-caret-left fa-lg "></i></a>'; 
                        row +=         '&nbsp;&nbsp;<span class="box10px inline">'+ (self.settings.page + 1) +'</span>&nbsp;&nbsp;';
                        row +=         '<a class="btn btn-sm btn-default"><i class="fa fa-caret-right fa-lg"></i></a>';
                        row +=     '</div>';
                        row += '</td></tr>';
                        
                        $tfoot.append(row);
                        $table.append($tfoot);
                    }
                    
                }
            }, 500);
        };
        // table + data request
        return this.each(function(i) {
            // clear data
            var self = this;
            self.settings = settings;
            self.settings.completed = false;
            $(self).width(settings.width).html('');
            // populate thead
            if (settings.columns.length) {
                buildHead.call(self);
            }
            // populate tbody
            if(settings.type != 'local' && isString(settings.url)) {
                $.ajax({
                    url     : settings.url,
                    data    : {
                        offset: 0,
                        limit : settings.perpage
                    },
                    type    : settings.method,
                    dataType: settings.type,
                    success : function(data) {
                        settings.onResponse.call(self, data);
                        buildBody.call(self, data);
                    }
                })
            } else if (settings.data) {
                if (typeof settings.data === 'function')
                  buildBody.call(self, settings.data.call(self));
                else
                  buildBody.call(self, settings.data);
            }
            // populate tfoot | pagination
            if (settings.pager != false) {
                buildFoot.call(self);
            }
        });
    };
})(jQuery || null);
