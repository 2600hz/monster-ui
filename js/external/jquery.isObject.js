(function(jQuery){

    var toString = Object.prototype.toString,
        hasOwnProp = Object.prototype.hasOwnProperty;

    jQuery.isObject = function( obj ) {
        if ( toString.call(obj) !== "[object Object]" )
            return false;
        
        //own properties are iterated firstly,
        //so to speed up, we can test last one if it is not own
            
        var key;
        for ( key in obj ) {}
        
        return !key || hasOwnProp.call( obj, key );
    }

})(jQuery);