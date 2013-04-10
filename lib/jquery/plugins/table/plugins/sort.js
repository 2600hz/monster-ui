jQuery.extend( jQuery.fn.dataTableExt.oSort, {
    "currency-asc": function ( a, b ) {
        return parseFloat(a.substring(1)) - parseFloat(b.substring(1));
    },

    "currency-desc": function ( a, b ) {
        return parseFloat(b.substring(1)) - parseFloat(a.substring(1));
    }
} );
