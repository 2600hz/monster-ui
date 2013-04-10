(function(winkstart, amplify, undefined) {

    winkstart.table = {
        create: function(name, $element, columns, data, options) {
            var THIS = this,
                tableObj,
                default_options = {
                    sDom: '<f>t<ip>',
                    sPaginationType: 'full_numbers',
                    aaData: data || {},
                    aoColumns: columns,
                    bScrollInfinite: true,
                    bScrollCollapse: true,
                    sScrollY: '300px',
                    oLanguage: {
                        sEmptyTable: i18n.t('core.layout.table_empty'),
                        sProcessing: i18n.t('core.layout.table_processing'),
                        sInfo: i18n.t('core.layout.table_showing_start_end'),
                        sLengthMenu: i18n.t('core.layout.table_show_entries'),
                        sZeroRecords: i18n.t('core.layout.table_zero_records'),
                        sLoadingRecords: i18n.t('core.layout.table_loading'),
                        sInfoEmpty: i18n.t('core.layout.table_showing_empty'),
                        sInfoFiltered: i18n.t('core.layout.table_filtered'),
                        oPaginate: {
                            sFirst:    i18n.t('core.layout.table_paginate_first'),
                            sPrevious: i18n.t('core.layout.table_paginate_previous'),
                            sNext:     i18n.t('core.layout.table_paginate_next'),
                            sLast:     i18n.t('core.layout.table_paginate_last')
                        }
                    }
                },
                options = $.extend(true, {}, default_options, options);

            tableObj = $element.dataTable(options);
            tableObj.name = name;

            THIS.applyFunctions(tableObj);
            THIS.applyModifications(tableObj);
            THIS[name] = tableObj;
        },

        applyFunctions: function(table) {
            table.addData = function(data) {
                var THIS = this;

                THIS.fnAddData(data);
            };

            table.destroy = function() {
                var THIS = this;

                THIS.fnDestroy();

                eval('winkstart.table.' + THIS.name + ' = null;');
            };
        },

        applyModifications: function(table) {
            var search_wrapper = table.parents('.dataTables_wrapper').find('.dataTables_filter');
            var search = search_wrapper.find('input[type="text"]');
            var search = search_wrapper.find('input[type="text"]');
            var btn_search = '';//<input class="submit-search" type="image" src="img/search_left.png">';
            var btn_cancel = '';//<input class="cancel-search" type="image" src="img/search_right.png">';

            search_wrapper.contents().filter(function() {
                return this.nodeType == Node.TEXT_NODE;
            }).remove();

            // This is backwards because of the float right
            search.before(btn_cancel);
            search.after(btn_search);
        }
    };

})(	window.winkstart = window.winkstart || {}, window.amplify = window.amplify || {});
