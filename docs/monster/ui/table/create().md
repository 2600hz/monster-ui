# [monster][monster].[ui][ui].[table][table].create()

* [Syntax](#syntax)
* [Parameters](#parameters)
* [Description](#description)
* [Examples](#examples)

### Syntax
```javascript
monster.ui.table.create(name, element, columns[, data, options]);
```

### Parameters
* `name` (mandatory)

 Type: [String][string_literal]

 Reference by which the table created can be accessed, using `monster.ui.table[name]`.

* `element` (mandatory)

 Type: [jQuery object][jquery]

 `table` element where the generated table will be inserted.

* `columns` (mandatory)

 Type: [Array][array_literal]

 A list of objects, on for each column, containing the [parameters][datatable_columns] to customize their behavior and what they will display.

* `data` (optional)

 Type: [Array][array_literal] OR [Object][object_literal]

 Default: `{}`

 List of elements to display in the table.

* `options` (optional)

 Type: [Object][object_literal]

 Default:
 ```javascript
 {
    sDom: '<f>t<ip>',
    sPaginationType: 'full_numbers',
    aaData: data,
    aoColumns: columns,
    oLanguage: {
        sEmptyTable: i18n.empty,
        sProcessing: i18n.processing,
        sInfo: i18n.startEndTotal,
        sLengthMenu: i18n.showEntries,
        sZeroRecords: i18n.zeroRecords,
        sLoadingRecords: i18n.loading,
        sInfoEmpty: i18n.infoEmpty,
        sInfoFiltered: i18n.filtered,
        sSearch: i18n.search,
        oPaginate: {
            sFirst: i18n.first,
            sPrevious: i18n.previous,
            sNext: i18n.next,
            sLast: i18n.last
        }
    }
 }
 ```
 [Options][datatable_reference] to customize the `table` created.

### Description
The `monster.ui.table.create()` method is a wrapper of the [DataTables][datatables] jQuery plug-in's initialize method. It loads custom options to easily build tables with the same look and features for every table created with it.

### Examples
* Initialize a table to display SMTP logs
```javascript
function initSmtpLogsTable(template, data) {
    var self = this,
        target = template.find('#smtp_logs_table'),
        columns = [
            {
                sTitle: self.i18n.active().smtpLogs.columns.status,
                fnRender: function(obj) {
                    var hasError = obj.aData[0],
                        direction = hasError ? 'down' : 'up',
                        color = hasError ? 'red' : 'green',
                        iconClass = 'thumbs-'.concat(direction, ' icon-', color);

                    return '<i class="icon-'+ iconClass + '">';
                }
            },
            {
                sTitle: self.i18n.active().smtpLogs.columns.from
            },
            {
                sTitle: self.i18n.active().smtpLogs.columns.to
            },
            {
                sTitle: self.i18n.active().smtpLogs.columns.date
            },
            {
                sTitle: 'id',
                bVisible: false
            }
        ];

    monster.ui.table.create('smtpLogs', target, columns, data || undefined);
}
```
* Add sorting feature and define column's width to transactions table
```javascript
function initTransactionsTable(template, data) {
    var self = this,
        target = template.find('#transactions_table'),
        columns = [
            {
                'sTitle': self.i18n.active().transactions.columns.date,
                'sWidth': '20%'
            },
            {
                'sTitle': self.i18n.active().transactions.columns.from,
                'sWidth': '20%'
            },
            {
                'sTitle': self.i18n.active().transactions.columns.to,
                'sWidth': '20%'
            },
            {
                'sTitle': self.i18n.active().transactions.columns.account,
                'sWidth': '30%'
            },
            {
                'sTitle': self.i18n.active().transactions.columns.duration,
                'sWidth': '10%'
            },
            {
                'sTitle': 'timestamp',
                'bVisible': false
            }
        ];

    monster.ui.table.create('transactions', target, columns, data || undefined, {
        sDom: '<"table-custom-actions">frtlip',
        aaSorting: [[5, 'desc']],
        bScrollInfinite: true,
        bScrollCollapse: true,
        sScrollY: '300px'
    });
}
```

[monster]: ../../../monster.md
[ui]: ../../ui.md
[table]: ../table.md

[string_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#String_literals
[jquery]: http://api.jquery.com/Types/#jQuery
[array_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Array_literals
[object_literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Values,_variables,_and_literals#Object_literals
[datatable_columns]: http://legacy.datatables.net/usage/columns
[datatable_reference]: http://legacy.datatables.net/ref
[datatables]: http://legacy.datatables.net/release-datatables/examples/basic_init/zero_config.html