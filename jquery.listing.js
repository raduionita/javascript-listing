(function($) {
    if ($ === null) {
        console.error('No jQuery no listing!');
        return;
    }
    
    var isArray = function(variable) {
        return Object.prototype.toString.call(variable) === '[object Array]';
    };
    
    $.fn.listing = function(options) {
        let noop = function() { };
        // defaults
        let defaults = {
            column: {
                type    : 'string', // number, string, date, time, datetime, bool
                field   : null,
                label   : '',
                align   : 'left',
                vertical: 'middle',
                nowrap  : false,
                hidden  : false,
                concat  : null
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
                url    : '/en/list/promotions',
                method : 'GET',
                type   : 'json',
                data   : [],
                page   : 0,
                perpage: 10,
                columns: [],
                actions: [],
                pager  : null, // if #pager use that elem to generate paginator
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
            let $tbody  = $('<tbody>');
            let row;
            let col;
            let r = 0;
            for (let j in data) {
                if (data.hasOwnProperty(j)) {
                    let promo = data[j];
                    row = '<tr class="row_' + j + '">';
                    let c = 0;
                    // fields
                    if(settings.columns.length) { // w/ columns
                        for (let i = 0, l = settings.columns.length; i < l; ++i) {
                            col = settings.columns[i];
                            if (typeof promo[col.field] !== 'undefined') {
                                let value = promo[col.field];
                                let cls = ('col_'+ c +' row_'+ r) + (' '+ col.field) + (' t'+ col.align) + (' v'+ col.vertical) + (col.nowrap?' nowrap':'') + (col.hidden?' hidden':'');
                                row += '<td class="'+ cls +'"><span class="'+ col.field +'">'+ value + (col.concat?col.concat:'') +'</span></td>';
                            }
                            ++c;
                        }
                    } else { // w/o columns
                        for (let i in promo) {
                            if (promo.hasOwnProperty(i)) {
                                let value = promo[i];
                                let cls = ('col_'+ c +' row_'+ r) + (' tleft') + (' vcenter');
                                row += '<td class="'+ cls +'"><span>'+ value +'</span></td>';
                            }
                            ++c;
                        }
                    }
                    // actions
                    if (settings.actions.length) {
                        row += '<td class="col_'+ c +' row_'+ r +' actions tcenter nowrap">';
                        row += '<div class="nowrap relative">';
                        for(let i = 0, l = settings.actions.length; i < l; ++i) {
                            if (isArray(settings.actions[i])) {
                                row += '<div class="btn btn-sm btn-default relative">';
                                row += '<i class="fa fa-ellipsis-h"></i>';
                                row += '<div class="hidden more relative">';
                                for(let k = 0, m = settings.actions[i].length; k < m; ++k) {
                                    let action = settings.actions[i][k];
                                    let id = 'action_'+ i +'_'+ k +'_row_'+ r;
                                    if (action.href) {
                                        let href = typeof action.href === 'function' ? action.href(promo) : action.href;
                                        /* @TODO: if no function or string don't do shit */
                                        /* @TODO: add iframe support */
                                        row += '<a href="'+ href +'" target="'+ action.target +'" class="btn btn-sm btn-default" id="'+ id +'">';
                                    } else {
                                        row += '<div class="btn btn-sm btn-default" id="'+ id +'">';
                                        $table.on('click', '#'+ id, function() { return action.onClick(promo); });
                                    }
                                    if (action.icon/* @TODO:  && is string */) {
                                        row += '<i class="'+ action.icon +'"></i>';
                                    }
                                    if (action.label) {
                                        row += '<span class="label">'+ action.label +'</span>';
                                    }
                                    if (action.href) {
                                        row += '</a>';
                                    } else {
                                        row += '</div>';
                                    }
                                }
                                row += '</div>';
                                row += '</div>';
                            } else {
                                let action = settings.actions[i];
                                let id = 'action_'+ i +'_row_'+ r;
                                if (action.href) {
                                    let href = typeof action.href === 'function' ? action.href(promo) : action.href;
                                    /* @TODO: if no function or string don't do shit */
                                    /* @TODO: add iframe support */
                                    row += '<a href="'+ href +'" target="'+ action.target +'" class="btn btn-sm btn-default" id="'+ id +'">';
                                } else {
                                    row += '<div class="btn btn-sm btn-default" id="'+ id +'">';
                                    $table.on('click', '#'+ id, function() { return action.onClick(promo); });
                                }
                                if (action.icon/* @TODO: && is string */) {
                                    row += '<i class="'+ action.icon +'"></i>';
                                }
                                if (action.label) {
                                    row += '<span class="label">'+ action.label +'</span>';
                                }
                                if (action.href) {
                                    row += '</a>';
                                } else {
                                    row += '</div>';
                                }
                            }
                        }
                        row += '</div>';
                        row += '</td>';
                    }
                    row += '</tr>';
                    $tbody.append(row);
                    ++r;
                }
            }
            
            $table.append($tbody);
            
            settings.onComplete.call(this);
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
            let $table = $(this);
        };
        // table + data request
        return this.each(function() {
            // clear data
            var self = this;
            $(self).html('');
            // populate thead
            if (settings.columns.length) {
                buildHead.call(self);
            }
            // populate tbody
            if(settings.type != 'local') {
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
            } else if (settings.data.length) {
                buildBody.call(self, settings.data);
            }
            // populate tfoot | pagination
            if (settings.pager != false) {
                // buildFoot()
                // if pager == null || {} 
                    // use tfoot 
                // else if string use 
                    // #pager
            }
        });
    };
})(jQuery || null);
